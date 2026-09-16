'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import type { DistributionDoc } from '@/lib/domain/distributions/distribution-types'
import type { FormAggregateDoc } from '@/lib/repositories/form-versions.repo'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/infra/safe-fetch'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/lib/hooks'
import StatsSection from './stats-section'
import FiltersAndActions from './filters-and-actions'
import DistributionsTable from './distributions-table'
import Pagination from './pagination'
import BulkActionBar from './bulk-action-bar'
import CreateDistributionModal from './create-distribution-modal'
import DetailModal from './detail-modal'
import EditModal from './edit-modal'
import DeleteConfirmModal from './delete-confirm-modal'
import PermissionModal from './permission-modal'
import ToastNotification from './toast-notification'
import type { DistributionDetail, VersionItem } from './types'
import { usePermissionModal } from './use-permission-modal'
import { useDistributionSelection } from './use-distribution-selection'

export default function DistributionsDashboardPage() {
  const { user, userData, userRole } = useAuth()
  const isGlobalRole = ['super_admin'].includes(userRole || '')
  const isPartnershipRole = userRole === 'partnership'
  const toast = useToast()

  // ============ SERVER-STATE (TanStack Query) ============
  const distributionsQuery = useQuery<{ distributions: DistributionDoc[]; publishedForms: FormAggregateDoc[] }>({
    queryKey: queryKeys.distributions.list(userRole),
    queryFn: async () => {
      const [distRes, formRes] = await Promise.all([
        safeFetchJson('/api/distributions'),
        safeFetchJson('/api/forms?status=published'),
      ])

      if (!(distRes.ok && distRes.data && Array.isArray(distRes.data.distributions))) {
        throw new Error(distRes.error || 'Gagal memuat daftar distribusi.')
      }

      const formsList = formRes.ok && formRes.data && Array.isArray(formRes.data.forms) ? formRes.data.forms : []
      const isGlobal = ['super_admin'].includes(userRole || '')

      const permittedForms = formsList.filter((form: FormAggregateDoc) => {
        const isPublished = form.status === 'published' || form.metadata?.status === 'published'
        if (!isPublished) return false
        if (isGlobal) return true
        return form.allowCadreDistribution === true || form.metadata?.allowCadreDistribution === true
      })

      return { distributions: distRes.data.distributions, publishedForms: permittedForms as FormAggregateDoc[] }
    },
  })

  const distributions = distributionsQuery.data?.distributions ?? []
  const publishedForms = distributionsQuery.data?.publishedForms ?? []
  const isLoading = distributionsQuery.isLoading
  const error = distributionsQuery.error ? (distributionsQuery.error as Error).message : null
  const loadData = () => distributionsQuery.refetch()

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [ownerFilter, setOwnerFilter] = useState<string>('all')

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedFormId, setSelectedFormId] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [ownerType] = useState<'super_admin' | 'cadre' | 'partnership'>('super_admin')
  const [versionMode, setVersionMode] = useState<'active' | 'pinned'>('active')
  const [pinnedVersionId, setPinnedVersionId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [isCreating, setIsCreating] = useState(false)


  // Detail & Edit Modal States
  const [selectedDetail, setSelectedDetail] = useState<DistributionDetail | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const [editingDoc, setEditingDoc] = useState<DistributionDoc | null>(null)
  const [, setIsEditOpen] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState<string>('active')
  const [editVersionMode, setEditVersionMode] = useState<'active' | 'pinned'>('active')
  const [editPinnedVersionId, setEditPinnedVersionId] = useState('')
  const [editExpiresAt, setEditExpiresAt] = useState('')

  // Versions State
  const [availableVersions, setAvailableVersions] = useState<VersionItem[]>([])

  // Permission Modal state & logic (extracted hook)
  const permissionModal = usePermissionModal({ publishedForms, toast, loadData })
  const {
    isPermissionModalOpen,
    setIsPermissionModalOpen,
    setPermissionFormId,
    permissionFormId,
    permissionAllowCadre,
    setPermissionAllowCadre,
    permissionVersions,
    permissionActiveVersionId,
    setPermissionActiveVersionId,
    isLoadingPermissionVersions,
    isSavingPermission,
    openPermissionModal,
    loadPermissionFormDetails,
    handleSavePermission,
  } = permissionModal

  const fetchFormVersions = async (formId: string) => {
    if (!formId) return
    try {
      const res = await safeFetchJson(`/api/forms/${formId}/versions`)
      if (res.ok && res.data && Array.isArray(res.data.versions)) {
        setAvailableVersions(res.data.versions)
        if (res.data.versions.length > 0) {
          setPinnedVersionId(res.data.versions[0].versionId)
        }
      }
    } catch (e) {
      console.warn('Failed to fetch versions for form:', formId)
    }
  }

  const openDetailModal = async (distId: string) => {
    setIsDetailLoading(true)
    setIsDetailOpen(true)
    setSelectedDetail(null)
    try {
      const res = await safeFetchJson(`/api/distributions/${distId}`)
      if (res.ok && res.data && res.data.distribution) {
        setSelectedDetail({
          distribution: res.data.distribution,
          formSummary: res.data.formSummary,
        })
      } else {
        toast.show(res.error || 'Gagal memuat detail distribusi.')
      }
    } catch (err) {
      toast.show('Gagal memuat detail distribusi.')
    } finally {
      setIsDetailLoading(false)
    }
  }

  const openEditModal = (distribution: DistributionDoc) => {
    setEditingDoc(distribution)
    setEditTitle(distribution.title || '')
    setEditDescription(distribution.description || '')
    setEditStatus(distribution.status || 'active')
    setEditVersionMode(distribution.versionMode || 'active')
    setEditPinnedVersionId(distribution.pinnedVersionId || '')
    setEditExpiresAt(distribution.expiresAt || '')
    setIsEditOpen(true)
    if (distribution.formId) {
      fetchFormVersions(distribution.formId)
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDoc) return
    setIsSavingEdit(true)
    try {
      const payload = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        status: editStatus,
        versionMode: editVersionMode,
        pinnedVersionId: editVersionMode === 'pinned' ? editPinnedVersionId : '',
        expiresAt: editExpiresAt || '',
      }
      const res = await safeFetchJson(`/api/distributions/${editingDoc.distributionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok && res.data) {
        toast.show('Kode distribusi berhasil diperbarui!')
        setIsEditOpen(false)
        loadData()
      } else {
        toast.show(res.error || 'Gagal memperbarui distribusi.')
      }
    } catch (err: any) {
      toast.show('Terjadi kesalahan saat menyimpan perubahan.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Cost Control & Pagination States
  const [pageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Preserve loadData side-effect: reset selectedFormId + fetch its versions
  // whenever published forms (re)load.
  useEffect(() => {
    if (publishedForms.length > 0) {
      setSelectedFormId(publishedForms[0].formId)
      fetchFormVersions(publishedForms[0].formId)
    }
  }, [publishedForms])

  // Filtered List Client-Side
  const filteredDistributions = useMemo(() => {
    return distributions.filter((distribution) => {
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        (distribution.title || '').toLowerCase().includes(term) ||
        (distribution.code || '').toLowerCase().includes(term) ||
        (distribution.ownerName || '').toLowerCase().includes(term) ||
        (distribution.formId || '').toLowerCase().includes(term)

      const matchesStatus = statusFilter === 'all' || distribution.status === statusFilter
      const matchesOwner = ownerFilter === 'all' || distribution.ownerType === ownerFilter

      return matchesSearch && matchesStatus && matchesOwner
    })
  }, [distributions, searchTerm, statusFilter, ownerFilter])

  // Subsets for Pagination
  const paginatedDistributions = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredDistributions.slice(start, start + pageSize)
  }, [filteredDistributions, currentPage, pageSize])

  const totalPages = Math.ceil(filteredDistributions.length / pageSize) || 1

  // Stats
  const stats = useMemo(() => {
    const total = distributions.length
    const active = distributions.filter((distribution) => distribution.status === 'active').length
    const paused = distributions.filter((distribution) => distribution.status === 'paused').length
    const expired = distributions.filter((distribution) => distribution.status === 'expired').length
    return { total, active, paused, expired }
  }, [distributions])

  // Checkbox Multi-Selection & Delete handlers (extracted hook)
  const selection = useDistributionSelection({ filteredDistributions, toast, loadData })
  const {
    selectedDistIds,
    setSelectedDistIds,
    deleteTargetDoc,
    setDeleteTargetDoc,
    isExecutingDelete,
    toggleSelectDist,
    toggleSelectAll,
    handleDeleteClick,
    handleBulkDeleteClick,
    confirmDeleteDistribution,
  } = selection

  // Create Distribution Handler
  const handleCreateDistribution = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFormId) {
      toast.show('Pilih formulir resmi terlebih dahulu.')
      return
    }

    setIsCreating(true)
    try {
      const resolvedOwnerType = userRole === 'cadre' ? 'cadre' : userRole === 'partnership' ? 'partnership' : ownerType

      const res = await fetch('/api/distributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: selectedFormId,
          title: customTitle.trim() || undefined,
          description: customDescription.trim() || undefined,
          ownerType: resolvedOwnerType,
          targetUserId: user?.uid,
          targetUserName: userData?.displayName || user?.displayName || user?.email?.split('@')[0],
          versionMode,
          pinnedVersionId: versionMode === 'pinned' ? pinnedVersionId : undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal membuat kode distribusi.')
      }

      toast.show(`Kode distribusi "${data.distribution.code}" berhasil dibuat!`)
      setIsCreateModalOpen(false)
      setCustomTitle('')
      setCustomDescription('')
      loadData()
    } catch (err: any) {
      toast.show(`Error: ${err.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  // Toggle Pause/Resume Handler
  const handleTogglePause = async (distId: string) => {
    try {
      const res = await safeFetchJson(`/api/distributions/${distId}/pause`, {
        method: 'POST',
      })
      if (res.ok && res.data) {
        toast.show(res.data.message || 'Status distribusi berhasil diubah.')
        loadData()
      } else {
        toast.show(res.error || 'Gagal mengubah status distribusi.')
      }
    } catch (err: any) {
      toast.show(`Error: ${err.message}`)
    }
  }

  // Copy Link Helper
  const copyPublicLink = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/form/${code}`
    navigator.clipboard.writeText(url)
    toast.show(`Tautan publik "${url}" disalin ke clipboard!`)
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      <Topbar
        title="Manajemen Distribusi & Tautan Publik"
        subtitle="Kelola kode distribusi resmi, hak akses kader/kemitraan, dan resolusi versi formulir"
      />

      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        <FiltersAndActions
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          ownerFilter={ownerFilter}
          onOwnerChange={setOwnerFilter}
          isGlobalRole={isGlobalRole}
          isPartnershipRole={isPartnershipRole}
          onRefresh={loadData}
          onOpenPermissionModal={() => openPermissionModal()}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
        />

        <StatsSection stats={stats} />

        <DistributionsTable
          distributions={paginatedDistributions}
          filteredCount={filteredDistributions.length}
          selectedDistIds={selectedDistIds}
          isLoading={isLoading}
          error={error}
          onLoadData={loadData}
          onToggleSelectDist={toggleSelectDist}
          onToggleSelectAll={toggleSelectAll}
          onOpenDetail={openDetailModal}
          onOpenEdit={openEditModal}
          onCopyLink={copyPublicLink}
          onTogglePause={handleTogglePause}
          onDeleteClick={handleDeleteClick}
        />

        {filteredDistributions.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredDistributions.length}
            onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
            onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          />
        )}
      </div>

      <BulkActionBar
        selectedCount={selectedDistIds.length}
        onCancel={() => setSelectedDistIds([])}
        onBulkDelete={handleBulkDeleteClick}
      />

      <CreateDistributionModal
        isOpen={isCreateModalOpen}
        publishedForms={publishedForms}
        selectedFormId={selectedFormId}
        onSelectForm={(formId) => {
          setSelectedFormId(formId)
          fetchFormVersions(formId)
        }}
        customTitle={customTitle}
        onCustomTitleChange={setCustomTitle}
        customDescription={customDescription}
        onCustomDescriptionChange={setCustomDescription}
        versionMode={versionMode}
        onVersionModeChange={setVersionMode}
        pinnedVersionId={pinnedVersionId}
        onPinnedVersionIdChange={setPinnedVersionId}
        availableVersions={availableVersions}
        expiresAt={expiresAt}
        onExpiresAtChange={setExpiresAt}
        isCreating={isCreating}
        onSubmit={handleCreateDistribution}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <DetailModal
        isOpen={isDetailOpen}
        isLoading={isDetailLoading}
        detail={selectedDetail}
        onClose={() => setIsDetailOpen(false)}
        onCopyLink={copyPublicLink}
      />

      <EditModal
        editingDoc={editingDoc}
        editTitle={editTitle}
        onEditTitleChange={setEditTitle}
        editDescription={editDescription}
        onEditDescriptionChange={setEditDescription}
        editStatus={editStatus}
        onEditStatusChange={setEditStatus}
        editVersionMode={editVersionMode}
        onEditVersionModeChange={setEditVersionMode}
        editPinnedVersionId={editPinnedVersionId}
        onEditPinnedVersionIdChange={setEditPinnedVersionId}
        availableVersions={availableVersions}
        editExpiresAt={editExpiresAt}
        onEditExpiresAtChange={setEditExpiresAt}
        isSavingEdit={isSavingEdit}
        onSubmit={handleSaveEdit}
        onClose={() => setIsEditOpen(false)}
      />

      <DeleteConfirmModal
        target={deleteTargetDoc}
        selectedCount={selectedDistIds.length}
        isExecuting={isExecutingDelete}
        onConfirm={confirmDeleteDistribution}
        onClose={() => setDeleteTargetDoc(null)}
      />

      <PermissionModal
        isOpen={isPermissionModalOpen}
        publishedForms={publishedForms}
        permissionFormId={permissionFormId}
        onPermissionFormIdChange={(formId) => {
          setPermissionFormId(formId)
          loadPermissionFormDetails(formId)
        }}
        permissionAllowCadre={permissionAllowCadre}
        onToggleAllowCadre={() => setPermissionAllowCadre(!permissionAllowCadre)}
        permissionVersions={permissionVersions}
        permissionActiveVersionId={permissionActiveVersionId}
        onSetActiveVersionId={setPermissionActiveVersionId}
        isLoadingPermissionVersions={isLoadingPermissionVersions}
        isSavingPermission={isSavingPermission}
        onSave={handleSavePermission}
        onClose={() => setIsPermissionModalOpen(false)}
      />

      <ToastNotification visible={toast.visible} message={toast.message} />
    </div>
  )
}
