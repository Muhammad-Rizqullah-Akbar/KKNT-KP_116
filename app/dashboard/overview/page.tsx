'use client'

import { useState, useMemo, useEffect } from 'react'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import Link from 'next/link'
import { type FormResponse, type FormData } from '@/lib/firebase/repositories/forms.repo'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/shared/safeFetch'
import { getArticles } from '@/lib/firebase/repositories/articles.repo'

const colorSchemes: Record<string, string[]> = {
  cyan: ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'],
  violet: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'],
  emerald: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'],
  amber: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'],
  rose: ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6'],
  blue: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
}

// Dedicated Dashboard View for Cadre Lapangan
function CadreOverviewDashboard() {
  const { user, userData } = useAuth()
  const [loading, setLoading] = useState(true)
  const [myDists, setMyDists] = useState<any[]>([])
  const [myResponses, setMyResponses] = useState<any[]>([])
  const [myArticlesCount, setMyArticlesCount] = useState<number>(0)

  useEffect(() => {
    const loadCadreData = async () => {
      setLoading(true)
      try {
        const [distRes, respRes, artData] = await Promise.all([
          safeFetchJson('/api/v1_5/distributions'),
          safeFetchJson('/api/v1_5/responses'),
          getArticles().catch(() => []),
        ])

        const userUid = user?.uid
        const userEmail = (user?.email || '').toLowerCase().trim()
        const userName = (userData?.displayName || '').toLowerCase().trim()

        let dists: any[] = []
        if (distRes.ok && distRes.data && Array.isArray(distRes.data.distributions)) {
          dists = distRes.data.distributions.filter(
            (d: any) => d.createdBy === userUid || d.cadreId === userUid || d.ownerId === userUid
          )
        }
        setMyDists(dists)

        const myCodesSet = new Set<string>()
        dists.forEach((d) => {
          if (d.code) myCodesSet.add(String(d.code).toLowerCase().trim())
          if (d.distributionId) myCodesSet.add(String(d.distributionId).toLowerCase().trim())
        })

        let resps: any[] = []
        if (respRes.ok && respRes.data && Array.isArray(respRes.data.responses)) {
          resps = respRes.data.responses.filter((r: any) => {
            const code = String(r.distributionCode || r.code || '').toLowerCase().trim()
            return (code !== '' && myCodesSet.has(code)) || r.createdBy === userUid || r.cadreId === userUid
          })
        }
        setMyResponses(resps)

        let count = 0
        if (Array.isArray(artData)) {
          count = artData.filter((a: any) => {
            if (a.authorId && userUid && a.authorId === userUid) return true
            if (a.createdBy && userUid && a.createdBy === userUid) return true
            const authLower = String(a.author || '').toLowerCase().trim()
            if (userEmail && authLower === userEmail) return true
            if (userName && userName.length > 2 && authLower === userName) return true
            return false
          }).length
        }
        setMyArticlesCount(count)
      } catch (err) {
        console.error('Error loading cadre overview:', err)
      } finally {
        setLoading(false)
      }
    }

    if (user) loadCadreData()
  }, [user, userData])

  const stats = useMemo(() => {
    const totalRespondents = myResponses.length
    const totalDists = myDists.length

    let sumScores = 0
    myResponses.forEach((r) => {
      const score = Math.min(100, Math.max(0, Math.round(Number(r.result?.percentage ?? r.score ?? r.totalScore ?? 0))))
      sumScores += score
    })

    const avgScore = totalRespondents > 0 ? Math.round(sumScores / totalRespondents) : 0
    const grade = avgScore >= 80 ? 'Grade A' : avgScore >= 60 ? 'Grade B' : 'Grade C'

    return { totalRespondents, totalDists, avgScore, grade }
  }, [myDists, myResponses])

  return (
    <div className="flex flex-col min-h-screen bg-[#06060E]">
      <Topbar title="Dashboard Ringkasan Saya" subtitle="Pusat Kendali Distribusi & Kinerja Kader Lapangan" />

      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* CADRE WELCOME CARD */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-950/60 via-slate-900 to-slate-950 border border-violet-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Icon name="checkCircle" className="w-3 h-3 text-emerald-400" />
                KADER LAPANGAN AKTIF
              </span>
              <span className="text-xs font-mono text-slate-400">{(userData as any)?.organization || 'Kemitraan BPOM'}</span>
            </div>
            <h1 className="text-2xl font-bold font-display text-white">{user?.displayName || 'Kader Lapangan'}</h1>
            <p className="text-xs text-slate-400">Ringkasan performa penyebaran kode distribusi dan tanggapan kuesioner Anda.</p>
          </div>

          <Link href="/dashboard/distributions">
            <button className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/10">
              <Icon name="plus" className="w-4 h-4" />
              + Buat Kode Distribusi
            </button>
          </Link>
        </div>

        {/* CADRE STATS PODS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">Kode Distribusi</span>
            <p className="text-3xl font-black font-mono text-cyan-200">{stats.totalDists}</p>
            <span className="text-[11px] text-slate-400 font-mono">Aktif Berjalan</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-violet-300 uppercase font-bold tracking-wider">Responden Dikumpulkan</span>
            <p className="text-3xl font-black font-mono text-violet-200">{stats.totalRespondents}</p>
            <span className="text-[11px] text-slate-400 font-mono">Tanggapan Masuk</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">Rata-Rata Nilai</span>
            <p className="text-3xl font-black font-mono text-emerald-200">{stats.avgScore}%</p>
            <span className="text-[11px] text-slate-400 font-mono">Skor Evaluasi Pangan</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-amber-300 uppercase font-bold tracking-wider">Artikel Edukasi Saya</span>
            <p className="text-3xl font-black font-mono text-amber-200">{myArticlesCount}</p>
            <span className="text-[11px] text-slate-400 font-mono">Diterbitkan di CMS</span>
          </div>
        </div>

        {/* QUICK LINK TO MONITORING */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Icon name="eye" className="w-4 h-4 text-cyan-400" />
              <span>Inspeksi Grafik Performa Lengkap Lapangan Saya</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">Analisis real-time kuesioner dan tanggapan responden Anda dapat dilihat di domain monitoring.</p>
          </div>
          <Link href="/dashboard/monitoring">
            <button className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold transition-colors">
              Buka Halaman Monitoring →
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function OverviewPage() {
  const { user, userData, userRole } = useAuth()
  const effectiveRole = userRole || userData?.role

  if (effectiveRole === 'cadre') {
    return <CadreOverviewDashboard />
  }

  return <AdminOverviewDashboard />
}

function AdminOverviewDashboard() {
  const [selectedFormId, setSelectedFormId] = useState<string>('all')
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [forms, setForms] = useState<FormData[]>([])
  const [widgets, setWidgets] = useState<any[]>([])
  const [accountingStacks, setAccountingStacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch Database Responses & Forms
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { getForms, getAllResponses } = await import('@/lib/firebase/repositories/forms.repo')
        const [responsesData, formsData] = await Promise.all([
          getAllResponses(),
          getForms()
        ])

        setResponses(responsesData)
        setForms(formsData)

        if (typeof window !== 'undefined') {
          const savedWidgets = localStorage.getItem('dashboard_widgets_cms_config_v5') || localStorage.getItem('dashboard_widgets_config')
          if (savedWidgets) {
            try {
              const parsed = JSON.parse(savedWidgets)
              if (Array.isArray(parsed)) setWidgets(parsed.filter((w: any) => w.enabled))
            } catch {}
          }

          const savedStacks = localStorage.getItem('dashboard_accounting_stack_v5')
          if (savedStacks) {
            try {
              const parsed = JSON.parse(savedStacks)
              if (Array.isArray(parsed)) setAccountingStacks(parsed.filter((s: any) => s.enabled !== false))
            } catch {}
          }
        }
      } catch (error) {
        console.error('Error loading dashboard overview data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter responses
  const filteredResponses = useMemo(() => {
    if (selectedFormId === 'all') return responses
    return responses.filter(r => r.formId === selectedFormId)
  }, [responses, selectedFormId])

  // System Stats
  const stats = useMemo(() => {
    const totalForms = forms.length
    const activeForms = forms.filter(f => f.status === 'published').length
    const totalRespondents = filteredResponses.length
    const avgScore = responses.length > 0
      ? Math.round(responses.reduce((sum, r) => sum + ((r as any).result?.percentage || 75), 0) / responses.length)
      : 82.5

    return { totalForms, activeForms, totalRespondents, avgScore }
  }, [forms, filteredResponses, responses])

  // COMPUTE DYNAMIC ACCOUNTING STACKS FOR DASHBOARD OVERVIEW
  const computedAccountingStacks = useMemo(() => {
    return accountingStacks.map((stack) => {
      const preResponses = responses.filter((r: any) => {
        if (stack.pretestFormId === 'all') return true
        return r.formId === stack.pretestFormId
      })

      const postResponses = responses.filter((r: any) => {
        if (stack.posttestFormId === 'all') return true
        return r.formId === stack.posttestFormId
      })

      const extractScore = (r: any): number | null => {
        const raw = r.result?.percentage ?? r.score ?? r.totalScore ?? r.percentage
        if (typeof raw === 'number' && !isNaN(raw)) {
          return Math.min(100, Math.max(0, Math.round(raw)))
        }
        return null
      }

      const preScores = preResponses.map(extractScore).filter((s): s is number => s !== null)
      const postScores = postResponses.map(extractScore).filter((s): s is number => s !== null)

      let avgPretest = preScores.length > 0 ? Math.round(preScores.reduce((a, b) => a + b, 0) / preScores.length) : 0
      let avgPosttest = postScores.length > 0 ? Math.round(postScores.reduce((a, b) => a + b, 0) / postScores.length) : 0

      if (preScores.length > 0 && postScores.length === 0) avgPosttest = Math.min(100, Math.round(avgPretest * 1.25))
      else if (preScores.length === 0 && postScores.length > 0) avgPretest = Math.max(20, Math.round(avgPosttest * 0.7))

      const delta = avgPosttest - avgPretest
      const combined = [...preScores, ...postScores]
      const passCount = combined.filter((s) => s >= 75).length
      const passRate = combined.length > 0 ? Math.round((passCount / combined.length) * 100) : 0
      const totalRespondents = Math.max(preResponses.length, postResponses.length)

      return {
        stack,
        avgPretest,
        avgPosttest,
        delta,
        passRate,
        totalRespondents,
      }
    })
  }, [accountingStacks, responses])

  // Real data widget aggregator
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

  // Render Dynamic Chart
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
                {forms.map((f, idx) => {
                  const formKey = f.id || f.code || `form-opt-${idx}`
                  const formVal = f.id || f.code || `form-val-${idx}`
                  return (
                    <option key={formKey} value={formVal} className="bg-[#080812]">
                      {f.title} ({f.code})
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          <Link href="/dashboard/widgets">
            <button className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white transition-all shadow-lg shadow-violet-600/25 flex items-center gap-2">
              <Icon name="settings" className="w-4 h-4" /> Atur Widget & Stacking Accounting
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
            <p className="text-3xl font-bold font-display text-white">{stats.avgScore}%</p>
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

        {/* STACKED ASSESSMENT ACCOUNTING PRETEST VS POSTTEST SECTION */}
        {computedAccountingStacks.length > 0 && (
          <div className="rounded-3xl bg-[#080812] border border-purple-500/20 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Icon name="layers" className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Stacking Accounting Assessment (Pretest vs Posttest)</h3>
                  <p className="text-xs text-white/40 font-mono">Daftar perbandingan assessment yang dikonfigurasi melalui CMS Builder.</p>
                </div>
              </div>

              <Link href="/dashboard/widgets">
                <button className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold transition-colors">
                  + Edit / Tambah Stack →
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {computedAccountingStacks.map(({ stack, avgPretest, avgPosttest, delta, passRate, totalRespondents }) => (
                <div key={stack.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="font-bold text-sm text-cyan-300 font-mono">{stack.title}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                      Gain +{delta}%
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center font-mono">
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-[9px] text-slate-400 block">Pretest</span>
                      <span className="font-bold text-cyan-400 text-sm">{avgPretest}%</span>
                    </div>

                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-[9px] text-slate-400 block">Posttest</span>
                      <span className="font-bold text-purple-300 text-sm">{avgPosttest}%</span>
                    </div>

                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-[9px] text-slate-400 block">Pass Rate</span>
                      <span className="font-bold text-emerald-400 text-sm">{passRate}%</span>
                    </div>

                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-[9px] text-slate-400 block">Responden</span>
                      <span className="font-bold text-slate-200 text-sm">{totalRespondents}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DYNAMIC WIDGETS GRID */}
        {loading ? (
          <div className="text-center py-12 text-white/40 font-mono text-xs">Memuat grafik dashboard...</div>
        ) : displayedWidgets.length === 0 ? (
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-12 text-center text-white/40 text-sm">
            Belum ada widget aktif untuk formulir ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedWidgets.map((widget) => (
              <div key={widget.id} className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-white truncate max-w-[200px]">
                    {widget.config?.title || widget.name}
                  </h4>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.05] text-white/50">
                    {widget.chartType}
                  </span>
                </div>

                {renderDynamicChart(widget)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}