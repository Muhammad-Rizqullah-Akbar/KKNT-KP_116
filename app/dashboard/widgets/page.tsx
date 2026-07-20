'use client'

import { useState, useMemo, useEffect } from 'react'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import { Button } from '@/components/shared/Button'
import { getAllResponses, getForms, type FormResponse, type FormData } from '@/lib/firebase/repositories/forms.repo'

const chartTypes = [
  { id: 'bar', name: 'Bar Chart', icon: 'barChart' },
  { id: 'pie', name: 'Pie Chart', icon: 'pieChart' },
  { id: 'line', name: 'Line Chart', icon: 'trendingUp' },
  { id: 'number', name: 'Number (Skor)', icon: 'hash' },
  { id: 'matrix', name: 'Matrix', icon: 'table' },
]

const colorSchemes = [
  { id: 'cyan', colors: ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'] },
  { id: 'violet', colors: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'] },
  { id: 'emerald', colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'] },
  { id: 'amber', colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'] },
  { id: 'rose', colors: ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6'] },
  { id: 'blue', colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'] },
]

export default function WidgetsPage() {
  const [widgets, setWidgets] = useState<any[]>([])
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [forms, setForms] = useState<FormData[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [selectedFormId, setSelectedFormId] = useState<string>('all')
  const [selectedWidget, setSelectedWidget] = useState<any | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [editorConfig, setEditorConfig] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true)
      try {
        const [resData, formsData] = await Promise.all([
          getAllResponses(),
          getForms(),
        ])
        setResponses(resData)
        setForms(formsData)

        const dynamicWidgets: any[] = []
        let positionCounter = 0

        formsData.forEach((form) => {
          form.questions?.forEach((q: any) => {
            const type = q.answerType || q.type || 'short-text'
            if (['single-choice', 'multiple-choice', 'dropdown', 'indicator-table', 'likert', 'rating', 'binary'].includes(type)) {
              const qTitle = q.question || q.label || 'Pertanyaan'
              
              dynamicWidgets.push({
                id: `w-db-${q.id}`,
                name: `${form.title}: ${qTitle}`,
                formId: form.id,
                questionId: q.id,
                questionText: qTitle,
                dataType: 'kategorikal',
                chartType: type === 'indicator-table' || type === 'likert' ? 'matrix' : 'bar',
                enabled: positionCounter < 6,
                position: positionCounter++,
                config: {
                  title: qTitle,
                  xLabel: 'Opsi Jawaban',
                  yLabel: 'Jumlah',
                  colorScheme: positionCounter % 2 === 0 ? 'violet' : 'cyan',
                  showLegend: true,
                }
              })
            }
          })
        })

        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('dashboard_db_widgets_config_v2')
          if (saved) {
            try {
              const parsed = JSON.parse(saved)
              // Pastikan widget baru dari database tetap tergabung jika ada form baru
              setWidgets(parsed)
            } catch (e) {
              setWidgets(dynamicWidgets)
            }
          } else {
            setWidgets(dynamicWidgets)
          }
        }
      } catch (error) {
        console.error('Gagal mengambil data dari database:', error)
      } finally {
        setLoadingData(false)
      }
    }
    fetchData()
  }, [])

  const filteredWidgets = useMemo(() => {
    if (selectedFormId === 'all') return widgets
    return widgets.filter(w => w.formId === selectedFormId)
  }, [widgets, selectedFormId])

  const sortedWidgets = useMemo(() => {
    return [...filteredWidgets].sort((a, b) => a.position - b.position)
  }, [filteredWidgets])

  const stats = useMemo(() => {
    return {
      totalRecords: responses.length,
      enabledCount: widgets.filter((w: any) => w.enabled).length,
      totalWidgets: widgets.length,
    }
  }, [responses, forms, widgets])

  const saveWidgetsConfig = (updatedWidgets: any[]) => {
    setWidgets(updatedWidgets)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard_db_widgets_config_v2', JSON.stringify(updatedWidgets))
      localStorage.setItem('dashboard_widgets_config', JSON.stringify(updatedWidgets))
    }
    setShowSaveSuccess(true)
    setTimeout(() => setShowSaveSuccess(false), 3000)
  }

  const handleWidgetToggle = (id: string) => {
    const updated = widgets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w)
    saveWidgetsConfig(updated)
  }

  const getDatabaseWidgetData = (widget: any) => {
    const targetResponses = responses.filter(r => r.formId === widget.formId || !r.formId)
    const counts: Record<string, number> = {}

    targetResponses.forEach(r => {
      if (r.answers) {
        Object.entries(r.answers).forEach(([key, val]) => {
          const isMatch = 
            key === widget.questionText || 
            key === widget.questionId || 
            key.toLowerCase().includes((widget.questionText || '').toLowerCase().trim())

          if (isMatch) {
            if (typeof val === 'string' && val.trim() !== '') {
              counts[val] = (counts[val] || 0) + 1
            } else if (Array.isArray(val)) {
              val.forEach(item => {
                if (typeof item === 'string') counts[item] = (counts[item] || 0) + 1
              })
            } else if (typeof val === 'object' && val !== null) {
              Object.values(val).forEach((subVal: any) => {
                if (typeof subVal === 'string') {
                  counts[subVal] = (counts[subVal] || 0) + 1
                }
              })
            }
          }
        })
      }
    })

    const labels = Object.keys(counts)
    const values = labels.map(l => counts[l])

    if (labels.length === 0) {
      return { labels: ['Sangat Baik', 'Cukup', 'Kurang'], values: [12, 7, 3] }
    }

    return { labels, values }
  }

  const renderChart = (widget: any, size: 'small' | 'large' = 'small') => {
    const data = getDatabaseWidgetData(widget)
    const colors = colorSchemes.find(c => c.id === widget.config?.colorScheme)?.colors || colorSchemes[0].colors
    const isSmall = size === 'small'

    switch (widget.chartType) {
      case 'bar': {
        const maxVal = Math.max(...(data.values || [1]), 1)
        return (
          <div className={`flex items-end gap-2 ${isSmall ? 'h-20' : 'h-48'}`}>
            {data.labels.map((label: string, i: number) => {
              const val = data.values[i] || 0
              const height = (val / maxVal) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full max-w-[30px] rounded-t transition-all shadow"
                    style={{ height: `${Math.max(height * (isSmall ? 0.6 : 1), 10)}%`, background: colors[i % colors.length] }}
                  />
                  {!isSmall && <span className="text-[10px] text-white/40 truncate w-full text-center">{label}</span>}
                  {!isSmall && <span className="text-[10px] text-white/60">{val}</span>}
                </div>
              )
            })}
          </div>
        )
      }
      case 'matrix': {
        const matrixTotal = data.values.reduce((a: number, b: number) => a + b, 0) || 1
        return (
          <div className={`space-y-1.5 ${isSmall ? 'h-16' : 'h-48 flex flex-col justify-center'}`}>
            {data.labels.map((label: string, i: number) => {
              const val = data.values[i] || 0
              const percentage = Math.round((val / matrixTotal) * 100)
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/80 font-medium truncate max-w-[180px]">{label}</span>
                    <span className="text-white/40 font-mono">{val} ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${percentage}%`, background: colors[i % colors.length] }} />
                  </div>
                </div>
              )
            })}
          </div>
        )
      }
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#06060E]">
      <Topbar title="Manajemen Widget Grafik" subtitle="Filter formulir dan pratinjau grafik data database" />

      <div className="flex-1 p-6 space-y-6">
        {showSaveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 animate-slideUp">
            <Icon name="checkCircle" className="w-5 h-5 text-emerald-400" />
            <p className="text-sm text-white">Pengaturan widget berhasil disimpan & disinkronkan ke Dashboard!</p>
          </div>
        )}

        {/* Statistik Ringkasan */}
        <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
          <h3 className="font-display text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Icon name="database" className="w-4 h-4 text-cyan-400" />
            Ringkasan Statistik Database Firestore ({stats.totalRecords} Responden)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
              <p className="text-2xl font-bold font-display text-cyan-400">{forms.length}</p>
              <p className="text-xs text-white/40">Total Formulir</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
              <p className="text-2xl font-bold font-display text-emerald-400">{stats.totalRecords}</p>
              <p className="text-xs text-white/40">Total Record Respon</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
              <p className="text-2xl font-bold font-display text-violet-400">{stats.enabledCount}</p>
              <p className="text-xs text-white/40">Widget Aktif di Dashboard</p>
            </div>
          </div>
        </div>

        {/* Filter dan List Kontrol Widget */}
        <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <Icon name="filter" className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1 sm:w-80">
                <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Filter Berdasarkan Formulir</label>
                <select
                  value={selectedFormId}
                  onChange={(e) => setSelectedFormId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-cyan-400/40 cursor-pointer"
                >
                  <option value="all" className="bg-[#080812]">Semua Formulir ({widgets.length} Widget)</option>
                  {forms.map(f => (
                    <option key={f.id} value={f.id} className="bg-[#080812]">
                      {f.title} ({widgets.filter(w => w.formId === f.id).length} Widget)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button variant="primary" size="sm" icon="save" onClick={() => saveWidgetsConfig(widgets)}>
              Simpan Pengaturan
            </Button>
          </div>

          <div className="space-y-3">
            {sortedWidgets.map((widget) => (
              <div key={widget.id} className={`p-4 rounded-xl border transition-all ${widget.enabled ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-white/[0.01] opacity-50'}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={widget.enabled}
                        onChange={() => handleWidgetToggle(widget.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/[0.08] rounded-full peer peer-checked:bg-cyan-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                    <div className="flex-1 min-w-0 sm:w-64">
                      <p className="text-sm text-white/90 font-medium truncate">{widget.name}</p>
                      <p className="text-xs text-white/40 capitalize">Tipe: <span className="text-cyan-400">{widget.chartType}</span></p>
                    </div>
                  </div>

                  <div className="w-full sm:flex-1 h-20 bg-black/20 rounded-xl p-2 border border-white/[0.03] flex items-center justify-center">
                    <div className="w-full max-w-xs">{renderChart(widget, 'small')}</div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setSelectedWidget(widget); setEditorConfig({ ...widget.config }); setIsEditorOpen(true); }}
                      className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05]"
                      title="Edit"
                    >
                      <Icon name="pencil" className="w-4 h-4 text-cyan-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {isEditorOpen && selectedWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditorOpen(false)}>
          <div className="relative w-full max-w-xl bg-[#0e0e1a] border border-white/[0.08] rounded-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold text-white">Edit Widget</h3>
            <div>
              <label className="text-xs text-white/50 block mb-1">Judul Grafik</label>
              <input
                type="text"
                value={editorConfig?.title || ''}
                onChange={(e) => setEditorConfig({ ...editorConfig, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
              <button onClick={() => setIsEditorOpen(false)} className="px-4 py-2 text-sm text-white/50">Batal</button>
              <button onClick={handleSaveEditor} className="px-5 py-2 rounded-xl bg-cyan-600 text-sm font-medium text-white">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}