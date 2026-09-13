'use client'

import { Icon } from '@/components/ui/Icons'
import type { DistributionDoc } from '@/lib/domain/distributions/distribution-types'
import type { VersionItem } from './types'

interface EditModalProps {
  editingDoc: DistributionDoc | null
  editTitle: string
  onEditTitleChange: (value: string) => void
  editDescription: string
  onEditDescriptionChange: (value: string) => void
  editStatus: string
  onEditStatusChange: (value: string) => void
  editVersionMode: 'active' | 'pinned'
  onEditVersionModeChange: (value: 'active' | 'pinned') => void
  editPinnedVersionId: string
  onEditPinnedVersionIdChange: (value: string) => void
  availableVersions: VersionItem[]
  editExpiresAt: string
  onEditExpiresAtChange: (value: string) => void
  isSavingEdit: boolean
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

export default function EditModal({
  editingDoc,
  editTitle,
  onEditTitleChange,
  editDescription,
  onEditDescriptionChange,
  editStatus,
  onEditStatusChange,
  editVersionMode,
  onEditVersionModeChange,
  editPinnedVersionId,
  onEditPinnedVersionIdChange,
  availableVersions,
  editExpiresAt,
  onEditExpiresAtChange,
  isSavingEdit,
  onSubmit,
  onClose,
}: EditModalProps) {
  if (!editingDoc) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100">Edit Kode Distribusi</h3>
            <p className="text-xs text-slate-400">Kode Akses: <strong className="font-mono text-cyan-400">{editingDoc.code}</strong></p>
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
            <label className="block font-semibold text-slate-300 mb-1">Judul Channel</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Deskripsi Tambahan</label>
            <textarea
              value={editDescription}
              onChange={(e) => onEditDescriptionChange(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Status Operasional</label>
              <select
                value={editStatus}
                onChange={(e) => onEditStatusChange(e.target.value)}
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
                onChange={(e) => onEditVersionModeChange(e.target.value as 'active' | 'pinned')}
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
                  onChange={(e) => onEditPinnedVersionIdChange(e.target.value)}
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
                  onChange={(e) => onEditPinnedVersionIdChange(e.target.value)}
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
              onChange={(e) => onEditExpiresAtChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
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
  )
}
