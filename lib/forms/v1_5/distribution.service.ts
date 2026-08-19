import 'server-only'

import {
  createDistributionDoc,
  getDistributionDoc,
  getDistributionByCodeDoc,
  listDistributionsDoc,
  updateDistributionDoc,
  pauseDistributionDoc,
  archiveDistributionDoc,
  deleteDistributionDoc,
} from '@/lib/firebase/repositories/v1_5/distributions.repo'
import { safeGetDoc, safeGetCollectionDocs } from '@/lib/firebase/repositories/v1_5/safeFirestore'
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

import { randomInt, randomBytes } from 'crypto'

/**
 * Global Role Scope Boundary Check
 */
function isGlobalRole(role: string): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'internal_bpom'
}

/**
 * Generates an opaque, human-friendly, collision-resistant code (e.g. KKPD7X9).
 */
async function generateUniqueDistributionCode(): Promise<string> {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ' // Avoid ambiguous O, 0, I, 1
  let attempts = 0

  while (attempts < 20) {
    let code = 'KKPD'
    for (let i = 0; i < 3; i++) {
      code += chars.charAt(randomInt(0, chars.length))
    }

    const existing = await getDistributionByCodeDoc(code)
    if (!existing) return code
    attempts++
  }

  // Cryptographically secure fallback
  const hex = randomBytes(2).toString('hex').toUpperCase()
  return `KPD${hex}`
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
  let dist = await getDistributionByCodeDoc(normalized)

  if (!dist) {
    // Direct Form ID / Legacy Form Code fallback
    try {
      const formAgg = await getFormAggregateFromDb(distributionCode)
      if (formAgg) {
        dist = {
          distributionId: `dist_direct_${formAgg.formId}`,
          formId: formAgg.formId,
          code: normalized,
          normalizedCode: normalized,
          title: formAgg.metadata?.title || (formAgg as any).title || 'Formulir Penilaian Kebersihan & Keamanan Pangan',
          description: formAgg.metadata?.description || (formAgg as any).description || '',
          ownerType: 'admin',
          ownerId: formAgg.createdBy || 'bpom_admin',
          ownerName: 'Administrator BPOM',
          versionMode: 'active',
          status: 'active',
          createdAt: formAgg.createdAt || new Date().toISOString(),
          createdBy: formAgg.createdBy || 'system',
          updatedAt: formAgg.updatedAt || new Date().toISOString(),
          updatedBy: 'system',
        }
      }
    } catch (e) {
      console.warn('Fallback direct form lookup failed:', e)
    }
  }

  if (!dist) {
    throw new Error(`Formulir atau kode distribusi "${distributionCode}" tidak ditemukan di Firestore. Pastikan kode yang Anda masukkan benar.`)
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

    if (!snapshot) {
      throw new Error('Versi snapshot yang disematkan tidak ditemukan di Firestore.')
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
    // Active version read: 1 aggregate document read from Firestore
    const aggregate = await getFormAggregateFromDb(dist.formId)
    if (!aggregate) {
      throw new Error(`Formulir resmi dengan ID "${dist.formId}" tidak ditemukan di Firestore.`)
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
 * Helper to verify server-side document ownership / hierarchy scope.
 */
async function verifyDistributionAccess(
  existing: DistributionDoc,
  authContext: AuthorizationContext
): Promise<void> {
  if (isGlobalRole(authContext.role)) return

  let userPartnershipId = ''
  try {
    const userDoc = await safeGetDoc('users', authContext.uid)
    if (userDoc?.data) {
      userPartnershipId = userDoc.data.partnershipId || ''
    }
  } catch (e) {
    console.warn('Could not resolve user partnership ID for permission verification:', e)
  }

  if (authContext.role === 'partnership') {
    const isOwnDoc = existing.createdBy === authContext.uid || existing.ownerId === authContext.uid
    const isSubordinateCadreDoc = existing.partnershipId === authContext.uid || (Boolean(userPartnershipId) && existing.partnershipId === userPartnershipId)
    if (isOwnDoc || isSubordinateCadreDoc) return
    throw new Error('Otorisasi Ditolak: Anda tidak memiliki izin untuk mengelola distribusi milik mitra lain.')
  }

  if (authContext.role === 'cadre') {
    const isOwnDoc = existing.createdBy === authContext.uid || existing.ownerId === authContext.uid
    if (isOwnDoc) return
    throw new Error('Otorisasi Ditolak: Kader hanya dapat mengelola kode distribusi yang dibuat oleh diri sendiri.')
  }

  throw new Error('Otorisasi Ditolak: Peran pengguna Anda tidak memiliki akses ke distribusi ini.')
}

/**
 * CREATE DISTRIBUTION WORKFLOW:
 * Enforces role access, form distribution permission, and server session verification.
 */
export async function createDistributionWorkflow(
  params: CreateDistributionParams,
  authContext: AuthorizationContext
): Promise<DistributionDoc> {
  const formAggregate = await getFormAggregateFromDb(params.formId)
  if (!formAggregate) {
    throw new Error(`Formulir dengan ID "${params.formId}" tidak ditemukan.`)
  }

  const isPublished = formAggregate.status === 'published' || formAggregate.metadata?.status === 'published'
  if (!isPublished) {
    throw new Error(`Formulir "${formAggregate.metadata?.title || params.formId}" belum diterbitkan (masih berstatus draft) sehingga tidak dapat didistribusikan.`)
  }

  const isGlobal = isGlobalRole(authContext.role)

  // Non-global roles (cadre / partnership) MUST respect allowCadreDistribution on form
  if (!isGlobal) {
    if (formAggregate.allowCadreDistribution !== true && formAggregate.metadata?.allowCadreDistribution !== true) {
      throw new Error('Formulir ini belum diizinkan oleh BPOM Pusat untuk didistribusikan oleh Kader/Mitra. Akses terbatas khusus Admin/Internal BPOM.')
    }
  }

  const code = await generateUniqueDistributionCode()
  const normalizedCode = code.toUpperCase()
  const distributionId = `dist_${normalizedCode.toLowerCase()}`
  const now = new Date().toISOString()

  // Resolve creator's user profile strictly from Firestore
  let creatorProfile: any = null
  let userPartnershipId = ''
  try {
    const userDoc = await safeGetDoc('users', authContext.uid)
    if (userDoc?.data) {
      creatorProfile = userDoc.data
      userPartnershipId = creatorProfile.partnershipId || ''
    }
  } catch (e) {
    console.warn('Could not resolve user profile for distribution owner:', e)
  }

  const creatorRole = creatorProfile?.role || authContext.role || 'cadre'

  let ownerType: 'admin' | 'cadre' | 'partnership' = 'cadre'
  if (creatorRole === 'partnership') {
    ownerType = 'partnership'
  } else if (creatorRole === 'cadre') {
    ownerType = 'cadre'
  } else if (params.ownerType) {
    ownerType = params.ownerType
  } else {
    ownerType = 'admin'
  }

  let ownerId = authContext.uid
  let ownerName = creatorProfile?.displayName || creatorProfile?.name || authContext.token.name || authContext.token.email?.split('@')[0] || 'Kader Lapangan'

  // If Admin is target-assigning distribution to a specific user (Cadre or Mitra)
  if (params.targetUserId && params.targetUserId !== authContext.uid) {
    if (!isGlobal) {
      throw new Error('Anda tidak memiliki hak otorisasi untuk melakukan target assignment ke pengguna lain.')
    }
    ownerId = params.targetUserId
    try {
      const targetDoc = await safeGetDoc('users', ownerId)
      if (targetDoc?.data) {
        ownerName = targetDoc.data.displayName || targetDoc.data.name || params.targetUserName || ownerName
        const targetRole = targetDoc.data.role
        if (targetRole === 'partnership') ownerType = 'partnership'
        else if (targetRole === 'cadre') ownerType = 'cadre'
        else ownerType = 'admin'
        if (targetDoc.data.partnershipId) userPartnershipId = targetDoc.data.partnershipId
      } else if (params.targetUserName) {
        ownerName = params.targetUserName
      }
    } catch (e) {
      if (params.targetUserName) ownerName = params.targetUserName
    }
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
    partnershipId: userPartnershipId || params.partnershipId || '',
    createdByRole: authContext.role,
    versionMode: params.versionMode || 'active',
    pinnedVersionId: params.versionMode === 'pinned' ? (params.pinnedVersionId || '') : '',
    status: 'active',
    expiresAt: params.expiresAt || '',
    createdAt: now,
    createdBy: authContext.uid,
    updatedAt: now,
    updatedBy: authContext.uid,
  }

  return await createDistributionDoc(newDist)
}

/**
 * LIST DISTRIBUTIONS WORKFLOW:
 * Scopes data according to current user role and partnership hierarchy.
 */
export async function listDistributionsWorkflow(
  authContext: AuthorizationContext,
  options?: { status?: string; search?: string; formId?: string }
): Promise<DistributionDoc[]> {
  const allDocs = await listDistributionsDoc(options)

  if (isGlobalRole(authContext.role)) {
    return allDocs
  }

  // Resolve user profile for partnership context
  let userPartnershipId = ''
  try {
    const userDoc = await safeGetDoc('users', authContext.uid)
    if (userDoc?.data) {
      userPartnershipId = userDoc.data.partnershipId || ''
    }
  } catch (e) {
    console.warn('Could not resolve user partnership ID:', e)
  }

  if (authContext.role === 'partnership') {
    let partnershipOrg = ''
    try {
      const userDoc = await safeGetDoc('users', authContext.uid)
      if (userDoc?.data) {
        partnershipOrg = (userDoc.data.organization || userDoc.data.displayName || '').toLowerCase().trim()
      }
    } catch (e) {
      console.warn('Could not resolve user partnership data:', e)
    }

    return allDocs.filter((d) => {
      const isOwnDoc = d.createdBy === authContext.uid || d.ownerId === authContext.uid
      const isSubordinateCadreDoc = d.partnershipId === authContext.uid || (Boolean(userPartnershipId) && d.partnershipId === userPartnershipId)
      const isOrgMatch = Boolean(partnershipOrg) && (
        (d.ownerName && d.ownerName.toLowerCase().trim() === partnershipOrg) ||
        ((d as any).organization && (d as any).organization.toLowerCase().trim() === partnershipOrg) ||
        ((d as any).partnershipName && (d as any).partnershipName.toLowerCase().trim() === partnershipOrg)
      )
      return isOwnDoc || isSubordinateCadreDoc || isOrgMatch
    })
  }

  // Cadre Scope: Only own created distribution codes
  return allDocs.filter((d) => d.createdBy === authContext.uid || d.ownerId === authContext.uid)
}

/**
 * UPDATE DISTRIBUTION WORKFLOW:
 * Server-enforced ownership & hierarchy check.
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

  await verifyDistributionAccess(existing, authContext)

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

  await verifyDistributionAccess(existing, authContext)

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

  await verifyDistributionAccess(existing, authContext)

  return await archiveDistributionDoc(distributionId, authContext.uid)
}

/**
 * DELETE DISTRIBUTION WORKFLOW.
 */
export async function deleteDistributionWorkflow(
  distributionId: string,
  authContext: AuthorizationContext
): Promise<{ success: boolean; message: string }> {
  const existing = await getDistributionDoc(distributionId)
  if (!existing) {
    throw new Error(`Distribusi dengan ID "${distributionId}" tidak ditemukan.`)
  }

  await verifyDistributionAccess(existing, authContext)

  await deleteDistributionDoc(distributionId)
  return { success: true, message: `Kode distribusi "${distributionId}" berhasil dihapus.` }
}
