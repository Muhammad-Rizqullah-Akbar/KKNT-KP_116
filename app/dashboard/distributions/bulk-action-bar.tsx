'use client'

import { Icon } from '@/components/ui/Icons'

interface BulkActionBarProps {
  selectedCount: number
  onCancel: () => void
  onBulkDelete: () => void
}

export default function BulkActionBar({ selectedCount, onCancel, onBulkDelete }: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center justify-between gap-4 px-6 py-3.5 rounded-full bg-slate-900/95 border-2 border-rose-500/80 text-slate-100 shadow-2xl backdrop-blur-md max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
        <span className="text-xs font-mono font-bold text-slate-200">
          <strong className="text-rose-400 font-extrabold text-sm">{selectedCount}</strong> Kode Terpilih
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={onBulkDelete}
          className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all"
        >
          <Icon name="trash" className="w-3.5 h-3.5 text-white" />
          <span>Hapus Semua Terpilih ({selectedCount})</span>
        </button>
      </div>
    </div>
  )
}
