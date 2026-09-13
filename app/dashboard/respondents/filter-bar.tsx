'use client'

import { Icon } from '@/components/ui/Icons'

type FilterBarProps = {
  selectedGroups: string[]
  selectedForms: string[]
  groupOptions: string[]
  formOptions: string[]
  canExport: boolean
  onGroupToggle: (group: string) => void
  onFormToggle: (form: string) => void
  onReset: () => void
  onExportExcel: () => void
  onPrint: () => void
}

export default function FilterBar({
  selectedGroups,
  selectedForms,
  groupOptions,
  formOptions,
  canExport,
  onGroupToggle,
  onFormToggle,
  onReset,
  onExportExcel,
  onPrint,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-wrap items-start gap-4">
        <div>
          <span className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Filter Group:</span>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => onGroupToggle('Semua Group')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                selectedGroups.length === 0
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/20'
                  : 'bg-white/3 text-white/50 hover:text-white/80 border border-white/5'
              }`}
            >
              Semua
            </button>
            {groupOptions.map(groupOption => (
              <button key={groupOption} onClick={() => onGroupToggle(groupOption)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  selectedGroups.includes(groupOption)
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/20'
                    : 'bg-white/3 text-white/50 hover:text-white/80 border border-white/5'
                }`}
              >
                {groupOption}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Filter Formulir:</span>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => onFormToggle('Semua Formulir')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                selectedForms.length === 0
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                  : 'bg-white/3 text-white/50 hover:text-white/80 border border-white/5'
              }`}
            >
              Semua
            </button>
            {formOptions.map(formOption => (
              <button key={formOption} onClick={() => onFormToggle(formOption)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  selectedForms.includes(formOption)
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                    : 'bg-white/3 text-white/50 hover:text-white/80 border border-white/5'
                }`}
              >
                {formOption}
              </button>
            ))}
          </div>
        </div>

        {(selectedGroups.length > 0 || selectedForms.length > 0) && (
          <button onClick={onReset}
            className="self-end px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-all flex items-center gap-1"
          >
            <Icon name="x" className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={onExportExcel} disabled={!canExport}
          className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Icon name="fileSpreadsheet" className="w-4 h-4" /> Export Excel
        </button>
        <button onClick={onPrint} disabled={!canExport}
          className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 bg-white/3 text-white/70 hover:text-white border border-white/6 hover:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Icon name="printer" className="w-4 h-4" /> Cetak
        </button>
      </div>
    </div>
  )
}
