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

export default function MonitoringDomainPage() {
  const { user, userData } = useAuth()
  const router = useRouter()
  const isSuperAdminOrAdmin = userData?.role === 'super_admin' || userData?.role === 'admin' || userData?.role === 'internal_bpom'
  const isCadre = userData?.role === 'cadre'
  const isPartnershipRole = userData?.role === 'partnership'

  const [activeTab, setActiveTab] = useState<'overview' | 'cadres' | 'mitra' | 'trends' | 'alerts'>('overview')

  const [users, setUsers] = useState<UserProfile[]>([])
  const [distributions, setDistributions] = useState<DistributionSummary[]>([])
  const [responses, setResponses] = useState<ResponseSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [mitraFilter, setMitraFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

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
      // Find distributions created by this cadre
      const cadreDists = distributions.filter(
        (d) => d.createdBy === cadre.uid || d.cadreId === cadre.uid
      )

      // Codes owned by cadre
      const distCodesSet = new Set<string>()
      cadreDists.forEach((d) => {
        if (d.code) distCodesSet.add(String(d.code).toLowerCase().trim())
        if (d.distributionCode) distCodesSet.add(String(d.distributionCode).toLowerCase().trim())
        if (d.distributionId) distCodesSet.add(String(d.distributionId).toLowerCase().trim())
      })

      // Find evaluation responses collected by this cadre
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
        organizationName: cadre.organization || cadre.partnershipName || 'Mandiri',
      }
    })
  }, [users, distributions, responses, isPartnershipRole, user, userData])

  // 2. GRANULAR PER-MITRA CONTRIBUTION METRICS
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
        distCount: mitraDists.length,
        respCount: mitraResponses.length,
        avgScore,
        status: linkedCadres.length > 0 ? (mitraResponses.length >= 5 ? 'Sangat Produktif' : 'Aktif') : 'Perlu Penugasan Kader',
      }
    })
  }, [users, distributions, responses, isPartnershipRole, user])

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

  // 4. GRANULAR PER-CADRE & PER-MITRA ACTIONABLE ALERTS
  const perCadreAlerts = useMemo(() => {
    const alertList: {
      id: string
      type: 'danger' | 'warning' | 'info'
      title: string
      desc: string
      cadre?: UserProfile
      actionLabel?: string
    }[] = []

    // Alert A: Inactive Cadres (0 responses)
    cadreMetrics
      .filter((c) => c.respCount === 0)
      .slice(0, 5)
      .forEach((c) => {
        alertList.push({
          id: `inactive_cadre_${c.cadre.uid}`,
          type: 'warning',
          title: `Kader Lapangan Belum Memiliki Respon: ${c.cadre.displayName}`,
          desc: `Kader di bawah instansi ${c.organizationName} belum mengumpulkan hasil evaluasi pangan di lapangan.`,
          cadre: c.cadre,
          actionLabel: 'Inspeksi Kader',
        })
      })

    // Alert B: Low Average Score Cadres (< 60%)
    cadreMetrics
      .filter((c) => c.respCount > 0 && c.avgScore < 60)
      .forEach((c) => {
        alertList.push({
          id: `low_score_cadre_${c.cadre.uid}`,
          type: 'danger',
          title: `Nilai Evaluasi Pangan Rendah (${c.avgScore}%): Kader ${c.cadre.displayName}`,
          desc: `Tingkat pemenuhan syarat evaluasi responden kader ${c.cadre.displayName} (${c.organizationName}) di bawah standar 60%. Perlu pembinaan & penyuluhan ulang.`,
          cadre: c.cadre,
          actionLabel: 'Inspeksi Performa',
        })
      })

    // Alert C: Mitra without Cadres
    mitraMetrics
      .filter((m) => m.cadreCount === 0)
      .forEach((m) => {
        alertList.push({
          id: `no_cadres_mitra_${m.mitra.uid}`,
          type: 'warning',
          title: `Mitra Belum Memiliki Kader: ${m.mitra.displayName}`,
          desc: `Instansi ${m.mitra.displayName} (${m.mitra.partnershipType || 'Sekolah'}) belum mendaftarkan kader lapangan.`,
          actionLabel: 'Tugaskan Kader',
        })
      })

    if (alertList.length === 0) {
      alertList.push({
        id: 'all_clear',
        type: 'info',
        title: 'Seluruh Kader & Mitra Beraktivitas Dengan Baik',
        desc: 'Tidak ada alert kritis. Seluruh kader aktif dan pemenuhan syarat evaluasi pangan di atas standar.',
      })
    }

    return alertList
  }, [cadreMetrics, mitraMetrics])

  // Filtered Cadre Metrics
  const filteredCadreMetrics = useMemo(() => {
    return cadreMetrics.filter((item) => {
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
  }, [cadreMetrics, searchTerm, mitraFilter, statusFilter])

  // 🔥 CADRE PERSONALIZED DASHBOARD VIEW
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
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ✓ KADER LAPANGAN AKTIF
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
                  ? `🎉 Sangat Baik! Responden Anda mencatatkan rata-rata nilai ${myMetric.avgScore}% (${myMetric.passRate}% Pass Rate). Pertahankan kualitas pendampingan!`
                  : `⚠️ Rata-rata nilai evaluasi responden Anda saat ini adalah ${myMetric.avgScore}%. Disarankan untuk mengarahkan responden ke Artikel Edukasi Keamanan Pangan BPOM.`}
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

  return (
    <div className="min-h-screen bg-[#080812] text-slate-100 font-sans flex flex-col">
      <Topbar
        title={isPartnershipRole ? 'Domain Monitoring Kemitraan' : 'Domain Monitoring Command Center'}
        subtitle={
          isPartnershipRole
            ? 'Analisis Real-Time Performa Kader Lapangan & Aktivitas Mitra Anda'
            : 'Super Admin Level Analysis: Per-Cadre & Per-Mitra Contribution Engine'
        }
      />

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* DOMAIN HEADER & NAVIGATION TABS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/[0.06] backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-display text-white tracking-wide">Domain Monitoring</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {isPartnershipRole ? 'MONITORING MITRA' : 'SUPER ADMIN LEVEL ANALYTICS'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isPartnershipRole
                ? 'Pantau aktivitas dan performa evaluasi keamanan pangan kader binaan Anda.'
                : 'Pusat komando analisis kontribusi mendalam per-Kader Lapangan dan per-Mitra Instansi.'}
            </p>
          </div>

          {/* NAVIGATION TABS */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex-wrap">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                activeTab === 'cadres'
                  ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon name="users" className="w-3.5 h-3.5" />
              {isPartnershipRole ? `Kader Saya (${cadreMetrics.length})` : `Analisis Per Kader (${cadreMetrics.length})`}
            </button>

            <button
              onClick={() => setActiveTab('mitra')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                activeTab === 'mitra'
                  ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon name="building" className="w-3.5 h-3.5" />
              {isPartnershipRole ? 'Profil Mitra' : `Analisis Per Mitra (${mitraMetrics.length})`}
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                activeTab === 'alerts'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon name="alertCircle" className="w-3.5 h-3.5" />
              Alert Performa ({perCadreAlerts.filter((a) => a.type !== 'info').length})
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
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
                  {!isPartnershipRole && (
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
                  )}

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

        {/* TAB 1: EXECUTIVE OVERVIEW KPI */}
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

            {/* TOP CONTRIBUTOR CADRES CARDS */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-violet-400 uppercase tracking-wider flex items-center gap-2">
                  <Icon name="award" className="w-4 h-4" />
                  Top Kontributor Kader Lapangan Terbaik
                </h3>
                <button
                  onClick={() => setActiveTab('cadres')}
                  className="text-xs font-mono text-cyan-400 hover:underline"
                >
                  Lihat Seluruh Kader ({stats.totalCadres}) →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cadreMetrics
                  .sort((a, b) => b.respCount - a.respCount)
                  .slice(0, 3)
                  .map((item, idx) => (
                    <div
                      key={item.cadre.uid}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 font-bold">
                          # RANK {idx + 1}
                        </span>
                        <span className="text-emerald-400 font-bold">{item.contributionPct}% Kontribusi Total</span>
                      </div>

                      <div>
                        <p className="font-bold text-slate-100 text-sm">{item.cadre.displayName}</p>
                        <p className="text-xs text-slate-400 font-mono">{item.organizationName}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-900 p-2 rounded-lg">
                        <div>
                          <span className="text-slate-500 block">Respon:</span>
                          <span className="font-bold text-cyan-300">{item.respCount} Tanggapan</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Rata-Rata Nilai:</span>
                          <span className="font-bold text-emerald-400">{item.avgScore}%</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedCadreForInspect(item.cadre)}
                        className="w-full py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-mono font-bold transition-colors"
                      >
                        Inspeksi Kontribusi Kader →
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DEEP PER-CADRE ANALYSIS TABLE */}
        {activeTab === 'cadres' && (
          <div className="space-y-4">
            {isLoading ? (
              <SkeletonTable rows={6} cols={8} />
            ) : filteredCadreMetrics.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-mono text-xs bg-slate-900/40 rounded-2xl border border-slate-800 p-8">
                Tidak ada data kader ditemukan untuk filter ini.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
                <table className="w-full text-xs font-mono text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-3.5 border-b border-slate-800">Nama Kader Lapangan</th>
                      <th className="p-3.5 border-b border-slate-800">Mitra Instansi Terkait</th>
                      <th className="p-3.5 border-b border-slate-800 text-center">Kode Distribusi</th>
                      <th className="p-3.5 border-b border-slate-800 text-center">Respon Dikumpulkan</th>
                      <th className="p-3.5 border-b border-slate-800 text-center">% Kontribusi</th>
                      <th className="p-3.5 border-b border-slate-800 text-center">Rata-Rata Nilai</th>
                      <th className="p-3.5 border-b border-slate-800 text-center">Level Performa</th>
                      <th className="p-3.5 border-b border-slate-800 text-right">Aksi Super Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredCadreMetrics.map((item) => (
                      <tr key={item.cadre.uid} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-100">{item.cadre.displayName}</div>
                          <div className="text-[11px] text-slate-400">{item.cadre.email}</div>
                        </td>
                        <td className="p-3.5 font-bold text-cyan-300">{item.organizationName}</td>
                        <td className="p-3.5 text-center font-bold text-slate-300">{item.distCount} Kode</td>
                        <td className="p-3.5 text-center font-bold text-cyan-300">{item.respCount} Tanggapan</td>
                        <td className="p-3.5 text-center font-bold text-violet-300">{item.contributionPct}%</td>
                        <td className="p-3.5 text-center font-bold text-emerald-400">
                          {item.respCount > 0 ? `${item.avgScore}%` : '-'}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'high'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : item.status === 'active'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {item.status === 'high' ? 'High Contributor' : item.status === 'active' ? 'Aktif' : 'Perlu Atensi'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedCadreForInspect(item.cadre)}
                            className="px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold text-[11px] transition-colors"
                          >
                            Inspeksi Kontribusi
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DEEP PER-MITRA ANALYSIS TABLE */}
        {activeTab === 'mitra' && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-3.5 border-b border-slate-800">Nama Mitra Instansi</th>
                    <th className="p-3.5 border-b border-slate-800">Jenis Instansi</th>
                    <th className="p-3.5 border-b border-slate-800 text-center">Jumlah Kader Terikat</th>
                    <th className="p-3.5 border-b border-slate-800 text-center">Total Distribusi Kode</th>
                    <th className="p-3.5 border-b border-slate-800 text-center">Total Respon Terkumpul</th>
                    <th className="p-3.5 border-b border-slate-800 text-center">Rata-Rata Nilai Evaluasi</th>
                    <th className="p-3.5 border-b border-slate-800 text-right">Status Operasional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {mitraMetrics.map((item) => (
                    <tr key={item.mitra.uid} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-bold text-slate-100">{item.mitra.displayName}</td>
                      <td className="p-3.5 text-slate-400">{item.mitra.partnershipType || 'Sekolah'}</td>
                      <td className="p-3.5 text-center font-bold text-cyan-300">{item.cadreCount} Orang</td>
                      <td className="p-3.5 text-center font-bold text-slate-300">{item.distCount} Kode</td>
                      <td className="p-3.5 text-center font-bold text-violet-300">{item.respCount} Tanggapan</td>
                      <td className="p-3.5 text-center font-bold text-emerald-400">
                        {item.respCount > 0 ? `${item.avgScore}%` : '-'}
                      </td>
                      <td className="p-3.5 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.cadreCount > 0
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ACTIONABLE ALERTS PER KADER & MITRA */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Icon name="alertCircle" className="w-4 h-4 text-amber-400" />
                  Kartu Peringatan Khusus Per Kader & Mitra (Actionable Alert Cards)
                </h3>
                <p className="text-xs text-slate-400">
                  Setiap kartu merepresentasikannya kader atau mitra spesifik yang membutuhkan tindak lanjut atau pembinaan.
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                Total Alert: {perCadreAlerts.filter((a) => a.type !== 'info').length} Kartu Celah
              </span>
            </div>

            {/* AESTHETIC INDIVIDUAL CARD GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {perCadreAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border backdrop-blur-md transition-all flex flex-col justify-between space-y-4 group hover:scale-[1.01] ${
                    alert.type === 'danger'
                      ? 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/40 hover:border-rose-500/70 shadow-lg shadow-rose-950/20'
                      : alert.type === 'warning'
                      ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/40 hover:border-amber-500/70 shadow-lg shadow-amber-950/20'
                      : 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border-cyan-500/40 hover:border-cyan-500/70 shadow-lg shadow-cyan-950/20'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Card Header Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase tracking-wider ${
                          alert.type === 'danger'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : alert.type === 'warning'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        }`}
                      >
                        {alert.type === 'danger' ? '🚨 Perlu Intervensi' : alert.type === 'warning' ? '⚠️ Perlu Atensi' : 'ℹ️ Status Normal'}
                      </span>

                      <span className="text-[10px] font-mono text-slate-500">
                        {alert.cadre ? 'Target: Kader' : 'Target: Mitra'}
                      </span>
                    </div>

                    {/* Card Entity Info */}
                    <div className="flex items-start gap-3 pt-1">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                          alert.type === 'danger'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                            : alert.type === 'warning'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                        }`}
                      >
                        {alert.cadre ? alert.cadre.displayName?.charAt(0) || 'K' : 'M'}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                          {alert.cadre ? alert.cadre.displayName : alert.title}
                        </h4>
                        <p className="text-xs text-slate-400 font-mono truncate">
                          {alert.cadre ? alert.cadre.organization || alert.cadre.partnershipName || 'Kader Lapangan' : alert.title}
                        </p>
                      </div>
                    </div>

                    {/* Alert Message Box */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed">
                      {alert.desc}
                    </div>
                  </div>

                  {/* Action Button */}
                  {alert.cadre && alert.actionLabel && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => setSelectedCadreForInspect(alert.cadre!)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-700/50"
                      >
                        <Icon name="eye" className="w-3.5 h-3.5 text-cyan-400" />
                        {alert.actionLabel} →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
