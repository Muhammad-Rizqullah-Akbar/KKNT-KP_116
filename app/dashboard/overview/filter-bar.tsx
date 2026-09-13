'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'

type FilterBarProps = {
  selectedFormId: string
  forms: any[]
  onFormChange: (formId: string) => void
}

export default function FilterBar({ selectedFormId, forms, onFormChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-[#080812] border border-white/[0.05] p-5 rounded-2xl">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
          <Icon name="filter" className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="flex-1 sm:w-80">
          <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Filter Dashboard Berdasarkan Formulir</label>
          <select
            value={selectedFormId}
            onChange={(e) => onFormChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-cyan-400/40 cursor-pointer"
          >
            <option value="all" className="bg-[#080812]">Semua Formulir (Global)</option>
            {forms.map((f, idx) => {
              const formKey = f.id || f.code || `form-opt-${idx}`
              const formVal = f.id || f.code || `form-val-${idx}`
              return (
                <option key={formKey} value={formVal} className="bg-[#080812]">
                  {f.title} ({f.code})
                </option>
              )
            })}
          </select>
        </div>
      </div>

      <Link href="/dashboard/widgets">
        <button className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white transition-all shadow-lg shadow-violet-600/25 flex items-center gap-2">
          <Icon name="settings" className="w-4 h-4" /> Atur Widget & Stacking Accounting
        </button>
      </Link>
    </div>
  )
}
