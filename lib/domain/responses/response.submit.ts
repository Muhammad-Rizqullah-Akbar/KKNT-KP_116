import 'server-only'

import { adminFirestore } from '@/lib/infra/firebase-admin'
import {
  getResponseDoc,
  submitResponseDoc,
} from '@/lib/repositories/responses.repo'
import { getDistributionByCodeDoc } from '@/lib/repositories/distributions.repo'
import {
  getFormAggregateFromDb,
  getFormVersionSnapshotsFromDb,
} from '@/lib/repositories/form-versions.repo'
import { validateResponseAnswers } from '@/lib/domain/responses/response.validation'
import { calculateResponseScore } from '@/lib/domain/scoring/scoring-engine'
import type {
  PublicResponseSubmitDTO,
  SubmitResponseParams,
} from '@/lib/domain/responses/response-types'
import type { ResponseResultDoc, RecommendationItem } from '@/lib/domain/scoring/scoring-types'

/**
 * Resolves the authoritative version snapshot for an existing response,
 * falling back to the active aggregate when no pinned snapshot exists.
 */
async function resolveVersionSnapshot(response: {
  versionId?: string
  formId: string
}): Promise<any | null> {
  let versionSnapshot: any = null

  if (response.versionId) {
    const snapshots = await getFormVersionSnapshotsFromDb(response.formId)
    versionSnapshot = snapshots.find((s) => s.versionId === response.versionId)
  }

  if (!versionSnapshot) {
    const aggregate = await getFormAggregateFromDb(response.formId)
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

  return versionSnapshot
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

  // Verify underlying distribution is still active (not paused/archived)
  if (existing.distributionCode) {
    const dist = await getDistributionByCodeDoc(existing.distributionCode)
    if (dist && dist.status !== 'active') {
      if (dist.status === 'paused') {
        throw new Error('Pengiriman ditolak: Formulir ini sedang dijeda sementara oleh penyelenggara.')
      }
      throw new Error('Pengiriman ditolak: Kode distribusi formulir tidak lagi aktif.')
    }
  }

  // 1. Load authoritative version snapshot (strictly matching existing.versionId)
  const versionSnapshot = await resolveVersionSnapshot(existing)

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

  const versionSnapshot = await resolveVersionSnapshot(existing)

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
