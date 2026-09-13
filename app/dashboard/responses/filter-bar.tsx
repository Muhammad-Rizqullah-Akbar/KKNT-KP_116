'use client'

import { Icon } from '@/components/ui/Icons'
import type { FormMetaItem, PersonAuthorOption } from './types'

type FilterBarProps = {
  searchTerm: string
  selectedFormId: string
  selectedAuthorCode: string
  mergedFormOptions: FormMetaItem[]
  availableAuthors: PersonAuthorOption[]
  selectedResponseIdsCount: number
  canExport: boolean
  viewLayout: 'cards' | 'table'
  onSearchChange: (value: string) => void
  onFormChange: (value: string) => void
  onAuthorChange: (value: string) => void
  onReset: () => void
  onExportExcel: () => void
  onBulkDelete: () => void
  onViewLayoutChange: (layout: 'cards' | 'table') => void
  onRefetch: () => void
}

export default function FilterBar({
  searchTerm,
  selectedFormId,
  selectedAuthorCode,
  mergedFormOptions,
  availableAuthors,
  selectedResponseIdsCount,
  canExport,
  viewLayout,
  onSearchChange,
  onFormChange,
  onAuthorChange,
  onReset,
  onExportExcel,
  onBulkDelete,
  onViewLayoutChange,
  onRefetch,
}: FilterBarProps) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-md">
      <div className="flex flex-wrap items-end gap-3 flex-1">
        {/* Smart Search Bar */}
        <div className="flex flex-col flex-1 sm:flex-initial">
          <label className="text-[10px] font-mono text-slate-400 font-bold uppercase mb-1">Cari Responden</label>
          <div className="relative">
            <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Nama / email / lokasi..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-48"
            />
          </div>
        </div>

        {/* KIRI: Filter Formulir */}
        <div className="flex flex-col flex-1 sm:flex-initial">
          <label className="text-[10px] font-mono text-cyan-400 font-bold uppercase mb-1">1. Formulir (Kiri)</label>
          <select
            value={selectedFormId}
            onChange={(e) => onFormChange(e.target.value)}
            className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-semibold w-full sm:w-56"
          >
            <option value="all">Semua Formulir ({mergedFormOptions.length})</option>
            {mergedFormOptions.map((form) => (
              <option key={form.formId} value={form.formId}>
                {form.title}
              </option>
            ))}
          </select>
        </div>

        {/* KANAN: Filter Author / Orang (Superadmin, Kader 1, Mitra, dst) */}
        <div className="flex flex-col flex-1 sm:flex-initial">
          <label className="text-[10px] font-mono text-purple-400 font-bold uppercase mb-1">2. Author / Orang (Kanan)</label>
          <select
            value={selectedAuthorCode}
            onChange={(e) => onAuthorChange(e.target.value)}
            className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-semibold w-full sm:w-72"
          >
            <option value="all">Semua Author / Orang ({availableAuthors.length})</option>
            {availableAuthors.map((author) => (
              <option key={author.ownerKey} value={author.ownerKey}>
                {author.ownerName} ({author.ownerType === 'super_admin' ? 'Super Admin' : author.ownerType === 'cadre' ? 'Kader' : 'Mitra'})
              </option>
            ))}
          </select>
        </div>

        {(searchTerm || selectedFormId !== 'all' || selectedAuthorCode !== 'all') && (
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold transition-colors"
            title="Reset Filter"
          >
            Reset
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 self-start lg:self-auto">
        {selectedResponseIdsCount > 0 && (
          <button
            type="button"
            onClick={onBulkDelete}
            className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all animate-pulse"
          >
            <Icon name="trash" className="w-4 h-4" />
            <span>Hapus {selectedResponseIdsCount} Terpilih (Bulk Delete)</span>
          </button>
        )}

        <button
          type="button"
          onClick={onExportExcel}
          disabled={!canExport}
          className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
          title="Download rekapitulasi data nilai overall & penilaian per aspek ke Excel"
        >
          <Icon name="fileSpreadsheet" className="w-4 h-4 text-emerald-200" />
          <span>Export Excel</span>
        </button>

        {/* View Layout Switcher (Cards vs Table) */}
        <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono">
          <button
            type="button"
            onClick={() => onViewLayoutChange('cards')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              viewLayout === 'cards' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tampilan Kartu Skor Lingkaran"
          >
            <Icon name="grid" className="w-3.5 h-3.5" />
            <span>Kartu</span>
          </button>
          <button
            type="button"
            onClick={() => onViewLayoutChange('table')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              viewLayout === 'table' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tampilan Tabel Ringkas"
          >
            <Icon name="list" className="w-3.5 h-3.5" />
            <span>Tabel</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onRefetch}
          className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors"
        >
          <Icon name="rotateCcw" className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </div>
  )
}
