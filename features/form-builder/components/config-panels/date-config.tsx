// components/form-builder/date-config.tsx

'use client'

import { ConfigPanelProps } from '././config-panel-props'

export function DateConfig({ config, element, onUpdate }: ConfigPanelProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 uppercase tracking-wider">Format Tanggal</label>
        <select
          value={config.dateFormat || 'DD/MM/YYYY'}
          onChange={(e) => onUpdate({
            ...element,
            config: { ...config, dateFormat: e.target.value }
          })}
          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none"
        >
          <option value="DD/MM/YYYY" className="bg-[#0e0e1a]">DD/MM/YYYY</option>
          <option value="MM/DD/YYYY" className="bg-[#0e0e1a]">MM/DD/YYYY</option>
          <option value="YYYY-MM-DD" className="bg-[#0e0e1a]">YYYY-MM-DD</option>
        </select>
      </div>
      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
        <p className="text-xs text-white/30">Preview:</p>
        <input
          type="date"
          disabled
          className="mt-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/40 cursor-not-allowed"
        />
      </div>
    </div>
  )
}
