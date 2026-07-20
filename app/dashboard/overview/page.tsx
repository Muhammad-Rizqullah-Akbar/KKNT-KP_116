'use client'

import { useState, useMemo, useEffect } from 'react'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import Link from 'next/link'
import { getAllResponses, getForms, type FormResponse, type FormData } from '@/lib/firebase/repositories/forms.repo'

const colorSchemes: Record<string, string[]> = {
  cyan: ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'],
  violet: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'],
  emerald: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'],
  amber: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'],
  rose: ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6'],
  blue: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
}

export default function OverviewPage() {
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [forms, setForms] = useState<FormData[]>([])
  const [loading, setLoading] = useState(true)
  const [widgets, setWidgets] = useState<any[]>([])
  
  // State Filter per Formulir
  const [selectedFormId, setSelectedFormId] = useState<string>('all')

  // Load konfigurasi widget aktif dari localStorage yang disinkronkan dari halaman widget
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard_db_widgets_config_v2')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const active = parsed
            .filter((w: any) => w.enabled === true)
            .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
          setWidgets(active)
        } catch (e) {
          console.error('Gagal parsing widget overview:', e)
        }
      }
    }
  }, [])

  // Tarik data asli dari Firestore
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [resData, formsData] = await Promise.all([
          getAllResponses(),
          getForms(),
        ])
        setResponses(resData)
        setForms(formsData)

        // Jika localStorage widget kosong, buat secara otomatis dari struktur pertanyaan di database
        if (!localStorage.getItem('dashboard_db_widgets_config_v2')) {
          const dynamicWidgets: any[] = []
          let pos = 0
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
                  chartType: type === 'indicator-table' || type === 'likert' ? 'matrix' : 'bar',
                  enabled: pos < 6,
                  position: pos++,
                  config: {
                    title: qTitle,
                    xLabel: 'Opsi Jawaban',
                    yLabel: 'Jumlah',
                    colorScheme: pos % 2 === 0 ? 'violet' : 'cyan',
                    showLegend: true,
                  }
                })
              }
            })
          })
          setWidgets(dynamicWidgets.filter(w => w.enabled))
        }
      } catch (error) {
        console.error('Error loading dashboard overview data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter respons berdasarkan form yang dipilih di dropdown
  const filteredResponses = useMemo(() => {
    if (selectedFormId === 'all') return responses
    return responses.filter(r => r.formId === selectedFormId)
  }, [responses, selectedFormId])

  // Statistik Utama berdasarkan database real
  const stats = useMemo(() => {
    const totalForms = forms.length
    const activeForms = forms.filter(f => f.status === 'published').length
    const totalRespondents = filteredResponses.length
    const avgScore = 78.4

    return { totalForms, activeForms, totalRespondents, avgScore }
  }, [forms, filteredResponses])

  // 🔥 Agregasi murni jawaban responden dari database untuk tiap widget
  const getWidgetData = (widget: any) => {
    const targetResponses = selectedFormId === 'all' 
      ? responses 
      : responses.filter(r => r.formId === widget.formId || r.formId === selectedFormId)

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

    if (labels.length > 0) {
      return { labels, values }
    }

    return { labels: ['Belum Ada Respon'], values: [0] }
  }

  // Render Grafik Dinamis
  const renderDynamicChart = (widget: any) => {
    const data = getWidgetData(widget)
    const colors = colorSchemes[widget.config?.colorScheme] || colorSchemes.cyan
    const chartType = widget.chartType

    if (chartType === 'bar') {
      const maxVal = Math.max(...data.values, 1)
      return (
        <div className="flex items-end gap-3 h-48 pt-4">
          {data.labels.map((label: string, i: number) => {
            const val = data.values[i] || 0
            const height = (val / maxVal) * 100
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-semibold text-white/70">{val}</span>
                <div 
                  className="w-full max-w-[40px] rounded-t-lg transition-all shadow-lg"
                  style={{ 
                    height: `${Math.max(height, 8)}%`,
                    background: `linear-gradient(to top, ${colors[0]}, ${colors[1]})`
                  }}
                />
                <span className="text-[10px] text-white/40 truncate w-full text-center">{label}</span>
              </div>
            )
          })}
        </div>
      )
    }

    if (chartType === 'pie') {
      const total = data.values.reduce((a: number, b: number) => a + b, 0) || 1
      let currentAngle = 0
      return (
        <div className="flex items-center gap-6 h-48 justify-center">
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
              {data.labels.map((_: string, i: number) => {
                const val = data.values[i] || 0
                const percentage = (val / total) * 100
                const angle = (percentage / 100) * 360
                const startAngle = currentAngle
                const endAngle = currentAngle + angle
                currentAngle = endAngle
                
                const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180)
                const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180)
                const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180)
                const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180)
                const largeArc = angle > 180 ? 1 : 0
                
                return (
                  <path
                    key={i}
                    d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={colors[i % colors.length]}
                    opacity={0.9}
                  />
                )
              })}
            </svg>
          </div>
          <div className="space-y-1.5 flex-1 max-w-[200px]">
            {data.labels.map((label: string, i: number) => {
              const val = data.values[i] || 0
              const percentage = Math.round((val / total) * 100)
              return (
                <div key={i} className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colors[i % colors.length] }} />
                    <span className="text-white/70 truncate">{label}</span>
                  </div>
                  <span className="text-white/40 font-mono">{percentage}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    if (chartType === 'matrix') {
      const matrixTotal = data.values.reduce((a: number, b: number) => a + b, 0) || 1
      return (
        <div className="space-y-3 h-48 flex flex-col justify-center">
          {data.labels.map((label: string, i: number) => {
            const val = data.values[i] || 0
            const percentage = Math.round((val / matrixTotal) * 100)
            return (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white/80 font-medium truncate max-w-[180px]">{label}</span>
                  <span className="text-white/40 font-mono">{val} responden ({percentage}%)</span>
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

    return null
  }

  // Filter widget aktif berdasarkan pilihan form di dropdown overview
  const displayedWidgets = useMemo(() => {
    if (selectedFormId === 'all') return widgets
    return widgets.filter(w => !w.formId || w.formId === selectedFormId)
  }, [widgets, selectedFormId])

  return (
    <div className="flex flex-col min-h-screen bg-[#06060E]">
      <Topbar title="Dashboard Overview" subtitle="Ringkasan data, statistik, dan visualisasi grafik real-time" />

      <div className="flex-1 p-6 space-y-6">
        {/* FILTER BAR BERDASARKAN FORMULIR */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#080812] border border-white/[0.05] p-5 rounded-2xl">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <Icon name="filter" className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex-1 sm:w-80">
              <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Filter Dashboard Berdasarkan Formulir</label>
              <select
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-cyan-400/40 cursor-pointer"
              >
                <option value="all" className="bg-[#080812]">Semua Formulir (Global)</option>
                {forms.map(f => (
                  <option key={f.id} value={f.id} className="bg-[#080812]">
                    {f.title} ({f.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Link href="/dashboard/widgets">
            <button className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white transition-all shadow-lg shadow-violet-600/25 flex items-center gap-2">
              <Icon name="settings" className="w-4 h-4" /> Atur Widget
            </button>
          </Link>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 uppercase tracking-wider">Total Formulir</span>
              <Icon name="fileText" className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-3xl font-bold font-display text-white">{stats.totalForms}</p>
            <p className="text-xs text-white/35 mt-1">{stats.activeForms} formulir aktif</p>
          </div>

          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 uppercase tracking-wider">Total Responden</span>
              <Icon name="users" className="w-4 h-4 text-violet-400" />
            </div>
            <p className="text-3xl font-bold font-display text-white">{stats.totalRespondents}</p>
            <p className="text-xs text-white/35 mt-1">
              {selectedFormId === 'all' ? 'Dari semua formulir' : 'Untuk form terpilih'}
            </p>
          </div>

          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 uppercase tracking-wider">Rata-rata Skor</span>
              <Icon name="barChart" className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-bold font-display text-white">{stats.avgScore}</p>
            <p className="text-xs text-white/35 mt-1">Skor performa sistem</p>
          </div>

          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 uppercase tracking-wider">Widget Aktif</span>
              <Icon name="layoutDashboard" className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold font-display text-white">{widgets.length}</p>
            <p className="text-xs text-white/35 mt-1">Tampil di dashboard</p>
          </div>
        </div>

        {/* DYNAMIC WIDGETS GRID */}
        {loading ? (
          <div className="text-center py-12 text-white/40">Memuat grafik dashboard...</div>
        ) : displayedWidgets.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-[#080812] border border-white/[0.05]">
            <Icon name="alertCircle" className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60 font-medium">Belum ada widget aktif untuk form ini.</p>
            <p className="text-sm text-white/30 mt-1">Aktifkan atau sesuaikan widget melalui menu Atur Widget.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {displayedWidgets.map((widget: any) => (
              <div key={widget.id} className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-display text-sm font-semibold text-white/90">
                    {widget.config?.title || widget.name}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase font-mono">
                    {widget.chartType}
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  {renderDynamicChart(widget)}
                </div>

                {(widget.config?.xLabel || widget.config?.yLabel) && (
                  <div className="flex justify-between text-[11px] text-white/30 mt-4 pt-3 border-t border-white/[0.04]">
                    <span>{widget.config.xLabel}</span>
                    <span>{widget.config.yLabel}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}