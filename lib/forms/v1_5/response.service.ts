import 'server-only'

import { adminFirestore } from '@/lib/firebaseAdmin'
import {
  createResponseDoc,
  getResponseDoc,
  submitResponseDoc,
  listResponsesDoc,
} from '@/lib/firebase/repositories/v1_5/responses.repo'
import { getDistributionByCodeDoc, listDistributionsDoc } from '@/lib/firebase/repositories/v1_5/distributions.repo'
import {
  getFormAggregateFromDb,
  getFormVersionSnapshotsFromDb,
} from '@/lib/firebase/repositories/v1_5/v1_5Forms.repo'
import { validateResponseAnswers } from '@/lib/forms/v1_5/response.validation'
import { calculateResponseScore } from '@/lib/forms/v1_5/scoring/scoringEngine'
import { toPublicFormProjection } from '@/lib/forms/v1_5/legacyAdapter'
import type { AuthorizationContext } from '@/lib/auth/server'
import type {
  ResponseDoc,
  PublicResponseSessionDTO,
  PublicResponseSubmitDTO,
  StartResponseParams,
  SubmitResponseParams,
  ResponseFilterOptions,
} from '@/lib/forms/v1_5/responseTypes'
import type { ResponseResultDoc, RecommendationItem } from '@/lib/forms/v1_5/scoring/scoringTypes'

import { randomBytes, randomUUID } from 'crypto'

import { extractRespondentName, extractRespondentEmail } from '@/lib/forms/v1_5/respondentUtils'
export { extractRespondentName, extractRespondentEmail }

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
    // Direct Form ID / Legacy Form Code / Article Code fallback
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
  let canonicalForm: any

  if (dist.versionMode === 'pinned' && dist.pinnedVersionId) {
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
    const aggregate = await getFormAggregateFromDb(dist.formId)
    if (!aggregate) {
      throw new Error(`Formulir resmi dengan ID "${dist.formId}" tidak ditemukan di Firestore.`)
    }
    if (aggregate.status === 'archived') {
      throw new Error('Formulir ini telah diarsipkan dan tidak menerima respon baru.')
    }

    resolvedVersionId = aggregate.activeVersionId || `v1-${dist.formId}`
    resolvedVersionNumber = aggregate.activeVersionNumber || 1
    canonicalForm = {
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
  const publicForm = toPublicFormProjection(canonicalForm)

  return {
    responseId,
    submissionToken,
    distributionCode: dist.code,
    formId: dist.formId,
    versionId: resolvedVersionId,
    versionNumber: resolvedVersionNumber,
    title: dist.title || canonicalForm.form.metadata.title,
    description: dist.description || canonicalForm.form.metadata.description,
    ownerName: dist.ownerName,
    form: publicForm,
  }
}

/**
 * SUBMIT RESPONSE WORKFLOW:
 * Validates answer structure against exact resolved version snapshot,
 * executes server-side authoritative scoring engine, resolves threshold & article recommendations,
 * and atomically persists result alongside status: 'submitted'.
 */
export async function submitResponseWorkflow(
  responseId: string,
  params: SubmitResponseParams
): Promise<PublicResponseSubmitDTO> {
  const existing = await getResponseDoc(responseId)
  if (!existing) {
    throw new Error(`Sesi respon "${responseId}" tidak ditemukan.`)
  }

  if (existing.submissionToken !== params.submissionToken) {
    throw new Error('Token sesi pengiriman tidak valid.')
  }

  if (existing.status === 'submitted') {
    return {
      responseId: existing.responseId,
      status: 'submitted',
      submittedAt: existing.submittedAt || existing.updatedAt,
      message: 'Tanggapan sudah pernah dikirimkan sebelumnya.',
      result: existing.result
        ? {
            percentage: existing.result.percentage,
            grade: existing.result.grade,
            thresholdTitle: existing.result.thresholdTitle,
            thresholdDescription: existing.result.thresholdDescription,
            aspects: existing.result.aspects || [],
            recommendations: existing.result.recommendations || [],
          }
        : undefined,
    }
  }

  // 1. Load authoritative version snapshot (strictly matching existing.versionId)
  let versionSnapshot: any = null

  if (existing.versionId) {
    const snapshots = await getFormVersionSnapshotsFromDb(existing.formId)
    versionSnapshot = snapshots.find((s) => s.versionId === existing.versionId)
  }

  if (!versionSnapshot) {
    const aggregate = await getFormAggregateFromDb(existing.formId)
    if (aggregate) {
      versionSnapshot = {
        aspects: aggregate.aspects || [],
        questions: aggregate.questions || [],
        scoring: aggregate.scoring || { totalPoints: 100, mode: 'auto', stagePointDistribution: {} },
        validation: aggregate.validation || { mode: 'all_required', allowOverride: true },
        thresholds: aggregate.thresholds || [],
        recommendations: aggregate.recommendations || { mode: 'manual' },
      }
    }
  }

  if (!versionSnapshot) {
    throw new Error(`Versi snapshot "${existing.versionId}" tidak ditemukan untuk penilaian.`)
  }

  // 2. Validate submitted answers against snapshot
  const validationErrors = validateResponseAnswers(
    params.answers,
    versionSnapshot.questions || [],
    versionSnapshot.validation || { mode: 'all_required', allowOverride: true }
  )

  if (validationErrors.length > 0) {
    const firstMsg = validationErrors[0].message
    throw new Error(`Validasi gagal: ${firstMsg}`)
  }

  // 3. Authoritative Scoring Calculation
  const scoreOutput = calculateResponseScore(
    {
      aspects: versionSnapshot.aspects || [],
      questions: versionSnapshot.questions || [],
      scoring: versionSnapshot.scoring || { totalPoints: 100, mode: 'auto', stagePointDistribution: {} },
      thresholds: versionSnapshot.thresholds || [],
      recommendations: versionSnapshot.recommendations || { mode: 'manual' },
    },
    params.answers
  )

  // 4. Fetch Published Article DTOs for recommended IDs
  const recommendationItems: RecommendationItem[] = []
  if (scoreOutput.recommendedArticleIds.length > 0) {
    try {
      const articleSnaps = await Promise.all(
        scoreOutput.recommendedArticleIds.map((artId) =>
          adminFirestore.collection('articles').doc(artId).get()
        )
      )

      articleSnaps.forEach((snap) => {
        if (snap.exists) {
          const data = snap.data()
          if (data && data.status === 'published') {
            recommendationItems.push({
              articleId: snap.id,
              title: data.title || 'Artikel Edukasi Pangan',
              slug: data.slug,
              category: data.category,
            })
          }
        }
      })
    } catch (e) {
      console.error('Error loading recommended articles:', e)
    }
  }

  const now = new Date().toISOString()
  const resultDoc: ResponseResultDoc = {
    scoringEngineVersion: 'v1.5',
    calculatedAt: now,
    rawScore: scoreOutput.rawScore,
    maximumScore: scoreOutput.maximumScore,
    percentage: scoreOutput.percentage,
    grade: scoreOutput.gradeResult.grade,
    thresholdId: scoreOutput.gradeResult.thresholdId,
    thresholdTitle: scoreOutput.gradeResult.title,
    thresholdDescription: scoreOutput.gradeResult.description,
    aspects: scoreOutput.aspectResults,
    questions: scoreOutput.questionResults,
    recommendations: recommendationItems,
  }

  // 5. Atomic Persistence inside Firestore Transaction
  const submittedDoc = await submitResponseDoc(
    responseId,
    params.submissionToken,
    params.answers,
    resultDoc
  )

  return {
    responseId: submittedDoc.responseId,
    status: submittedDoc.status,
    submittedAt: submittedDoc.submittedAt || now,
    message: 'Tanggapan kuesioner Anda berhasil dikirim dan dinilai secara otomatis.',
    result: {
      percentage: resultDoc.percentage,
      grade: resultDoc.grade,
      thresholdTitle: resultDoc.thresholdTitle,
      thresholdDescription: resultDoc.thresholdDescription,
      aspects: resultDoc.aspects,
      recommendations: recommendationItems,
    },
  }
}

/**
 * RE-CALCULATION UTILITY FOR AUDIT / VERIFICATION:
 * Recalculates response against original version snapshot without mutating original submitted result.
 */
export async function recalculateResponseResultWorkflow(
  responseId: string
): Promise<{
  responseId: string
  versionId: string
  storedResult?: ResponseResultDoc
  recalculatedResult: ResponseResultDoc
  matches: boolean
}> {
  const existing = await getResponseDoc(responseId)
  if (!existing) {
    throw new Error(`Respon dengan ID "${responseId}" tidak ditemukan.`)
  }

  let versionSnapshot: any = null
  if (existing.versionId) {
    const snapshots = await getFormVersionSnapshotsFromDb(existing.formId)
    versionSnapshot = snapshots.find((s) => s.versionId === existing.versionId)
  }

  if (!versionSnapshot) {
    const aggregate = await getFormAggregateFromDb(existing.formId)
    if (aggregate) {
      versionSnapshot = {
        aspects: aggregate.aspects || [],
        questions: aggregate.questions || [],
        scoring: aggregate.scoring || { totalPoints: 100, mode: 'auto', stagePointDistribution: {} },
        validation: aggregate.validation || { mode: 'all_required', allowOverride: true },
        thresholds: aggregate.thresholds || [],
        recommendations: aggregate.recommendations || { mode: 'manual' },
      }
    }
  }

  if (!versionSnapshot) {
    throw new Error(`Versi snapshot "${existing.versionId}" tidak ditemukan.`)
  }

  const scoreOutput = calculateResponseScore(
    {
      aspects: versionSnapshot.aspects || [],
      questions: versionSnapshot.questions || [],
      scoring: versionSnapshot.scoring || { totalPoints: 100, mode: 'auto', stagePointDistribution: {} },
      thresholds: versionSnapshot.thresholds || [],
      recommendations: versionSnapshot.recommendations || { mode: 'manual' },
    },
    existing.answers || {}
  )

  const recalculatedResult: ResponseResultDoc = {
    scoringEngineVersion: 'v1.5',
    calculatedAt: new Date().toISOString(),
    rawScore: scoreOutput.rawScore,
    maximumScore: scoreOutput.maximumScore,
    percentage: scoreOutput.percentage,
    grade: scoreOutput.gradeResult.grade,
    thresholdId: scoreOutput.gradeResult.thresholdId,
    thresholdTitle: scoreOutput.gradeResult.title,
    thresholdDescription: scoreOutput.gradeResult.description,
    aspects: scoreOutput.aspectResults,
    questions: scoreOutput.questionResults,
    recommendations: [],
  }

  const matches = Boolean(
    existing.result &&
      existing.result.percentage === recalculatedResult.percentage &&
      existing.result.grade === recalculatedResult.grade
  )

  return {
    responseId: existing.responseId,
    versionId: existing.versionId,
    storedResult: existing.result,
    recalculatedResult,
    matches,
  }
}

/**
 * LIST RESPONSES WORKFLOW:
 * Role-scoped response query for Admin / Cadre / Partnership dashboard.
 */
export async function listResponsesWorkflow(
  authContext: AuthorizationContext,
  options?: ResponseFilterOptions
): Promise<ResponseDoc[]> {
  const isGlobal = authContext.role === 'admin' || authContext.role === 'super_admin' || authContext.role === 'internal_bpom'

  if (isGlobal) {
    return await listResponsesDoc(options)
  }

  if (authContext.role === 'partnership') {
    const allResponses = await listResponsesDoc(options)
    // Find all distribution IDs and codes owned by this partnership or subordinate cadres
    let partnerCodes = new Set<string>()
    let partnerCadreUids = new Set<string>([authContext.uid])
    let partnerOrg = ''

    try {
      const { safeGetDoc, safeGetCollectionDocs } = await import('@/lib/firebase/repositories/v1_5/safeFirestore')
      const [userDoc, allUsers, allDists] = await Promise.all([
        safeGetDoc('users', authContext.uid),
        safeGetCollectionDocs('users'),
        listDistributionsDoc(),
      ])

      if (userDoc?.data) {
        partnerOrg = (userDoc.data.organization || userDoc.data.displayName || '').toLowerCase().trim()
      }

      allUsers.forEach((u) => {
        if (
          u.data.partnershipId === authContext.uid ||
          (partnerOrg && u.data.organization && u.data.organization.toLowerCase().trim() === partnerOrg) ||
          (partnerOrg && u.data.partnershipName && u.data.partnershipName.toLowerCase().trim() === partnerOrg)
        ) {
          partnerCadreUids.add(u.id)
        }
      })

      allDists.forEach((d) => {
        const isOwned =
          d.createdBy === authContext.uid ||
          d.ownerId === authContext.uid ||
          d.partnershipId === authContext.uid ||
          (d.createdBy && partnerCadreUids.has(d.createdBy)) ||
          (d.ownerId && partnerCadreUids.has(d.ownerId)) ||
          (partnerOrg && d.ownerName && d.ownerName.toLowerCase().trim() === partnerOrg)

        if (isOwned) {
          if (d.code) partnerCodes.add(String(d.code).toLowerCase().trim())
          if ((d as any).distributionCode) partnerCodes.add(String((d as any).distributionCode).toLowerCase().trim())
          if (d.distributionId) partnerCodes.add(String(d.distributionId).toLowerCase().trim())
        }
      })
    } catch (e) {
      console.warn('Error resolving partnership response scope:', e)
    }

    return allResponses.filter((r) => {
      const code = String(r.distributionCode || (r as any).code || '').toLowerCase().trim()
      const distId = String(r.distributionId || '').toLowerCase().trim()
      const isOwner =
        (r.ownerId && partnerCadreUids.has(r.ownerId)) ||
        (r.createdBy && partnerCadreUids.has(r.createdBy)) ||
        (r.cadreId && partnerCadreUids.has(r.cadreId))
      const isCodeMatch = (code && partnerCodes.has(code)) || (distId && partnerCodes.has(distId))
      return isOwner || isCodeMatch
    })
  }

  // Cadre Scope: Only own responses or responses to own distribution codes
  const allResponses = await listResponsesDoc(options)
  let cadreCodes = new Set<string>()
  try {
    const allDists = await listDistributionsDoc()
    allDists.forEach((d) => {
      if (d.createdBy === authContext.uid || d.ownerId === authContext.uid) {
        if (d.code) cadreCodes.add(String(d.code).toLowerCase().trim())
        if ((d as any).distributionCode) cadreCodes.add(String((d as any).distributionCode).toLowerCase().trim())
        if (d.distributionId) cadreCodes.add(String(d.distributionId).toLowerCase().trim())
      }
    })
  } catch (e) {
    console.warn('Error resolving cadre response scope:', e)
  }

  return allResponses.filter((r) => {
    const code = String(r.distributionCode || (r as any).code || '').toLowerCase().trim()
    const distId = String(r.distributionId || '').toLowerCase().trim()
    const isOwner = r.ownerId === authContext.uid || r.createdBy === authContext.uid || r.cadreId === authContext.uid
    const isCodeMatch = (code && cadreCodes.has(code)) || (distId && cadreCodes.has(distId))
    return isOwner || isCodeMatch
  })
}

/**
 * GET RESPONSE DETAIL WORKFLOW:
 * Server-enforced role authorization check.
 */
export async function getResponseDetailWorkflow(
  responseId: string,
  authContext: AuthorizationContext
): Promise<ResponseDoc> {
  const resp = await getResponseDoc(responseId)
  if (!resp) {
    throw new Error(`Respon dengan ID "${responseId}" tidak ditemukan.`)
  }

  const isAdmin = authContext.role === 'admin' || authContext.role === 'super_admin'
  if (!isAdmin && resp.ownerId !== authContext.uid) {
    throw new Error('Anda tidak memiliki hak akses untuk melihat respon ini.')
  }

  // Preserve legacy forms vs V1.5 modern forms
  if (!resp.result || !Array.isArray(resp.result.aspects) || resp.result.aspects.length === 0) {
    try {
      if (resp.formId || resp.versionId) {
        const { recalculatedResult } = await recalculateResponseResultWorkflow(responseId)
        if (recalculatedResult && recalculatedResult.aspects && recalculatedResult.aspects.length > 0) {
          resp.result = recalculatedResult
          return resp
        }
      }
    } catch (e) {
      console.warn(`Lazy recalculate fallback for response ${responseId}:`, e)
    }

    if (!resp.result) {
      const legacyScore =
        (resp as any).score ??
        (resp as any).totalScore ??
        (resp as any).finalScore ??
        (resp as any).scoringDetails?.score ??
        0
      const scorePct = Math.min(100, Math.max(0, Math.round(Number(legacyScore) || 0)))

      resp.result = {
        scoringEngineVersion: 'legacy-v1',
        calculatedAt: resp.submittedAt || (resp as any).createdAt || (resp as any).updatedAt || new Date().toISOString(),
        rawScore: scorePct,
        maximumScore: 100,
        percentage: scorePct,
        grade: scorePct >= 80 ? 'Grade A' : scorePct >= 60 ? 'Grade B' : 'Grade C',
        thresholdId: 'legacy-threshold',
        thresholdTitle: scorePct >= 80 ? 'Memenuhi Syarat (MS)' : scorePct >= 60 ? 'Binaan Lanjutan' : 'Perlu Perbaikan',
        aspects: [],
        questions: [],
        recommendations: [],
      }
    }
  }

  return resp
}

/**
 * GET PUBLIC RESPONSE RESULT WORKFLOW:
 * Public read-only projection for respondent completion certificate.
 */
export async function getPublicResponseResultWorkflow(
  responseId: string
): Promise<{
  responseId: string
  code: string
  submittedAt: string
  result?: {
    percentage: number
    grade: string
    thresholdTitle: string
    thresholdDescription?: string
    aspects?: any[]
    recommendations?: any[]
  }
}> {
  const resp = await getResponseDoc(responseId)
  if (!resp) {
    throw new Error(`Tanggapan dengan ID "${responseId}" tidak ditemukan.`)
  }

  return {
    responseId: resp.responseId,
    code: resp.distributionCode || 'N/A',
    submittedAt: resp.submittedAt || resp.updatedAt,
    result: resp.result
      ? {
          percentage: resp.result.percentage,
          grade: resp.result.grade,
          thresholdTitle: resp.result.thresholdTitle,
          thresholdDescription: resp.result.thresholdDescription,
          aspects: resp.result.aspects || [],
          recommendations: resp.result.recommendations || [],
        }
      : undefined,
  }
}
