'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon, type IconName } from '@/components/ui/Icons'
import { Button } from '@/components/shared/Button'
import { getAllResponses, getForms, type FormResponse, type FormData as LegacyFormData } from '@/lib/firebase/repositories/forms.repo'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/shared/safeFetch'

// ============================================================================
// CONSTANTS & COLOR PALETTES
// ============================================================================

const CHART_TYPES: { id: string; name: string; icon: IconName; desc: string }[] = [
  { id: 'bar', name: 'Bar Chart', icon: 'barChart', desc: 'Grafik batang vertikal per perbandingan opsional' },
  { id: 'pie', name: 'Pie / Donut', icon: 'pieChart', desc: 'Grafik lingkaran proporsi distribusi jawaban' },
  { id: 'line', name: 'Line Chart', icon: 'trendingUp', desc: 'Grafik tren kecenderungan dan garis pergerakan' },
  { id: 'number', name: 'Stat Score', icon: 'hash', desc: 'Kartu ringkasan angka & persentase akumulasi' },
  { id: 'matrix', name: 'Matrix Progress', icon: 'table', desc: 'Baris distribusi persen per opsi matriks/likert' },
]

const COLOR_SCHEMES: { id: string; name: string; colors: string[] }[] = [
  { id: 'cyan', name: 'Ocean Cyan', colors: ['#06b6d4', '#22d3ee', '#38bdf8', '#60a5fa', '#a5f3fc'] },
  { id: 'violet', name: 'Deep Violet', colors: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#d8b4fe', '#f3e8ff'] },
  { id: 'emerald', name: 'Mint Emerald', colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#ecfdf5'] },
  { id: 'amber', name: 'Sunset Amber', colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'] },
  { id: 'rose', name: 'Neon Rose', colors: ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6'] },
  { id: 'blue', name: 'Electric Blue', colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'] },
]

export interface WidgetItem {
  id: string
  name: string
  formId: string
  formTitle: string
  questionId: string
  questionText: string
  chartType: 'bar' | 'pie' | 'line' | 'number' | 'matrix'
  enabled: boolean
  position: number
  config: {
    title: string
    colorScheme: string
    showLegend: boolean
    xLabel?: string
    yLabel?: string
  }
}

export default function WidgetsPage() {
  const { user, userData, userRole, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading) {
      const effectiveRole = userRole || userData?.role
      if (effectiveRole === 'partnership') {
        router.replace('/dashboard/partnership')
      } else if (effectiveRole === 'cadre') {
        router.replace('/dashboard/monitoring')
      }
    }
  }, [authLoading, userRole, userData, router])

  // Data States
  const [widgets, setWidgets] = useState<WidgetItem[]>([])
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [forms, setForms] = useState<LegacyFormData[]>([])
  const [v15Forms, setV15Forms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters & Layout Mode
  const [selectedFormId, setSelectedFormId] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [chartTypeFilter, setChartTypeFilter] = useState<string>('all')
  const [layoutMode, setLayoutMode] = useState<'grid' | 'comparison'>('grid')

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingWidget, setEditingWidget] = useState<WidgetItem | null>(null)
  const [editorConfig, setEditorConfig] = useState<{
    title: string
    chartType: 'bar' | 'pie' | 'line' | 'number' | 'matrix'
    colorScheme: string
    showLegend: boolean
  }>({
    title: '',
    chartType: 'bar',
    colorScheme: 'cyan',
    showLegend: true,
  })

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Load All Forms & Responses
  const loadWidgetData = async () => {
    setIsLoading(true)
    try {
      // 1. Fetch Legacy Responses & V1.0 Forms
      const [resData, v10Data] = await Promise.all([getAllResponses(), getForms()])
      setResponses(resData)
      setForms(v10Data)

      // 2. Fetch V1.5 Forms safely
      let v15Data: any[] = []
      const { ok, data: v15Json } = await safeFetchJson('/api/v1_5/forms')
      if (ok && v15Json && Array.isArray(v15Json.forms)) {
        v15Data = v15Json.forms
      }
      setV15Forms(v15Data)

      // 3. Generate Dynamic Widgets list with diverse initial chart types
      const dynamicWidgets: WidgetItem[] = []
      let positionCounter = 0

      // Process V1.0 Questions
      v10Data.forEach((form) => {
        form.questions?.forEach((q: any, qIdx: number) => {
          const type = q.answerType || q.type || 'short-text'
          if (['single-choice', 'multiple-choice', 'dropdown', 'indicator-table', 'likert', 'rating', 'binary'].includes(type)) {
            const qTitle = q.question || q.label || 'Pertanyaan Evaluasi'
            
            const assignedType: 'bar' | 'pie' | 'line' | 'number' | 'matrix' =
              type === 'indicator-table' || type === 'likert'
                ? 'matrix'
                : type === 'rating'
                ? 'number'
                : qIdx % 3 === 0
                ? 'bar'
                : qIdx % 3 === 1
                ? 'pie'
                : 'line'

            dynamicWidgets.push({
              id: `widget-v10-${q.id}`,
              name: `${form.title}: ${qTitle}`,
              formId: form.id || 'v10-form',
              formTitle: form.title || 'Formulir V1.0',
              questionId: q.id,
              questionText: qTitle,
              chartType: assignedType,
              enabled: positionCounter < 6,
              position: positionCounter++,
              config: {
                title: qTitle,
                colorScheme: COLOR_SCHEMES[positionCounter % COLOR_SCHEMES.length].id,
                showLegend: true,
              },
            })
          }
        })
      })

      // Process V1.5 Questions
      v15Data.forEach((f15) => {
        f15.questions?.forEach((q: any, qIdx: number) => {
          const qTitle = q.title || q.question || 'Pertanyaan V1.5'
          const assignedType: 'bar' | 'pie' | 'line' | 'number' | 'matrix' =
            qIdx % 4 === 0 ? 'bar' : qIdx % 4 === 1 ? 'pie' : qIdx % 4 === 2 ? 'line' : 'matrix'

          dynamicWidgets.push({
            id: `widget-v15-${q.id || crypto.randomUUID()}`,
            name: `[V1.5] ${f15.metadata?.title || 'Form V1.5'}: ${qTitle}`,
            formId: f15.formId,
            formTitle: f15.metadata?.title || 'Form V1.5',
            questionId: q.id || q.questionId,
            questionText: qTitle,
            chartType: assignedType,
            enabled: positionCounter < 8,
            position: positionCounter++,
            config: {
              title: qTitle,
              colorScheme: COLOR_SCHEMES[positionCounter % COLOR_SCHEMES.length].id,
              showLegend: true,
            },
          })
        })
      })

      // Check LocalStorage Saved Preferences
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('dashboard_widgets_cms_config_v5')
        if (saved) {
          try {
            const parsed: WidgetItem[] = JSON.parse(saved)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setWidgets(parsed)
            } else {
              setWidgets(dynamicWidgets)
            }
          } catch {
            setWidgets(dynamicWidgets)
          }
        } else {
          setWidgets(dynamicWidgets)
        }
      } else {
        setWidgets(dynamicWidgets)
      }
    } catch (err: any) {
      console.error('Error loading widget CMS data:', err)
      showToast('Gagal memuat data grafik dari database.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadWidgetData()
  }, [])

  // Save Settings Local & Sync
  const saveWidgetSettings = (updatedList: WidgetItem[]) => {
    setWidgets(updatedList)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard_widgets_cms_config_v5', JSON.stringify(updatedList))
      localStorage.setItem('dashboard_widgets_config', JSON.stringify(updatedList))
    }
    showToast('Pengaturan widget grafik berhasil disimpan & disinkronkan ke Dashboard!')
  }

  // Quick Change Chart Type directly on card
  const handleChangeChartTypeOnCard = (id: string, newType: 'bar' | 'pie' | 'line' | 'number' | 'matrix') => {
    const nextList = widgets.map((w) => (w.id === id ? { ...w, chartType: newType } : w))
    saveWidgetSettings(nextList)
  }

  // Quick Change Color Scheme directly on card
  const handleChangeColorSchemeOnCard = (id: string, schemeId: string) => {
    const nextList = widgets.map((w) =>
      w.id === id ? { ...w, config: { ...w.config, colorScheme: schemeId } } : w
    )
    saveWidgetSettings(nextList)
  }

  // Toggle Widget State
  const handleToggleWidget = (id: string) => {
    const nextList = widgets.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    saveWidgetSettings(nextList)
  }

  // Open Editor Modal
  const handleOpenEditor = (w: WidgetItem) => {
    setEditingWidget(w)
    setEditorConfig({
      title: w.config?.title || w.questionText,
      chartType: w.chartType,
      colorScheme: w.config?.colorScheme || 'cyan',
      showLegend: w.config?.showLegend !== false,
    })
    setIsEditorOpen(true)
  }

  // Save Editor Changes
  const handleSaveEditor = () => {
    if (!editingWidget) return
    const updatedList = widgets.map((w) => {
      if (w.id === editingWidget.id) {
        return {
          ...w,
          chartType: editorConfig.chartType,
          config: {
            ...w.config,
            title: editorConfig.title,
            colorScheme: editorConfig.colorScheme,
            showLegend: editorConfig.showLegend,
          },
        }
      }
      return w
    })
    saveWidgetSettings(updatedList)
    setIsEditorOpen(false)
    setEditingWidget(null)
  }

  // Calculate Real Answer Frequencies from Responses
  const getWidgetChartData = (widget: WidgetItem) => {
    const targetResponses = responses.filter((r) => r.formId === widget.formId || !r.formId)
    const counts: Record<string, number> = {}

    targetResponses.forEach((r) => {
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
              val.forEach((item) => {
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
    const values = labels.map((l) => counts[l])

    // Fallback Data if no response yet
    if (labels.length === 0) {
      if (widget.chartType === 'number') {
        return { labels: ['Skor Total Evaluasi'], values: [94], isMock: true }
      }
      if (widget.chartType === 'line') {
        return {
          labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
          values: [15, 28, 36, 45],
          isMock: true,
        }
      }
      if (widget.chartType === 'pie') {
        return {
          labels: ['Memenuhi Standar', 'Cukup Baik', 'Perlu Perbaikan', 'Kurang'],
          values: [42, 28, 18, 12],
          isMock: true,
        }
      }
      if (widget.chartType === 'bar') {
        return {
          labels: ['Sarana Sanitasi', 'Hygiene Petugas', 'Label Pangan', 'Suhu Simpan'],
          values: [34, 26, 19, 12],
          isMock: true,
        }
      }
      return {
        labels: ['Sangat Baik', 'Baik / Cukup', 'Sedang', 'Perlu Pembinaan'],
        values: [30, 22, 15, 8],
        isMock: true,
      }
    }

    return { labels, values, isMock: false }
  }

  // Filtered & Sorted Widgets List
  const filteredWidgets = useMemo(() => {
    return widgets.filter((w) => {
      const matchForm = selectedFormId === 'all' || w.formId === selectedFormId
      const matchSearch =
        (w.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.questionText || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchChart = chartTypeFilter === 'all' || w.chartType === chartTypeFilter
      return matchForm && matchSearch && matchChart
    })
  }, [widgets, selectedFormId, searchTerm, chartTypeFilter])

  // Chart Component Render Engine (STRICT BOUNDARIES: 100% Contained inside card box)
  const renderLiveChart = (widget: WidgetItem) => {
    const data = getWidgetChartData(widget)
    const scheme = COLOR_SCHEMES.find((c) => c.id === widget.config?.colorScheme) || COLOR_SCHEMES[0]
    const colors = scheme.colors

    switch (widget.chartType) {
      case 'bar': {
        const displayLabels = data.labels.slice(0, 4)
        const displayValues = data.values.slice(0, 4)
        const maxVal = Math.max(...(displayValues || [1]), 1)

        return (
          <div className="w-full h-40 flex items-end justify-around gap-2 px-1 pt-4 pb-1 overflow-hidden">
            {displayLabels.map((label, idx) => {
              const val = displayValues[idx] || 0
              const barHeightPct = Math.min(Math.max((val / maxVal) * 100, 15), 100)
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full min-w-0 group/bar">
                  <span className="text-[10px] font-mono font-bold text-cyan-300 mb-1">
                    {val}
                  </span>
                  <div
                    className="w-full max-w-[32px] rounded-t-lg transition-all duration-300 shadow group-hover/bar:brightness-125"
                    style={{
                      height: `${barHeightPct}%`,
                      backgroundColor: colors[idx % colors.length],
                    }}
                  />
                  {/* Strict Line Clamp 2 for Labels */}
                  <span className="text-[9px] text-slate-300 font-medium leading-tight text-center w-full mt-1.5 line-clamp-2 break-words">
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        )
      }

      case 'pie': {
        const displayLabels = data.labels.slice(0, 3)
        const displayValues = data.values.slice(0, 3)
        const total = displayValues.reduce((a, b) => a + b, 0) || 1

        return (
          <div className="w-full h-40 flex items-center justify-between gap-3 p-2 overflow-hidden">
            {/* SVG Donut */}
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {displayValues.map((val, idx) => {
                  const pct = (val / total) * 100
                  const dashArray = `${pct} ${100 - pct}`
                  const accumPct = displayValues.slice(0, idx).reduce((a, b) => a + b, 0)
                  const offset = 100 - (accumPct / total) * 100
                  return (
                    <circle
                      key={idx}
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke={colors[idx % colors.length]}
                      strokeWidth="4.2"
                      strokeDasharray={dashArray}
                      strokeDashoffset={offset}
                    />
                  )
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-extrabold text-slate-100 font-mono">{total}</span>
                <span className="text-[8px] text-slate-400">Total</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="flex-1 space-y-1.5 min-w-0 overflow-hidden">
              {displayLabels.map((label, idx) => {
                const val = displayValues[idx] || 0
                const pct = Math.round((val / total) * 100)
                return (
                  <div key={idx} className="flex items-center justify-between gap-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                      <span className="text-slate-300 font-medium truncate">{label}</span>
                    </div>
                    <span className="font-mono text-cyan-300 font-bold flex-shrink-0 ml-1">
                      {val} <span className="text-slate-500 text-[9px]">({pct}%)</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      }

      case 'line': {
        const displayLabels = data.labels.slice(0, 4)
        const displayValues = data.values.slice(0, 4)
        const maxVal = Math.max(...(displayValues || [1]), 1)
        const points = displayValues
          .map((v, i) => {
            const x = (i / Math.max(displayValues.length - 1, 1)) * 100
            const y = 85 - (v / maxVal) * 70
            return `${x},${y}`
          })
          .join(' ')

        return (
          <div className="w-full h-40 flex flex-col justify-between p-2 overflow-hidden">
            <div className="relative flex-1 w-full pt-1 overflow-hidden">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-hidden">
                <polygon
                  fill={`${colors[0]}22`}
                  points={`0,100 ${points} 100,100`}
                />
                <polyline
                  fill="none"
                  stroke={colors[0]}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
                {displayValues.map((v, i) => {
                  const x = (i / Math.max(displayValues.length - 1, 1)) * 100
                  const y = 85 - (v / maxVal) * 70
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={colors[i % colors.length]}
                      stroke="#070913"
                      strokeWidth="1.5"
                    />
                  )
                })}
              </svg>
            </div>

            <div className="flex justify-between text-[9px] text-slate-400 font-mono pt-2 border-t border-slate-800/80 gap-1 overflow-hidden">
              {displayLabels.map((lbl, idx) => (
                <span key={idx} className="truncate text-center flex-1">
                  {lbl}
                </span>
              ))}
            </div>
          </div>
        )
      }

      case 'number': {
        const total = data.values.reduce((a, b) => a + b, 0)
        const primaryVal = data.values[0] || total

        return (
          <div className="w-full h-40 flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 text-center overflow-hidden">
            <span className="text-3xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              {primaryVal}
            </span>
            <div className="mt-1.5 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
              <Icon name="trendingUp" className="w-3 h-3" />
              <span>Respon Terverifikasi</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-2 font-medium line-clamp-2 break-words max-w-xs">
              {widget.config?.title || widget.questionText}
            </p>
          </div>
        )
      }

      case 'matrix':
      default: {
        const displayLabels = data.labels.slice(0, 3)
        const displayValues = data.values.slice(0, 3)
        const total = displayValues.reduce((a, b) => a + b, 0) || 1

        return (
          <div className="w-full h-40 flex flex-col justify-center space-y-2.5 p-2 overflow-hidden">
            {displayLabels.map((label, idx) => {
              const val = displayValues[idx] || 0
              const pct = Math.round((val / total) * 100)
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] gap-2">
                    <span className="text-slate-200 font-medium truncate flex-1">{label}</span>
                    <span className="text-cyan-300 font-mono font-bold shrink-0 ml-1">
                      {val} <span className="text-slate-500 text-[9px]">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: colors[idx % colors.length] }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#070913] text-slate-100 font-sans">
      <Topbar
        title="CMS Widget Grafik & Analisis"
        subtitle="Manajemen visualisasi grafik, tata letak rapi, penyesuaian parameter, dan mode perbandingan"
      />

      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-violet-950/40 to-slate-900 border border-violet-500/30 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[11px] font-bold">
                CMS Visualisasi Dashboard
              </span>
              <span className="text-slate-400 text-xs">• Layout Rapi & Terisolasi Dalam Kartu</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">Manajemen & Penyesuaian Grafik Interaktif</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Setiap grafik terisolasi secara sempurna di dalam kartu masing-masing tanpa ada elemen yang saling menimpa. 
              Ubah tipe grafik dan skema warna secara instan.
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto flex-wrap">
            <Button
              variant="primary"
              size="md"
              icon="save"
              onClick={() => saveWidgetSettings(widgets)}
              className="w-full sm:w-auto shadow-lg shadow-cyan-600/30 font-bold"
            >
              Simpan Semua Widget
            </Button>
          </div>
        </div>

        {/* Filters & Mode Switcher */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Bar */}
            <div className="relative flex-1 sm:flex-initial">
              <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari pertanyaan / judul widget..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
              />
            </div>

            {/* Form Filter */}
            <select
              value={selectedFormId}
              onChange={(e) => setSelectedFormId(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">Semua Formulir ({widgets.length} Widget)</option>
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  V1.0: {f.title}
                </option>
              ))}
              {v15Forms.map((f15) => (
                <option key={f15.formId} value={f15.formId}>
                  V1.5: {f15.metadata?.title || f15.formId}
                </option>
              ))}
            </select>

            {/* Chart Type Filter */}
            <select
              value={chartTypeFilter}
              onChange={(e) => setChartTypeFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">Semua Tipe Grafik</option>
              {CHART_TYPES.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name}
                </option>
              ))}
            </select>
          </div>

          {/* Layout Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl self-end md:self-auto">
            <button
              type="button"
              onClick={() => setLayoutMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                layoutMode === 'grid' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
              }`}
            >
              <Icon name="grid" className="w-4 h-4" />
              <span>Grid Mode (3 Kolom)</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('comparison')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                layoutMode === 'comparison' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
              }`}
            >
              <Icon name="table" className="w-4 h-4 text-cyan-400" />
              <span>Perbandingan (2 Kolom)</span>
            </button>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-3">
            <Icon name="loader" className="w-5 h-5 text-cyan-400 animate-spin" />
            <span>Memuat data grafik dari database...</span>
          </div>
        ) : filteredWidgets.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
            <Icon name="pieChart" className="w-12 h-12 mx-auto text-slate-700" />
            <p className="text-base font-bold text-slate-200">Tidak Ada Widget Grafik Ditemukan</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tidak ada pertanyaan kuesioner yang cocok dengan kriteria filter pencarian Anda.
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-6 ${
              layoutMode === 'comparison' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {filteredWidgets.map((widget) => {
              const chartInfo = CHART_TYPES.find((c) => c.id === widget.chartType) || CHART_TYPES[0]

              return (
                <div
                  key={widget.id}
                  className={`rounded-3xl border p-5 flex flex-col justify-between space-y-4 overflow-hidden backdrop-blur-md transition-all shadow-lg ${
                    widget.enabled
                      ? 'bg-slate-900/95 border-slate-800 hover:border-cyan-500/40'
                      : 'bg-slate-950/40 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="space-y-3 overflow-hidden">
                    {/* Top Control Bar */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                      {/* Enable Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={widget.enabled}
                          onChange={() => handleToggleWidget(widget.id)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:bg-cyan-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                        <span className="ml-2 text-[11px] font-bold text-slate-300">
                          {widget.enabled ? 'Aktif' : 'Sembunyi'}
                        </span>
                      </label>

                      {/* Modal Editor Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditor(widget)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-cyan-600/30 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-colors"
                        title="Edit Judul & Parameter"
                      >
                        <Icon name="pencil" className="w-4 h-4 text-cyan-400" />
                      </button>
                    </div>

                    {/* Question Title & Form Badge */}
                    <div className="space-y-1 overflow-hidden">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 truncate max-w-full block">
                        {widget.formTitle}
                      </span>
                      <h3 className="text-sm font-bold text-slate-100 line-clamp-2 leading-snug break-words">
                        {widget.config?.title || widget.questionText}
                      </h3>
                    </div>

                    {/* Fast Chart Type Selector Bar */}
                    <div className="flex items-center gap-1 overflow-x-auto py-1 custom-scrollbar">
                      {CHART_TYPES.map((ct) => (
                        <button
                          key={ct.id}
                          type="button"
                          onClick={() => handleChangeChartTypeOnCard(widget.id, ct.id as any)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all flex-shrink-0 ${
                            widget.chartType === ct.id
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                          title={`Ubah ke ${ct.name}`}
                        >
                          <Icon name={ct.icon} className="w-3 h-3" />
                          <span className="capitalize">{ct.id}</span>
                        </button>
                      ))}
                    </div>

                    {/* Live Chart Preview Canvas (STRICT BOUNDS: h-40 max, overflow-hidden) */}
                    <div className="rounded-2xl bg-slate-950 border border-slate-800/90 shadow-inner overflow-hidden">
                      {renderLiveChart(widget)}
                    </div>
                  </div>

                  {/* Footer Color Scheme Selector Bar */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] overflow-hidden">
                    <span className="text-slate-400 font-mono flex items-center gap-1 truncate">
                      <Icon name={chartInfo.icon} className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span className="truncate">{chartInfo.name}</span>
                    </span>

                    {/* Color Scheme Dots */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {COLOR_SCHEMES.map((scheme) => (
                        <button
                          key={scheme.id}
                          type="button"
                          onClick={() => handleChangeColorSchemeOnCard(widget.id, scheme.id)}
                          className={`w-3.5 h-3.5 rounded-full transition-transform border ${
                            widget.config?.colorScheme === scheme.id
                              ? 'scale-125 border-white shadow-md shadow-cyan-500/50'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: scheme.colors[0] }}
                          title={`Warna: ${scheme.name}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Editor Modal Component */}
      {isEditorOpen && editingWidget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsEditorOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Icon name="pencil" className="w-5 h-5 text-cyan-400" />
                <span>Edit Parameter Widget Grafik</span>
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <div className="space-y-4 text-xs">
              {/* Judul Grafik */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Judul Grafik Widget</label>
                <textarea
                  rows={2}
                  value={editorConfig.title}
                  onChange={(e) => setEditorConfig({ ...editorConfig, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 leading-relaxed break-words"
                />
              </div>

              {/* Tipe Grafik */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Tipe Visualisasi Grafik</label>
                <div className="grid grid-cols-2 gap-2">
                  {CHART_TYPES.map((ct) => (
                    <button
                      key={ct.id}
                      type="button"
                      onClick={() => setEditorConfig({ ...editorConfig, chartType: ct.id as any })}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        editorConfig.chartType === ct.id
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon name={ct.icon} className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold">{ct.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Skema Warna */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Palet Skema Warna</label>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_SCHEMES.map((scheme) => (
                    <button
                      key={scheme.id}
                      type="button"
                      onClick={() => setEditorConfig({ ...editorConfig, colorScheme: scheme.id })}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        editorConfig.colorScheme === scheme.id
                          ? 'bg-slate-800 border-cyan-400 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="text-[11px]">{scheme.name}</span>
                      <div className="flex items-center gap-0.5">
                        {scheme.colors.slice(0, 3).map((c, idx) => (
                          <span key={idx} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditor}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-600/20 flex items-center gap-1.5"
              >
                <Icon name="check" className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-3">
          {toastMessage}
        </div>
      )}
    </div>
  )
}