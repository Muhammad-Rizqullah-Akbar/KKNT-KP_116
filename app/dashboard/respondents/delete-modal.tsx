'use client'

import { Icon } from '@/components/ui/Icons'

type DeleteModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteModal({ open, onClose, onConfirm }: DeleteModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#0e0e1a] border border-white/8 rounded-2xl shadow-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Icon name="alertCircle" className="w-8 h-8 text-rose-400" />
          </div>
          <h3 className="font-display text-lg font-semibold text-white mb-2">Hapus Data Responden</h3>
          <p className="text-sm text-white/50 mb-6">
            Data responden dan semua jawabannya akan dihapus permanen.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/3 border border-white/6 text-sm text-white/70 hover:text-white"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-medium text-white"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
