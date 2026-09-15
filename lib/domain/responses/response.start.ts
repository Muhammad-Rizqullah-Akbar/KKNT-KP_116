import 'server-only'

import { createResponseDoc } from '@/lib/repositories/responses.repo'
import { getDistributionByCodeDoc } from '@/lib/repositories/distributions.repo'
import {
  getFormAggregateFromDb,
  getFormVersionSnapshotsFromDb,
} from '@/lib/repositories/form-versions.repo'
import { toPublicFormProjection } from '@/lib/domain/forms/form-adapter'
import type {
  ResponseDoc,
  PublicResponseSessionDTO,
  StartResponseParams,
} from '@/lib/domain/responses/response-types'

import { randomBytes, randomUUID } from 'crypto'

/**
 * Generates an opaque random token for session locking.
 */
function generateSubmissionToken(): string {
  return `tok_${randomBytes(16).toString('hex')}`
}

/**
 * START RESPONSE WORKFLOW:
 * Public endpoint to start a response session for a distribution code.
 */
export async function startResponseWorkflow(
  params: StartResponseParams
): Promise<PublicResponseSessionDTO> {
  const normalized = params.distributionCode.trim().toUpperCase()
  let dist = await getDistributionByCodeDoc(normalized)

  if (!dist) {
    // Direct Form ID / form code / article code fallback
    const rawCode = params.distributionCode.trim()
    const formAgg = await getFormAggregateFromDb(rawCode)
    if (formAgg) {
      dist = {
        distributionId: `dist_direct_${formAgg.formId}`,
        formId: formAgg.formId,
        code: normalized,
        normalizedCode: normalized,
        title: formAgg.metadata?.title || (formAgg as any).title || 'Formulir Penilaian Kebersihan & Keamanan Pangan',
        description: formAgg.metadata?.description || (formAgg as any).description || '',
        ownerType: 'super_admin',
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
  }

  if (!dist) {
    throw new Error(`Formulir atau kode distribusi "${params.distributionCode}" tidak ditemukan di Firestore. Pastikan kode yang Anda masukkan benar.`)
  }

  // Dynamic expiration check
  if (dist.expiresAt && new Date() > new Date(dist.expiresAt)) {
    throw new Error('Masa berlaku tautan distribusi formulir ini telah berakhir.')
  }

  if (dist.status !== 'active') {
    if (dist.status === 'paused') {
      throw new Error('Formulir ini sedang dijeda sementara oleh penyelenggara.')
    }
    throw new Error('Formulir ini tidak tersedia untuk diakses publik.')
  }

  // Version Resolution
  let resolvedVersionId = dist.pinnedVersionId || ''
  let resolvedVersionNumber = 1
  let formDocument: any

  if (dist.versionMode === 'pinned' && dist.pinnedVersionId) {
    const snapshots = await getFormVersionSnapshotsFromDb(dist.formId)
    const snapshot = snapshots.find((s) => s.versionId === dist.pinnedVersionId)

    if (!snapshot || snapshot.status !== 'published') {
      throw new Error('Versi snapshot yang disematkan tidak ditemukan atau belum dipublikasikan.')
    }

    resolvedVersionId = snapshot.versionId
    resolvedVersionNumber = snapshot.versionNumber
    formDocument = {
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
    const aggregate = await getFormAggregateFromDb(dist.formId)
    if (!aggregate) {
      throw new Error(`Formulir resmi dengan ID "${dist.formId}" tidak ditemukan di Firestore.`)
    }
    if (aggregate.status === 'archived') {
      throw new Error('Formulir ini telah diarsipkan dan tidak menerima respon baru.')
    }

    resolvedVersionId = aggregate.activeVersionId || `v1-${dist.formId}`
    resolvedVersionNumber = aggregate.activeVersionNumber || 1
    formDocument = {
      form: {
        formId: aggregate.formId,
        metadata: aggregate.metadata,
        activeVersionId: resolvedVersionId,
        createdAt: aggregate.createdAt,
        updatedAt: aggregate.updatedAt,
      },
      version: {
        versionId: resolvedVersionId,
        formId: aggregate.formId,
        versionNumber: resolvedVersionNumber,
        status: aggregate.status,
        questions: aggregate.questions || [],
        scoring: aggregate.scoring,
        validation: aggregate.validation,
        createdAt: aggregate.createdAt,
      },
    }
  }

  const responseId = `resp_${randomUUID()}`
  const submissionToken = generateSubmissionToken()
  const now = new Date().toISOString()

  const responseDoc: ResponseDoc = {
    responseId,
    distributionId: dist.distributionId,
    distributionCode: dist.code,
    formId: dist.formId,
    versionId: resolvedVersionId,
    versionNumber: resolvedVersionNumber,
    ownerType: dist.ownerType,
    ownerId: dist.ownerId,
    respondent: params.respondent || {},
    answers: {},
    status: 'in_progress',
    startedAt: now,
    updatedAt: now,
    submissionToken,
  }

  await createResponseDoc(responseDoc)

  // Public projection strips answer keys and scoring internals
  const publicForm = toPublicFormProjection(formDocument)

  return {
    responseId,
    submissionToken,
    distributionCode: dist.code,
    formId: dist.formId,
    versionId: resolvedVersionId,
    versionNumber: resolvedVersionNumber,
    title: dist.title || formDocument.form.metadata.title,
    description: dist.description || formDocument.form.metadata.description,
    ownerName: dist.ownerName,
    form: publicForm,
  }
}
