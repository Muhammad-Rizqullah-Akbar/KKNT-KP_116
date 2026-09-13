'use client'

import { Icon } from '@/components/ui/Icons'
import type { DeleteTarget } from './types'

interface DeleteConfirmModalProps {
  target: DeleteTarget | null
  selectedCount: number
  isExecuting: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function DeleteConfirmModal({
  target,
  selectedCount,
  isExecuting,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) {
  if (!target) return null

  const isBulk = target.id === 'bulk'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
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
              {isBulk ? 'Hapus Masal Kode Distribusi?' : 'Hapus Kode Distribusi?'}
            </h3>
            <p className="text-xs text-rose-400 font-mono font-bold mt-0.5">Tindakan ini tidak dapat dibatalkan</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-400">
            <span>Target Hapus:</span>
            <strong className="font-mono text-cyan-400 font-bold text-sm">{target.code}</strong>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Keterangan:</span>
            <strong className="text-slate-200 truncate max-w-[200px]">{target.title}</strong>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Apakah Anda yakin ingin menghapus {isBulk ? `${selectedCount} kode distribusi terpilih` : 'kode distribusi ini'} secara permanen dari database Firestore?
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isExecuting}
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-extrabold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all"
          >
            {isExecuting ? (
              <>
                <Icon name="loader" className="w-4 h-4 animate-spin text-white" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Icon name="trash" className="w-4 h-4 text-white" />
                <span>{isBulk ? `Ya, Hapus All (${selectedCount})` : 'Ya, Hapus Permanen'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
