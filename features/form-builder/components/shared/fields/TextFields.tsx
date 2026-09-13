// shared/fields/TextFields.tsx
// Text / number / date style properties for ElementProperties.

'use client'

import type { FieldProps } from '././field-props'

export function TextFields({ element, setElement }: FieldProps) {
  const isTextType =
    element.type === 'short-text' ||
    element.type === 'text' ||
    element.type === 'long-text' ||
    element.type === 'textarea'

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

      {isTextType && (
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 uppercase tracking-wider">Placeholder</label>
          <input
            type="text"
            value={element.defaultProps?.placeholder || ''}
            onChange={(e) => setElement({
              ...element,
              defaultProps: { ...element.defaultProps, placeholder: e.target.value }
            })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
            placeholder="Placeholder..."
          />
        </div>
      )}

      {element.type === 'number' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wider">Min</label>
            <input
              type="number"
              value={element.validation?.min || 0}
              onChange={(e) => setElement({
                ...element,
                validation: { ...element.validation, min: parseInt(e.target.value) || 0 }
              })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wider">Max</label>
            <input
              type="number"
              value={element.validation?.max || 100}
              onChange={(e) => setElement({
                ...element,
                validation: { ...element.validation, max: parseInt(e.target.value) || 100 }
              })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
            />
          </div>
        </div>
      )}
    </>
  )
}
