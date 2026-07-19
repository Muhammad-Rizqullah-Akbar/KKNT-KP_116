'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import { Button } from '@/components/shared/Button'
import Link from 'next/link'

// ============ DATA DUMMY ============
const allFormsData = [
  { 
    id: 1,
    code: 'FRM-IRT-001', 
    title: 'Kuesioner Ibu Rumah Tangga', 
    group: 'Program KKN Tematik 2026',
    status: 'Aktif', 
    filled: 142,
    totalQuestions: 15,
    avgScore: 74.8,
    category: 'Kuesioner',
    createdAt: '2026-07-12',
    responses: [
      { date: '2026-07-01', count: 5, score: 72 },
      { date: '2026-07-02', count: 8, score: 70 },
      { date: '2026-07-03', count: 12, score: 75 },
      { date: '2026-07-04', count: 10, score: 78 },
      { date: '2026-07-05', count: 15, score: 73 },
      { date: '2026-07-06', count: 18, score: 76 },
      { date: '2026-07-07', count: 20, score: 74 },
      { date: '2026-07-08', count: 22, score: 79 },
      { date: '2026-07-09', count: 25, score: 82 },
      { date: '2026-07-10', count: 30, score: 80 },
      { date: '2026-07-11', count: 35, score: 85 },
      { date: '2026-07-12', count: 40, score: 88 },
    ],
    categories: {
      'Pengetahuan': { label: 'Pengetahuan', values: [85, 78, 92, 88, 95] },
      'Sikap': { label: 'Sikap', values: [72, 68, 75, 80, 82] },
      'Perilaku': { label: 'Perilaku', values: [65, 70, 72, 78, 85] },
    }
  },
  { 
    id: 2,
    code: 'FRM-FAS-001', 
    title: 'Formulir Fasilitasi Dapur', 
    group: 'Program KKN Tematik 2026',
    status: 'Aktif', 
    filled: 87,
    totalQuestions: 12,
    avgScore: 82.5,
    category: 'Fasilitasi',
    createdAt: '2026-07-10',
    responses: [
      { date: '2026-07-01', count: 3, score: 80 },
      { date: '2026-07-02', count: 5, score: 78 },
      { date: '2026-07-03', count: 8, score: 82 },
      { date: '2026-07-04', count: 10, score: 85 },
      { date: '2026-07-05', count: 12, score: 83 },
      { date: '2026-07-06', count: 15, score: 86 },
      { date: '2026-07-07', count: 18, score: 88 },
      { date: '2026-07-08', count: 20, score: 82 },
      { date: '2026-07-09', count: 22, score: 85 },
      { date: '2026-07-10', count: 25, score: 89 },
    ],
    categories: {
      'Kebersihan': { label: 'Kebersihan', values: [90, 85, 88, 92, 95] },
      'Organisasi': { label: 'Organisasi', values: [78, 80, 82, 85, 88] },
    }
  },
  { 
    id: 3,
    code: 'FRM-SKL-001', 
    title: 'Kuesioner Kader Sekolah', 
    group: 'Program KKN Tematik 2026',
    status: 'Draft', 
    filled: 0,
    totalQuestions: 10,
    avgScore: 0,
    category: 'Kuesioner',
    createdAt: '2026-07-08',
    responses: [],
    categories: {
      'Pengetahuan': { label: 'Pengetahuan', values: [0, 0, 0, 0, 0] },
      'Sikap': { label: 'Sikap', values: [0, 0, 0, 0, 0] },
    }
  },
  { 
    id: 4,
    code: 'FRM-OBS-001', 
    title: 'Observasi Sarana Dapur', 
    group: 'Workshop Series 2026',
    status: 'Aktif', 
    filled: 63,
    totalQuestions: 8,
    avgScore: 78.3,
    category: 'Observasi',
    createdAt: '2026-07-05',
    responses: [
      { date: '2026-07-01', count: 5, score: 72 },
      { date: '2026-07-02', count: 8, score: 75 },
      { date: '2026-07-03', count: 10, score: 78 },
      { date: '2026-07-04', count: 15, score: 80 },
      { date: '2026-07-05', count: 20, score: 82 },
    ],
    categories: {
      'Fasilitas': { label: 'Fasilitas', values: [75, 78, 80, 82, 85] },
      'Kebersihan': { label: 'Kebersihan', values: [70, 72, 75, 78, 80] },
    }
  },
  { 
    id: 5,
    code: 'FRM-STU-001', 
    title: 'Kuesioner Stunting', 
    group: '- (Mandiri)',
    status: 'Nonaktif', 
    filled: 55,
    totalQuestions: 14,
    avgScore: 62.0,
    category: 'Kuesioner',
    createdAt: '2026-07-01',
    responses: [
      { date: '2026-07-01', count: 10, score: 58 },
      { date: '2026-07-02', count: 15, score: 60 },
      { date: '2026-07-03', count: 20, score: 62 },
      { date: '2026-07-04', count: 25, score: 65 },
      { date: '2026-07-05', count: 30, score: 68 },
    ],
    categories: {
      'Pengetahuan': { label: 'Pengetahuan', values: [55, 58, 62, 65, 68] },
      'Perilaku': { label: 'Perilaku', values: [50, 52, 55, 58, 60] },
    }
  },
  { 
    id: 6,
    code: 'FRM-POS-001', 
    title: 'Evaluasi Posyandu', 
    group: 'Workshop Series 2026',
    status: 'Draft', 
    filled: 0,
    totalQuestions: 10,
    avgScore: 0,
    category: 'Evaluasi',
    createdAt: '2026-07-14',
    responses: [],
    categories: {
      'Pelayanan': { label: 'Pelayanan', values: [0, 0, 0, 0, 0] },
      'Kepuasan': { label: 'Kepuasan', values: [0, 0, 0, 0, 0] },
    }
  },
]

// Get unique groups
const getUniqueGroups = () => {
  const groups = new Set(allFormsData.map(f => f.group))
  return ['Semua Group', ...Array.from(groups)]
}

// Get unique status
const getUniqueStatus = () => {
  const statuses = new Set(allFormsData.map(f => f.status))
  return ['Semua Status', ...Array.from(statuses)]
}

type FormData = typeof allFormsData[0]

export default function OverviewPage() {
  // ============ STATE ============
  const [formsData, setFormsData] = useState(allFormsData)
  const [selectedForms, setSelectedForms] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState('Semua Status')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar')
  const [selectedChart, setSelectedChart] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [hoveredBar, setHoveredBar] = useState<{ label: string; value: number } | null>(null)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  const itemsPerPage = 10

  // ============ FILTERED DATA ============
  const filteredData = useMemo(() => {
    let data = formsData
    
    // Filter by groups
    if (selectedGroups.length > 0) {
      data = data.filter(f => selectedGroups.includes(f.group))
    }
    
    // Filter by forms
    if (selectedForms.length > 0) {
      data = data.filter(f => selectedForms.includes(f.title))
    }
    
    // Filter by status
    if (selectedStatus !== 'Semua Status') {
      data = data.filter(f => f.status === selectedStatus)
    }
    
    // Filter by date range
    if (startDate) {
      data = data.filter(f => f.createdAt >= startDate)
    }
    if (endDate) {
      data = data.filter(f => f.createdAt <= endDate)
    }
    
    return data
  }, [formsData, selectedGroups, selectedForms, selectedStatus, startDate, endDate])

  // ============ STATISTICS ============
  const stats = useMemo(() => {
    const totalForms = formsData.length
    const activeForms = formsData.filter(f => f.status === 'Aktif').length
    const totalRespondents = formsData.reduce((acc, f) => acc + f.filled, 0)
    const formsWithScores = formsData.filter(f => f.avgScore > 0)
    const avgScore = formsWithScores.length > 0 
      ? formsWithScores.reduce((acc, f) => acc + f.avgScore, 0) / formsWithScores.length 
      : 0
    const totalGroups = new Set(formsData.map(f => f.group).filter(g => g !== '- (Mandiri)')).size
    
    return { totalForms, activeForms, totalRespondents, avgScore, totalGroups }
  }, [formsData])

  // ============ CHART DATA ============
  const chartData = useMemo(() => {
    if (filteredData.length === 0) return null
    
    // Aggregate responses by date
    const dateMap: Record<string, { count: number; score: number; count_n: number }> = {}
    filteredData.forEach(form => {
      form.responses.forEach(r => {
        if (!dateMap[r.date]) {
          dateMap[r.date] = { count: 0, score: 0, count_n: 0 }
        }
        dateMap[r.date].count += r.count
        dateMap[r.date].score += r.score * r.count
        dateMap[r.date].count_n += r.count
      })
    })
    
    const sortedDates = Object.keys(dateMap).sort()
    const labels = sortedDates
    const counts = sortedDates.map(d => dateMap[d].count)
    const scores = sortedDates.map(d => Math.round(dateMap[d].score / dateMap[d].count_n))
    
    return { labels, counts, scores }
  }, [filteredData])

  // ============ PAGINATION ============
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredData.slice(start, end)
  }, [filteredData, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedGroups, selectedForms, selectedStatus, startDate, endDate])

  // ============ HANDLERS ============
  const handleGroupToggle = (group: string) => {
    if (group === 'Semua Group') {
      setSelectedGroups([])
      return
    }
    setSelectedGroups(prev => {
      if (prev.includes(group)) return prev.filter(g => g !== group)
      return [...prev, group]
    })
  }

  const handleFormToggle = (form: string) => {
    setSelectedForms(prev => {
      if (prev.includes(form)) return prev.filter(f => f !== form)
      return [...prev, form]
    })
  }

  const handleResetFilter = () => {
    setSelectedGroups([])
    setSelectedForms([])
    setSelectedStatus('Semua Status')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  const handleExport = async () => {
    if (!chartData) return
    
    setIsExporting(true)
    setExportError(null)
    
    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() < 0.05) {
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

  const handleChartTypeChange = (type: 'bar' | 'line' | 'pie') => {
    setChartType(type)
    setHasUnsavedChanges(true)
  }

  const handleLeave = () => {
    if (hasUnsavedChanges) {
      setShowLeaveConfirm(true)
    } else {
      // Navigate back
      window.history.back()
    }
  }

  // ============ RENDER CHART ============
  const renderChart = () => {
    if (!chartData || chartData.labels.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-white/30">
          <div className="text-center">
            <Icon name="barChart" className="w-12 h-12 mx-auto mb-3 text-white/10" />
            <p className="text-sm">Tidak ada data untuk ditampilkan</p>
            <p className="text-xs text-white/20 mt-1">Coba ubah filter atau tunggu data masuk</p>
          </div>
        </div>
      )
    }

    const maxValue = Math.max(...chartData.counts, ...chartData.scores)
    const colors = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6']

    if (chartType === 'pie') {
      // Pie chart for distribution
      const total = chartData.counts.reduce((a, b) => a + b, 0)
      let currentAngle = 0
      
      return (
        <div className="flex flex-col items-center">
          <div className="relative w-64 h-64">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {chartData.labels.map((label, i) => {
                const percentage = (chartData.counts[i] / total) * 100
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
                    className="transition-opacity hover:opacity-100 cursor-pointer"
                    onMouseEnter={() => setHoveredBar({ label, value: chartData.counts[i] })}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                )
              })}
            </svg>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            {chartData.labels.map((label, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded" style={{ background: colors[i % colors.length] }} />
                <span className="text-white/60">{label}</span>
                <span className="text-white/30">{Math.round((chartData.counts[i] / total) * 100)}%</span>
              </div>
            ))}
          </div>
          {hoveredBar && (
            <div className="mt-2 text-xs text-white/50">
              {hoveredBar.label}: {hoveredBar.value} responden
            </div>
          )}
        </div>
      )
    }

    // Bar / Line chart
    const isLine = chartType === 'line'
    const dataKey = isLine ? 'scores' : 'counts'
    const dataValues = isLine ? chartData.scores : chartData.counts
    const dataLabel = isLine ? 'Skor Rata-rata' : 'Jumlah Responden'
    const maxVal = Math.max(...dataValues, 1)

    return (
      <div className="relative">
        <div className="flex items-end gap-3 h-64">
          {chartData.labels.map((label, i) => {
            const height = (dataValues[i] / maxVal) * 100
            const isHovered = hoveredBar?.label === label
            
            if (isLine) {
              // Line chart - show points
              const x = (i / (chartData.labels.length - 1)) * 100
              const y = (1 - (dataValues[i] / maxVal)) * 90 + 5
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 relative">
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-full flex items-end"
                  >
                    <div 
                      className="w-full h-0.5 bg-cyan-500/30 absolute"
                      style={{ bottom: `${(dataValues[i] / maxVal) * 100}%` }}
                    />
                  </div>
                  <div 
                    className={`w-3 h-3 rounded-full ${isHovered ? 'bg-cyan-400 scale-150' : 'bg-cyan-400/70'} transition-all cursor-pointer`}
                    style={{ marginBottom: `${(dataValues[i] / maxVal) * 100}%` }}
                    onMouseEnter={() => setHoveredBar({ label, value: dataValues[i] })}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                  <span className="text-[10px] text-white/30 mt-1">{label}</span>
                  <span className="text-[10px] text-white/50">{dataValues[i]}</span>
                </div>
              )
            }
            
            // Bar chart
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className={`w-full max-w-[40px] rounded-t-lg transition-all cursor-pointer ${
                    isHovered ? 'opacity-100 scale-y-105' : 'opacity-80'
                  }`}
                  style={{ 
                    height: `${Math.max(height, 4)}%`,
                    background: `linear-gradient(to top, ${colors[i % colors.length]}, ${colors[(i + 1) % colors.length]})`
                  }}
                  onMouseEnter={() => setHoveredBar({ label, value: dataValues[i] })}
                  onMouseLeave={() => setHoveredBar(null)}
                />
                <span className="text-[10px] text-white/30">{label}</span>
                <span className="text-[10px] text-white/50">{dataValues[i]}</span>
              </div>
            )
          })}
        </div>
        {hoveredBar && (
          <div className="absolute top-0 right-0 text-xs text-white/50 bg-[#080812] px-3 py-1.5 rounded-lg border border-white/[0.05]">
            {hoveredBar.label}: {hoveredBar.value} {isLine ? 'poin' : 'responden'}
          </div>
        )}
        <div className="flex justify-between text-xs text-white/20 mt-2">
          <span>Sumbu X: Tanggal</span>
          <span>Sumbu Y: {dataLabel}</span>
        </div>
      </div>
    )
  }

  // ============ PRINT STYLES ============
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
        title="Dashboard" 
        subtitle="Ringkasan data dan visualisasi" 
      />

      <div className="flex-1 p-6 space-y-6">
        {/* ====== US-01: STATS CARDS ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 uppercase tracking-wider">Total Formulir</span>
              <Icon name="fileText" className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-3xl font-bold font-display">{stats.totalForms}</p>
            <p className="text-xs text-white/35 mt-1">{stats.activeForms} aktif</p>
          </div>
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 uppercase tracking-wider">Total Responden</span>
              <Icon name="users" className="w-4 h-4 text-violet-400" />
            </div>
            <p className="text-3xl font-bold font-display">{stats.totalRespondents}</p>
            <p className="text-xs text-white/35 mt-1">Dari {stats.totalForms} formulir</p>
          </div>
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 uppercase tracking-wider">Rata-rata Skor</span>
              <Icon name="barChart" className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-bold font-display">{stats.avgScore > 0 ? stats.avgScore.toFixed(1) : '—'}</p>
            <p className="text-xs text-white/35 mt-1">Dari semua responden</p>
          </div>
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 uppercase tracking-wider">Total Group</span>
              <Icon name="folder" className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold font-display">{stats.totalGroups}</p>
            <p className="text-xs text-white/35 mt-1">Group aktif</p>
          </div>
        </div>

        {/* ====== US-03: FILTER SECTION ====== */}
        <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
          <div className="flex flex-wrap items-start gap-6">
            {/* Filter Group */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                Filter Group
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleGroupToggle('Semua Group')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedGroups.length === 0
                      ? 'bg-violet-500/20 text-violet-400 border border-violet-500/20'
                      : 'bg-white/[0.03] text-white/50 hover:text-white/80 border border-white/[0.05]'
                  }`}
                >
                  Semua
                </button>
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
                    {group} ({formsData.filter(f => f.group === group).length})
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Form */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                Filter Formulir
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedForms([])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedForms.length === 0
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                      : 'bg-white/[0.03] text-white/50 hover:text-white/80 border border-white/[0.05]'
                  }`}
                >
                  Semua
                </button>
                {formsData.map((form) => (
                  <button
                    key={form.id}
                    onClick={() => handleFormToggle(form.title)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedForms.includes(form.title)
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                        : 'bg-white/[0.03] text-white/50 hover:text-white/80 border border-white/[0.05]'
                    }`}
                  >
                    {form.title} ({form.filled})
                  </button>
                ))}
              </div>
            </div>

            {/* Status + Date + Reset */}
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer"
                >
                  {getUniqueStatus().map((status) => (
                    <option key={status} value={status} className="bg-[#080812]">{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                  Dari
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
                  Sampai
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-cyan-400/40 transition-all"
                />
              </div>
              <button
                onClick={handleResetFilter}
                className="px-4 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/50 hover:text-white/80 hover:border-white/10 transition-all flex items-center gap-1"
              >
                <Icon name="refreshCw" className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>

          {/* Filter Indicator */}
          {(selectedGroups.length > 0 || selectedForms.length > 0 || selectedStatus !== 'Semua Status' || startDate || endDate) && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-xs text-cyan-400 flex-wrap">
              <Icon name="filter" className="w-3 h-3" />
              <span>Filter aktif:</span>
              {selectedGroups.length > 0 && (
                <span className="text-white/60">{selectedGroups.length} group</span>
              )}
              {selectedForms.length > 0 && (
                <span className="text-white/60">{selectedForms.length} formulir</span>
              )}
              {selectedStatus !== 'Semua Status' && (
                <span className="text-white/60">{selectedStatus}</span>
              )}
              {(startDate || endDate) && (
                <span className="text-white/60">
                  {startDate && `Dari: ${startDate}`} {endDate && `Sampai: ${endDate}`}
                </span>
              )}
              <span className="text-white/30">|</span>
              <span>{filteredData.length} formulir ditampilkan</span>
            </div>
          )}
        </div>

        {/* ====== US-02: CHART SECTION ====== */}
        <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
                <Icon name="barChart" className="w-5 h-5 text-cyan-400" />
                {filteredData.length > 0 ? 'Visualisasi Data' : 'Belum Ada Data'}
              </h3>
              <p className="text-xs text-white/30">
                {filteredData.length > 0 
                  ? `${filteredData.length} formulir • ${filteredData.reduce((acc, f) => acc + f.filled, 0)} responden`
                  : 'Coba ubah filter untuk melihat data'}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Chart Type Selector */}
              <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <button
                  onClick={() => handleChartTypeChange('bar')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    chartType === 'bar'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <Icon name="barChart" className="w-3.5 h-3.5 inline mr-1" /> Bar
                </button>
                <button
                  onClick={() => handleChartTypeChange('line')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    chartType === 'line'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <Icon name="trendingUp" className="w-3.5 h-3.5 inline mr-1" /> Line
                </button>
                <button
                  onClick={() => handleChartTypeChange('pie')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    chartType === 'pie'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <Icon name="pieChart" className="w-3.5 h-3.5 inline mr-1" /> Pie
                </button>
              </div>

              {/* US-04: Export Button */}
              <button
                onClick={handleExport}
                disabled={!chartData || isExporting}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  !chartData || isExporting
                    ? 'bg-white/[0.03] text-white/30 cursor-not-allowed border border-white/[0.05]'
                    : 'bg-white/[0.03] text-white/70 hover:text-white border border-white/[0.06] hover:border-white/10'
                }`}
              >
                <Icon name={isExporting ? 'loader' : 'printer'} className={`w-4 h-4 ${isExporting ? 'animate-spin' : ''}`} />
                {isExporting ? 'Mengekspor...' : 'Ekspor PDF'}
              </button>

              {/* US-05: Edit Widget Button */}
              <Link href="/dashboard/widgets">
                <button className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white transition-all shadow-lg shadow-violet-600/25 flex items-center gap-2">
                  <Icon name="settings" className="w-4 h-4" /> Kustomisasi
                </button>
              </Link>
            </div>
          </div>

          {/* Export Error */}
          {exportError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
              <Icon name="alertCircle" className="w-4 h-4" />
              {exportError}
            </div>
          )}

          {/* Chart */}
          <div className="min-h-[300px]">
            {renderChart()}
          </div>

          {/* Chart Legend */}
          {chartData && chartData.labels.length > 0 && chartType !== 'pie' && (
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-white/40 justify-center">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gradient-to-t from-cyan-500 to-violet-500" />
                {chartType === 'line' ? 'Skor Rata-rata' : 'Jumlah Responden'}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-white/[0.05]" />
                {filteredData.length} formulir
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500/20" />
                Total: {filteredData.reduce((acc, f) => acc + f.filled, 0)} responden
              </span>
            </div>
          )}
        </div>

        {/* ====== US-01: TABLE DAFTAR FORM ====== */}
        <div className="rounded-2xl bg-[#080812] border border-white/[0.05] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-white flex items-center gap-2">
              <Icon name="clipboardList" className="w-4 h-4 text-cyan-400" />
              Daftar Formulir
            </h3>
            <Link href="/dashboard/forms">
              <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
                Lihat Semua <Icon name="arrowRight" className="w-3 h-3" />
              </button>
            </Link>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                  <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Kode</th>
                  <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Judul</th>
                  <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Group</th>
                  <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Responden</th>
                  <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Skor</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-white/30">
                      <Icon name="fileText" className="w-8 h-8 mx-auto mb-2 text-white/10" />
                      <p>Tidak ada formulir yang ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((form) => (
                    <tr key={form.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-cyan-400 font-medium">{form.code}</td>
                      <td className="px-4 py-3 text-white/80 font-medium">{form.title}</td>
                      <td className="px-4 py-3">
                        {form.group === '- (Mandiri)' ? (
                          <span className="text-xs text-white/30">-</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] text-violet-400 flex items-center gap-1 w-fit">
                            <Icon name="folder" className="w-3 h-3" />
                            {form.group}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full border text-xs flex items-center gap-1.5 w-fit ${
                          form.status === 'Aktif' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                          form.status === 'Draft' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                          'text-rose-400 bg-rose-500/10 border-rose-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            form.status === 'Aktif' ? 'bg-emerald-400' :
                            form.status === 'Draft' ? 'bg-amber-400' :
                            'bg-rose-400'
                          }`} />
                          {form.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/60">{form.filled}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${
                          form.avgScore >= 75 ? 'text-emerald-400' :
                          form.avgScore >= 50 ? 'text-amber-400' :
                          'text-rose-400'
                        }`}>
                          {form.avgScore > 0 ? form.avgScore.toFixed(1) : '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredData.length > itemsPerPage && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.05]">
              <p className="text-xs text-white/35">
                Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-
                {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} formulir
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-white/40 hover:text-white hover:border-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Icon name="chevronLeft" className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                          : 'bg-white/[0.02] border border-white/[0.05] text-white/40 hover:text-white hover:border-white/10'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-white/20">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.05] text-xs text-white/40 hover:text-white hover:border-white/10 transition-all"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-white/40 hover:text-white hover:border-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Icon name="chevronRight" className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ====== US-05: LEAVE CONFIRMATION MODAL ====== */}
      {showLeaveConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setShowLeaveConfirm(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Icon name="alertCircle" className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">Perubahan Belum Disimpan</h3>
              <p className="text-sm text-white/50 mb-6">
                Anda memiliki perubahan pada kustomisasi widget yang belum disimpan. Apakah Anda yakin ingin meninggalkan halaman?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 hover:text-white transition-all"
                >
                  Lanjutkan Edit
                </button>
                <button
                  onClick={() => {
                    setShowLeaveConfirm(false)
                    setHasUnsavedChanges(false)
                    window.location.href = '/dashboard'
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-medium text-white transition-all"
                >
                  Keluar Tanpa Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== PRINT AREA ====== */}
      <div id="print-area" className="hidden">
        <div className="print-header">
          <h1>Laporan Dashboard - Ringkasan Data</h1>
          <p>Periode: {startDate || 'Semua Waktu'} - {endDate || 'Semua Waktu'}</p>
          <p>Filter: {selectedGroups.length > 0 ? `Group: ${selectedGroups.join(', ')}` : 'Semua Group'}</p>
          <p>Filter: {selectedForms.length > 0 ? `Formulir: ${selectedForms.join(', ')}` : 'Semua Formulir'}</p>
          <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          <p>Sumber Data: Sistem KKNT-KP UH - Desa Pangan Aman</p>
        </div>
        
        <div className="chart-container">
          <h4>Visualisasi Data</h4>
          <p>Jenis Grafik: {chartType === 'bar' ? 'Bar Chart' : chartType === 'line' ? 'Line Chart' : 'Pie Chart'}</p>
          {chartData && (
            <div style={{ marginTop: 10 }}>
              {chartData.labels.map((label, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                  <span>{label}</span>
                  <span>{chartData.counts[i]} responden</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chart-container">
          <h4>Ringkasan Statistik</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            <div><strong>Total Formulir:</strong> {stats.totalForms}</div>
            <div><strong>Formulir Aktif:</strong> {stats.activeForms}</div>
            <div><strong>Total Responden:</strong> {stats.totalRespondents}</div>
            <div><strong>Rata-rata Skor:</strong> {stats.avgScore > 0 ? stats.avgScore.toFixed(1) : '—'}</div>
            <div><strong>Total Group:</strong> {stats.totalGroups}</div>
            <div><strong>Filter Aktif:</strong> {filteredData.length} formulir</div>
          </div>
        </div>

        <p style={{ marginTop: 20, fontSize: 12, color: '#999' }}>
          Dicetak dari Sistem KKNT-KP UH - Desa Pangan Aman
        </p>
      </div>
    </div>
  )
}