'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import type { DistributionDoc } from '@/lib/forms/v1_5/distributionTypes'
import type { FormAggregateDoc } from '@/lib/firebase/repositories/v1_5/v1_5Forms.repo'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/shared/safeFetch'

export default function DistributionsDashboardPage() {
  const router = useRouter()
  const { user, userData, userRole } = useAuth()

  const [distributions, setDistributions] = useState<DistributionDoc[]>([])
  const [publishedForms, setPublishedForms] = useState<FormAggregateDoc[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [ownerFilter, setOwnerFilter] = useState<string>('all')

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedFormId, setSelectedFormId] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [ownerType, setOwnerType] = useState<'admin' | 'cadre' | 'partnership'>('admin')
  const [versionMode, setVersionMode] = useState<'active' | 'pinned'>('active')
  const [pinnedVersionId, setPinnedVersionId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Form Selector Search & Filter States
  const [formSearchQuery, setFormSearchQuery] = useState('')
  const [formCategoryFilter, setFormCategoryFilter] = useState('all')

  // Detail & Edit Modal States
  const [selectedDetail, setSelectedDetail] = useState<{ distribution: DistributionDoc; formSummary: any } | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const [editingDoc, setEditingDoc] = useState<DistributionDoc | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState<string>('active')
  const [editVersionMode, setEditVersionMode] = useState<'active' | 'pinned'>('active')
  const [editPinnedVersionId, setEditPinnedVersionId] = useState('')
  const [editExpiresAt, setEditExpiresAt] = useState('')

  // Checkbox Multi-Selection State for Bulk Delete
  const [selectedDistIds, setSelectedDistIds] = useState<string[]>([])

  // Custom Delete Confirmation Modal State
  const [deleteTargetDoc, setDeleteTargetDoc] = useState<{ id: string; code: string; title: string } | null>(null)
  const [isExecutingDelete, setIsExecutingDelete] = useState(false)

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const openDetailModal = async (distId: string) => {
    setIsDetailLoading(true)
    setIsDetailOpen(true)
    setSelectedDetail(null)
    try {
      const res = await safeFetchJson(`/api/v1_5/distributions/${distId}`)
      if (res.ok && res.data && res.data.distribution) {
        setSelectedDetail({
          distribution: res.data.distribution,
          formSummary: res.data.formSummary,
        })
      } else {
        showToast(res.error || 'Gagal memuat detail distribusi.')
      }
    } catch (err) {
      showToast('Gagal memuat detail distribusi.')
    } finally {
      setIsDetailLoading(false)
    }
  }

  const openEditModal = (d: DistributionDoc) => {
    setEditingDoc(d)
    setEditTitle(d.title || '')
    setEditDescription(d.description || '')
    setEditStatus(d.status || 'active')
    setEditVersionMode(d.versionMode || 'active')
    setEditPinnedVersionId(d.pinnedVersionId || '')
    setEditExpiresAt(d.expiresAt || '')
    setIsEditOpen(true)
    if (d.formId) {
      fetchFormVersions(d.formId)
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
      const res = await safeFetchJson(`/api/v1_5/distributions/${editingDoc.distributionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok && res.data) {
        showToast('Kode distribusi berhasil diperbarui!')
        setIsEditOpen(false)
        loadData()
      } else {
        showToast(res.error || 'Gagal memperbarui distribusi.')
      }
    } catch (err: any) {
      showToast('Terjadi kesalahan saat menyimpan perubahan.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Versions State
  const [availableVersions, setAvailableVersions] = useState<any[]>([])

  const fetchFormVersions = async (formId: string) => {
    if (!formId) return
    try {
      const res = await safeFetchJson(`/api/v1_5/forms/${formId}/versions`)
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

  // Cost Control & Pagination States
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Load Distributions & Published Forms from API
  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [distRes, formRes] = await Promise.all([
        safeFetchJson('/api/v1_5/distributions'),
        safeFetchJson('/api/v1_5/forms?status=published'),
      ])

      if (distRes.ok && distRes.data && Array.isArray(distRes.data.distributions)) {
        setDistributions(distRes.data.distributions)
        setLastFetchedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      } else {
        setError(distRes.error || 'Gagal memuat daftar distribusi.')
      }

      let formsList = formRes.ok && formRes.data && Array.isArray(formRes.data.forms) ? formRes.data.forms : []
      // Strictly enforce status === published AND allowCadreDistribution === true (only Admin-permitted forms)
      const permittedForms = formsList.filter(
        (f: any) =>
          (f.status === 'published' || f.metadata?.status === 'published') &&
          (f.allowCadreDistribution === true || f.metadata?.allowCadreDistribution === true)
      )

      setPublishedForms(permittedForms)
      if (permittedForms.length > 0) {
        setSelectedFormId(permittedForms[0].formId)
        fetchFormVersions(permittedForms[0].formId)
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan sistem saat memuat data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtered List Client-Side
  const filteredDistributions = useMemo(() => {
    return distributions.filter((d) => {
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        (d.title || '').toLowerCase().includes(term) ||
        (d.code || '').toLowerCase().includes(term) ||
        (d.ownerName || '').toLowerCase().includes(term) ||
        (d.formId || '').toLowerCase().includes(term)

      const matchesStatus = statusFilter === 'all' || d.status === statusFilter
      const matchesOwner = ownerFilter === 'all' || d.ownerType === ownerFilter

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
    const active = distributions.filter((d) => d.status === 'active').length
    const paused = distributions.filter((d) => d.status === 'paused').length
    const expired = distributions.filter((d) => d.status === 'expired').length
    return { total, active, paused, expired }
  }, [distributions])

  // Checkbox Multi-Selection Toggles
  const toggleSelectDist = (distId: string) => {
    setSelectedDistIds((prev) =>
      prev.includes(distId) ? prev.filter((id) => id !== distId) : [...prev, distId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedDistIds.length === filteredDistributions.length) {
      setSelectedDistIds([])
    } else {
      setSelectedDistIds(filteredDistributions.map((d) => d.distributionId))
    }
  }

  // Create Distribution Handler
  const handleCreateDistribution = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFormId) {
      showToast('Pilih formulir resmi terlebih dahulu.')
      return
    }

    setIsCreating(true)
    try {
      const resolvedOwnerType = userRole === 'cadre' ? 'cadre' : userRole === 'partnership' ? 'partnership' : ownerType

      const res = await fetch('/api/v1_5/distributions', {
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

      showToast(`Kode distribusi "${data.distribution.code}" berhasil dibuat!`)
      setIsCreateModalOpen(false)
      setCustomTitle('')
      setCustomDescription('')
      loadData()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  // Toggle Pause/Resume Handler
  const handleTogglePause = async (distId: string) => {
    try {
      const res = await safeFetchJson(`/api/v1_5/distributions/${distId}/pause`, {
        method: 'POST',
      })
      if (res.ok && res.data) {
        showToast(res.data.message || 'Status distribusi berhasil diubah.')
        loadData()
      } else {
        showToast(res.error || 'Gagal mengubah status distribusi.')
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    }
  }

  // Delete Distribution Handlers
  const handleDeleteClick = (distId: string, code: string, title: string) => {
    setDeleteTargetDoc({ id: distId, code, title })
  }

  const handleBulkDeleteClick = () => {
    if (selectedDistIds.length === 0) return
    setDeleteTargetDoc({
      id: 'bulk',
      code: `${selectedDistIds.length} Kode Distribusi`,
      title: `${selectedDistIds.length} item yang dipilih`,
    })
  }

  const confirmDeleteDistribution = async () => {
    if (!deleteTargetDoc) return
    setIsExecutingDelete(true)
    try {
      if (deleteTargetDoc.id === 'bulk') {
        const idsToDelete = [...selectedDistIds]
        await Promise.all(
          idsToDelete.map((id) =>
            safeFetchJson(`/api/v1_5/distributions/${id}`, { method: 'DELETE' })
          )
        )
        showToast(`${idsToDelete.length} kode distribusi berhasil dihapus secara masal!`)
        setSelectedDistIds([])
      } else {
        const res = await safeFetchJson(`/api/v1_5/distributions/${deleteTargetDoc.id}`, {
          method: 'DELETE',
        })
        if (res.ok && res.data) {
          showToast(`Kode distribusi "${deleteTargetDoc.code}" berhasil dihapus.`)
          setSelectedDistIds((prev) => prev.filter((id) => id !== deleteTargetDoc.id))
        } else {
          showToast(res.error || 'Gagal menghapus kode distribusi.')
        }
      }
      setDeleteTargetDoc(null)
      loadData()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    } finally {
      setIsExecutingDelete(false)
    }
  }

  // Copy Link Helper
  const copyPublicLink = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/form/${code}`
    navigator.clipboard.writeText(url)
    showToast(`Tautan publik "${url}" disalin ke clipboard!`)
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      <Topbar
        title="Manajemen Distribusi & Tautan Publik"
        subtitle="Kelola kode distribusi resmi, hak akses kader/kemitraan, dan resolusi versi formulir"
      />

      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari kode / judul / kader..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif Menyebar</option>
              <option value="paused">Dijeda</option>
              <option value="expired">Masa Berlaku Habis</option>
            </select>

            {/* Owner Filter */}
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Semua Pemilik</option>
              <option value="admin">BPOM Pusat</option>
              <option value="cadre">Kader Desa</option>
              <option value="partnership">Kemitraan</option>
            </select>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={loadData}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
              title="Refresh Data"
            >
              <Icon name="rotateCcw" className="w-4 h-4 text-cyan-400" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Create Distribution Trigger Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <Icon name="plus" className="w-4 h-4" />
              <span>Buat Kode Distribusi</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Distribusi</span>
              <Icon name="share2" className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-100 mt-2">{stats.total}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Aktif Menyebar</span>
              <Icon name="checkCircle" className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-300 mt-2">{stats.active}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Dijeda Sementara</span>
              <Icon name="pauseCircle" className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-amber-300 mt-2">{stats.paused}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Masa Berlaku Habis</span>
              <Icon name="clock" className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-rose-300 mt-2">{stats.expired}</p>
          </div>
        </div>

        {/* Distribution Cards & Table */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md">
          {/* Table Select-All Header Control */}
          {filteredDistributions.length > 0 && (
            <div className="p-3.5 px-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 text-xs">
              <label className="flex items-center gap-2.5 font-mono font-bold text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectedDistIds.length > 0 && selectedDistIds.length === filteredDistributions.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                />
                <span>Pilih Semua ({filteredDistributions.length} Kode Distribusi)</span>
              </label>

              {selectedDistIds.length > 0 && (
                <span className="text-[11px] font-mono text-cyan-400 font-bold bg-cyan-950/80 px-2.5 py-0.5 rounded-md border border-cyan-500/30">
                  {selectedDistIds.length} Terpilih
                </span>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-xs gap-3">
              <Icon name="loader" className="w-5 h-5 text-cyan-400 animate-spin" />
              <span>Memuat daftar kode distribusi...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-rose-300 space-y-2">
              <p className="font-semibold">{error}</p>
              <button onClick={loadData} className="px-3 py-1.5 rounded-lg bg-rose-950 border border-rose-500/40 text-rose-200">
                Coba Ulang
              </button>
            </div>
          ) : filteredDistributions.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <Icon name="share2" className="w-10 h-10 mx-auto text-slate-700" />
              <p className="text-sm font-semibold text-slate-300">Belum Ada Kode Distribusi</p>
              <p className="text-xs text-slate-500">Klik "+ Buat Kode Distribusi" untuk menghasilkan tautan publik baru.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {paginatedDistributions.map((d) => {
                const isActive = d.status === 'active'
                const isPaused = d.status === 'paused'
                const isChecked = selectedDistIds.includes(d.distributionId)

                return (
                  <div
                    key={d.distributionId}
                    className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors border-b border-slate-800/50 last:border-0 ${
                      isChecked ? 'bg-slate-800/60' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 max-w-xl">
                      {/* Item Checkbox */}
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectDist(d.distributionId)}
                        className="w-4 h-4 rounded accent-cyan-500 cursor-pointer mt-1 flex-shrink-0"
                      />

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono text-cyan-400 font-extrabold text-sm px-2.5 py-0.5 rounded-lg bg-cyan-950 border border-cyan-500/30">
                            {d.code}
                          </span>

                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase border ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : isPaused
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {d.status}
                          </span>

                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                            {d.versionMode === 'pinned' ? `Pinned (${d.pinnedVersionId})` : 'Auto-Active (Versi Publik Terbaru)'}
                          </span>

                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-500/30 capitalize">
                            {d.ownerType === 'admin' ? 'BPOM Pusat' : d.ownerType === 'cadre' ? 'Kader Desa' : 'Kemitraan'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-100">{d.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-1">{d.description || 'Tidak ada deskripsi tambahan.'}</p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono pt-1">
                          <span>Form ID: {d.formId}</span>
                          <span>•</span>
                          <span>Pemilik: {d.ownerName}</span>
                          <span>•</span>
                          <span>Dibuat: {new Date(d.createdAt).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 self-start md:self-center flex-wrap pl-7 md:pl-0">
                      <button
                        type="button"
                        onClick={() => openDetailModal(d.distributionId)}
                        className="px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Icon name="eye" className="w-3.5 h-3.5 text-purple-300" />
                        <span>Detail & Form</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(d)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Icon name="edit" className="w-3.5 h-3.5 text-amber-400" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => copyPublicLink(d.code)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Icon name="copy" className="w-3.5 h-3.5" />
                        <span>Salin Link</span>
                      </button>

                      <a
                        href={`/form/${d.code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Icon name="externalLink" className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Buka</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleTogglePause(d.distributionId)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          isPaused
                            ? 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-200 border-emerald-500/40'
                            : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 border-amber-500/40'
                        }`}
                      >
                        <Icon name={isPaused ? 'play' : 'pause'} className="w-3.5 h-3.5" />
                        <span>{isPaused ? 'Aktifkan' : 'Jeda'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteClick(d.distributionId, d.code, d.title)}
                        className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title="Hapus Kode Distribusi Permanen"
                      >
                        <Icon name="trash" className="w-3.5 h-3.5 text-rose-400" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination Controls Footer */}
        {filteredDistributions.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <div>
              Menampilkan <span className="font-bold text-slate-200">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-bold text-slate-200">{Math.min(currentPage * pageSize, filteredDistributions.length)}</span> dari <span className="font-bold text-slate-200">{filteredDistributions.length}</span> distribusi
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 font-bold"
              >
                ← Prev
              </button>

              <span className="font-mono text-cyan-400 font-bold px-2">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 font-bold"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING BULK ACTION BAR */}
      {selectedDistIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center justify-between gap-4 px-6 py-3.5 rounded-full bg-slate-900/95 border-2 border-rose-500/80 text-slate-100 shadow-2xl backdrop-blur-md max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
            <span className="text-xs font-mono font-bold text-slate-200">
              <strong className="text-rose-400 font-extrabold text-sm">{selectedDistIds.length}</strong> Kode Terpilih
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDistIds([])}
              className="px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleBulkDeleteClick}
              className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all"
            >
              <Icon name="trash" className="w-3.5 h-3.5 text-white" />
              <span>Hapus Semua Terpilih ({selectedDistIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* CREATE DISTRIBUTION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">Terbitkan Kode Distribusi Baru</h3>
                <p className="text-xs text-slate-400">Pilih formulir terpublikasi & tentukan parameter kanal distribusi</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDistribution} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-2">Pilih Formulir Resmi (Diizinkan Admin) *</label>
                {publishedForms.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Icon name="alertTriangle" className="w-4 h-4 text-amber-400" />
                      Tidak Ada Formulir Yang Diizinkan Admin
                    </p>
                    <p className="text-[11px] text-slate-300">
                      Belum ada formulir terpublikasi yang diizinkan Admin untuk didistribusikan. Silakan aktifkan sakelar <strong>"Akses Kader & Mitra"</strong> pada menu <strong>Daftar Formulir</strong> terlebih dahulu.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {publishedForms.map((f) => {
                      const isSelected = selectedFormId === f.formId
                      const aspectCount = f.aspects?.length || 0
                      const questionCount = f.questions?.length || 0

                      return (
                        <div
                          key={f.formId}
                          onClick={() => {
                            setSelectedFormId(f.formId)
                            fetchFormVersions(f.formId)
                          }}
                          className={`cursor-pointer p-3.5 rounded-2xl border transition-all space-y-2 relative group ${
                            isSelected
                              ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                          }`}
                        >
                          {/* Selection badge check */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                              v{f.activeVersionNumber || 1.5}
                            </span>

                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                                  : 'border-slate-700 text-transparent group-hover:border-slate-500'
                              }`}
                            >
                              <Icon name="check" className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          </div>

                          <div>
                            <h4 className={`font-bold text-xs line-clamp-2 transition-colors ${isSelected ? 'text-cyan-200' : 'text-slate-200'}`}>
                              {f.metadata?.title || f.title || f.formId}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                              {f.metadata?.category || 'Kuesioner Evaluasi'}
                            </p>
                          </div>

                          <div className="pt-1 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span className="text-cyan-400 font-bold">{aspectCount} Aspek</span>
                            <span>•</span>
                            <span>{questionCount} Soal</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Judul Channel / Kelompok Distribusi (Opsional)</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Contoh: Pendampingan Posyandu Desa Sukamaju"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Deskripsi Tambahan (Opsional)</label>
                <textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Catatan khusus untuk kader atau responden..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mode Versi Kuesioner</label>
                <select
                  value={versionMode}
                  onChange={(e) => setVersionMode(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none focus:border-cyan-500"
                >
                  <option value="active">Auto-Active (Selalu Ikut Versi Terbaru)</option>
                  <option value="pinned">Pinned (Kunci Versi Snapshot Spesifik)</option>
                </select>
              </div>

              {versionMode === 'pinned' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Pilih Snapshot Versi Yang Dikunci</label>
                  <select
                    value={pinnedVersionId}
                    onChange={(e) => setPinnedVersionId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none focus:border-cyan-500"
                  >
                    {availableVersions.map((v) => (
                      <option key={v.versionId} value={v.versionId}>
                        Versi {v.versionNumber} ({new Date(v.createdAt).toLocaleDateString('id-ID')}) - {v.changeLogSummary || 'Snapshot versi'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Batas Masa Berlaku (Opsional)</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-extrabold shadow-lg shadow-cyan-600/20 flex items-center gap-2"
                >
                  {isCreating ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="check" className="w-4 h-4" />}
                  <span>{isCreating ? 'Menerbitkan...' : 'Terbitkan Kode'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Inspeksi Detail Kode Distribusi
                </span>
                <h3 className="text-base font-extrabold text-slate-100 mt-0.5">
                  {selectedDetail?.distribution.code || 'Memuat...'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>

            {isDetailLoading ? (
              <div className="py-12 flex items-center justify-center text-xs text-slate-400 gap-2">
                <Icon name="loader" className="w-5 h-5 text-cyan-400 animate-spin" />
                <span>Mengambil metadata distribusi & skema kuesioner...</span>
              </div>
            ) : selectedDetail ? (
              <div className="space-y-5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] text-slate-400 font-mono uppercase">Judul Channel</p>
                    <p className="text-xs font-bold text-slate-100 mt-0.5">{selectedDetail.distribution.title}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] text-slate-400 font-mono uppercase">Status Distribusi</p>
                    <p className="text-xs font-bold text-emerald-400 uppercase mt-0.5">
                      {selectedDetail.distribution.status} ✓
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] text-slate-400 font-mono uppercase">Pemilik (Owner)</p>
                    <p className="text-xs font-bold text-purple-300 mt-0.5">
                      {selectedDetail.distribution.ownerName} ({selectedDetail.distribution.ownerType})
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] text-slate-400 font-mono uppercase">Resolusi Versi</p>
                    <p className="text-xs font-mono font-bold text-cyan-300 mt-0.5">
                      {selectedDetail.distribution.versionMode === 'pinned'
                        ? `Pinned (${selectedDetail.distribution.pinnedVersionId})`
                        : 'Auto-Active (Versi Publik Terbaru)'}
                    </p>
                  </div>
                </div>

                {selectedDetail.formSummary && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">
                        Skema Formulir: {selectedDetail.formSummary.title}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                        {selectedDetail.formSummary.questionCount} Pertanyaan
                      </span>
                    </div>

                    <div className="space-y-1.5 font-mono text-[11px] max-h-44 overflow-y-auto pr-1">
                      {selectedDetail.formSummary.questions.map((q: any, i: number) => (
                        <div key={q.id || i} className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-2">
                          <span className="text-slate-300 truncate">#{i + 1}. {q.prompt}</span>
                          <span className="text-[9px] text-slate-500 uppercase flex-shrink-0">{q.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
                  <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase">Tautan Publik Kuesioner</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/form/${selectedDetail.distribution.code}`}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => copyPublicLink(selectedDetail.distribution.code)}
                      className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <Icon name="copy" className="w-3.5 h-3.5" />
                      <span>Salin</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">Edit Kode Distribusi</h3>
                <p className="text-xs text-slate-400">Kode Akses: <strong className="font-mono text-cyan-400">{editingDoc.code}</strong></p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Judul Channel</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Deskripsi Tambahan</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status Operasional</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none focus:border-cyan-500"
                  >
                    <option value="active">Aktif Menyebar</option>
                    <option value="paused">Dijeda Sementara</option>
                    <option value="archived">Diarsipkan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Mode Versi</label>
                  <select
                    value={editVersionMode}
                    onChange={(e) => setEditVersionMode(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none focus:border-cyan-500"
                  >
                    <option value="active">Auto-Active (Terbaru)</option>
                    <option value="pinned">Pinned (Kunci Versi)</option>
                  </select>
                </div>
              </div>

              {editVersionMode === 'pinned' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Versi Terkunci</label>
                  {availableVersions.length > 0 ? (
                    <select
                      value={editPinnedVersionId}
                      onChange={(e) => setEditPinnedVersionId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none focus:border-cyan-500"
                    >
                      {availableVersions.map((v) => (
                        <option key={v.versionId} value={v.versionId}>
                          Versi {v.versionNumber} ({new Date(v.createdAt).toLocaleDateString('id-ID')}) - {v.changeLogSummary || 'Snapshot versi'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={editPinnedVersionId}
                      onChange={(e) => setEditPinnedVersionId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5"
                      placeholder="Contoh: form_evaluasi_v1"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Batas Masa Berlaku (Opsional)</label>
                <input
                  type="datetime-local"
                  value={editExpiresAt}
                  onChange={(e) => setEditExpiresAt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-white font-bold shadow-lg shadow-amber-600/20 flex items-center gap-1.5"
                >
                  {isSavingEdit ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="check" className="w-4 h-4" />}
                  <span>{isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL (SINGLE & BULK DELETE) */}
      {deleteTargetDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={() => setDeleteTargetDoc(null)}
        >
          <div
            className="relative w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0">
                <Icon name="trash" className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-100">
                  {deleteTargetDoc.id === 'bulk' ? 'Hapus Masal Kode Distribusi?' : 'Hapus Kode Distribusi?'}
                </h3>
                <p className="text-xs text-rose-400 font-mono font-bold mt-0.5">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Target Hapus:</span>
                <strong className="font-mono text-cyan-400 font-bold text-sm">{deleteTargetDoc.code}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Keterangan:</span>
                <strong className="text-slate-200 truncate max-w-[200px]">{deleteTargetDoc.title}</strong>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus {deleteTargetDoc.id === 'bulk' ? `${selectedDistIds.length} kode distribusi terpilih` : 'kode distribusi ini'} secara permanen dari database Firestore?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetDoc(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isExecutingDelete}
                onClick={confirmDeleteDistribution}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-extrabold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all"
              >
                {isExecutingDelete ? (
                  <>
                    <Icon name="loader" className="w-4 h-4 animate-spin text-white" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Icon name="trash" className="w-4 h-4 text-white" />
                    <span>{deleteTargetDoc.id === 'bulk' ? `Ya, Hapus All (${selectedDistIds.length})` : 'Ya, Hapus Permanen'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-3">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
