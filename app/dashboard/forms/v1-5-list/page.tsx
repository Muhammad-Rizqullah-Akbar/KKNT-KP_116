'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import { FormVersionHistoryModal } from '@/components/forms/v1_5/FormVersionHistoryModal'
import { FormPreviewModal } from '@/components/forms/v1_5/FormPreviewModal'
import type { FormAggregateDoc } from '@/lib/firebase/repositories/v1_5/v1_5Forms.repo'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/shared/safeFetch'

export default function V15FormsDashboardPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [forms, setForms] = useState<FormAggregateDoc[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // View & Filters
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Duplication State
  const [duplicatingFormId, setDuplicatingFormId] = useState<string | null>(null)

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('Kuesioner Evaluasi')
  const [newKind, setNewKind] = useState<'official' | 'user-created'>('official')
  const [isCreating, setIsCreating] = useState(false)

  // Version History Modal
  const [selectedHistoryFormId, setSelectedHistoryFormId] = useState<string | null>(null)

  // Preview Modal
  const [previewFormDoc, setPreviewFormDoc] = useState<FormAggregateDoc | null>(null)

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Cost Control & Pagination States
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Load V1.5 Aggregate Forms List from API (Single Fetch to Minimize Read Costs)
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
        setLastFetchedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      } else {
        setError(fetchErr || 'Gagal memuat daftar formulir V1.5.')
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

  // Flexible Client-Side Filter & Search (ZERO Read Cost on Filter Switch)
  const filteredForms = useMemo(() => {
    return forms.filter((f) => {
      // 1. Status Filter
      if (statusFilter !== 'all' && f.status !== statusFilter) return false

      // 2. Category Filter
      if (categoryFilter !== 'all' && (f.metadata?.category || '').toLowerCase() !== categoryFilter.toLowerCase()) return false

      // 3. Search Term Match
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim()
        const titleMatch = (f.metadata?.title || '').toLowerCase().includes(term)
        const codeMatch = (f.formId || '').toLowerCase().includes(term)
        const catMatch = (f.metadata?.category || '').toLowerCase().includes(term)
        const descMatch = (f.metadata?.description || '').toLowerCase().includes(term)
        if (!titleMatch && !codeMatch && !catMatch && !descMatch) return false
      }

      return true
    })
  }, [forms, statusFilter, categoryFilter, searchTerm])

  // Paginated Forms Subset
  const paginatedForms = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredForms.slice(start, start + pageSize)
  }, [filteredForms, currentPage, pageSize])

  const totalPages = Math.ceil(filteredForms.length / pageSize) || 1

  // Stats
  const stats = useMemo(() => {
    const total = forms.length
    const published = forms.filter((f) => f.status === 'published').length
    const draft = forms.filter((f) => f.status === 'draft').length
    const archived = forms.filter((f) => f.status === 'archived').length
    return { total, published, draft, archived }
  }, [forms])

  // Create Form Handler
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
            category: newCategory,
            kind: newKind,
            target: 'Komunitas & Cadre Pangan',
            description: 'Formulir penilaian BPOM V1.5...',
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
      router.push(`/dashboard/forms/${data.form.formId}/builder`)
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  // Duplicate Form V1.5 Handler
  const handleDuplicateForm = async (formId: string, title?: string) => {
    setDuplicatingFormId(formId)
    try {
      const res = await fetch(`/api/v1_5/forms/${formId}/duplicate`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menduplikat formulir V1.5.')
      }

      showToast(`Formulir V1.5 "${data.form.metadata?.title || 'Salinan'}" berhasil diduplikat!`)
      fetchForms()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    } finally {
      setDuplicatingFormId(null)
    }
  }

  // Archive Form Handler
  const handleArchiveForm = async (formId: string) => {
    if (!confirm(`Apakah Anda yakin ingin mengarsipkan formulir V1.5 "${formId}"?`)) return

    try {
      const res = await fetch(`/api/v1_5/forms/${formId}/archive`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengarsipkan formulir.')
      }

      showToast('Formulir V1.5 berhasil diarsipkan.')
      fetchForms()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    }
  }

  // Copy ID Helper
  const copyFormId = (id: string) => {
    navigator.clipboard.writeText(id)
    showToast(`Form ID "${id}" disalin ke clipboard!`)
  }

  // Toggle Cadre/Mitra Distribution Permission
  const handleToggleCadrePermission = async (formId: string, currentVal: boolean) => {
    const newVal = !currentVal
    // Optimistic UI update
    setForms((prev) =>
      prev.map((f) =>
        f.formId === formId
          ? {
              ...f,
              allowCadreDistribution: newVal,
              metadata: { ...(f.metadata || {}), allowCadreDistribution: newVal },
            }
          : f
      )
    )

    try {
      const res = await safeFetchJson(`/api/v1_5/forms/${formId}/permission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowCadreDistribution: newVal }),
      })

      if (res.ok && res.data?.success) {
        showToast(
          newVal
            ? `🟢 Akses distribusi kader & mitra untuk "${formId}" diizinkan!`
            : `🔒 Akses distribusi "${formId}" dibatasi khusus Admin!`
        )
      } else {
        // Revert on error
        setForms((prev) =>
          prev.map((f) =>
            f.formId === formId
              ? {
                  ...f,
                  allowCadreDistribution: currentVal,
                  metadata: { ...(f.metadata || {}), allowCadreDistribution: currentVal },
                }
              : f
          )
        )
        showToast(res.error || 'Gagal mengubah hak akses distribusi.')
      }
    } catch (err: any) {
      showToast('Gagal terhubung ke server.')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#06060E] text-slate-100 font-sans">
      <Topbar
        title="Daftar Formulir KKPD-KP V1.5 (Versi Terbaru)"
        subtitle="Kelola instrumen kuesioner berbasis aspek, snapshot versi terpublikasi, dan duplikasi kuesioner V1.5"
      />

      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Banner V1.5 Header */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-extrabold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                KKPD-KP V1.5 (Engine Terkini)
              </span>
              <span className="text-slate-400 text-xs">• Form Aggregate & Versioning</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-100">Instrumen Penilaian V1.5 Berbasis Aspek & Bobot</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Khusus menampilkan kuesioner native V1.5 dengan dukungan duplikasi struktur aspek, 
              riwayat snapshot versi terpublikasi, serta mekanisme kode distribusi kader.
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto flex-wrap">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Icon name="sparkles" className="w-4 h-4" />
              <span>+ Buat Formulir V1.5 Baru</span>
            </button>

            <Link
              href="/dashboard/distributions"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Icon name="send" className="w-4 h-4 text-cyan-400" />
              <span>Kelola Distribusi Kode</span>
            </Link>
          </div>
        </div>

        {/* Filter & View Mode Bar with Read Cost Control */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari judul / Form ID V1.5..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
              {(['all', 'draft', 'published', 'archived'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st)
                    setCurrentPage(1)
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                    statusFilter === st
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st === 'all' ? 'Semua Status' : st === 'published' ? 'Terpublikasi' : st === 'archived' ? 'Arsip' : 'Draft'}
                </button>
              ))}
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
              <span>Tampil:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
              >
                <option value={10} className="bg-slate-900 text-slate-200">10 data</option>
                <option value={25} className="bg-slate-900 text-slate-200">25 data</option>
                <option value={50} className="bg-slate-900 text-slate-200">50 data</option>
                <option value={100} className="bg-slate-900 text-slate-200">100 data</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
            {/* Read Cost Protection Indicator */}
            {lastFetchedAt && (
              <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Client Cache: {lastFetchedAt}</span>
              </div>
            )}

            {/* Manual Fetch Button */}
            <button
              onClick={fetchForms}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Segarkan Data dari Firestore"
            >
              <Icon name="refresh" className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>

            {/* Grid / Table View Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
                }`}
                title="Tampilan Kartu (Grid)"
              >
                <Icon name="grid" className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
                }`}
                title="Tampilan Tabel (List)"
              >
                <Icon name="list" className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Formulir V1.5</span>
              <Icon name="fileText" className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-100 mt-2">{stats.total}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Terpublikasi (Aktif)</span>
              <Icon name="checkCircle" className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-300 mt-2">{stats.published}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Draft (Pengembangan)</span>
              <Icon name="edit" className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-amber-300 mt-2">{stats.draft}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Diarsipkan</span>
              <Icon name="trash" className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-rose-300 mt-2">{stats.archived}</p>
          </div>
        </div>

        {/* Content View */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-3">
            <Icon name="loader" className="w-5 h-5 text-cyan-400 animate-spin" />
            <span>Memuat daftar formulir V1.5...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-300 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchForms}
              className="px-4 py-2 rounded-xl bg-rose-950 border border-rose-500/40 text-rose-200 font-semibold"
            >
              Coba Muat Ulang
            </button>
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
            <Icon name="fileText" className="w-12 h-12 mx-auto text-slate-700" />
            <p className="text-base font-bold text-slate-200">Belum Ada Formulir V1.5 Ditemukan</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Belum ada kuesioner V1.5 yang dibuat atau tidak ada kuesioner yang cocok dengan filter pencarian.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-bold"
            >
              <Icon name="sparkles" className="w-4 h-4" />
              <span>Buat Formulir V1.5 Baru</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* PREMIUM CARD GRID VIEW (WOW Visual V1.5 Layout) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedForms.map((f) => {
              const isPublished = f.status === 'published'
              const aspectCount = f.aspects?.length || 0
              const questionCount = f.questions?.length || 0
              const versionNum = f.activeVersionNumber || 1

              return (
                <div
                  key={f.formId}
                  className="rounded-3xl bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/40 p-5 flex flex-col justify-between space-y-4 transition-all hover:shadow-2xl hover:shadow-cyan-500/10 group backdrop-blur-md"
                >
                  <div className="space-y-3">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => copyFormId(f.formId)}
                        className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 transition-colors flex items-center gap-1.5"
                        title="Klik untuk salin Form ID"
                      >
                        <Icon name="copy" className="w-3 h-3 text-cyan-400" />
                        <span className="truncate max-w-[140px]">{f.formId}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                          v{versionNum}
                        </span>

                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase border ${
                            isPublished
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : f.status === 'archived'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {f.status}
                        </span>
                      </div>
                    </div>

                    {/* Title & Category */}
                    <div>
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-2">
                        {f.metadata?.title || 'Formulir V1.5 Tanpa Judul'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {f.metadata?.description || 'Formulir evaluasi standar BPOM V1.5.'}
                      </p>
                    </div>

                    {/* Aspect & Question Metrics Pills */}
                    <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                        {f.metadata?.category || 'Kuesioner'}
                      </span>
                      <span>•</span>
                      <span className="text-cyan-400 font-bold">{aspectCount} Aspek</span>
                      <span>•</span>
                      <span>{questionCount} Soal</span>
                    </div>

                    {/* Sakelar Visual Toggle Switch Akses Distribusi Kader & Mitra */}
                    <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                        <Icon name="users" className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Akses Distribusi:</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold ${f.allowCadreDistribution === true || f.metadata?.allowCadreDistribution === true ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {f.allowCadreDistribution === true || f.metadata?.allowCadreDistribution === true ? '🟢 Diizinkan' : '🔒 Khusus Admin'}
                        </span>

                        {/* Visual Sliding Switch Component */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={f.allowCadreDistribution === true || f.metadata?.allowCadreDistribution === true}
                          onClick={() => handleToggleCadrePermission(f.formId, Boolean(f.allowCadreDistribution === true || f.metadata?.allowCadreDistribution === true))}
                          className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            f.allowCadreDistribution === true || f.metadata?.allowCadreDistribution === true ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-slate-800 border-slate-700'
                          }`}
                          title={f.allowCadreDistribution === true || f.metadata?.allowCadreDistribution === true ? 'Klik untuk membatasi distribusi hanya untuk Admin' : 'Klik untuk mengizinkan Kader & Mitra mendistribusikan form ini'}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              f.allowCadreDistribution === true || f.metadata?.allowCadreDistribution === true ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer Bar */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {/* Primary Editor Link */}
                    <Link
                      href={`/dashboard/forms/${f.formId}/builder`}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Icon name="edit" className="w-3.5 h-3.5" />
                      <span>{isPublished ? 'Kelola Versi' : 'Edit Draft'}</span>
                    </Link>

                    {/* Action Icon Tools */}
                    <div className="flex items-center gap-1.5">
                      {/* Public Preview */}
                      <button
                        type="button"
                        onClick={() => setPreviewFormDoc(f)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-600/30 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors"
                        title="Pratinjau Kuesioner Publik"
                      >
                        <Icon name="eye" className="w-4 h-4 text-cyan-400" />
                      </button>

                      {/* Duplicate Form V1.5 */}
                      <button
                        type="button"
                        onClick={() => handleDuplicateForm(f.formId, f.metadata?.title)}
                        disabled={duplicatingFormId === f.formId}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-purple-600/30 text-slate-300 hover:text-purple-300 border border-slate-700 hover:border-purple-500/40 transition-colors disabled:opacity-50"
                        title="Duplikasi / Salin Kuesioner V1.5"
                      >
                        {duplicatingFormId === f.formId ? (
                          <Icon name="loader" className="w-4 h-4 text-purple-400 animate-spin" />
                        ) : (
                          <Icon name="copy" className="w-4 h-4 text-purple-400" />
                        )}
                      </button>

                      {/* Version Snapshot History */}
                      <button
                        type="button"
                        onClick={() => setSelectedHistoryFormId(f.formId)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-purple-600/30 text-slate-300 hover:text-purple-300 border border-slate-700 hover:border-purple-500/40 transition-colors"
                        title="Riwayat Versi Snapshot"
                      >
                        <Icon name="rotateCcw" className="w-4 h-4 text-purple-400" />
                      </button>

                      {/* Archive */}
                      {f.status !== 'archived' && (
                        <button
                          type="button"
                          onClick={() => handleArchiveForm(f.formId)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 transition-colors"
                          title="Arsipkan Formulir"
                        >
                          <Icon name="trash" className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="px-4 py-3.5">Form ID & Judul V1.5</th>
                    <th className="px-4 py-3.5">Versi Aktif</th>
                    <th className="px-4 py-3.5">Kategori</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Akses Kader & Mitra</th>
                    <th className="px-4 py-3.5">Struktur Aspek</th>
                    <th className="px-4 py-3.5">Pembaruan</th>
                    <th className="px-4 py-3.5 text-right">Aksi Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {paginatedForms.map((f) => {
                    const isPublished = f.status === 'published'

                    return (
                      <tr key={f.formId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-4 space-y-0.5 max-w-xs">
                          <div className="font-bold text-slate-100 text-sm truncate">{f.metadata?.title || 'Formulir V1.5'}</div>
                          <button
                            type="button"
                            onClick={() => copyFormId(f.formId)}
                            className="font-mono text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                            title="Salin ID"
                          >
                            <span>{f.formId}</span>
                            <Icon name="copy" className="w-3 h-3 text-cyan-400/70" />
                          </button>
                        </td>

                        <td className="px-4 py-4 font-mono font-bold text-cyan-300">
                          v{f.activeVersionNumber || 1}
                        </td>

                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-medium">
                            {f.metadata?.category || 'Kuesioner'}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase border ${
                              isPublished
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : f.status === 'archived'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {f.status}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {/* Visual Sliding Switch Component */}
                            <button
                              type="button"
                              role="switch"
                              aria-checked={f.allowCadreDistribution === true || f.metadata?.allowCadreDistribution === true}
                              onClick={() => handleToggleCadrePermission(f.formId, Boolean(f.allowCadreDistribution === true || f.metadata?.allowCadreDistribution === true))}
                              className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                f.allowCadreDistribution === true || f.metadata?.allowCadreDistribution === true ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-slate-800 border-slate-700'
                              }`}
                              title={f.allowCadreDistribution === true || f.metadata?.allowCadreDistribution === true ? 'Klik untuk membatasi distribusi hanya untuk Admin' : 'Klik untuk mengizinkan Kader & Mitra mendistribusikan form ini'}
                            >
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  f.allowCadreDistribution === true || f.metadata?.allowCadreDistribution === true ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>

                            <span className={`text-[10px] font-extrabold ${f.allowCadreDistribution === true || f.metadata?.allowCadreDistribution === true ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {f.allowCadreDistribution === true || f.metadata?.allowCadreDistribution === true ? '🟢 Diizinkan' : '🔒 Khusus Admin'}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-slate-400 font-mono">
                          {f.aspects?.length || 0} Aspek • {f.questions?.length || 0} Soal
                        </td>

                        <td className="px-4 py-4 text-slate-400 font-mono text-[11px]">
                          {f.updatedAt ? new Date(f.updatedAt).toLocaleDateString('id-ID') : '-'}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Edit / Open Builder */}
                            <Link
                              href={`/dashboard/forms/${f.formId}/builder`}
                              className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 font-semibold text-xs transition-colors"
                            >
                              {isPublished ? 'Kelola Versi' : 'Edit Draft'}
                            </Link>

                            {/* Preview */}
                            <button
                              type="button"
                              onClick={() => setPreviewFormDoc(f)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                              title="Pratinjau Publik"
                            >
                              <Icon name="eye" className="w-4 h-4 text-cyan-400" />
                            </button>

                            {/* Duplicate V1.5 */}
                            <button
                              type="button"
                              onClick={() => handleDuplicateForm(f.formId, f.metadata?.title)}
                              disabled={duplicatingFormId === f.formId}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-950 text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
                              title="Duplikasi Kuesioner V1.5"
                            >
                              {duplicatingFormId === f.formId ? (
                                <Icon name="loader" className="w-4 h-4 text-purple-400 animate-spin" />
                              ) : (
                                <Icon name="copy" className="w-4 h-4 text-purple-400" />
                              )}
                            </button>

                            {/* Version History */}
                            <button
                              type="button"
                              onClick={() => setSelectedHistoryFormId(f.formId)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                              title="Riwayat Versi Snapshot"
                            >
                              <Icon name="rotateCcw" className="w-4 h-4 text-purple-400" />
                            </button>

                            {/* Archive */}
                            {f.status !== 'archived' && (
                              <button
                                type="button"
                                onClick={() => handleArchiveForm(f.formId)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:rose-300 border border-slate-700 hover:border-rose-800 transition-colors"
                                title="Arsipkan Formulir"
                              >
                                <Icon name="trash" className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination Footer Controls */}
        {filteredForms.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <div>
              Menampilkan <span className="font-bold text-slate-200">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-bold text-slate-200">{Math.min(currentPage * pageSize, filteredForms.length)}</span> dari <span className="font-bold text-slate-200">{filteredForms.length}</span> formulir (Total {forms.length} ter-cache)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                &larr; Sebelumnya
              </button>

              <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-semibold text-slate-200">
                Halaman {currentPage} dari {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Selanjutnya &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Buat Formulir V1.5 Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Icon name="sparkles" className="w-5 h-5 text-cyan-400" />
                <span>Buat Formulir V1.5 Baru</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Judul Formulir Penilaian V1.5 <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Evaluasi Hygiene Sarana Pangan Sekolah..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kategori</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5"
                  >
                    <option value="Kuesioner Evaluasi">Kuesioner Evaluasi</option>
                    <option value="Fasilitasi Hygiene">Fasilitasi Hygiene</option>
                    <option value="Observasi Pangan">Observasi Pangan</option>
                    <option value="Pre-Test & Post-Test">Pre-Test & Post-Test</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Jenis Formulir</label>
                  <select
                    value={newKind}
                    onChange={(e) => setNewKind(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5"
                  >
                    <option value="official">Official (BPOM Resmi)</option>
                    <option value="user-created">User-created</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 flex items-center gap-1.5"
                >
                  {isCreating ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="check" className="w-4 h-4" />}
                  <span>{isCreating ? 'Membuat...' : 'Buat & Buka Editor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version History Snapshot Modal */}
      {selectedHistoryFormId && (
        <FormVersionHistoryModal
          isOpen={Boolean(selectedHistoryFormId)}
          formId={selectedHistoryFormId}
          onClose={() => setSelectedHistoryFormId(null)}
        />
      )}

      {/* Public Preview Modal */}
      {previewFormDoc && (
        <FormPreviewModal
          isOpen={Boolean(previewFormDoc)}
          canonicalForm={{
            form: {
              formId: previewFormDoc.formId,
              metadata: previewFormDoc.metadata,
              activeVersionId: previewFormDoc.activeVersionId,
              createdAt: previewFormDoc.createdAt,
              updatedAt: previewFormDoc.updatedAt,
            },
            version: {
              versionId: previewFormDoc.activeVersionId,
              formId: previewFormDoc.formId,
              versionNumber: previewFormDoc.activeVersionNumber,
              status: previewFormDoc.status,
              questions: previewFormDoc.questions,
              scoring: previewFormDoc.scoring,
              validation: previewFormDoc.validation,
              createdAt: previewFormDoc.createdAt,
            },
          }}
          onClose={() => setPreviewFormDoc(null)}
        />
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-3">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
