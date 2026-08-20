'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/shared/safeFetch'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import { ProfileProgressModal } from '@/components/dashboard/ProfileProgressModal'
import { SkeletonOverview, SkeletonTable } from '@/components/ui/Skeleton'

type UserProfile = {
  uid: string
  email: string
  displayName: string
  role: string
  organization?: string
  partnershipType?: string
  phone?: string
  partnershipId?: string
  partnershipName?: string
  createdAt?: string
}

type ResponseSummary = {
  responseId: string
  distributionCode?: string
  formTitle?: string
  createdBy?: string
  cadreId?: string
  result?: {
    percentage?: number
    grade?: string
    thresholdTitle?: string
  }
  submittedAt?: string
}

type DistributionSummary = {
  distributionId: string
  code?: string
  distributionCode?: string
  formId?: string
  createdBy?: string
  cadreId?: string
  status?: string
  expiresAt?: string
  expiredAt?: string
}

type AlertCardItem = {
  id: string
  type: 'danger' | 'warning' | 'info' | 'success'
  categoryTitle: string
  mitraName: string
  mitraUid?: string
  title: string
  desc: string
  cadre?: UserProfile
  actionLabel?: string
}

export default function MonitoringDomainPage() {
  const { user, userData } = useAuth()
  const router = useRouter()
  const isSuperAdminOrAdmin = userData?.role === 'super_admin' || userData?.role === 'admin' || userData?.role === 'internal_bpom'
  const isCadre = userData?.role === 'cadre'
  const isPartnershipRole = userData?.role === 'partnership'

  const [activeTab, setActiveTab] = useState<'overview' | 'cadres' | 'mitra' | 'alerts'>('overview')

  const [users, setUsers] = useState<UserProfile[]>([])
  const [distributions, setDistributions] = useState<DistributionSummary[]>([])
  const [responses, setResponses] = useState<ResponseSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [mitraFilter, setMitraFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Pagination States for Cost & Performance Efficiency
  const [cadreCurrentPage, setCadreCurrentPage] = useState<number>(1)
  const cadrePageSize = 20 // Max 20 cadres per page

  const [alertCurrentPage, setAlertCurrentPage] = useState<number>(1)
  const alertPageSize = 10 // Max 10 alert cards per page

  // Inspection Modal State
  const [selectedCadreForInspect, setSelectedCadreForInspect] = useState<UserProfile | null>(null)

  // Fetch all Monitoring Data
  const loadMonitoringData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [usersRes, distRes, respRes] = await Promise.all([
        safeFetchJson('/api/auth/users'),
        safeFetchJson('/api/v1_5/distributions'),
        safeFetchJson('/api/v1_5/responses'),
      ])

      if (usersRes.ok && usersRes.data && Array.isArray(usersRes.data.users)) {
        setUsers(usersRes.data.users)
      }
      if (distRes.ok && distRes.data && Array.isArray(distRes.data.distributions)) {
        setDistributions(distRes.data.distributions)
      }
      if (respRes.ok && respRes.data && Array.isArray(respRes.data.responses)) {
        setResponses(respRes.data.responses)
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data monitoring.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMonitoringData()
  }, [])

  // 1. GRANULAR PER-CADRE CONTRIBUTION METRICS
  const cadreMetrics = useMemo(() => {
    const myOrg = (userData?.organization || userData?.displayName || '').toLowerCase().trim()
    const cadresList = users.filter((u) => {
      if (u.role !== 'cadre') return false
      if (isPartnershipRole) {
        const isMatchId = u.partnershipId === user?.uid
        const isMatchOrg = myOrg && u.organization && u.organization.toLowerCase().trim() === myOrg
        const isMatchPartName = myOrg && u.partnershipName && u.partnershipName.toLowerCase().trim() === myOrg
        return isMatchId || isMatchOrg || isMatchPartName
      }
      return true
    })

    return cadresList.map((cadre) => {
      const cadreDists = distributions.filter(
        (d) => d.createdBy === cadre.uid || d.cadreId === cadre.uid
      )

      const distCodesSet = new Set<string>()
      cadreDists.forEach((d) => {
        if (d.code) distCodesSet.add(String(d.code).toLowerCase().trim())
        if (d.distributionCode) distCodesSet.add(String(d.distributionCode).toLowerCase().trim())
        if (d.distributionId) distCodesSet.add(String(d.distributionId).toLowerCase().trim())
      })

      const cadreResponses = responses.filter((r) => {
        const code = String(r.distributionCode || '').toLowerCase().trim()
        return (code !== '' && distCodesSet.has(code)) || r.createdBy === cadre.uid || r.cadreId === cadre.uid
      })

      const scores = cadreResponses
        .map((r) => r.result?.percentage)
        .filter((s): s is number => typeof s === 'number')

      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      const passRate =
        cadreResponses.length > 0
          ? Math.round(
              (cadreResponses.filter((r) => r.result?.percentage && r.result.percentage >= 75).length /
                cadreResponses.length) *
                100
            )
          : 0

      const contributionPct =
        responses.length > 0 ? Math.round((cadreResponses.length / responses.length) * 100) : 0

      let status: 'high' | 'active' | 'attention' = 'attention'
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
  }, [users, distributions, responses, isPartnershipRole, user, userData])

  // 2. GRANULAR PER-MITRA CONTRIBUTION METRICS (CAPPED AT MAX 5 REPRESENTATIVE CADRES)
  const mitraMetrics = useMemo(() => {
    const partnersList = isPartnershipRole
      ? users.filter((u) => u.uid === user?.uid || u.role === 'partnership')
      : users.filter((u) => u.role === 'partnership')

    return partnersList.map((mitra) => {
      const linkedCadres = users.filter(
        (u) =>
          u.role === 'cadre' &&
          (u.partnershipId === mitra.uid ||
            (u.organization && u.organization.toLowerCase() === (mitra.organization || mitra.displayName).toLowerCase()))
      )

      const topRepresentativeCadres = linkedCadres
        .map((c) => {
          const m = cadreMetrics.find((cm) => cm.cadre.uid === c.uid)
          return m || { cadre: c, distCount: 0, respCount: 0, avgScore: 0, passRate: 0, status: 'attention' as const, contributionPct: 0, organizationName: mitra.displayName }
        })
        .sort((a, b) => b.respCount - a.respCount || b.avgScore - a.avgScore)
        .slice(0, 5)

      const cadreUids = new Set(linkedCadres.map((c) => c.uid))

      const mitraDists = distributions.filter(
        (d) => (d.createdBy && cadreUids.has(d.createdBy)) || (d.cadreId && cadreUids.has(d.cadreId))
      )

      const mitraDistCodes = new Set<string>()
      mitraDists.forEach((d) => {
        if (d.code) mitraDistCodes.add(String(d.code).toLowerCase().trim())
        if (d.distributionCode) mitraDistCodes.add(String(d.distributionCode).toLowerCase().trim())
      })

      const mitraResponses = responses.filter((r) => {
        const code = String(r.distributionCode || '').toLowerCase().trim()
        return (
          (code !== '' && mitraDistCodes.has(code)) ||
          (r.createdBy && cadreUids.has(r.createdBy)) ||
          (r.cadreId && cadreUids.has(r.cadreId))
        )
      })

      const scores = mitraResponses
        .map((r) => r.result?.percentage)
        .filter((s): s is number => typeof s === 'number')

      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

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
  }, [users, distributions, responses, isPartnershipRole, user, cadreMetrics])

  // 3. EXECUTIVE KPI OVERVIEW METRICS
  const stats = useMemo(() => {
    const totalMitra = isPartnershipRole ? 1 : users.filter((u) => u.role === 'partnership').length
    const totalCadres = cadreMetrics.length
    const totalDists = isPartnershipRole
      ? cadreMetrics.reduce((sum, c) => sum + c.distCount, 0)
      : distributions.length
    const totalResponses = isPartnershipRole
      ? cadreMetrics.reduce((sum, c) => sum + c.respCount, 0)
      : responses.length

    const activeCadresCount = cadreMetrics.filter((c) => c.respCount > 0).length
    const highPerfCadresCount = cadreMetrics.filter((c) => c.status === 'high').length

    const scores = responses.map((r) => r.result?.percentage).filter((s): s is number => typeof s === 'number')
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

    return { totalMitra, totalCadres, totalDists, totalResponses, activeCadresCount, highPerfCadresCount, avgScore }
  }, [users, distributions, responses, cadreMetrics, isPartnershipRole])

  // 4. TOP CONTRIBUTORS GROUPED BY MITRA (For Admin & Super Admin)
  const topContributorsByMitra = useMemo(() => {
    const partnersList = users.filter((u) => u.role === 'partnership')

    const mitraGroups: {
      mitra: UserProfile
      topCadres: (typeof cadreMetrics[0])[]
    }[] = []

    partnersList.forEach((mitra) => {
      const cadresForThisMitra = cadreMetrics.filter((item) => {
        if (item.cadre.partnershipId === mitra.uid) return true
        const cOrg = item.organizationName.toLowerCase().trim()
        const mOrg = (mitra.organization || mitra.displayName || '').toLowerCase().trim()
        return cOrg && mOrg && cOrg === mOrg
      })

      const sortedTop = cadresForThisMitra
        .sort((a, b) => b.respCount - a.respCount || b.avgScore - a.avgScore)
        .slice(0, 3)

      if (sortedTop.length > 0) {
        mitraGroups.push({
          mitra,
          topCadres: sortedTop,
        })
      }
    })

    const attachedUidSet = new Set<string>()
    mitraGroups.forEach((g) => g.topCadres.forEach((c) => attachedUidSet.add(c.cadre.uid)))

    const topIndependent = cadreMetrics
      .filter((c) => !attachedUidSet.has(c.cadre.uid) && c.respCount > 0)
      .sort((a, b) => b.respCount - a.respCount || b.avgScore - a.avgScore)
      .slice(0, 3)

    return { mitraGroups, topIndependent }
  }, [cadreMetrics, users])

  // 5. ALL CLASSIFIED ALERTS GROUPED BY MITRA & PAGINATED (MAX 10 CARDS PER PAGE)
  const allClassifiedAlertCards = useMemo(() => {
    const cards: AlertCardItem[] = []

    // 1. Danger: Low score cadres (< 60%)
    cadreMetrics
      .filter((c) => c.respCount > 0 && c.avgScore < 60)
      .forEach((c) => {
        cards.push({
          id: `low_score_${c.cadre.uid}`,
          type: 'danger',
          categoryTitle: 'Peringatan Kritis Nilai Evaluasi (<60%)',
          mitraName: c.organizationName,
          title: `Evaluasi Pangan Rendah (${c.avgScore}%): ${c.cadre.displayName}`,
          desc: `Tingkat pemenuhan syarat evaluasi responden kader ${c.cadre.displayName} di bawah 60%. Perlu pembinaan & penyuluhan ulang.`,
          cadre: c.cadre,
          actionLabel: 'Inspeksi Progress',
        })
      })

    // 2. Warning: Zero response cadres
    cadreMetrics
      .filter((c) => c.respCount === 0)
      .forEach((c) => {
        cards.push({
          id: `zero_resp_${c.cadre.uid}`,
          type: 'warning',
          categoryTitle: 'Kader Belum Mengumpulkan Respon Lapangan',
          mitraName: c.organizationName,
          title: `Kader Belum Beraktivitas: ${c.cadre.displayName}`,
          desc: `Kader di bawah instansi ${c.organizationName} belum mengumpulkan tanggapan kuesioner evaluasi di lapangan.`,
          cadre: c.cadre,
          actionLabel: 'Inspeksi Kader',
        })
      })

    // 3. Warning: Empty Mitras
    mitraMetrics
      .filter((m) => m.cadreCount === 0)
      .forEach((m) => {
        cards.push({
          id: `empty_mitra_${m.mitra.uid}`,
          type: 'warning',
          categoryTitle: 'Instansi Mitra Belum Memiliki Kader',
          mitraName: m.mitra.displayName,
          mitraUid: m.mitra.uid,
          title: `Mitra Tanpa Kader: ${m.mitra.displayName}`,
          desc: `Instansi ${m.mitra.displayName} (${m.mitra.partnershipType || 'Sekolah'}) belum mendaftarkan kader lapangan.`,
          actionLabel: 'Tugaskan Kader',
        })
      })

    // 4. Success: High performer cadres (Pass Rate >= 80%)
    cadreMetrics
      .filter((c) => c.respCount >= 3 && c.avgScore >= 80)
      .forEach((c) => {
        cards.push({
          id: `high_score_${c.cadre.uid}`,
          type: 'success',
          categoryTitle: 'Apresiasi Performa High Performer (≥80%)',
          mitraName: c.organizationName,
          title: `Apresiasi High Performer: ${c.cadre.displayName}`,
          desc: `Kader ${c.cadre.displayName} mencatatkan nilai evaluasi ${c.avgScore}% dengan Pass Rate ${c.passRate}%.`,
          cadre: c.cadre,
          actionLabel: 'Inspeksi Performa',
        })
      })

    return cards
  }, [cadreMetrics, mitraMetrics])

  // Group Alert Cards By Mitra Entity (As requested)
  const alertCardsGroupedByMitra = useMemo(() => {
    const map = new Map<string, { mitra?: UserProfile; cards: AlertCardItem[] }>()

    allClassifiedAlertCards.forEach((card) => {
      const key = card.mitraName || 'Independen'
      if (!map.has(key)) {
        const foundMitra = users.find(
          (u) =>
            u.role === 'partnership' &&
            (u.displayName === key || u.organization === key || u.uid === card.mitraUid)
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

  // Alerts Pagination Math (Max 10 cards per page)
  const alertTotalPages = Math.ceil(allClassifiedAlertCards.length / alertPageSize) || 1
  const paginatedAlertCards = useMemo(() => {
    const start = (alertCurrentPage - 1) * alertPageSize
    return allClassifiedAlertCards.slice(start, start + alertPageSize)
  }, [allClassifiedAlertCards, alertCurrentPage, alertPageSize])

  // Filtered & Ranked Cadre Metrics (Sorted for Leaderboard)
  const filteredRankedCadreMetrics = useMemo(() => {
    const filtered = cadreMetrics.filter((item) => {
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        item.cadre.displayName.toLowerCase().includes(term) ||
        item.cadre.email.toLowerCase().includes(term) ||
        item.organizationName.toLowerCase().includes(term)

      const matchesMitra =
        mitraFilter === 'all' ||
        item.cadre.partnershipId === mitraFilter ||
        item.organizationName.toLowerCase() === mitraFilter.toLowerCase()

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter

      return matchesSearch && matchesMitra && matchesStatus
    })

    // Sort strictly by Leaderboard score & response count
    return filtered.sort((a, b) => b.respCount - a.respCount || b.avgScore - a.avgScore)
  }, [cadreMetrics, searchTerm, mitraFilter, statusFilter])

  // Cadre Leaderboard Pagination Math (Max 20 cadres per page)
  const cadreTotalPages = Math.ceil(filteredRankedCadreMetrics.length / cadrePageSize) || 1
  const paginatedCadreLeaderboard = useMemo(() => {
    const start = (cadreCurrentPage - 1) * cadrePageSize
    return filteredRankedCadreMetrics.slice(start, start + cadrePageSize)
  }, [filteredRankedCadreMetrics, cadreCurrentPage, cadrePageSize])

  // Reset pagination when search/filters change
  useEffect(() => {
    setCadreCurrentPage(1)
  }, [searchTerm, mitraFilter, statusFilter])

  // =========================================================================
  // VIEW 1: CADRE PERSONALIZED DASHBOARD VIEW
  // =========================================================================
  if (isCadre) {
    const myMetric = cadreMetrics.find((c) => c.cadre.uid === user?.uid) || {
      cadre: { displayName: user?.displayName || user?.email || 'Kader Lapangan', email: user?.email || '', organization: (userData as any)?.organization },
      distCount: distributions.filter((d) => d.createdBy === user?.uid || d.cadreId === user?.uid).length,
      respCount: responses.filter((r) => r.createdBy === user?.uid || r.cadreId === user?.uid).length,
      avgScore: 0,
      passRate: 0,
      contributionPct: 0,
      status: 'active' as const,
      organizationName: (userData as any)?.organization || 'Mandiri',
    }

    return (
      <div className="min-h-screen bg-[#080812] text-slate-100 font-sans flex flex-col">
        <Topbar title="Monitoring & Performa Saya" subtitle="Analisis Real-Time Distribusi, Responden, & Insight Lapangan Kader" />

        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* CADRE WELCOME HEADER */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-950/60 via-slate-900 to-slate-950 border border-violet-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Icon name="checkCircle" className="w-3 h-3 text-emerald-400" />
                  KADER LAPANGAN AKTIF
                </span>
                <span className="text-xs font-mono text-slate-400">{(userData as any)?.organization || 'Kemitraan BPOM'}</span>
              </div>
              <h1 className="text-xl font-bold font-display text-white">{user?.displayName || 'Kader Lapangan'}</h1>
              <p className="text-xs text-slate-400">Pantau performa distribusi kode dan kualitas evaluasi pangan responden Anda.</p>
            </div>

            <button
              onClick={() => router.push('/dashboard/distributions')}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/10 shrink-0"
            >
              <Icon name="plus" className="w-4 h-4" />
              + Buat Kode Distribusi
            </button>
          </div>

          {/* CADRE PERSONAL KPI GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">Kode Distribusi Saya</span>
              <p className="text-3xl font-black font-mono text-cyan-200">{myMetric.distCount}</p>
              <p className="text-[11px] text-slate-400 font-mono">Kode Tersebar</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono text-violet-300 uppercase font-bold tracking-wider">Responden Terjaring</span>
              <p className="text-3xl font-black font-mono text-violet-200">{myMetric.respCount}</p>
              <p className="text-[11px] text-slate-400 font-mono">Tanggapan Dikumpulkan</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">Rata-Rata Nilai</span>
              <p className="text-3xl font-black font-mono text-emerald-200">{myMetric.avgScore}%</p>
              <p className="text-[11px] text-slate-400 font-mono">Skor Keamanan Pangan</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono text-amber-300 uppercase font-bold tracking-wider">Pass Rate (%)</span>
              <p className="text-3xl font-black font-mono text-amber-200">{myMetric.passRate}%</p>
              <p className="text-[11px] text-slate-400 font-mono">Memenuhi Syarat (MS)</p>
            </div>
          </div>

          {/* CADRE ACTIONABLE FIELD INSIGHT CARD */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Icon name="sparkles" className="w-4 h-4 text-cyan-400" />
                Insight & Rekomendasi Edukasi Lapangan Saya
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                REKOMENDASI REAL-TIME
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-300 leading-relaxed">
              <p>
                {myMetric.respCount === 0
                  ? 'Belum ada tanggapan evaluasi yang terkumpul melalui kode distribusi Anda. Bagikan kode/link distribusi Anda ke sekolah atau tempat pengolahan pangan sasaran.'
                  : myMetric.avgScore >= 80
                  ? `Sangat Baik! Responden Anda mencatatkan rata-rata nilai ${myMetric.avgScore}% (${myMetric.passRate}% Pass Rate). Pertahankan kualitas pendampingan!`
                  : `Rata-rata nilai evaluasi responden Anda saat ini adalah ${myMetric.avgScore}%. Disarankan untuk mengarahkan responden ke Artikel Edukasi Keamanan Pangan BPOM.`}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <button
                onClick={() => router.push('/dashboard/articles')}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <Icon name="bookOpen" className="w-3.5 h-3.5" />
                Bagikan Materi Edukasi CMS →
              </button>

              <button
                onClick={() => router.push('/dashboard/responses')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <Icon name="checkCircle" className="w-3.5 h-3.5 text-emerald-400" />
                Inspeksi Tanggapan Responden Saya →
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // =========================================================================
  // VIEW 2: MITRA ROLE LOGIN -> SINGLE INTEGRATED MONITORING PAGE (NO TABS)
  // =========================================================================
  if (isPartnershipRole) {
    return (
      <div className="min-h-screen bg-[#080812] text-slate-100 font-sans flex flex-col">
        <Topbar
          title={`Monitoring Operasional: ${userData?.organization || userData?.displayName || 'Instansi Mitra'}`}
          subtitle={`Pusat Kendali Monitoring Performa Kader & Kualitas Evaluasi Pangan ${userData?.organization || ''}`}
        />

        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* SECTION 1: HERO OVERVIEW & METRICS FOR MITRA */}
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/60 to-slate-900 border border-purple-500/30 p-6 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-extrabold text-slate-100 tracking-wide">
                    {userData?.organization || userData?.displayName || 'Instansi Mitra BPOM'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-extrabold">
                    {userData?.partnershipType || 'Sekolah'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    PARTNER MONITORING HUB
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Email Login: {user?.email} • Kontak HP/WA: <span className="text-cyan-300 font-bold">{(userData as any)?.phone || '-'}</span>
                </p>
              </div>
            </div>

            {/* 4 HIGH-VALUE METRIC PODS FOR MITRA */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-1 shadow-sm">
                <span className="text-[10px] font-mono text-purple-300 uppercase font-bold tracking-wider">Kader Binaan Aktif</span>
                <p className="text-2xl font-bold font-mono text-slate-100">{cadreMetrics.length}</p>
                <span className="text-[10px] text-purple-300 font-mono">Orang Terdaftar</span>
              </div>

              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-1 shadow-sm">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">Total Kode Distribusi</span>
                <p className="text-2xl font-bold font-mono text-cyan-300">{stats.totalDists}</p>
                <span className="text-[10px] text-cyan-400 font-mono">Kode Tersebar</span>
              </div>

              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-1 shadow-sm">
                <span className="text-[10px] font-mono text-purple-300 uppercase font-bold tracking-wider">Respon Terkumpul</span>
                <p className="text-2xl font-bold font-mono text-purple-300">{stats.totalResponses}</p>
                <span className="text-[10px] text-slate-400 font-mono">Tanggapan Dikumpulkan</span>
              </div>

              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-1 shadow-sm">
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">Rata-Rata Nilai</span>
                <p className="text-2xl font-bold font-mono text-emerald-300">{stats.avgScore}%</p>
                <span className="text-[10px] text-emerald-400 font-mono">Skor Evaluasi Pangan</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: TOP KONTRIBUTOR KADER BINAAN INSTANSI INI */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Icon name="award" className="w-5 h-5 text-purple-400" />
                <span>Top Kontributor Kader Binaan Instansi Ini</span>
              </h3>
              <span className="text-xs font-mono text-purple-300 font-bold bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-xl">
                {cadreMetrics.length} Kader Binaan
              </span>
            </div>

            {cadreMetrics.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs bg-slate-950 rounded-2xl border border-slate-800">
                Belum ada kader terdaftar di bawah instansi ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cadreMetrics
                  .sort((a, b) => b.respCount - a.respCount || b.avgScore - a.avgScore)
                  .slice(0, 3)
                  .map((item, idx) => (
                    <div key={item.cadre.uid} className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-3">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-extrabold">
                          RANK #{idx + 1} KADER BEST
                        </span>
                        <span className="text-emerald-400 font-bold">{item.avgScore}% Skor</span>
                      </div>

                      <div>
                        <p className="font-bold text-slate-100 text-sm">{item.cadre.displayName}</p>
                        <p className="text-xs text-slate-400 font-mono truncate">{item.cadre.email}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-slate-500 block">Respon:</span>
                          <span className="font-bold text-cyan-300">{item.respCount} Tanggapan</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Pass Rate:</span>
                          <span className="font-bold text-emerald-400">{item.passRate}%</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedCadreForInspect(item.cadre)}
                        className="w-full py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold transition-colors"
                      >
                        Inspeksi Performa →
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* SECTION 3: TABEL PERFORMA & MONITORING SELURUH KADER BINAAN */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <Icon name="users" className="w-4 h-4 text-cyan-400" />
                  <span>Daftar & Data Performa Monitoring Seluruh Kader Binaan ({cadreMetrics.length})</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Inspeksi jumlah kode distribusi, tanggapan terkumpul, dan rata-rata skor evaluasi kader Anda.
                </p>
              </div>
            </div>

            {cadreMetrics.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-mono text-xs bg-slate-950 rounded-2xl border border-slate-800 p-8 space-y-2">
                <Icon name="users" className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-bold text-slate-300">Belum Ada Kader Terdaftar Untuk Instansi Ini</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-xs font-mono text-left">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-3.5 border-b border-slate-800">Nama Kader Lapangan</th>
                      <th className="p-3.5 border-b border-slate-800">Email Login</th>
                      <th className="p-3.5 border-b border-slate-800 text-center">Kode Distribusi</th>
                      <th className="p-3.5 border-b border-slate-800 text-center">Respon Dikumpulkan</th>
                      <th className="p-3.5 border-b border-slate-800 text-center">Rata-Rata Nilai</th>
                      <th className="p-3.5 border-b border-slate-800 text-right">Aksi Inspeksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {cadreMetrics.map((item) => (
                      <tr key={item.cadre.uid} className="hover:bg-slate-900/60 transition-colors">
                        <td className="p-3.5 font-bold text-slate-100">{item.cadre.displayName}</td>
                        <td className="p-3.5 text-slate-400">{item.cadre.email}</td>
                        <td className="p-3.5 text-center font-bold text-slate-300">{item.distCount} Kode</td>
                        <td className="p-3.5 text-center font-bold text-cyan-300">{item.respCount} Respon</td>
                        <td className="p-3.5 text-center font-bold text-emerald-400">
                          {item.respCount > 0 ? `${item.avgScore}%` : '-'}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedCadreForInspect(item.cadre)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold text-[11px] transition-colors"
                          >
                            Inspeksi Progress
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* INSPECTION PROGRESS MODAL */}
          {selectedCadreForInspect && (
            <ProfileProgressModal
              isOpen={Boolean(selectedCadreForInspect)}
              onClose={() => setSelectedCadreForInspect(null)}
              userOverride={{
                uid: selectedCadreForInspect.uid,
                displayName: selectedCadreForInspect.displayName,
                email: selectedCadreForInspect.email,
                role: selectedCadreForInspect.role,
                organization: selectedCadreForInspect.organization,
                partnershipType: selectedCadreForInspect.partnershipType,
              }}
            />
          )}
        </main>
      </div>
    )
  }

  // =========================================================================
  // VIEW 3: SUPER ADMIN / ADMIN SYSTEMS / BPOM MULTI-TAB MONITORING PAGE
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#080812] text-slate-100 font-sans flex flex-col">
      <Topbar
        title="Domain Monitoring Command Center"
        subtitle="Super Admin Level Analysis: Per-Cadre & Per-Mitra Contribution Engine"
      />

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* DOMAIN HEADER & NAVIGATION TABS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/[0.06] backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-display text-white tracking-wide">Domain Monitoring</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                SUPER ADMIN LEVEL ANALYTICS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pusat komando analisis kontribusi mendalam per-Kader Lapangan dan per-Mitra Instansi.
            </p>
          </div>

          {/* NAVIGATION TABS */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex-wrap">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                activeTab === 'overview'
                  ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon name="dashboard" className="w-3.5 h-3.5" />
              Overview KPI
            </button>

            <button
              onClick={() => setActiveTab('cadres')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                activeTab === 'cadres'
                  ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon name="award" className="w-3.5 h-3.5" />
              Leaderboard Kader ({cadreMetrics.length})
            </button>

            <button
              onClick={() => setActiveTab('mitra')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                activeTab === 'mitra'
                  ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon name="building" className="w-3.5 h-3.5" />
              Analisis Per-Mitra ({mitraMetrics.length})
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                activeTab === 'alerts'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon name="alertCircle" className="w-3.5 h-3.5" />
              Alert Dipisah Per-Mitra ({allClassifiedAlertCards.length})
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR FOR CADRES & MITRA */}
        {(activeTab === 'cadres' || activeTab === 'mitra') && (
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/40 p-3.5 rounded-xl border border-slate-800">
            <div className="flex flex-1 items-center gap-3 w-full">
              <div className="relative flex-1">
                <Icon name="search" className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={activeTab === 'cadres' ? 'Cari nama kader, email, instansi...' : 'Cari nama mitra...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>

              {activeTab === 'cadres' && (
                <>
                  <select
                    value={mitraFilter}
                    onChange={(e) => setMitraFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="all">Semua Mitra Instansi</option>
                    {mitraMetrics.map((m) => (
                      <option key={m.mitra.uid} value={m.mitra.displayName}>
                        {m.mitra.displayName}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="all">Semua Level Kontribusi</option>
                    <option value="high">High Contributor (≥5 Respon)</option>
                    <option value="active">Aktif (≥1 Respon)</option>
                    <option value="attention">Perlu Atensi (0 Respon)</option>
                  </select>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: EXECUTIVE OVERVIEW KPI & TOP KONTRIBUTOR DIPISAHKAN PER-MITRA */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-950 border border-violet-500/30 space-y-2">
                <span className="text-[10px] font-mono text-violet-300 uppercase font-bold tracking-wider">Total Kader Lapangan</span>
                <p className="text-3xl font-black font-mono text-violet-200">{stats.totalCadres}</p>
                <p className="text-[11px] text-slate-400 font-mono">
                  <span className="text-emerald-400 font-bold">{stats.activeCadresCount}</span> Kader Aktif Berkontribusi
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 space-y-2">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">Total Mitra Instansi</span>
                <p className="text-3xl font-black font-mono text-cyan-200">{stats.totalMitra}</p>
                <p className="text-[11px] text-slate-400 font-mono">Sponsorship / Mitra</p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-2">
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">Rata-Rata Nilai Evaluasi</span>
                <p className="text-3xl font-black font-mono text-emerald-200">{stats.avgScore}%</p>
                <p className="text-[11px] text-slate-400 font-mono">Seluruh Kader & Responden</p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 space-y-2">
                <span className="text-[10px] font-mono text-amber-300 uppercase font-bold tracking-wider">Total Tanggapan Terkumpul</span>
                <p className="text-3xl font-black font-mono text-amber-200">{stats.totalResponses}</p>
                <p className="text-[11px] text-slate-400 font-mono">Terkumpul oleh Kader</p>
              </div>
            </div>

            {/* TOP KONTRIBUTOR KADER DIPISAHKAN PER-MITRA */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Icon name="award" className="w-5 h-5 text-amber-400" />
                    <span>Top Kontributor Kader Lapangan (Dipisahkan Per-Mitra Instansi)</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Peringkat kontributor kader terbaik yang dikelompokkan secara terpisah untuk setiap Mitra Instansi.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('cadres')}
                  className="text-xs font-mono text-cyan-400 hover:underline shrink-0"
                >
                  Buka Leaderboard Kader ({stats.totalCadres}) →
                </button>
              </div>

              {/* ITERATE TOP CONTRIBUTORS PER MITRA */}
              <div className="space-y-6">
                {topContributorsByMitra.mitraGroups.map(({ mitra, topCadres }) => (
                  <div key={mitra.uid} className="rounded-2xl bg-slate-950 border border-slate-800/80 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                          <Icon name="building" className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-100">{mitra.displayName}</h4>
                          <p className="text-[11px] text-slate-400 font-mono">{mitra.partnershipType || 'Instansi'} • {mitra.email}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-mono font-bold">
                        {topCadres.length} Top Kontributor
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {topCadres.map((item, idx) => (
                        <div key={item.cadre.uid} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center gap-1">
                              <Icon name="trophy" className="w-3 h-3 text-amber-400" />
                              RANK #{idx + 1} BEST
                            </span>
                            <span className="text-emerald-400 font-bold">{item.avgScore}% Skor</span>
                          </div>

                          <div>
                            <p className="font-bold text-slate-100 text-xs">{item.cadre.displayName}</p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">{item.cadre.email}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-950 p-2 rounded-lg">
                            <div>
                              <span className="text-slate-500 block">Respon:</span>
                              <span className="font-bold text-cyan-300">{item.respCount} Tanggapan</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Pass Rate:</span>
                              <span className="font-bold text-emerald-400">{item.passRate}%</span>
                            </div>
                          </div>

                          <button
                            onClick={() => setSelectedCadreForInspect(item.cadre)}
                            className="w-full py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold transition-colors"
                          >
                            Inspeksi Kontribusi →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {topContributorsByMitra.topIndependent.length > 0 && (
                  <div className="rounded-2xl bg-slate-950 border border-slate-800/80 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Icon name="user" className="w-4 h-4 text-slate-300" />
                        <h4 className="font-bold text-sm text-slate-200">Kader Lapangan Independen / Tanpa Mitra Induk</h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {topContributorsByMitra.topIndependent.map((item, idx) => (
                        <div key={item.cadre.uid} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold flex items-center gap-1">
                              <Icon name="award" className="w-3 h-3 text-slate-400" />
                              INDIE #{idx + 1}
                            </span>
                            <span className="text-emerald-400 font-bold">{item.avgScore}% Skor</span>
                          </div>

                          <div>
                            <p className="font-bold text-slate-100 text-xs">{item.cadre.displayName}</p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">{item.cadre.email}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-950 p-2 rounded-lg">
                            <div>
                              <span className="text-slate-500 block">Respon:</span>
                              <span className="font-bold text-cyan-300">{item.respCount} Tanggapan</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Pass Rate:</span>
                              <span className="font-bold text-emerald-400">{item.passRate}%</span>
                            </div>
                          </div>

                          <button
                            onClick={() => setSelectedCadreForInspect(item.cadre)}
                            className="w-full py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold transition-colors"
                          >
                            Inspeksi Kontribusi →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LEADERBOARD KADER LAPANGAN (PAGINATED AT MAX 20 CADRES PER PAGE) */}
        {activeTab === 'cadres' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Icon name="award" className="w-4.5 h-4.5 text-amber-400" />
                <span className="font-bold text-slate-200">Leaderboard Kontribusi Kader Lapangan Nasional</span>
              </div>
              <span className="text-cyan-400 font-bold">Total: {filteredRankedCadreMetrics.length} Kader</span>
            </div>

            {isLoading ? (
              <SkeletonTable rows={6} cols={8} />
            ) : filteredRankedCadreMetrics.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-mono text-xs bg-slate-900/40 rounded-2xl border border-slate-800 p-8">
                Tidak ada data kader ditemukan untuk filter ini.
              </div>
            ) : (
              <div className="space-y-4">
                {/* LEADERBOARD CARD LIST */}
                <div className="space-y-3">
                  {paginatedCadreLeaderboard.map((item, idx) => {
                    const globalRank = (cadreCurrentPage - 1) * cadrePageSize + idx + 1
                    const isTop1 = globalRank === 1
                    const isTop2 = globalRank === 2
                    const isTop3 = globalRank === 3

                    return (
                      <div
                        key={item.cadre.uid}
                        className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isTop1
                            ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/50 shadow-xl shadow-amber-950/20'
                            : isTop2
                            ? 'bg-gradient-to-r from-slate-800/40 via-slate-900 to-slate-950 border-slate-400/40 shadow-lg'
                            : isTop3
                            ? 'bg-gradient-to-r from-orange-950/30 via-slate-900 to-slate-950 border-orange-500/40 shadow-md'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* RANK & CADRE INFO */}
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 border font-mono ${
                              isTop1
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                : isTop2
                                ? 'bg-slate-700/30 border-slate-400/40 text-slate-200'
                                : isTop3
                                ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                                : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}
                          >
                            {isTop1 ? (
                              <Icon name="trophy" className="w-5 h-5 text-amber-400" />
                            ) : isTop2 ? (
                              <Icon name="award" className="w-5 h-5 text-slate-300" />
                            ) : isTop3 ? (
                              <Icon name="award" className="w-5 h-5 text-orange-400" />
                            ) : (
                              `#${globalRank}`
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-slate-100">{item.cadre.displayName}</h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                🏢 {item.organizationName}
                              </span>
                              {isTop1 && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  CHAMPION #1
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 font-mono">{item.cadre.email}</p>
                          </div>
                        </div>

                        {/* METRICS & ACTIONS */}
                        <div className="flex items-center gap-4 flex-wrap self-end md:self-auto justify-between md:justify-end w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                          <div className="flex items-center gap-3 font-mono text-xs">
                            <div className="text-center px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                              <span className="text-[10px] text-slate-500 block">Kode Dibuat</span>
                              <span className="font-bold text-slate-300">{item.distCount} Kode</span>
                            </div>

                            <div className="text-center px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                              <span className="text-[10px] text-slate-500 block">Respon Terjaring</span>
                              <span className="font-bold text-cyan-300">{item.respCount} Respon</span>
                            </div>

                            <div className="text-center px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                              <span className="text-[10px] text-slate-500 block">Pass Rate</span>
                              <span className="font-bold text-emerald-400">{item.passRate}%</span>
                            </div>

                            <div className="text-center px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                              <span className="text-[10px] text-slate-500 block">Skor Evaluasi</span>
                              <span className="font-bold text-emerald-300">{item.respCount > 0 ? `${item.avgScore}%` : '-'}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => setSelectedCadreForInspect(item.cadre)}
                            className="px-3.5 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold text-xs font-mono transition-colors shrink-0"
                          >
                            Inspeksi Kontribusi →
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* CADRE LEADERBOARD PAGINATION CONTROLS (MAX 20 CADRES PER PAGE) */}
                {cadreTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 text-xs font-mono">
                    <button
                      disabled={cadreCurrentPage === 1}
                      onClick={() => setCadreCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-30 text-slate-300 hover:text-white"
                    >
                      ← Leaderboard Sebelumnya
                    </button>
                    <span className="text-slate-400">
                      Halaman Leaderboard <strong className="text-cyan-400">{cadreCurrentPage}</strong> dari <strong>{cadreTotalPages}</strong>
                    </span>
                    <button
                      disabled={cadreCurrentPage === cadreTotalPages}
                      onClick={() => setCadreCurrentPage((p) => Math.min(cadreTotalPages, p + 1))}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-30 text-slate-300 hover:text-white"
                    >
                      Leaderboard Selanjutnya →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DEEP PER-MITRA ANALYSIS TABLE (WITH MAX 5 REPRESENTATIVE CADRES PER MITRA) */}
        {activeTab === 'mitra' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono">
              <p className="font-bold text-sm text-purple-200">Mode Analisis Per-Mitra Instansi</p>
              <p className="text-purple-300/80 mt-0.5">
                Rincian mitra instansi menampilkan maksimal <strong>5 kader perwakilan teratas (*top 5 representative cadres*)</strong> per mitra untuk efisiensi beban browser & resource memory.
              </p>
            </div>

            <div className="space-y-4">
              {mitraMetrics.map((item) => (
                <div key={item.mitra.uid} className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold">
                        <Icon name="building" className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-100">{item.mitra.displayName}</h3>
                        <p className="text-xs text-slate-400 font-mono">{item.mitra.email} • {item.mitra.partnershipType || 'Instansi'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-cyan-300">
                        {item.cadreCount} Kader Terikat
                      </span>
                      <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-purple-300">
                        {item.respCount} Tanggapan
                      </span>
                      <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-400">
                        {item.avgScore}% Rata-Rata Nilai
                      </span>
                    </div>
                  </div>

                  {/* MAX 5 TOP REPRESENTATIVE CADRES UNDER THIS MITRA */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <h4 className="font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Icon name="users" className="w-3.5 h-3.5 text-cyan-400" />
                        Perwakilan 5 Kader Teratas Performa ({Math.min(5, item.topRepresentativeCadres.length)} / {item.cadreCount})
                      </h4>
                      {item.cadreCount > 5 && (
                        <span className="text-slate-500 font-bold">+ {item.cadreCount - 5} kader lainnya</span>
                      )}
                    </div>

                    {item.topRepresentativeCadres.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500 font-mono text-center">
                        Belum ada kader terdaftar di bawah mitra ini.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                        <table className="w-full text-xs font-mono text-left">
                          <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px]">
                            <tr>
                              <th className="p-3 border-b border-slate-800">Nama Kader Perwakilan</th>
                              <th className="p-3 border-b border-slate-800">Email</th>
                              <th className="p-3 border-b border-slate-800 text-center">Kode Dibuat</th>
                              <th className="p-3 border-b border-slate-800 text-center">Respon Dikumpulkan</th>
                              <th className="p-3 border-b border-slate-800 text-center">Rata-Rata Skor</th>
                              <th className="p-3 border-b border-slate-800 text-right">Aksi Inspeksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {item.topRepresentativeCadres.map((c) => (
                              <tr key={c.cadre.uid} className="hover:bg-slate-900/60 transition-colors">
                                <td className="p-3 font-bold text-slate-100">{c.cadre.displayName}</td>
                                <td className="p-3 text-slate-400">{c.cadre.email}</td>
                                <td className="p-3 text-center font-bold text-slate-300">{c.distCount} Kode</td>
                                <td className="p-3 text-center font-bold text-cyan-300">{c.respCount} Respon</td>
                                <td className="p-3 text-center font-bold text-emerald-400">{c.respCount > 0 ? `${c.avgScore}%` : '-'}</td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => setSelectedCadreForInspect(c.cadre)}
                                    className="px-2.5 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold"
                                  >
                                    Inspeksi
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ACTIONABLE ALERTS GROUPED & SEPARATED BY MITRA (MAX 10 CARDS PER PAGE) */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Icon name="alertCircle" className="w-4 h-4 text-amber-400" />
                  Alert & Insight Lapangan (Dipisahkan Per-Mitra Instansi)
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Seluruh kartu alert dikelompokkan secara terpisah untuk setiap Mitra Instansi (Max 10 kartu per halaman).
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                Total Alert Active: {allClassifiedAlertCards.length} Kartu
              </span>
            </div>

            {/* ALERT CARDS GROUPED BY MITRA INSTANSI */}
            {alertCardsGroupedByMitra.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-emerald-400 font-mono flex items-center justify-center gap-2">
                <Icon name="checkCircle" className="w-5 h-5 text-emerald-400" />
                <span>Seluruh kondisi operasional lapangan terpantau optimal. Tidak ada alert peringatan kritis.</span>
              </div>
            ) : (
              <div className="space-y-6">
                {alertCardsGroupedByMitra.map(({ mitraName, mitra, cards }) => (
                  <div key={mitraName} className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                          <Icon name="building" className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-100">{mitraName}</h4>
                          {mitra && (
                            <p className="text-[11px] text-slate-400 font-mono">{mitra.partnershipType} • {mitra.email}</p>
                          )}
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono font-bold">
                        {cards.length} Alert Active
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {cards.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-4 rounded-2xl border backdrop-blur-md transition-all flex flex-col justify-between space-y-3 ${
                            alert.type === 'danger'
                              ? 'bg-rose-950/20 border-rose-500/40 shadow-md shadow-rose-950/20'
                              : alert.type === 'warning'
                              ? 'bg-amber-950/20 border-amber-500/40 shadow-md shadow-amber-950/20'
                              : 'bg-emerald-950/20 border-emerald-500/40 shadow-md shadow-emerald-950/20'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase tracking-wider ${
                                  alert.type === 'danger'
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                    : alert.type === 'warning'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                }`}
                              >
                                {alert.categoryTitle}
                              </span>
                            </div>

                            <div>
                              <h5 className="font-bold text-xs text-slate-100">{alert.title}</h5>
                              <p className="text-[11px] text-slate-300 font-mono mt-1 leading-relaxed bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                                {alert.desc}
                              </p>
                            </div>
                          </div>

                          {alert.cadre && alert.actionLabel && (
                            <button
                              onClick={() => setSelectedCadreForInspect(alert.cadre!)}
                              className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5 border border-slate-700/50"
                            >
                              <Icon name="eye" className="w-3.5 h-3.5 text-cyan-400" />
                              {alert.actionLabel} →
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* ALERT PAGINATION CONTROLS (MAX 10 CARDS PER PAGE) */}
                {alertTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-2 text-xs font-mono">
                    <button
                      disabled={alertCurrentPage === 1}
                      onClick={() => setAlertCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-30 text-slate-300 hover:text-white"
                    >
                      ← Halaman Alert Sebelumnya
                    </button>
                    <span className="text-slate-400">
                      Halaman Kartu <strong className="text-amber-400">{alertCurrentPage}</strong> dari <strong>{alertTotalPages}</strong>
                    </span>
                    <button
                      disabled={alertCurrentPage === alertTotalPages}
                      onClick={() => setAlertCurrentPage((p) => Math.min(alertTotalPages, p + 1))}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-30 text-slate-300 hover:text-white"
                    >
                      Halaman Alert Selanjutnya →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* INSPECTION PROGRESS MODAL */}
        {selectedCadreForInspect && (
          <ProfileProgressModal
            isOpen={Boolean(selectedCadreForInspect)}
            onClose={() => setSelectedCadreForInspect(null)}
            userOverride={{
              uid: selectedCadreForInspect.uid,
              displayName: selectedCadreForInspect.displayName,
              email: selectedCadreForInspect.email,
              role: selectedCadreForInspect.role,
              organization: selectedCadreForInspect.organization,
              partnershipType: selectedCadreForInspect.partnershipType,
            }}
          />
        )}
      </main>
    </div>
  )
}
