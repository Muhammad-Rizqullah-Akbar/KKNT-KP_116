'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import { useAuth } from '@/context/AuthContext'
import { queryKeys } from '@/lib/query-keys'
import {
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
  const { userData, userRole } = useAuth()
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

  // Muat preferensi widget & stacking dari penyimpanan browser.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const savedWidgets = localStorage.getItem('dashboard_widgets_cms_config_v5') || localStorage.getItem('dashboard_widgets_config')
      if (savedWidgets) {
        const parsed = JSON.parse(savedWidgets)
        if (Array.isArray(parsed)) setWidgets(parsed.filter((w: any) => w.enabled))
      }
    } catch { /* abaikan */ }
    try {
      const savedStacks = localStorage.getItem('dashboard_accounting_stack_v5')
      if (savedStacks) {
        const parsed = JSON.parse(savedStacks)
        if (Array.isArray(parsed)) setAccountingStacks(parsed.filter((s: any) => s.enabled !== false))
      }
    } catch { /* abaikan */ }
  }, [])

  // Fetch forms + daftar response TERBATAS (proyeksi ringan).
  // BIAYA: tidak lagi membaca seluruh koleksi response. Statistik memakai
  // endpoint ringkasan (count aggregation), daftar memakai paged + limit.
  const { data: overviewData, isLoading: loading } = useQuery({
    queryKey: queryKeys.dashboard.overview.admin,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { getForms } = await import('@/lib/repositories/forms.repo')
      const formsData = await getForms().catch(() => [])
      return { responses: [], forms: formsData }
    },
  })

  // RINGKASAN HEMAT BIAYA (count aggregation + limit kecil).
  // Statistik TIDAK dihitung dari daftar response penuh, tetapi dari
  // endpoint ringkasan yang memakai count query. Ini memotong biaya baca
  // secara drastis saat data bertambah besar.
  const { data: summary } = useQuery({
    queryKey: [...queryKeys.dashboard.overview.admin, 'summary'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { safeFetchJson } = await import('@/lib/infra/safe-fetch')
      const res = await safeFetchJson<any>('/api/responses/analytics')
      if (!res.ok || !res.data?.data) return null
      return res.data.data as {
        total: number
        submitted: number
        inProgress: number
        formsCount: number
        breakdown: { id: string; title: string; total: number; submitted: number }[]
      }
    },
  })

  // Daftar response terbatas (proyeksi ringan) untuk widget & stacking.
  // Paged + limit 100 — bukan seluruh koleksi.
  const { data: pagedResponses } = useQuery({
    queryKey: [...queryKeys.dashboard.overview.admin, 'paged'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { safeFetchJson } = await import('@/lib/infra/safe-fetch')
      const res = await safeFetchJson<any>('/api/responses?paged=true&limit=100&status=all')
      if (!res.ok || !res.data || !Array.isArray(res.data.responses)) return []
      return res.data.responses as any[]
    },
  })

  const responses = useMemo(() => {
    const paged = pagedResponses ?? []
    const base = overviewData?.responses ?? []
    return base.length > 0 ? base : paged
  }, [overviewData, pagedResponses])
  const forms = overviewData?.forms ?? []

  // Filter responses dynamically based on selectedFormId
  const filteredResponses = useMemo(() => {
    if (selectedFormId === 'all') return responses
    return responses.filter((r) => matchSelectedForm(r, selectedFormId))
  }, [responses, selectedFormId, forms])

  // System Stats — pakai ringkasan (murah) bila tersedia, fallback ke hitung lokal.
  const stats = useMemo(() => {
    const totalForms = forms.length
    const activeForms = forms.filter((f) => f.status === 'published').length

    if (summary) {
      const selected = selectedFormId === 'all'
        ? summary
        : summary.breakdown.find((b) => b.id === selectedFormId) || { total: 0, submitted: 0, inProgress: 0 }
      const evaluated = filteredResponses
        .map(extractScore)
        .filter((s): s is number => s !== null)
      const scoresList = evaluated.length > 0 ? evaluated : []
      const avgScore = scoresList.length > 0
        ? Math.round(scoresList.reduce((a, b) => a + b, 0) / scoresList.length)
        : 0
      const passCount = scoresList.filter((s) => s >= 80).length
      const passRate = scoresList.length > 0 ? Math.round((passCount / scoresList.length) * 100) : 0
      return {
        totalForms,
        activeForms,
        totalRespondents: selected.total,
        avgScore,
        passRate,
        evaluatedCount: scoresList.length,
      }
    }

    const totalRespondents = filteredResponses.length
    const scoresList = filteredResponses.map(extractScore).filter((s): s is number => s !== null)
    const avgScore = scoresList.length > 0
      ? Math.round(scoresList.reduce((sum, s) => sum + s, 0) / scoresList.length)
      : 0
    const passCount = scoresList.filter((s) => s >= 80).length
    const passRate = scoresList.length > 0 ? Math.round((passCount / scoresList.length) * 100) : 0
    return { totalForms, activeForms, totalRespondents, avgScore, passRate, evaluatedCount: scoresList.length }
  }, [forms, filteredResponses, summary, selectedFormId])

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
