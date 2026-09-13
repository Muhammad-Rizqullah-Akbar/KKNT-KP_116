'use client'

import { Icon } from '@/components/ui/Icons'

type BulkDeleteModalProps = {
  selectedCount: number
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function BulkDeleteModal({ selectedCount, isSubmitting, onCancel, onConfirm }: BulkDeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fadeIn">
        <div className="flex items-center gap-3 text-rose-400">
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <Icon name="trash" className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h4 className="font-bold text-lg text-slate-100">Konfirmasi Hapus Masal (Bulk Delete)</h4>
            <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Apakah Anda yakin ingin menghapus <span className="font-mono font-bold text-rose-300">{selectedCount} akun pengguna</span> yang Anda pilih secara masal dan permanen dari database sistem KKNT-KP V1.5?
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white text-xs font-bold flex items-center gap-2"
          >
            {isSubmitting ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="trash" className="w-4 h-4" />}
            <span>{isSubmitting ? 'Memproses Hapus Masal...' : `Ya, Hapus (${selectedCount}) Akun`}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
