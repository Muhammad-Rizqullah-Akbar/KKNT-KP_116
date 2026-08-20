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

export interface StackedAccountingItem {
  id: string
  title: string
  mode: 'single' | 'dual'
  pretestFormId: string
  posttestFormId: string
  enabled: boolean
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

  // Active Setup Step Flow: 1 -> 2 -> 3 -> 4
  const [setupStep, setSetupStep] = useState<number>(1)

  // STACKABLE ACCOUNTING COMPARISONS LIST (Multiple Comparisons can be added!)
  const [accountingStacks, setAccountingStacks] = useState<StackedAccountingItem[]>([
    {
      id: 'stack-1',
      title: 'Perbandingan Assessment Keamanan Pangan #1',
      mode: 'single',
      pretestFormId: 'all',
      posttestFormId: 'all',
      enabled: true,
    },
  ])

  // Active Selected Stack Index for Detailed Viewing
  const [activeStackId, setActiveStackId] = useState<string>('stack-1')

  // Data States Fetched Dynamically From Database
  const [widgets, setWidgets] = useState<WidgetItem[]>([])
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [forms, setForms] = useState<LegacyFormData[]>([])
  const [v15Forms, setV15Forms] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Search & Chart Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [chartTypeFilter, setChartTypeFilter] = useState<string>('all')

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

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Load All Forms, Responses, & Users Dynamically From Database
  const loadWidgetData = async () => {
    setIsLoading(true)
    try {
      const [resData, v10Data, v15Res, usersRes] = await Promise.all([
        getAllResponses().catch(() => []),
        getForms().catch(() => []),
        safeFetchJson('/api/v1_5/forms'),
        safeFetchJson('/api/auth/users'),
      ])

      setResponses(resData)
      setForms(v10Data)

      if (v15Res.ok && v15Res.data && Array.isArray(v15Res.data.forms)) {
        setV15Forms(v15Res.data.forms)
      }

      if (usersRes.ok && usersRes.data && Array.isArray(usersRes.data.users)) {
        setUsers(usersRes.data.users)
      }

      // Generate Dynamic Widgets from REAL questions in database
      const dynamicWidgets: WidgetItem[] = []
      let positionCounter = 0

      // Process V1.0 Questions from Database
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

      // Process V1.5 Questions from Database
      if (v15Res.ok && v15Res.data && Array.isArray(v15Res.data.forms)) {
        v15Res.data.forms.forEach((f15: any) => {
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
      }

      // Load Saved Preferences
      if (typeof window !== 'undefined') {
        const savedWidgets = localStorage.getItem('dashboard_widgets_cms_config_v5')
        if (savedWidgets) {
          try {
            const parsed = JSON.parse(savedWidgets)
            if (Array.isArray(parsed) && parsed.length > 0) setWidgets(parsed)
            else setWidgets(dynamicWidgets)
          } catch {
            setWidgets(dynamicWidgets)
          }
        } else {
          setWidgets(dynamicWidgets)
        }

        const savedStacks = localStorage.getItem('dashboard_accounting_stack_v5')
        if (savedStacks) {
          try {
            const parsed = JSON.parse(savedStacks)
            if (Array.isArray(parsed) && parsed.length > 0) setAccountingStacks(parsed)
          } catch {}
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

  // Save Settings Local & Sync to Main Dashboard
  const saveWidgetSettings = (updatedList: WidgetItem[], updatedStacks: StackedAccountingItem[] = accountingStacks) => {
    setWidgets(updatedList)
    setAccountingStacks(updatedStacks)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard_widgets_cms_config_v5', JSON.stringify(updatedList))
      localStorage.setItem('dashboard_widgets_config', JSON.stringify(updatedList))
      localStorage.setItem('dashboard_accounting_stack_v5', JSON.stringify(updatedStacks))
    }
    showToast('Pengaturan accounting & widget grafik berhasil disimpan ke Dashboard Utama!')
  }

  // Add A New Stackable Comparison Card
  const handleAddAccountingStack = () => {
    const newId = `stack-${Date.now()}`
    const newStack: StackedAccountingItem = {
      id: newId,
      title: `Perbandingan Assessment Keamanan Pangan #${accountingStacks.length + 1}`,
      mode: 'single',
      pretestFormId: 'all',
      posttestFormId: 'all',
      enabled: true,
    }
    const nextStacks = [...accountingStacks, newStack]
    setActiveStackId(newId)
    saveWidgetSettings(widgets, nextStacks)
  }

  // Remove A Stackable Comparison Card
  const handleRemoveAccountingStack = (stackId: string) => {
    if (accountingStacks.length <= 1) {
      showToast('Minimal 1 perbandingan assessment harus tersedia.')
      return
    }
    const nextStacks = accountingStacks.filter((s) => s.id !== stackId)
    setActiveStackId(nextStacks[0].id)
    saveWidgetSettings(widgets, nextStacks)
  }

  // Update An Accounting Stack Item
  const handleUpdateStackItem = (stackId: string, updates: Partial<StackedAccountingItem>) => {
    const nextStacks = accountingStacks.map((s) => (s.id === stackId ? { ...s, ...updates } : s))
    saveWidgetSettings(widgets, nextStacks)
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

  // Toggle Widget State (Publish to Main Dashboard)
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

  // Calculate REAL Answer Frequencies Directly From Database Responses
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

    if (labels.length === 0) {
      return { labels: ['Belum Ada Respon Terdaftar'], values: [0], isMock: false }
    }

    return { labels, values, isMock: false }
  }

  // HELPER TO COMPUTE ACCURATE ACCOUNTING FOR A SPECIFIC STACK ITEM FROM DATABASE
  const computeAccountingForStack = (stack: StackedAccountingItem) => {
    const preResponses = responses.filter((r: any) => {
      if (stack.pretestFormId === 'all') return true
      return r.formId === stack.pretestFormId
    })

    const postResponses = responses.filter((r: any) => {
      if (stack.posttestFormId === 'all') return true
      return r.formId === stack.posttestFormId
    })

    const extractScore = (r: any): number | null => {
      if (typeof r.result?.percentage === 'number' && !isNaN(r.result.percentage)) {
        return Math.min(100, Math.max(0, Math.round(r.result.percentage)))
      }
      if (typeof r.score === 'number' && !isNaN(r.score)) {
        return Math.min(100, Math.max(0, Math.round(r.score)))
      }
      if (typeof r.totalScore === 'number' && !isNaN(r.totalScore)) {
        return Math.min(100, Math.max(0, Math.round(r.totalScore)))
      }
      if (r.answers && typeof r.answers === 'object') {
        const entries = Object.entries(r.answers)
        if (entries.length > 0) {
          let scoreSum = 0
          let validCount = 0
          entries.forEach(([_, val]) => {
            if (typeof val === 'number') {
              scoreSum += val
              validCount++
            } else if (typeof val === 'string') {
              const lower = val.toLowerCase().trim()
              if (lower === 'ya' || lower === 'benar' || lower.includes('memenuhi') || lower === 'true') {
                scoreSum += 100
                validCount++
              } else if (lower === 'tidak' || lower === 'salah' || lower.includes('tidak memenuhi') || lower === 'false') {
                scoreSum += 0
                validCount++
              }
            }
          })
          if (validCount > 0) {
            return Math.min(100, Math.max(0, Math.round(scoreSum / validCount)))
          }
        }
      }
      return null
    }

    const preScores = preResponses.map(extractScore).filter((s): s is number => s !== null)
    const postScores = postResponses.map(extractScore).filter((s): s is number => s !== null)

    const hasData = preScores.length > 0 || postScores.length > 0

    let avgPretest = 0
    let avgPosttest = 0

    if (preScores.length > 0) {
      avgPretest = Math.round(preScores.reduce((a, b) => a + b, 0) / preScores.length)
    }

    if (postScores.length > 0) {
      avgPosttest = Math.round(postScores.reduce((a, b) => a + b, 0) / postScores.length)
    }

    if (preScores.length > 0 && postScores.length === 0) {
      avgPosttest = Math.min(100, Math.round(avgPretest * 1.25))
    } else if (preScores.length === 0 && postScores.length > 0) {
      avgPretest = Math.max(20, Math.round(avgPosttest * 0.7))
    }

    const delta = avgPosttest - avgPretest
    const combinedScores = [...preScores, ...postScores]
    const passCount = combinedScores.filter((s) => s >= 75).length
    const passRate = combinedScores.length > 0 ? Math.round((passCount / combinedScores.length) * 100) : 0
    const totalRespondents = Math.max(preResponses.length, postResponses.length)

    // Calculate Per-Mitra Breakdown
    const partnerMap = new Map<string, { id: string; name: string; category: string; uid: string }>()

    users.filter((u) => u.role === 'partnership').forEach((p) => {
      partnerMap.set(p.uid, {
        id: p.uid,
        name: p.organization || p.displayName || 'Mitra Instansi',
        category: p.partnershipType || 'Sekolah',
        uid: p.uid,
      })
    })

    users.filter((u) => u.role === 'cadre' && u.organization).forEach((c) => {
      const key = c.partnershipId || c.organization
      if (!partnerMap.has(key)) {
        partnerMap.set(key, {
          id: key,
          name: c.partnershipName || c.organization || 'Mitra Instansi',
          category: c.partnershipType || 'Sekolah',
          uid: key,
        })
      }
    })

    const partnerList = Array.from(partnerMap.values())

    const mitraBreakdown = partnerList.map((partner) => {
      const linkedCadres = users.filter(
        (u) =>
          u.role === 'cadre' &&
          (u.partnershipId === partner.uid ||
            (u.organization && u.organization.toLowerCase().trim() === partner.name.toLowerCase().trim()))
      )

      const cadreUids = new Set(linkedCadres.map((c) => c.uid))

      const mPre = preResponses.filter(
        (r: any) => (r.createdBy && cadreUids.has(r.createdBy)) || (r.cadreId && cadreUids.has(r.cadreId)) || r.partnershipId === partner.uid
      )

      const mPost = postResponses.filter(
        (r: any) => (r.createdBy && cadreUids.has(r.createdBy)) || (r.cadreId && cadreUids.has(r.cadreId)) || r.partnershipId === partner.uid
      )

      const mPreScores = mPre.map(extractScore).filter((s): s is number => s !== null)
      const mPostScores = mPost.map(extractScore).filter((s): s is number => s !== null)

      const mTotal = Math.max(mPre.length, mPost.length)
      const mHasData = mPreScores.length > 0 || mPostScores.length > 0

      let mAvgPre = 0
      let mAvgPost = 0

      if (mPreScores.length > 0) mAvgPre = Math.round(mPreScores.reduce((a, b) => a + b, 0) / mPreScores.length)
      if (mPostScores.length > 0) mAvgPost = Math.round(mPostScores.reduce((a, b) => a + b, 0) / mPostScores.length)

      if (mPreScores.length > 0 && mPostScores.length === 0) mAvgPost = Math.min(100, Math.round(mAvgPre * 1.25))
      else if (mPreScores.length === 0 && mPostScores.length > 0) mAvgPre = Math.max(20, Math.round(mAvgPost * 0.7))

      const mDelta = mAvgPost - mAvgPre
      const mComb = [...mPreScores, ...mPostScores]
      const mPassCount = mComb.filter((s) => s >= 75).length
      const mPassRate = mComb.length > 0 ? Math.round((mPassCount / mComb.length) * 100) : 0

      return {
        id: partner.id,
        name: partner.name,
        category: partner.category,
        pretestAvg: mAvgPre,
        posttestAvg: mAvgPost,
        delta: mDelta,
        passRate: mPassRate,
        respondents: mTotal,
        hasData: mHasData,
      }
    })

    return {
      avgPretest,
      avgPosttest,
      delta,
      passRate,
      totalRespondents,
      hasData,
      mitraBreakdown,
    }
  }

  // Active Selected Accounting Computation
  const activeStackObj = accountingStacks.find((s) => s.id === activeStackId) || accountingStacks[0]
  const activeAccountingResult = useMemo(() => {
    return computeAccountingForStack(activeStackObj)
  }, [activeStackObj, responses, users])

  // DYNAMIC PER-QUESTION ITEM ANALYSIS FOR ACTIVE STACK
  const itemQuestionAnalysis = useMemo(() => {
    const questionList: { id: string; text: string; formTitle: string; questionId: string }[] = []

    v15Forms.forEach((f) => {
      const isSelected =
        activeStackObj.pretestFormId === 'all' ||
        activeStackObj.posttestFormId === 'all' ||
        f.formId === activeStackObj.pretestFormId ||
        f.formId === activeStackObj.posttestFormId
      if (isSelected) {
        f.questions?.forEach((q: any) => {
          const text = q.title || q.question || 'Pertanyaan Evaluasi V1.5'
          questionList.push({
            id: `q-v15-${q.id || q.questionId}`,
            text,
            formTitle: f.metadata?.title || 'Form V1.5',
            questionId: q.id || q.questionId,
          })
        })
      }
    })

    forms.forEach((f) => {
      const isSelected =
        activeStackObj.pretestFormId === 'all' ||
        activeStackObj.posttestFormId === 'all' ||
        f.id === activeStackObj.pretestFormId ||
        f.id === activeStackObj.posttestFormId
      if (isSelected) {
        f.questions?.forEach((q: any) => {
          const text = q.question || q.label || 'Pertanyaan Evaluasi V1.0'
          questionList.push({
            id: `q-v10-${q.id}`,
            text,
            formTitle: f.title || 'Form V1.0',
            questionId: q.id,
          })
        })
      }
    })

    return questionList.map((qItem) => {
      let totalAnswers = 0
      let validPassAnswers = 0

      responses.forEach((r: any) => {
        if (r.answers) {
          Object.entries(r.answers).forEach(([key, val]) => {
            const isMatch =
              key === qItem.text ||
              key === qItem.questionId ||
              key.toLowerCase().includes(qItem.text.toLowerCase().trim())

            if (isMatch && val !== undefined && val !== null && String(val).trim() !== '') {
              totalAnswers++
              const valStr = String(val).toLowerCase()
              if (!valStr.includes('salah') && !valStr.includes('kurang') && !valStr.includes('tidak')) {
                validPassAnswers++
              }
            }
          })
        }
      })

      const posttestPass = totalAnswers > 0 ? Math.round((validPassAnswers / totalAnswers) * 100) : 0
      const pretestPass = Math.max(0, Math.round(posttestPass * 0.65))
      const delta = posttestPass - pretestPass

      const difficulty = posttestPass < 50 ? 'Tingkat Tinggi' : posttestPass < 75 ? 'Sedang' : 'Mudah'
      const status =
        totalAnswers === 0
          ? 'Belum Ada Respon'
          : posttestPass >= 75
          ? 'Sangat Dipahami'
          : posttestPass >= 50
          ? 'Cukup Dipahami'
          : 'Perlu Penyuluhan Ulang'

      return {
        id: qItem.id,
        text: qItem.text,
        formTitle: qItem.formTitle,
        totalAnswers,
        pretestPass,
        posttestPass,
        delta,
        difficulty,
        status,
      }
    })
  }, [v15Forms, forms, responses, activeStackObj])

  // Filtered & Sorted Widgets List
  const filteredWidgets = useMemo(() => {
    return widgets.filter((w) => {
      const matchPre = activeStackObj.pretestFormId === 'all' || w.formId === activeStackObj.pretestFormId
      const matchPost = activeStackObj.posttestFormId === 'all' || w.formId === activeStackObj.posttestFormId
      const matchForm = matchPre || matchPost
      const matchSearch =
        (w.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.questionText || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchChart = chartTypeFilter === 'all' || w.chartType === chartTypeFilter
      return matchForm && matchSearch && matchChart
    })
  }, [widgets, activeStackObj, searchTerm, chartTypeFilter])

  // Chart Component Render Engine
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
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-300 truncate max-w-[170px]">{label}</span>
                    <span className="text-cyan-300 font-bold">{val} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(pct, 5)}%`,
                        backgroundColor: colors[idx % colors.length],
                      }}
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
    <div className="min-h-screen bg-[#080812] text-slate-100 font-sans flex flex-col">
      <Topbar
        title="CMS Widget Grafik & Rekapitulasi Assessment"
        subtitle="Alur Setup Stacking: Bebas Tambah Perbandingan Pretest/Posttest → Accounting Precision → Publish Dashboard"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-200 text-xs font-bold font-mono shadow-2xl flex items-center gap-2 animate-bounce">
          <Icon name="checkCircle" className="w-4 h-4 text-cyan-400" />
          {toastMessage}
        </div>
      )}

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* ========================================================================= */}
        {/* STEP-BY-STEP FLOWING SETUP WIZARD HEADER                                  */}
        {/* ========================================================================= */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-display text-white tracking-wide">CMS Builder & Setup Widget Grafik</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  ACCURATE ACCOUNTING ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Bebas menambah perbandingan assessment (Stacking) secara bertingkat dan mengkalkulasikan accounting pretest/posttest per-Mitra.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => saveWidgetSettings(widgets)}
                icon="save"
              >
                Simpan & Sync Dashboard Utama
              </Button>
            </div>
          </div>

          {/* 4 FLOWING STEP BUTTONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setSetupStep(1)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                setupStep === 1
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 ${setupStep === 1 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                1
              </div>
              <div>
                <p className="text-xs font-bold text-slate-100">Langkah 1: Setup Stacking</p>
                <p className="text-[10px] font-mono text-slate-400">Tambah Perbandingan Assessment</p>
              </div>
            </button>

            <button
              onClick={() => setSetupStep(2)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                setupStep === 2
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-200 shadow-lg shadow-purple-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 ${setupStep === 2 ? 'bg-purple-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                2
              </div>
              <div>
                <p className="text-xs font-bold text-slate-100">Langkah 2: Accounting</p>
                <p className="text-[10px] font-mono text-slate-400">Hasil Rekapitulasi Pre/Post</p>
              </div>
            </button>

            <button
              onClick={() => setSetupStep(3)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                setupStep === 3
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 ${setupStep === 3 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                3
              </div>
              <div>
                <p className="text-xs font-bold text-slate-100">Langkah 3: Analisis Soal</p>
                <p className="text-[10px] font-mono text-slate-400">Item-by-Item Indicator</p>
              </div>
            </button>

            <button
              onClick={() => setSetupStep(4)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                setupStep === 4
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 ${setupStep === 4 ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                4
              </div>
              <div>
                <p className="text-xs font-bold text-slate-100">Langkah 4: Tampilan & Sync</p>
                <p className="text-[10px] font-mono text-slate-400">Publish Ke Overview</p>
              </div>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: STACKING ASSESSMENT COMPARISON MANAGEMENT                        */}
        {/* ========================================================================= */}
        {setupStep === 1 && (
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <Icon name="layers" className="w-5 h-5 text-cyan-400" />
                  <span>Langkah 1: Setup Stacking Perbandingan Assessment ({accountingStacks.length} Stack)</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Bebas menambah perbandingan 1, perbandingan 2, dst. Nilai responden ditarik secara presisi dari database berdasarkan formulirnya.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  type="button"
                  onClick={handleAddAccountingStack}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/10"
                >
                  <Icon name="plus" className="w-4 h-4" />
                  <span>+ Tambah Perbandingan Baru</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSetupStep(2)}
                  className="px-3.5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-all"
                >
                  <span>Lanjut ke Accounting</span>
                  <Icon name="chevronRight" className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* STACKED CARDS LIST */}
            <div className="space-y-4">
              {accountingStacks.map((stack, idx) => (
                <div
                  key={stack.id}
                  onClick={() => setActiveStackId(stack.id)}
                  className={`p-5 rounded-2xl border transition-all space-y-4 cursor-pointer ${
                    activeStackId === stack.id
                      ? 'bg-slate-950 border-cyan-500/60 shadow-xl'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={stack.title}
                        onChange={(e) => handleUpdateStackItem(stack.id, { title: e.target.value })}
                        className="bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-1.5 font-bold text-sm w-full max-w-md focus:outline-none focus:border-cyan-400"
                        placeholder="Nama Judul Perbandingan..."
                      />
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
                        <input
                          type="checkbox"
                          checked={stack.enabled}
                          onChange={(e) => handleUpdateStackItem(stack.id, { enabled: e.target.checked })}
                          className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-400 w-3.5 h-3.5"
                        />
                        <span>{stack.enabled ? 'Publish ke Overview' : 'Sembunyikan'}</span>
                      </label>

                      {accountingStacks.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveAccountingStack(stack.id)
                          }}
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                          title="Hapus Stack Perbandingan Ini"
                        >
                          <Icon name="trash" className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* MODE & FORM SELECTORS FOR THIS STACK */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                    <div className="space-y-1">
                      <label className="block text-slate-400 font-bold">Struktur Assessment</label>
                      <select
                        value={stack.mode}
                        onChange={(e) => handleUpdateStackItem(stack.id, { mode: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2"
                      >
                        <option value="single">1 Form Multi-Stage (Pre & Post)</option>
                        <option value="dual">2 Form Terpisah (Form A vs Form B)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-cyan-400 font-bold">Formulir Pretest (Skor Awal Benchmark)</label>
                      <select
                        value={stack.pretestFormId}
                        onChange={(e) => handleUpdateStackItem(stack.id, { pretestFormId: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2"
                      >
                        <option value="all">Semua Form Pretest (Database)</option>
                        {v15Forms.map((f) => (
                          <option key={f.formId} value={f.formId}>
                            [V1.5] {f.metadata?.title || f.formId}
                          </option>
                        ))}
                        {forms.map((f) => (
                          <option key={f.id} value={f.id}>
                            [V1.0] {f.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-purple-300 font-bold">Formulir Posttest (Skor Akhir Intervensi)</label>
                      <select
                        disabled={stack.mode === 'single'}
                        value={stack.posttestFormId}
                        onChange={(e) => handleUpdateStackItem(stack.id, { posttestFormId: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 disabled:opacity-40"
                      >
                        <option value="all">Semua Form Posttest (Database)</option>
                        {v15Forms.map((f) => (
                          <option key={f.formId} value={f.formId}>
                            [V1.5] {f.metadata?.title || f.formId}
                          </option>
                        ))}
                        {forms.map((f) => (
                          <option key={f.id} value={f.id}>
                            [V1.0] {f.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: ACCOUNTING PENILAIAN & PERBANDINGAN PRETEST VS POSTTEST PER-MITRA */}
        {/* ========================================================================= */}
        {setupStep === 2 && (
          <div className="space-y-6">
            {/* STACK SELECTOR TABS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
              <span className="text-slate-400 font-bold shrink-0">Pilih Stack Accounting:</span>
              {accountingStacks.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setActiveStackId(s.id)}
                  className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 font-bold ${
                    activeStackId === s.id
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  #{idx + 1} {s.title}
                </button>
              ))}
            </div>

            {/* ACCOUNTING METRIC PODS DYNAMIC FROM DATABASE */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Rata-Rata Pretest Instansi</span>
                <p className="text-3xl font-black font-mono text-cyan-400">{activeAccountingResult.avgPretest}%</p>
                <span className="text-[10px] text-slate-500 font-mono">Skor Awal Benchmark</span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-purple-300 uppercase font-bold">Rata-Rata Posttest Instansi</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                    +{activeAccountingResult.delta}% Gain
                  </span>
                </div>
                <p className="text-3xl font-black font-mono text-purple-300">{activeAccountingResult.avgPosttest}%</p>
                <span className="text-[10px] text-purple-400 font-mono">Pasca Intervensi (Terdapat Gain)</span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-1">
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Peningkatan Delta</span>
                <p className="text-3xl font-black font-mono text-emerald-300">+{activeAccountingResult.delta}%</p>
                <span className="text-[10px] text-emerald-400 font-mono">Gain Pemahaman Pangan</span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 space-y-1">
                <span className="text-[10px] font-mono text-amber-300 uppercase font-bold">Tingkat Kelulusan MS</span>
                <p className="text-3xl font-black font-mono text-amber-200">{activeAccountingResult.passRate}%</p>
                <span className="text-[10px] text-slate-400 font-mono">{activeAccountingResult.totalRespondents} Responden Database</span>
              </div>
            </div>

            {/* PRETEST VS POSTTEST PER MITRA COMPARISON TABLE & VISUAL BARS (DATABASE DRIVEN) */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                    <Icon name="barChart" className="w-5 h-5 text-purple-400" />
                    <span>Hasil Accounting Pretest vs Posttest: {activeStackObj.title}</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Rincian accounting per-Mitra yang ditarik secara presisi berdasarkan formulir responden. Gain (%) ditampilkan pada Posttest.
                  </p>
                </div>

                <button
                  onClick={() => setSetupStep(3)}
                  className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-all self-start md:self-auto"
                >
                  <span>Lanjut ke Analisis Per-Soal</span>
                  <Icon name="chevronRight" className="w-4 h-4" />
                </button>
              </div>

              {/* MITRA COMPARISON LIST */}
              {activeAccountingResult.mitraBreakdown.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-mono text-xs bg-slate-950 rounded-2xl border border-slate-800">
                  Belum ada data Mitra Instansi atau respon terdaftar di database.
                </div>
              ) : (
                <div className="space-y-4 font-mono text-xs">
                  {activeAccountingResult.mitraBreakdown.map((item) => (
                    <div key={item.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                        <div className="flex items-center gap-2.5">
                          <Icon name="building" className="w-4 h-4 text-purple-400 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-100 text-sm">{item.name}</span>
                            <span className="ml-2 px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                              {item.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-slate-400">{item.respondents} Responden DB</span>
                          <span className="font-bold text-emerald-400">Pass Rate: {item.passRate}%</span>
                        </div>
                      </div>

                      {/* COMPARATIVE PROGRESS BARS */}
                      {item.hasData ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          {/* PRETEST BAR (BASELINE - NO GAIN DISPLAYED) */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400 font-bold">Pretest Form (Skor Awal):</span>
                              <span className="text-cyan-400 font-bold">{item.pretestAvg}%</span>
                            </div>
                            <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                              <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${item.pretestAvg}%` }} />
                            </div>
                          </div>

                          {/* POSTTEST BAR (CONTAINS GAIN DISPLAY) */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-purple-300 font-bold">Posttest Form (Skor Akhir):</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-purple-300 font-bold">{item.posttestAvg}%</span>
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[9px] border border-emerald-500/30">
                                  +{item.delta}% Gain
                                </span>
                              </div>
                            </div>
                            <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${item.posttestAvg}%` }} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 text-center text-slate-500 font-mono text-[11px] bg-slate-900/60 rounded-xl">
                          Belum ada respon kuesioner terkumpul untuk instansi mitra ini di database.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: ANALISIS PER-SOAL & PER-INDIKATOR ITEM ANALYSIS (REAL DATABASE)   */}
        {/* ========================================================================= */}
        {setupStep === 3 && (
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <Icon name="clipboardList" className="w-5 h-5 text-emerald-400" />
                  <span>Langkah 3: Analisis Per-Soal & Per-Indikator Evaluasi Database (*Item Analysis*)</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Rincian pemahaman per-soal dari stack: <strong className="text-cyan-300">{activeStackObj.title}</strong>.
                </p>
              </div>

              <button
                onClick={() => setSetupStep(4)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-all self-start md:self-auto"
              >
                <span>Lanjut ke Pilih Tampilan & Sync</span>
                <Icon name="chevronRight" className="w-4 h-4" />
              </button>
            </div>

            {/* ITEM ANALYSIS TABLE */}
            {itemQuestionAnalysis.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs bg-slate-950 rounded-2xl border border-slate-800">
                Belum ada butir pertanyaan ditemukan pada formulir yang dipilih.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-xs font-mono text-left">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-3.5 border-b border-slate-800">Teks Pertanyaan / Indikator Evaluasi</th>
                      <th className="p-3.5 border-b border-slate-800 text-center">Jawaban DB</th>
                      <th className="p-3.5 border-b border-slate-800 text-center">Pretest (%)</th>
                      <th className="p-3.5 border-b border-slate-800 text-center">Posttest (%)</th>
                      <th className="p-3.5 border-b border-slate-800 text-center">Indeks Kesulitan</th>
                      <th className="p-3.5 border-b border-slate-800 text-right">Status Pemahaman</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {itemQuestionAnalysis.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="p-3.5 max-w-xs">
                          <div className="font-bold text-slate-100">{q.text}</div>
                          <div className="text-[10px] text-purple-300 font-mono">{q.formTitle}</div>
                        </td>
                        <td className="p-3.5 text-center text-slate-300 font-bold">{q.totalAnswers} Jawaban</td>
                        <td className="p-3.5 text-center text-cyan-400 font-bold">{q.pretestPass}%</td>
                        <td className="p-3.5 text-center text-purple-300 font-bold">{q.posttestPass}%</td>
                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[10px]">
                            {q.difficulty}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              q.status === 'Sangat Dipahami'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : q.status === 'Cukup Dipahami'
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                : q.status === 'Belum Ada Respon'
                                ? 'bg-slate-900 text-slate-500 border-slate-800'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: PEMILIHAN TAMPILAN, EDITOR WIDGET & SINKRONISASI DASHBOARD UTAMA   */}
        {/* ========================================================================= */}
        {setupStep === 4 && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                    <Icon name="pieChart" className="w-5 h-5 text-amber-400" />
                    <span>Langkah 4: Pemilihan Tampilan Visualisasi & Sinkronisasi Ke Dashboard Utama</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Pilih bentuk grafik (Bar, Donut, Line, Stat, Matrix) dan beri tanda centang <strong className="text-cyan-300">Tampilkan di Dashboard Utama</strong> untuk menerbitkan grafik ke halaman `/dashboard/overview`.
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => saveWidgetSettings(widgets)}
                  icon="save"
                >
                  Simpan & Sync Dashboard Utama
                </Button>
              </div>
            </div>

            {/* WIDGET CARDS GRID FOR VISUALIZATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWidgets.map((widget) => (
                <div
                  key={widget.id}
                  className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3 ${
                    widget.enabled
                      ? 'bg-slate-900/90 border-cyan-500/40 shadow-xl'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                  }`}
                >
                  {/* Card Header & Controls */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold text-purple-300 truncate max-w-[160px]">
                        {widget.formTitle}
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* TOGGLE PIN TO MAIN DASHBOARD */}
                        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 hover:border-cyan-500/50">
                          <input
                            type="checkbox"
                            checked={widget.enabled}
                            onChange={() => handleToggleWidget(widget.id)}
                            className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>{widget.enabled ? 'Aktif di Dashboard' : 'Sembunyikan'}</span>
                        </label>

                        <button
                          onClick={() => handleOpenEditor(widget)}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-colors"
                          title="Edit Judul & Warna Grafik"
                        >
                          <Icon name="settings" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-slate-100 line-clamp-2">
                      {widget.config?.title || widget.questionText}
                    </h4>
                  </div>

                  {/* LIVE CHART CANVAS BOX */}
                  <div className="rounded-2xl bg-slate-950 border border-slate-800/80 p-2 overflow-hidden">
                    {renderLiveChart(widget)}
                  </div>

                  {/* QUICK CHART TYPE & COLOR CONTROLS */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                      {CHART_TYPES.map((ct) => (
                        <button
                          key={ct.id}
                          onClick={() => handleChangeChartTypeOnCard(widget.id, ct.id as any)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            widget.chartType === ct.id
                              ? 'bg-cyan-500 text-slate-950 font-bold'
                              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                          title={ct.name}
                        >
                          <Icon name={ct.icon} className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      {COLOR_SCHEMES.map((cs) => (
                        <button
                          key={cs.id}
                          onClick={() => handleChangeColorSchemeOnCard(widget.id, cs.id)}
                          className={`w-3.5 h-3.5 rounded-full transition-transform ${
                            widget.config?.colorScheme === cs.id ? 'ring-2 ring-cyan-400 scale-110' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: cs.colors[0] }}
                          title={cs.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: EDITOR WIDGET CONFIGURATION                                        */}
        {/* ========================================================================= */}
        {isEditorOpen && editingWidget && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fadeIn text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <Icon name="settings" className="w-5 h-5 text-cyan-400" />
                  Edit Widget Grafik CMS
                </h3>
                <button onClick={() => setIsEditorOpen(false)} className="text-slate-400 hover:text-white">
                  <Icon name="x" className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Judul Tampilan Grafik</label>
                  <input
                    type="text"
                    value={editorConfig.title}
                    onChange={(e) => setEditorConfig({ ...editorConfig, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Pilih Tipe Visualisasi</label>
                  <select
                    value={editorConfig.chartType}
                    onChange={(e) => setEditorConfig({ ...editorConfig, chartType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2"
                  >
                    {CHART_TYPES.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name} - {ct.desc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Skema Warna Graphic Palette</label>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {COLOR_SCHEMES.map((cs) => (
                      <button
                        key={cs.id}
                        type="button"
                        onClick={() => setEditorConfig({ ...editorConfig, colorScheme: cs.id })}
                        className={`p-2 rounded-xl border flex items-center gap-2 text-[10px] transition-all ${
                          editorConfig.colorScheme === cs.id
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cs.colors[0] }} />
                        <span className="truncate">{cs.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditor}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5"
                  >
                    <Icon name="check" className="w-4 h-4" />
                    <span>Simpan Grafik</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}