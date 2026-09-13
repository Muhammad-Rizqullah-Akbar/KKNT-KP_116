'use client'

import { Icon } from '@/components/ui/Icons'
import { FormVersionHistoryModal } from '@/features/form-builder/components/versioning/FormVersionHistoryModal'
import { FormPreviewModal } from '@/features/form-builder/components/preview/FormPreviewModal'
import { formAggregateToCanonicalForm } from '@/lib/domain/forms/form-converters'
import type { FormsListController } from './use-forms-list'

// Modal create, distribution permission, edit confirm, edit title, version history, & preview.
export default function FormsListModals({ f }: { f: FormsListController }) {
  return (
    <>
      {/* CREATE NEW FORM MODAL */}
      {f.isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => f.setIsCreateModalOpen(false)}
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
                onClick={() => f.setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={f.handleCreateForm} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Judul Formulir Assessment *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Contoh: Evaluasi Keamanan Pangan Kantin Sekolah"
                  value={f.newTitle}
                  onChange={(e) => f.setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                />
                <p className="text-[11px] text-slate-500">
                  Pengaturan metadata selengkapnya (deskripsi, kategori, sasaran) dapat disesuaikan langsung di Form Builder.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => f.setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={f.isCreating || !f.newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold shadow-lg cursor-pointer"
                >
                  {f.isCreating ? 'Memproses...' : 'Buat & Buka Builder →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VERSION HISTORY MODAL */}
      {f.selectedHistoryFormId && (
        <FormVersionHistoryModal
          isOpen={Boolean(f.selectedHistoryFormId)}
          formId={f.selectedHistoryFormId}
          onClose={() => f.setSelectedHistoryFormId(null)}
        />
      )}

      {/* PREVIEW MODAL */}
      {f.previewFormDoc && (
        <FormPreviewModal
          isOpen={Boolean(f.previewFormDoc)}
          canonicalForm={formAggregateToCanonicalForm(f.previewFormDoc)}
          onClose={() => f.setPreviewFormDoc(null)}
        />
      )}

      {/* QUICK DISTRIBUTION ACCESS & PERMISSION TOGGLE MODAL */}
      {f.distributionModalForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => f.setDistributionModalForm(null)}
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
                  {f.distributionModalForm.metadata?.title || f.distributionModalForm.formId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => f.setDistributionModalForm(null)}
                className="text-slate-400 hover:text-slate-200 text-xs p-1"
              >
                ✕
              </button>
            </div>

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
                  disabled={f.isTogglingCadrePerm}
                  onClick={() => f.handleToggleCadrePerm(f.distributionModalForm!)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                    (f.distributionModalForm.allowCadreDistribution !== false)
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                  }`}
                >
                  {f.isTogglingCadrePerm
                    ? '...'
                    : (f.distributionModalForm.allowCadreDistribution !== false)
                    ? '✓ DIIZINKAN'
                    : '✕ DIBATASI (ADMIN)'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const fId = f.distributionModalForm!.formId
                  f.setDistributionModalForm(null)
                  f.router.push(`/dashboard/distributions?formId=${fId}`)
                }}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Kelola Kode BPOM Pusat →</span>
              </button>

              <button
                type="button"
                onClick={() => f.setDistributionModalForm(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW & VERSION EDIT CONFIRMATION MODAL */}
      {f.editConfirmForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => f.setEditConfirmForm(null)}
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
                onClick={() => f.setEditConfirmForm(null)}
                className="text-slate-400 hover:text-slate-200 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">{f.editConfirmForm.metadata?.title || f.editConfirmForm.formId}</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  VERSI {f.editConfirmForm.activeVersionNumber || 1}.0 TERPUBLIKASI
                </span>
              </div>
              <div className="text-slate-400 font-mono text-[11px] flex items-center gap-2">
                <span>{f.editConfirmForm.aspects?.length || 0} Aspek</span>
                <span>·</span>
                <span>{f.editConfirmForm.questions?.length || 0} Pertanyaan</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-purple-300">
                <Icon name="checkCircle" className="w-4 h-4 text-purple-400" />
                <span>Versi {f.editConfirmForm.activeVersionNumber || 1}.0 Tetap Berjalan Aman</span>
              </div>
              <p className="text-[11px] text-purple-300/80 leading-relaxed">
                Versi terpublikasi yang saat ini aktif disebar kepada responden dan kader <strong>tidak akan terganggu atau berubah</strong>. Membuat versi baru akan menghasilkan draft snapshot baru (misal V{(f.editConfirmForm.activeVersionNumber || 1) + 1}.0) di Form Builder.
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const docToPreview = f.editConfirmForm
                  f.setEditConfirmForm(null)
                  f.setPreviewFormDoc(docToPreview)
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Icon name="eye" className="w-3.5 h-3.5 text-slate-400" />
                <span>Pratinjau Responden</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => f.setEditConfirmForm(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={f.isCreatingNewVersion}
                  onClick={f.confirmAndEditNewVersion}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white font-bold text-xs shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  {f.isCreatingNewVersion ? (
                    'Memproses...'
                  ) : (
                    <>
                      <Icon name="edit" className="w-3.5 h-3.5" />
                      <span>Ya, Buat Draft V{(f.editConfirmForm.activeVersionNumber || 1) + 1}.0 & Edit →</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT FORM NAME MODAL (Edit tanpa ubah versi) */}
      {f.editingTitleForm && (
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
                    Versi {f.editingTitleForm.activeVersionNumber || 1} tetap dipertahankan tanpa membuat versi baru.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => f.setEditingTitleForm(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={f.handleSaveTitleSubmit} className="space-y-4">
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
                  value={f.editTitleInput}
                  onChange={(e) => f.setEditTitleInput(e.target.value)}
                  placeholder="Masukkan nama/judul formulir..."
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm font-semibold rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={f.editDescriptionInput}
                  onChange={(e) => f.setEditDescriptionInput(e.target.value)}
                  placeholder="Keterangan singkat formulir..."
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-4 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kategori</label>
                  <input
                    type="text"
                    value={f.editCategoryInput}
                    onChange={(e) => f.setEditCategoryInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Responden</label>
                  <input
                    type="text"
                    value={f.editTargetInput}
                    onChange={(e) => f.setEditTargetInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => f.setEditingTitleForm(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={f.isUpdatingTitle || !f.editTitleInput.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {f.isUpdatingTitle ? 'Menyimpan...' : 'Simpan Nama'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
