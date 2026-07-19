'use client'

import { useState, useMemo, useRef } from 'react'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import { Button } from '@/components/shared/Button'

// ============ DATA DUMMY DENGAN GROUP ============
const formDataWithGroup = {
  'Kuesioner IRT': {
    group: 'Program KKN Tematik 2026',
    total: 142,
    visualizations: [
      { id: 'vis1', name: 'Pengetahuan Bahaya Biologi', type: 'Bar Chart', data: { labels: ['Benar', 'Salah'], values: [92, 50] } },
      { id: 'vis2', name: 'Distribusi Pengetahuan Label', type: 'Pie Chart', data: { labels: ['Benar', 'Ragu', 'Salah'], values: [82, 24, 36] } },
      { id: 'vis3', name: 'Rata-rata Skor Keamanan', type: 'Number (Skor)', data: { value: 74.8, max: 100 } },
      { id: 'vis4', name: 'Sikap terhadap Pedagang', type: 'Matrix', data: { labels: ['Setuju', 'Netral', 'Tidak Setuju'], values: [102, 21, 19] } },
      { id: 'vis5', name: 'Distribusi Umur Responden', type: 'Bar Chart', data: { labels: ['18-25', '26-35', '36-45', '46-55', '55+'], values: [25, 45, 38, 22, 12] } },
    ]
  },
  'Fasilitasi Dapur': {
    group: 'Program KKN Tematik 2026',
    total: 87,
    visualizations: [
      { id: 'vis6', name: 'Praktik Cuci Tangan', type: 'Pie Chart', data: { labels: ['Benar', 'Kurang'], values: [68, 19] } },
      { id: 'vis7', name: 'Pemisahan Talenan', type: 'Bar Chart', data: { labels: ['Ya', 'Tidak'], values: [48, 39] } },
      { id: 'vis8', name: 'Skor Fasilitasi', type: 'Number (Skor)', data: { value: 82.5, max: 100 } },
      { id: 'vis9', name: 'Status Dapur', type: 'Matrix', data: { labels: ['Bersih & Rapi', 'Perlu Perbaikan'], values: [52, 35] } },
    ]
  },
  'Kuesioner Kader Sekolah': {
    group: 'Program KKN Tematik 2026',
    total: 63,
    visualizations: [
      { id: 'vis10', name: 'Pengetahuan Gizi', type: 'Pie Chart', data: { labels: ['Baik', 'Cukup', 'Kurang'], values: [28, 16, 19] } },
      { id: 'vis11', name: 'Minat Belajar', type: 'Bar Chart', data: { labels: ['Tertarik', 'Tidak'], values: [57, 6] } },
      { id: 'vis12', name: 'Rata-rata Skor', type: 'Number (Skor)', data: { value: 68.3, max: 100 } },
    ]
  },
  'Observasi Dapur': {
    group: 'Workshop Series 2026',
    total: 63,
    visualizations: [
      { id: 'vis13', name: 'Kebersihan Dapur', type: 'Bar Chart', data: { labels: ['Bersih', 'Cukup', 'Kotor'], values: [25, 28, 10] } },
      { id: 'vis14', name: 'Penyimpanan Bahan', type: 'Pie Chart', data: { labels: ['Sesuai', 'Tidak Sesuai'], values: [40, 23] } },
    ]
  },
  'Kuesioner Stunting': {
    group: '- (Mandiri)',
    total: 55,
    visualizations: [
      { id: 'vis15', name: 'Pengetahuan Stunting', type: 'Bar Chart', data: { labels: ['Baik', 'Cukup', 'Kurang'], values: [20, 20, 15] } },
      { id: 'vis16', name: 'Pola Makan Anak', type: 'Pie Chart', data: { labels: ['Sehat', 'Cukup', 'Kurang'], values: [15, 25, 15] } },
    ]
  },
  'Evaluasi Posyandu': {
    group: 'Workshop Series 2026',
    total: 0,
    visualizations: []
  }
}

const formOptions = Object.keys(formDataWithGroup)

// Get unique groups
const getUniqueGroups = () => {
  const groups = new Set(Object.values(formDataWithGroup).map(f => f.group))
  return ['Semua Group', ...Array.from(groups)]
}

type Visualization = {
  id: string
  name: string
  type: string
  data: any
}

export default function AnalyticsPage() {
  const [selectedForms, setSelectedForms] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedVisuals, setSelectedVisuals] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'group' | 'form'>('group')
  const printRef = useRef<HTMLDivElement>(null)

  // Get available visualizations based on selected forms
  const availableVisuals = useMemo(() => {
    if (selectedForms.length === 0 && selectedGroups.length === 0) return []
    
    let filteredForms: string[] = []
    
    // Filter by groups
    if (selectedGroups.length > 0) {
      const groupNames = selectedGroups
      filteredForms = formOptions.filter(form => {
        const group = formDataWithGroup[form as keyof typeof formDataWithGroup]?.group
        return groupNames.includes(group)
      })
    }
    
    // Combine with selected forms
    const allForms = [...new Set([...selectedForms, ...filteredForms])]
    
    if (allForms.length === 0) return []
    
    const allVisuals: Visualization[] = []
    allForms.forEach(form => {
      const formVis = formDataWithGroup[form as keyof typeof formDataWithGroup]?.visualizations || []
      allVisuals.push(...formVis)
    })
    return allVisuals
  }, [selectedForms, selectedGroups])

  // Get selected visualizations data
  const selectedVisualData = useMemo(() => {
    return availableVisuals.filter(v => selectedVisuals.includes(v.id))
  }, [availableVisuals, selectedVisuals])

  // Check if there's data
  const hasData = useMemo(() => {
    if (selectedForms.length === 0 && selectedGroups.length === 0) return false
    const total = selectedForms.reduce((acc, form) => {
      return acc + (formDataWithGroup[form as keyof typeof formDataWithGroup]?.total || 0)
    }, 0)
    return total > 0
  }, [selectedForms, selectedGroups])

  // Handle group selection
  const handleGroupToggle = (group: string) => {
    setSelectedGroups(prev => {
      if (prev.includes(group)) {
        const newSelected = prev.filter(g => g !== group)
        if (newSelected.length === 0) setSelectedVisuals([])
        return newSelected
      }
      return [...prev, group]
    })
  }

  // Handle form selection
  const handleFormToggle = (form: string) => {
    setSelectedForms(prev => {
      if (prev.includes(form)) {
        const newSelected = prev.filter(f => f !== form)
        if (newSelected.length === 0 && selectedGroups.length === 0) setSelectedVisuals([])
        return newSelected
      }
      return [...prev, form]
    })
  }

  // Handle select all forms in group
  const handleSelectGroupForms = (group: string) => {
    const formsInGroup = formOptions.filter(form => 
      formDataWithGroup[form as keyof typeof formDataWithGroup]?.group === group
    )
    const allSelected = formsInGroup.every(f => selectedForms.includes(f))
    
    if (allSelected) {
      setSelectedForms(selectedForms.filter(f => !formsInGroup.includes(f)))
    } else {
      setSelectedForms([...selectedForms, ...formsInGroup.filter(f => !selectedForms.includes(f))])
    }
  }

  // Handle select all forms
  const handleSelectAllForms = () => {
    if (selectedForms.length === formOptions.length) {
      setSelectedForms([])
      setSelectedVisuals([])
    } else {
      setSelectedForms(formOptions)
    }
  }

  // Handle visual selection
  const handleVisualToggle = (id: string) => {
    setSelectedVisuals(prev => {
      if (prev.includes(id)) {
        return prev.filter(v => v !== id)
      }
      return [...prev, id]
    })
  }

  // Handle select all visuals
  const handleSelectAllVisuals = () => {
    if (selectedVisuals.length === availableVisuals.length) {
      setSelectedVisuals([])
    } else {
      setSelectedVisuals(availableVisuals.map(v => v.id))
    }
  }

  // Handle reset
  const handleReset = () => {
    setSelectedForms([])
    setSelectedGroups([])
    setSelectedVisuals([])
    setStartDate('')
    setEndDate('')
    setExportError(null)
    setViewMode('group')
  }

  // Handle export PDF
  const handleExportPDF = async () => {
    if (selectedVisualData.length === 0) return
    
    setIsExporting(true)
    setExportError(null)
    
    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() < 0.1) {
            reject(new Error('Gagal mengekspor PDF. Silakan coba lagi.'))
          }
          resolve(true)
        }, 2000)
      })
      window.print()
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Terjadi kesalahan saat ekspor')
    } finally {
      setIsExporting(false)
    }
  }

  // Render visualization based on type
  const renderVisualization = (vis: Visualization) => {
    const { type, data, name } = vis
    
    switch (type) {
      case 'Bar Chart':
        return (
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
            <h4 className="text-sm font-medium text-white/80 mb-4">{name}</h4>
            <div className="flex items-end gap-3 h-48">
              {data.labels.map((label: string, i: number) => {
                const maxVal = Math.max(...data.values)
                const height = maxVal > 0 ? (data.values[i] / maxVal) * 100 : 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full max-w-[40px] bg-gradient-to-t from-cyan-500 to-violet-500 rounded-t-lg transition-all"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <span className="text-xs text-white/40">{label}</span>
                    <span className="text-xs font-medium text-white/60">{data.values[i]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 'Pie Chart':
        const total = data.values.reduce((a: number, b: number) => a + b, 0)
        let currentAngle = 0
        const colors = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6']
        
        return (
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
            <h4 className="text-sm font-medium text-white/80 mb-4">{name}</h4>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {data.labels.map((label: string, i: number) => {
                    const percentage = (data.values[i] / total) * 100
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
                        opacity={0.8}
                      />
                    )
                  })}
                </svg>
              </div>
              <div className="space-y-1">
                {data.labels.map((label: string, i: number) => {
                  const percentage = total > 0 ? Math.round((data.values[i] / total) * 100) : 0
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-3 h-3 rounded" style={{ background: colors[i % colors.length] }} />
                      <span className="text-white/60">{label}</span>
                      <span className="text-white/40">{percentage}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 'Number (Skor)':
        return (
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
            <h4 className="text-sm font-medium text-white/80 mb-2">{name}</h4>
            <div className="text-center">
              <span className="text-5xl font-bold font-display text-cyan-400">{data.value}</span>
              <span className="text-sm text-white/30 ml-1">/ {data.max}</span>
              <div className="w-full h-2 bg-white/[0.05] rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all"
                  style={{ width: `${(data.value / data.max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )

      case 'Matrix':
        return (
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
            <h4 className="text-sm font-medium text-white/80 mb-4">{name}</h4>
            <div className="space-y-2">
              {data.labels.map((label: string, i: number) => {
                const total = data.values.reduce((a: number, b: number) => a + b, 0)
                const percentage = total > 0 ? Math.round((data.values[i] / total) * 100) : 0
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-white/60 w-24 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-white/60 w-12 text-right">{data.values[i]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Print styles
  const printStyles = `
    @media print {
      body * {
        visibility: hidden;
      }
      #print-area, #print-area * {
        visibility: visible;
      }
      #print-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        padding: 40px;
        background: white;
        color: black;
      }
      #print-area .chart-container {
        page-break-inside: avoid;
        margin-bottom: 20px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
      }
      #print-area .chart-container h4 {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 12px;
      }
      #print-area .print-header {
        margin-bottom: 24px;
      }
      #print-area .print-header h1 {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 4px;
      }
      #print-area .print-header p {
        font-size: 13px;
        color: #666;
        margin: 2px 0;
      }
      .no-print {
        display: none !important;
      }
    }
  `

  return (
    <div className="flex flex-col min-h-screen">
      <style>{printStyles}</style>
      
      <Topbar 
        title="Laporan & Analisis" 
        subtitle="Analisis data dari formulir yang telah terkumpul" 
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Filter Section */}
        <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
          <div className="flex flex-wrap items-start gap-6">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 uppercase tracking-wider">Tampilkan:</span>
              <button
                onClick={() => setViewMode('group')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'group'
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/20'
                    : 'bg-white/[0.03] text-white/50 hover:text-white/80 border border-white/[0.05]'
                }`}
              >
                {/* PERBAIKAN: Ganti 'folder' dengan 'grid' */}
                <Icon name="grid" className="w-3 h-3 inline mr-1" /> Group
              </button>
              <button
                onClick={() => setViewMode('form')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'form'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                    : 'bg-white/[0.03] text-white/50 hover:text-white/80 border border-white/[0.05]'
                }`}
              >
                <Icon name="fileText" className="w-3 h-3 inline mr-1" /> Form
              </button>
            </div>

            {/* Group Filter */}
            {viewMode === 'group' && (
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                  Pilih Group
                </label>
                <div className="flex flex-wrap gap-2">
                  {getUniqueGroups().filter(g => g !== 'Semua Group').map((group) => (
                    <button
                      key={group}
                      onClick={() => handleGroupToggle(group)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedGroups.includes(group)
                          ? 'bg-violet-500/20 text-violet-400 border border-violet-500/20'
                          : 'bg-white/[0.03] text-white/50 hover:text-white/80 border border-white/[0.05]'
                      }`}
                    >
                      {group} ({formOptions.filter(f => formDataWithGroup[f as keyof typeof formDataWithGroup]?.group === group).length})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form Filter */}
            {viewMode === 'form' && (
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                  Pilih Formulir
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSelectAllForms}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedForms.length === formOptions.length
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                        : 'bg-white/[0.03] text-white/50 hover:text-white/80 border border-white/[0.05]'
                    }`}
                  >
                    {selectedForms.length === formOptions.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {formOptions.map((form) => (
                    <button
                      key={form}
                      onClick={() => handleFormToggle(form)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedForms.includes(form)
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                          : 'bg-white/[0.03] text-white/50 hover:text-white/80 border border-white/[0.05]'
                      }`}
                    >
                      {form} ({formDataWithGroup[form as keyof typeof formDataWithGroup]?.total || 0})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Date Range */}
            <div className="flex gap-3">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-cyan-400/40 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-cyan-400/40 transition-all"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/50 hover:text-white/80 hover:border-white/10 transition-all flex items-center gap-1"
                >
                  <Icon name="refreshCw" className="w-3 h-3" /> Reset
                </button>
              </div>
            </div>
          </div>

          {/* Filter Indicator */}
          {(selectedGroups.length > 0 || selectedForms.length > 0 || startDate || endDate) && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-xs text-cyan-400 flex-wrap">
              <Icon name="filter" className="w-3 h-3" />
              <span>Filter aktif:</span>
              {selectedGroups.length > 0 && (
                <span className="text-white/60">{selectedGroups.length} group</span>
              )}
              {selectedForms.length > 0 && (
                <span className="text-white/60">{selectedForms.length} formulir</span>
              )}
              {(startDate || endDate) && (
                <span className="text-white/60">
                  {startDate && `Dari: ${startDate}`} {endDate && `Sampai: ${endDate}`}
                </span>
              )}
              <span className="text-white/30">|</span>
              <span>{availableVisuals.length} visual tersedia</span>
            </div>
          )}
        </div>

        {/* Visualization Selection */}
        <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="font-display text-sm font-semibold text-white">
                Pilih Visual Grafik
              </h3>
              <p className="text-xs text-white/30">
                {selectedGroups.length === 0 && selectedForms.length === 0 
                  ? 'Silakan pilih group atau formulir terlebih dahulu'
                  : `${availableVisuals.length} visual tersedia dari ${
                      viewMode === 'group' ? selectedGroups.length : selectedForms.length
                    } ${viewMode === 'group' ? 'group' : 'formulir'}`}
              </p>
            </div>
            {(selectedGroups.length > 0 || selectedForms.length > 0) && availableVisuals.length > 0 && (
              <button
                onClick={handleSelectAllVisuals}
                className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/50 hover:text-white/80 transition-all"
              >
                {selectedVisuals.length === availableVisuals.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {(selectedGroups.length === 0 && selectedForms.length === 0) ? (
            <div className="text-center py-8 text-white/30">
              <Icon name="barChart" className="w-12 h-12 mx-auto mb-3 text-white/10" />
              <p>Silakan pilih group atau formulir terlebih dahulu</p>
            </div>
          ) : availableVisuals.length === 0 ? (
            <div className="text-center py-8 text-white/30">
              <Icon name="alertCircle" className="w-12 h-12 mx-auto mb-3 text-white/10" />
              <p>Tidak ada visual yang tersedia untuk pilihan Anda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {availableVisuals.map((vis) => (
                <button
                  key={vis.id}
                  onClick={() => handleVisualToggle(vis.id)}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    selectedVisuals.includes(vis.id)
                      ? 'bg-cyan-500/10 border-cyan-500/30'
                      : 'bg-white/[0.02] border-white/[0.05] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/80 font-medium">{vis.name}</p>
                      <p className="text-xs text-white/30">{vis.type}</p>
                    </div>
                    {selectedVisuals.includes(vis.id) && (
                      <Icon name="checkCircle" className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Visualization Display */}
        <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-display text-sm font-semibold text-white">
              Tampilan Grafik
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30">
                {selectedVisualData.length} visual ditampilkan
              </span>
              <Button
                variant="primary"
                size="sm"
                icon={isExporting ? 'loader' : 'printer'}
                onClick={handleExportPDF}
                disabled={selectedVisualData.length === 0 || isExporting}
                className={isExporting ? 'opacity-70 cursor-not-allowed' : ''}
              >
                {isExporting ? 'Mengekspor...' : 'Cetak PDF'}
              </Button>
            </div>
          </div>

          {selectedVisualData.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <Icon name="eye" className="w-12 h-12 mx-auto mb-3 text-white/10" />
              <p className="text-sm">
                {(selectedGroups.length === 0 && selectedForms.length === 0)
                  ? 'Pilih group atau formulir untuk melihat visual'
                  : 'Pilih visual grafik untuk ditampilkan'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {selectedVisualData.map((vis) => (
                <div key={vis.id} className="chart-container">
                  {renderVisualization(vis)}
                </div>
              ))}
            </div>
          )}

          {/* Export Error */}
          {exportError && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
              <Icon name="alertCircle" className="w-4 h-4" />
              {exportError}
            </div>
          )}
        </div>
      </div>

      {/* Print Area */}
      <div id="print-area" className="hidden">
        <div className="print-header">
          <h1>Laporan dan Analisis</h1>
          <p>Periode: {startDate || 'Semua Waktu'} - {endDate || 'Semua Waktu'}</p>
          <p>
            Filter: {viewMode === 'group' ? 'Group' : 'Formulir'} — 
            {viewMode === 'group' 
              ? selectedGroups.join(', ') || 'Semua Group'
              : selectedForms.join(', ') || 'Semua Formulir'}
          </p>
          <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div>
          {selectedVisualData.map((vis) => (
            <div key={vis.id} className="chart-container">
              <h4>{vis.name} ({vis.type})</h4>
              {renderVisualization(vis)}
            </div>
          ))}
        </div>
        <p style={{ marginTop: 20, fontSize: 12, color: '#999' }}>
          Dicetak dari Sistem KKNT-KP UH - Desa Pangan Aman
        </p>
      </div>
    </div>
  )
}