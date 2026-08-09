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

export default function FormsDashboardPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [forms, setForms] = useState<FormAggregateDoc[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

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

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Load Forms List from API
  const fetchForms = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (statusFilter !== 'all') queryParams.set('status', statusFilter)
      if (categoryFilter !== 'all') queryParams.set('category', categoryFilter)
      if (searchTerm) queryParams.set('search', searchTerm)

      const res = await fetch(`/api/v1_5/forms?${queryParams.toString()}`)
      const data = await res.json()

      if (data.success && Array.isArray(data.forms)) {
        setForms(data.forms)
      } else {
        setError(data.message || 'Gagal memuat daftar formulir.')
      }
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchForms()
  }, [statusFilter, categoryFilter])

  // Filtered List Client-Side Search Backup
  const filteredForms = useMemo(() => {
    return forms.filter((f) => {
      const term = searchTerm.toLowerCase()
      const titleMatch = f.metadata?.title?.toLowerCase().includes(term)
      const codeMatch = f.formId?.toLowerCase().includes(term)
      return titleMatch || codeMatch
    })
  }, [forms, searchTerm])

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

      showToast('Formulir baru berhasil dibuat!')
      setIsCreateModalOpen(false)
      setNewTitle('')
      router.push(`/dashboard/forms/${data.form.formId}/builder`)
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  // Archive Form Handler
  const handleArchiveForm = async (formId: string) => {
    if (!confirm(`Apakah Anda yakin ingin mengarsipkan formulir "${formId}"?`)) return

    try {
      const res = await fetch(`/api/v1_5/forms/${formId}/archive`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengarsipkan formulir.')
      }

      showToast('Formulir berhasil diarsipkan.')
      fetchForms()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Topbar
        title="Manajemen Formulir V1.5"
        subtitle="Kelola instrumen penilaian, versi terpublikasi, kunci jawaban, dan distribusi kader"
      />

      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari judul / Form ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchForms()}
                className="pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              {(['all', 'draft', 'published', 'archived'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
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
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-all shadow-lg shadow-cyan-600/20"
          >
            <Icon name="plus" className="w-4 h-4" />
            <span>+ Buat Formulir Baru</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Formulir</span>
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
              <Icon name="archive" className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-rose-300 mt-2">{stats.archived}</p>
          </div>
        </div>

        {/* Main Table */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-xs gap-3">
              <Icon name="loader" className="w-5 h-5 text-cyan-400 animate-spin" />
              <span>Memuat daftar formulir V1.5...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-rose-300 space-y-2">
              <p className="font-semibold">{error}</p>
              <button
                onClick={fetchForms}
                className="px-3 py-1.5 rounded-lg bg-rose-950 border border-rose-500/40 text-rose-200"
              >
                Coba Ulang
              </button>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <Icon name="fileText" className="w-10 h-10 mx-auto text-slate-700" />
              <p className="text-sm font-semibold text-slate-300">Belum Ada Formulir</p>
              <p className="text-xs text-slate-500">Klik tombol "+ Buat Formulir Baru" untuk memulai authoring.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="px-4 py-3.5">Form ID & Judul</th>
                    <th className="px-4 py-3.5">Versi Aktif</th>
                    <th className="px-4 py-3.5">Kategori</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Struktur</th>
                    <th className="px-4 py-3.5">Pembaruan</th>
                    <th className="px-4 py-3.5 text-right">Aksi Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredForms.map((f) => {
                    const isPublished = f.status === 'published'

                    return (
                      <tr key={f.formId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-4 space-y-0.5 max-w-xs">
                          <div className="font-bold text-slate-100 text-sm truncate">{f.metadata?.title}</div>
                          <div className="font-mono text-[11px] text-cyan-400 truncate">{f.formId}</div>
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

                            {/* Version History */}
                            <button
                              type="button"
                              onClick={() => setSelectedHistoryFormId(f.formId)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                              title="Riwayat Versi Snapshot"
                            >
                              <Icon name="history" className="w-4 h-4 text-purple-400" />
                            </button>

                            {/* Archive */}
                            {f.status !== 'archived' && (
                              <button
                                type="button"
                                onClick={() => handleArchiveForm(f.formId)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 transition-colors"
                                title="Arsipkan Formulir"
                              >
                                <Icon name="archive" className="w-4 h-4" />
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
          )}
        </div>
      </div>

      {/* Modal: Buat Formulir Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Icon name="plus" className="w-5 h-5 text-cyan-400" />
                <span>Buat Formulir Penilaian Baru</span>
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
                  Judul Formulir Penilaian <span className="text-rose-400">*</span>
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