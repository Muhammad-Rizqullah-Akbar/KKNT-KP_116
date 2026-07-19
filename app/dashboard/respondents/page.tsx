'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
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
}

export default function RespondentsPage() {
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
  const itemsPerPage = 10

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

      const transformedRespondents: Respondent[] = responsesData.map((response: FormResponse) => {
        const form = formsData.find(f => f.id === response.formId)
        const group = form?.groupId ? groupsData.find(g => g.id === form.groupId) : null
        
        const score = calculateScore(response.answers, form?.questions || [])
        const metric = getMetricLabel(score)
        const status = getStatusByScore(score)

        const submittedDate = response.submittedAt 
          ? new Date(response.submittedAt) 
          : response.createdAt?.toDate?.() || new Date()

        return {
          id: response.id || Math.random().toString(36).substring(2, 9),
          name: response.respondentName || 'Responden',
          formId: response.formId,
          formCode: response.formCode,
          formTitle: response.formTitle,
          groupId: form?.groupId || null,
          groupName: group?.title || null,
          submittedAt: submittedDate.toISOString(),
          date: submittedDate.toLocaleDateString('id-ID', { 
            day: '2-digit', month: 'short', year: 'numeric' 
          }),
          answers: response.answers || {},
          respondentName: response.respondentName,
          respondentEmail: response.respondentEmail,
          score: score,
          metric: metric,
          status: status,
        }
      })

      setRespondents(transformedRespondents)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ============ CALCULATE SCORE (KOMPATIBEL DENGAN SEMUA TIPE) ============
  const calculateScore = (answers: Record<string, any>, questions: any[]): number => {
    let total = 0
    let count = 0
    
    Object.entries(answers).forEach(([key, value]) => {
      // Skip signature (base64)
      if (typeof value === 'string' && value.startsWith('data:image/png;base64,')) {
        total += 70; count++ // Signature selalu dianggap valid
        return
      }
      
      // Indicator table / likert object
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.values(value).forEach((v: any) => {
          if (typeof v === 'string') {
            const likertMap: Record<string, number> = {
              'STS': 20, 'TS': 40, 'CS': 60, 'N': 60, 'S': 80, 'SS': 100,
              'Kurang': 20, 'Cukup': 50, 'Baik': 75, 'Sangat Baik': 100,
              'Tidak': 30, 'Ya': 80,
              '1': 25, '2': 50, '3': 75, '4': 100,
            }
            total += likertMap[v] || 60; count++
          } else if (typeof v === 'number') {
            total += v * 20; count++
          }
        })
        return
      }
      
      // String values
      if (typeof value === 'string') {
        const posValues = ['Ya', 'Benar', 'Sangat Baik', 'Baik', 'Setuju', 'Sangat Setuju', 'SS', 'S']
        const negValues = ['Tidak', 'Salah', 'Kurang', 'Tidak Baik', 'Tidak Setuju', 'Sangat Tidak Setuju', 'STS', 'TS']
        const ratingMatch = value.match(/^(\d+)\/(\d+)$/)
        
        if (ratingMatch) {
          const [_, val, max] = ratingMatch
          total += (Number(val) / Number(max)) * 100; count++
        } else if (posValues.includes(value)) {
          total += 80; count++
        } else if (negValues.includes(value)) {
          total += 40; count++
        } else if (!isNaN(Number(value))) {
          total += Number(value); count++
        } else {
          total += 60; count++
        }
      } else if (typeof value === 'number') {
        total += value; count++
      } else if (typeof value === 'boolean') {
        total += value ? 80 : 40; count++
      } else if (Array.isArray(value)) {
        total += value.length * 25; count += value.length
      }
    })
    
    return count > 0 ? Math.round(total / count) : 0
  }

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
      } catch (error) {
        console.error('Error deleting response:', error)
      }
    }
    setIsDeleteModalOpen(false)
    setRespondentToDelete(null)
  }

  const handlePrint = () => { if (filteredData.length > 0) window.print() }

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
  const formatAnswerValue = (value: any): { type: 'text' | 'signature' | 'table' | 'object' | 'array'; content: any } => {
    if (value === null || value === undefined) return { type: 'text', content: '-' }
    
    // Signature
    if (typeof value === 'string' && value.startsWith('data:image/png;base64,')) {
      return { type: 'signature', content: value }
    }
    
    // Indicator table / likert object
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return { type: 'table', content: value }
    }
    
    // Array
    if (Array.isArray(value)) {
      return { type: 'array', content: value }
    }
    
    return { type: 'text', content: String(value) }
  }

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
    <div className="flex flex-col min-h-screen">
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
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${selectedGroups.length === 0 ? 'bg-violet-500/20 text-violet-400 border border-violet-500/20' : 'bg-white/3 text-white/50 hover:text-white/80 border border-white/5'}`}>Semua</button>
                {groupOptions.map(g => (
                  <button key={g} onClick={() => handleGroupToggle(g)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${selectedGroups.includes(g) ? 'bg-violet-500/20 text-violet-400 border border-violet-500/20' : 'bg-white/3 text-white/50 hover:text-white/80 border border-white/5'}`}>{g}</button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Filter Formulir:</span>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => handleFormToggle('Semua Formulir')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${selectedForms.length === 0 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20' : 'bg-white/3 text-white/50 hover:text-white/80 border border-white/5'}`}>Semua</button>
                {formOptions.map(f => (
                  <button key={f} onClick={() => handleFormToggle(f)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${selectedForms.includes(f) ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20' : 'bg-white/3 text-white/50 hover:text-white/80 border border-white/5'}`}>{f}</button>
                ))}
              </div>
            </div>

            {(selectedGroups.length > 0 || selectedForms.length > 0) && (
              <button onClick={() => { setSelectedGroups([]); setSelectedForms([]) }}
                className="self-end px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-all flex items-center gap-1">
                <Icon name="x" className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          <button onClick={handlePrint} disabled={filteredData.length === 0}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${filteredData.length === 0 ? 'bg-white/3 text-white/30 cursor-not-allowed border border-white/5' : 'bg-white/3 text-white/70 hover:text-white border border-white/6 hover:border-white/10'}`}>
            <Icon name="printer" className="w-4 h-4" />
            {filteredData.length === 0 ? 'Tidak ada data' : 'Cetak'}
          </button>
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
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">No</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Nama</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Formulir</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Group</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Tanggal</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Skor</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Metrik</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-12 text-white/30">
                      <Icon name="users" className="w-12 h-12 mx-auto mb-3 text-white/10" />
                      <p className="text-base font-medium text-white/40">Tidak ada data responden</p>
                      <p className="text-sm text-white/20 mt-1">Belum ada yang mengisi formulir</p>
                    </td></tr>
                  ) : (
                    paginatedData.map((r, i) => {
                      const idx = (currentPage - 1) * itemsPerPage + i + 1
                      return (
                        <tr key={r.id} className="border-b border-white/3 hover:bg-white/2 transition-colors group">
                          <td className="px-4 py-3 text-white/40 text-xs">{idx}</td>
                          <td className="px-4 py-3 font-medium text-white">{r.respondentName || 'Responden'}</td>
                          <td className="px-4 py-3 text-white/60 text-sm">{r.formTitle}</td>
                          <td className="px-4 py-3">
                            {r.groupName ? (
                              <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] text-violet-400 flex items-center gap-1 w-fit">
                                <Icon name="users" className="w-3 h-3" />{r.groupName}
                              </span>
                            ) : <span className="text-xs text-white/30">-</span>}
                          </td>
                          <td className="px-4 py-3 text-white/40 text-xs">{r.date}</td>
                          <td className={`px-4 py-3 font-semibold ${getScoreColor(r.score)}`}>{r.score}%</td>
                          <td className={`px-4 py-3 font-medium text-sm ${getMetricColor(r.metric)}`}>{r.metric}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full border text-xs ${getStatusColor(r.status)}`}>{r.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => handlePreview(r)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" title="Preview">
                                <Icon name="eye" className="w-4 h-4 text-white/50 hover:text-cyan-400 transition-colors" />
                              </button>
                              <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" title="Hapus">
                                <Icon name="trash" className="w-4 h-4 text-white/50 hover:text-red-400 transition-colors" />
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
              <p className="text-xs text-white/35">Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} responden</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg bg-white/2 border border-white/5 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"><Icon name="chevronLeft" className="w-4 h-4" /></button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let p; if (totalPages <= 5) p = i + 1; else if (currentPage <= 3) p = i + 1; else if (currentPage >= totalPages - 2) p = totalPages - 4 + i; else p = currentPage - 2 + i
                  return <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium ${currentPage === p ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' : 'bg-white/2 border border-white/5 text-white/40 hover:text-white'}`}>{p}</button>
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && <><span className="text-white/20">...</span><button onClick={() => setCurrentPage(totalPages)} className="w-8 h-8 rounded-lg bg-white/2 border border-white/5 text-xs text-white/40 hover:text-white">{totalPages}</button></>}
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg bg-white/2 border border-white/5 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"><Icon name="chevronRight" className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========== PREVIEW MODAL ========== */}
      {isPreviewOpen && selectedRespondent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }} onClick={() => setIsPreviewOpen(false)}>
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0e0e1a] border border-white/8 rounded-2xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/6 shrink-0">
              <div>
                <h3 className="font-display text-lg font-semibold text-white">Preview Jawaban</h3>
                <p className="text-xs text-white/30">{selectedRespondent.respondentName || 'Responden'} • {selectedRespondent.formTitle} • {selectedRespondent.date}</p>
              </div>
              <button onClick={() => setIsPreviewOpen(false)} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center"><Icon name="x" className="w-5 h-5 text-white/50" /></button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-2 border-b border-white/6 shrink-0">
              {[{ id: 'answers', label: 'Jawaban', icon: 'list' }, { id: 'details', label: 'Detail', icon: 'info' }].map(tab => (
                <button key={tab.id} onClick={() => setPreviewTab(tab.id as any)}
                  className={`px-4 py-2 text-xs font-medium transition-all border-b-2 whitespace-nowrap ${previewTab === tab.id ? 'text-cyan-400 border-cyan-400' : 'text-white/40 border-transparent hover:text-white/70'}`}>
                  <Icon name={tab.icon as any} className="w-3.5 h-3.5 inline mr-1.5" />{tab.label}
                </button>
              ))}
            </div>

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
                      <p className="text-sm font-medium text-violet-400 mt-0.5">{selectedRespondent.groupName}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(selectedRespondent.answers).map(([key, value]) => {
                    if (key === 'respondentName' || key === 'respondentEmail' || key.startsWith('_')) return null
                    const { type, content } = formatAnswerValue(value)
                    
                    return (
                      <div key={key} className="p-4 rounded-xl bg-white/2 border border-white/5">
                        <p className="text-xs text-white/40 mb-2 font-medium">{key}</p>
                        
                        {/* Signature */}
                        {type === 'signature' && (
                          <div className="rounded-lg overflow-hidden border border-white/5 bg-white p-2">
                            <img src={content} alt="Tanda Tangan" className="max-h-32 mx-auto" />
                            <p className="text-[10px] text-cyan-400 text-center mt-1">📝 Tanda tangan digital</p>
                          </div>
                        )}
                        
                        {/* Indicator Table */}
                        {type === 'table' && (
                          <div className="overflow-x-auto rounded-lg border border-white/5">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-white/[0.03]">
                                  <th className="text-left py-2 px-3 text-white/40 border-r border-white/5">Pernyataan</th>
                                  <th className="text-left py-2 px-3 text-white/40">Jawaban</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(content).map(([row, val]: [string, any], i: number) => (
                                  <tr key={i} className="border-t border-white/[0.03]">
                                    <td className="py-2 px-3 text-white/60 border-r border-white/5">{row}</td>
                                    <td className="py-2 px-3 text-cyan-400 font-medium">{String(val)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        
                        {/* Array */}
                        {type === 'array' && (
                          <div className="flex flex-wrap gap-1.5">
                            {content.map((item: string, i: number) => (
                              <span key={i} className="px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400">{item}</span>
                            ))}
                          </div>
                        )}
                        
                        {/* Text */}
                        {type === 'text' && (
                          <p className="text-sm text-white font-medium whitespace-pre-wrap break-words">{content}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-white/6 shrink-0">
              <button onClick={() => setIsPreviewOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== DELETE MODAL ========== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }} onClick={() => setIsDeleteModalOpen(false)}>
          <div className="relative w-full max-w-md bg-[#0e0e1a] border border-white/8 rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center"><Icon name="alertCircle" className="w-8 h-8 text-rose-400" /></div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">Hapus Data Responden</h3>
              <p className="text-sm text-white/50 mb-6">Data responden dan semua jawabannya akan dihapus permanen.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-white/3 border border-white/6 text-sm text-white/70 hover:text-white">Batal</button>
                <button onClick={confirmDelete} className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-medium text-white">Ya, Hapus</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== PRINT AREA ========== */}
      <div id="print-area" className="hidden">
        <div className="print-header">
          <h1>Ringkasan Data Responden</h1>
          <p>Filter Group: {selectedGroups.length > 0 ? selectedGroups.join(', ') : 'Semua'}</p>
          <p>Filter Formulir: {selectedForms.length > 0 ? selectedForms.join(', ') : 'Semua'}</p>
          <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          <p>Total Responden: {filteredData.length}</p>
        </div>
        <table>
          <thead><tr><th>No</th><th>Nama</th><th>Formulir</th><th>Group</th><th>Tanggal</th><th>Skor</th><th>Metrik</th><th>Status</th></tr></thead>
          <tbody>
            {filteredData.map((r, i) => (
              <tr key={r.id}><td>{i + 1}</td><td>{r.respondentName || 'Responden'}</td><td>{r.formTitle}</td><td>{r.groupName || '-'}</td><td>{r.date}</td><td>{r.score}%</td><td>{r.metric}</td><td>{r.status}</td></tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 20, fontSize: 12, color: '#999' }}>Dicetak dari Sistem KKNT-KP UH</p>
      </div>
    </div>
  )
}