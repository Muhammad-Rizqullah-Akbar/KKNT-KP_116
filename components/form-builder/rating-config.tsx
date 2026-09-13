// components/form-builder/rating-config.tsx

'use client'

import { ConfigPanelProps } from './config-panel-props'

export function RatingConfig({ config, element, onUpdate }: ConfigPanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 uppercase tracking-wider">Min Rating</label>
          <input
            type="number"
            value={config.ratingMin || 1}
            onChange={(e) => onUpdate({
              ...element,
              config: { ...config, ratingMin: parseInt(e.target.value) || 1 }
            })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 uppercase tracking-wider">Max Rating</label>
          <input
            type="number"
            value={config.ratingMax || 5}
            onChange={(e) => onUpdate({
              ...element,
              config: { ...config, ratingMax: parseInt(e.target.value) || 5 }
            })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <span className="text-xs text-white/30">Preview:</span>
        <div className="flex gap-1">
          {Array.from({ length: config.ratingMax || 5 }, (_: any, i: number) => (
            <span key={i} className={`text-lg ${i < 3 ? 'text-amber-400' : 'text-white/15'}`}>★</span>
          ))}
        </div>
      </div>
    </div>
  )
}
