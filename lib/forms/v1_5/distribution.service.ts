import 'server-only'

import {
  createDistributionDoc,
  getDistributionDoc,
  getDistributionByCodeDoc,
  listDistributionsDoc,
  updateDistributionDoc,
  pauseDistributionDoc,
  archiveDistributionDoc,
} from '@/lib/firebase/repositories/v1_5/distributions.repo'
import { checkFormAccessDoc } from '@/lib/firebase/repositories/v1_5/formAccess.repo'
import {
  getFormAggregateFromDb,
  getFormVersionSnapshotsFromDb,
} from '@/lib/firebase/repositories/v1_5/v1_5Forms.repo'
import { toPublicFormProjection } from '@/lib/forms/v1_5/legacyAdapter'
import type { AuthorizationContext } from '@/lib/auth/server'
import type {
  DistributionDoc,
  PublicDistributionDTO,
  CreateDistributionParams,
  UpdateDistributionParams,
} from '@/lib/forms/v1_5/distributionTypes'

/**
 * Generates an opaque, human-friendly, collision-resistant code (e.g. KKPD7X9).
 */
async function generateUniqueDistributionCode(): Promise<string> {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ' // Avoid ambiguous O, 0, I, 1
  let attempts = 0

  while (attempts < 10) {
    let code = 'KKPD'
    for (let i = 0; i < 3; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const existing = await getDistributionByCodeDoc(code)
    if (!existing) return code
    attempts++
  }

  // Fallback random code
  return `KPD${Math.random().toString(36).substring(2, 6).toUpperCase()}`
}

/**
 * PUBLIC RESOLUTION WORKFLOW:
 * Resolves a distribution by case-insensitive code.
 * 
 * 1-READ EFFICIENCY:
 * - Active mode: 1 distribution read + 1 current form aggregate read (forms/{formId})
 * - Pinned mode: 1 distribution read + 1 version snapshot read (forms/{formId}/versions/{versionId})
 */
export async function resolveDistributionWorkflow(
  distributionCode: string
): Promise<PublicDistributionDTO> {
  const normalized = distributionCode.trim().toUpperCase()
  const dist = await getDistributionByCodeDoc(normalized)

  if (!dist) {
    throw new Error(`Kode distribusi "${distributionCode}" tidak ditemukan.`)
  }

  // Dynamic expiration check
  let effectiveStatus = dist.status
  if (dist.expiresAt && new Date() > new Date(dist.expiresAt)) {
    effectiveStatus = 'expired'
  }

  if (effectiveStatus !== 'active') {
    if (effectiveStatus === 'paused') {
      throw new Error('Formulir ini sedang dijeda sementara oleh penyelenggara.')
    }
    if (effectiveStatus === 'expired') {
      throw new Error('Masa berlaku tautan distribusi formulir ini telah berakhir.')
    }
    throw new Error('Formulir ini tidak tersedia untuk diakses publik.')
  }

  // Version Resolution Mode
  let resolvedVersionId = dist.pinnedVersionId || ''
  let resolvedVersionNumber = 1
  let canonicalForm: any

  if (dist.versionMode === 'pinned' && dist.pinnedVersionId) {
    // Pinned version read: 1 snapshot read
    const snapshots = await getFormVersionSnapshotsFromDb(dist.formId)
    const snapshot = snapshots.find((s) => s.versionId === dist.pinnedVersionId)

    if (!snapshot || snapshot.status !== 'published') {
      throw new Error('Versi snapshot yang disematkan tidak ditemukan atau belum dipublikasikan.')
    }

    resolvedVersionId = snapshot.versionId
    resolvedVersionNumber = snapshot.versionNumber
    canonicalForm = {
      form: {
        formId: snapshot.formId,
        metadata: snapshot.metadata,
        activeVersionId: snapshot.versionId,
        createdAt: snapshot.createdAt,
        updatedAt: snapshot.createdAt,
      },
      version: {
        versionId: snapshot.versionId,
        formId: snapshot.formId,
        versionNumber: snapshot.versionNumber,
        status: snapshot.status,
        questions: snapshot.questions,
        scoring: snapshot.scoring,
        validation: snapshot.validation,
        createdAt: snapshot.createdAt,
      },
    }
  } else {
    // Active version read: 1 aggregate document read
    const aggregate = await getFormAggregateFromDb(dist.formId)
    if (!aggregate || aggregate.status !== 'published') {
      throw new Error('Formulir resmi ini belum dipublikasikan secara aktif.')
    }

    resolvedVersionId = aggregate.activeVersionId
    resolvedVersionNumber = aggregate.activeVersionNumber
    canonicalForm = {
      form: {
        formId: aggregate.formId,
        metadata: aggregate.metadata,
        activeVersionId: aggregate.activeVersionId,
        createdAt: aggregate.createdAt,
        updatedAt: aggregate.updatedAt,
      },
      version: {
        versionId: aggregate.activeVersionId,
        formId: aggregate.formId,
        versionNumber: aggregate.activeVersionNumber,
        status: aggregate.status,
        questions: aggregate.questions,
        scoring: aggregate.scoring,
        validation: aggregate.validation,
        createdAt: aggregate.createdAt,
      },
    }
  }

  // SECURITY BOUNDARY: Strip answer keys & scoring internals using public projection
  const publicFormProjection = toPublicFormProjection(canonicalForm)

  return {
    code: dist.code,
    status: effectiveStatus,
    title: dist.title || canonicalForm.form.metadata.title,
    description: dist.description || canonicalForm.form.metadata.description,
    formId: dist.formId,
    versionMode: dist.versionMode,
    resolvedVersionId,
    resolvedVersionNumber,
    expiresAt: dist.expiresAt,
    ownerName: dist.ownerName,
    form: publicFormProjection,
  }
}

/**
 * CREATE DISTRIBUTION WORKFLOW:
 * Enforces role access and server session verification.
 */
export async function createDistributionWorkflow(
  params: CreateDistributionParams,
  authContext: AuthorizationContext
): Promise<DistributionDoc> {
  const formAggregate = await getFormAggregateFromDb(params.formId)
  if (!formAggregate) {
    throw new Error(`Formulir dengan ID "${params.formId}" tidak ditemukan.`)
  }

  const isAdmin = authContext.role === 'admin' || authContext.role === 'super_admin'

  // Non-admin roles (cadre / partnership) require explicit form access authorization
  if (!isAdmin) {
    const subjectType = authContext.role === 'partnership' ? 'partnership' : 'cadre'
    const isAuthorized = await checkFormAccessDoc(params.formId, subjectType, authContext.uid)

    if (!isAuthorized) {
      throw new Error('Anda tidak memiliki izin untuk menyebarkan formulir ini.')
    }
  }

  const code = await generateUniqueDistributionCode()
  const normalizedCode = code.toUpperCase()
  const distributionId = `dist_${normalizedCode.toLowerCase()}`
  const now = new Date().toISOString()

  let ownerType = authContext.role === 'partnership' ? 'partnership' : authContext.role === 'cadre' ? 'cadre' : 'admin'
  let ownerId = authContext.uid
  let ownerName = 'Administrator BPOM'

  if (isAdmin && params.ownerType) {
    ownerType = params.ownerType
    ownerId = ownerType === 'partnership' ? (params.partnershipId || params.targetUserId || 'partnership_default') : (params.targetUserId || authContext.uid)
    ownerName = params.targetUserName || (ownerType === 'admin' ? 'Administrator BPOM' : ownerType === 'partnership' ? 'Mitra Terdaftar' : 'Pengguna Terdaftar')
  } else if (!isAdmin) {
    ownerName = authContext.token.name || authContext.token.email || 'Kader Terdaftar'
  }

  const newDist: DistributionDoc = {
    distributionId,
    formId: params.formId,
    code,
    normalizedCode,
    title: params.title?.trim() || formAggregate.metadata.title,
    description: params.description?.trim() || formAggregate.metadata.description || '',
    ownerType: ownerType as any,
    ownerId,
    ownerName,
    versionMode: params.versionMode || 'active',
    pinnedVersionId: params.versionMode === 'pinned' ? params.pinnedVersionId : undefined,
    status: 'active',
    expiresAt: params.expiresAt || undefined,
    createdAt: now,
    createdBy: authContext.uid,
    updatedAt: now,
    updatedBy: authContext.uid,
  }

  return await createDistributionDoc(newDist)
}

/**
 * LIST DISTRIBUTIONS WORKFLOW:
 * Scopes data according to current user role.
 */
export async function listDistributionsWorkflow(
  authContext: AuthorizationContext,
  options?: { status?: string; search?: string; formId?: string }
): Promise<DistributionDoc[]> {
  const isAdmin = authContext.role === 'admin' || authContext.role === 'super_admin'

  if (isAdmin) {
    return await listDistributionsDoc(options)
  }

  // Cadre / Partnership sees only distributions owned by their UID
  return await listDistributionsDoc({
    ...options,
    ownerId: authContext.uid,
  })
}

/**
 * UPDATE DISTRIBUTION WORKFLOW:
 * Server-enforced ownership check.
 */
export async function updateDistributionWorkflow(
  distributionId: string,
  params: UpdateDistributionParams,
  authContext: AuthorizationContext
): Promise<DistributionDoc> {
  const existing = await getDistributionDoc(distributionId)
  if (!existing) {
    throw new Error(`Distribusi dengan ID "${distributionId}" tidak ditemukan.`)
  }

  const isAdmin = authContext.role === 'admin' || authContext.role === 'super_admin'
  if (!isAdmin && existing.ownerId !== authContext.uid) {
    throw new Error('Anda tidak memiliki hak untuk mengubah distribusi ini.')
  }

  return await updateDistributionDoc(distributionId, {
    ...params,
    updatedBy: authContext.uid,
  })
}

/**
 * PAUSE / RESUME DISTRIBUTION WORKFLOW.
 */
export async function pauseDistributionWorkflow(
  distributionId: string,
  authContext: AuthorizationContext
): Promise<DistributionDoc> {
  const existing = await getDistributionDoc(distributionId)
  if (!existing) {
    throw new Error(`Distribusi dengan ID "${distributionId}" tidak ditemukan.`)
  }

  const isAdmin = authContext.role === 'admin' || authContext.role === 'super_admin'
  if (!isAdmin && existing.ownerId !== authContext.uid) {
    throw new Error('Anda tidak memiliki hak untuk mengubah status distribusi ini.')
  }

  return await pauseDistributionDoc(distributionId, authContext.uid)
}

/**
 * ARCHIVE DISTRIBUTION WORKFLOW.
 */
export async function archiveDistributionWorkflow(
  distributionId: string,
  authContext: AuthorizationContext
): Promise<DistributionDoc> {
  const existing = await getDistributionDoc(distributionId)
  if (!existing) {
    throw new Error(`Distribusi dengan ID "${distributionId}" tidak ditemukan.`)
  }

  const isAdmin = authContext.role === 'admin' || authContext.role === 'super_admin'
  if (!isAdmin && existing.ownerId !== authContext.uid) {
    throw new Error('Anda tidak memiliki hak untuk mengarsipkan distribusi ini.')
  }

  return await archiveDistributionDoc(distributionId, authContext.uid)
}
