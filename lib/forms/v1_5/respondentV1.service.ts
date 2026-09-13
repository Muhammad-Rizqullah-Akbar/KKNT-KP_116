/**
 * RESPONDENT V1 SERVICE - Raw Respondent Data (No Scoring)
 * 
 * Purpose: Handle raw response data without scoring calculation
 * Used for: Public form submission, basic data collection
 * 
 * This is the LIGHTWEIGHT version for high-traffic public access
 */

import 'server-only'
import { adminFirestore } from '@/lib/firebaseAdmin'
import { randomUUID } from 'crypto'

// ============ TYPES ============

export interface RespondentV1 {
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
  status: 'in_progress' | 'submitted'
  startedAt: string
  submittedAt?: string
  updatedAt: string
  submissionToken?: string
  // v1.5 fields (optional, for compatibility)
  result?: {
    percentage: number
    grade: string
    thresholdTitle: string
    [key: string]: any
  }
}

export interface PaginatedRespondents {
  data: RespondentV1[]
  pagination: {
    total: number
    page: number
    limit: number
    hasMore: boolean
    lastDoc?: string
  }
}

export interface RespondentQueryOptions {
  formId?: string
  distributionId?: string
  status?: 'in_progress' | 'submitted'
  startDate?: string
  endDate?: string
  search?: string
  // Pagination
  limit?: number
  lastDocId?: string
  lastDoc?: any
}

// ============ HELPERS ============

function generateSubmissionToken(): string {
  return `tok_${randomUUID().replace(/-/g, '').slice(0, 32)}`
}

// ============ CORE OPERATIONS ============

/**
 * Create a new respondent (v1 - no scoring)
 * Lightweight operation for public form access
 */
export async function createRespondentV1(
  formId: string,
  distributionId: string,
  distributionCode: string,
  versionId: string,
  versionNumber: number,
  ownerType: string,
  ownerId: string,
  respondent: RespondentV1['respondent'] = {}
): Promise<RespondentV1> {
  const responseId = `resp_v1_${randomUUID()}`
  const now = new Date().toISOString()

  const doc: RespondentV1 = {
    responseId,
    distributionId,
    distributionCode,
    formId,
    versionId,
    versionNumber,
    ownerType,
    ownerId,
    respondent,
    answers: {},
    status: 'in_progress',
    startedAt: now,
    updatedAt: now,
    submissionToken: generateSubmissionToken(),
  }

  await adminFirestore.collection('responses').doc(responseId).create(doc)
  
  return doc
}

/**
 * Get respondent by ID (v1)
 */
export async function getRespondentV1(responseId: string): Promise<RespondentV1 | null> {
  const snap = await adminFirestore.collection('responses').doc(responseId).get()
  
  if (!snap.exists) return null
  
  return { responseId: snap.id, ...snap.data() } as RespondentV1
}

/**
 * Update respondent answers (v1 - before scoring)
 */
export async function updateRespondentAnswersV1(
  responseId: string,
  answers: Record<string, any>
): Promise<void> {
  const now = new Date().toISOString()
  
  await adminFirestore.collection('responses').doc(responseId).update({
    answers,
    updatedAt: now,
  })
}

/**
 * Submit respondent (v1 - marks as submitted, no scoring yet)
 * This is the FAST path for public form submission
 */
export async function submitRespondentV1(
  responseId: string,
  submissionToken: string,
  answers: Record<string, any>
): Promise<RespondentV1> {
  const snap = await adminFirestore.collection('responses').doc(responseId).get()
  
  if (!snap.exists) {
    throw new Error('Respondent tidak ditemukan')
  }
  
  const data = snap.data() as RespondentV1
  
  if (data.submissionToken !== submissionToken) {
    throw new Error('Token submission tidak valid')
  }
  
  if (data.status === 'submitted') {
    return data
  }
  
  const now = new Date().toISOString()
  
  await adminFirestore.collection('responses').doc(responseId).update({
    answers,
    status: 'submitted',
    submittedAt: now,
    updatedAt: now,
  })
  
  return {
    ...data,
    answers,
    status: 'submitted',
    submittedAt: now,
    updatedAt: now,
  }
}

/**
 * List respondents with cursor-based pagination (OPTIMIZED for 20K+ data)
 * 
 * Uses Firestore cursor pagination instead of offset
 * Much faster for large datasets
 */
export async function listRespondentsV1(
  options: RespondentQueryOptions = {}
): Promise<PaginatedRespondents> {
  const {
    formId,
    distributionId,
    status,
    startDate,
    endDate,
    search,
    limit = 50,
    lastDoc,
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
  
  if (status) {
    query = query.where('status', '==', status)
  }
  
  // Date range filter
  if (startDate || endDate) {
    query = query.where('submittedAt', '>=', startDate || '1970-01-01')
    if (endDate) {
      query = query.where('submittedAt', '<=', endDate)
    }
  }
  
  // Order by submittedAt for cursor pagination
  query = query.orderBy('submittedAt', 'desc')
  
  // Cursor-based pagination (much faster than offset)
  if (lastDoc) {
    query = query.startAfter(lastDoc)
  }
  
  // Limit results
  query = query.limit(limit + 1) // +1 to check if there are more
  
  const snapshot = await query.get()
  
  const docs = snapshot.docs.map(doc => ({
    responseId: doc.id,
    ...doc.data()
  })) as RespondentV1[]
  
  // Check if there are more results
  const hasMore = docs.length > limit
  if (hasMore) {
    docs.pop() // Remove the extra one
  }
  
  // Extract last document for next cursor
  const lastDocId = docs.length > 0 ? docs[docs.length - 1].submittedAt : undefined
  
  // Count total (for display only - cached in client)
  let totalQuery = adminFirestore.collection('responses') as any
  if (formId) totalQuery = totalQuery.where('formId', '==', formId)
  if (distributionId) totalQuery = totalQuery.where('distributionId', '==', distributionId)
  if (status) totalQuery = totalQuery.where('status', '==', status)
  const totalSnap = await totalQuery.count().get()
  const total = totalSnap.data().count
  
  return {
    data: docs,
    pagination: {
      total,
      page: 1,
      limit,
      hasMore,
      lastDoc: lastDocId,
    },
  }
}

/**
 * Count respondents by status (fast aggregation)
 */
export async function countRespondentsV1(
  formId?: string,
  distributionId?: string
): Promise<{ total: number; submitted: number; inProgress: number }> {
  let baseQuery = adminFirestore.collection('responses') as any
  
  if (formId) {
    baseQuery = baseQuery.where('formId', '==', formId)
  }
  
  if (distributionId) {
    baseQuery = baseQuery.where('distributionId', '==', distributionId)
  }
  
  // Use aggregation for efficiency
  const [totalSnap, submittedSnap, inProgressSnap] = await Promise.all([
    baseQuery.count().get(),
    baseQuery.where('status', '==', 'submitted').count().get(),
    baseQuery.where('status', '==', 'in_progress').count().get(),
  ])
  
  return {
    total: totalSnap.data().count,
    submitted: submittedSnap.data().count,
    inProgress: inProgressSnap.data().count,
  }
}

/**
 * Get respondents by form ID with aggregation stats
 * Optimized for dashboard summary
 */
export async function getRespondentsByFormV1(
  formId: string,
  options: { limit?: number; status?: 'submitted' } = {}
): Promise<{
  respondents: RespondentV1[]
  stats: {
    total: number
    submitted: number
    avgScore?: number
  }
}> {
  const { limit = 100, status = 'submitted' } = options
  
  const [listResult, counts] = await Promise.all([
    listRespondentsV1({ formId, status, limit }),
    countRespondentsV1(formId),
  ])
  
  // Calculate average score from submitted responses
  let avgScore: number | undefined
  const submittedResponses = listResult.data.filter(r => r.result)
  
  if (submittedResponses.length > 0) {
    const totalScore = submittedResponses.reduce((sum, r) => sum + (r.result?.percentage || 0), 0)
    avgScore = Math.round(totalScore / submittedResponses.length)
  }
  
  return {
    respondents: listResult.data,
    stats: {
      total: counts.total,
      submitted: counts.submitted,
      avgScore,
    },
  }
}
