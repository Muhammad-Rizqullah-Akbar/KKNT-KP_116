'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import { Icon } from '@/components/ui/Icons'
import { PreviewModal } from '@/features/form-builder/components/preview/PreviewModal'
import {
  getForms,
  createForm,
  updateFormStatus,
  deleteForm,
  type FormData as LegacyFormData,
} from '@/lib/repositories/forms.repo'
import { useAuth } from '@/context/AuthContext'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/lib/hooks/use-toast'
import { filterForms, buildDuplicateTitle, buildDuplicateCode, type LegacyStatusFilter, type LegacyViewMode } from './forms-utils'
import FormsFilterBar from './forms-filter-bar'
import FormCard from './forms-card'
import FormTableRow from './forms-table-row'

export default function LegacyFormsPage() {
  const { user, userData, userRole, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      const effectiveRole = userRole || userData?.role
      if (effectiveRole === 'partnership') {
        router.replace('/dashboard/partnership')
      } else if (effectiveRole === 'cadre') {
        router.replace('/dashboard/monitoring')
      }
    }
  }, [loading, userRole, userData, router])

  // ============ SERVER-STATE (TanStack Query) ============
  const legacyQuery = useQuery<{ forms: LegacyFormData[] }>({
    queryKey: queryKeys.forms.legacy,
    queryFn: async () => {
      const formsData = await getForms()
      return { forms: formsData }
    },
  })

  const forms = legacyQuery.data?.forms ?? []
  const isLoading = legacyQuery.isLoading
  const error = legacyQuery.error ? (legacyQuery.error as Error).message : null
  const loadLegacyData = () => legacyQuery.refetch()

  // Filters & Tabs
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<LegacyStatusFilter>('all')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all')
  const [viewMode, setViewMode] = useState<LegacyViewMode>('grid')

  // Preview State
  const [previewForm, setPreviewForm] = useState<LegacyFormData | null>(null)
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null)

  // Toast
  const { visible: toastVisible, message: toastMessage, show: showToast } = useToast(3500)

  // Filtered List
  const filteredForms = useMemo(() => {
    return filterForms(forms, searchTerm, statusFilter, selectedGroupId)
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
  const handleDuplicateForm = async (form: LegacyFormData) => {
    if (!form.id) return
    setIsDuplicating(form.id)
    try {
      const copyCode = buildDuplicateCode(form.code || '')
      const cleanTitle = buildDuplicateTitle(form.title || 'Formulir')

      const duplicated = await createForm({
        title: cleanTitle,
        code: copyCode,
        description: form.description || '',
        target: form.target || '',
        category: form.category || '',
        status: 'draft',
        groupId: form.groupId || null,
        groupCode: form.groupCode || null,
        questions: form.questions || [],
        validation: form.validation,
        stages: form.stages,
        scoring: form.scoring,
        createdBy: user?.email || 'super_admin',
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
              href="/dashboard/forms/list"
              className="px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Icon name="sparkles" className="w-4 h-4" />
              <span>Ke Formulir V1.5 (Terbaru)</span>
            </Link>
          </div>
        </div>

        {/* Filter & View Switcher Bar */}
        <FormsFilterBar
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          selectedGroupId={selectedGroupId}
          viewMode={viewMode}
          setSearchTerm={setSearchTerm}
          setStatusFilter={setStatusFilter}
          setSelectedGroupId={setSelectedGroupId}
          setViewMode={setViewMode}
        />

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
            {filteredForms.map((form) => (
              <FormCard
                key={form.id}
                form={form}
                isDuplicating={isDuplicating === form.id}
                onCopyCode={copyFormCode}
                onToggleStatus={handleToggleStatus}
                onPreview={setPreviewForm}
                onDuplicate={handleDuplicateForm}
                onDelete={handleDeleteForm}
              />
            ))}
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
                  {filteredForms.map((form) => (
                    <FormTableRow
                      key={form.id}
                      form={form}
                      isDuplicating={isDuplicating === form.id}
                      onCopyCode={copyFormCode}
                      onToggleStatus={handleToggleStatus}
                      onPreview={setPreviewForm}
                      onDuplicate={handleDuplicateForm}
                      onDelete={handleDeleteForm}
                    />
                  ))}
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
      {toastVisible && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-3">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
