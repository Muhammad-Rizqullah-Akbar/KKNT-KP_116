'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import { Icon } from '@/components/ui/Icons'
import { FormVersionHistoryModal } from '@/features/form-builder/components/versioning/FormVersionHistoryModal'
import { FormPreviewModal } from '@/features/form-builder/components/preview/FormPreviewModal'
import type { FormAggregateDoc } from '@/lib/repositories/form-versions.repo'
import { formAggregateToCanonicalForm } from '@/lib/domain/forms/form-converters'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/infra/safe-fetch'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/lib/hooks/use-toast'
import {
  deriveCategories,
  computeTabCounts,
  filterForms,
  type LifecycleTab,
  type ViewMode,
  type SortBy,
} from './forms-utils'
import FormsLifecycleFilter from './forms-lifecycle-filter'
import FormsCard from './forms-card'
import FormsListRow from './forms-list-row'

export default function V15FormsDashboardPage() {
  const router = useRouter()
  const { user, userRole } = useAuth()
  const isGlobalRole = ['super_admin'].includes(userRole || '')

  const queryClient = useQueryClient()

  // ============ SERVER-STATE (TanStack Query) ============
  const formsQuery = useQuery<FormAggregateDoc[]>({
    queryKey: queryKeys.forms.list,
    queryFn: async () => {
      const [formsRes, distRes, respRes] = await Promise.all([
        safeFetchJson('/api/forms'),
        safeFetchJson('/api/distributions'),
        safeFetchJson('/api/responses'),
      ])

      if (!(formsRes.ok && formsRes.data && Array.isArray(formsRes.data.forms))) {
        throw new Error(formsRes.error || 'Gagal memuat daftar formulir.')
      }

      const allDists: any[] = distRes.ok && distRes.data && Array.isArray(distRes.data.distributions) ? distRes.data.distributions : []
      const allResps: any[] = respRes.ok && respRes.data && Array.isArray(respRes.data.responses) ? respRes.data.responses : []

      // Lookup map for distribution code / ID -> formId
      const distCodeToFormIdMap = new Map<string, string>()
      allDists.forEach((distribution: any) => {
        const targetFormId = distribution.formId || distribution.form?.formId
        if (targetFormId) {
          if (distribution.code) distCodeToFormIdMap.set(String(distribution.code).toLowerCase().trim(), targetFormId)
          if (distribution.distributionCode) distCodeToFormIdMap.set(String(distribution.distributionCode).toLowerCase().trim(), targetFormId)
          if (distribution.distributionId) distCodeToFormIdMap.set(String(distribution.distributionId).toLowerCase().trim(), targetFormId)
        }
      })

      const enrichedForms = formsRes.data.forms
        .filter((form: any) => Boolean(form?.formId) && (Boolean(form?.activeVersionId) || Boolean(form?.aspects) || Boolean(form?.metadata)))
        .map((form: any) => {
          const formIdStr = String(form.formId || form.id || '').trim()

          // Count active distributions for this form
          const activeDistributionCount = allDists.filter(
            (distribution: any) => String(distribution.formId || distribution.form?.formId || '').trim() === formIdStr
          ).length

          // Count responses for this form
          const responseCount = allResps.filter((response: any) => {
            const responseFormId = String(response.formId || response.metadata?.formId || '').trim()
            if (responseFormId && responseFormId === formIdStr) return true

            const code = String(response.distributionCode || response.code || response.metadata?.distributionCode || '').toLowerCase().trim()
            if (code && distCodeToFormIdMap.has(code)) {
              return distCodeToFormIdMap.get(code) === formIdStr
            }
            return false
          }).length

          return {
            ...form,
            activeDistributionCount,
            responseCount,
          }
        })

      return enrichedForms
    },
  })

  const forms = formsQuery.data ?? []
  const isLoading = formsQuery.isLoading
  const error = formsQuery.error ? (formsQuery.error as Error).message : null

  // Lifecycle Tab & Filter State
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [lifecycleTab, setLifecycleTab] = useState<LifecycleTab>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<SortBy>('updated')

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

  // Edit Form Name Modal State (Edit tanpa ubah versi)
  const [editingTitleForm, setEditingTitleForm] = useState<FormAggregateDoc | null>(null)
  const [editTitleInput, setEditTitleInput] = useState('')
  const [editDescriptionInput, setEditDescriptionInput] = useState('')
  const [editCategoryInput, setEditCategoryInput] = useState('')
  const [editTargetInput, setEditTargetInput] = useState('')
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false)

  const handleOpenEditTitleModal = (form: FormAggregateDoc) => {
    setEditingTitleForm(form)
    setEditTitleInput(form.metadata?.title || '')
    setEditDescriptionInput(form.metadata?.description || '')
    setEditCategoryInput(form.metadata?.category || 'Umum')
    setEditTargetInput(form.metadata?.target || 'Umum')
    setActiveMenuFormId(null)
  }

  const handleSaveTitleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTitleForm || !editTitleInput.trim()) return
    setIsUpdatingTitle(true)
    try {
      const res = await safeFetchJson(`/api/forms/${editingTitleForm.formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            title: editTitleInput.trim(),
            description: editDescriptionInput.trim(),
            category: editCategoryInput.trim(),
            target: editTargetInput.trim(),
          },
        }),
      })

      if (res.ok && res.data?.success) {
        showToast('Nama formulir berhasil diperbarui tanpa mengubah versi!')
        setEditingTitleForm(null)
        fetchForms()
      } else {
        showToast(res.error || 'Gagal memperbarui nama formulir.')
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    } finally {
      setIsUpdatingTitle(false)
    }
  }
  const [isTogglingCadrePerm, setIsTogglingCadrePerm] = useState(false)
  const [isCreatingNewVersion, setIsCreatingNewVersion] = useState(false)

  // Delete & Bulk Delete State
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([])
  const [formToDelete, setFormToDelete] = useState<FormAggregateDoc | null>(null)
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [isDeletingForm, setIsDeletingForm] = useState(false)

  const handleSelectFormToggle = (formId: string) => {
    setSelectedFormIds((prev) =>
      prev.includes(formId) ? prev.filter((id) => id !== formId) : [...prev, formId]
    )
  }

  const handleSelectAllToggle = (availableForms: FormAggregateDoc[]) => {
    const allIds = availableForms.map((form) => form.formId)
    if (selectedFormIds.length === allIds.length && allIds.length > 0) {
      setSelectedFormIds([])
    } else {
      setSelectedFormIds(allIds)
    }
  }

  const handleConfirmDeleteSingle = async () => {
    if (!formToDelete) return
    setIsDeletingForm(true)
    try {
      const res = await safeFetchJson(`/api/forms/${formToDelete.formId}`, {
        method: 'DELETE',
      })
      if (res.ok && res.data?.success) {
        showToast(`Formulir "${formToDelete.metadata?.title || formToDelete.formId}" berhasil dihapus secara permanen.`)
        setSelectedFormIds((prev) => prev.filter((id) => id !== formToDelete.formId))
        setFormToDelete(null)
        fetchForms()
      } else {
        showToast(res.error || 'Gagal menghapus formulir.')
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    } finally {
      setIsDeletingForm(false)
    }
  }

  const handleConfirmBulkDelete = async () => {
    if (selectedFormIds.length === 0) return
    setIsDeletingForm(true)
    try {
      const deletePromises = selectedFormIds.map((id) =>
        safeFetchJson(`/api/forms/${id}`, { method: 'DELETE' })
      )
      await Promise.all(deletePromises)
      showToast(`${selectedFormIds.length} formulir terpilih berhasil dihapus secara massal!`)
      setSelectedFormIds([])
      setIsBulkDeleteModalOpen(false)
      fetchForms()
    } catch (err: any) {
      showToast(`Error menghapus massal: ${err.message}`)
    } finally {
      setIsDeletingForm(false)
    }
  }

  // Toast Notification
  const { visible: toastVisible, message: toastMessage, show: showToast } = useToast(3500)

  // Debounced Search Effect
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 250)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Concurrent Fetch to Load Form Metadata, Distributions, & Responses Integration
  const fetchForms = () => formsQuery.refetch()

  // Categories list derived from forms
  const categories = useMemo(() => deriveCategories(forms), [forms])

  // Derived Counts for Tabs
  const tabCounts = useMemo(() => computeTabCounts(forms), [forms])

  // Filtered & Sorted Forms List
  const filteredForms = useMemo(
    () => filterForms(forms, { lifecycleTab, categoryFilter, debouncedSearch, sortBy }),
    [forms, lifecycleTab, categoryFilter, debouncedSearch, sortBy]
  )

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
      const res = await fetch('/api/forms', {
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
      const res = await safeFetchJson(`/api/forms/${form.formId}/permission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowCadreDistribution: newVal }),
      })

      if (res.ok && res.data?.success) {
        showToast(`Izin distribusi kader & mitra untuk "${form.metadata?.title || form.formId}" diubah menjadi: ${newVal ? 'DIIZINKAN' : 'DIBATASI'}`)
        queryClient.setQueryData<FormAggregateDoc[]>(['forms', 'list'], (prev) =>
          (prev ?? []).map((item) =>
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
      const res = await safeFetchJson(`/api/forms/${formId}/new-version`, { method: 'POST' })
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
      const res = await fetch(`/api/forms/${formId}/duplicate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menduplikat formulir.')
      }
      showToast(`Formulir "${data.form.metadata?.title || 'Baru'}" berhasil diduplikat!`)
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
      const res = await fetch(`/api/forms/${formId}/archive`, { method: 'POST' })
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
      const res = await fetch(`/api/forms/${formId}/restore`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal memulihkan formulir.')

      showToast('Formulir berhasil dipulihkan ke workflow aktif.')
      fetchForms()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    }
  }

  const handleResponses = (formId: string) => {
    router.push(`/dashboard/responses?formId=${formId}`)
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

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Link
              href="/dashboard/forms/new"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all shrink-0"
            >
              <Icon name="sparkles" className="w-4 h-4 text-purple-200" />
              <span>Buka Form Builder V1.5 Terbaru</span>
            </Link>

            <Link
              href="/dashboard/form-builder"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition-all shrink-0"
            >
              <Icon name="filePlus" className="w-4 h-4 text-cyan-400" />
              <span>Builder Legacy V1.0</span>
            </Link>

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
        </div>

        {/* LIFECYCLE NAVIGATION TABS & FILTERS */}
        <FormsLifecycleFilter
          lifecycleTab={lifecycleTab}
          tabCounts={tabCounts}
          searchTerm={searchTerm}
          categories={categories}
          categoryFilter={categoryFilter}
          sortBy={sortBy}
          viewMode={viewMode}
          selectedFormIds={selectedFormIds}
          filteredFormsCount={filteredForms.length}
          onTabChange={(tab) => {
            setLifecycleTab(tab)
            setCurrentPage(1)
          }}
          onSearchChange={(value) => {
            setSearchTerm(value)
            setCurrentPage(1)
          }}
          onCategoryChange={(value) => {
            setCategoryFilter(value)
            setCurrentPage(1)
          }}
          onSortChange={(value) => setSortBy(value)}
          onViewModeChange={(mode) => setViewMode(mode)}
          onSelectAll={() => handleSelectAllToggle(filteredForms)}
          onBulkDelete={() => setIsBulkDeleteModalOpen(true)}
        />

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
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
            {paginatedForms.map((form) => {
              const isMenuOpen = activeMenuFormId === form.formId

              if (viewMode === 'grid') {
                /* AESTHETIC GRID CARD VIEW */
                return (
                  <FormsCard
                    key={form.formId}
                    form={form}
                    selected={selectedFormIds.includes(form.formId)}
                    onToggleSelect={handleSelectFormToggle}
                    menuOpen={isMenuOpen}
                    onMenuToggle={() => setActiveMenuFormId(isMenuOpen ? null : form.formId)}
                    onMenuClose={() => setActiveMenuFormId(null)}
                    isGlobalRole={isGlobalRole}
                    duplicatingFormId={duplicatingFormId}
                    onRestore={handleRestoreForm}
                    onPreview={setPreviewFormDoc}
                    onDistribution={setDistributionModalForm}
                    onEditVersion={setEditConfirmForm}
                    onEditTitle={handleOpenEditTitleModal}
                    onHistory={setSelectedHistoryFormId}
                    onResponses={handleResponses}
                    onDuplicate={handleDuplicateForm}
                    onArchive={handleArchiveForm}
                    onDelete={setFormToDelete}
                  />
                )
              }

              /* COMPACT ROW LIST VIEW */
              return (
                <FormsListRow
                  key={form.formId}
                  form={form}
                  menuOpen={isMenuOpen}
                  onMenuToggle={() => setActiveMenuFormId(isMenuOpen ? null : form.formId)}
                  onMenuClose={() => setActiveMenuFormId(null)}
                  duplicatingFormId={duplicatingFormId}
                  onRestore={handleRestoreForm}
                  onPreview={setPreviewFormDoc}
                  onDistribution={setDistributionModalForm}
                  onEditVersion={setEditConfirmForm}
                  onEditTitle={handleOpenEditTitleModal}
                  onHistory={setSelectedHistoryFormId}
                  onResponses={handleResponses}
                  onDuplicate={handleDuplicateForm}
                  onArchive={handleArchiveForm}
                  onDelete={setFormToDelete}
                />
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

      {/* EDIT FORM NAME MODAL (Edit tanpa ubah versi) */}
      {editingTitleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Icon name="edit" className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Ubah Nama & Informasi Formulir</h3>
                  <p className="text-xs text-slate-400">
                    Versi {editingTitleForm.activeVersionNumber || 1} tetap dipertahankan tanpa membuat versi baru.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTitleForm(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTitleSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 flex items-center gap-2">
                <Icon name="info" className="w-4 h-4 shrink-0 text-purple-400" />
                <span>Mengubah nama formulir tidak akan mengubah versi aktif snapshot.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama / Judul Formulir Baru <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitleInput}
                  onChange={(e) => setEditTitleInput(e.target.value)}
                  placeholder="Masukkan nama/judul formulir..."
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm font-semibold rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={editDescriptionInput}
                  onChange={(e) => setEditDescriptionInput(e.target.value)}
                  placeholder="Keterangan singkat formulir..."
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-4 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kategori</label>
                  <input
                    type="text"
                    value={editCategoryInput}
                    onChange={(e) => setEditCategoryInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Responden</label>
                  <input
                    type="text"
                    value={editTargetInput}
                    onChange={(e) => setEditTargetInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTitleForm(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingTitle || !editTitleInput.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isUpdatingTitle ? 'Menyimpan...' : 'Simpan Nama'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SINGLE DELETE CONFIRMATION MODAL */}
      {formToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setFormToDelete(null)}
        >
          <div
            className="bg-[#0e0e1a] border border-rose-500/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-slideUp font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Icon name="trash" className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100">Konfirmasi Hapus Formulir</h3>
                <p className="text-xs text-rose-400/80">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p className="leading-relaxed">
                Apakah Anda yakin ingin menghapus formulir berikut secara permanen dari database?
              </p>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 font-mono">
                <div className="font-bold text-slate-100 text-sm font-sans">{formToDelete.metadata?.title || 'Formulir Tanpa Judul'}</div>
                <div className="text-slate-400 text-[11px]">ID: {formToDelete.formId}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFormToDelete(null)}
                disabled={isDeletingForm}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isDeletingForm}
                onClick={handleConfirmDeleteSingle}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isDeletingForm ? <Icon name="spinner" className="w-4 h-4 animate-spin text-white" /> : <Icon name="trash" className="w-4 h-4" />}
                <span>{isDeletingForm ? 'Menghapus...' : 'Ya, Hapus Permanen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {isBulkDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsBulkDeleteModalOpen(false)}
        >
          <div
            className="bg-[#0e0e1a] border border-rose-500/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-slideUp font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Icon name="trash" className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100">Konfirmasi Hapus Massal</h3>
                <p className="text-xs text-rose-400/80">Penghapusan {selectedFormIds.length} formulir terpilih</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.03] p-3.5 rounded-2xl border border-white/[0.06]">
              Anda akan menghapus <strong className="text-rose-400">{selectedFormIds.length} formulir</strong> yang dicentang secara permanen dari Firestore. Seluruh konfigurasi formulir tersebut akan dibuang.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                disabled={isDeletingForm}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isDeletingForm}
                onClick={handleConfirmBulkDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isDeletingForm ? <Icon name="spinner" className="w-4 h-4 animate-spin text-white" /> : <Icon name="trash" className="w-4 h-4" />}
                <span>{isDeletingForm ? 'Menghapus Massal...' : 'Ya, Hapus Massal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastVisible && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-2xl flex items-center gap-2">
          <Icon name="checkCircle" className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
