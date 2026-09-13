'use client'

import { Icon } from '@/components/ui/Icons'
import type { FormAggregateDoc } from '@/lib/repositories/form-versions.repo'
import type { VersionItem } from './types'

interface PermissionModalProps {
  isOpen: boolean
  publishedForms: FormAggregateDoc[]
  permissionFormId: string
  onPermissionFormIdChange: (formId: string) => void
  permissionAllowCadre: boolean
  onToggleAllowCadre: () => void
  permissionVersions: VersionItem[]
  permissionActiveVersionId: string
  onSetActiveVersionId: (versionId: string) => void
  isLoadingPermissionVersions: boolean
  isSavingPermission: boolean
  onSave: () => void
  onClose: () => void
}

export default function PermissionModal({
  isOpen,
  publishedForms,
  permissionFormId,
  onPermissionFormIdChange,
  permissionAllowCadre,
  onToggleAllowCadre,
  permissionVersions,
  permissionActiveVersionId,
  onSetActiveVersionId,
  isLoadingPermissionVersions,
  isSavingPermission,
  onSave,
  onClose,
}: PermissionModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Icon name="settings" className="w-4 h-4 text-emerald-400" />
              <span>Izin & Status Versi Distribusi</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Kelola hak izin distribusi kader/mitra dan tentukan versi snapshot mana yang aktif disebar ke publik.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs p-1"
          >
            ✕
          </button>
        </div>

        {/* Select Form Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Pilih Formulir Terpublikasi</label>
          <select
            value={permissionFormId}
            onChange={(e) => onPermissionFormIdChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
          >
            {publishedForms.map((form) => (
              <option key={form.formId} value={form.formId}>
                {form.metadata?.title || form.formId} (V{form.activeVersionNumber || 1}.0)
              </option>
            ))}
          </select>
        </div>

        {/* Section 1: Toggle Cadre/Partner Distribution Switch */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-200">Izin Distribusi Kader & Mitra</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Bila diaktifkan, kader desa dan mitra dapat membuat kode distribusi mandiri untuk kuesioner ini.
              </p>
            </div>

            <button
              type="button"
              onClick={onToggleAllowCadre}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                permissionAllowCadre
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
              }`}
            >
              {permissionAllowCadre ? '✓ DIIZINKAN' : '✕ DIBATASI (ADMIN)'}
            </button>
          </div>
        </div>

        {/* Section 2: Published Version Snapshots & Active Version Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Icon name="history" className="w-3.5 h-3.5 text-cyan-400" />
              <span>Versi Snapshot & Status Aktif Didistribusikan</span>
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              {permissionVersions.length} Versi Terdaftar
            </span>
          </div>

          {isLoadingPermissionVersions ? (
            <div className="py-8 text-center space-y-2">
              <Icon name="spinner" className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Memuat versi snapshot formulir...</p>
            </div>
          ) : permissionVersions.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
              Belum ada versi snapshot terpublikasi yang terdaftar.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {permissionVersions.map((v) => {
                const isActive = v.versionId === permissionActiveVersionId
                return (
                  <div
                    key={v.versionId}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm'
                        : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          VERSI {v.versionNumber || 1}.0
                        </span>

                        {isActive && (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            DIDISTRIBUSIKAN SAAT INI
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono">
                        Dipublikasikan pada {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString('id-ID') : '—'}
                      </div>
                    </div>

                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => onSetActiveVersionId(v.versionId)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer shrink-0"
                      >
                        Set Versi Aktif →
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSavingPermission || !permissionFormId}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-xs shadow-lg cursor-pointer flex items-center gap-1.5"
          >
            {isSavingPermission ? 'Simpan...' : 'Simpan Pengaturan Izin & Versi'}
          </button>
        </div>
      </div>
    </div>
  )
}
