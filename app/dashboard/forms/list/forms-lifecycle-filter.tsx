'use client'

import { Icon } from '@/components/ui/Icons'
import type { TabCounts, LifecycleTab, ViewMode, SortBy } from './forms-utils'

type FormsLifecycleFilterProps = {
  lifecycleTab: LifecycleTab
  tabCounts: TabCounts
  searchTerm: string
  categories: string[]
  categoryFilter: string
  sortBy: SortBy
  viewMode: ViewMode
  selectedFormIds: string[]
  filteredFormsCount: number
  onTabChange: (tab: LifecycleTab) => void
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onSortChange: (value: SortBy) => void
  onViewModeChange: (mode: ViewMode) => void
  onSelectAll: () => void
  onBulkDelete: () => void
}

export default function FormsLifecycleFilter({
  lifecycleTab,
  tabCounts,
  searchTerm,
  categories,
  categoryFilter,
  sortBy,
  viewMode,
  selectedFormIds,
  filteredFormsCount,
  onTabChange,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onViewModeChange,
  onSelectAll,
  onBulkDelete,
}: FormsLifecycleFilterProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800/60">
        {(
          [
            { id: 'all', label: 'Semua', count: tabCounts.all },
            { id: 'draft', label: 'Draft', count: tabCounts.draft },
            { id: 'ready', label: 'Siap', count: tabCounts.ready },
            { id: 'active', label: 'Aktif', count: tabCounts.active },
            { id: 'archived', label: 'Arsip', count: tabCounts.archived },
          ] as const
        ).map((tab) => {
          const isActive = lifecycleTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* SEARCH, CATEGORY & SORT BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/80">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Icon name="search" className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari formulir atau kode..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters & Sorting */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortBy)}
            className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
          >
            <option value="updated">Terbaru Ditambahkan</option>
            <option value="title">Judul A-Z</option>
            <option value="questions">Jumlah Soal Terbanyak</option>
          </select>

          {/* Select All Checkbox Button */}
          <button
            type="button"
            onClick={onSelectAll}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedFormIds.length > 0 && selectedFormIds.length === filteredFormsCount
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Pilih Semua Formulir Terfilter"
          >
            <input
              type="checkbox"
              checked={selectedFormIds.length > 0 && selectedFormIds.length === filteredFormsCount}
              onChange={() => {}}
              className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-emerald-500 pointer-events-none"
            />
            <span>Select All</span>
          </button>

          {/* Bulk Delete Action Button */}
          {selectedFormIds.length > 0 && (
            <button
              type="button"
              onClick={onBulkDelete}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all cursor-pointer animate-pulse"
            >
              <Icon name="trash" className="w-3.5 h-3.5" />
              <span>Hapus {selectedFormIds.length} Terpilih</span>
            </button>
          )}

          {/* View Mode Switcher */}
          <div className="flex items-center p-0.5 bg-slate-950/80 border border-slate-800 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tampilan Grid Card Aesthetic"
            >
              <Icon name="grid" className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tampilan Daftar Compact Row"
            >
              <Icon name="list" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
