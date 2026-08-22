'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import type { ResponseDoc } from '@/lib/forms/v1_5/responseTypes'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/shared/safeFetch'
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton'
import { extractRespondentName, extractRespondentEmail } from '@/lib/forms/v1_5/respondentUtils'
import * as XLSX from 'xlsx'

interface FormMetaItem {
  formId: string
  title: string
  versionNumber: number
  versionLabel: string
}

interface DistMetaItem {
  distributionId: string
  code: string
  title: string
  ownerName?: string
  ownerType?: string
  formId?: string
}

interface PersonAuthorOption {
  ownerKey: string
  ownerName: string
  ownerType: string
  codes: string[]
  count: number
}

// CIRCULAR SCORE DONUT GAUGE COMPONENT (100% MATHEMATICAL CENTER ALIGNMENT)
function CircularScoreGauge({ score, grade }: { score: number; grade: string }) {
  const size = 96
  const stroke = 7
  const center = size / 2 // 48
  const radius = center - stroke // 41
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference

  const color = score >= 80 ? '#10b981' : score >= 60 ? '#06b6d4' : '#f59e0b'

  return (
    <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 w-24 h-24">
        <circle
          stroke="#1e293b"
          fill="transparent"
          strokeWidth={stroke}
          r={radius}
          cx={center}
          cy={center}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={radius}
          cx={center}
          cy={center}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none font-mono">
        <span className="text-xl font-black text-slate-100 leading-none">{score}%</span>
        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mt-1">{grade}</span>
      </div>
    </div>
  )
}

function expandScaleLabel(label: any): string {
  if (label === undefined || label === null || label === '') return '-'
  const str = String(label).trim()
  const clean = str.replace(/^(\d+[\.\-\s\(\)\:]+)+/g, '').replace(/[\(\)]/g, '').trim()
  const upper = clean.toUpperCase()

  if (upper === 'STS') return 'Sangat Tidak Setuju'
  if (upper === 'TS') return 'Tidak Setuju'
  if (upper === 'N') return 'Netral'
  if (upper === 'S') return 'Setuju'
  if (upper === 'SS') return 'Sangat Setuju'

  if (upper === 'STMS') return 'Sangat Tidak Memenuhi Syarat'
  if (upper === 'TMS') return 'Tidak Memenuhi Syarat'
  if (upper === 'MS') return 'Memenuhi Syarat'
  if (upper === 'SMS') return 'Sangat Memenuhi Syarat'

  if (upper === 'SK') return 'Sangat Kurang'
  if (upper === 'K') return 'Kurang'
  if (upper === 'C') return 'Cukup'
  if (upper === 'B') return 'Baik'
  if (upper === 'SB') return 'Sangat Baik'

  return str
}

// FORMAT ANSWER VALUE HELPER (MATCHING DATA RESPONDEN)
const formatAnswerValue = (value: any): { type: 'text' | 'signature' | 'table' | 'array'; content: any } => {
  if (value === null || value === undefined) return { type: 'text', content: '-' }
  if (typeof value === 'string' && value.startsWith('data:image'))
    return { type: 'signature', content: value }
  if (Array.isArray(value)) return { type: 'array', content: value }
  if (typeof value === 'object') return { type: 'table', content: value }
  return { type: 'text', content: String(value) }
}

export default function ResponsesDashboardPage() {
  const { user } = useAuth()
  const [responses, setResponses] = useState<ResponseDoc[]>([])
  const [dbForms, setDbForms] = useState<FormMetaItem[]>([])
  const [dbDistributions, setDbDistributions] = useState<DistMetaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Respondent Preview Modal State
  const [selectedRespondent, setSelectedRespondent] = useState<ResponseDoc | null>(null)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [previewTab, setPreviewTab] = useState<'answers' | 'details' | 'codeAnalysis'>('answers')

  // Delete Response Modal State
  const [selectedResponse, setSelectedResponse] = useState<ResponseDoc | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Bulk Delete State
  const [selectedResponseIds, setSelectedResponseIds] = useState<string[]>([])
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const handleDeleteResponse = async () => {
    if (!selectedResponse?.responseId) return
    setIsDeleting(true)
    try {
      const res = await safeFetchJson(`/api/v1_5/responses?id=${selectedResponse.responseId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(res.error || 'Gagal menghapus tanggapan.')

      setResponses((prev) => prev.filter((r) => r.responseId !== selectedResponse.responseId))
      setSelectedResponseIds((prev) => prev.filter((id) => id !== selectedResponse.responseId))
      setIsDeleteModalOpen(false)
      setSelectedResponse(null)
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDeleteResponses = async () => {
    if (selectedResponseIds.length === 0) return
    setIsBulkDeleting(true)
    try {
      const res = await safeFetchJson('/api/v1_5/responses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedResponseIds }),
      })
      if (!res.ok) throw new Error(res.error || 'Gagal menghapus tanggapan terpilih.')

      setResponses((prev) => prev.filter((r) => !selectedResponseIds.includes(r.responseId)))
      setSelectedResponseIds([])
      setIsBulkDeleteModalOpen(false)
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleSelectResponseToggle = (id: string) => {
    setSelectedResponseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // Layout View Mode (Cards vs Table)
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>('cards')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Pure Person-Based Cascading Filters: Kiri = Formulir, Kanan = Author / Orang (Superadmin, Kader, Mitra)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFormId, setSelectedFormId] = useState<string>('all')
  const [selectedAuthorCode, setSelectedAuthorCode] = useState<string>('all')

  const loadResponses = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [respRes, userRes] = await Promise.all([
        safeFetchJson('/api/v1_5/responses?status=submitted'),
        safeFetchJson('/api/auth/users'),
      ])

      let combinedDistributions: DistMetaItem[] = []

      if (respRes.ok && respRes.data) {
        if (Array.isArray(respRes.data.responses)) {
          const submittedOnly = respRes.data.responses.filter((r: ResponseDoc) => r.status === 'submitted')
          setResponses(submittedOnly)
        }
        if (Array.isArray(respRes.data.availableForms)) {
          setDbForms(respRes.data.availableForms)
        }
        if (Array.isArray(respRes.data.availableDistributions)) {
          combinedDistributions = [...respRes.data.availableDistributions]
        }
      } else {
        setError(respRes.error || 'Gagal memuat daftar hasil penilaian.')
      }

      if (userRes.ok && userRes.data && Array.isArray(userRes.data.users)) {
        const userDistItems: DistMetaItem[] = userRes.data.users.map((u: any) => ({
          distributionId: `user_${u.uid}`,
          code: `USER-${u.uid.substring(0, 6)}`,
          title: `Kanal ${u.displayName || u.email}`,
          ownerName: u.displayName || (u.email ? u.email.split('@')[0] : 'Pengguna Terdaftar'),
          ownerType: u.role || 'cadre',
        }))
        combinedDistributions = [...combinedDistributions, ...userDistItems]
      }

      setDbDistributions(combinedDistributions)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat terhubung ke server.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadResponses()
  }, [])

  // 1. KIRI: Dynamic Form options list from Firestore
  const mergedFormOptions = useMemo(() => {
    const map = new Map<string, FormMetaItem>()
    dbForms.forEach((f) => map.set(f.formId, f))

    responses.forEach((r) => {
      if (r.formId && !map.has(r.formId)) {
        map.set(r.formId, {
          formId: r.formId,
          title: (r as any).formTitle || 'Formulir Evaluasi Pangan',
          versionNumber: r.versionNumber || 1.5,
          versionLabel: r.versionNumber >= 1.5 ? `V1.5 (v${r.versionNumber})` : 'V1.0 Legacy',
        })
      }
    })
    return Array.from(map.values())
  }, [dbForms, responses])

  // 2. KANAN: Pure Person/Account Author options grouped by user identity (Superadmin, Kader 1, Mitra, dst)
  const availableAuthors = useMemo(() => {
    let dists = dbDistributions

    if (selectedFormId !== 'all') {
      dists = dists.filter((d) => d.formId === selectedFormId || !d.formId)
    }

    const map = new Map<string, PersonAuthorOption>()

    dists.forEach((d) => {
      const ownerName = d.ownerName || 'Kader Lapangan'
      const ownerKey = ownerName.trim().toLowerCase()
      const code = d.code || d.distributionId

      if (!map.has(ownerKey)) {
        map.set(ownerKey, {
          ownerKey,
          ownerName,
          ownerType: d.ownerType || 'cadre',
          codes: code ? [code] : [],
          count: 1,
        })
      } else {
        const existing = map.get(ownerKey)!
        if (code && !existing.codes.includes(code)) {
          existing.codes.push(code)
        }
        existing.count += 1
      }
    })

    responses.forEach((r) => {
      if (selectedFormId === 'all' || r.formId === selectedFormId || (r as any).formTitle === selectedFormId) {
        const ownerName = (r as any).ownerName || 'Kader Lapangan'
        const ownerKey = ownerName.trim().toLowerCase()
        const code = r.distributionCode || (r as any).groupName || 'V1-DIST'

        if (!map.has(ownerKey)) {
          map.set(ownerKey, {
            ownerKey,
            ownerName,
            ownerType: (r as any).ownerType || 'cadre',
            codes: code ? [code] : [],
            count: 1,
          })
        } else {
          const existing = map.get(ownerKey)!
          if (code && !existing.codes.includes(code)) {
            existing.codes.push(code)
          }
        }
      }
    })

    return Array.from(map.values())
  }, [dbDistributions, responses, selectedFormId])

  // Reset Author Selection if selected author is no longer in available list
  useEffect(() => {
    if (selectedAuthorCode !== 'all') {
      const exists = availableAuthors.some((a) => a.ownerKey === selectedAuthorCode || a.ownerName === selectedAuthorCode)
      if (!exists) setSelectedAuthorCode('all')
    }
  }, [selectedFormId, availableAuthors, selectedAuthorCode])

  // Filtered & Strictly Submitted Responses
  const filteredResponses = useMemo(() => {
    return responses.filter((r) => {
      const term = searchTerm.toLowerCase()
      const formTitle = (r as any).formTitle || 'Formulir Evaluasi Keamanan Pangan'
      const distCode = r.distributionCode || 'V1-DIST'
      const distTitle = (r as any).distributionTitle || (r as any).groupName || 'Kader Lapangan'
      const ownerName = (r as any).ownerName || 'Kader Lapangan'
      const ownerKey = ownerName.trim().toLowerCase()

      const matchesSearch =
        (r.responseId || '').toLowerCase().includes(term) ||
        distCode.toLowerCase().includes(term) ||
        distTitle.toLowerCase().includes(term) ||
        formTitle.toLowerCase().includes(term) ||
        ownerName.toLowerCase().includes(term) ||
        (r.respondent?.name || '').toLowerCase().includes(term) ||
        (r.respondent?.email || '').toLowerCase().includes(term)

      const matchesForm = selectedFormId === 'all' || r.formId === selectedFormId || formTitle === selectedFormId

      let matchesAuthor = true
      if (selectedAuthorCode !== 'all') {
        const selectedPerson = availableAuthors.find((a) => a.ownerKey === selectedAuthorCode || a.ownerName === selectedAuthorCode)
        if (selectedPerson) {
          matchesAuthor =
            ownerKey === selectedPerson.ownerKey ||
            selectedPerson.codes.includes(distCode) ||
            ownerName === selectedPerson.ownerName
        } else {
          matchesAuthor = ownerKey === selectedAuthorCode.toLowerCase() || distCode === selectedAuthorCode
        }
      }

      return matchesSearch && matchesForm && matchesAuthor
    })
  }, [responses, searchTerm, selectedFormId, selectedAuthorCode, availableAuthors])

  // Pagination Math
  const totalPages = Math.ceil(filteredResponses.length / itemsPerPage) || 1
  const paginatedResponses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredResponses.slice(start, start + itemsPerPage)
  }, [filteredResponses, currentPage, itemsPerPage])

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedFormId, selectedAuthorCode])

  const stats = useMemo(() => {
    const total = responses.length
    const scores = responses.map((r) => r.result?.percentage).filter((s): s is number => typeof s === 'number')
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const passCount = responses.filter((r) => r.result?.percentage && r.result.percentage >= 75).length

    return { total, avgScore, passCount }
  }, [responses])

  const openAnswerModal = (r: ResponseDoc, initialTab: 'answers' | 'details' | 'codeAnalysis' = 'answers') => {
    setSelectedRespondent(r)
    setPreviewTab(initialTab)
    setIsPreviewModalOpen(true)
  }

  const exportToExcel = () => {
    const dataToExport = filteredResponses
    if (dataToExport.length === 0) {
      alert('Tidak ada data respon untuk diexport.')
      return
    }

    const wb = XLSX.utils.book_new()
    const formTitle = selectedFormId === 'all' ? 'Semua Formulir' : selectedFormId
    const exportDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

    const getRespondentAspects = (r: any): Array<{ aspectId: string; title: string; percentage: number; rawScore: number; maxScore: number }> => {
      if (r.result?.aspects && Array.isArray(r.result.aspects) && r.result.aspects.length > 0) {
        return r.result.aspects.map((asp: any) => ({
          aspectId: asp.aspectId || asp.id,
          title: asp.title || asp.name || asp.aspectId || 'Aspek',
          percentage: Math.round(asp.percentage ?? 0),
          rawScore: asp.rawScore ?? asp.score ?? 0,
          maxScore: asp.maximumScore ?? asp.maxScore ?? 100,
        }))
      }
      return []
    }

    // Collect all aspect titles
    const aspectMap = new Map<string, { title: string; totalPct: number; count: number }>()
    dataToExport.forEach((r) => {
      const aspects = getRespondentAspects(r)
      aspects.forEach((asp) => {
        const key = (asp.title || asp.aspectId).trim()
        if (!aspectMap.has(key)) {
          aspectMap.set(key, { title: asp.title, totalPct: asp.percentage, count: 1 })
        } else {
          const item = aspectMap.get(key)!
          item.totalPct += asp.percentage
          item.count += 1
        }
      })
    })

    // Sheet 1: Summary
    const total = dataToExport.length
    const scores = dataToExport.map(r => r.result?.percentage ?? 0)
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / total) : 0

    const summaryData: any[][] = [
      ['LAPORAN HASIL EVALUASI & PENILAIAN RESPONDEN'],
      [''],
      ['Formulir', formTitle],
      ['Tanggal Export', exportDate],
      [''],
      ['STATISTIK OVERALL'],
      ['Total Responden Terverifikasi', total],
      ['Rata-rata Skor Overall', `${avgScore}%`],
      ['Memenuhi Syarat (MS >= 75%)', dataToExport.filter(r => (r.result?.percentage ?? 0) >= 75).length],
    ]

    if (aspectMap.size > 0) {
      summaryData.push([''])
      summaryData.push(['RINGKASAN RATA-RATA PENILAIAN PER ASPEK'])
      summaryData.push(['Nama Aspek Penilaian', 'Rata-rata Skor (%)', 'Status Kelayakan'])
      aspectMap.forEach((val) => {
        const avg = Math.round(val.totalPct / val.count)
        const statusLbl = avg >= 80 ? 'Memenuhi Syarat (MS)' : avg >= 60 ? 'Binaan Lanjutan' : 'Perlu Perbaikan'
        summaryData.push([val.title, `${avg}%`, statusLbl])
      })
    }

    const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
    ws1['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 25 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary')

    // Sheet 2: Responden (With Per-Aspect Columns)
    const aspectTitles = Array.from(aspectMap.values()).map(a => a.title)

    const respData = dataToExport.map((r, i) => {
      const respAspects = getRespondentAspects(r)
      const aspScoreObj: Record<string, string> = {}
      aspectTitles.forEach(t => {
        const found = respAspects.find(a => a.title === t)
        aspScoreObj[`[Aspek] ${t} (%)`] = found ? `${found.percentage}%` : '-'
      })

      return {
        'No': i + 1,
        'ID Respon': r.responseId,
        'Nama Responden': r.respondent?.name || 'Anonim',
        'Email': r.respondent?.email || '-',
        'No HP': r.respondent?.phone || '-',
        'Instansi / Sekolah': r.respondent?.institution || '-',
        'Formulir': (r as any).formTitle || r.formId,
        'Kode Akses': r.distributionCode || '-',
        'Waktu Selesai': new Date(r.submittedAt || r.updatedAt || Date.now()).toLocaleString('id-ID'),
        'Skor Overall (%)': `${r.result?.percentage ?? 0}%`,
        'Grade': r.result?.grade || '-',
        'Predikat / Threshold': r.result?.thresholdTitle || '-',
        ...aspScoreObj,
        'Status': r.status,
      }
    })

    const ws2 = XLSX.utils.json_to_sheet(respData)
    const ws2Cols = [
      { wch: 5 }, { wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 25 },
      { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 16 }, { wch: 10 }, { wch: 25 }
    ]
    aspectTitles.forEach(() => ws2Cols.push({ wch: 22 }))
    ws2Cols.push({ wch: 12 })
    ws2['!cols'] = ws2Cols
    XLSX.utils.book_append_sheet(wb, ws2, 'Daftar Responden')

    // Sheet 3: Penilaian Per Aspek
    if (aspectMap.size > 0) {
      const aspectDetailRows: any[] = []
      dataToExport.forEach((r, i) => {
        const respAspects = getRespondentAspects(r)
        respAspects.forEach((asp) => {
          aspectDetailRows.push({
            'No Responden': i + 1,
            'ID Respon': r.responseId,
            'Nama Responden': r.respondent?.name || 'Anonim',
            'Instansi / Sekolah': r.respondent?.institution || '-',
            'Formulir': (r as any).formTitle || r.formId,
            'Skor Overall (%)': `${r.result?.percentage ?? 0}%`,
            'Nama Aspek Penilaian': asp.title,
            'Skor Aspek (%)': `${asp.percentage}%`,
            'Poin Terpenuhi': asp.rawScore,
            'Maksimum Poin': asp.maxScore,
            'Status Aspek': asp.percentage >= 80 ? 'Memenuhi Syarat (MS)' : asp.percentage >= 60 ? 'Binaan Lanjutan' : 'Perlu Perbaikan',
          })
        })
      })

      if (aspectDetailRows.length > 0) {
        const ws3 = XLSX.utils.json_to_sheet(aspectDetailRows)
        ws3['!cols'] = [
          { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 30 },
          { wch: 16 }, { wch: 30 }, { wch: 15 }, { wch: 14 }, { wch: 14 }, { wch: 22 }
        ]
        XLSX.utils.book_append_sheet(wb, ws3, 'Penilaian Per Aspek')
      }
    }

    const fileName = `Laporan_Hasil_Evaluasi_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setSelectedFormId('all')
    setSelectedAuthorCode('all')
    setCurrentPage(1)
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Topbar
        title="Hasil Penilaian Resmi & Data Responden Terverifikasi"
        subtitle="Auditing hasil kuesioner terkirim (submitted), analisis skor lingkaran, dan evaluasi kontribusi kader per orang"
      />

      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold">Total Laporan Terverifikasi</span>
              <Icon name="checkCircle" className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-black font-mono text-slate-100">{stats.total}</p>
            <p className="text-[11px] text-emerald-400/80 font-mono">Status terkirim (Submitted) saja</p>
          </div>

          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold">Rata-rata Skor Evaluasi</span>
              <Icon name="award" className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-3xl font-black font-mono text-purple-300">{stats.avgScore}%</p>
            <p className="text-[11px] text-slate-500 font-mono">Skor rata-rata nasional</p>
          </div>

          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold">Memenuhi Syarat (MS)</span>
              <Icon name="shieldCheck" className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-black font-mono text-amber-300">{stats.passCount}</p>
            <p className="text-[11px] text-amber-400/80 font-mono">Skor kelayakan &ge; 75%</p>
          </div>
        </div>

        {/* Pure Person Filter Action Bar: Kiri = Formulir, Kanan = Author / Orang (Superadmin, Kader, Mitra) */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-md">
          <div className="flex flex-wrap items-end gap-3 flex-1">
            {/* Smart Search Bar */}
            <div className="flex flex-col flex-1 sm:flex-initial">
              <label className="text-[10px] font-mono text-slate-400 font-bold uppercase mb-1">Cari Responden</label>
              <div className="relative">
                <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Nama / email / lokasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-48"
                />
              </div>
            </div>

            {/* KIRI: Filter Formulir */}
            <div className="flex flex-col flex-1 sm:flex-initial">
              <label className="text-[10px] font-mono text-cyan-400 font-bold uppercase mb-1">1. Formulir (Kiri)</label>
              <select
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-semibold w-full sm:w-56"
              >
                <option value="all">Semua Formulir ({mergedFormOptions.length})</option>
                {mergedFormOptions.map((f) => (
                  <option key={f.formId} value={f.formId}>
                    {f.title}
                  </option>
                ))}
              </select>
            </div>

            {/* KANAN: Filter Author / Orang (Superadmin, Kader 1, Mitra, dst) */}
            <div className="flex flex-col flex-1 sm:flex-initial">
              <label className="text-[10px] font-mono text-purple-400 font-bold uppercase mb-1">2. Author / Orang (Kanan)</label>
              <select
                value={selectedAuthorCode}
                onChange={(e) => setSelectedAuthorCode(e.target.value)}
                className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-semibold w-full sm:w-72"
              >
                <option value="all">Semua Author / Orang ({availableAuthors.length})</option>
                {availableAuthors.map((a) => (
                  <option key={a.ownerKey} value={a.ownerKey}>
                    {a.ownerName} ({a.ownerType === 'admin' ? 'Super Admin' : a.ownerType === 'cadre' ? 'Kader' : 'Mitra'})
                  </option>
                ))}
              </select>
            </div>

            {(searchTerm || selectedFormId !== 'all' || selectedAuthorCode !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold transition-colors"
                title="Reset Filter"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto">
            {selectedResponseIds.length > 0 && (
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all animate-pulse"
              >
                <Icon name="trash" className="w-4 h-4" />
                <span>Hapus {selectedResponseIds.length} Terpilih (Bulk Delete)</span>
              </button>
            )}

            <button
              type="button"
              onClick={exportToExcel}
              disabled={filteredResponses.length === 0}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
              title="Download rekapitulasi data nilai overall & penilaian per aspek ke Excel"
            >
              <Icon name="fileSpreadsheet" className="w-4 h-4 text-emerald-200" />
              <span>Export Excel</span>
            </button>

            {/* View Layout Switcher (Cards vs Table) */}
            <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono">
              <button
                type="button"
                onClick={() => setViewLayout('cards')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                  viewLayout === 'cards' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tampilan Kartu Skor Lingkaran"
              >
                <Icon name="grid" className="w-3.5 h-3.5" />
                <span>Kartu</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('table')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                  viewLayout === 'table' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tampilan Tabel Ringkas"
              >
                <Icon name="list" className="w-3.5 h-3.5" />
                <span>Tabel</span>
              </button>
            </div>

            <button
              type="button"
              onClick={loadResponses}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <Icon name="rotateCcw" className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Content Workspace Canvas */}
        {isLoading ? (
          viewLayout === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <SkeletonTable rows={6} cols={6} />
          )
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-300 space-y-2 rounded-3xl bg-slate-900 border border-slate-800">
            <p className="font-semibold">{error}</p>
            <button onClick={loadResponses} className="px-4 py-2 rounded-xl bg-rose-950 border border-rose-500/40 text-rose-200 font-bold">
              Coba Ulang
            </button>
          </div>
        ) : paginatedResponses.length === 0 ? (
          <div className="text-center py-20 text-slate-500 space-y-2 rounded-3xl bg-slate-900 border border-slate-800">
            <Icon name="fileText" className="w-12 h-12 mx-auto text-slate-700" />
            <p className="text-sm font-bold text-slate-300">Belum Ada Tanggapan Terverifikasi</p>
            <p className="text-xs text-slate-500">Kuesioner terkirim yang telah selesai dinilai akan muncul di sini secara otomatis.</p>
          </div>
        ) : viewLayout === 'cards' ? (
          /* CARD LAYOUT WITH CIRCULAR SCORE METRIC DONUT GAUGE */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {paginatedResponses.map((r) => {
              const res = r.result
              const rawScoreVal =
                res?.percentage ??
                res?.rawScore ??
                (r as any).score ??
                (r as any).totalScore ??
                (r as any).percentage ??
                (r as any).finalScore ??
                0

              const score = Math.min(100, Math.max(0, Math.round(Number(rawScoreVal) || 0)))
              const grade = res?.grade || (score >= 80 ? 'Grade A' : score >= 60 ? 'Grade B' : 'Grade C')
              const thresholdTitle = res?.thresholdTitle || (score >= 80 ? 'Memenuhi Syarat (MS)' : score >= 60 ? 'Binaan Lanjutan' : 'Perlu Perbaikan')

              const formTitle = ((r as any).formTitle || 'Formulir Evaluasi Keamanan Pangan').replace(/^form_[\w\-]+/g, 'Formulir Evaluasi Pangan')
              const distCode = r.distributionCode || 'V1-DIST'
              const ownerName = (r as any).ownerName || 'Penerbit Kode'

              return (
                <div
                  key={r.responseId}
                  className={`rounded-3xl bg-slate-900 border overflow-hidden shadow-xl transition-all flex flex-col justify-between ${
                    selectedResponseIds.includes(r.responseId)
                      ? 'border-cyan-500/80 bg-cyan-950/20'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="p-6 space-y-5">
                    {/* Top Row: Circular Score Gauge (Left) + Details (Right) */}
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedResponseIds.includes(r.responseId)}
                        onChange={() => handleSelectResponseToggle(r.responseId)}
                        className="mt-2 w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950 cursor-pointer shrink-0"
                      />
                      {/* Left Side: Circular Score Donut Gauge */}
                      <CircularScoreGauge score={score} grade={grade} />

                      {/* Right Side: Respondent & Form Metadata */}
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-100 truncate" title={formTitle}>
                            {formTitle}
                          </span>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            TERVERIFIKASI ✓
                          </span>
                        </div>

                        {/* Respondent Name & Contact Info */}
                        <div className="space-y-0.5">
                          <h3 className="text-sm font-extrabold text-cyan-300 truncate">
                            {extractRespondentName(r)}
                          </h3>
                          {(extractRespondentEmail(r) || r.respondent?.email) && (
                            <p className="text-xs text-slate-400 font-mono truncate">{extractRespondentEmail(r) || r.respondent?.email}</p>
                          )}
                        </div>

                        {/* Author Kode & Threshold Badge */}
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                          <div className="text-[11px] font-bold text-slate-200 line-clamp-1">
                            {thresholdTitle}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between gap-2">
                            <span>Author: <strong className="text-purple-300 font-sans">{ownerName}</strong> ({distCode})</span>
                            <span>{new Date(r.submittedAt || r.updatedAt || Date.now()).toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Toolbar */}
                  <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center justify-between gap-2 border-t border-slate-800/80 pt-3 mt-1">
                      <button
                        type="button"
                        onClick={() => openAnswerModal(r, 'answers')}
                        className="px-4 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-extrabold border border-cyan-500/40 flex items-center gap-1.5 transition-all shadow-md flex-1 justify-center"
                      >
                        <Icon name="eye" className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Lihat Jawaban</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedResponse(r)
                          setIsDeleteModalOpen(true)
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center gap-1.5 transition-all"
                        title="Hapus tanggapan ini"
                      >
                        <Icon name="trash" className="w-4 h-4 text-rose-400" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* TABLE LAYOUT FALLBACK */
          <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="divide-y divide-slate-800/80">
              {paginatedResponses.map((r) => {
                const res = r.result
                const rawScoreVal =
                  res?.percentage ??
                  res?.rawScore ??
                  (r as any).score ??
                  (r as any).totalScore ??
                  (r as any).percentage ??
                  (r as any).finalScore ??
                  0

                const score = Math.min(100, Math.max(0, Math.round(Number(rawScoreVal) || 0)))
                const grade = res?.grade || (score >= 80 ? 'A' : score >= 60 ? 'B' : 'C')
                const thresholdTitle = res?.thresholdTitle || (score >= 80 ? 'Memenuhi Syarat (MS)' : score >= 60 ? 'Binaan Lanjutan' : 'Perlu Perbaikan')
                const formTitle = ((r as any).formTitle || 'Formulir Evaluasi Keamanan Pangan').replace(/^form_[\w\-]+/g, 'Formulir Evaluasi Pangan')
                const ownerName = (r as any).ownerName || 'Penerbit Kode'

                return (
                  <div
                    key={r.responseId}
                    className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                      selectedResponseIds.includes(r.responseId)
                        ? 'bg-cyan-950/30'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedResponseIds.includes(r.responseId)}
                        onChange={() => handleSelectResponseToggle(r.responseId)}
                        className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950 cursor-pointer shrink-0"
                      />
                      <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                        <span className="font-bold text-slate-100 font-sans">
                          {formTitle}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-bold border border-purple-500/30">
                          Author: {ownerName}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40">
                          TERVERIFIKASI ✓
                        </span>
                      </div>

                      <div className="text-sm font-bold text-cyan-300">
                        {r.respondent?.name || 'Responden Publik (Anonim)'}
                      </div>

                      <div className="text-xs font-mono text-slate-300 font-bold">
                        Skor: {score}% — Predikat {grade} ({thresholdTitle})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openAnswerModal(r, 'answers')}
                        className="px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-extrabold border border-cyan-500/40 flex items-center gap-1.5 transition-all shadow-md"
                      >
                        <Icon name="eye" className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Lihat Jawaban</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedResponse(r)
                          setIsDeleteModalOpen(true)
                        }}
                        className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center gap-1 transition-all"
                        title="Hapus tanggapan ini"
                      >
                        <Icon name="trash" className="w-3.5 h-3.5 text-rose-400" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* PAGINATION CONTROLS BAR */}
        {totalPages > 1 && (
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 flex-wrap shadow-md font-mono text-xs">
            <span className="text-slate-400">
              Menampilkan Halaman <strong className="text-cyan-400">{currentPage}</strong> dari <strong>{totalPages}</strong> ({filteredResponses.length} Tanggapan Terverifikasi)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 font-bold transition-colors"
              >
                ← Sebelumnya
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setCurrentPage(pg)}
                    className={`w-8 h-8 rounded-xl font-bold transition-all ${
                      currentPage === pg
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 font-bold transition-colors"
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========== INTEGRATED ANSWER & CODE ANALYSIS MODAL ========== */}
      {isPreviewModalOpen && selectedRespondent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={() => setIsPreviewModalOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Inspeksi & Analisis Hasil Evaluasi Responden
                </span>
                <h3 className="text-base font-extrabold text-slate-100">
                  {selectedRespondent.respondent?.name || 'Responden Publik'}
                </h3>
                <p className="text-xs text-slate-400 font-sans font-semibold">
                  Formulir: {(selectedRespondent as any).formTitle || selectedRespondent.formId}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100"
              >
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 font-sans">
              {/* TOP HERO SUMMARY: CODE ANALYSIS & SCORE SUMMARY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card 1: Score & Threshold */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 space-y-2 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                      Nilai & Predikat Evaluasi
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      TERVERIFIKASI ✓
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black font-mono text-cyan-300">
                      {selectedRespondent.result?.percentage ?? 0}%
                    </span>
                    <span className="text-sm font-extrabold text-emerald-400 font-mono">
                      Grade {selectedRespondent.result?.grade || 'N/A'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-100">
                    {selectedRespondent.result?.thresholdTitle || 'Memenuhi Syarat (MS)'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Waktu Selesai: {new Date(selectedRespondent.submittedAt || selectedRespondent.updatedAt || Date.now()).toLocaleString('id-ID')}
                  </p>
                </div>

                {/* Card 2: Code & Author Analysis */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 space-y-2 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider">
                      Analisis Kode & Author
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30 font-bold uppercase">
                      {(selectedRespondent as any).ownerType || 'cadre'}
                    </span>
                  </div>
                  <p className="text-2xl font-black font-mono text-purple-200 tracking-wider">
                    {selectedRespondent.distributionCode || 'V1-LEGACY-DIST'}
                  </p>
                  <div className="text-xs space-y-0.5">
                    <p className="text-slate-300 font-bold">
                      Author: <span className="text-purple-300">{(selectedRespondent as any).ownerName || 'Administrator BPOM'}</span>
                    </p>
                    <p className="text-slate-400 font-mono text-[11px]">
                      Form: {(selectedRespondent as any).formTitle || 'Formulir Evaluasi Pangan'} (v{selectedRespondent.versionNumber || 1.5})
                    </p>
                  </div>
                </div>
              </div>

              {/* BIODATA RESPONDEN CARD IN INSPECTION MODAL */}
              {((selectedRespondent.biodata && selectedRespondent.biodata.length > 0) || selectedRespondent.respondent?.institution || selectedRespondent.respondent?.email || selectedRespondent.respondent?.phone) && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                    <Icon name="user" className="w-3.5 h-3.5 text-purple-400" />
                    <span>Profil & Data Biodata Diri Responden:</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {selectedRespondent.respondent?.name && (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Nama Lengkap</span>
                        <div className="font-bold text-slate-100">{selectedRespondent.respondent.name}</div>
                      </div>
                    )}
                    {selectedRespondent.respondent?.email && (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Email</span>
                        <div className="font-bold text-cyan-300">{selectedRespondent.respondent.email}</div>
                      </div>
                    )}
                    {selectedRespondent.respondent?.phone && (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">No. HP / Telp</span>
                        <div className="font-bold text-emerald-300">{selectedRespondent.respondent.phone}</div>
                      </div>
                    )}
                    {selectedRespondent.respondent?.institution && (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Instansi / Sekolah</span>
                        <div className="font-bold text-purple-300">{selectedRespondent.respondent.institution}</div>
                      </div>
                    )}
                    {selectedRespondent.respondent?.address && (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Alamat / Lokasi</span>
                        <div className="font-bold text-slate-200">{selectedRespondent.respondent.address}</div>
                      </div>
                    )}
                    {selectedRespondent.biodata?.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase truncate block">{item.label}</span>
                        <div className="font-bold text-cyan-300">{item.value || '-'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MAIN SECTION: RESPONDENT ANSWERS */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Icon name="fileText" className="w-3.5 h-3.5 text-cyan-400" />
                  Rincian Pertanyaan & Jawaban Responden:
                </h4>

                {selectedRespondent.result?.questions && selectedRespondent.result.questions.length > 0 ? (
                  selectedRespondent.result.questions.map((q: any, qIdx: number) => {
                    const type = q.questionType || q.type
                    const prompt = q.prompt || `Pertanyaan ${qIdx + 1}`
                    const aspectTitle = q.aspectTitle || (q.aspectId !== 'default' ? q.aspectId : '')

                    return (
                      <div key={q.questionId || qIdx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap text-[10px] font-mono font-bold text-cyan-400">
                          <span>Pertanyaan #{String(qIdx + 1).padStart(2, '0')} {aspectTitle ? `• ${aspectTitle}` : ''}</span>
                          {q.maximumScore > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                              {q.percentage}% ({q.rawScore}/{q.maximumScore} Poin)
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-bold text-slate-100 leading-snug">{prompt}</p>

                        {/* INDICATOR TABLE QUESTION */}
                        {(type === 'indicator-table' || type === 'likert') && q.details?.indicators && (
                          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
                            <table className="w-full text-xs font-mono">
                              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold">
                                <tr>
                                  <th className="text-left p-2.5 px-3.5 border-r border-slate-800 font-sans">Indikator Penilaian</th>
                                  <th className="text-right p-2.5 px-3.5 font-sans">Jawaban Responden</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/80 bg-slate-900">
                                {q.details.indicators.map((ind: any, iIdx: number) => (
                                  <tr key={iIdx} className="hover:bg-slate-800/40 transition-colors">
                                    <td className="p-2.5 px-3.5 font-sans text-slate-200 border-r border-slate-800">{ind.label || `Indikator ${iIdx + 1}`}</td>
                                    <td className="p-2.5 px-3.5 text-right font-bold text-cyan-300">
                                      {expandScaleLabel(ind.selectedValue ?? ind.value ?? '-')}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* SINGLE CHOICE / DROPDOWN / BINARY */}
                        {(type === 'single-choice' || type === 'dropdown' || type === 'binary') && (
                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-cyan-300 font-bold">
                            {expandScaleLabel(q.selectedValue || q.value || '-')}
                          </div>
                        )}

                        {/* MULTIPLE CHOICE / ARRAY */}
                        {type === 'multiple-choice' && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {(Array.isArray(q.selectedValue) ? q.selectedValue : [q.selectedValue]).map((item: any, i: number) => (
                              <span key={i} className="px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-500/40 text-xs font-mono text-cyan-300 font-bold">
                                {expandScaleLabel(item)}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* SIGNATURE */}
                        {type === 'signature' && (
                          <div className="rounded-xl overflow-hidden border border-slate-800 bg-white p-2 max-w-xs">
                            <img src={q.selectedValue || (selectedRespondent.answers as any)?.[q.questionId]} alt="Tanda Tangan" className="max-h-32 mx-auto" />
                          </div>
                        )}

                        {/* TEXT / OTHER */}
                        {!['indicator-table', 'likert', 'single-choice', 'dropdown', 'binary', 'multiple-choice', 'signature'].includes(type) && (
                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-200">
                            {String(q.selectedValue || (selectedRespondent.answers as any)?.[q.questionId] || '-')}
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  Object.entries(selectedRespondent.answers || {}).map(([key, value], idx) => {
                    if (
                      [
                        'respondentName',
                        'respondentEmail',
                        'name',
                        'nama',
                        'email',
                        'createdAt',
                        'formCode',
                        'formId',
                        'formTitle',
                        'submittedAt',
                      ].includes(key)
                    )
                      return null

                    const { type, content } = formatAnswerValue(value)

                    return (
                      <div key={key || idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold text-cyan-400">
                          <span>Pertanyaan #{String(idx + 1).padStart(2, '0')}</span>
                        </div>

                        <p className="text-xs font-bold text-slate-200 leading-snug">{key}</p>

                        {type === 'signature' && (
                          <div className="rounded-xl overflow-hidden border border-slate-800 bg-white p-2 max-w-xs">
                            <img src={content} alt="Tanda Tangan Digital" className="max-h-32 mx-auto" />
                          </div>
                        )}

                        {type === 'table' && (
                          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
                            <table className="w-full text-xs font-mono">
                              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase">
                                <tr>
                                  <th className="text-left p-2.5 px-3.5 border-r border-slate-800 font-sans">Sub Pertanyaan / Indikator</th>
                                  <th className="text-right p-2.5 px-3.5 font-sans">Jawaban</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/80 bg-slate-900">
                                {Object.entries(content).map(([subKey, subVal], i) => (
                                  <tr key={i}>
                                    <td className="p-2.5 px-3.5 font-sans text-slate-300 border-r border-slate-800">{subKey}</td>
                                    <td className="p-2.5 px-3.5 text-right font-bold text-cyan-300">
                                      {expandScaleLabel(subVal)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {type === 'array' && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {content.map((item: any, i: number) => (
                              <span
                                key={i}
                                className="px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-500/40 text-xs font-mono text-cyan-300 font-bold"
                              >
                                {expandScaleLabel(item)}
                              </span>
                            ))}
                          </div>
                        )}

                        {type === 'text' && (
                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-200">
                            {expandScaleLabel(content)}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900">
              <button
                type="button"
                onClick={() => {
                  setIsPreviewModalOpen(false)
                  setSelectedResponse(selectedRespondent)
                  setIsDeleteModalOpen(true)
                }}
                className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-xs font-bold text-rose-300 transition-all flex items-center gap-1.5"
              >
                <Icon name="trash" className="w-3.5 h-3.5 text-rose-400" />
                <span>Hapus Tanggapan Ini</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-lg shadow-cyan-600/20"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && selectedResponse && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-950 border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                <Icon name="trash" className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Konfirmasi Hapus Tanggapan</h3>
                <p className="text-xs text-rose-300 font-mono">ID: {selectedResponse.responseId}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus data tanggapan kuesioner dari <strong>{(selectedResponse as any).respondentName || (selectedResponse as any).answers?.name || 'Responden'}</strong>? Tindakan ini permanen dan tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setSelectedResponse(null)
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleDeleteResponse}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-extrabold text-white shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                <Icon name="trash" className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanent'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {isBulkDeleteModalOpen && selectedResponseIds.length > 0 && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-950 border border-rose-500/50 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                <Icon name="trash" className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Konfirmasi Hapus Terpilih (Bulk Delete)</h3>
                <p className="text-xs text-rose-300 font-mono">{selectedResponseIds.length} Tanggapan Terpilih</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus sekaligus <strong>{selectedResponseIds.length} data tanggapan</strong> kuesioner yang telah Anda pilih? Tindakan ini bersifat permanen dari database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleBulkDeleteResponses}
                disabled={isBulkDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-extrabold text-white shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                <Icon name="trash" className="w-3.5 h-3.5" />
                <span>{isBulkDeleting ? 'Menghapus...' : `Ya, Hapus ${selectedResponseIds.length} Tanggapan`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
