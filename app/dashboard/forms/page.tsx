'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import { PreviewModal } from '@/components/form-builder/PreviewModal'
import {
  getForms,
  getFormGroups,
  createForm,
  updateFormStatus,
  deleteForm,
  type FormData as LegacyFormData,
  type FormGroup,
} from '@/lib/firebase/repositories/forms.repo'
import { useAuth } from '@/context/AuthContext'

export default function LegacyFormsPage() {
  const { user } = useAuth()

  const [forms, setForms] = useState<LegacyFormData[]>([])
  const [groups, setGroups] = useState<FormGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & Tabs
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Preview State
  const [previewForm, setPreviewForm] = useState<LegacyFormData | null>(null)
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null)

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Fetch Legacy Forms & Form Groups
  const loadLegacyData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [formsData, groupsData] = await Promise.all([getForms(), getFormGroups()])
      setForms(formsData)
      setGroups(groupsData)
    } catch (err: any) {
      console.error('Error loading legacy forms:', err)
      setError(err.message || 'Gagal memuat kuesioner V1.0 dari database Firestore.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadLegacyData()
  }, [])

  // Filtered List
  const filteredForms = useMemo(() => {
    return forms.filter((f) => {
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        (f.title || '').toLowerCase().includes(term) ||
        (f.code || '').toLowerCase().includes(term) ||
        (f.category || '').toLowerCase().includes(term) ||
        (f.target || '').toLowerCase().includes(term)

      const matchesStatus = statusFilter === 'all' || f.status === statusFilter
      const matchesGroup = selectedGroupId === 'all' || f.groupId === selectedGroupId

      return matchesSearch && matchesStatus && matchesGroup
    })
  }, [forms, searchTerm, statusFilter, selectedGroupId])

  // Toggle Status
  const handleToggleStatus = async (formId?: string, currentStatus?: string) => {
    if (!formId) return
    const nextStatus = currentStatus === 'published' ? 'draft' : 'published'
    try {
      await updateFormStatus(formId, nextStatus)
      showToast(`Status kuesioner diubah menjadi "${nextStatus}"`)
      loadLegacyData()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    }
  }

  // Duplicate / Copy Form (Salin Kuesioner V1.0)
  const handleDuplicateForm = async (f: LegacyFormData) => {
    if (!f.id) return
    setIsDuplicating(f.id)
    try {
      const copyCode = `${f.code || 'FORM'}_COPY_${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      const duplicated = await createForm({
        title: `[Salinan] ${f.title}`,
        code: copyCode,
        description: f.description || '',
        target: f.target || '',
        category: f.category || '',
        status: 'draft',
        groupId: f.groupId || null,
        groupCode: f.groupCode || null,
        questions: f.questions || [],
        validation: f.validation,
        stages: f.stages,
        scoring: f.scoring,
        createdBy: user?.email || 'admin',
      })
      showToast(`Kuesioner "${duplicated.title}" berhasil disalin!`)
      loadLegacyData()
    } catch (err: any) {
      showToast(`Gagal menyalin kuesioner: ${err.message}`)
    } finally {
      setIsDuplicating(null)
    }
  }

  // Delete Form
  const handleDeleteForm = async (formId?: string, title?: string) => {
    if (!formId) return
    if (!confirm(`Hapus kuesioner V1.0 "${title || formId}" secara permanen?`)) return

    try {
      await deleteForm(formId)
      showToast('Kuesioner V1.0 berhasil dihapus.')
      loadLegacyData()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    }
  }

  // Copy Code
  const copyFormCode = (code: string) => {
    navigator.clipboard.writeText(code)
    showToast(`Kode kuesioner "${code}" disalin ke clipboard!`)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#070913] text-slate-100 font-sans">
      <Topbar
        title="Daftar Kuesioner Legacy V1.0"
        subtitle="Manajemen kuesioner warisan versi 1.0, pratinjau instrumen, duplikasi, dan kelompok form"
      />

      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Banner V1.0 Header */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold">
                KKPD-KP V1.0 (Versi Lama)
              </span>
              <span className="text-slate-400 text-xs">• Koleksi Firestore: `forms`</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">Kuesioner & Instrumen Evaluasi Legacy</h2>
            <p className="text-xs text-slate-400">
              Formulir di halaman ini tersimpan dalam skema V1.0. Lengkap dengan fitur <strong>Pratinjau Kuesioner</strong> dan <strong>Duplikasi Form</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto flex-wrap">
            <Link
              href="/dashboard/form-builder"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all"
            >
              <Icon name="filePlus" className="w-4 h-4" />
              <span>+ Form Builder V1.0</span>
            </Link>

            <Link
              href="/dashboard/forms/v1-5-list"
              className="px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Icon name="sparkles" className="w-4 h-4" />
              <span>Ke Formulir V1.5 (Terbaru)</span>
            </Link>
          </div>
        </div>

        {/* Filter & View Switcher Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari judul V1.0 / kode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              {(['all', 'published', 'draft'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                    statusFilter === st
                      ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st === 'all' ? 'Semua Status' : st === 'published' ? 'Terpublikasi' : 'Draft'}
                </button>
              ))}
            </div>

            {/* Form Group Filter */}
            {groups.length > 0 && (
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">Semua Kelompok Form</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Grid / Table Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl self-end md:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                viewMode === 'grid' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-400'
              }`}
              title="Tampilan Kartu (Grid)"
            >
              <Icon name="grid" className="w-4 h-4" />
              <span className="hidden sm:inline">Kartu</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-400'
              }`}
              title="Tampilan Tabel (List)"
            >
              <Icon name="list" className="w-4 h-4" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
          </div>
        </div>

        {/* Content View */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-3">
            <Icon name="loader" className="w-5 h-5 text-indigo-400 animate-spin" />
            <span>Memuat daftar kuesioner V1.0 dari Firestore...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-300 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <p className="font-semibold">{error}</p>
            <button
              onClick={loadLegacyData}
              className="px-4 py-2 rounded-xl bg-rose-950 border border-rose-500/40 text-rose-200 font-semibold"
            >
              Coba Muat Ulang
            </button>
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
            <Icon name="clipboardList" className="w-12 h-12 mx-auto text-slate-700" />
            <p className="text-base font-bold text-slate-200">Tidak Ada Kuesioner V1.0 Ditemukan</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Belum ada kuesioner legacy yang tersimpan atau tidak ada kuesioner yang cocok dengan filter Anda.
            </p>
            <Link
              href="/dashboard/form-builder"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
            >
              <Icon name="plus" className="w-4 h-4" />
              <span>Buat Form V1.0 Baru</span>
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          /* CARD GRID VIEW (Distinct V1.0 Design) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredForms.map((f) => {
              const isPublished = f.status === 'published'
              const qCount = f.questions?.length || 0

              return (
                <div
                  key={f.id}
                  className="rounded-3xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 p-5 flex flex-col justify-between space-y-4 transition-all hover:shadow-xl hover:shadow-indigo-500/5 group"
                >
                  <div className="space-y-3">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => copyFormCode(f.code || f.id || '')}
                        className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-950 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/60 transition-colors flex items-center gap-1.5"
                        title="Klik untuk salin kode kuesioner"
                      >
                        <Icon name="copy" className="w-3 h-3 text-indigo-400" />
                        <span>{f.code || f.id}</span>
                      </button>

                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase border ${
                          isPublished
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {f.status}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2">
                        {f.title || 'Kuesioner V1.0 Tanpa Judul'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {f.description || 'Tidak ada deskripsi kuesioner.'}
                      </p>
                    </div>

                    {/* Metadata Details */}
                    <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {f.category || 'Umum'}
                      </span>
                      <span>•</span>
                      <span>{qCount} Soal</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">{f.filledCount || 0} Terisi</span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(f.id, f.status)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                        isPublished
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {isPublished ? 'Ubah ke Draft' : 'Publikasikan'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Preview Button */}
                      <button
                        type="button"
                        onClick={() => setPreviewForm(f)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-600/30 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors"
                        title="Pratinjau Kuesioner (Preview)"
                      >
                        <Icon name="eye" className="w-4 h-4 text-cyan-400" />
                      </button>

                      {/* Duplicate / Salin Button */}
                      <button
                        type="button"
                        onClick={() => handleDuplicateForm(f)}
                        disabled={isDuplicating === f.id}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-purple-600/30 text-slate-300 hover:text-purple-300 border border-slate-700 hover:border-purple-500/40 transition-colors disabled:opacity-50"
                        title="Duplikasi / Salin Kuesioner"
                      >
                        {isDuplicating === f.id ? (
                          <Icon name="loader" className="w-4 h-4 text-purple-400 animate-spin" />
                        ) : (
                          <Icon name="copy" className="w-4 h-4 text-purple-400" />
                        )}
                      </button>

                      {/* Edit Button */}
                      <Link
                        href={`/dashboard/form-builder?id=${f.id}`}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                        title="Buka Editor Form Builder V1.0"
                      >
                        <Icon name="pencil" className="w-4 h-4" />
                      </Link>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteForm(f.id, f.title)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 transition-colors"
                        title="Hapus Kuesioner V1.0"
                      >
                        <Icon name="trash" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="px-5 py-4">Kode & Judul Kuesioner</th>
                    <th className="px-5 py-4">Kategori & Target</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Pertanyaan</th>
                    <th className="px-5 py-4">Total Terisi</th>
                    <th className="px-5 py-4 text-right">Aksi Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredForms.map((f) => {
                    const isPublished = f.status === 'published'

                    return (
                      <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-4 space-y-0.5 max-w-xs">
                          <div className="font-bold text-slate-100 text-sm truncate">{f.title || 'Formulir V1.0'}</div>
                          <button
                            type="button"
                            onClick={() => copyFormCode(f.code || f.id || '')}
                            className="font-mono text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                            title="Klik untuk salin kode"
                          >
                            <span>Kode: {f.code || f.id}</span>
                            <Icon name="copy" className="w-3 h-3 text-indigo-400/70" />
                          </button>
                        </td>

                        <td className="px-5 py-4 space-y-0.5">
                          <div className="text-slate-200 font-semibold">{f.category || 'Umum'}</div>
                          <div className="text-[11px] text-slate-400">{f.target || 'Masyarakat'}</div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase border ${
                              isPublished
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {f.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-400 font-mono">
                          {f.questions?.length || 0} Pertanyaan
                        </td>

                        <td className="px-5 py-4 font-mono font-bold text-emerald-400">
                          {f.filledCount || 0} pengisian
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(f.id, f.status)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
                            >
                              {isPublished ? 'Ubah ke Draft' : 'Publikasikan'}
                            </button>

                            {/* Preview Button */}
                            <button
                              type="button"
                              onClick={() => setPreviewForm(f)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-600/30 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-colors"
                              title="Pratinjau Kuesioner (Preview)"
                            >
                              <Icon name="eye" className="w-4 h-4 text-cyan-400" />
                            </button>

                            {/* Duplicate / Salin Button */}
                            <button
                              type="button"
                              onClick={() => handleDuplicateForm(f)}
                              disabled={isDuplicating === f.id}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-purple-600/30 text-slate-300 hover:text-purple-300 border border-slate-700 transition-colors disabled:opacity-50"
                              title="Duplikasi / Salin Kuesioner"
                            >
                              {isDuplicating === f.id ? (
                                <Icon name="loader" className="w-4 h-4 text-purple-400 animate-spin" />
                              ) : (
                                <Icon name="copy" className="w-4 h-4 text-purple-400" />
                              )}
                            </button>

                            {/* Edit Button */}
                            <Link
                              href={`/dashboard/form-builder?id=${f.id}`}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                              title="Edit Form V1.0"
                            >
                              <Icon name="pencil" className="w-4 h-4" />
                            </Link>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteForm(f.id, f.title)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 transition-colors"
                              title="Hapus Form V1.0"
                            >
                              <Icon name="trash" className="w-4 h-4" />
                            </button>
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
      </div>

      {/* V1.0 Preview Modal */}
      {previewForm && (
        <PreviewModal
          isOpen={Boolean(previewForm)}
          onClose={() => setPreviewForm(null)}
          elements={(previewForm.questions || []) as any}
          formTitle={previewForm.title || 'Pratinjau Kuesioner V1.0'}
          stages={(previewForm.stages || []) as any}
          validationMode={previewForm.validation?.mode || 'all_required'}
          validationExceptions={previewForm.validation?.exceptions || []}
          scoringDistribution={previewForm.scoring?.distribution || {}}
          scoringMode={previewForm.scoring?.mode || 'auto'}
        />
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