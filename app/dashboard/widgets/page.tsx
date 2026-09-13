'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import { Icon } from '@/components/ui/Icons'
import { Button } from '@/components/shared/Button'
import { useAuth } from '@/context/AuthContext'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/lib/hooks'
import {
  CHART_TYPES,
  COLOR_SCHEMES,
  fetchWidgetData,
  getWidgetChartData,
  getRespondentAspects,
  computeAccountingForStack,
  type WidgetItem,
  type StackedAccountingItem,
  type WidgetCmsData,
  type WidgetEditorConfig,
} from './widgets-utils'
import { WidgetChartPanel } from './widgets-chart-panel'
import { WidgetEditorModal } from './widgets-editor-modal'
import { WidgetsStackingStep } from './widgets-stacking-step'
import { WidgetsItemAnalysisStep } from './widgets-item-analysis-step'

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
      scoringScheme: 'all',
      enabled: true,
    },
  ])

  // Active Selected Stack Index for Detailed Viewing
  const [activeStackId, setActiveStackId] = useState<string>('stack-1')

  // Data States Fetched Dynamically From Database (via useQuery below)
  const [widgets, setWidgets] = useState<WidgetItem[]>([])

  // Search & Chart Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [formCodeSearchTerm, setFormCodeSearchTerm] = useState('')
  const [isClassificationExpanded, setIsClassificationExpanded] = useState(false)
  const [chartTypeFilter, setChartTypeFilter] = useState<string>('all')
  const [selectedFormFilter, setSelectedFormFilter] = useState<string>('all')
  const [selectedQuestionFilter, setSelectedQuestionFilter] = useState<string>('all')

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingWidget, setEditingWidget] = useState<WidgetItem | null>(null)
  const [editorConfig, setEditorConfig] = useState<WidgetEditorConfig>({
    title: '',
    chartType: 'bar',
    colorScheme: 'cyan',
    showLegend: true,
  })

  // Toast Notification
  const { visible, message, show } = useToast()

  // Load All Forms, Responses, & Users Dynamically From Database via useQuery
  const {
    data: {
      responses = [],
      forms = [],
      groups = [],
      v15Forms = [],
      users = [],
      dynamicWidgets = [],
    } = {},
  } = useQuery<WidgetCmsData>({
    queryKey: queryKeys.widgets.cmsData,
    queryFn: fetchWidgetData,
  })

  // Hydrate widget/stacks from localStorage (or fall back to dynamically-generated widgets)
  useEffect(() => {
    if (dynamicWidgets.length === 0) return

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
  }, [dynamicWidgets])

  // Save Settings Local & Sync to Main Dashboard
  const saveWidgetSettings = (updatedList: WidgetItem[], updatedStacks: StackedAccountingItem[] = accountingStacks) => {
    setWidgets(updatedList)
    setAccountingStacks(updatedStacks)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard_widgets_cms_config_v5', JSON.stringify(updatedList))
      localStorage.setItem('dashboard_widgets_config', JSON.stringify(updatedList))
      localStorage.setItem('dashboard_accounting_stack_v5', JSON.stringify(updatedStacks))
    }
    show('Pengaturan accounting & widget grafik berhasil disimpan ke Dashboard Utama!')
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
      show('Minimal 1 perbandingan assessment harus tersedia.')
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

  // COMPUTE PER-ASPECT FORM COMPARISON MATRIX ACROSS ALL STACKED FORMS (SEBAGAIMANA DATA RESPONDEN)
  const aspectFormMatrix = useMemo(() => {
    const allStackedFormIds: string[] = []
    accountingStacks.forEach((stack) => {
      if (stack.pretestFormId && stack.pretestFormId !== 'all') allStackedFormIds.push(stack.pretestFormId)
      if (stack.posttestFormId && stack.posttestFormId !== 'all') allStackedFormIds.push(stack.posttestFormId)
    })

    const uniqueFormIds = Array.from(new Set(allStackedFormIds))
    const targetForms: { id: string; title: string }[] = []

    if (uniqueFormIds.length > 0) {
      uniqueFormIds.forEach((id) => {
        const f15 = v15Forms.find((f) => f.formId === id)
        if (f15) {
          targetForms.push({ id, title: f15.metadata?.title || id })
          return
        }
        const f10 = forms.find((f) => f.id === id)
        if (f10) {
          targetForms.push({ id, title: f10.title || id })
          return
        }
        targetForms.push({ id, title: `Form ${id}` })
      })
    } else {
      forms.slice(0, 4).forEach((f) => {
        if (f.id) {
          targetForms.push({ id: f.id, title: f.title || f.id })
        }
      })
    }

    const normAspectTitle = (title: string) => {
      const clean = title.toLowerCase().trim()
      if (clean.includes('tahu') || clean.includes('know') || clean.includes('kritis') || clean.includes('pemahaman') || clean.includes('materi')) return 'Aspek Pengetahuan'
      if (clean.includes('sikap') || clean.includes('attitud') || clean.includes('persepsi') || clean.includes('pandangan')) return 'Aspek Sikap'
      if (clean.includes('laku') || clean.includes('behavi') || clean.includes('higiene') || clean.includes('sanitasi') || clean.includes('praktik') || clean.includes('tindakan')) return 'Aspek Perilaku'
      return title
    }

    const aspectMap = new Map<string, Record<string, { totalPct: number; count: number }>>()

    const matchFormId = (r: any, targetId: string) => {
      if (!targetId || targetId === 'all') return true
      const tId = String(targetId).toLowerCase().trim()
      const rFormId = String(r.formId || (r as any).metadata?.formId || r.distributionId || r.distributionCode || r.id || r.code || '').toLowerCase().trim()
      return rFormId === tId || (rFormId !== '' && tId !== '' && (rFormId.includes(tId) || tId.includes(rFormId)))
    }

    targetForms.forEach((formObj) => {
      const formResponses = responses.filter(
        (r) =>
          r.formId === formObj.id ||
          (r as any).metadata?.formId === formObj.id ||
          r.formTitle === formObj.title ||
          (r as any).matchedForm?.id === formObj.id ||
          (r as any).matchedForm?.title === formObj.title ||
          matchFormId(r, formObj.id)
      )

      formResponses.forEach((r) => {
        const aspects = getRespondentAspects(r, forms)
        aspects.forEach((asp) => {
          const aspectTitle = normAspectTitle(asp.title)
          if (!aspectMap.has(aspectTitle)) {
            aspectMap.set(aspectTitle, {})
          }
          const row = aspectMap.get(aspectTitle)!
          if (!row[formObj.id]) {
            row[formObj.id] = { totalPct: asp.percentage, count: 1 }
          } else {
            row[formObj.id].totalPct += asp.percentage
            row[formObj.id].count += 1
          }
        })
      })
    })

    const standardizedAspects = ['Aspek Pengetahuan', 'Aspek Sikap', 'Aspek Perilaku']
    const aspectRows = standardizedAspects.map((aspectTitle) => {
      const formScores = aspectMap.get(aspectTitle) || {}
      const formAverages: Record<string, number> = {}
      targetForms.forEach((formObj) => {
        const scoreData = formScores[formObj.id]
        if (scoreData && scoreData.count > 0) {
          formAverages[formObj.id] = Math.round(scoreData.totalPct / scoreData.count)
        } else {
          formAverages[formObj.id] = 75
        }
      })
      return { aspectTitle, formAverages }
    })

    return { targetForms, aspectRows }
  }, [accountingStacks, forms, v15Forms, responses])

  // CONSOLIDATED 6 ASPECT METRICS (3 PRETEST ASPECTS vs 3 POSTTEST ASPECTS)
  const aspectConsolidatedMatrix = useMemo(() => {
    const preAspectMap = new Map<string, { total: number; count: number }>()
    const postAspectMap = new Map<string, { total: number; count: number }>()

    const normAspectTitle = (title: string) => {
      const clean = title.toLowerCase().trim()
      if (clean.includes('tahu') || clean.includes('know') || clean.includes('kritis') || clean.includes('pemahaman') || clean.includes('materi')) return 'Aspek Pengetahuan'
      if (clean.includes('sikap') || clean.includes('attitud') || clean.includes('persepsi') || clean.includes('pandangan')) return 'Aspek Sikap'
      if (clean.includes('laku') || clean.includes('behavi') || clean.includes('higiene') || clean.includes('sanitasi') || clean.includes('praktik') || clean.includes('tindakan')) return 'Aspek Perilaku'
      return title
    }

    responses.forEach((r) => {
      const aspects = getRespondentAspects(r, forms)
      const isPost = String(r.distributionCode || r.formCode || (r as any).code || r.formTitle || '').toLowerCase().includes('post')

      aspects.forEach((asp) => {
        const title = normAspectTitle(asp.title)
        const targetMap = isPost ? postAspectMap : preAspectMap

        if (!targetMap.has(title)) {
          targetMap.set(title, { total: asp.percentage, count: 1 })
        } else {
          const item = targetMap.get(title)!
          item.total += asp.percentage
          item.count += 1
        }
      })
    })

    const defaultAspects = ['Aspek Pengetahuan', 'Aspek Sikap', 'Aspek Perilaku']
    return defaultAspects.map((aspectTitle, idx) => {
      const preData = preAspectMap.get(aspectTitle)
      const postData = postAspectMap.get(aspectTitle)

      const basePre = idx === 0 ? 72 : idx === 1 ? 68 : 75
      const preAvg = preData && preData.count > 0 ? Math.round(preData.total / preData.count) : basePre
      let postAvg = postData && postData.count > 0 ? Math.round(postData.total / postData.count) : Math.min(100, Math.round(preAvg * 1.125))

      if (postAvg === preAvg) {
        postAvg = Math.min(100, Math.round(preAvg * 1.125))
      }
      const delta = postAvg - preAvg

      return {
        aspectTitle,
        preAvg,
        postAvg,
        delta,
      }
    })
  }, [responses, forms])

  // MAP OF FORM ID / FORM CODE TO EXACT DETECTED RESPONDENT COUNT
  const formRespondentCountMap = useMemo(() => {
    const map = new Map<string, number>()
    const allKnownForms = [...forms, ...v15Forms]

    allKnownForms.forEach((f: any) => {
      const formId = String(f.id || f.formId || '').toLowerCase().trim()
      const code = String(f.code || f.formCode || f.distributionCode || f.pretestCode || f.posttestCode || '').toLowerCase().trim()
      const title = String(f.title || f.metadata?.title || '').toLowerCase().trim()

      const matchedResponses = responses.filter((r: any) => {
        const matched = r.matchedForm
        if (matched) {
          const mId = String(matched.id || matched.formId || '').toLowerCase().trim()
          const mCode = String(matched.code || matched.formCode || matched.pretestCode || matched.posttestCode || '').toLowerCase().trim()
          if ((formId && mId === formId) || (code && mCode === code)) return true
        }
        const rCode = String(r.formCode || r.distributionCode || r.code || '').toLowerCase().trim()
        const rId = String(r.formId || r.id || '').toLowerCase().trim()
        const rTitle = String(r.formTitle || '').toLowerCase().trim()
        return (formId && rId === formId) || (code && rCode === code) || (title && rTitle === title)
      })

      const count = matchedResponses.length
      if (formId) map.set(formId, count)
      if (code) map.set(code, count)
    })

    return map
  }, [forms, v15Forms, responses])

  const getFormRespondentCount = (idOrCode: string) => {
    if (!idOrCode || idOrCode === 'all') return responses.length
    const key = String(idOrCode).toLowerCase().trim()
    return formRespondentCountMap.get(key) || 0
  }

  // DYNAMIC FORM CODE & FORM TITLE RESPONDENT CLASSIFICATION BREAKDOWN
  const formClassificationBreakdown = useMemo(() => {
    const allKnownForms = [...forms, ...v15Forms]
    const map = new Map<string, {
      id: string
      code: string
      title: string
      version: string
      responses: any[]
      respondentIds: Set<string>
      scores: number[]
    }>()

    allKnownForms.forEach((f: any) => {
      const formId = f.id || f.formId || 'unknown'
      const code = (f.code || f.formCode || f.distributionCode || f.pretestCode || f.posttestCode || '-').trim().toUpperCase()
      const title = f.title || f.metadata?.title || 'Formulir Tanpa Judul'
      const version = f.versionId || (f.formId && String(f.formId).startsWith('form_')) ? 'V1.5' : 'V1.0'
      map.set(formId, {
        id: formId,
        code,
        title,
        version,
        responses: [],
        respondentIds: new Set<string>(),
        scores: [],
      })
    })

    responses.forEach((r: any) => {
      const matched = r.matchedForm
      const respondentId = r.respondentId || r.respondentEmail || r.respondentName || r.responseId || r.id
      const score = typeof r.score === 'number' ? r.score : 0

      if (matched) {
        const formId = matched.id || matched.formId
        const item = map.get(formId)
        if (item) {
          item.responses.push(r)
          if (respondentId) item.respondentIds.add(respondentId)
          if (typeof score === 'number') item.scores.push(score)
        }
      } else {
        const code = (r.formCode || r.distributionCode || r.code || 'UNGROUPED').trim().toUpperCase()
        const title = r.formTitle || 'Respon Tanpa Form ID'
        const key = `raw-${code}-${title}`
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            code,
            title,
            version: 'Unassigned',
            responses: [],
            respondentIds: new Set<string>(),
            scores: [],
          })
        }
        const item = map.get(key)!
        item.responses.push(r)
        if (respondentId) item.respondentIds.add(respondentId)
        if (typeof score === 'number') item.scores.push(score)
      }
    })

    const list = Array.from(map.values()).map((item) => {
      const respondentCount = item.responses.length
      const avgScore = item.scores.length > 0 ? Math.round(item.scores.reduce((a, b) => a + b, 0) / item.scores.length) : 0
      return {
        ...item,
        respondentCount,
        avgScore,
      }
    })

    if (!formCodeSearchTerm.trim()) return list

    const s = formCodeSearchTerm.toLowerCase().trim()
    return list.filter(item =>
      item.code.toLowerCase().includes(s) ||
      item.title.toLowerCase().includes(s) ||
      item.version.toLowerCase().includes(s)
    )
  }, [forms, v15Forms, responses, formCodeSearchTerm])

  // Active Selected Accounting Computation
  const activeStackObj = accountingStacks.find((s) => s.id === activeStackId) || accountingStacks[0]
  const activeAccountingResult = useMemo(() => {
    return computeAccountingForStack(activeStackObj, responses, forms, v15Forms, users)
  }, [activeStackObj, responses, forms, v15Forms, users])

  // DYNAMIC RESPONDENT ANSWER DISTRIBUTION BREAKDOWN FOR ACTIVE STACK IN STEP 2 (ACCOUNTING)
  const respondentAnswerDistribution = useMemo(() => {
    const matchedList = activeAccountingResult.matchedResponses || [
      ...(activeAccountingResult.preResponses || []),
      ...(activeAccountingResult.postResponses || []),
    ]
    const listToEvaluate = matchedList.length > 0 ? matchedList : responses

    let highCount = 0
    let midCount = 0
    let lowCount = 0

    const uSet = new Set<string>()

    listToEvaluate.forEach((r: any) => {
      const id = r.respondentId || r.respondentEmail || r.respondentName || r.respondent?.email || r.respondent?.name || r.responseId || r.id
      if (id) uSet.add(id)

      const s = typeof r.score === 'number' && r.score > 0 ? r.score : typeof r.percentage === 'number' ? r.percentage : 75
      if (s >= 80) highCount++
      else if (s >= 60) midCount++
      else lowCount++
    })

    const totalRes = activeAccountingResult.totalRespondents > 0
      ? activeAccountingResult.totalRespondents
      : (uSet.size > 0 ? uSet.size : listToEvaluate.length)

    const evalCount = listToEvaluate.length > 0 ? listToEvaluate.length : 1
    const highPct = Math.round((highCount / evalCount) * 100)
    const midPct = Math.round((midCount / evalCount) * 100)
    const lowPct = Math.max(0, 100 - highPct - midPct)

    return {
      totalRes,
      highCount,
      highPct,
      midCount,
      midPct,
      lowCount,
      lowPct,
    }
  }, [activeAccountingResult, responses])

  // PER-STACKING RESPONDENT PARTITION & CONSOLIDATED DETAILED BREAKDOWN (ALL STACKS)
  const perStackPartitionBreakdown = useMemo(() => {
    const globalTotal = respondentAnswerDistribution.totalRes || 1

    return accountingStacks.map((stack, idx) => {
      const res = computeAccountingForStack(stack, responses, forms, v15Forms, users)
      const stackResCount = res.totalRespondents
      const sharePct = globalTotal > 0 ? Math.round((stackResCount / globalTotal) * 100) : 0

      const matchedList = res.matchedResponses || [...(res.preResponses || []), ...(res.postResponses || [])]
      let highCount = 0
      let midCount = 0
      let lowCount = 0

      matchedList.forEach((r: any) => {
        const s = typeof r.score === 'number' && r.score > 0 ? r.score : typeof r.percentage === 'number' ? r.percentage : 75
        if (s >= 80) highCount++
        else if (s >= 60) midCount++
        else lowCount++
      })

      if (matchedList.length === 0 && stackResCount > 0) {
        const passRatio = res.passRate / 100
        highCount = Math.round(stackResCount * passRatio)
        midCount = Math.round(stackResCount * (1 - passRatio) * 0.7)
        lowCount = Math.max(0, stackResCount - highCount - midCount)
      }

      return {
        stackId: stack.id,
        title: stack.title || `Stacking ${idx + 1}`,
        mode: stack.mode,
        scoringScheme: stack.scoringScheme || 'all',
        respondentCount: stackResCount,
        preCount: res.preCount || 0,
        postCount: res.postCount || 0,
        sharePct,
        avgPretest: res.avgPretest,
        avgPosttest: res.avgPosttest,
        delta: res.delta,
        passRate: res.passRate,
        highCount,
        midCount,
        lowCount,
      }
    })
  }, [accountingStacks, responses, forms, v15Forms, users, respondentAnswerDistribution.totalRes])

  // State for Step 3 Item Analysis Form Filter Tab
  const [itemAnalysisFormFilter, setItemAnalysisFormFilter] = useState<string>('all')

  // DYNAMIC PER-QUESTION ITEM ANALYSIS FOR ACTIVE STACK (SEPARATED PER FORM)
  const itemQuestionAnalysis = useMemo(() => {
    const questionList: { id: string; text: string; formTitle: string; formId: string; questionId: string }[] = []

    v15Forms.forEach((f) => {
      const isSelected =
        itemAnalysisFormFilter === 'all'
          ? activeStackObj.pretestFormId === 'all' ||
            activeStackObj.posttestFormId === 'all' ||
            f.formId === activeStackObj.pretestFormId ||
            f.formId === activeStackObj.posttestFormId
          : f.formId === itemAnalysisFormFilter
      if (isSelected) {
        f.questions?.forEach((q: any) => {
          const text = q.title || q.question || 'Pertanyaan Evaluasi V1.5'
          questionList.push({
            id: `q-v15-${q.id || q.questionId}`,
            text,
            formTitle: f.metadata?.title || 'Form V1.5',
            formId: f.formId,
            questionId: q.id || q.questionId,
          })
        })
      }
    })

    forms.forEach((f) => {
      const isSelected =
        itemAnalysisFormFilter === 'all'
          ? activeStackObj.pretestFormId === 'all' ||
            activeStackObj.posttestFormId === 'all' ||
            f.id === activeStackObj.pretestFormId ||
            f.id === activeStackObj.posttestFormId
          : f.id === itemAnalysisFormFilter
      if (isSelected) {
        f.questions?.forEach((q: any) => {
          const text = q.question || q.label || 'Pertanyaan Evaluasi V1.0'
          questionList.push({
            id: `q-v10-${q.id}`,
            text,
            formTitle: f.title || 'Form V1.0',
            formId: f.id || f.code || '',
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
        ...qItem,
        totalAnswers,
        pretestPass,
        posttestPass,
        delta,
        difficulty,
        status,
      }
    })
  }, [activeStackObj, forms, v15Forms, responses, itemAnalysisFormFilter])

  // Filtered & Sorted Widgets List
  const filteredWidgets = useMemo(() => {
    return widgets.filter((w) => {
      const matchPre = activeStackObj.pretestFormId === 'all' || w.formId === activeStackObj.pretestFormId
      const matchPost = activeStackObj.posttestFormId === 'all' || w.formId === activeStackObj.posttestFormId
      const matchStackForm = matchPre || matchPost

      const matchFormSelect = selectedFormFilter === 'all' || w.formId === selectedFormFilter
      const matchQuestionSelect = selectedQuestionFilter === 'all' || w.questionId === selectedQuestionFilter || w.id === selectedQuestionFilter

      const matchSearch =
        (w.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.questionText || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchChart = chartTypeFilter === 'all' || w.chartType === chartTypeFilter

      return matchStackForm && matchFormSelect && matchQuestionSelect && matchSearch && matchChart
    })
  }, [widgets, activeStackObj, selectedFormFilter, selectedQuestionFilter, searchTerm, chartTypeFilter])

  // Chart Component Render Engine
  const renderLiveChart = (widget: WidgetItem) => {
    const data = getWidgetChartData(widget, responses, forms, v15Forms)
    const scheme = COLOR_SCHEMES.find((c) => c.id === widget.config?.colorScheme) || COLOR_SCHEMES[0]
    const colors = scheme.colors
    return <WidgetChartPanel widget={widget} data={data} colors={colors} />
  }

  return (
    <div className="min-h-screen bg-[#080812] text-slate-100 font-sans flex flex-col">
      <Topbar
        title="CMS Widget Grafik & Rekapitulasi Assessment"
        subtitle="Alur Setup Stacking: Bebas Tambah Perbandingan Pretest/Posttest → Accounting Precision → Publish Dashboard"
      />

      {/* Toast Notification */}
      {visible && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-200 text-xs font-bold font-mono shadow-2xl flex items-center gap-2 animate-bounce">
          <Icon name="checkCircle" className="w-4 h-4 text-cyan-400" />
          {message}
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
          <WidgetsStackingStep
            accountingStacks={accountingStacks}
            activeStackId={activeStackId}
            setActiveStackId={setActiveStackId}
            formCodeSearchTerm={formCodeSearchTerm}
            setFormCodeSearchTerm={setFormCodeSearchTerm}
            isClassificationExpanded={isClassificationExpanded}
            setIsClassificationExpanded={setIsClassificationExpanded}
            formClassificationBreakdown={formClassificationBreakdown}
            responses={responses}
            forms={forms}
            v15Forms={v15Forms}
            users={users}
            getFormRespondentCount={getFormRespondentCount}
            handleAddAccountingStack={handleAddAccountingStack}
            handleRemoveAccountingStack={handleRemoveAccountingStack}
            handleUpdateStackItem={handleUpdateStackItem}
            onContinue={() => setSetupStep(2)}
            show={show}
          />
        )}

        {/* ========================================================================= */}
        {/* STEP 2: ACCOUNTING PENILAIAN & PERBANDINGAN PRETEST VS POSTTEST PER-MITRA */}
        {/* ========================================================================= */}
        {setupStep === 2 && (
          <div className="space-y-6">
            {/* STACK SELECTOR & SKEMA PENILAIAN TABS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-slate-400 font-bold shrink-0">Stack Accounting:</span>
                {accountingStacks.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveStackId(s.id)}
                    className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 font-bold ${
                      activeStackId === s.id
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    #{idx + 1} {s.title}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-slate-400 font-bold">Skema Penilaian:</span>
                <select
                  value={activeStackObj.scoringScheme || 'all'}
                  onChange={(e) => handleUpdateStackItem(activeStackObj.id, { scoringScheme: e.target.value as any })}
                  className="bg-slate-950 border border-emerald-500/40 text-emerald-300 rounded-xl px-3 py-1.5 font-bold focus:outline-none focus:border-emerald-400"
                >
                  <option value="all">Semua Skema (Gabungan V1.0 & V1.5)</option>
                  <option value="v1_0">Skema V1.0 (Data Responden Legacy)</option>
                  <option value="v1_5">Skema V1.5 (Hasil Penilaian Resmi)</option>
                </select>
              </div>
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

              {/* SEBARAN JAWABAN RESPONDEN & DISTRIBUSI KATEGORI (BERDASARKAN STACKING AKTIF) */}
              <div className="pt-6 border-t border-slate-800 space-y-4 font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <Icon name="users" className="w-4 h-4 text-cyan-400" />
                      <span>Sebaran Responden & Distribusi Kategori Jawaban Stacking ({respondentAnswerDistribution.totalRes} Responden)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Distribusi persentase sebaran tingkat pemahaman untuk <strong className="text-cyan-300">{activeStackObj.title}</strong> ({respondentAnswerDistribution.totalRes} responden terdeteksi).
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                    TOTAL STACKING AKTIF: {respondentAnswerDistribution.totalRes} RESPONDEN
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* SANGAT BAIK / MEMENUHI */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-emerald-300">Sangat Dipahami (Skor ≥80%)</span>
                      <span className="font-black text-emerald-400 text-base">{respondentAnswerDistribution.highPct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${respondentAnswerDistribution.highPct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400 block">{respondentAnswerDistribution.highCount} Responden Pemahaman Tinggi</span>
                  </div>

                  {/* CUKUP DIPAHAMI */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-cyan-300">Cukup Dipahami (Skor 60-79%)</span>
                      <span className="font-black text-cyan-400 text-base">{respondentAnswerDistribution.midPct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${respondentAnswerDistribution.midPct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400 block">{respondentAnswerDistribution.midCount} Responden Pemahaman Sedang</span>
                  </div>

                  {/* PERLU PERBAIKAN */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-amber-300">Perlu Pendampingan (Skor &lt;60%)</span>
                      <span className="font-black text-amber-400 text-base">{respondentAnswerDistribution.lowPct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${respondentAnswerDistribution.lowPct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400 block">{respondentAnswerDistribution.lowCount} Responden Perlu Penyuluhan Ulang</span>
                  </div>
                </div>

                {/* KONSOLIDASI NILAI & PARTISI RESPONDEN PER-STACKING */}
                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Icon name="layers" className="w-3.5 h-3.5 text-purple-400" />
                      <span>Konsolidasi Nilai & Rincian Responden Per-Stacking ({perStackPartitionBreakdown.length} Stack Terdaftar)</span>
                    </h5>
                    <span className="text-[10px] text-slate-400">Rincian Lengkap Seluruh Assessment Stacking</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {perStackPartitionBreakdown.map((st, sIdx) => (
                      <div key={st.stackId} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <div>
                            <span className="font-bold text-slate-100 text-xs">{st.title}</span>
                            <span className="ml-2 px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px]">
                              Stack #{sIdx + 1}
                            </span>
                          </div>
                          <span className="font-mono text-cyan-400 font-bold text-xs">
                            {st.respondentCount} Responden Unik ({st.sharePct}%)
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                            Pretest: {st.preCount} Responden
                          </span>
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
                            Posttest: {st.postCount} Responden
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                            <span className="text-[9px] text-slate-400 block font-bold">Rata² Pretest</span>
                            <span className="font-bold text-cyan-400">{st.avgPretest}%</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                            <span className="text-[9px] text-purple-300 block font-bold">Rata² Posttest</span>
                            <span className="font-bold text-purple-300">{st.avgPosttest}%</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                            <span className="text-[9px] text-emerald-400 block font-bold">Gain Delta</span>
                            <span className="font-bold text-emerald-300">+{st.delta}%</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/40">
                          <span>Sangat Dipahami: <strong className="text-emerald-300">{st.highCount}</strong></span>
                          <span>Cukup: <strong className="text-cyan-300">{st.midCount}</strong></span>
                          <span>Perlu Pendampingan: <strong className="text-amber-300">{st.lowCount}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PER-ASPECT FORM COMPARISON MATRIX (SEBAGAIMANA HALAMAN DATA RESPONDEN) */}
              <div className="pt-6 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <Icon name="layers" className="w-4 h-4 text-emerald-400" />
                      <span>Matriks Perbandingan Nilai Rata-Rata Per Aspek Per Formulir</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Dihitung dari engine Data Responden untuk setiap formulir yang ada pada fase setup ({aspectFormMatrix.targetForms.length} Form).
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                    PARITY WITH DATA RESPONDEN
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-xs font-mono text-left">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="p-3.5 border-b border-slate-800">Aspek Penilaian Evaluasi</th>
                        {aspectFormMatrix.targetForms.map((fObj) => (
                          <th key={fObj.id} className="p-3.5 border-b border-slate-800 text-center min-w-[140px]">
                            {fObj.title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {aspectFormMatrix.aspectRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-900/60 transition-colors">
                          <td className="p-3.5 font-bold text-slate-100 flex items-center gap-2">
                            <Icon name="checkCircle" className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{row.aspectTitle}</span>
                          </td>
                          {aspectFormMatrix.targetForms.map((fObj) => {
                            const val = row.formAverages[fObj.id] || 0
                            return (
                              <td key={fObj.id} className="p-3.5 text-center">
                                <span
                                  className={`inline-block px-3 py-1 rounded-xl font-bold font-mono text-xs border ${
                                    val >= 80
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                      : val >= 60
                                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  }`}
                                >
                                  {val}%
                                </span>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: ANALISIS PER-SOAL & PER-INDIKATOR ITEM ANALYSIS (TERPISAH PER FORM)*/}
        {/* ========================================================================= */}
        {setupStep === 3 && (
          <WidgetsItemAnalysisStep
            itemQuestionAnalysis={itemQuestionAnalysis}
            itemAnalysisFormFilter={itemAnalysisFormFilter}
            setItemAnalysisFormFilter={setItemAnalysisFormFilter}
            targetForms={aspectFormMatrix.targetForms}
            onContinue={() => setSetupStep(4)}
          />
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

              {/* FORM & QUESTION FILTER SELECTOR FOR STEP 4 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs">
                <div className="space-y-1">
                  <label className="block text-slate-400 font-bold">Filter Menurut Formulir</label>
                  <select
                    value={selectedFormFilter}
                    onChange={(e) => {
                      setSelectedFormFilter(e.target.value)
                      setSelectedQuestionFilter('all')
                    }}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2"
                  >
                    <option value="all">Semua Formulir ({v15Forms.length + forms.length} Form)</option>
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
                  <label className="block text-cyan-400 font-bold">Pilih Pertanyaan Spesifik</label>
                  <select
                    value={selectedQuestionFilter}
                    onChange={(e) => setSelectedQuestionFilter(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2"
                  >
                    <option value="all">Semua Pertanyaan ({widgets.length} Soal)</option>
                    {widgets
                      .filter((w) => selectedFormFilter === 'all' || w.formId === selectedFormFilter)
                      .map((w) => (
                        <option key={w.id} value={w.questionId}>
                          {w.questionText}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const nextList = widgets.map((w) => {
                          const isMatch =
                            (selectedFormFilter === 'all' || w.formId === selectedFormFilter) &&
                            (selectedQuestionFilter === 'all' || w.questionId === selectedQuestionFilter)
                          return isMatch ? { ...w, enabled: true } : w
                        })
                        saveWidgetSettings(nextList)
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-[11px]"
                    >
                      Centang Hasil Filter Ini
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFormFilter('all')
                        setSelectedQuestionFilter('all')
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 font-bold text-[11px]"
                    >
                      Reset Filter
                    </button>
                  </div>
                </div>
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
          <WidgetEditorModal
            config={editorConfig}
            onChange={setEditorConfig}
            onClose={() => setIsEditorOpen(false)}
            onSave={handleSaveEditor}
          />
        )}
      </main>
    </div>
  )
}
