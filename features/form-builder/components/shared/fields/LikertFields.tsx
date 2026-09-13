// shared/fields/LikertFields.tsx
// Likert statements properties.

'use client'

import { Icon } from '@/components/ui/Icons'
import type { FieldProps } from '././field-props'

export function LikertFields({ element, setElement }: FieldProps) {
  return (
    <>
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 uppercase tracking-wider">Pertanyaan</label>
        <input
          type="text"
          value={element.question}
          onChange={(e) => setElement({ ...element, question: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
          placeholder="Masukkan pertanyaan..."
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-white/50 uppercase tracking-wider">Pernyataan</label>
        <div className="space-y-2">
          {(element.options || ['']).map((opt: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const newOptions = [...(element.options || [])]
                  newOptions[index] = e.target.value
                  setElement({ ...element, options: newOptions })
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                placeholder={`Pernyataan ${index + 1}`}
              />
              <button
                onClick={() => {
                  const newOptions = (element.options || []).filter((_: any, i: number) => i !== index)
                  setElement({ ...element, options: newOptions })
                }}
                className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                <Icon name="trash" className="w-4 h-4 text-white/30 hover:text-red-400" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            const newOptions = [...(element.options || []), '']
            setElement({ ...element, options: newOptions })
          }}
          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
        >
          <Icon name="plus" className="w-3 h-3" /> Tambah Pernyataan
        </button>
      </div>
    </>
  )
}
