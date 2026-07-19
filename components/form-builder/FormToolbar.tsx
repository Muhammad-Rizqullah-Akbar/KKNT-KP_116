'use client'

import { Icon } from '@/components/ui/Icons'
import { Button } from '@/components/shared/Button'

interface FormToolbarProps {
  formTitle: string
  onTitleChange: (title: string) => void
  onSave: () => void
  onPreview: () => void
  isSaving?: boolean
  elementCount: number
}

export function FormToolbar({
  formTitle,
  onTitleChange,
  onSave,
  onPreview,
  isSaving = false,
  elementCount,
}: FormToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#080812] border border-white/[0.05] rounded-xl">
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          value={formTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Judul Formulir..."
          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-400/40 transition-all font-display font-semibold"
        />
        <p className="text-xs text-white/25 mt-1">
          {elementCount} elemen • {elementCount === 0 ? 'Belum ada pertanyaan' : 'Siap untuk disimpan'}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          icon="eye"
          onClick={onPreview}
          disabled={elementCount === 0}
        >
          Preview
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={isSaving ? 'loader' : 'save'}
          onClick={onSave}
          disabled={elementCount === 0 || isSaving}
          className={isSaving ? 'opacity-70 cursor-not-allowed' : ''}
        >
          {isSaving ? 'Menyimpan...' : 'Simpan Formulir'}
        </Button>
      </div>
    </div>
  )
}