'use client'

import { Icon } from '@/components/ui/Icons'
import { CHART_TYPES, COLOR_SCHEMES, type WidgetEditorConfig } from './widgets-utils'

interface WidgetEditorModalProps {
  config: WidgetEditorConfig
  onChange: (config: WidgetEditorConfig) => void
  onClose: () => void
  onSave: () => void
}

export function WidgetEditorModal({ config, onChange, onClose, onSave }: WidgetEditorModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fadeIn text-xs font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <Icon name="settings" className="w-5 h-5 text-cyan-400" />
            Edit Widget Grafik CMS
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Judul Tampilan Grafik</label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => onChange({ ...config, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Pilih Tipe Visualisasi</label>
            <select
              value={config.chartType}
              onChange={(e) => onChange({ ...config, chartType: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2"
            >
              {CHART_TYPES.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name} - {ct.desc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Skema Warna Graphic Palette</label>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {COLOR_SCHEMES.map((cs) => (
                <button
                  key={cs.id}
                  type="button"
                  onClick={() => onChange({ ...config, colorScheme: cs.id })}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-[10px] transition-all ${
                    config.colorScheme === cs.id
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cs.colors[0] }} />
                  <span className="truncate">{cs.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onSave}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5"
            >
              <Icon name="check" className="w-4 h-4" />
              <span>Simpan Grafik</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
