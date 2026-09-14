'use client'

import { Icon } from '@/components/ui/Icons'
import type { LegacyStatusFilter, LegacyViewMode } from './forms-utils'

type FormsFilterBarProps = {
  searchTerm: string
  statusFilter: LegacyStatusFilter
  selectedGroupId: string
  viewMode: LegacyViewMode
  setSearchTerm: (v: string) => void
  setStatusFilter: (v: LegacyStatusFilter) => void
  setSelectedGroupId: (v: string) => void
  setViewMode: (v: LegacyViewMode) => void
}

export default function FormsFilterBar(props: FormsFilterBarProps) {
  const {
    searchTerm, statusFilter, selectedGroupId, viewMode,
    setSearchTerm, setStatusFilter, setSelectedGroupId, setViewMode,
  } = props

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 sm:flex-initial">
          <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari judul V1.0 / kode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          {(['all', 'published', 'draft'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                statusFilter === status
                  ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status === 'all' ? 'Semua Status' : status === 'published' ? 'Terpublikasi' : 'Draft'}
            </button>
          ))}
        </div>

      </div>

      {/* Grid / Table Toggle */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl self-end md:self-auto">
        <button
          onClick={() => setViewMode('grid')}
          className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
            viewMode === 'grid' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-400'
          }`}
          title="Tampilan Kartu (Grid)"
        >
          <Icon name="grid" className="w-4 h-4" />
          <span className="hidden sm:inline">Kartu</span>
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
            viewMode === 'table' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-400'
          }`}
          title="Tampilan Tabel (List)"
        >
          <Icon name="list" className="w-4 h-4" />
          <span className="hidden sm:inline">Tabel</span>
        </button>
      </div>
    </div>
  )
}
