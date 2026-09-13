'use client'

import { Icon } from '@/components/ui/Icons'
import type { FormAggregateDoc } from '@/lib/repositories/form-versions.repo'
import type { VersionItem } from './types'

interface CreateDistributionModalProps {
  isOpen: boolean
  publishedForms: FormAggregateDoc[]
  selectedFormId: string
  onSelectForm: (formId: string) => void
  customTitle: string
  onCustomTitleChange: (value: string) => void
  customDescription: string
  onCustomDescriptionChange: (value: string) => void
  versionMode: 'active' | 'pinned'
  onVersionModeChange: (value: 'active' | 'pinned') => void
  pinnedVersionId: string
  onPinnedVersionIdChange: (value: string) => void
  availableVersions: VersionItem[]
  expiresAt: string
  onExpiresAtChange: (value: string) => void
  isCreating: boolean
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

export default function CreateDistributionModal({
  isOpen,
  publishedForms,
  selectedFormId,
  onSelectForm,
  customTitle,
  onCustomTitleChange,
  customDescription,
  onCustomDescriptionChange,
  versionMode,
  onVersionModeChange,
  pinnedVersionId,
  onPinnedVersionIdChange,
  availableVersions,
  expiresAt,
  onExpiresAtChange,
  isCreating,
  onSubmit,
  onClose,
}: CreateDistributionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100">Terbitkan Kode Distribusi Baru</h3>
            <p className="text-xs text-slate-400">Pilih formulir terpublikasi & tentukan parameter kanal distribusi</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
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
                {publishedForms.map((form) => {
                  const isSelected = selectedFormId === form.formId
                  const aspectCount = form.aspects?.length || 0
                  const questionCount = form.questions?.length || 0

                  return (
                    <div
                      key={form.formId}
                      onClick={() => onSelectForm(form.formId)}
                      className={`cursor-pointer p-3.5 rounded-2xl border transition-all space-y-2 relative group ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      {/* Selection badge check */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                          v{form.activeVersionNumber || 1.5}
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
                          {form.metadata?.title || form.formId}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                          {form.metadata?.category || 'Kuesioner Evaluasi'}
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
              onChange={(e) => onCustomTitleChange(e.target.value)}
              placeholder="Contoh: Pendampingan Posyandu Desa Sukamaju"
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Deskripsi Tambahan (Opsional)</label>
            <textarea
              value={customDescription}
              onChange={(e) => onCustomDescriptionChange(e.target.value)}
              placeholder="Catatan khusus untuk kader atau responden..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Mode Versi Kuesioner</label>
            <select
              value={versionMode}
              onChange={(e) => onVersionModeChange(e.target.value as 'active' | 'pinned')}
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
                onChange={(e) => onPinnedVersionIdChange(e.target.value)}
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
              onChange={(e) => onExpiresAtChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
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
  )
}
