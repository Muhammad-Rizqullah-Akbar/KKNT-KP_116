import type { FormAggregateDoc } from '@/lib/repositories/form-versions.repo'

// ============================================================================
// TYPES
// ============================================================================

export type DerivedLifecycleStatus = 'draft' | 'ready' | 'published' | 'active' | 'archived'
export type LifecycleTab = 'all' | 'draft' | 'ready' | 'active' | 'archived'
export type ViewMode = 'grid' | 'list'
export type SortBy = 'updated' | 'title' | 'questions'

export type DerivedLifecycle = {
  status: DerivedLifecycleStatus
  label: string
  colorClass: string
  isReady: boolean
}

// Form aggregate enriched at fetch time with per-form distribution/response counts.
export type EnrichedFormAggregateDoc = FormAggregateDoc & {
  activeDistributionCount?: number
  responseCount?: number
}

export type TabCounts = {
  all: number
  draft: number
  ready: number
  active: number
  archived: number
}

// ============================================================================
// LIFECYCLE DERIVATION
// ============================================================================

export function getDerivedLifecycle(form: EnrichedFormAggregateDoc): DerivedLifecycle {
  if (form.status === 'archived') {
    return { status: 'archived', label: 'Arsip', colorClass: 'bg-slate-800 text-slate-400 border-slate-700', isReady: false }
  }

  const aspectCount = form.aspects?.length || 0
  const questionCount = form.questions?.length || 0
  const hasZeroQuestionAspect = form.aspects?.some((asp) => {
    const cnt = form.questions?.filter((question) => (question.aspectId || form.aspects[0]?.aspectId) === asp.aspectId).length || 0
    return cnt === 0
  })

  const missingKeyQuestions = (form.questions || []).filter((question) => {
    if (question.type === 'indicator-table' || question.type === 'likert') {
      const indicators = (question as any).presentation?.indicators || (question as any).config?.indicators || []
      return indicators.length === 0
    }
    const targetAspect = form.aspects?.find((aspect: any) => aspect.aspectId === (question.aspectId || form.aspects?.[0]?.aspectId))
    const isNonScoring = targetAspect?.isScored === false || ['biodata-name', 'biodata-email', 'biodata-phone', 'biodata-address', 'biodata-institution', 'short-text', 'long-text', 'text', 'textarea', 'file-upload', 'image', 'signature', 'date'].includes(question.type)
    if (isNonScoring) return false
    return question.answerKey?.kind === 'none' || !(question.answerKey as any)?.correctOptionIds?.length
  })

  const hasTitle = Boolean(form.metadata?.title && form.metadata.title.trim().length > 0)
  const isReady = aspectCount > 0 && questionCount > 0 && !hasZeroQuestionAspect && missingKeyQuestions.length === 0 && hasTitle

  if (form.status === 'published') {
    const activeDistributionCount = form.activeDistributionCount || 0
    if (activeDistributionCount > 0) {
      return { status: 'active', label: 'Aktif', colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10', isReady: true }
    }
    return { status: 'published', label: 'Terpublikasi', colorClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', isReady: true }
  }

  // Status is draft
  if (isReady) {
    return { status: 'ready', label: 'Siap', colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40', isReady: true }
  }

  return { status: 'draft', label: 'Draft', colorClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40', isReady: false }
}

// ============================================================================
// DERIVED LISTS (PURE)
// ============================================================================

export function deriveCategories(forms: FormAggregateDoc[]): string[] {
  const set = new Set<string>()
  forms.forEach((form) => {
    const cat = form.metadata?.category
    if (cat) set.add(cat)
  })
  return Array.from(set)
}

export function computeTabCounts(forms: FormAggregateDoc[]): TabCounts {
  let draft = 0
  let ready = 0
  let active = 0
  let archived = 0

  forms.forEach((form) => {
    const { status } = getDerivedLifecycle(form)
    if (status === 'archived') archived++
    else if (status === 'published' || status === 'active') active++
    else if (status === 'ready') ready++
    else draft++
  })

  return { all: forms.length, draft, ready, active, archived }
}

export function filterForms(
  forms: FormAggregateDoc[],
  opts: {
    lifecycleTab: LifecycleTab
    categoryFilter: string
    debouncedSearch: string
    sortBy: SortBy
  },
): FormAggregateDoc[] {
  const { lifecycleTab, categoryFilter, debouncedSearch, sortBy } = opts

  const list = forms.filter((form) => {
    const derived = getDerivedLifecycle(form)

    // 1. Tab Filter
    if (lifecycleTab === 'draft' && derived.status !== 'draft') return false
    if (lifecycleTab === 'ready' && derived.status !== 'ready') return false
    if (lifecycleTab === 'active' && derived.status !== 'active' && derived.status !== 'published') return false
    if (lifecycleTab === 'archived' && derived.status !== 'archived') return false

    // 2. Category Filter
    if (categoryFilter !== 'all' && (form.metadata?.category || '').toLowerCase() !== categoryFilter.toLowerCase()) {
      return false
    }

    // 3. Debounced Search Match
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase().trim()
      const titleMatch = (form.metadata?.title || '').toLowerCase().includes(term)
      const codeMatch = (form.formId || '').toLowerCase().includes(term)
      const catMatch = (form.metadata?.category || '').toLowerCase().includes(term)
      const descMatch = (form.metadata?.description || '').toLowerCase().includes(term)
      if (!titleMatch && !codeMatch && !catMatch && !descMatch) return false
    }

    return true
  })

  // Sorting
  return list.sort((a, b) => {
    if (sortBy === 'title') {
      return (a.metadata?.title || '').localeCompare(b.metadata?.title || '')
    }
    if (sortBy === 'questions') {
      return (b.questions?.length || 0) - (a.questions?.length || 0)
    }
    // default: updated date desc
    const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime()
    const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime()
    return dateB - dateA
  })
}
