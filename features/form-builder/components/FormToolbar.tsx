// components/form-builder/FormToolbar.tsx

'use client'

import { Icon } from '@/components/ui/Icons'

interface FormToolbarProps {
  formTitle: string
  onTitleChange: (title: string) => void
  onSave: () => void
  onPreview: () => void
  onSettings: () => void  // NEW
  isSaving: boolean
  elementCount: number
}

export function FormToolbar({
  formTitle,
  onTitleChange,
  onSave,
  onPreview,
  onSettings,  // NEW
  isSaving,
  elementCount,
}: FormToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#080812] border border-white/[0.05]">
      {/* Left side: Title */}
      <div className="flex items-center gap-3 min-w-[200px] flex-1">
        <Icon name="edit" className="w-4 h-4 text-white/30" />
        <input
          type="text"
          value={formTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Judul formulir..."
          className="flex-1 bg-transparent border-none text-white font-medium text-sm focus:outline-none placeholder-white/20 min-w-[100px]"
        />
        <span className="text-xs text-white/25 whitespace-nowrap">
          {elementCount} elemen
        </span>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Settings Button - NEW */}
        <button
          onClick={onSettings}
          className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.06] transition-all flex items-center gap-1.5 text-sm"
          title="Pengaturan Form"
        >
          <Icon name="settings" className="w-4 h-4" />
          <span className="hidden sm:inline">Pengaturan</span>
        </button>

        <button
          onClick={onPreview}
          className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.06] transition-all flex items-center gap-1.5 text-sm"
        >
          <Icon name="eye" className="w-4 h-4" />
          <span className="hidden sm:inline">Preview</span>
        </button>

        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-violet-400 text-white font-medium hover:opacity-90 transition-all flex items-center gap-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Icon name="loader" className="w-4 h-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Icon name="save" className="w-4 h-4" />
              Simpan
            </>
          )}
        </button>
      </div>
    </div>
  )
}