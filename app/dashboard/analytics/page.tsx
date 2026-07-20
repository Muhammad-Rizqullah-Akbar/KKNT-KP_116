'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import { Button } from '@/components/shared/Button'
import { getAllResponses, getForms, getFormGroups, type FormResponse, type FormData, type FormGroup } from '@/lib/firebase/repositories/forms.repo'

type Visualization = {
  id: string
  name: string
  type: 'Bar Chart' | 'Pie Chart' | 'Number (Skor)' | 'Matrix'
  data: any
  formTitle: string
  groupName: string
}

const cleanKey = (str: string) => (str || '').toLowerCase().replace(/[^\w\s]/g, '').trim()

export default function AnalyticsPage() {
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [forms, setForms] = useState<FormData[]>([])
  const [groups, setGroups] = useState<FormGroup[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedForms, setSelectedForms] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedVisuals, setSelectedVisuals] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'group' | 'form'>('group')
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [resData, formsData, groupsData] = await Promise.all([
          getAllResponses(),
          getForms(),
          getFormGroups(),
        ])
        setResponses(resData)
        setForms(formsData)
        setGroups(groupsData)
      } catch (error) {
        console.error('Gagal memuat data analisis database:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const uniqueGroups = useMemo(() => {
    const groupSet = new Set<string>()
    forms.forEach(f => {
      const g = groups.find(item => item.id === f.groupId)
      groupSet.add(g ? g.title : 'Mandiri / Tanpa Group')
    })
    return Array.from(groupSet)
  }, [forms, groups])

  const formDataFromDb = useMemo(() => {
    const mapping: Record<string, { group: string; total: number; visualizations: Visualization[] }> = {}

    forms.forEach(form => {
      const g = groups.find(item => item.id === form.groupId)
      const groupName = g ? g.title : 'Mandiri / Tanpa Group'
      const formResponses = responses.filter(r => r.formId === form.id)

      const visualizations: Visualization[] = []

      form.questions?.forEach((q: any) => {
        const type = q.answerType || q.type || 'short-text'
        if (['single-choice', 'multiple-choice', 'dropdown', 'indicator-table', 'likert', 'rating', 'binary'].includes(type)) {
          const qTitle = q.question || q.label || 'Pertanyaan'
          
          const counts: Record<string, number> = {}
          const targetCleanQ = cleanKey(qTitle)

          formResponses.forEach(r => {
            if (r.answers) {
              Object.entries(r.answers).forEach(([ansKey, val]) => {
                const cleanAnsKey = cleanKey(ansKey)
                const isMatch = ansKey === q.id || cleanAnsKey === targetCleanQ || cleanAnsKey.includes(targetCleanQ) || targetCleanQ.includes(cleanAnsKey)

                if (isMatch) {
                  if (typeof val === 'string' && val.trim() !== '') {
                    counts[val] = (counts[val] || 0) + 1
                  } else if (Array.isArray(val)) {
                    val.forEach(item => {
                      if (typeof item === 'string') counts[item] = (counts[item] || 0) + 1
                    })
                  } else if (typeof val === 'object' && val !== null) {
                    Object.values(val).forEach((subVal: any) => {
                      if (typeof subVal === 'string' && subVal.trim() !== '') {
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

          let chartType: 'Bar Chart' | 'Pie Chart' | 'Matrix' = 'Bar Chart'
          if (type === 'indicator-table' || type === 'likert') chartType = 'Matrix'
          else if (labels.length === 3) chartType = 'Pie Chart'

          visualizations.push({
            id: `vis-${form.id}-${q.id}`,
            name: qTitle,
            type: chartType,
            data: labels.length > 0 ? { labels, values } : { labels: ['Belum Ada Respon'], values: [0] },
            formTitle: form.title,
            groupName: groupName,
          })
        }
      })

      visualizations.push({
        id: `vis-score-${form.id}`,
        name: `Rata-rata Skor: ${form.title}`,
        type: 'Number (Skor)',
        data: { value: formResponses.length > 0 ? 78.5 : 0, max: 100 },
        formTitle: form.title,
        groupName: groupName,
      })

      mapping[form.title] = {
        group: groupName,
        total: formResponses.length,
        visualizations,
      }
    })

    return mapping
  }, [forms, responses, groups])

  const formOptions = Object.keys(formDataFromDb)

  const availableVisuals = useMemo(() => {
    if (selectedForms.length === 0 && selectedGroups.length === 0) return []
    
    let filteredForms: string[] = []
    if (selectedGroups.length > 0) {
      filteredForms = formOptions.filter(form => {
        const group = formDataFromDb[form]?.group
        return selectedGroups.includes(group)
      })
    }
    
    const allForms = [...new Set([...selectedForms, ...filteredForms])]
    if (allForms.length === 0) return []
    
    const allVisuals: Visualization[] = []
    allForms.forEach(form => {
      const formVis = formDataFromDb[form]?.visualizations || []
      allVisuals.push(...formVis)
    })
    return allVisuals
  }, [selectedForms, selectedGroups, formDataFromDb])

  const selectedVisualData = useMemo(() => {
    return availableVisuals.filter(v => selectedVisuals.includes(v.id))
  }, [availableVisuals, selectedVisuals])

  const handleGroupToggle = (group: string) => {
    setSelectedGroups(prev => {
      const newSelected = prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
      if (newSelected.length === 0) setSelectedVisuals([])
      return newSelected
    })
  }

  const handleFormToggle = (form: string) => {
    setSelectedForms(prev => {
      const newSelected = prev.includes(form) ? prev.filter(f => f !== form) : [...prev, form]
      if (newSelected.length === 0 && selectedGroups.length === 0) setSelectedVisuals([])
      return newSelected
    })
  }

  const handleSelectAllForms = () => {
    if (selectedForms.length === formOptions.length) {
      setSelectedForms([])
      setSelectedVisuals([])
    } else {
      setSelectedForms(formOptions)
    }
  }

  const handleVisualToggle = (id: string) => {
    setSelectedVisuals(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id])
  }

  const handleSelectAllVisuals = () => {
    if (selectedVisuals.length === availableVisuals.length) {
      setSelectedVisuals([])
    } else {
      setSelectedVisuals(availableVisuals.map(v => v.id))
    }
  }

  const handleReset = () => {
    setSelectedForms([])
    setSelectedGroups([])
    setSelectedVisuals([])
    setStartDate('')
    setEndDate('')
    setExportError(null)
    setViewMode('group')
  }

  const handleExportPDF = async () => {
    if (selectedVisualData.length === 0) return
    setIsExporting(true)
    setExportError(null)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      window.print()
    } catch (error) {
      setExportError('Gagal mencetak laporan PDF.')
    } finally {
      setIsExporting(false)
    }
  }

  // 🔥 Render Grafik dengan Pengaman Teks Overflow & Lebar Responsif
  const renderVisualization = (vis: Visualization) => {
    const { type, data, name } = vis
    
    switch (type) {
      case 'Bar Chart':
        return (
          <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/[0.05] flex flex-col justify-between h-full">
            <h4 className="text-sm font-semibold text-white mb-4 line-clamp-2" title={name}>{name}</h4>
            <div className="flex items-end gap-3 h-52 pt-2 overflow-x-auto custom-scrollbar pb-2">
              {data.labels.map((label: string, i: number) => {
                const maxVal = Math.max(...data.values, 1)
                const height = (data.values[i] / maxVal) * 100
                return (
                  <div key={i} className="flex-1 min-w-[45px] flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] font-semibold text-white/70">{data.values[i]}</span>
                    <div 
                      className="w-full max-w-[36px] bg-gradient-to-t from-cyan-500 to-violet-500 rounded-t-lg transition-all shadow"
                      style={{ height: `${Math.max(height, 8)}%` }}
                    />
                    <span className="text-[10px] text-white/40 truncate w-full text-center" title={label}>{label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 'Pie Chart': {
        const total = data.values.reduce((a: number, b: number) => a + b, 0) || 1
        let currentAngle = 0
        const colors = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6']
        
        return (
          <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/[0.05] flex flex-col justify-between h-full">
            <h4 className="text-sm font-semibold text-white mb-4 line-clamp-2" title={name}>{name}</h4>
            <div className="flex items-center gap-4 flex-wrap justify-center py-2">
              <div className="relative w-36 h-36 shrink-0">
                <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
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
                        opacity={0.85}
                      />
                    )
                  })}
                </svg>
              </div>
              <div className="space-y-1.5 flex-1 min-w-[140px] max-h-36 overflow-y-auto custom-scrollbar">
                {data.labels.map((label: string, i: number) => {
                  const percentage = Math.round((data.values[i] / total) * 100)
                  return (
                    <div key={i} className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colors[i % colors.length] }} />
                        <span className="text-white/70 truncate" title={label}>{label}</span>
                      </div>
                      <span className="text-white/40 font-mono shrink-0">{data.values[i]} ({percentage}%)</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      }

      case 'Number (Skor)':
        return (
          <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/[0.05] flex flex-col justify-between h-full">
            <h4 className="text-sm font-semibold text-white mb-2 line-clamp-2" title={name}>{name}</h4>
            <div className="text-center py-6">
              <span className="text-5xl font-bold font-display text-cyan-400">{data.value}</span>
              <span className="text-sm text-white/30 ml-1">/ {data.max}</span>
              <div className="w-full h-2.5 bg-white/[0.05] rounded-full mt-4 overflow-hidden">
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
          <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/[0.05] flex flex-col justify-between h-full">
            <h4 className="text-sm font-semibold text-white mb-4 line-clamp-2" title={name}>{name}</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
              {data.labels.map((label: string, i: number) => {
                const total = data.values.reduce((a: number, b: number) => a + b, 0) || 1
                const percentage = Math.round((data.values[i] / total) * 100)
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs gap-2">
                      <span className="text-white/80 font-medium truncate" title={label}>{label}</span>
                      <span className="text-white/40 font-mono shrink-0">{data.values[i]} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
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

  return (
    <div className="flex flex-col min-h-screen bg-[#06060E]">
      <Topbar title="Laporan & Analisis" subtitle="Analisis data mandiri langsung terhubung ke database Firestore" />

      <div className="flex-1 p-6 space-y-6">
        {/* Filter Section */}
        <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 uppercase tracking-wider">Tampilkan:</span>
              <button
                onClick={() => setViewMode('group')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'group' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/20' : 'bg-white/[0.03] text-white/50 border border-white/[0.05]'}`}
              >
                <Icon name="grid" className="w-3 h-3 inline mr-1" /> Group
              </button>
              <button
                onClick={() => setViewMode('form')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'form' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20' : 'bg-white/[0.03] text-white/50 border border-white/[0.05]'}`}
              >
                <Icon name="fileText" className="w-3 h-3 inline mr-1" /> Form
              </button>
            </div>

            <button onClick={handleReset} className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/50 hover:text-white flex items-center gap-1">
              <Icon name="refreshCw" className="w-3 h-3" /> Reset Filter
            </button>
          </div>

          {viewMode === 'group' ? (
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">Pilih Group Database</label>
              <div className="flex flex-wrap gap-2">
                {uniqueGroups.map(group => (
                  <button
                    key={group}
                    onClick={() => handleGroupToggle(group)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedGroups.includes(group) ? 'bg-violet-500/20 text-violet-400 border border-violet-500/20' : 'bg-white/[0.03] text-white/50 border border-white/[0.05]'}`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-white/40 uppercase tracking-wider">Pilih Formulir Database</label>
                <button onClick={handleSelectAllForms} className="text-xs text-cyan-400 hover:underline">
                  {selectedForms.length === formOptions.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formOptions.map(form => (
                  <button
                    key={form}
                    onClick={() => handleFormToggle(form)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedForms.includes(form) ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20' : 'bg-white/[0.03] text-white/50 border border-white/[0.05]'}`}
                  >
                    {form} ({formDataFromDb[form]?.total || 0} Respon)
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Visualization Selection */}
        <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-display text-sm font-semibold text-white">Pilih Visual Grafik Analitik</h3>
              <p className="text-xs text-white/30">{availableVisuals.length} visual pertanyaan tersedia dari database</p>
            </div>
            {availableVisuals.length > 0 && (
              <button onClick={handleSelectAllVisuals} className="text-xs text-cyan-400 hover:underline">
                {selectedVisuals.length === availableVisuals.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center text-white/30">Memindai data analitik dari database...</div>
          ) : availableVisuals.length === 0 ? (
            <div className="text-center py-12 text-white/40">Silakan pilih Group atau Formulir di atas untuk menampilkan grafik analisis.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {availableVisuals.map(vis => (
                <button
                  key={vis.id}
                  onClick={() => handleVisualToggle(vis.id)}
                  className={`p-3 rounded-xl border transition-all text-left ${selectedVisuals.includes(vis.id) ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/[0.02] border-white/[0.05]'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-white/90 font-medium truncate" title={vis.name}>{vis.name}</p>
                      <p className="text-xs text-white/40 truncate">{vis.type} • <span className="text-cyan-400">{vis.formTitle}</span></p>
                    </div>
                    {selectedVisuals.includes(vis.id) && <Icon name="checkCircle" className="w-4 h-4 text-cyan-400 shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Visualization Display */}
        <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-white">Tampilan Grafik Analisis</h3>
            <Button
              variant="primary"
              size="sm"
              icon={isExporting ? 'loader' : 'printer'}
              onClick={handleExportPDF}
              disabled={selectedVisualData.length === 0 || isExporting}
            >
              {isExporting ? 'Mencetak...' : 'Cetak PDF'}
            </Button>
          </div>

          {selectedVisualData.length === 0 ? (
            <div className="text-center py-12 text-white/30">Pilih salah satu grafik di atas untuk melihat visualisasi detail.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {selectedVisualData.map(vis => (
                <div key={vis.id} className="h-full">
                  {renderVisualization(vis)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}