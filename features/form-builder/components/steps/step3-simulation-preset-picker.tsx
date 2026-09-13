'use client'

export type SimulationPreset = 'all_correct' | 'average' | 'minimum' | 'custom'

interface SimulationPresetPickerProps {
  outputMode: string
  value: SimulationPreset
  onChange: (preset: SimulationPreset) => void
}

export function SimulationPresetPicker({ outputMode, value, onChange }: SimulationPresetPickerProps) {
  return (
    <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-300">Pilih Preset Jawaban Simulasi:</span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
          Mode Hasil: {outputMode.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { id: 'all_correct', label: 'Semua Benar (100%)' },
          { id: 'average', label: 'Rata-rata (50%)' },
          { id: 'minimum', label: 'Minimal (0%)' },
          { id: 'custom', label: 'Jawaban Kustom' },
        ].map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.id as SimulationPreset)}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
              value === preset.id
                ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
