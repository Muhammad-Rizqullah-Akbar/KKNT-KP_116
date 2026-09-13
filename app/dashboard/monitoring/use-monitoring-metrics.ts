'use client'

import { useMemo } from 'react'
import type { UserData } from '@/lib/domain/auth/auth-client.service'
import type {
  UserProfile,
  ResponseSummary,
  DistributionSummary,
  CadreMetric,
  MitraMetric,
  MonitoringStats,
  TopContributorsByMitra,
  AlertCardItem,
  AlertGroup,
} from './types'

interface MonitoringData {
  users: UserProfile[]
  distributions: DistributionSummary[]
  responses: ResponseSummary[]
}

interface UseMonitoringMetricsArgs {
  monitoringData: MonitoringData
  userUid?: string
  userData: UserData | null
  isPartnershipRole: boolean
}

export function useMonitoringMetrics({
  monitoringData,
  userUid,
  userData,
  isPartnershipRole,
}: UseMonitoringMetricsArgs) {
  const users = monitoringData.users
  const distributions = monitoringData.distributions
  const responses = monitoringData.responses

  // 1. GRANULAR PER-CADRE CONTRIBUTION METRICS
  const cadreMetrics = useMemo<CadreMetric[]>(() => {
    const myOrg = (userData?.organization || userData?.displayName || '').toLowerCase().trim()
    const cadresList = users.filter((cadUser) => {
      if (cadUser.role !== 'cadre') return false
      if (isPartnershipRole) {
        const isMatchId = cadUser.partnershipId === userUid
        const isMatchOrg = myOrg && cadUser.organization && cadUser.organization.toLowerCase().trim() === myOrg
        const isMatchPartName = myOrg && cadUser.partnershipName && cadUser.partnershipName.toLowerCase().trim() === myOrg
        return isMatchId || isMatchOrg || isMatchPartName
      }
      return true
    })

    return cadresList.map((cadre) => {
      const cadreDists = distributions.filter(
        (dist) => dist.createdBy === cadre.uid || dist.cadreId === cadre.uid
      )

      const distCodesSet = new Set<string>()
      cadreDists.forEach((dist) => {
        if (dist.code) distCodesSet.add(String(dist.code).toLowerCase().trim())
        if (dist.distributionCode) distCodesSet.add(String(dist.distributionCode).toLowerCase().trim())
        if (dist.distributionId) distCodesSet.add(String(dist.distributionId).toLowerCase().trim())
      })

      const cadreResponses = responses.filter((resp) => {
        const code = String(resp.distributionCode || '').toLowerCase().trim()
        return (code !== '' && distCodesSet.has(code)) || resp.createdBy === cadre.uid || resp.cadreId === cadre.uid
      })

      const scores = cadreResponses
        .map((resp) => resp.result?.percentage)
        .filter((score): score is number => typeof score === 'number')

      const avgScore = scores.length > 0 ? Math.round(scores.reduce((acc, score) => acc + score, 0) / scores.length) : 0
      const passRate =
        cadreResponses.length > 0
          ? Math.round(
              (cadreResponses.filter((resp) => resp.result?.percentage && resp.result.percentage >= 75).length /
                cadreResponses.length) *
                100
            )
          : 0

      const contributionPct =
        responses.length > 0 ? Math.round((cadreResponses.length / responses.length) * 100) : 0

      let status: CadreMetric['status'] = 'attention'
      if (cadreResponses.length >= 5 && avgScore >= 75) {
        status = 'high'
      } else if (cadreResponses.length >= 1) {
        status = 'active'
      }

      return {
        cadre,
        distCount: cadreDists.length,
        respCount: cadreResponses.length,
        avgScore,
        passRate,
        contributionPct,
        status,
        organizationName: cadre.organization || cadre.partnershipName || 'Independen',
      }
    })
  }, [users, distributions, responses, isPartnershipRole, userUid, userData])

  // 2. GRANULAR PER-MITRA CONTRIBUTION METRICS (CAPPED AT MAX 5 REPRESENTATIVE CADRES)
  const mitraMetrics = useMemo<MitraMetric[]>(() => {
    const partnersList = isPartnershipRole
      ? users.filter((userItem) => userItem.uid === userUid || userItem.role === 'partnership')
      : users.filter((userItem) => userItem.role === 'partnership')

    return partnersList.map((mitra) => {
      const linkedCadres = users.filter(
        (linkedUser) =>
          linkedUser.role === 'cadre' &&
          (linkedUser.partnershipId === mitra.uid ||
            (linkedUser.organization && linkedUser.organization.toLowerCase() === (mitra.organization || mitra.displayName).toLowerCase()))
      )

      const topRepresentativeCadres = linkedCadres
        .map((cadreRef) => {
          const matchedMetric = cadreMetrics.find((candidateMetric) => candidateMetric.cadre.uid === cadreRef.uid)
          return matchedMetric || { cadre: cadreRef, distCount: 0, respCount: 0, avgScore: 0, passRate: 0, status: 'attention' as const, contributionPct: 0, organizationName: mitra.displayName }
        })
        .sort((metricA, metricB) => metricB.respCount - metricA.respCount || metricB.avgScore - metricA.avgScore)
        .slice(0, 5)

      const cadreUids = new Set(linkedCadres.map((cadreRef) => cadreRef.uid))

      const mitraDists = distributions.filter(
        (dist) => (dist.createdBy && cadreUids.has(dist.createdBy)) || (dist.cadreId && cadreUids.has(dist.cadreId))
      )

      const mitraDistCodes = new Set<string>()
      mitraDists.forEach((dist) => {
        if (dist.code) mitraDistCodes.add(String(dist.code).toLowerCase().trim())
        if (dist.distributionCode) mitraDistCodes.add(String(dist.distributionCode).toLowerCase().trim())
      })

      const mitraResponses = responses.filter((resp) => {
        const code = String(resp.distributionCode || '').toLowerCase().trim()
        return (
          (code !== '' && mitraDistCodes.has(code)) ||
          (resp.createdBy && cadreUids.has(resp.createdBy)) ||
          (resp.cadreId && cadreUids.has(resp.cadreId))
        )
      })

      const scores = mitraResponses
        .map((resp) => resp.result?.percentage)
        .filter((score): score is number => typeof score === 'number')

      const avgScore = scores.length > 0 ? Math.round(scores.reduce((acc, score) => acc + score, 0) / scores.length) : 0

      return {
        mitra,
        cadreCount: linkedCadres.length,
        topRepresentativeCadres,
        distCount: mitraDists.length,
        respCount: mitraResponses.length,
        avgScore,
        status: linkedCadres.length > 0 ? (mitraResponses.length >= 5 ? 'Sangat Produktif' : 'Aktif') : 'Perlu Penugasan Kader',
      }
    })
  }, [users, distributions, responses, isPartnershipRole, userUid, cadreMetrics])

  // 3. EXECUTIVE KPI OVERVIEW METRICS
  const stats = useMemo<MonitoringStats>(() => {
    const totalMitra = isPartnershipRole ? 1 : users.filter((userItem) => userItem.role === 'partnership').length
    const totalCadres = cadreMetrics.length
    const totalDists = isPartnershipRole
      ? cadreMetrics.reduce((sum, cadMetric) => sum + cadMetric.distCount, 0)
      : distributions.length
    const totalResponses = isPartnershipRole
      ? cadreMetrics.reduce((sum, cadMetric) => sum + cadMetric.respCount, 0)
      : responses.length

    const activeCadresCount = cadreMetrics.filter((cadMetric) => cadMetric.respCount > 0).length
    const highPerfCadresCount = cadreMetrics.filter((cadMetric) => cadMetric.status === 'high').length

    const scores = responses.map((resp) => resp.result?.percentage).filter((score): score is number => typeof score === 'number')
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((acc, score) => acc + score, 0) / scores.length) : 0

    return { totalMitra, totalCadres, totalDists, totalResponses, activeCadresCount, highPerfCadresCount, avgScore }
  }, [users, distributions, responses, cadreMetrics, isPartnershipRole])

  // 4. TOP CONTRIBUTORS GROUPED BY MITRA (For Admin & Super Admin)
  const topContributorsByMitra = useMemo<TopContributorsByMitra>(() => {
    const partnersList = users.filter((userItem) => userItem.role === 'partnership')

    const mitraGroups: { mitra: UserProfile; topCadres: CadreMetric[] }[] = []

    partnersList.forEach((mitra) => {
      const cadresForThisMitra = cadreMetrics.filter((item) => {
        if (item.cadre.partnershipId === mitra.uid) return true
        const cOrg = item.organizationName.toLowerCase().trim()
        const mOrg = (mitra.organization || mitra.displayName || '').toLowerCase().trim()
        return cOrg && mOrg && cOrg === mOrg
      })

      const sortedTop = cadresForThisMitra
        .sort((metricA, metricB) => metricB.respCount - metricA.respCount || metricB.avgScore - metricA.avgScore)
        .slice(0, 3)

      if (sortedTop.length > 0) {
        mitraGroups.push({
          mitra,
          topCadres: sortedTop,
        })
      }
    })

    const attachedUidSet = new Set<string>()
    mitraGroups.forEach((group) => group.topCadres.forEach((cadMetric) => attachedUidSet.add(cadMetric.cadre.uid)))

    const topIndependent = cadreMetrics
      .filter((cadMetric) => !attachedUidSet.has(cadMetric.cadre.uid) && cadMetric.respCount > 0)
      .sort((metricA, metricB) => metricB.respCount - metricA.respCount || metricB.avgScore - metricA.avgScore)
      .slice(0, 3)

    return { mitraGroups, topIndependent }
  }, [cadreMetrics, users])

  // 5. ALL CLASSIFIED ALERTS GROUPED BY MITRA & PAGINATED (MAX 10 CARDS PER PAGE)
  const allClassifiedAlertCards = useMemo<AlertCardItem[]>(() => {
    const cards: AlertCardItem[] = []

    // 1. Danger: Low score cadres (< 60%)
    cadreMetrics
      .filter((cadMetric) => cadMetric.respCount > 0 && cadMetric.avgScore < 60)
      .forEach((cadMetric) => {
        cards.push({
          id: `low_score_${cadMetric.cadre.uid}`,
          type: 'danger',
          categoryTitle: 'Peringatan Kritis Nilai Evaluasi (<60%)',
          mitraName: cadMetric.organizationName,
          title: `Evaluasi Pangan Rendah (${cadMetric.avgScore}%): ${cadMetric.cadre.displayName}`,
          desc: `Tingkat pemenuhan syarat evaluasi responden kader ${cadMetric.cadre.displayName} di bawah 60%. Perlu pembinaan & penyuluhan ulang.`,
          cadre: cadMetric.cadre,
          actionLabel: 'Inspeksi Progress',
        })
      })

    // 2. Warning: Zero response cadres
    cadreMetrics
      .filter((cadMetric) => cadMetric.respCount === 0)
      .forEach((cadMetric) => {
        cards.push({
          id: `zero_resp_${cadMetric.cadre.uid}`,
          type: 'warning',
          categoryTitle: 'Kader Belum Mengumpulkan Respon Lapangan',
          mitraName: cadMetric.organizationName,
          title: `Kader Belum Beraktivitas: ${cadMetric.cadre.displayName}`,
          desc: `Kader di bawah instansi ${cadMetric.organizationName} belum mengumpulkan tanggapan kuesioner evaluasi di lapangan.`,
          cadre: cadMetric.cadre,
          actionLabel: 'Inspeksi Kader',
        })
      })

    // 3. Warning: Empty Mitras
    mitraMetrics
      .filter((mitraMetric) => mitraMetric.cadreCount === 0)
      .forEach((mitraMetric) => {
        cards.push({
          id: `empty_mitra_${mitraMetric.mitra.uid}`,
          type: 'warning',
          categoryTitle: 'Instansi Mitra Belum Memiliki Kader',
          mitraName: mitraMetric.mitra.displayName,
          mitraUid: mitraMetric.mitra.uid,
          title: `Mitra Tanpa Kader: ${mitraMetric.mitra.displayName}`,
          desc: `Instansi ${mitraMetric.mitra.displayName} (${mitraMetric.mitra.partnershipType || 'Sekolah'}) belum mendaftarkan kader lapangan.`,
          actionLabel: 'Tugaskan Kader',
        })
      })

    // 4. Success: High performer cadres (Pass Rate >= 80%)
    cadreMetrics
      .filter((cadMetric) => cadMetric.respCount >= 3 && cadMetric.avgScore >= 80)
      .forEach((cadMetric) => {
        cards.push({
          id: `high_score_${cadMetric.cadre.uid}`,
          type: 'success',
          categoryTitle: 'Apresiasi Performa High Performer (≥80%)',
          mitraName: cadMetric.organizationName,
          title: `Apresiasi High Performer: ${cadMetric.cadre.displayName}`,
          desc: `Kader ${cadMetric.cadre.displayName} mencatatkan nilai evaluasi ${cadMetric.avgScore}% dengan Pass Rate ${cadMetric.passRate}%.`,
          cadre: cadMetric.cadre,
          actionLabel: 'Inspeksi Performa',
        })
      })

    return cards
  }, [cadreMetrics, mitraMetrics])

  // Group Alert Cards By Mitra Entity (As requested)
  const alertCardsGroupedByMitra = useMemo<AlertGroup[]>(() => {
    const map = new Map<string, { mitra?: UserProfile; cards: AlertCardItem[] }>()

    allClassifiedAlertCards.forEach((card) => {
      const key = card.mitraName || 'Independen'
      if (!map.has(key)) {
        const foundMitra = users.find(
          (userItem) =>
            userItem.role === 'partnership' &&
            (userItem.displayName === key || userItem.organization === key || userItem.uid === card.mitraUid)
        )
        map.set(key, { mitra: foundMitra, cards: [] })
      }
      map.get(key)!.cards.push(card)
    })

    return Array.from(map.entries()).map(([mitraName, group]) => ({
      mitraName,
      mitra: group.mitra,
      cards: group.cards,
    }))
  }, [allClassifiedAlertCards, users])

  return {
    cadreMetrics,
    mitraMetrics,
    stats,
    topContributorsByMitra,
    allClassifiedAlertCards,
    alertCardsGroupedByMitra,
  }
}
