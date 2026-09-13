// shared/fields/SectionHeaderFields.tsx
// Section header properties.

'use client'

import type { FieldProps } from '././field-props'

export function SectionHeaderFields({ element, setElement }: FieldProps) {
  return (
    <>
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 uppercase tracking-wider">Judul Section</label>
        <input
          type="text"
          value={element.question}
          onChange={(e) => setElement({ ...element, question: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
          placeholder="Masukkan judul section..."
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 uppercase tracking-wider">Deskripsi (opsional)</label>
        <input
          type="text"
          value={element.defaultProps?.description || ''}
          onChange={(e) => setElement({
            ...element,
            defaultProps: { ...element.defaultProps, description: e.target.value }
          })}
          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
          placeholder="Deskripsi section..."
        />
      </div>
    </>
  )
}
