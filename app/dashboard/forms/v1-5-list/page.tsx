'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import { FormVersionHistoryModal } from '@/components/forms/v1_5/FormVersionHistoryModal'
import { FormPreviewModal } from '@/components/forms/v1_5/FormPreviewModal'
import type { FormAggregateDoc } from '@/lib/firebase/repositories/v1_5/v1_5Forms.repo'
import { formAggregateToCanonicalForm } from '@/lib/forms/v1_5/formConverters'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/shared/safeFetch'

export type DerivedLifecycleStatus = 'draft' | 'ready' | 'published' | 'active' | 'archived'

export function getDerivedLifecycle(f: FormAggregateDoc): {
  status: DerivedLifecycleStatus
  label: string
  colorClass: string
  isReady: boolean
} {
  if (f.status === 'archived') {
    return { status: 'archived', label: 'Arsip', colorClass: 'bg-slate-800 text-slate-400 border-slate-700', isReady: false }
  }

  const aspectCount = f.aspects?.length || 0
  const questionCount = f.questions?.length || 0
  const hasZeroQuestionAspect = f.aspects?.some((asp) => {
    const cnt = f.questions?.filter((q) => (q.aspectId || f.aspects[0]?.aspectId) === asp.aspectId).length || 0
    return cnt === 0
  })

  const missingKeyQuestions = (f.questions || []).filter((q) => {
    if (q.type === 'indicator-table' || q.type === 'likert') {
      const indicators = (q as any).presentation?.indicators || (q as any).config?.indicators || []
      return indicators.length === 0
    }
    const isNonScoring = ['biodata-name', 'biodata-email', 'biodata-phone', 'biodata-address', 'biodata-institution', 'short-text', 'long-text', 'text', 'textarea', 'file-upload', 'image', 'signature', 'date'].includes(q.type)
    if (isNonScoring) return false
    return q.answerKey?.kind === 'none' || !(q.answerKey as any)?.correctOptionIds?.length
  })

  const hasTitle = Boolean(f.metadata?.title && f.metadata.title.trim().length > 0)
  const isReady = aspectCount > 0 && questionCount > 0 && !hasZeroQuestionAspect && missingKeyQuestions.length === 0 && hasTitle

  if (f.status === 'published') {
    const activeDistributionCount = (f as any).activeDistributionCount || 0
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

export default function V15FormsDashboardPage() {
  const router = useRouter()
  const { user, userRole } = useAuth()
  const isGlobalRole = ['super_admin', 'admin', 'internal_bpom'].includes(userRole || '')

  const [forms, setForms] = useState<FormAggregateDoc[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Lifecycle Tab & Filter State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [lifecycleTab, setLifecycleTab] = useState<'all' | 'draft' | 'ready' | 'active' | 'archived'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'questions'>('updated')

  // Pagination State (Strict 10 items limit for cost control)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize = 10

  // Action Menu Dropdown State
  const [activeMenuFormId, setActiveMenuFormId] = useState<string | null>(null)

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategory, setNewCategory] = useState('Kuesioner Evaluasi')
  const [newTarget, setNewTarget] = useState('Komunitas & Cadre Pangan')
  const [newKind, setNewKind] = useState<'official' | 'user-created'>('official')
  const [isCreating, setIsCreating] = useState(false)
  const [duplicatingFormId, setDuplicatingFormId] = useState<string | null>(null)

  // Modals for Version History & Preview
  const [selectedHistoryFormId, setSelectedHistoryFormId] = useState<string | null>(null)
  const [previewFormDoc, setPreviewFormDoc] = useState<FormAggregateDoc | null>(null)

  // Distribution Quick Access Modal & Edit Confirm Modal State
  const [distributionModalForm, setDistributionModalForm] = useState<FormAggregateDoc | null>(null)
  const [editConfirmForm, setEditConfirmForm] = useState<FormAggregateDoc | null>(null)
  const [isTogglingCadrePerm, setIsTogglingCadrePerm] = useState(false)
  const [isCreatingNewVersion, setIsCreatingNewVersion] = useState(false)

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Debounced Search Effect
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 250)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Single Lightweight Fetch to Load Form Metadata
  const fetchForms = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { ok, data, error: fetchErr } = await safeFetchJson('/api/v1_5/forms')
      if (ok && data && Array.isArray(data.forms)) {
        const v15Forms = data.forms.filter(
          (f: any) => Boolean(f?.formId) && (Boolean(f?.activeVersionId) || Boolean(f?.aspects) || Boolean(f?.metadata))
        )
        setForms(v15Forms)
      } else {
        setError(fetchErr || 'Gagal memuat daftar formulir.')
      }
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchForms()
  }, [])

  // Categories list derived from forms
  const categories = useMemo(() => {
    const set = new Set<string>()
    forms.forEach((f) => {
      const cat = f.metadata?.category
      if (cat) set.add(cat)
    })
    return Array.from(set)
  }, [forms])

  // Derived Counts for Tabs
  const tabCounts = useMemo(() => {
    let draft = 0
    let ready = 0
    let active = 0
    let archived = 0

    forms.forEach((f) => {
      const { status } = getDerivedLifecycle(f)
      if (status === 'archived') archived++
      else if (status === 'published' || status === 'active') active++
      else if (status === 'ready') ready++
      else draft++
    })

    return { all: forms.length, draft, ready, active, archived }
  }, [forms])

  // Filtered & Sorted Forms List
  const filteredForms = useMemo(() => {
    let list = forms.filter((f) => {
      const derived = getDerivedLifecycle(f)

      // 1. Tab Filter
      if (lifecycleTab === 'draft' && derived.status !== 'draft') return false
      if (lifecycleTab === 'ready' && derived.status !== 'ready') return false
      if (lifecycleTab === 'active' && derived.status !== 'active' && derived.status !== 'published') return false
      if (lifecycleTab === 'archived' && derived.status !== 'archived') return false

      // 2. Category Filter
      if (categoryFilter !== 'all' && (f.metadata?.category || '').toLowerCase() !== categoryFilter.toLowerCase()) {
        return false
      }

      // 3. Debounced Search Match
      if (debouncedSearch.trim()) {
        const term = debouncedSearch.toLowerCase().trim()
        const titleMatch = (f.metadata?.title || '').toLowerCase().includes(term)
        const codeMatch = (f.formId || '').toLowerCase().includes(term)
        const catMatch = (f.metadata?.category || '').toLowerCase().includes(term)
        const descMatch = (f.metadata?.description || '').toLowerCase().includes(term)
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
  }, [forms, lifecycleTab, categoryFilter, debouncedSearch, sortBy])

  // Paginated Subset
  const paginatedForms = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredForms.slice(start, start + pageSize)
  }, [filteredForms, currentPage, pageSize])

  const totalPages = Math.ceil(filteredForms.length / pageSize) || 1

  // Handlers
  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    setIsCreating(true)
    try {
      const res = await fetch('/api/v1_5/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            title: newTitle.trim(),
            description: newDescription.trim() || 'Tuliskan deskripsi dan petunjuk pengisian formulir di sini...',
            category: newCategory,
            target: newTarget,
            kind: newKind,
            status: 'draft',
          },
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal membuat formulir baru.')
      }

      showToast('Formulir V1.5 baru berhasil dibuat!')
      setIsCreateModalOpen(false)
      setNewTitle('')
      setNewDescription('')
      router.push(`/dashboard/forms/${data.form.formId}/builder`)
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  // Toggle Cadre Distribution Permission for Published Forms
  const handleToggleCadrePerm = async (form: FormAggregateDoc) => {
    const currentVal = form.allowCadreDistribution !== false
    const newVal = !currentVal
    setIsTogglingCadrePerm(true)
    try {
      const res = await safeFetchJson(`/api/v1_5/forms/${form.formId}/permission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowCadreDistribution: newVal }),
      })

      if (res.ok && res.data?.success) {
        showToast(`Izin distribusi kader & mitra untuk "${form.metadata?.title || form.formId}" diubah menjadi: ${newVal ? 'DIIZINKAN' : 'DIBATASI'}`)
        setForms((prev) =>
          prev.map((item) =>
            item.formId === form.formId
              ? { ...item, allowCadreDistribution: newVal, metadata: { ...item.metadata, allowCadreDistribution: newVal } }
              : item
          )
        )
        if (distributionModalForm?.formId === form.formId) {
          setDistributionModalForm({
            ...distributionModalForm,
            allowCadreDistribution: newVal,
            metadata: { ...distributionModalForm.metadata, allowCadreDistribution: newVal },
          })
        }
      } else {
        showToast(res.error || 'Gagal mengubah izin distribusi.')
      }
    } catch (err) {
      showToast('Gagal mengubah izin distribusi.')
    } finally {
      setIsTogglingCadrePerm(false)
    }
  }

  // Create & Edit New Version Snapshot Handler upon User Confirmation
  const confirmAndEditNewVersion = async () => {
    if (!editConfirmForm) return
    const formId = editConfirmForm.formId
    setIsCreatingNewVersion(true)
    try {
      const res = await safeFetchJson(`/api/v1_5/forms/${formId}/new-version`, { method: 'POST' })
      if (res.ok && res.data?.success) {
        showToast(`Draft versi baru (${res.data.form?.activeVersionNumber || 2}.0) berhasil dibuat! Membuka Form Builder...`)
        setEditConfirmForm(null)
        router.push(`/dashboard/forms/${formId}/builder`)
      } else {
        showToast(res.error || 'Gagal membuat versi draft baru.')
      }
    } catch (err: any) {
      showToast('Gagal terhubung ke server.')
    } finally {
      setIsCreatingNewVersion(false)
    }
  }

  const handleDuplicateForm = async (formId: string) => {
    setDuplicatingFormId(formId)
    setActiveMenuFormId(null)
    try {
      const res = await fetch(`/api/v1_5/forms/${formId}/duplicate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menduplikat formulir.')
      }
      showToast(`Formulir "${data.form.metadata?.title || 'Salinan'}" berhasil diduplikat!`)
      fetchForms()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    } finally {
      setDuplicatingFormId(null)
    }
  }

  const handleArchiveForm = async (formId: string) => {
    setActiveMenuFormId(null)
    if (!confirm(`Apakah Anda yakin ingin mengarsipkan formulir "${formId}"?`)) return

    try {
      const res = await fetch(`/api/v1_5/forms/${formId}/archive`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal mengarsipkan formulir.')

      showToast('Formulir berhasil diarsipkan.')
      fetchForms()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    }
  }

  const handleRestoreForm = async (formId: string) => {
    setActiveMenuFormId(null)
    try {
      const res = await fetch(`/api/v1_5/forms/${formId}/restore`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal memulihkan formulir.')

      showToast('Formulir berhasil dipulihkan ke workflow aktif.')
      fetchForms()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#06060E] text-slate-100 font-sans" onClick={() => setActiveMenuFormId(null)}>
      <Topbar title="Form Lifecycle Control Center" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* HEADER AREA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
              <span>Formulir</span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                V1.5 Lifecycle
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Kelola assessment, publikasi versi snapshot, dan distribusi kuesioner.
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsCreateModalOpen(true)
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
          >
            <Icon name="plus" className="w-4 h-4" />
            <span>+ Buat Formulir</span>
          </button>
        </div>

        {/* LIFECYCLE NAVIGATION TABS & FILTERS */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800/60">
            {(
              [
                { id: 'all', label: 'Semua', count: tabCounts.all },
                { id: 'draft', label: 'Draft', count: tabCounts.draft },
                { id: 'ready', label: 'Siap', count: tabCounts.ready },
                { id: 'active', label: 'Aktif', count: tabCounts.active },
                { id: 'archived', label: 'Arsip', count: tabCounts.archived },
              ] as const
            ).map((tab) => {
              const isActive = lifecycleTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setLifecycleTab(tab.id)
                    setCurrentPage(1)
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* SEARCH, CATEGORY & SORT BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/80">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Icon name="search" className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari formulir atau kode..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-9 pr-8 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filters & Sorting */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {categories.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                <option value="updated">Terbaru Ditambahkan</option>
                <option value="title">Judul A-Z</option>
                <option value="questions">Jumlah Soal Terbanyak</option>
              </select>

              {/* View Mode Switcher */}
              <div className="flex items-center p-0.5 bg-slate-950/80 border border-slate-800 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Tampilan Grid Card Aesthetic"
                >
                  <Icon name="grid" className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Tampilan Daftar Compact Row"
                >
                  <Icon name="list" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="alertTriangle" className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={fetchForms}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold rounded-lg transition-all"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <Icon name="spinner" className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Memuat metadata lifecycle formulir...</p>
          </div>
        ) : filteredForms.length === 0 ? (
          /* EMPTY STATE */
          <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4 max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto">
              <Icon name="fileText" className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200">
                {debouncedSearch || categoryFilter !== 'all' || lifecycleTab !== 'all'
                  ? 'Tidak ada formulir yang sesuai.'
                  : 'Belum ada formulir'}
              </h3>
              <p className="text-xs text-slate-400">
                {debouncedSearch || categoryFilter !== 'all' || lifecycleTab !== 'all'
                  ? 'Coba ubah kata kunci pencarian atau filter tab Anda.'
                  : 'Mulai buat assessment kuesioner pertama Anda.'}
              </p>
            </div>
            {!debouncedSearch && categoryFilter === 'all' && lifecycleTab === 'all' && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
              >
                <Icon name="plus" className="w-4 h-4" />
                <span>+ Buat Formulir</span>
              </button>
            )}
          </div>
        ) : (
          /* FORM ITEM CONTAINER: GRID VIEW VS COMPACT LIST VIEW */
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {paginatedForms.map((f) => {
              const derived = getDerivedLifecycle(f)
              const aspectCount = f.aspects?.length || 0
              const questionCount = f.questions?.length || 0
              const responseCount = (f as any).responseCount || 0
              const activeDistCount = (f as any).activeDistributionCount || 0
              const isMenuOpen = activeMenuFormId === f.formId
              const lastUpdatedDate = f.updatedAt
                ? new Date(f.updatedAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'

              if (viewMode === 'grid') {
                /* AESTHETIC GRID CARD VIEW */
                return (
                  <div
                    key={f.formId}
                    className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-4 shadow-sm group hover:shadow-emerald-500/5 relative"
                  >
                    {/* TOP BADGES & ACTIONS */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${derived.colorClass}`}
                        >
                          {derived.label.toUpperCase()}
                        </span>

                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {f.metadata?.category || 'Umum'}
                        </span>
                      </div>

                      {/* TITLE & DESCRIPTION */}
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-1">
                          {f.metadata?.title || f.formId}
                        </h3>
                        {f.metadata?.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {f.metadata.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* METRICS & FOOTER */}
                    <div className="space-y-3 pt-2 border-t border-slate-800/60">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-300 font-bold">V{f.activeVersionNumber || 1}.0</span>
                          <span>·</span>
                          <span>{aspectCount} Aspek</span>
                          <span>·</span>
                          <span>{questionCount} Soal</span>
                        </div>

                        <span className="text-[10px] text-slate-400">{lastUpdatedDate}</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Respons & Distribusi</span>
                        <span className="font-bold text-emerald-400">{responseCount} Respons · {activeDistCount} Distribusi</span>
                      </div>

                      {/* CARD ACTIONS FOOTER */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        {derived.status === 'draft' && (
                          <button
                            type="button"
                            onClick={() => router.push(`/dashboard/forms/${f.formId}/builder`)}
                            className="flex-1 py-2 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Icon name="edit" className="w-3.5 h-3.5" />
                            <span>Lanjutkan</span>
                          </button>
                        )}

                        {derived.status === 'ready' && (
                          <button
                            type="button"
                            onClick={() => router.push(`/dashboard/forms/${f.formId}/builder?step=4`)}
                            className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Icon name="checkCircle" className="w-3.5 h-3.5" />
                            <span>Publikasikan</span>
                          </button>
                        )}

                        {(derived.status === 'published' || derived.status === 'active') && (
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            {isGlobalRole ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setDistributionModalForm(f)}
                                  className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer truncate"
                                  title="Atur izin distribusi kader & mitra"
                                >
                                  <Icon name="send" className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">Akses Distribusi</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setEditConfirmForm(f)}
                                  className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                                  title="Pratinjau formulir & konfirmasi pembuatan versi draft baru"
                                >
                                  <Icon name="edit" className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                                  <span>Pratinjau & Edit</span>
                                </button>
                              </>
                            ) : f.allowCadreDistribution !== false ? (
                              <button
                                type="button"
                                onClick={() => router.push(`/dashboard/distributions?formId=${f.formId}`)}
                                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Icon name="send" className="w-3.5 h-3.5 shrink-0" />
                                <span>Buat Kode Distribusi Saya →</span>
                              </button>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-[10px] font-mono font-bold text-rose-400 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20">
                                  🔒 Khusus BPOM Pusat
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPreviewFormDoc(f)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                                >
                                  Pratinjau
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {derived.status === 'archived' && (
                          <button
                            type="button"
                            onClick={() => handleRestoreForm(f.formId)}
                            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Icon name="refresh" className="w-3.5 h-3.5" />
                            <span>Pulihkan</span>
                          </button>
                        )}

                        {/* Secondary Dropdown Menu */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveMenuFormId(isMenuOpen ? null : f.formId)
                            }}
                            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/80 transition-all cursor-pointer"
                          >
                            <Icon name="moreHorizontal" className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 bottom-full mb-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-xl z-20 py-1 space-y-0.5 text-xs text-slate-200"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuFormId(null)
                                  setPreviewFormDoc(f)
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Icon name="eye" className="w-3.5 h-3.5 text-slate-400" />
                                <span>Pratinjau Responden</span>
                              </button>

                              {(derived.status === 'published' || derived.status === 'active') && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuFormId(null)
                                      setDistributionModalForm(f)
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer text-emerald-300"
                                  >
                                    <Icon name="send" className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Akses Distribusi Kader</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuFormId(null)
                                      setEditConfirmForm(f)
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer text-purple-300"
                                  >
                                    <Icon name="edit" className="w-3.5 h-3.5 text-purple-400" />
                                    <span>Pratinjau & Edit Versi</span>
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuFormId(null)
                                  setSelectedHistoryFormId(f.formId)
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Icon name="history" className="w-3.5 h-3.5 text-slate-400" />
                                <span>Riwayat Versi</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuFormId(null)
                                  router.push(`/dashboard/responses?formId=${f.formId}`)
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Icon name="barChart" className="w-3.5 h-3.5 text-slate-400" />
                                <span>Hasil & Respons</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDuplicateForm(f.formId)}
                                disabled={duplicatingFormId === f.formId}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer text-cyan-300"
                              >
                                <Icon name="copy" className="w-3.5 h-3.5 text-cyan-400" />
                                <span>{duplicatingFormId === f.formId ? 'Menduplikat...' : 'Duplikat Formulir'}</span>
                              </button>

                              {derived.status !== 'archived' && (
                                <button
                                  type="button"
                                  onClick={() => handleArchiveForm(f.formId)}
                                  className="w-full text-left px-3.5 py-2 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2 transition-colors cursor-pointer text-rose-400 border-t border-slate-800"
                                >
                                  <Icon name="archive" className="w-3.5 h-3.5" />
                                  <span>Arsipkan</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }

              /* COMPACT ROW LIST VIEW */
              return (
                <div
                  key={f.formId}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 transition-all space-y-3 shadow-sm group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* LEFT: Title & Badges */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors truncate">
                          {f.metadata?.title || f.formId}
                        </h3>

                        <span
                          className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${derived.colorClass}`}
                        >
                          {derived.label.toUpperCase()}
                        </span>

                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {f.metadata?.category || 'Umum'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 flex-wrap">
                        <span className="text-slate-300 font-bold">V{f.activeVersionNumber || 1}.0</span>
                        <span>·</span>
                        <span>{aspectCount} Aspek</span>
                        <span>·</span>
                        <span>{questionCount} Pertanyaan</span>
                      </div>
                    </div>

                    {/* RIGHT: Primary Contextual Action & Menu */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {/* Contextual Primary Action Button */}
                      {derived.status === 'draft' && (
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/forms/${f.formId}/builder`)}
                          className="px-4 py-2 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Icon name="edit" className="w-3.5 h-3.5" />
                          <span>Lanjutkan</span>
                        </button>
                      )}

                      {derived.status === 'ready' && (
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/forms/${f.formId}/builder?step=4`)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Icon name="checkCircle" className="w-3.5 h-3.5" />
                          <span>Publikasikan</span>
                        </button>
                      )}

                      {(derived.status === 'published' || derived.status === 'active') && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDistributionModalForm(f)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Atur izin distribusi kader & mitra"
                          >
                            <Icon name="send" className="w-3.5 h-3.5" />
                            <span>Akses Distribusi</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditConfirmForm(f)}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Pratinjau formulir & konfirmasi pembuatan versi draft baru"
                          >
                            <Icon name="edit" className="w-3.5 h-3.5 text-purple-400" />
                            <span>Pratinjau & Edit</span>
                          </button>
                        </div>
                      )}

                      {derived.status === 'archived' && (
                        <button
                          type="button"
                          onClick={() => handleRestoreForm(f.formId)}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Icon name="refresh" className="w-3.5 h-3.5" />
                          <span>Pulihkan</span>
                        </button>
                      )}

                      {/* Secondary Action Dropdown Menu Trigger */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveMenuFormId(isMenuOpen ? null : f.formId)
                          }}
                          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/80 transition-all cursor-pointer"
                        >
                          <Icon name="moreHorizontal" className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu Content */}
                        {isMenuOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-xl z-20 py-1 space-y-0.5 text-xs text-slate-200"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuFormId(null)
                                setPreviewFormDoc(f)
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Icon name="eye" className="w-3.5 h-3.5 text-slate-400" />
                              <span>Pratinjau Responden</span>
                            </button>

                            {(derived.status === 'published' || derived.status === 'active') && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuFormId(null)
                                    setDistributionModalForm(f)
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer text-emerald-300"
                                >
                                  <Icon name="send" className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Akses Distribusi Kader</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuFormId(null)
                                    setEditConfirmForm(f)
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer text-purple-300"
                                >
                                  <Icon name="edit" className="w-3.5 h-3.5 text-purple-400" />
                                  <span>Pratinjau & Edit Versi</span>
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuFormId(null)
                                setSelectedHistoryFormId(f.formId)
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Icon name="history" className="w-3.5 h-3.5 text-slate-400" />
                              <span>Riwayat Versi</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuFormId(null)
                                router.push(`/dashboard/responses?formId=${f.formId}`)
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Icon name="barChart" className="w-3.5 h-3.5 text-slate-400" />
                              <span>Hasil & Respons</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDuplicateForm(f.formId)}
                              disabled={duplicatingFormId === f.formId}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer text-cyan-300"
                            >
                              <Icon name="copy" className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{duplicatingFormId === f.formId ? 'Menduplikat...' : 'Duplikat Formulir'}</span>
                            </button>

                            {derived.status !== 'archived' && (
                              <button
                                type="button"
                                onClick={() => handleArchiveForm(f.formId)}
                                className="w-full text-left px-3.5 py-2 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2 transition-colors cursor-pointer text-rose-400 border-t border-slate-800"
                              >
                                <Icon name="archive" className="w-3.5 h-3.5" />
                                <span>Arsipkan</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM STATS & TIMESTAMP */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                    <div className="flex items-center gap-3">
                      <span>{responseCount} Respons</span>
                      <span>·</span>
                      <span>{activeDistCount} Distribusi</span>
                    </div>

                    <span>Terakhir diperbarui {lastUpdatedDate}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
            <span className="text-xs text-slate-400">
              Halaman {currentPage} dari {totalPages} ({filteredForms.length} Total Formulir)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-950 disabled:text-slate-600 text-xs text-slate-300 font-semibold border border-slate-800 transition-all cursor-pointer"
              >
                ← Prev
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-950 disabled:text-slate-600 text-xs text-slate-300 font-semibold border border-slate-800 transition-all cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* CREATE NEW FORM MODAL */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Icon name="plus" className="w-4 h-4 text-emerald-400" />
                <span>Buat Draft Formulir V1.5 Baru</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateForm} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Judul Formulir Assessment *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Contoh: Evaluasi Keamanan Pangan Kantin Sekolah"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                />
                <p className="text-[11px] text-slate-500">
                  Pengaturan metadata selengkapnya (deskripsi, kategori, sasaran) dapat disesuaikan langsung di Form Builder.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold shadow-lg cursor-pointer"
                >
                  {isCreating ? 'Memproses...' : 'Buat & Buka Builder →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VERSION HISTORY MODAL */}
      {selectedHistoryFormId && (
        <FormVersionHistoryModal
          isOpen={Boolean(selectedHistoryFormId)}
          formId={selectedHistoryFormId}
          onClose={() => setSelectedHistoryFormId(null)}
        />
      )}

      {/* PREVIEW MODAL */}
      {previewFormDoc && (
        <FormPreviewModal
          isOpen={Boolean(previewFormDoc)}
          canonicalForm={formAggregateToCanonicalForm(previewFormDoc)}
          onClose={() => setPreviewFormDoc(null)}
        />
      )}

      {/* QUICK DISTRIBUTION ACCESS & PERMISSION TOGGLE MODAL */}
      {distributionModalForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setDistributionModalForm(null)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Icon name="send" className="w-4 h-4 text-emerald-400" />
                  <span>Akses Distribusi Kader & Mitra</span>
                </h3>
                <p className="text-[11px] text-slate-400 truncate max-w-sm">
                  {distributionModalForm.metadata?.title || distributionModalForm.formId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDistributionModalForm(null)}
                className="text-slate-400 hover:text-slate-200 text-xs p-1"
              >
                ✕
              </button>
            </div>

            {/* Toggle Sakelar Form Access */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-200">Izin Distribusi Mandiri Kader</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Bila sakelar diaktifkan, kader desa dan mitra dapat melihat formulir ini di menu distribusi mereka dan mencetak kode distribusi unik masing-masing.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isTogglingCadrePerm}
                  onClick={() => handleToggleCadrePerm(distributionModalForm)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                    (distributionModalForm.allowCadreDistribution !== false)
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                  }`}
                >
                  {isTogglingCadrePerm
                    ? '...'
                    : (distributionModalForm.allowCadreDistribution !== false)
                    ? '✓ DIIZINKAN'
                    : '✕ DIBATASI (ADMIN)'}
                </button>
              </div>
            </div>

            {/* Sub-Actions & Navigation */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const fId = distributionModalForm.formId
                  setDistributionModalForm(null)
                  router.push(`/dashboard/distributions?formId=${fId}`)
                }}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Kelola Kode BPOM Pusat →</span>
              </button>

              <button
                type="button"
                onClick={() => setDistributionModalForm(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW & VERSION EDIT CONFIRMATION MODAL */}
      {editConfirmForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setEditConfirmForm(null)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Icon name="edit" className="w-4 h-4 text-purple-400" />
                  <span>Pratinjau & Buat Versi Snapshot Baru</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Konfirmasi sebelum membuka Form Builder untuk formulir yang sedang terpublikasi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditConfirmForm(null)}
                className="text-slate-400 hover:text-slate-200 text-xs p-1"
              >
                ✕
              </button>
            </div>

            {/* Form Info Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">{editConfirmForm.metadata?.title || editConfirmForm.formId}</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  VERSI {editConfirmForm.activeVersionNumber || 1}.0 TERPUBLIKASI
                </span>
              </div>
              <div className="text-slate-400 font-mono text-[11px] flex items-center gap-2">
                <span>{editConfirmForm.aspects?.length || 0} Aspek</span>
                <span>·</span>
                <span>{editConfirmForm.questions?.length || 0} Pertanyaan</span>
              </div>
            </div>

            {/* Safety & Logic Callout */}
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-purple-300">
                <Icon name="checkCircle" className="w-4 h-4 text-purple-400" />
                <span>Versi {editConfirmForm.activeVersionNumber || 1}.0 Tetap Berjalan Aman</span>
              </div>
              <p className="text-[11px] text-purple-300/80 leading-relaxed">
                Versi terpublikasi yang saat ini aktif disebar kepada responden dan kader <strong>tidak akan terganggu atau berubah</strong>. Membuat versi baru akan menghasilkan draft snapshot baru (misal V{(editConfirmForm.activeVersionNumber || 1) + 1}.0) di Form Builder.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const docToPreview = editConfirmForm
                  setEditConfirmForm(null)
                  setPreviewFormDoc(docToPreview)
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Icon name="eye" className="w-3.5 h-3.5 text-slate-400" />
                <span>Pratinjau Responden</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditConfirmForm(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={isCreatingNewVersion}
                  onClick={confirmAndEditNewVersion}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white font-bold text-xs shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  {isCreatingNewVersion ? (
                    'Memproses...'
                  ) : (
                    <>
                      <Icon name="edit" className="w-3.5 h-3.5" />
                      <span>Ya, Buat Draft V{(editConfirmForm.activeVersionNumber || 1) + 1}.0 & Edit →</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-2xl flex items-center gap-2">
          <Icon name="checkCircle" className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
