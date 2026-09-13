'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'

interface AdminBarProps {
  isEditMode: boolean
  isSaving: boolean
  onEnterEditMode: () => void
  onSave: () => void
  onCancel: () => void
}

export function AdminBar({ isEditMode, isSaving, onEnterEditMode, onSave, onCancel }: AdminBarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] bg-[#0e0e1a]/90 backdrop-blur-md border border-cyan-500/30 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-slideUp">
      <div className="flex items-center gap-2 border-r border-white/10 pr-4">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
        <span className="text-xs font-semibold text-cyan-300">Admin Mode</span>
      </div>

      {!isEditMode ? (
        <button
          type="button"
          onClick={onEnterEditMode}
          className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white flex items-center gap-1.5 transition-all"
        >
          <Icon name="pencil" className="w-3.5 h-3.5" /> Edit Halaman Ini
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white flex items-center gap-1.5 transition-all"
          >
            <Icon name="save" className="w-3.5 h-3.5" /> {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-xl bg-white/10 text-xs text-white/70 hover:text-white"
          >
            Batal
          </button>
        </div>
      )}

      <Link
        href="/dashboard/articles"
        className="text-xs text-white/50 hover:text-white border-l border-white/10 pl-4 flex items-center gap-1"
      >
        Dashboard <Icon name="chevronRight" className="w-3 h-3" />
      </Link>
    </div>
  )
}
