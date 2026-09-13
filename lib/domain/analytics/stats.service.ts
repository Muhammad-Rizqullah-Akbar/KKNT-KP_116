/**
 * Dashboard Statistics API Helper
 * 
 * Optimized statistics calculation using respondents collection
 * for dashboard summary displays
 */

import 'server-only'
import { adminFirestore } from '@/lib/infra/firebase-admin'

export interface DashboardStats {
  totalResponses: number
  submittedResponses: number
  inProgressResponses: number
  averageScore: number | null
  scoreDistribution: {
    excellent: number  // >= 80%
    good: number      // 60-79%
    fair: number      // 40-59%
    poor: number      // < 40%
  }
  recentSubmissions: {
    date: string
    count: number
  }[]
  topRespondents: {
    name: string
    score: number
    submittedAt: string
  }[]
}

/**
 * Get dashboard statistics for a specific form or distribution
 */
export async function getDashboardStats(
  options: {
    formId?: string
    distributionId?: string
    ownerId?: string
    days?: number // Last N days
    limit?: number // Top respondents limit
  } = {}
): Promise<DashboardStats> {
  const { formId, distributionId, ownerId, days = 30, limit = 10 } = options

  // Build base query
  let query: any = adminFirestore.collection('responses')

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

  // Date filter (last N days)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  query = query.where('submittedAt', '>=', startDate.toISOString())

  // Order by submission date
  query = query.orderBy('submittedAt', 'desc')

  // Get all docs in date range (for stats calculation)
  const snapshot = await query.get()

  const allDocs = snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }))

  // Calculate statistics
  const totalResponses = allDocs.length
  const submittedResponses = allDocs.filter((d: any) => d.status === 'submitted').length
  const inProgressResponses = allDocs.filter((d: any) => d.status === 'in_progress').length

  // Score statistics (only from submitted responses with scores)
  const scoredResponses = allDocs.filter(
    (d: any) => d.status === 'submitted' && d.result?.percentage
  )

  let averageScore: number | null = null
  const scoreDistribution = { excellent: 0, good: 0, fair: 0, poor: 0 }

  if (scoredResponses.length > 0) {
    const totalScore = scoredResponses.reduce(
      (sum: number, d: any) => sum + (d.result?.percentage || 0),
      0
    )
    averageScore = Math.round(totalScore / scoredResponses.length)

    // Distribution
    scoredResponses.forEach((d: any) => {
      const pct = d.result?.percentage || 0
      if (pct >= 80) scoreDistribution.excellent++
      else if (pct >= 60) scoreDistribution.good++
      else if (pct >= 40) scoreDistribution.fair++
      else scoreDistribution.poor++
    })
  }

  // Recent submissions by date
  const recentByDate: Record<string, number> = {}
  allDocs
    .filter((d: any) => d.status === 'submitted' && d.submittedAt)
    .forEach((d: any) => {
      const date = d.submittedAt.split('T')[0]
      recentByDate[date] = (recentByDate[date] || 0) + 1
    })

  const recentSubmissions = Object.entries(recentByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)

  // Top respondents by score
  const topRespondents = scoredResponses
    .sort((a: any, b: any) => (b.result?.percentage || 0) - (a.result?.percentage || 0))
    .slice(0, limit)
    .map((d: any) => ({
      name: d.respondent?.name || d.respondentName || 'Responden',
      score: d.result?.percentage || 0,
      submittedAt: d.submittedAt || '',
    }))

  return {
    totalResponses,
    submittedResponses,
    inProgressResponses,
    averageScore,
    scoreDistribution,
    recentSubmissions,
    topRespondents,
  }
}

/**
 * Get real-time counter for a specific metric
 * Uses Firestore count aggregation for efficiency
 */
export async function getRealTimeCount(
  collection: string,
  filters: { field: string; value: any }[] = []
): Promise<number> {
  let query: any = adminFirestore.collection(collection)

  filters.forEach(({ field, value }) => {
    query = query.where(field, '==', value)
  })

  const countSnapshot = await query.count().get()
  return countSnapshot.data().count
}

/**
 * Get form-specific statistics for admin dashboard
 */
export async function getFormDashboardStats(
  formId: string
): Promise<{
  totalDistributions: number
  activeDistributions: number
  totalResponses: number
  avgCompletionTime: number | null
  completionRate: number
}> {
  // Get distributions count
  const distSnapshot = await adminFirestore
    .collection('distributions')
    .where('formId', '==', formId)
    .count()
    .get()
  const totalDistributions = distSnapshot.data().count

  // Active distributions
  const activeDistSnapshot = await adminFirestore
    .collection('distributions')
    .where('formId', '==', formId)
    .where('status', '==', 'active')
    .count()
    .get()
  const activeDistributions = activeDistSnapshot.data().count

  // Total responses for this form
  const responseSnapshot = await adminFirestore
    .collection('responses')
    .where('formId', '==', formId)
    .where('status', '==', 'submitted')
    .count()
    .get()
  const totalResponses = responseSnapshot.data().count

  return {
    totalDistributions,
    activeDistributions,
    totalResponses,
    avgCompletionTime: null, // Would need additional tracking
    completionRate: totalDistributions > 0 
      ? Math.round((totalResponses / totalDistributions) * 100) 
      : 0,
  }
}
