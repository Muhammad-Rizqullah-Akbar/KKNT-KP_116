'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/infra/safe-fetch'
import { queryKeys } from '@/lib/query-keys'
import {
  cleanString,
  mapAnswersToQuestionIds,
  findMatchingForm,
  matchSelectedForm,
  extractScore,
} from './helpers'
import {
  computeAccountingStacks,
  computeAspectFormMatrix,
  computeRespondentAnswerDistribution,
  computePerStackPartitionBreakdown,
} from './accounting'
import { CadreOverviewDashboard } from './cadre-dashboard'
import FilterBar from './filter-bar'
import StatsCards from './stats-cards'
import StackingSection from './stacking-section'
import WidgetsGrid from './widgets-grid'

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
  const [widgets, setWidgets] = useState<any[]>([])
  const [accountingStacks, setAccountingStacks] = useState<any[]>([])

  // Fetch Database Responses & Forms
  const { data: overviewData, isLoading: loading } = useQuery({
    queryKey: queryKeys.dashboard.overview.admin,
    queryFn: async () => {
      const { getForms, getAllResponses } = await import('@/lib/repositories/forms.repo')
      const { safeFetchJson } = await import('@/lib/infra/safe-fetch')
      const [responsesData, formsData, v15RespRes] = await Promise.all([
        getAllResponses().catch(() => []),
        getForms().catch(() => []),
        safeFetchJson('/api/responses'),
      ])

      let rawCombined: any[] = Array.isArray(responsesData) ? [...responsesData] : []
      if (v15RespRes.ok && v15RespRes.data && Array.isArray(v15RespRes.data.responses)) {
        rawCombined = [...rawCombined, ...v15RespRes.data.responses]
      }

      const responseMap = new Map<string, any>()
      rawCombined.forEach((r) => {
        const id = r.responseId || r.id || r.docId
        if (id && !responseMap.has(id)) {
          responseMap.set(id, r)
        } else if (!id) {
          responseMap.set(JSON.stringify(r.answers || {}) + (r.submittedAt || ''), r)
        }
      })
      const uniqueResponses = Array.from(responseMap.values())

      const { ScoringEngine } = await import('@/lib/domain/scoring/preview-engine')

      const transformedResponses = uniqueResponses.map((r: any) => {
        const form = findMatchingForm(r, formsData)
        const mappedAnswers = mapAnswersToQuestionIds(r.answers || {}, form || null)

        let calculatedScore = 0
        if (form && form.questions && form.questions.length > 0) {
          try {
            const questionsWithScoring = form.questions.map((q: any) => {
              const type = q.answerType || q.type || 'short-text'
              let scheme: 'none' | 'binary' | 'likert' | 'rating' | 'indicator' = 'none'
              if (type === 'single-choice' || type === 'dropdown' || type === 'binary' || type === 'multiple-choice') scheme = 'binary'
              else if (type === 'indicator-table' || type === 'likert') scheme = 'indicator'
              else if (type === 'rating') scheme = 'rating'
              return { ...q, scoring: q.scoring || { scheme, weight: 1 } }
            })

            const scoring = form.scoring || { totalPoints: 100, mode: 'auto', distribution: {}, overrides: {}, allowOverride: true, autoBalance: true }
            const validation = form.validation || { mode: 'all_required', exceptions: [], allowOverride: true }
            const stages = form.stages && form.stages.length > 0 ? form.stages : [{ id: 'default', name: 'Semua Pertanyaan', order: 0, questionIds: form.questions.map((q: any) => q.id), includeInScoring: true }]

            const engine = new ScoringEngine(questionsWithScoring, scoring, validation, stages)
            const result = engine.calculateScore(mappedAnswers)
            if (result && typeof result.percentage === 'number' && !isNaN(result.percentage)) {
              calculatedScore = Math.round(result.percentage)
            }
          } catch {}
        }

        const storedScore =
          typeof r.score === 'number' && r.score > 0
            ? r.score
            : typeof r.result?.percentage === 'number' && r.result.percentage > 0
            ? r.result.percentage
            : typeof r.totalScore === 'number' && r.totalScore > 0
            ? r.totalScore
            : null

        const finalScore = storedScore !== null ? storedScore : calculatedScore

        return {
          ...r,
          score: finalScore,
          matchedForm: form,
        }
      })

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

      return { responses: transformedResponses, forms: formsData }
    },
  })

  const responses = overviewData?.responses ?? []
  const forms = overviewData?.forms ?? []

  // Filter responses dynamically based on selectedFormId
  const filteredResponses = useMemo(() => {
    if (selectedFormId === 'all') return responses
    return responses.filter((r) => matchSelectedForm(r, selectedFormId))
  }, [responses, selectedFormId, forms])

  // System Stats integrated with filter
  const stats = useMemo(() => {
    const totalForms = forms.length
    const activeForms = forms.filter((f) => f.status === 'published').length
    const totalRespondents = filteredResponses.length

    const scoresList = filteredResponses.map(extractScore).filter((s): s is number => s !== null)
    const avgScore = scoresList.length > 0
      ? Math.round(scoresList.reduce((sum, s) => sum + s, 0) / scoresList.length)
      : (filteredResponses.length > 0 ? 75 : 0)

    const passCount = scoresList.filter((s) => s >= 80).length
    const passRate = scoresList.length > 0 ? Math.round((passCount / scoresList.length) * 100) : 0

    return { totalForms, activeForms, totalRespondents, avgScore, passRate, evaluatedCount: scoresList.length }
  }, [forms, filteredResponses])

  // COMPUTE DYNAMIC ACCOUNTING STACKS FOR DASHBOARD OVERVIEW
  const computedAccountingStacks = useMemo(
    () => computeAccountingStacks(accountingStacks, responses, forms),
    [accountingStacks, responses, forms]
  )

  // COMPUTE PER-ASPECT FORM COMPARISON MATRIX FOR OVERVIEW DASHBOARD
  const aspectFormMatrix = useMemo(
    () => computeAspectFormMatrix(accountingStacks, forms, responses),
    [accountingStacks, forms, responses]
  )

  // DYNAMIC RESPONDENT ANSWER DISTRIBUTION BREAKDOWN FOR PRIMARY/ACTIVE STACK IN OVERVIEW DASHBOARD
  const activeOverviewStackObj = computedAccountingStacks[0] || null

  const respondentAnswerDistribution = useMemo(
    () => computeRespondentAnswerDistribution(activeOverviewStackObj, responses),
    [activeOverviewStackObj, responses]
  )

  // PER-STACKING RESPONDENT PARTITION & CONSOLIDATED DETAILED BREAKDOWN (ALL STACKS)
  const perStackPartitionBreakdown = useMemo(
    () => computePerStackPartitionBreakdown(computedAccountingStacks, responses, respondentAnswerDistribution.totalRes),
    [computedAccountingStacks, responses, respondentAnswerDistribution.totalRes]
  )

  const displayedWidgets = useMemo(() => {
    if (selectedFormId === 'all') return widgets
    return widgets.filter(w => !w.formId || w.formId === selectedFormId)
  }, [widgets, selectedFormId])

  return (
    <div className="flex flex-col min-h-screen bg-[#06060E]">
      <Topbar title="Dashboard Overview" subtitle="Ringkasan data, statistik, dan visualisasi grafik real-time" />

      <div className="flex-1 p-6 space-y-6">
        {/* FILTER BAR BERDASARKAN FORMULIR */}
        <FilterBar selectedFormId={selectedFormId} forms={forms} onFormChange={setSelectedFormId} />

        {/* STATS CARDS INTEGRATED WITH FILTER */}
        <StatsCards stats={stats} selectedFormId={selectedFormId} />

        {/* STACKED ASSESSMENT ACCOUNTING PRETEST VS POSTTEST SECTION */}
        {computedAccountingStacks.length > 0 && (
          <StackingSection
            activeOverviewStackObj={activeOverviewStackObj}
            respondentAnswerDistribution={respondentAnswerDistribution}
            perStackPartitionBreakdown={perStackPartitionBreakdown}
            aspectFormMatrix={aspectFormMatrix}
          />
        )}

        {/* DYNAMIC WIDGETS GRID */}
        <WidgetsGrid
          loading={loading}
          displayedWidgets={displayedWidgets}
          responses={responses}
          selectedFormId={selectedFormId}
        />
      </div>
    </div>
  )
}
