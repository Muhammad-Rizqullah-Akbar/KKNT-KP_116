// components/form-builder/signature-config.tsx

'use client'

import { ConfigPanelProps } from './config-panel-props'

export function SignatureConfig({ config, element, onUpdate }: ConfigPanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 uppercase tracking-wider">Lebar Canvas (px)</label>
          <input
            type="number"
            value={config.signatureWidth || 400}
            onChange={(e) => onUpdate({
              ...element,
              config: { ...config, signatureWidth: parseInt(e.target.value) || 400 }
            })}
            min={200}
            max={800}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 uppercase tracking-wider">Tinggi Canvas (px)</label>
          <input
            type="number"
            value={config.signatureHeight || 200}
            onChange={(e) => onUpdate({
              ...element,
              config: { ...config, signatureHeight: parseInt(e.target.value) || 200 }
            })}
            min={100}
            max={400}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 uppercase tracking-wider">Warna Pena</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.signaturePenColor || '#000000'}
              onChange={(e) => onUpdate({
                ...element,
                config: { ...config, signaturePenColor: e.target.value }
              })}
              className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
            />
            <input
              type="text"
              value={config.signaturePenColor || '#000000'}
              onChange={(e) => onUpdate({
                ...element,
                config: { ...config, signaturePenColor: e.target.value }
              })}
              className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white font-mono focus:outline-none"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 uppercase tracking-wider">Warna Background</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.signatureBgColor || '#ffffff'}
              onChange={(e) => onUpdate({
                ...element,
                config: { ...config, signatureBgColor: e.target.value }
              })}
              className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
            />
            <input
              type="text"
              value={config.signatureBgColor || '#ffffff'}
              onChange={(e) => onUpdate({
                ...element,
                config: { ...config, signatureBgColor: e.target.value }
              })}
              className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white font-mono focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-white/50 uppercase tracking-wider">Label Tanda Tangan</label>
        <input
          type="text"
          value={config.signatureLabel || 'Tanda Tangan'}
          onChange={(e) => onUpdate({
            ...element,
            config: { ...config, signatureLabel: e.target.value }
          })}
          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
          placeholder="Tanda Tangan"
        />
      </div>

      <div className="pt-3 border-t border-white/[0.06]">
        <label className="text-xs text-white/50 uppercase tracking-wider block mb-2">Pratinjau</label>
        <div
          className="rounded-xl border-2 border-dashed border-white/[0.08] flex items-center justify-center mx-auto"
          style={{
            width: `${Math.min(config.signatureWidth || 400, 400)}px`,
            height: `${Math.min(config.signatureHeight || 200, 200)}px`,
            backgroundColor: config.signatureBgColor || '#ffffff',
          }}
        >
          <p className="text-xs text-black/30">Area Tanda Tangan</p>
        </div>
      </div>
    </div>
  )
}
