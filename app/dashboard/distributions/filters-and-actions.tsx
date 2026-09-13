'use client'

import { Icon } from '@/components/ui/Icons'

interface FiltersAndActionsProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
  ownerFilter: string
  onOwnerChange: (value: string) => void
  isGlobalRole: boolean
  isPartnershipRole: boolean
  onRefresh: () => void
  onOpenPermissionModal: () => void
  onOpenCreateModal: () => void
}

export default function FiltersAndActions({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  ownerFilter,
  onOwnerChange,
  isGlobalRole,
  isPartnershipRole,
  onRefresh,
  onOpenPermissionModal,
  onOpenCreateModal,
}: FiltersAndActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative">
          <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari kode / judul / kader..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif Menyebar</option>
          <option value="paused">Dijeda</option>
          <option value="expired">Masa Berlaku Habis</option>
        </select>

        {/* Owner Filter (Global Roles Only) */}
        {isGlobalRole ? (
          <select
            value={ownerFilter}
            onChange={(e) => onOwnerChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Semua Pemilik</option>
            <option value="super_admin">BPOM Pusat</option>
            <option value="cadre">Kader Desa</option>
            <option value="partnership">Kemitraan</option>
          </select>
        ) : isPartnershipRole ? (
          <span className="px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-semibold">
            🏢 Skop Kemitraan: [Mitra Saya + Kader Subordinat]
          </span>
        ) : (
          <span className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold">
            👤 Skop Kader: [Kode Distribusi Saya]
          </span>
        )}

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
          title="Refresh Data"
        >
          <Icon name="rotateCcw" className="w-4 h-4 text-cyan-400" />
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Permission & Active Version Modal Trigger (Strictly Restricted to Global Roles) */}
        {isGlobalRole && (
          <button
            type="button"
            onClick={onOpenPermissionModal}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-800 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Icon name="settings" className="w-4 h-4 text-emerald-400" />
            <span>Izin & Versi Aktif</span>
          </button>
        )}

        {/* Create Distribution Trigger Button */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Icon name="plus" className="w-4 h-4" />
          <span>Buat Kode Distribusi</span>
        </button>
      </div>
    </div>
  )
}
