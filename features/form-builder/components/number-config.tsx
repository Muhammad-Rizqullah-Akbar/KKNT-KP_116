// components/form-builder/number-config.tsx

'use client'

import { ConfigPanelProps } from './config-panel-props'

export function NumberConfig({ config, element, onUpdate }: ConfigPanelProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 uppercase tracking-wider">Min</label>
        <input
          type="number"
          value={config.min !== undefined ? config.min : 0}
          onChange={(e) => onUpdate({ ...element, config: { ...config, min: parseInt(e.target.value) || 0 } })}
          className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 uppercase tracking-wider">Max</label>
        <input
          type="number"
          value={config.max !== undefined ? config.max : 100}
          onChange={(e) => onUpdate({ ...element, config: { ...config, max: parseInt(e.target.value) || 0 } })}
          className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 uppercase tracking-wider">Step</label>
        <input
          type="number"
          value={config.step !== undefined ? config.step : 1}
          onChange={(e) => onUpdate({ ...element, config: { ...config, step: parseInt(e.target.value) || 1 } })}
          className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
        />
      </div>
    </div>
  )
}
