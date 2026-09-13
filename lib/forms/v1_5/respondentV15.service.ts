/**
 * RESPONDENT V1.5 SERVICE - Scored Response Data
 * 
 * Purpose: Handle response data WITH scoring calculation
 * Used for: Admin dashboard, analytics, reports
 * 
 * This is the ENRICHED version that includes scoring results
 */

import 'server-only'
import { adminFirestore } from '@/lib/firebaseAdmin'
import { calculateResponseScore } from '@/lib/forms/v1_5/scoring/scoringEngine'
import { validateResponseAnswers } from '@/lib/forms/v1_5/response.validation'
import { normalizeAllAnswers } from '@/lib/forms/v1_5/answerNormalization'
import { getFormVersionSnapshotsFromDb, getFormAggregateFromDb } from '@/lib/firebase/repositories/v1_5/v1_5Forms.repo'
import type { ResponseResultDoc } from '@/lib/forms/v1_5/scoring/scoringTypes'

// ============ TYPES ============

export interface RespondentV1_5 {
  responseId: string
  distributionId: string
  distributionCode: string
  formId: string
  versionId: string
  versionNumber: number
  ownerType: string
  ownerId: string
  respondent: {
    name?: string
    email?: string
    [key: string]: any
  }
  answers: Record<string, any>
  // Normalized answers (human-readable labels)
  normalizedAnswers?: Record<string, any>
  status: 'in_progress' | 'submitted'
  startedAt: string
  submittedAt?: string
  updatedAt: string
  submissionToken?: string
  // V1.5 Scoring Results
  result?: ResponseResultDoc
}

export interface PaginatedRespondentsV1_5 {
  data: RespondentV1_5[]
  pagination: {
    total: number
    page: number
    limit: number
    hasMore: boolean
    lastDoc?: string
    lastDocId?: string
  }
  stats: {
    avgScore: number
    scoreDistribution: {
      excellent: number
      good: number
      fair: number
      poor: number
    }
  }
}

export interface RespondentQueryOptionsV1_5 {
  formId?: string
  distributionId?: string
  ownerId?: string
  status?: 'in_progress' | 'submitted'
  startDate?: string
  endDate?: string
  search?: string
  // Pagination
  limit?: number
  lastDocId?: string
  lastDoc?: any
  // Sorting
  sortBy?: 'submittedAt' | 'createdAt' | 'percentage'
  sortOrder?: 'asc' | 'desc'
}

// ============ SCORING WORKFLOW ============

/**
 * Submit and Score Respondent (v1.5 - with scoring)
 * 
 * This is the AUTHORITATIVE scoring operation
 * Called after v1 submission to calculate scores
 */
export async function submitAndScoreRespondentV1_5(
  responseId: string,
  submissionToken: string,
  answers: Record<string, any>
): Promise<RespondentV1_5> {
  // 1. Get existing response
  const snap = await adminFirestore.collection('responses').doc(responseId).get()
  
  if (!snap.exists) {
    throw new Error('Respondent tidak ditemukan')
  }
  
  const existing = snap.data() as RespondentV1_5
  
  if (existing.submissionToken !== submissionToken) {
    throw new Error('Token submission tidak valid')
  }
  
  // 2. If already submitted with score, return existing
  if (existing.status === 'submitted' && existing.result) {
    return existing
  }
  
  // 3. Load form version for scoring
  const snapshots = await getFormVersionSnapshotsFromDb(existing.formId)
  let versionSnapshot = snapshots.find(s => s.versionId === existing.versionId)
  
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
    throw new Error('Form version tidak ditemukan untuk scoring')
  }
  
  // 4. Normalize answers (IDs → Labels)
  let normalizedAnswers = answers
  if (versionSnapshot.questions?.length > 0) {
    const { normalizedAnswers: normAnswers } = normalizeAllAnswers(
      answers,
      versionSnapshot.questions
    )
    normalizedAnswers = normAnswers
  }
  
  // 5. Validate answers
  const validationErrors = validateResponseAnswers(
    normalizedAnswers,
    versionSnapshot.questions || [],
    versionSnapshot.validation || { mode: 'all_required', allowOverride: true }
  )
  
  if (validationErrors.length > 0) {
    throw new Error(`Validasi gagal: ${validationErrors[0].message}`)
  }
  
  // 6. Calculate score
  const scoreOutput = calculateResponseScore(
    {
      aspects: versionSnapshot.aspects || [],
      questions: versionSnapshot.questions || [],
      scoring: versionSnapshot.scoring || { totalPoints: 100, mode: 'auto', stagePointDistribution: {} },
      thresholds: versionSnapshot.thresholds || [],
      recommendations: versionSnapshot.recommendations || { mode: 'manual' },
    },
    normalizedAnswers
  )
  
  // 7. Build result document
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
    recommendations: [], // Will be populated if article recommendations needed
  }
  
  // 8. Update response with normalized answers and score
  await adminFirestore.collection('responses').doc(responseId).update({
    answers: normalizedAnswers, // Store normalized (readable) answers
    status: 'submitted',
    submittedAt: now,
    updatedAt: now,
    result: resultDoc,
  })
  
  return {
    ...existing,
    answers: normalizedAnswers,
    status: 'submitted',
    submittedAt: now,
    updatedAt: now,
    result: resultDoc,
  }
}

/**
 * Get respondent with score (v1.5)
 */
export async function getRespondentV1_5(responseId: string): Promise<RespondentV1_5 | null> {
  const snap = await adminFirestore.collection('responses').doc(responseId).get()
  
  if (!snap.exists) return null
  
  return { responseId: snap.id, ...snap.data() } as RespondentV1_5
}

/**
 * List respondents with scores and aggregation (OPTIMIZED for dashboard)
 * 
 * Includes real-time statistics calculation
 */
export async function listRespondentsV1_5(
  options: RespondentQueryOptionsV1_5 = {}
): Promise<PaginatedRespondentsV1_5> {
  const {
    formId,
    distributionId,
    ownerId,
    status = 'submitted',
    startDate,
    endDate,
    search,
    limit = 50,
    lastDoc,
    sortBy = 'submittedAt',
    sortOrder = 'desc',
  } = options

  // Build query
  let query = adminFirestore.collection('responses') as any
  
  // Apply filters
  if (formId) {
    query = query.where('formId', '==', formId)
  }
  
  if (distributionId) {
    query = query.where('distributionId', '==', distributionId)
  }
  
  if (ownerId) {
    query = query.where('ownerId', '==', ownerId)
  }
  
  if (status) {
    query = query.where('status', '==', status)
  }
  
  // Order for cursor pagination
  query = query.orderBy(sortBy, sortOrder)
  
  // Cursor-based pagination
  if (lastDoc) {
    query = query.startAfter(lastDoc)
  }
  
  query = query.limit(limit + 1)
  
  const snapshot = await query.get()
  
  const docs = snapshot.docs.map(doc => ({
    responseId: doc.id,
    ...doc.data()
  })) as RespondentV1_5[]
  
  const hasMore = docs.length > limit
  if (hasMore) {
    docs.pop()
  }
  
  // Calculate statistics
  const stats = calculateStats(docs)
  
  // Get total count
  let countQuery = adminFirestore.collection('responses') as any
  if (formId) countQuery = countQuery.where('formId', '==', formId)
  if (distributionId) countQuery = countQuery.where('distributionId', '==', distributionId)
  if (status) countQuery = countQuery.where('status', '==', status)
  const totalSnap = await countQuery.count().get()
  
  return {
    data: docs,
    pagination: {
      total: totalSnap.data().count,
      page: 1,
      limit,
      hasMore,
      lastDoc: docs.length > 0 ? docs[docs.length - 1] : undefined,
      lastDocId: docs.length > 0 ? docs[docs.length - 1].responseId : undefined,
    },
    stats,
  }
}

/**
 * Calculate statistics from respondents
 */
function calculateStats(respondents: RespondentV1_5[]): PaginatedRespondentsV1_5['stats'] {
  const withScores = respondents.filter(r => r.result)
  
  if (withScores.length === 0) {
    return {
      avgScore: 0,
      scoreDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 }
    }
  }
  
  // Average score
  const totalScore = withScores.reduce((sum, r) => sum + (r.result?.percentage || 0), 0)
  const avgScore = Math.round(totalScore / withScores.length)
  
  // Score distribution
  const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 }
  
  withScores.forEach(r => {
    const pct = r.result?.percentage || 0
    if (pct >= 80) distribution.excellent++
    else if (pct >= 60) distribution.good++
    else if (pct >= 40) distribution.fair++
    else distribution.poor++
  })
  
  return { avgScore, scoreDistribution: distribution }
}

/**
 * Get score trend over time (for charts)
 */
export async function getScoreTrendV1_5(
  formId: string,
  options: { days?: number; interval?: 'day' | 'week' } = {}
): Promise<{ date: string; avgScore: number; count: number }[]> {
  const { days = 30, interval = 'day' } = options
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const snapshot = await adminFirestore.collection('responses')
    .where('formId', '==', formId)
    .where('status', '==', 'submitted')
    .where('submittedAt', '>=', startDate.toISOString())
    .orderBy('submittedAt', 'desc')
    .get()
  
  const docs = snapshot.docs.map(doc => ({
    responseId: doc.id,
    ...doc.data()
  })) as RespondentV1_5[]
  
  // Group by date interval
  const grouped: Record<string, { total: number; count: number }> = {}
  
  docs.forEach(doc => {
    if (!doc.result) return
    
    const date = new Date(doc.submittedAt!)
    let key: string
    
    if (interval === 'day') {
      key = date.toISOString().split('T')[0] // YYYY-MM-DD
    } else {
      // Week: get start of week
      const dayOfWeek = date.getDay()
      const startOfWeek = new Date(date)
      startOfWeek.setDate(date.getDate() - dayOfWeek)
      key = startOfWeek.toISOString().split('T')[0]
    }
    
    if (!grouped[key]) {
      grouped[key] = { total: 0, count: 0 }
    }
    
    grouped[key].total += doc.result.percentage
    grouped[key].count++
  })
  
  return Object.entries(grouped)
    .map(([date, data]) => ({
      date,
      avgScore: Math.round(data.total / data.count),
      count: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Get aspect breakdown (for radar chart)
 */
export async function getAspectBreakdownV1_5(
  formId: string,
  limit = 100
): Promise<Record<string, { avgScore: number; maxScore: number; count: number }>> {
  const snapshot = await adminFirestore.collection('responses')
    .where('formId', '==', formId)
    .where('status', '==', 'submitted')
    .orderBy('submittedAt', 'desc')
    .limit(limit)
    .get()
  
  const docs = snapshot.docs.map(doc => doc.data()) as RespondentV1_5[]
  
  const aspects: Record<string, { total: number; max: number; count: number }> = {}
  
  docs.forEach(doc => {
    if (!doc.result?.aspects) return
    
    doc.result.aspects.forEach((aspect: any) => {
      if (!aspects[aspect.aspectId]) {
        aspects[aspect.aspectId] = { total: 0, max: 0, count: 0 }
      }
      
      aspects[aspect.aspectId].total += aspect.percentage || 0
      aspects[aspect.aspectId].max = Math.max(aspects[aspect.aspectId].max, aspect.maxScore || 100)
      aspects[aspect.aspectId].count++
    })
  })
  
  return Object.entries(aspects).reduce((acc, [id, data]) => {
    acc[id] = {
      avgScore: Math.round(data.total / data.count),
      maxScore: data.max,
      count: data.count,
    }
    return acc
  }, {} as Record<string, { avgScore: number; maxScore: number; count: number }>)
}

/**
 * Recalculate score for existing respondent
 * Used when form scoring rules change
 */
export async function recalculateScoreV1_5(responseId: string): Promise<RespondentV1_5> {
  const snap = await adminFirestore.collection('responses').doc(responseId).get()
  
  if (!snap.exists) {
    throw new Error('Respondent tidak ditemukan')
  }
  
  const existing = snap.data() as RespondentV1_5
  
  // Get original answers (before normalization if available)
  // If normalizedAnswers exists, use answers (which should be normalized)
  const answersToScore = existing.answers || {}
  
  // Load form version
  const snapshots = await getFormVersionSnapshotsFromDb(existing.formId)
  let versionSnapshot = snapshots.find(s => s.versionId === existing.versionId)
  
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
    throw new Error('Form version tidak ditemukan')
  }
  
  // Recalculate
  const scoreOutput = calculateResponseScore(
    {
      aspects: versionSnapshot.aspects || [],
      questions: versionSnapshot.questions || [],
      scoring: versionSnapshot.scoring || { totalPoints: 100, mode: 'auto', stagePointDistribution: {} },
      thresholds: versionSnapshot.thresholds || [],
      recommendations: versionSnapshot.recommendations || { mode: 'manual' },
    },
    answersToScore
  )
  
  const now = new Date().toISOString()
  const resultDoc: ResponseResultDoc = {
    scoringEngineVersion: 'v1.5-recalculated',
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
    recommendations: existing.result?.recommendations || [],
  }
  
  // Update with new score
  await adminFirestore.collection('responses').doc(responseId).update({
    result: resultDoc,
    updatedAt: now,
  })
  
  return {
    ...existing,
    result: resultDoc,
    updatedAt: now,
  }
}
