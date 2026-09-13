// components/form-builder/text-config.tsx

'use client'

import { ConfigPanelProps } from './config-panel-props'

interface TextConfigProps extends ConfigPanelProps {
  type: string
}

export function TextConfig({ type, config, element, onUpdate }: TextConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 uppercase tracking-wider">Placeholder Input</label>
        <input
          type="text"
          value={config.placeholder || ''}
          onChange={(e) => onUpdate({
            ...element,
            config: { ...config, placeholder: e.target.value }
          })}
          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40"
          placeholder="Tulis contoh pengisian..."
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 uppercase tracking-wider">Min Karakter</label>
          <input
            type="number"
            value={config.minLength || 0}
            onChange={(e) => onUpdate({
              ...element,
              config: { ...config, minLength: parseInt(e.target.value) || 0 }
            })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 uppercase tracking-wider">Max Karakter</label>
          <input
            type="number"
            value={config.maxLength || (type === 'short-text' ? 200 : 1000)}
            onChange={(e) => onUpdate({
              ...element,
              config: { ...config, maxLength: parseInt(e.target.value) || 0 }
            })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}
