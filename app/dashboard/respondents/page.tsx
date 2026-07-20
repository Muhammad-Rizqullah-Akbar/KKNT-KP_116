'use client'

import { useState, useEffect, useMemo } from 'react'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import {
  getAllResponses,
  getForms,
  getFormGroups,
  deleteResponse,
  type FormResponse,
  type FormData,
  type FormGroup,
} from '@/lib/firebase/repositories/forms.repo'
import { ScoringEngine } from '@/lib/scoring/scoringEngine'
import * as XLSX from 'xlsx'

// ---------- TYPES ----------
type Respondent = {
  id: string
  name: string
  formId: string
  formCode: string
  formTitle: string
  groupId?: string | null
  groupName?: string
  submittedAt: string
  date: string
  answers: Record<string, any>
  respondentName?: string
  respondentEmail?: string
  score: number
  metric: string
  status: string
  scoringDetails?: {
    correctCount: number
    wrongCount: number
    skippedCount: number
    totalQuestions: number
  }
  scoringPerStage?: Record<string, {
    earned: number
    possible: number
    percentage: number
    name: string
  }>
}

// ============ HELPER: PEMBERSIH STRING ============
const cleanString = (str: string) => {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')   // ganti tanda baca dengan spasi
    .replace(/\s+/g, ' ')       // spasi ganda jadi satu
    .trim()
}

export default function RespondentsPage() {
  // ---------- STATE ----------
  const [respondents, setRespondents] = useState<Respondent[]>([])
  const [forms, setForms] = useState<FormData[]>([])
  const [groups, setGroups] = useState<FormGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedForms, setSelectedForms] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRespondent, setSelectedRespondent] = useState<Respondent | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewTab, setPreviewTab] = useState<'answers' | 'details'>('answers')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [respondentToDelete, setRespondentToDelete] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const itemsPerPage = 10

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ============ LOAD DATA ============
  const loadData = async () => {
    setLoading(true)
    try {
      const [responsesData, formsData, groupsData] = await Promise.all([
        getAllResponses(),
        getForms(),
        getFormGroups(),
      ])

      setForms(formsData)
      setGroups(groupsData)

      const transformedRespondents: Respondent[] = await Promise.all(
        responsesData.map(async (response: FormResponse) => {
          const form = formsData.find(f => f.id === response.formId)
          const group = form?.groupId ? groupsData.find(g => g.id === form.groupId) : null

          // 🔥 MAPPING JAWABAN KHUSUS UNTUK SCORING ENGINE (Flatten object & IDs)
          const mappedAnswers = mapAnswersToQuestionIds(response.answers || {}, form)

          // 🔥 KALKULASI SKOR DENGAN DISTRIBUSI ASLI
          const { score, details, perStage } = await calculateScoreWithEngine(
            mappedAnswers,
            form || null
          )

          const metric = getMetricLabel(score)
          const status = getStatusByScore(score)

          const submittedDate = response.submittedAt
            ? new Date(response.submittedAt)
            : response.createdAt?.toDate?.() || new Date()

          const respondentName =
            response.respondentName ||
            response.answers?.respondentName ||
            response.answers?.name ||
            response.answers?.nama ||
            'Responden'

          const respondentEmail =
            response.respondentEmail ||
            response.answers?.respondentEmail ||
            response.answers?.email ||
            ''

          return {
            id: response.id || Math.random().toString(36).substring(2, 9),
            name: respondentName,
            formId: response.formId,
            formCode: response.formCode,
            formTitle: response.formTitle || form?.title || 'Formulir Tanpa Judul',
            groupId: form?.groupId || null,
            groupName: group?.title || null,
            submittedAt: submittedDate.toISOString(),
            date: submittedDate.toLocaleDateString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric',
            }),
            answers: response.answers || {}, // 🛡️ PERTAHANKAN STRUKTUR ASLI UNTUK UI & EXCEL
            respondentName,
            respondentEmail,
            score,
            metric,
            status,
            scoringDetails: details,
            scoringPerStage: perStage,
          }
        })
      )

      setRespondents(transformedRespondents)
    } catch (error) {
      console.error('Error loading data:', error)
      showToast('Gagal memuat data responden', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ============ MAPPING JAWABAN: TEKS PERTANYAAN → ID (KHUSUS SCORING) ============
  const mapAnswersToQuestionIds = (
    rawAnswers: Record<string, any>,
    form: FormData | null
  ): Record<string, any> => {
    if (!form || !form.questions) return rawAnswers

    const mapped: Record<string, any> = {}
    const questionById: Record<string, any> = {}
    const questionByLabel: Record<string, any> = {}        
    const questionByCleanLabel: Record<string, any> = {}   

    form.questions.forEach((q: any) => {
      questionById[q.id] = q
      const label = (q.question || q.label || '').trim()
      if (label) {
        questionByLabel[label] = q
        questionByCleanLabel[cleanString(label)] = q
      }
    })

    for (const [key, value] of Object.entries(rawAnswers)) {
      let q = questionByLabel[key] || questionByCleanLabel[cleanString(key)] || questionById[key]

      if (!q) {
        let found = false
        for (const [lbl, ques] of Object.entries(questionByLabel)) {
          if (key.includes(lbl) || cleanString(key).includes(cleanString(lbl))) {
            q = ques
            found = true
            break
          }
        }
      }

      if (q) {
        const type = q.answerType || q.type || 'short-text'

        // 🔥 FLATTEN JAWABAN TABEL/LIKERT UNTUK ENGINE
        if ((type === 'indicator-table' || type === 'likert') && typeof value === 'object' && !Array.isArray(value)) {
          const indicators = q.config?.indicators || []
          const statements = q.config?.statements || q.options || []
          const rows = indicators.length > 0 ? indicators.map((ind: any) => ind.label || ind) : statements

          for (const [rowLabel, rowVal] of Object.entries(value)) {
            const rowIndex = rows.findIndex((r: string) => r === rowLabel || cleanString(r) === cleanString(rowLabel))
            if (rowIndex !== -1) {
              mapped[`${q.id}-${rowIndex}`] = rowVal
            }
          }
        } else {
          mapped[q.id] = value
        }
      } else {
        mapped[key] = value
      }
    }

    return mapped
  }

  // ============ KALKULASI SKOR DENGAN ENGINE ============
  const calculateScoreWithEngine = (
    answers: Record<string, any>,
    form: FormData | null
  ): Promise<{ score: number; details: any; perStage: any }> => {
    return new Promise((resolve) => {
      if (!form || !form.questions || form.questions.length === 0) {
        resolve({
          score: 0,
          details: { correctCount: 0, wrongCount: 0, skippedCount: 0, totalQuestions: 0 },
          perStage: {},
        })
        return
      }

      try {
        const scoring = form.scoring || {
          totalPoints: 100,
          mode: 'auto',
          distribution: {},
          overrides: {},
          allowOverride: true,
          autoBalance: true,
        }

        const validation = form.validation || {
          mode: 'all_required',
          exceptions: [],
          allowOverride: true,
        }

        let stages = form.stages
        if (!stages || stages.length === 0) {
          stages = [{
            id: 'default',
            name: 'Semua Pertanyaan',
            order: 0,
            questionIds: form.questions.map((q: any) => q.id),
            includeInScoring: true,
          }]
        }

        const questionsWithScoring = form.questions.map((q: any) => {
          const type = q.answerType || q.type || 'short-text'
          let scheme: 'none' | 'binary' | 'likert' | 'rating' | 'indicator' = 'none'
          if (type === 'single-choice' || type === 'dropdown') scheme = 'binary'
          else if (type === 'multiple-choice') scheme = 'binary'
          else if (type === 'indicator-table' || type === 'likert') scheme = 'indicator'
          else if (type === 'rating') scheme = 'rating'
          return { ...q, scoring: q.scoring || { scheme, weight: 1 } }
        })

        const engine = new ScoringEngine(questionsWithScoring, scoring, validation, stages)
        const result = engine.calculateScore(answers)

        resolve({
          score: result.percentage || 0,
          details: result.details || {
            correctCount: 0, wrongCount: 0, skippedCount: 0, totalQuestions: form.questions.length,
          },
          perStage: result.perStage || {},
        })
      } catch (error) {
        console.error('❌ Scoring error:', error)
        resolve({
          score: 0,
          details: { correctCount: 0, wrongCount: 0, skippedCount: 0, totalQuestions: form.questions?.length || 0 },
          perStage: {},
        })
      }
    })
  }

  // ============ HELPER METRIC & STATUS ============
  const getMetricLabel = (score: number): string => {
    if (score >= 80) return 'Sangat Baik'
    if (score >= 60) return 'Baik'
    if (score >= 40) return 'Cukup'
    return 'Perlu Perhatian'
  }

  const getStatusByScore = (score: number): string => {
    if (score >= 70) return 'Terverifikasi'
    if (score >= 50) return 'Perlu Review'
    return 'Perlu Tindak Lanjut'
  }

  // ============ FILTER ============
  const filteredData = useMemo(() => {
    let data = respondents
    if (selectedGroups.length > 0) data = data.filter(r => r.groupName && selectedGroups.includes(r.groupName))
    if (selectedForms.length > 0) data = data.filter(r => selectedForms.includes(r.formTitle))
    return data
  }, [respondents, selectedGroups, selectedForms])

  const groupOptions = useMemo(() => {
    return Array.from(new Set(respondents.map(r => r.groupName).filter(Boolean))) as string[]
  }, [respondents])

  const formOptions = useMemo(() => {
    return Array.from(new Set(respondents.map(r => r.formTitle)))
  }, [respondents])

  // ============ PAGINATION ============
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredData.slice(start, start + itemsPerPage)
  }, [filteredData, currentPage])

  useEffect(() => { setCurrentPage(1) }, [selectedGroups, selectedForms])

  // ============ HANDLERS ============
  const handleGroupToggle = (group: string) => {
    if (group === 'Semua Group') { setSelectedGroups([]); return }
    setSelectedGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group])
  }

  const handleFormToggle = (form: string) => {
    if (form === 'Semua Formulir') { setSelectedForms([]); return }
    setSelectedForms(prev => prev.includes(form) ? prev.filter(f => f !== form) : [...prev, form])
  }

  const handlePreview = (respondent: Respondent) => {
    setSelectedRespondent(respondent)
    setPreviewTab('answers')
    setIsPreviewOpen(true)
  }

  const handleDelete = (id: string) => {
    setRespondentToDelete(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (respondentToDelete) {
      try {
        await deleteResponse(respondentToDelete)
        setRespondents(prev => prev.filter(r => r.id !== respondentToDelete))
        showToast('Data responden berhasil dihapus', 'success')
      } catch (error) {
        console.error('Error deleting response:', error)
        showToast('Gagal menghapus data', 'error')
      }
    }
    setIsDeleteModalOpen(false)
    setRespondentToDelete(null)
  }

  const handlePrint = () => {
    if (filteredData.length === 0) {
      showToast('Tidak ada data untuk dicetak', 'error')
      return
    }
    window.print()
  }

  // ============ EXPORT EXCEL ============
  const exportToExcel = () => {
    const dataToExport = filteredData
    if (dataToExport.length === 0) {
      showToast('Tidak ada data untuk diexport', 'error')
      return
    }

    const wb = XLSX.utils.book_new()
    const formTitle = selectedForms.length === 1 ? selectedForms[0] : 'Semua Formulir'
    const exportDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

    // Sheet 1: Summary
    const total = dataToExport.length
    const avgScore = Math.round(dataToExport.reduce((sum, r) => sum + r.score, 0) / total)
    const summaryData = [
      ['LAPORAN RESPONDEN'],
      [''], [`Formulir: ${formTitle}`], [`Tanggal Export: ${exportDate}`], [''],
      ['STATISTIK'],
      ['Total Responden', total],
      ['Rata-rata Skor', `${avgScore}%`],
      ['Terverifikasi', dataToExport.filter(r => r.status === 'Terverifikasi').length],
      ['Perlu Review', dataToExport.filter(r => r.status === 'Perlu Review').length],
      ['Perlu Tindak Lanjut', dataToExport.filter(r => r.status === 'Perlu Tindak Lanjut').length],
    ]
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
    ws1['!cols'] = [{ wch: 25 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary')

    // Sheet 2: Responden
    const respData = dataToExport.map((r, i) => ({
      'No': i + 1,
      'Nama': r.respondentName || r.name,
      'Email': r.respondentEmail || '-',
      'Formulir': r.formTitle,
      'Group': r.groupName || '-',
      'Tanggal': r.date,
      'Skor (%)': r.score,
      'Metrik': r.metric,
      'Status': r.status,
      'Benar': r.scoringDetails?.correctCount || 0,
      'Salah': r.scoringDetails?.wrongCount || 0,
      'Dilewati': r.scoringDetails?.skippedCount || 0,
      'Total Soal': r.scoringDetails?.totalQuestions || 0,
    }))
    const ws2 = XLSX.utils.json_to_sheet(respData)
    ws2['!cols'] = [
      { wch: 5 }, { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 12 },
      { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }
    ]
    XLSX.utils.book_append_sheet(wb, ws2, 'Responden')

    // Sheet 3: Detail Jawaban
    const labelMap: Record<string, string> = {}
    forms.forEach(form => {
      form.questions?.forEach((q: any) => {
        labelMap[q.id] = q.question || q.label || q.id
      })
    })
    const allKeys = Array.from(new Set(dataToExport.flatMap(r => Object.keys(r.answers))))
      .filter(k => !['respondentName', 'respondentEmail', 'name', 'nama', 'email'].includes(k))
    if (allKeys.length > 0) {
      const detailData = dataToExport.map(r => {
        const row: Record<string, any> = { 'Nama': r.respondentName || r.name }
        allKeys.forEach(key => {
          const label = labelMap[key] || key
          const val = r.answers[key]
          row[label] = val === null || val === undefined ? '-' :
            typeof val === 'object' ? JSON.stringify(val) : String(val)
        })
        return row
      })
      const ws3 = XLSX.utils.json_to_sheet(detailData)
      ws3['!cols'] = Object.keys(detailData[0]).map(k => ({ wch: Math.min(Math.max(k.length + 5, 20), 40) }))
      XLSX.utils.book_append_sheet(wb, ws3, 'Detail Jawaban')
    }

    const fileName = `Data_Responden_${formTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
    showToast(`${dataToExport.length} data berhasil diexport ke Excel`, 'success')
  }

  // ============ COLORS ============
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Terverifikasi': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      'Perlu Review': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      'Perlu Tindak Lanjut': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    }
    return colors[status] || 'text-white/40 bg-white/5 border-white/5'
  }

  const getMetricColor = (metric: string) => {
    const colors: Record<string, string> = {
      'Sangat Baik': 'text-emerald-400', 'Baik': 'text-cyan-400',
      'Cukup': 'text-amber-400', 'Perlu Perhatian': 'text-rose-400',
    }
    return colors[metric] || 'text-white/60'
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-cyan-400'
    if (score >= 40) return 'text-amber-400'
    return 'text-rose-400'
  }

  // ============ FORMAT ANSWER ============
  const formatAnswerValue = (value: any): { type: 'text' | 'signature' | 'table' | 'array'; content: any } => {
    if (value === null || value === undefined) return { type: 'text', content: '-' }
    if (typeof value === 'string' && value.startsWith('data:image/png;base64,'))
      return { type: 'signature', content: value }
    if (Array.isArray(value)) return { type: 'array', content: value }
    if (typeof value === 'object') return { type: 'table', content: value }
    return { type: 'text', content: String(value) }
  }

  // ============ MAPPING ID → LABEL UNTUK TAMPILAN ============
  const questionLabelMap = useMemo(() => {
    const map: Record<string, string> = {}
    forms.forEach(form => {
      form.questions?.forEach((q: any) => {
        map[q.id] = q.question || q.label || q.id
      })
    })
    return map
  }, [forms])

  // ============ PRINT STYLES ============
  const printStyles = `
    @media print {
      body * { visibility: hidden; }
      #print-area, #print-area * { visibility: visible; }
      #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; background: white; color: black; }
      #print-area table { width: 100%; border-collapse: collapse; font-size: 12px; }
      #print-area th, #print-area td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
      #print-area th { background: #f5f5f5; font-weight: 600; }
      .print-header { margin-bottom: 20px; }
      .print-header h1 { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
      .print-header p { font-size: 14px; color: #666; margin: 2px 0; }
    }
  `

  // ============ RENDER ============
  return (
    <div className="flex flex-col min-h-screen bg-[#06060E]">
      <style>{printStyles}</style>

      <Topbar title="Data Responden" subtitle="Kelola data individu yang telah mengisi formulir" />

      <div className="flex-1 p-6 space-y-6">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-start gap-4">
            <div>
              <span className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Filter Group:</span>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => handleGroupToggle('Semua Group')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    selectedGroups.length === 0
                      ? 'bg-violet-500/20 text-violet-400 border border-violet-500/20'
                      : 'bg-white/3 text-white/50 hover:text-white/80 border border-white/5'
                  }`}
                >
                  Semua
                </button>
                {groupOptions.map(g => (
                  <button key={g} onClick={() => handleGroupToggle(g)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      selectedGroups.includes(g)
                        ? 'bg-violet-500/20 text-violet-400 border border-violet-500/20'
                        : 'bg-white/3 text-white/50 hover:text-white/80 border border-white/5'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Filter Formulir:</span>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => handleFormToggle('Semua Formulir')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    selectedForms.length === 0
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                      : 'bg-white/3 text-white/50 hover:text-white/80 border border-white/5'
                  }`}
                >
                  Semua
                </button>
                {formOptions.map(f => (
                  <button key={f} onClick={() => handleFormToggle(f)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      selectedForms.includes(f)
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                        : 'bg-white/3 text-white/50 hover:text-white/80 border border-white/5'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {(selectedGroups.length > 0 || selectedForms.length > 0) && (
              <button onClick={() => { setSelectedGroups([]); setSelectedForms([]) }}
                className="self-end px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-all flex items-center gap-1"
              >
                <Icon name="x" className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={exportToExcel} disabled={filteredData.length === 0}
              className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Icon name="fileSpreadsheet" className="w-4 h-4" /> Export Excel
            </button>
            <button onClick={handlePrint} disabled={filteredData.length === 0}
              className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 bg-white/3 text-white/70 hover:text-white border border-white/6 hover:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Icon name="printer" className="w-4 h-4" /> Cetak
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: filteredData.length, icon: 'users', color: 'text-cyan-400' },
            { label: 'Terverifikasi', value: filteredData.filter(r => r.status === 'Terverifikasi').length, icon: 'checkCircle', color: 'text-emerald-400' },
            { label: 'Perlu Review', value: filteredData.filter(r => r.status === 'Perlu Review').length, icon: 'alertCircle', color: 'text-amber-400' },
            { label: 'Tindak Lanjut', value: filteredData.filter(r => r.status === 'Perlu Tindak Lanjut').length, icon: 'info', color: 'text-rose-400' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl bg-[#080812] border border-white/5 p-3">
              <div className="flex items-center gap-2">
                <Icon name={stat.icon as any} className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-white/40">{stat.label}</span>
              </div>
              <p className={`text-xl font-bold font-display mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-[#080812] border border-white/5 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="loader" className="w-8 h-8 text-cyan-400 animate-spin" />
              <span className="ml-3 text-white/40">Memuat data...</span>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/1">
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase">No</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase">Nama</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase">Formulir</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase">Group</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase">Tanggal</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase">Skor</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase">Metrik</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-white/30">
                        <Icon name="users" className="w-12 h-12 mx-auto mb-3 text-white/10" />
                        <p className="text-base font-medium text-white/40">Tidak ada data responden</p>
                        <p className="text-sm text-white/20 mt-1">Belum ada yang mengisi formulir</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((r, i) => {
                      const idx = (currentPage - 1) * itemsPerPage + i + 1
                      return (
                        <tr key={r.id} className="border-b border-white/3 hover:bg-white/2 transition-colors group">
                          <td className="px-4 py-3 text-white/40 text-xs">{idx}</td>
                          <td className="px-4 py-3 font-medium text-white">
                            {r.respondentName || 'Responden'}
                          </td>
                          <td className="px-4 py-3 text-white/60 text-sm">{r.formTitle}</td>
                          <td className="px-4 py-3">
                            {r.groupName ? (
                              <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] text-violet-400 flex items-center gap-1 w-fit">
                                <Icon name="users" className="w-3 h-3" />{r.groupName}
                              </span>
                            ) : (
                              <span className="text-xs text-white/30">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-white/40 text-xs">{r.date}</td>
                          <td className={`px-4 py-3 font-semibold ${getScoreColor(r.score)}`}>
                            {r.score}%
                          </td>
                          <td className={`px-4 py-3 font-medium text-sm ${getMetricColor(r.metric)}`}>
                            {r.metric}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full border text-xs ${getStatusColor(r.status)}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => handlePreview(r)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" title="Preview">
                                <Icon name="eye" className="w-4 h-4 text-white/50 hover:text-cyan-400" />
                              </button>
                              <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" title="Hapus">
                                <Icon name="trash" className="w-4 h-4 text-white/50 hover:text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredData.length > itemsPerPage && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
              <p className="text-xs text-white/35">
                Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg bg-white/2 border border-white/5 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-30"
                >
                  <Icon name="chevronLeft" className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let p
                  if (totalPages <= 5) p = i + 1
                  else if (currentPage <= 3) p = i + 1
                  else if (currentPage >= totalPages - 2) p = totalPages - 4 + i
                  else p = currentPage - 2 + i
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium ${
                        currentPage === p
                          ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                          : 'bg-white/2 border border-white/5 text-white/40 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-white/20">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8 h-8 rounded-lg bg-white/2 border border-white/5 text-xs text-white/40 hover:text-white"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg bg-white/2 border border-white/5 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-30"
                >
                  <Icon name="chevronRight" className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========== PREVIEW MODAL ========== */}
      {isPreviewOpen && selectedRespondent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] bg-[#0e0e1a] border border-white/8 rounded-2xl shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/6 shrink-0">
              <div>
                <h3 className="font-display text-lg font-semibold text-white">Preview Jawaban</h3>
                <p className="text-xs text-white/30">
                  {selectedRespondent.respondentName} • {selectedRespondent.formTitle} • {selectedRespondent.date}
                </p>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center"
              >
                <Icon name="x" className="w-5 h-5 text-white/50" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-2 border-b border-white/6 shrink-0">
              {[
                { id: 'answers', label: 'Jawaban', icon: 'list' },
                { id: 'details', label: 'Detail', icon: 'info' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setPreviewTab(tab.id as any)}
                  className={`px-4 py-2 text-xs font-medium transition-all border-b-2 ${
                    previewTab === tab.id
                      ? 'text-cyan-400 border-cyan-400'
                      : 'text-white/40 border-transparent hover:text-white/70'
                  }`}
                >
                  <Icon name={tab.icon as any} className="w-3.5 h-3.5 inline mr-1.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {previewTab === 'details' ? (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Skor', value: `${selectedRespondent.score}%`, color: getScoreColor(selectedRespondent.score) },
                    { label: 'Metrik', value: selectedRespondent.metric, color: getMetricColor(selectedRespondent.metric) },
                    { label: 'Status', value: selectedRespondent.status, color: 'text-white' },
                    { label: 'Tanggal', value: selectedRespondent.date, color: 'text-white/60' },
                    { label: 'Formulir', value: selectedRespondent.formTitle, color: 'text-white/60' },
                    { label: 'Kode', value: selectedRespondent.formCode, color: 'text-cyan-400 font-mono' },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-xl bg-white/2 border border-white/5">
                      <p className="text-[10px] text-white/30 uppercase">{item.label}</p>
                      <p className={`text-sm font-medium mt-0.5 ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                  {selectedRespondent.groupName && (
                    <div className="p-3 rounded-xl bg-white/2 border border-white/5 col-span-2">
                      <p className="text-[10px] text-white/30 uppercase">Group</p>
                      <p className="text-sm font-medium text-violet-400 mt-0.5">
                        {selectedRespondent.groupName}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(selectedRespondent.answers).map(([key, value]) => {
                    // Skip metadata
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
                    const label = questionLabelMap[key] || key
                    const { type, content } = formatAnswerValue(value)

                    return (
                      <div key={key} className="p-4 rounded-xl bg-white/2 border border-white/5">
                        <p className="text-xs text-white/40 mb-2 font-medium break-words">{label}</p>

                        {type === 'signature' && (
                          <div className="rounded-lg overflow-hidden border border-white/5 bg-white p-2">
                            <img src={content} alt="Tanda Tangan" className="max-h-32 mx-auto" />
                            <p className="text-[10px] text-cyan-400 text-center mt-1">📝 Tanda tangan digital</p>
                          </div>
                        )}

                        {type === 'table' && (
                          <div className="overflow-x-auto rounded-lg border border-white/5">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-white/[0.03]">
                                  <th className="text-left py-2 px-3 text-white/40 border-r border-white/5">
                                    Sub Pertanyaan
                                  </th>
                                  <th className="text-left py-2 px-3 text-white/40">Jawaban</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(content).map(
                                  ([subKey, subVal]: [string, any], i: number) => (
                                    <tr key={i} className="border-t border-white/[0.03]">
                                      <td className="py-2 px-3 text-white/60 border-r border-white/5 break-words">
                                        {questionLabelMap[subKey] || subKey}
                                      </td>
                                      <td className="py-2 px-3 text-cyan-400 font-medium">
                                        {typeof subVal === 'object' ? JSON.stringify(subVal) : String(subVal)}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {type === 'array' && (
                          <div className="flex flex-wrap gap-1.5">
                            {content.map((item: any, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400"
                              >
                                {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                              </span>
                            ))}
                          </div>
                        )}

                        {type === 'text' && (
                          <p className="text-sm text-white font-medium whitespace-pre-wrap break-words">
                            {content}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-white/6 shrink-0">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== DELETE MODAL ========== */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#0e0e1a] border border-white/8 rounded-2xl shadow-2xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Icon name="alertCircle" className="w-8 h-8 text-rose-400" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">Hapus Data Responden</h3>
              <p className="text-sm text-white/50 mb-6">
                Data responden dan semua jawabannya akan dihapus permanen.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/3 border border-white/6 text-sm text-white/70 hover:text-white"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-medium text-white"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== TOAST ========== */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div
            className={`px-4 py-2.5 rounded-xl text-sm font-medium shadow-2xl ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {/* ========== PRINT AREA ========== */}
      <div id="print-area" className="hidden">
        <div className="print-header">
          <h1>Ringkasan Data Responden</h1>
          <p>Filter Group: {selectedGroups.length > 0 ? selectedGroups.join(', ') : 'Semua'}</p>
          <p>Filter Formulir: {selectedForms.length > 0 ? selectedForms.join(', ') : 'Semua'}</p>
          <p>
            Tanggal Cetak:{' '}
            {new Date().toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <p>Total Responden: {filteredData.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama</th>
              <th>Formulir</th>
              <th>Group</th>
              <th>Tanggal</th>
              <th>Skor</th>
              <th>Metrik</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((r, i) => (
              <tr key={r.id}>
                <td>{i + 1}</td>
                <td>{r.respondentName || 'Responden'}</td>
                <td>{r.formTitle}</td>
                <td>{r.groupName || '-'}</td>
                <td>{r.date}</td>
                <td>{r.score}%</td>
                <td>{r.metric}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 20, fontSize: 12, color: '#999' }}>Dicetak dari Sistem KKNT-KP UH</p>
      </div>
    </div>
  )
}