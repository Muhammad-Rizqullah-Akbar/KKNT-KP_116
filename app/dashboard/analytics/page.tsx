'use client'

import { useState, useMemo, useEffect } from 'react'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/shared/safeFetch'

type VersionFilter = 'v1_5' | 'v1_0' | 'all'

interface ResponseItem {
  responseId: string
  formId: string
  formTitle: string
  versionNumber?: number
  distributionCode: string
  ownerName: string
  ownerType: string
  submittedAt: string | number
  respondentName: string
  respondentEmail: string
  score: number
  grade: string
  thresholdTitle: string
  createdBy?: string
  cadreId?: string
}

export default function AnalyticsDashboardPage() {
  const { user, userData, userRole } = useAuth()
  const isCadre = userData?.role === 'cadre' || userRole === 'cadre'

  const [activeVersion, setActiveVersion] = useState<VersionFilter>('v1_5')
  const [responses, setResponses] = useState<ResponseItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFormId, setSelectedFormId] = useState<string>('all')
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Export State
  const [isExporting, setIsExporting] = useState(false)

  // Fetch Data from Server API
  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1_5/responses?status=submitted')
      if (!res.ok) throw new Error('Gagal terhubung ke layanan data analitik.')
      const data = await res.json()

      if (data.success && Array.isArray(data.responses)) {
        let parsed: ResponseItem[] = data.responses.map((r: any) => {
          const res = r.result
          const rawScoreVal =
            res?.percentage ??
            res?.rawScore ??
            r.score ??
            r.totalScore ??
            r.percentage ??
            r.finalScore ??
            0
          const score = Math.min(100, Math.max(0, Math.round(Number(rawScoreVal) || 0)))
          const grade = res?.grade || (score >= 80 ? 'Grade A' : score >= 60 ? 'Grade B' : 'Grade C')
          const thresholdTitle =
            res?.thresholdTitle || (score >= 80 ? 'Memenuhi Syarat' : score >= 60 ? 'Pendampingan Lanjutan' : 'Perlu Perbaikan')

          return {
            responseId: r.responseId || r.id,
            formId: r.formId || 'form_default',
            formTitle: (r.formTitle || 'Formulir Evaluasi Pangan').replace(/^form_[\w\-]+/g, 'Formulir Evaluasi Pangan'),
            versionNumber: r.versionNumber || (r.responseId?.startsWith('resp_') ? 1.5 : 1.0),
            distributionCode: r.distributionCode || r.groupName || 'V1-DIST',
            ownerName: r.ownerName || 'Kader Lapangan',
            ownerType: r.ownerType || 'cadre',
            submittedAt: r.submittedAt || r.updatedAt || Date.now(),
            respondentName: r.respondent?.name || r.answers?.name || r.answers?.nama || 'Responden Publik',
            respondentEmail: r.respondent?.email || r.answers?.email || '',
            score,
            grade,
            thresholdTitle,
            createdBy: r.createdBy,
            cadreId: r.cadreId || r.userId,
          }
        })

        // If logged in user is a Cadre, filter responses strictly to personal distribution codes & UID
        if (isCadre) {
          const myDistRes = await safeFetchJson('/api/v1_5/distributions')
          const myCodesSet = new Set<string>()
          if (myDistRes.ok && myDistRes.data && Array.isArray(myDistRes.data.distributions)) {
            myDistRes.data.distributions.forEach((d: any) => {
              if (d.createdBy === user?.uid || d.cadreId === user?.uid || d.ownerId === user?.uid) {
                if (d.code) myCodesSet.add(String(d.code).toLowerCase().trim())
                if (d.distributionId) myCodesSet.add(String(d.distributionId).toLowerCase().trim())
              }
            })
          }
          if (userData?.cadreCode) myCodesSet.add(String(userData.cadreCode).toLowerCase().trim())

          parsed = parsed.filter((r) => {
            const distCode = String(r.distributionCode || '').toLowerCase().trim()
            const isMyCode = distCode !== '' && myCodesSet.has(distCode)
            const isMyUid = r.createdBy === user?.uid || r.cadreId === user?.uid
            return isMyCode || isMyUid
          })
        }

        setResponses(parsed)
      } else {
        setResponses([])
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data analitik.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [user])

  // Filter Responses by Version Tabs (V1.5 vs V1.0)
  const versionFilteredResponses = useMemo(() => {
    return responses.filter((r) => {
      if (activeVersion === 'v1_5') return (r.versionNumber || 1.5) >= 1.5
      if (activeVersion === 'v1_0') return (r.versionNumber || 1.0) < 1.5
      return true
    })
  }, [responses, activeVersion])

  // Available Form Options for Filter
  const formOptions = useMemo(() => {
    const map = new Map<string, string>()
    versionFilteredResponses.forEach((r) => {
      if (!map.has(r.formId)) map.set(r.formId, r.formTitle)
    })
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }))
  }, [versionFilteredResponses])

  // Available Author Options for Filter
  const authorOptions = useMemo(() => {
    const set = new Set<string>()
    versionFilteredResponses.forEach((r) => {
      if (r.ownerName) set.add(r.ownerName)
    })
    return Array.from(set)
  }, [versionFilteredResponses])

  // Applied Multi-level Filter
  const filteredData = useMemo(() => {
    return versionFilteredResponses.filter((r) => {
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        r.responseId.toLowerCase().includes(term) ||
        r.formTitle.toLowerCase().includes(term) ||
        r.distributionCode.toLowerCase().includes(term) ||
        r.ownerName.toLowerCase().includes(term) ||
        r.respondentName.toLowerCase().includes(term)

      const matchesForm = selectedFormId === 'all' || r.formId === selectedFormId
      const matchesAuthor = selectedAuthor === 'all' || r.ownerName === selectedAuthor

      let matchesDate = true
      if (startDate) {
        matchesDate = new Date(r.submittedAt).getTime() >= new Date(startDate).getTime()
      }
      if (endDate && matchesDate) {
        matchesDate = new Date(r.submittedAt).getTime() <= new Date(endDate + 'T23:59:59').getTime()
      }

      return matchesSearch && matchesForm && matchesAuthor && matchesDate
    })
  }, [versionFilteredResponses, searchTerm, selectedFormId, selectedAuthor, startDate, endDate])

  // Executive KPI Calculations
  const kpi = useMemo(() => {
    const total = filteredData.length
    if (total === 0) return { total: 0, msCount: 0, msPercentage: 0, avgScore: 0, activeCadres: 0, activeDistributions: 0 }

    const msCount = filteredData.filter((r) => r.score >= 80).length
    const msPercentage = Math.round((msCount / total) * 100)
    const sumScore = filteredData.reduce((acc, curr) => acc + curr.score, 0)
    const avgScore = Math.round(sumScore / total)

    const cadres = new Set(filteredData.map((r) => r.ownerName)).size
    const dists = new Set(filteredData.map((r) => r.distributionCode)).size

    return { total, msCount, msPercentage, avgScore, activeCadres: cadres, activeDistributions: dists }
  }, [filteredData])

  // Score Breakdown Aggregation
  const scoreBreakdown = useMemo(() => {
    const total = filteredData.length
    if (total === 0) return { ms: { count: 0, pct: 0 }, binaan: { count: 0, pct: 0 }, kritis: { count: 0, pct: 0 } }

    const ms = filteredData.filter((r) => r.score >= 80).length
    const binaan = filteredData.filter((r) => r.score >= 60 && r.score < 80).length
    const kritis = filteredData.filter((r) => r.score < 60).length

    return {
      ms: { count: ms, pct: Math.round((ms / total) * 100) },
      binaan: { count: binaan, pct: Math.round((binaan / total) * 100) },
      kritis: { count: kritis, pct: Math.round((kritis / total) * 100) },
    }
  }, [filteredData])

  // Form Performance Aggregation Table
  const formPerformance = useMemo(() => {
    const map = new Map<string, { title: string; count: number; totalScore: number; msCount: number }>()

    filteredData.forEach((r) => {
      const key = r.formId
      if (!map.has(key)) {
        map.set(key, { title: r.formTitle, count: 1, totalScore: r.score, msCount: r.score >= 80 ? 1 : 0 })
      } else {
        const item = map.get(key)!
        item.count += 1
        item.totalScore += r.score
        if (r.score >= 80) item.msCount += 1
      }
    })

    return Array.from(map.entries()).map(([formId, data]) => {
      const avg = Math.round(data.totalScore / data.count)
      const msRate = Math.round((data.msCount / data.count) * 100)
      return { formId, title: data.title, count: data.count, avgScore: avg, msRate }
    })
  }, [filteredData])

  // Cadre Leaderboard Aggregation
  const cadreLeaderboard = useMemo(() => {
    const map = new Map<string, { ownerName: string; ownerType: string; count: number; totalScore: number; codes: Set<string> }>()

    filteredData.forEach((r) => {
      const key = r.ownerName
      if (!map.has(key)) {
        map.set(key, { ownerName: r.ownerName, ownerType: r.ownerType, count: 1, totalScore: r.score, codes: new Set([r.distributionCode]) })
      } else {
        const item = map.get(key)!
        item.count += 1
        item.totalScore += r.score
        item.codes.add(r.distributionCode)
      }
    })

    return Array.from(map.values())
      .map((item) => ({
        ownerName: item.ownerName,
        ownerType: item.ownerType,
        count: item.count,
        avgScore: Math.round(item.totalScore / item.count),
        codeCount: item.codes.size,
      }))
      .sort((a, b) => b.count - a.count)
  }, [filteredData])

  // Print Report Handler
  const handlePrintReport = () => {
    setIsExporting(true)
    setTimeout(() => {
      window.print()
      setIsExporting(false)
    }, 400)
  }

  // Export CSV Handler
  const handleExportCSV = () => {
    if (filteredData.length === 0) return alert('Tidak ada data untuk diekspor.')

    const headers = ['ID Respon', 'Formulir', 'Versi', 'Kode Distribusi', 'Author/Kader', 'Nama Responden', 'Skor %', 'Kategori', 'Tanggal Submisi']
    const rows = filteredData.map((r) => [
      `"${r.responseId}"`,
      `"${r.formTitle}"`,
      `"V${r.versionNumber || 1.5}"`,
      `"${r.distributionCode}"`,
      `"${r.ownerName}"`,
      `"${r.respondentName}"`,
      r.score,
      `"${r.thresholdTitle}"`,
      `"${new Date(r.submittedAt).toLocaleDateString('id-ID')}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `laporan_analisis_kkpd_${activeVersion}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setSelectedFormId('all')
    setSelectedAuthor('all')
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans print:bg-white print:text-slate-900">
      {/* Dynamic CSS Print Page Layout */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 10mm 12mm 10mm;
          }
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print-card,
          .print-no-break,
          tr,
          .p-5,
          .p-6,
          .rounded-3xl,
          .rounded-2xl {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
          .max-w-7xl {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .bg-slate-900,
          .bg-slate-950,
          .bg-slate-900\\/90 {
            background-color: #ffffff !important;
            border-color: #cbd5e1 !important;
            box-shadow: none !important;
          }
          .text-slate-100,
          .text-slate-200,
          .text-white {
            color: #0f172a !important;
          }
          .text-slate-400,
          .text-slate-500 {
            color: #475569 !important;
          }
          .border-slate-800,
          .border-slate-700 {
            border-color: #cbd5e1 !important;
          }
          .bg-slate-800,
          .bg-slate-950 {
            background-color: #f8fafc !important;
          }
        }
      `}</style>

      {/* Dashboard Topbar (Hidden in Print) */}
      <div className="print:hidden">
        <Topbar
          title="Laporan & Analisis Data"
          subtitle="Rekapitulasi dan analisis data evaluasi kuesioner, performa kelompok, serta perbandingan data per versi"
        />
      </div>

      {/* Printable PDF Formal Academic Header (Visible ONLY when printing) */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-900 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              LAPORAN & ANALISIS DATA EVALUASI KUESIONER
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Platform Desa Sehat — Rekapitulasi & Segmentasi Data Submisi
            </p>
          </div>
          <div className="text-right text-[11px] font-mono text-slate-600">
            <p><strong>Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p><strong>Versi Data:</strong> {activeVersion === 'v1_5' ? 'Version 1.5 (Desa Pangan Aman)' : activeVersion === 'v1_0' ? 'Version 1.0 (Arsip Legacy)' : 'Keseluruhan Versi'}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-300 text-[11px] font-mono">
          <div className="p-2 bg-slate-100 rounded border border-slate-300">
            <span className="text-slate-500 block text-[9px] uppercase font-sans">Total Submisi</span>
            <strong className="text-slate-900 text-sm">{kpi.total} Respon</strong>
          </div>
          <div className="p-2 bg-slate-100 rounded border border-slate-300">
            <span className="text-slate-500 block text-[9px] uppercase font-sans">Nilai Rata-Rata</span>
            <strong className="text-slate-900 text-sm">{kpi.avgScore}%</strong>
          </div>
          <div className="p-2 bg-slate-100 rounded border border-slate-300">
            <span className="text-slate-500 block text-[9px] uppercase font-sans">Persentase Capaian (≥ 80%)</span>
            <strong className="text-emerald-700 text-sm">{kpi.msPercentage}% ({kpi.msCount})</strong>
          </div>
          <div className="p-2 bg-slate-100 rounded border border-slate-300">
            <span className="text-slate-500 block text-[9px] uppercase font-sans">Kontributor Aktif</span>
            <strong className="text-slate-900 text-sm">{kpi.activeCadres} Kader</strong>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* ============ VERSION TAB SELECTOR ============ */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl print:hidden">
          <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800/80">
            <button
              type="button"
              onClick={() => setActiveVersion('v1_5')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeVersion === 'v1_5'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon name="sparkles" className="w-4 h-4 text-amber-300" />
              <span>Version 1.5 — Desa Pangan Aman (Aktif)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveVersion('v1_0')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeVersion === 'v1_0'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon name="database" className="w-4 h-4 text-purple-300" />
              <span>Version 1.0 — Arsip Legacy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveVersion('all')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeVersion === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Versi
            </button>
          </div>

          {/* Action Export Suite */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all shadow-md"
            >
              <Icon name="download" className="w-4 h-4 text-cyan-400" />
              <span>Ekspor CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrintReport}
              disabled={isExporting}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold shadow-lg shadow-cyan-600/25 flex items-center gap-2 transition-all"
            >
              <Icon name="printer" className="w-4 h-4" />
              <span>{isExporting ? 'Mencetak...' : 'Cetak Laporan PDF'}</span>
            </button>
          </div>
        </div>

        {/* ============ EXECUTIVE KPI SUMMARY BAR ============ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print-card">
          {/* KPI 1: Total Submisi */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 print:border-slate-300 print:bg-white">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 print:text-slate-700">
              <span>Total Submisi Data</span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 print:hidden">
                <Icon name="fileText" className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-slate-100 print:text-slate-900">{kpi.total}</span>
              <span className="text-xs text-cyan-400 print:text-cyan-700 font-semibold font-mono">Respon Submisi</span>
            </div>
            <p className="text-[11px] text-slate-400 print:text-slate-600">
              Filtered for {activeVersion === 'v1_5' ? 'Platform V1.5' : activeVersion === 'v1_0' ? 'Arsip V1.0' : 'Keseluruhan Versi'}
            </p>
          </div>

          {/* KPI 2: Persentase Capaian (MS %) */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 print:border-slate-300 print:bg-white">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 print:text-slate-700">
              <span>Persentase Capaian (≥ 80%)</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 print:hidden">
                <Icon name="checkCircle" className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-emerald-400 print:text-emerald-700">{kpi.msPercentage}%</span>
              <span className="text-xs text-slate-400 print:text-slate-600 font-mono">({kpi.msCount} / {kpi.total})</span>
            </div>
            <p className="text-[11px] text-emerald-400/80 print:text-emerald-700 font-medium">Kategori Cukup / Memenuhi Syarat</p>
          </div>

          {/* KPI 3: Nilai Rata-rata */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 print:border-slate-300 print:bg-white">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 print:text-slate-700">
              <span>Nilai Rata-Rata</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 print:hidden">
                <Icon name="trendingUp" className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-purple-300 print:text-purple-700">{kpi.avgScore}%</span>
              <span className="text-xs text-slate-400 print:text-slate-600 font-mono">Skor Rata-Rata</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden print:bg-slate-200">
              <div className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full rounded-full" style={{ width: `${kpi.avgScore}%` }} />
            </div>
          </div>

          {/* KPI 4: Jangkauan Kader & Instansi */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 print:border-slate-300 print:bg-white">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 print:text-slate-700">
              <span>Jangkauan Kader & Instansi</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 print:hidden">
                <Icon name="users" className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-blue-300 print:text-slate-900">{kpi.activeCadres}</span>
              <span className="text-xs text-slate-400 print:text-slate-600 font-mono">Kader ({kpi.activeDistributions} Kode)</span>
            </div>
            <p className="text-[11px] text-slate-400 print:text-slate-600">Kontributor pengumpul data kuesioner</p>
          </div>
        </div>

        {/* ============ FILTER & CONTROL BAR (Hidden in Print) ============ */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 print:hidden">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Icon name="search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari ID respon, nama responden, formulir, atau kader..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 transition-colors"
              />
            </div>

            {/* Filter Form Dropdown */}
            <div className="min-w-[180px]">
              <select
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/80 transition-colors"
              >
                <option value="all">Semua Formulir Evaluasi ({formOptions.length})</option>
                {formOptions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Author Dropdown */}
            <div className="min-w-[160px]">
              <select
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/80 transition-colors"
              >
                <option value="all">Semua Author / Kader ({authorOptions.length})</option>
                {authorOptions.map((author) => (
                  <option key={author} value={author}>
                    {author}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Inputs */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/80"
                title="Tanggal Mulai"
              />
              <span className="text-slate-500 text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/80"
                title="Tanggal Akhir"
              />
            </div>

            {(searchTerm || selectedFormId !== 'all' || selectedAuthor !== 'all' || startDate || endDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* ============ VISUAL ANALYTICS SECTION 1: SCORE BREAKDOWN ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print-card">
          {/* Segmentasi Predikat Status */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 print:border-slate-300 print:bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white print:text-slate-900">Distribusi Kelompok Nilai Submisi</h3>
                <p className="text-xs text-slate-400 print:text-slate-600">Persentase dan sebaran hasil evaluasi berdasarkan rentang nilai</p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold print:hidden">
                {filteredData.length} Laporan
              </span>
            </div>

            {/* Visual Bar Breakdown */}
            <div className="space-y-4">
              {/* MS (Memenuhi Syarat / Kategori Tinggi) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-emerald-400 print:text-emerald-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    Kategori Tinggi / Memenuhi Syarat (Skor 80 - 100%)
                  </span>
                  <span className="font-mono text-slate-200 print:text-slate-900">
                    {scoreBreakdown.ms.count} Respon ({scoreBreakdown.ms.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-xl h-3.5 overflow-hidden border border-slate-800 print:border-slate-300 print:bg-slate-100">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-xl transition-all duration-500"
                    style={{ width: `${scoreBreakdown.ms.pct}%` }}
                  />
                </div>
              </div>

              {/* Binaan Lanjutan / Kategori Sedang */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-amber-400 print:text-amber-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    Kategori Sedang / Pendampingan Lanjutan (Skor 60 - 79%)
                  </span>
                  <span className="font-mono text-slate-200 print:text-slate-900">
                    {scoreBreakdown.binaan.count} Respon ({scoreBreakdown.binaan.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-xl h-3.5 overflow-hidden border border-slate-800 print:border-slate-300 print:bg-slate-100">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-xl transition-all duration-500"
                    style={{ width: `${scoreBreakdown.binaan.pct}%` }}
                  />
                </div>
              </div>

              {/* Perlu Perbaikan / Kategori Rendah */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-rose-400 print:text-rose-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    Kategori Perlu Perbaikan (Skor &lt; 60%)
                  </span>
                  <span className="font-mono text-slate-200 print:text-slate-900">
                    {scoreBreakdown.kritis.count} Respon ({scoreBreakdown.kritis.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-xl h-3.5 overflow-hidden border border-slate-800 print:border-slate-300 print:bg-slate-100">
                  <div
                    className="bg-gradient-to-r from-rose-600 to-pink-500 h-full rounded-xl transition-all duration-500"
                    style={{ width: `${scoreBreakdown.kritis.pct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Audit Note */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5 print:border-slate-300 print:bg-slate-50 print:text-slate-800">
              <Icon name="shieldCheck" className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 print:hidden" />
              <p>
                <strong>Catatan Evaluasi Data:</strong> Responden dengan hasil evaluasi pada kategori Perlu Perbaikan disarankan untuk mendapatkan pendampingan lebih lanjut guna meningkatkan pemahaman dan capaian nilai pada tahap berikutnya.
              </p>
            </div>
          </div>

          {/* Donut Score Summary Box */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4 print:border-slate-300 print:bg-white">
            <div>
              <h3 className="text-base font-extrabold text-white print:text-slate-900">Ringkasan Nilai Rata-Rata</h3>
              <p className="text-xs text-slate-400 print:text-slate-600">Gambaran umum rerata nilai seluruh responden</p>
            </div>

            {/* Circular Gauge Center */}
            <div className="relative flex items-center justify-center my-4">
              <div className="w-36 h-36 rounded-full border-8 border-slate-950 bg-slate-950/60 flex flex-col items-center justify-center p-4 text-center shadow-inner print:border-slate-300 print:bg-white">
                <span className="text-3xl font-black font-mono text-cyan-400 print:text-slate-900">{kpi.avgScore}%</span>
                <span className="text-[10px] text-slate-400 print:text-slate-600 font-bold uppercase tracking-wider">Nilai Rata-Rata</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs pt-2 border-t border-slate-800 print:border-slate-300">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 print:bg-slate-100 print:border-slate-300">
                <p className="text-emerald-400 print:text-emerald-700 font-bold">{scoreBreakdown.ms.count}</p>
                <p className="text-[10px] text-slate-400 print:text-slate-600 font-sans">MS</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 print:bg-slate-100 print:border-slate-300">
                <p className="text-amber-400 print:text-amber-700 font-bold">{scoreBreakdown.binaan.count}</p>
                <p className="text-[10px] text-slate-400 print:text-slate-600 font-sans">Sedang</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 print:bg-slate-100 print:border-slate-300">
                <p className="text-rose-400 print:text-rose-700 font-bold">{scoreBreakdown.kritis.count}</p>
                <p className="text-[10px] text-slate-400 print:text-slate-600 font-sans">Perbaikan</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============ VISUAL ANALYTICS SECTION 2: FORM PERFORMANCE TABLE ============ */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 print-card print:border-slate-300 print:bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white print:text-slate-900">Analisis Performa per Formulir Evaluasi</h3>
              <p className="text-xs text-slate-400 print:text-slate-600">Rincian nilai rata-rata dan persentase capaian per jenis kuesioner</p>
            </div>
            <span className="text-xs font-mono text-slate-400 print:text-slate-600">{formPerformance.length} Jenis Formulir</span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider print:border-slate-900 print:text-slate-900">
                  <th className="py-3 px-4">Nama Formulir Evaluasi</th>
                  <th className="py-3 px-4 text-center">Jumlah Submisi</th>
                  <th className="py-3 px-4 text-center">Nilai Rata-Rata</th>
                  <th className="py-3 px-4 text-center">Persentase Capaian (≥ 80%)</th>
                  <th className="py-3 px-4 text-right">Kategori Evaluasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-medium print:divide-slate-200">
                {formPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Tidak ada data formulir yang memenuhi kriteria filter.
                    </td>
                  </tr>
                ) : (
                  formPerformance.map((item) => (
                    <tr key={item.formId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-extrabold text-slate-200 print:text-slate-900">{item.title}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-cyan-300 print:text-slate-900">{item.count} Laporan</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-100 print:text-slate-900">{item.avgScore}%</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 print:border-slate-300 print:bg-slate-100">
                            <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${item.msRate}%` }} />
                          </div>
                          <span className="font-mono font-bold text-emerald-400 print:text-emerald-700">{item.msRate}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`px-3 py-1 rounded-xl text-[11px] font-extrabold inline-block ${
                            item.avgScore >= 80
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 print:text-emerald-800 print:bg-emerald-50 print:border-emerald-300'
                              : item.avgScore >= 60
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 print:text-amber-800 print:bg-amber-50 print:border-amber-300'
                              : 'bg-rose-500/10 text-rose-300 border border-rose-500/30 print:text-rose-800 print:bg-rose-50 print:border-rose-300'
                          }`}
                        >
                          {item.avgScore >= 80 ? 'Memenuhi Syarat (≥ 80%)' : item.avgScore >= 60 ? 'Pendampingan Lanjutan' : 'Perlu Perbaikan'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============ VISUAL ANALYTICS SECTION 3: CADRE LEADERBOARD & ACTIVITY ============ */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 print-card print:border-slate-300 print:bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white print:text-slate-900">Rekapitulasi Kontribusi Kader & Instansi</h3>
              <p className="text-xs text-slate-400 print:text-slate-600">Akumulasi jumlah pengumpulan data kuesioner dan nilai rata-rata</p>
            </div>
            <span className="text-xs font-mono text-slate-400 print:text-slate-600">{cadreLeaderboard.length} Kontributor</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cadreLeaderboard.slice(0, 6).map((cadre, index) => (
              <div
                key={cadre.ownerName}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3 shadow-md hover:border-slate-700 transition-all print:border-slate-300 print:bg-white"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center shadow-md ${
                        index === 0
                          ? 'bg-amber-500 text-slate-950'
                          : index === 1
                          ? 'bg-slate-300 text-slate-950'
                          : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-300 print:bg-slate-200 print:text-slate-800'
                      }`}
                    >
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-100 truncate max-w-[150px] print:text-slate-900" title={cadre.ownerName}>
                        {cadre.ownerName}
                      </h4>
                      <p className="text-[10px] text-purple-300 print:text-purple-700 font-mono capitalize">{cadre.ownerType}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-extrabold print:bg-slate-100 print:border-slate-300 print:text-slate-900">
                    {cadre.count} Submisi
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800/80 print:border-slate-200">
                  <span className="text-slate-400 print:text-slate-600">Nilai Rata-Rata:</span>
                  <span className="font-extrabold text-emerald-400 print:text-emerald-700">{cadre.avgScore}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}