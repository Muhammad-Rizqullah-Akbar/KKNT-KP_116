'use client'

import { Icon } from '@/components/ui/Icons'

type BulkDeleteModalProps = {
  count: number
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function BulkDeleteModal({ count, isDeleting, onClose, onConfirm }: BulkDeleteModalProps) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-950 border border-rose-500/50 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-rose-400">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
            <Icon name="trash" className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Konfirmasi Hapus Terpilih (Bulk Delete)</h3>
            <p className="text-xs text-rose-300 font-mono">{count} Tanggapan Terpilih</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Apakah Anda yakin ingin menghapus sekaligus <strong>{count} data tanggapan</strong> kuesioner yang telah Anda pilih? Tindakan ini bersifat permanen dari database.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-extrabold text-white shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
          >
            <Icon name="trash" className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Menghapus...' : `Ya, Hapus ${count} Tanggapan`}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
