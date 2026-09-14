// ============ HELPER PROGRESS SUMMARY (pure, dibagi antar sub-komponen partnership) ============

import type { ArticleData } from '@/lib/repositories/articles.repo'
import type { UserProfile, CadreProgressSummary, MitraProgressSummary } from './types'

// Helper: Get Cadre Progress Summary
export function getCadreProgressSummary(
  cadreUid: string,
  allUsers: UserProfile[],
  distributions: any[],
  responses: any[],
  articles: ArticleData[],
): CadreProgressSummary {
  const cadreUser = allUsers.find((u) => u.uid === cadreUid)
  const cadreEmail = (cadreUser?.email || '').toLowerCase().trim()
  const cadreDisplayName = (cadreUser?.displayName || '').toLowerCase().trim()

  // 1. Distributions & Survey Responses
  const cadreDists = distributions.filter(
    (dist) => dist.createdBy === cadreUid || dist.cadreId === cadreUid
  )
  const distCodesSet = new Set<string>()
  cadreDists.forEach((dist) => {
    if (dist.code) distCodesSet.add(String(dist.code).toLowerCase().trim())
    if (dist.distributionCode) distCodesSet.add(String(dist.distributionCode).toLowerCase().trim())
  })

  const cadreResponses = responses.filter((response) => {
    const code = String(response.distributionCode || '').toLowerCase().trim()
    return (code !== '' && distCodesSet.has(code)) || response.createdBy === cadreUid || response.cadreId === cadreUid
  })

  const scores = cadreResponses
    .map((response) => response.result?.percentage)
    .filter((s): s is number => typeof s === 'number')

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const passCount = cadreResponses.filter((response) => response.result?.percentage && response.result.percentage >= 75).length
  const passRate = cadreResponses.length > 0 ? Math.round((passCount / cadreResponses.length) * 100) : 0

  // 2. CMS Articles authored by this cadre
  const cadreArticles = articles.filter((article) => {
    if (article.authorId && article.authorId === cadreUid) return true
    if (article.createdBy && article.createdBy === cadreUid) return true

    const authorLower = (article.author || '').toLowerCase().trim()
    if (cadreEmail && authorLower === cadreEmail) return true
    if (cadreDisplayName && cadreDisplayName.length > 2 && authorLower === cadreDisplayName) return true

    return false
  })

  const articleCount = cadreArticles.length
  const articleViews = cadreArticles.reduce((acc, article) => acc + (article.views || 0), 0)

  return {
    distCount: cadreDists.length,
    respCount: cadreResponses.length,
    articleCount,
    articleViews,
    hasWrittenArticle: articleCount > 0,
    avgScore,
    passCount,
    passRate,
  }
}

// Helper: Get Mitra Progress Summary
export function getMitraProgressSummary(
  mitra: UserProfile,
  allUsers: UserProfile[],
  distributions: any[],
  responses: any[],
  articles: ArticleData[],
): MitraProgressSummary {
  const linkedCadres = allUsers.filter(
    (account) =>
      account.role === 'cadre' &&
      (account.partnershipId === mitra.uid ||
        (account.organization && account.organization.toLowerCase() === (mitra.organization || mitra.displayName || '').toLowerCase()))
  )

  let totalDists = 0
  let totalResponses = 0
  let totalArticles = 0
  let totalArticleViews = 0
  const allScores: number[] = []

  // Articles authored directly by Mitra
  const mitraEmail = (mitra.email || '').toLowerCase().trim()
  const mitraDisplayName = (mitra.displayName || mitra.organization || '').toLowerCase().trim()
  const directMitraArticles = articles.filter((article) => {
    if (article.authorId === mitra.uid || article.createdBy === mitra.uid) return true
    const authorLower = (article.author || '').toLowerCase().trim()
    if (mitraEmail && authorLower === mitraEmail) return true
    if (mitraDisplayName && mitraDisplayName.length > 2 && authorLower === mitraDisplayName) return true
    return false
  })

  totalArticles += directMitraArticles.length
  totalArticleViews += directMitraArticles.reduce((acc, article) => acc + (article.views || 0), 0)

  linkedCadres.forEach((cadre) => {
    const prog = getCadreProgressSummary(cadre.uid, allUsers, distributions, responses, articles)
    totalDists += prog.distCount
    totalResponses += prog.respCount
    totalArticles += prog.articleCount
    totalArticleViews += prog.articleViews

    const cadreResponses = responses.filter((response) => response.createdBy === cadre.uid || response.cadreId === cadre.uid)
    cadreResponses.forEach((response) => {
      if (typeof response.result?.percentage === 'number') allScores.push(response.result.percentage)
    })
  })

  const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0
  const passCount = allScores.filter((s) => s >= 75).length
  const passRate = allScores.length > 0 ? Math.round((passCount / allScores.length) * 100) : 0

  return {
    cadreCount: linkedCadres.length,
    totalDists,
    totalResponses,
    totalArticles,
    totalArticleViews,
    avgScore,
    passRate,
  }
}
