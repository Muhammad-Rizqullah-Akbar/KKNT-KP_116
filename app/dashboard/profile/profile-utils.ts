import { safeFetchJson } from '@/lib/infra/safe-fetch'
import { getArticles, type ArticleData } from '@/lib/repositories/articles.repo'
import type { DistributionDoc } from '@/lib/domain/distributions/distribution-types'

export type ProfileProgress = {
  articles: ArticleData[]
  distributions: DistributionDoc[]
  responsesCount: number
  cadresCount: number
  teamResponsesCount: number
}

export function getRoleLabel(role?: string | null): string {
  if (role === 'super_admin') return 'Super Admin BPOM'
  if (role === 'partnership') return 'Mitra / Instansi Partnership'
  if (role === 'cadre') return 'Kader Lapangan'
  return 'Pengguna Publik'
}

export async function fetchProfileProgress(
  user: { uid?: string; email?: string | null; displayName?: string | null } | null,
  userData: { displayName?: string; organization?: string; role?: string | null } | null
): Promise<ProfileProgress> {
  const currentUser = user
  const currentUserData = userData
  const result: ProfileProgress = {
    articles: [],
    distributions: [],
    responsesCount: 0,
    cadresCount: 0,
    teamResponsesCount: 0,
  }

  // 1. Fetch CMS Articles (strictly personal)
  try {
    const allArticles = await getArticles()
    const userUid = currentUser?.uid
    const userEmail = (currentUser?.email || '').toLowerCase().trim()
    const userDisplayName = (currentUserData?.displayName || currentUser?.displayName || '').toLowerCase().trim()

    const myArticles = allArticles.filter((article) => {
      if (article.authorId && userUid && article.authorId === userUid) return true
      if (article.createdBy && userUid && article.createdBy === userUid) return true

      const authorLower = (article.author || '').toLowerCase().trim()
      if (userEmail && authorLower === userEmail) return true
      if (userDisplayName && userDisplayName.length > 2 && authorLower === userDisplayName) return true

      return false
    })
    result.articles = myArticles
  } catch (artErr) {
    console.warn('Could not fetch articles:', artErr)
  }

  // 2. Fetch Distributions (strictly personal or partner organization)
  const distRes = await safeFetchJson('/api/distributions')
  let myDistCodes: string[] = []
  if (distRes.ok && distRes.data && Array.isArray(distRes.data.distributions)) {
    const myDists = distRes.data.distributions.filter(
      (d: DistributionDoc) =>
        d.createdBy === currentUser?.uid ||
        d.ownerId === currentUser?.uid ||
        (currentUserData?.displayName && d.ownerName?.toLowerCase() === currentUserData.displayName.toLowerCase())
    )
    result.distributions = myDists
    myDistCodes = myDists.map((d: DistributionDoc) => d.code).filter(Boolean)
  }

  // 3. Fetch Responses Count & Mitra Cadre Team Stats
  const respRes = await safeFetchJson('/api/responses')
  const usersRes = await safeFetchJson('/api/auth/users')

  if (respRes.ok && respRes.data && Array.isArray(respRes.data.responses)) {
    const allResponses = respRes.data.responses

    // Personal responses count
    const personalResponses = allResponses.filter((r: any) =>
      r.createdBy === currentUser?.uid ||
      (r.distributionCode && myDistCodes.includes(r.distributionCode)) ||
      (currentUserData?.displayName && r.ownerName?.toLowerCase() === currentUserData.displayName.toLowerCase())
    )
    result.responsesCount = personalResponses.length

    // If user is Mitra / Partner: Calculate Team Cadre Statistics strictly for linked cadres
    if (['mitra', 'partner', 'partnership', 'organization'].includes(currentUserData?.role || '')) {
      let cadreUids: string[] = []
      let cadreNames: string[] = []

      if (usersRes.ok && usersRes.data && Array.isArray(usersRes.data.users)) {
        const myCadres = usersRes.data.users.filter((u: any) =>
          u.role === 'cadre' &&
          (
            u.mitraId === currentUser?.uid ||
            (currentUserData?.organization && u.organization?.toLowerCase() === currentUserData.organization.toLowerCase()) ||
            (currentUserData?.organization && u.partnershipName?.toLowerCase() === currentUserData.organization.toLowerCase())
          )
        )
        result.cadresCount = myCadres.length
        cadreUids = myCadres.map((u: any) => u.uid || u.id)
        cadreNames = myCadres.map((u: any) => (u.displayName || u.name || '').toLowerCase()).filter(Boolean)
      }

      // Accumulate team responses from Cadres under this Mitra
      const teamResponses = allResponses.filter((r: any) =>
        cadreUids.includes(r.createdBy) ||
        (r.ownerName && cadreNames.includes(r.ownerName.toLowerCase()))
      )
      result.teamResponsesCount = teamResponses.length
    }
  }

  return result
}
