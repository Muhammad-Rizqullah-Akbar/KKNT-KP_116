'use client'

import { Icon } from '@/components/ui/Icons'

type DeleteGalleryModalProps = {
  saving: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function DeleteGalleryModal({ saving, onCancel, onConfirm }: DeleteGalleryModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-md bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <Icon name="alertCircle" className="w-8 h-8 text-rose-400" />
        </div>
        <h3 className="font-display text-lg font-semibold text-white mb-2">Hapus Dokumentasi</h3>
        <p className="text-sm text-white/50 mb-6">
          Apakah Anda yakin ingin menghapus item galeri ini dari landing page?
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 hover:text-white"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-medium text-white transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="trash" className="w-4 h-4" />}
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  )
}
