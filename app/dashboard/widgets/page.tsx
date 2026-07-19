'use client'

import { useState, useMemo } from 'react'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import { Button } from '@/components/shared/Button'

// Data dummy untuk jenis data di database
const dataTypes = [
  { id: 'dt1', name: 'Pengetahuan Bahaya Biologi', type: 'kategorikal', count: 142, description: 'Jawaban benar/salah tentang bahaya biologi' },
  { id: 'dt2', name: 'Distribusi Pengetahuan Label', type: 'kategorikal', count: 142, description: 'Distribusi pemahaman label pangan' },
  { id: 'dt3', name: 'Skor Keamanan Pangan', type: 'numerik', count: 142, description: 'Rata-rata skor keamanan pangan' },
  { id: 'dt4', name: 'Sikap terhadap Pedagang', type: 'kategorikal', count: 142, description: 'Sikap responden terhadap pedagang' },
  { id: 'dt5', name: 'Distribusi Umur Responden', type: 'numerik', count: 142, description: 'Sebaran usia responden' },
  { id: 'dt6', name: 'Praktik Cuci Tangan', type: 'kategorikal', count: 87, description: 'Data praktik cuci tangan' },
  { id: 'dt7', name: 'Skor Fasilitasi Dapur', type: 'numerik', count: 87, description: 'Rata-rata skor fasilitasi dapur' },
  { id: 'dt8', name: 'Pengetahuan Gizi', type: 'kategorikal', count: 63, description: 'Tingkat pengetahuan gizi' },
  { id: 'dt9', name: 'Tren Pengisian Form', type: 'tren', count: 347, description: 'Tren pengisian form per bulan' },
]

// Widget configuration
const defaultWidgets = [
  { id: 'w1', name: 'Pengetahuan Bahaya Biologi', dataType: 'dt1', chartType: 'bar', enabled: true, position: 0, config: { title: 'Pengetahuan Bahaya Biologi', xLabel: 'Jawaban', yLabel: 'Jumlah', colorScheme: 'cyan', showLegend: true } },
  { id: 'w2', name: 'Distribusi Pengetahuan Label', dataType: 'dt2', chartType: 'pie', enabled: true, position: 1, config: { title: 'Distribusi Pengetahuan Label', xLabel: '', yLabel: '', colorScheme: 'violet', showLegend: true } },
  { id: 'w3', name: 'Rata-rata Skor Keamanan', dataType: 'dt3', chartType: 'number', enabled: true, position: 2, config: { title: 'Rata-rata Skor Keamanan', xLabel: '', yLabel: '', colorScheme: 'emerald', showLegend: false } },
  { id: 'w4', name: 'Sikap terhadap Pedagang', dataType: 'dt4', chartType: 'matrix', enabled: true, position: 3, config: { title: 'Sikap terhadap Pedagang', xLabel: '', yLabel: '', colorScheme: 'amber', showLegend: true } },
  { id: 'w5', name: 'Distribusi Umur Responden', dataType: 'dt5', chartType: 'bar', enabled: false, position: 4, config: { title: 'Distribusi Umur Responden', xLabel: 'Kelompok Umur', yLabel: 'Jumlah', colorScheme: 'rose', showLegend: true } },
  { id: 'w6', name: 'Praktik Cuci Tangan', dataType: 'dt6', chartType: 'pie', enabled: false, position: 5, config: { title: 'Praktik Cuci Tangan', xLabel: '', yLabel: '', colorScheme: 'emerald', showLegend: true } },
  { id: 'w7', name: 'Skor Fasilitasi Dapur', dataType: 'dt7', chartType: 'number', enabled: false, position: 6, config: { title: 'Skor Fasilitasi Dapur', xLabel: '', yLabel: '', colorScheme: 'cyan', showLegend: false } },
  { id: 'w8', name: 'Pengetahuan Gizi', dataType: 'dt8', chartType: 'bar', enabled: false, position: 7, config: { title: 'Pengetahuan Gizi', xLabel: 'Kategori', yLabel: 'Jumlah', colorScheme: 'violet', showLegend: true } },
  { id: 'w9', name: 'Tren Pengisian Form', dataType: 'dt9', chartType: 'line', enabled: false, position: 8, config: { title: 'Tren Pengisian Form', xLabel: 'Bulan', yLabel: 'Jumlah Pengisian', colorScheme: 'cyan', showLegend: true } },
]

// Chart type options
const chartTypes = [
  { id: 'bar', name: 'Bar Chart', icon: 'barChart' },
  { id: 'pie', name: 'Pie Chart', icon: 'pieChart' },
  { id: 'line', name: 'Line Chart', icon: 'trendingUp' },
  { id: 'number', name: 'Number (Skor)', icon: 'hash' },
  { id: 'matrix', name: 'Matrix', icon: 'table' },
  { id: 'radar', name: 'Radar Chart', icon: 'radar' },
]

const colorSchemes = [
  { id: 'cyan', colors: ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'] },
  { id: 'violet', colors: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'] },
  { id: 'emerald', colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'] },
  { id: 'amber', colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'] },
  { id: 'rose', colors: ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6'] },
  { id: 'blue', colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'] },
]

// Dummy data for charts
const chartData = {
  'dt1': { labels: ['Benar', 'Salah'], values: [92, 50] },
  'dt2': { labels: ['Benar', 'Ragu', 'Salah'], values: [82, 24, 36] },
  'dt3': { value: 74.8, max: 100 },
  'dt4': { labels: ['Setuju', 'Netral', 'Tidak Setuju'], values: [102, 21, 19] },
  'dt5': { labels: ['18-25', '26-35', '36-45', '46-55', '55+'], values: [25, 45, 38, 22, 12] },
  'dt6': { labels: ['Benar', 'Kurang'], values: [68, 19] },
  'dt7': { value: 82.5, max: 100 },
  'dt8': { labels: ['Baik', 'Cukup', 'Kurang'], values: [28, 16, 19] },
  'dt9': { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'], values: [20, 25, 30, 35, 32, 38, 42] },
}

// Data type to recommended chart mapping
const recommendedCharts = {
  'kategorikal': ['bar', 'pie'],
  'numerik': ['number', 'bar'],
  'tren': ['line', 'bar'],
}

// Get data type info
const getDataTypeInfo = (id: string) => dataTypes.find(d => d.id === id)

// Get widget data
const getWidgetData = (dataTypeId: string) => chartData[dataTypeId as keyof typeof chartData] || { labels: [], values: [] }

export default function WidgetsPage() {
  const [widgets, setWidgets] = useState(defaultWidgets)
  const [selectedWidget, setSelectedWidget] = useState<typeof defaultWidgets[0] | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [editorConfig, setEditorConfig] = useState<any>(null)

  // Sort widgets by position
  const sortedWidgets = useMemo(() => {
    return [...widgets].sort((a, b) => a.position - b.position)
  }, [widgets])

  // Get enabled widgets
  const enabledWidgets = useMemo(() => {
    return sortedWidgets.filter(w => w.enabled)
  }, [sortedWidgets])

  // Stats
  const stats = useMemo(() => {
    const totalTypes = dataTypes.length
    const totalRecords = dataTypes.reduce((acc, d) => acc + d.count, 0)
    const categoricalCount = dataTypes.filter(d => d.type === 'kategorikal').length
    const numericalCount = dataTypes.filter(d => d.type === 'numerik').length
    const trendCount = dataTypes.filter(d => d.type === 'tren').length
    const enabledCount = widgets.filter(w => w.enabled).length
    const totalWidgets = widgets.length

    return {
      totalTypes,
      totalRecords,
      categoricalCount,
      numericalCount,
      trendCount,
      enabledCount,
      totalWidgets,
    }
  }, [widgets])

  // Handle widget toggle
  const handleWidgetToggle = (id: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, enabled: !w.enabled } : w
    ))
  }

  // Handle widget position change (drag and drop)
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    setIsDragging(false)
    setDragOverIndex(null)

    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'))
    if (sourceIndex === targetIndex) return

    const newWidgets = [...widgets]
    const [movedWidget] = newWidgets.splice(sourceIndex, 1)
    newWidgets.splice(targetIndex, 0, movedWidget)
    
    // Update positions
    newWidgets.forEach((w, i) => w.position = i)
    setWidgets(newWidgets)
  }

  // Handle edit widget
  const handleEditWidget = (widget: typeof defaultWidgets[0]) => {
    setSelectedWidget(widget)
    setEditorConfig({ ...widget.config })
    setIsEditorOpen(true)
  }

  // Handle save editor
  const handleSaveEditor = () => {
    if (selectedWidget && editorConfig) {
      setWidgets(prev => prev.map(w => 
        w.id === selectedWidget.id 
          ? { ...w, chartType: editorConfig.chartType || w.chartType, config: editorConfig }
          : w
      ))
      setIsEditorOpen(false)
      setSelectedWidget(null)
      setEditorConfig(null)
      setShowSaveSuccess(true)
      setTimeout(() => setShowSaveSuccess(false), 3000)
    }
  }

  // Handle reset to default
  const handleResetDefault = () => {
    setShowResetConfirm(true)
  }

  const confirmReset = () => {
    setWidgets(defaultWidgets)
    setShowResetConfirm(false)
    setShowSaveSuccess(true)
    setTimeout(() => setShowSaveSuccess(false), 3000)
  }

  // Render chart based on type
  const renderChart = (widget: typeof defaultWidgets[0], size: 'small' | 'large' = 'small') => {
    const data = getWidgetData(widget.dataType)
    const colors = colorSchemes.find(c => c.id === widget.config.colorScheme)?.colors || colorSchemes[0].colors
    const isSmall = size === 'small'

    switch (widget.chartType) {
      case 'bar':
        if (!data.labels) return null
        const maxVal = Math.max(...(data.values || [0]))
        return (
          <div className={`flex items-end gap-2 ${isSmall ? 'h-20' : 'h-48'}`}>
            {data.labels.map((label: string, i: number) => {
              const height = maxVal > 0 ? (data.values[i] / maxVal) * 100 : 0
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full max-w-[30px] rounded-t transition-all"
                    style={{ 
                      height: `${Math.max(height * (isSmall ? 0.6 : 1), 5)}%`,
                      background: colors[i % colors.length]
                    }}
                  />
                  {!isSmall && <span className="text-[10px] text-white/40 truncate w-full text-center">{label}</span>}
                  {!isSmall && <span className="text-[10px] text-white/60">{data.values[i]}</span>}
                </div>
              )
            })}
          </div>
        )

      case 'pie':
        if (!data.labels) return null
        const total = data.values.reduce((a: number, b: number) => a + b, 0)
        let currentAngle = 0
        return (
          <div className={`flex items-center gap-3 ${isSmall ? 'h-20' : 'h-48'}`}>
            <div className={`relative ${isSmall ? 'w-16 h-16' : 'w-28 h-28'} flex-shrink-0`}>
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {data.labels.map((_: string, i: number) => {
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
            {!isSmall && (
              <div className="space-y-0.5 flex-1">
                {data.labels.map((label: string, i: number) => {
                  const percentage = total > 0 ? Math.round((data.values[i] / total) * 100) : 0
                  return (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded" style={{ background: colors[i % colors.length] }} />
                      <span className="text-white/60">{label}</span>
                      <span className="text-white/30">{percentage}%</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )

      case 'number':
        return (
          <div className="text-center">
            <span className={`font-bold ${isSmall ? 'text-xl' : 'text-4xl'} text-cyan-400`}>
              {data.value || 0}
            </span>
            <span className="text-white/30 text-sm ml-1">/ {data.max || 100}</span>
            {!isSmall && (
              <div className="w-full h-1.5 bg-white/[0.05] rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all"
                  style={{ width: `${((data.value || 0) / (data.max || 100)) * 100}%` }}
                />
              </div>
            )}
          </div>
        )

      case 'matrix':
        if (!data.labels) return null
        const matrixTotal = data.values.reduce((a: number, b: number) => a + b, 0)
        return (
          <div className={`space-y-1 ${isSmall ? 'h-16' : 'h-48'}`}>
            {data.labels.map((label: string, i: number) => {
              const percentage = matrixTotal > 0 ? Math.round((data.values[i] / matrixTotal) * 100) : 0
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className={`text-[10px] text-white/60 ${isSmall ? 'w-12 truncate' : 'w-20'}`}>{label}</span>
                  <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${percentage}%`,
                        background: colors[i % colors.length]
                      }}
                    />
                  </div>
                  {!isSmall && <span className="text-xs text-white/40 w-8 text-right">{data.values[i]}</span>}
                </div>
              )
            })}
          </div>
        )

      case 'line':
        if (!data.labels) return null
        const lineMax = Math.max(...(data.values || [0]))
        return (
          <div className={`relative ${isSmall ? 'h-16' : 'h-40'}`}>
            <svg width="100%" height="100%" viewBox={`0 0 ${isSmall ? 100 : 200} ${isSmall ? 60 : 140}`} preserveAspectRatio="none">
              <polyline
                points={data.labels.map((_: string, i: number) => {
                  const x = (i / (data.labels.length - 1)) * (isSmall ? 100 : 200)
                  const y = (1 - (data.values[i] / lineMax)) * (isSmall ? 50 : 120) + 10
                  return `${x},${y}`
                }).join(' ')}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
              />
              {!isSmall && data.labels.map((label: string, i: number) => {
                const x = (i / (data.labels.length - 1)) * 200
                const y = (1 - (data.values[i] / lineMax)) * 120 + 10
                return (
                  <circle key={i} cx={x} cy={y} r="3" fill="#06b6d4" />
                )
              })}
            </svg>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar 
        title="Manajemen Widget Grafik" 
        subtitle="Kelola widget grafik visualisasi data" 
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Save Success Notification */}
        {showSaveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 animate-slideUp">
            <Icon name="checkCircle" className="w-5 h-5 text-emerald-400" />
            <p className="text-sm text-white">Pengaturan widget berhasil disimpan!</p>
          </div>
        )}

        {/* Data Type Summary - US-01 */}
        <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
          <h3 className="font-display text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Icon name="database" className="w-4 h-4 text-cyan-400" />
            Ringkasan Jenis Data
          </h3>
          
          {dataTypes.length === 0 ? (
            <div className="text-center py-8 text-white/30">
              <Icon name="alertCircle" className="w-12 h-12 mx-auto mb-3 text-white/10" />
              <p>Belum ada data tersedia</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
                  <p className="text-2xl font-bold font-display text-cyan-400">{stats.totalTypes}</p>
                  <p className="text-xs text-white/40">Jenis Data</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
                  <p className="text-2xl font-bold font-display text-emerald-400">{stats.totalRecords.toLocaleString()}</p>
                  <p className="text-xs text-white/40">Total Record</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
                  <p className="text-2xl font-bold font-display text-violet-400">{stats.categoricalCount}</p>
                  <p className="text-xs text-white/40">Kategorikal</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
                  <p className="text-2xl font-bold font-display text-amber-400">{stats.numericalCount}</p>
                  <p className="text-xs text-white/40">Numerik</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
                  <p className="text-2xl font-bold font-display text-rose-400">{stats.trendCount}</p>
                  <p className="text-xs text-white/40">Tren</p>
                </div>
              </div>

              {/* Data Type List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {dataTypes.map((dt) => (
                  <div key={dt.id} className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.05] flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/80 font-medium">{dt.name}</p>
                      <p className="text-xs text-white/30">{dt.count} record • {dt.type}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      dt.type === 'kategorikal' ? 'bg-violet-500/20 text-violet-400' :
                      dt.type === 'numerik' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {dt.type}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Widget Management - US-02 & US-03 */}
        <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="font-display text-sm font-semibold text-white flex items-center gap-2">
                <Icon name="layoutDashboard" className="w-4 h-4 text-cyan-400" />
                Pengaturan Widget Dashboard
              </h3>
              <p className="text-xs text-white/30">
                {enabledWidgets.length} dari {stats.totalWidgets} widget aktif
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon="refreshCw"
                onClick={handleResetDefault}
              >
                Reset ke Default
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon="save"
                onClick={() => {
                  setShowSaveSuccess(true)
                  setTimeout(() => setShowSaveSuccess(false), 3000)
                }}
              >
                Simpan Pengaturan
              </Button>
            </div>
          </div>

          {/* Widget List - Drag and Drop */}
          <div className="space-y-2">
            {sortedWidgets.map((widget, index) => {
              const dataType = getDataTypeInfo(widget.dataType)
              const recommended = dataType ? recommendedCharts[dataType.type as keyof typeof recommendedCharts] || [] : []
              const isRecommended = recommended.includes(widget.chartType)
              
              return (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`p-3 rounded-xl border transition-all ${
                    dragOverIndex === index ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-white/[0.05]'
                  } ${widget.enabled ? 'bg-white/[0.02]' : 'bg-white/[0.01] opacity-60'}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Drag Handle */}
                    <div className="cursor-grab text-white/20 hover:text-white/40 transition-colors">
                      <Icon name="gripVertical" className="w-4 h-4" />
                    </div>

                    {/* Toggle */}
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={widget.enabled}
                        onChange={() => handleWidgetToggle(widget.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/[0.08] rounded-full peer peer-checked:bg-cyan-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                    </label>

                    {/* Widget Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-white/80 font-medium">{widget.name}</p>
                        {isRecommended && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                            Rekomendasi
                          </span>
                        )}
                        {dataType && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            dataType.type === 'kategorikal' ? 'bg-violet-500/20 text-violet-400' :
                            dataType.type === 'numerik' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {dataType.type}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/30">
                        {widget.chartType} • {widget.config.colorScheme}
                      </p>
                    </div>

                    {/* Preview Chart */}
                    <div className="w-32 h-12 flex-shrink-0">
                      {renderChart(widget, 'small')}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditWidget(widget)}
                        className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
                        title="Edit Widget"
                      >
                        <Icon name="pencil" className="w-4 h-4 text-white/40 hover:text-cyan-400 transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {sortedWidgets.length === 0 && (
            <div className="text-center py-8 text-white/30">
              <Icon name="alertCircle" className="w-12 h-12 mx-auto mb-3 text-white/10" />
              <p>Belum ada widget yang dikonfigurasi</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal - US-04 */}
      {isEditorOpen && selectedWidget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          onClick={() => {
            // Check if there are unsaved changes
            const hasChanges = JSON.stringify(editorConfig) !== JSON.stringify(selectedWidget.config)
            if (hasChanges && !confirm('Perubahan belum disimpan. Yakin ingin keluar?')) return
            setIsEditorOpen(false)
            setSelectedWidget(null)
            setEditorConfig(null)
          }}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div>
                <h3 className="font-display text-lg font-semibold text-white">Edit Visualisasi</h3>
                <p className="text-xs text-white/30">{selectedWidget.name}</p>
              </div>
              <button
                onClick={() => {
                  const hasChanges = JSON.stringify(editorConfig) !== JSON.stringify(selectedWidget.config)
                  if (hasChanges && !confirm('Perubahan belum disimpan. Yakin ingin keluar?')) return
                  setIsEditorOpen(false)
                  setSelectedWidget(null)
                  setEditorConfig(null)
                }}
                className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center transition-colors"
              >
                <Icon name="x" className="w-5 h-5 text-white/50" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Settings */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 uppercase tracking-wider">Judul Grafik</label>
                    <input
                      type="text"
                      value={editorConfig?.title || ''}
                      onChange={(e) => setEditorConfig({ ...editorConfig, title: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 uppercase tracking-wider">Jenis Diagram</label>
                    <div className="grid grid-cols-3 gap-2">
                      {chartTypes.map((ct) => (
                        <button
                          key={ct.id}
                          onClick={() => setEditorConfig({ ...editorConfig, chartType: ct.id })}
                          className={`p-2 rounded-xl border transition-all text-center ${
                            editorConfig?.chartType === ct.id
                              ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                              : 'border-white/[0.05] bg-white/[0.02] text-white/40 hover:text-white/70'
                          }`}
                        >
                          <Icon name={ct.icon as any} className="w-4 h-4 mx-auto mb-1" />
                          <span className="text-[10px]">{ct.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-white/50 uppercase tracking-wider">Label Sumbu X</label>
                      <input
                        type="text"
                        value={editorConfig?.xLabel || ''}
                        onChange={(e) => setEditorConfig({ ...editorConfig, xLabel: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                        placeholder="Label X"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-white/50 uppercase tracking-wider">Label Sumbu Y</label>
                      <input
                        type="text"
                        value={editorConfig?.yLabel || ''}
                        onChange={(e) => setEditorConfig({ ...editorConfig, yLabel: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                        placeholder="Label Y"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-white/50 uppercase tracking-wider">Skema Warna</label>
                      <div className="flex gap-2">
                        {colorSchemes.map((cs) => (
                          <button
                            key={cs.id}
                            onClick={() => setEditorConfig({ ...editorConfig, colorScheme: cs.id })}
                            className={`w-8 h-8 rounded-lg border-2 transition-all ${
                              editorConfig?.colorScheme === cs.id
                                ? 'border-cyan-400'
                                : 'border-transparent hover:border-white/20'
                            }`}
                            style={{ background: cs.colors[0] }}
                            title={cs.id}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5 flex items-end">
                      <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editorConfig?.showLegend !== false}
                          onChange={(e) => setEditorConfig({ ...editorConfig, showLegend: e.target.checked })}
                          className="accent-cyan-400"
                        />
                        Tampilkan Legenda
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right: Preview */}
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider block mb-3">Pratinjau</label>
                  <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] min-h-[300px] flex items-center justify-center">
                    {selectedWidget && (
                      <div className="w-full">
                        <h4 className="text-sm font-medium text-white/80 text-center mb-4">
                          {editorConfig?.title || selectedWidget.name}
                        </h4>
                        {renderChart({ ...selectedWidget, chartType: editorConfig?.chartType || selectedWidget.chartType, config: editorConfig || selectedWidget.config }, 'large')}
                        {(editorConfig?.xLabel || editorConfig?.yLabel) && (
                          <div className="flex justify-between text-xs text-white/30 mt-4">
                            <span>{editorConfig?.xLabel || ''}</span>
                            <span>{editorConfig?.yLabel || ''}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button
                onClick={() => {
                  const hasChanges = JSON.stringify(editorConfig) !== JSON.stringify(selectedWidget.config)
                  if (hasChanges && !confirm('Perubahan belum disimpan. Yakin ingin keluar?')) return
                  setIsEditorOpen(false)
                  setSelectedWidget(null)
                  setEditorConfig(null)
                }}
                className="px-5 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.03] transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditor}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25 flex items-center gap-2"
              >
                <Icon name="save" className="w-4 h-4" /> Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Icon name="alertCircle" className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">Reset ke Default</h3>
              <p className="text-sm text-white/50 mb-6">
                Apakah Anda yakin ingin mengembalikan semua widget ke pengaturan awal? Semua perubahan yang belum disimpan akan hilang.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 hover:text-white transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={confirmReset}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-sm font-medium text-white transition-all"
                >
                  Ya, Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}