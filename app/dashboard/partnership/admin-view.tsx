'use client'

import { Icon } from '@/components/ui/Icons'
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton'
import { PARTNERSHIP_TYPES } from './types'
import type { UserProfile, CadresByMitraGroup, CadreProgressSummary, MitraProgressSummary } from './types'

type AdminViewProps = {
  activeTab: 'mitra' | 'cadres' | 'activities'
  isLoading: boolean
  partnersList: UserProfile[]
  filteredMitra: UserProfile[]
  paginatedMitra: UserProfile[]
  filteredCadres: UserProfile[]
  cadresByMitraGroup: CadresByMitraGroup
  searchTerm: string
  typeFilter: string
  selectedMitraFilter: string
  onSearchChange: (term: string) => void
  onTypeFilterChange: (type: string) => void
  onMitraFilterChange: (mitraId: string) => void
  onTabChange: (tab: 'mitra' | 'cadres' | 'activities') => void
  getCadresForMitra: (mitra: UserProfile) => UserProfile[]
  getCadreProgressSummary: (cadreUid: string) => CadreProgressSummary
  getMitraProgressSummary: (mitra: UserProfile) => MitraProgressSummary
  onSelectMitraDetail: (mitra: UserProfile) => void
  onInspectCadre: (cadre: UserProfile) => void
  onOpenCreateMitra: () => void
  onOpenCreateCadreModal: (mitra?: UserProfile) => void
}

export default function AdminView({
  activeTab,
  isLoading,
  partnersList,
  filteredMitra,
  paginatedMitra,
  filteredCadres,
  cadresByMitraGroup,
  searchTerm,
  typeFilter,
  selectedMitraFilter,
  onSearchChange,
  onTypeFilterChange,
  onMitraFilterChange,
  onTabChange,
  getCadresForMitra,
  getCadreProgressSummary,
  getMitraProgressSummary,
  onSelectMitraDetail,
  onInspectCadre,
  onOpenCreateMitra,
  onOpenCreateCadreModal,
}: AdminViewProps) {
  return (
    <div className="space-y-6">
      {/* DOMAIN HEADER & NAVIGATION TABS FOR ADMIN */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/[0.06] backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-display text-white tracking-wide">Domain Kemitraan</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              GLOBAL OPERATIONAL HUB
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Kelola ekosistem operasional: Mitra Instansi, Kader Lapangan Terikat (Dipisahkan per-Mitra), & Aktivitas.
          </p>
        </div>

        {/* TAB BUTTONS FOR ADMIN */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => onTabChange('mitra')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
              activeTab === 'mitra'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Icon name="building" className="w-3.5 h-3.5" />
            Mitra ({partnersList.length})
          </button>

          <button
            onClick={() => onTabChange('cadres')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
              activeTab === 'cadres'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Icon name="users" className="w-3.5 h-3.5" />
            Tab Kader Dipisah Per-Mitra ({filteredCadres.length})
          </button>

          <button
            onClick={() => onTabChange('activities')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
              activeTab === 'activities'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Icon name="trendingUp" className="w-3.5 h-3.5" />
            Aktivitas Lapangan
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      {activeTab !== 'activities' && (
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/40 p-3.5 rounded-xl border border-slate-800">
          <div className="flex flex-1 items-center gap-3 w-full">
            <div className="relative flex-1">
              <Icon name="search" className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activeTab === 'mitra' ? 'Cari nama mitra, email, PIC...' : 'Cari nama kader, email, instansi...'}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none focus:border-cyan-500/50"
            >
              {PARTNERSHIP_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>

            {activeTab === 'cadres' && (
              <select
                value={selectedMitraFilter}
                onChange={(e) => onMitraFilterChange(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="all">Semua Mitra Terkait</option>
                {partnersList.map((m) => (
                  <option key={m.uid} value={m.uid}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            {activeTab === 'mitra' && (
              <button
                onClick={onOpenCreateMitra}
                className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/10"
              >
                <Icon name="plus" className="w-4 h-4" />
                Tambah Mitra Baru
              </button>
            )}

            {activeTab === 'cadres' && (
              <button
                onClick={() => onOpenCreateCadreModal()}
                className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/10"
              >
                <Icon name="userPlus" className="w-4 h-4" />
                Tambah Kader Baru
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: MITRA LIST & CONTEXTUAL CADRES */}
      {activeTab === 'mitra' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredMitra.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs bg-slate-900/40 rounded-2xl border border-slate-800 p-8 space-y-2">
              <Icon name="building" className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-bold text-slate-300">Tidak ada Mitra ditemukan</p>
              <p className="text-[11px] text-slate-500">Coba ubah kata kunci pencarian atau filter jenis instansi.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedMitra.map((mitra) => {
                const linkedCadres = getCadresForMitra(mitra)
                return (
                  <div
                    key={mitra.uid}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-4 flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {mitra.partnershipType || 'Instansi'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {linkedCadres.length} Kader Terkait
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-slate-100 group-hover:text-cyan-300 transition-colors">
                          {mitra.displayName}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono truncate">{mitra.email}</p>
                      </div>

                      <div className="text-xs text-slate-400 space-y-1 font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                        <p className="flex justify-between">
                          <span className="text-slate-500">Kontak HP/WA:</span>
                          <span className="text-slate-200 font-bold">{mitra.phone || '-'}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-500">Kader Binaan:</span>
                          <span className="text-cyan-400 font-bold">{linkedCadres.length} Orang</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onSelectMitraDetail(mitra)}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Icon name="eye" className="w-3.5 h-3.5 text-cyan-400" />
                        Detail & Kader
                      </button>

                      <button
                        onClick={() => onOpenCreateCadreModal(mitra)}
                        className="py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold text-xs transition-colors flex items-center justify-center gap-1"
                        title="Tambah Kader langsung untuk Mitra ini"
                      >
                        <Icon name="userPlus" className="w-3.5 h-3.5" />
                        +Kader
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CADRES VIEW - GROUPED BY MITRA FOR SUPER ADMIN / ADMIN / BPOM */}
      {activeTab === 'cadres' && (
        <div className="space-y-6">
          {isLoading ? (
            <SkeletonTable rows={6} cols={5} />
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Icon name="shieldCheck" className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-cyan-200">Tampilan Pengawasan: Kader Dipisah Berdasarkan Mitra</p>
                    <p className="text-cyan-400/80 mt-0.5">
                      Daftar kader di bawah ini secara eksplisit dipisahkan per-mitra instansi induk untuk memudahkan supervisi.
                    </p>
                  </div>
                </div>
              </div>

              {cadresByMitraGroup.mitraGroups.map(({ mitra, cadres }) => (
                <div key={mitra.uid} className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                        <Icon name="building" className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-slate-100">{mitra.displayName}</h3>
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                            {mitra.partnershipType || 'Instansi'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">
                          Email: {mitra.email} • HP/WA: <span className="text-cyan-300 font-bold">{mitra.phone || '-'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-cyan-300">
                        {cadres.length} Kader Binaan
                      </span>

                      <button
                        onClick={() => onOpenCreateCadreModal(mitra)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-mono font-bold text-xs transition-colors flex items-center gap-1"
                      >
                        <Icon name="userPlus" className="w-3.5 h-3.5 text-cyan-400" />
                        + Kader Mitra Ini
                      </button>
                    </div>
                  </div>

                  {cadres.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 font-mono text-xs bg-slate-950/60 rounded-2xl border border-slate-800/80">
                      Belum ada Kader Lapangan terdaftar di bawah {mitra.displayName}.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                      <table className="w-full text-xs font-mono text-left">
                        <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                          <tr>
                            <th className="p-3 border-b border-slate-800">Nama Kader</th>
                            <th className="p-3 border-b border-slate-800">Email Login</th>
                            <th className="p-3 border-b border-slate-800">No. HP / WA</th>
                            <th className="p-3 border-b border-slate-800 text-right">Aksi Inspeksi Progress</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {cadres.map((c) => (
                            <tr key={c.uid} className="hover:bg-slate-900/60 transition-colors">
                              <td className="p-3">
                                <div className="font-bold text-slate-100">{c.displayName}</div>
                                <div className="text-[10px] text-purple-300 font-mono">ID: {c.uid.substring(0, 8)}</div>
                              </td>
                              <td className="p-3 text-slate-300">{c.email}</td>
                              <td className="p-3 text-slate-400">{c.phone || '-'}</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => onInspectCadre(c)}
                                  className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold text-[11px] transition-colors"
                                >
                                  Inspeksi Progress
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}

              {cadresByMitraGroup.unattachedCadres.length > 0 && (
                <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Icon name="user" className="w-4 h-4 text-slate-300" />
                      <span className="text-base font-bold text-slate-200">Kader Lapangan Independen / Tanpa Mitra Induk</span>
                      <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold">
                        {cadresByMitraGroup.unattachedCadres.length} Kader
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-xs font-mono text-left">
                      <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="p-3 border-b border-slate-800">Nama Kader</th>
                          <th className="p-3 border-b border-slate-800">Email Login</th>
                          <th className="p-3 border-b border-slate-800">No. HP / WA</th>
                          <th className="p-3 border-b border-slate-800 text-right">Aksi Inspeksi Progress</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {cadresByMitraGroup.unattachedCadres.map((c) => (
                          <tr key={c.uid} className="hover:bg-slate-900/60 transition-colors">
                            <td className="p-3">
                              <div className="font-bold text-slate-100">{c.displayName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">ID: {c.uid.substring(0, 8)}</div>
                            </td>
                            <td className="p-3 text-slate-300">{c.email}</td>
                            <td className="p-3 text-slate-400">{c.phone || '-'}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => onInspectCadre(c)}
                                className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold text-[11px] transition-colors"
                              >
                                Inspeksi Progress
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AKTIVITAS OPERASIONAL LAPANGAN */}
      {activeTab === 'activities' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Icon name="trendingUp" className="w-4 h-4 text-cyan-400" />
                Breakdown Aktivitas Operasional Lapangan (Edukasi CMS, Views, & Survei)
              </h3>
              <p className="text-xs text-slate-400">
                Rincian aktivitas lapangan terstruktur hierarkis untuk setiap Mitra Instansi dan Kader Lapangan, termasuk status penulisan artikel edukasi & total views.
              </p>
            </div>
          </div>

          {isLoading ? (
            <SkeletonTable rows={6} cols={5} />
          ) : partnersList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs bg-slate-900/40 rounded-2xl border border-slate-800 p-8">
              Belum ada data aktivitas kemitraan ditemukan.
            </div>
          ) : (
            <div className="space-y-6">
              {partnersList.map((mitra) => {
                const summary = getMitraProgressSummary(mitra)
                const linkedCadres = getCadresForMitra(mitra)

                return (
                  <div key={mitra.uid} className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-base text-slate-100">{mitra.displayName}</h4>
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            {mitra.partnershipType || 'Instansi'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">
                          PIC / Email: {mitra.email} • HP/WA: {mitra.phone || '-'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-500 block font-mono">Kader Binaan</span>
                          <span className="text-sm font-bold font-mono text-slate-100">{summary.cadreCount} Orang</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-500 block font-mono">Artikel Edukasi</span>
                          <span className="text-sm font-bold font-mono text-emerald-400">{summary.totalArticles} Artikel</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-500 block font-mono">Total Pembaca Views</span>
                          <span className="text-sm font-bold font-mono text-emerald-300 flex items-center justify-center gap-1">
                            <Icon name="eye" className="w-3.5 h-3.5 text-emerald-400" />
                            {summary.totalArticleViews}
                          </span>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-500 block font-mono">Total Kode Active</span>
                          <span className="text-sm font-bold font-mono text-cyan-400">{summary.totalDists} Kode</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-500 block font-mono">Respon Terkumpul</span>
                          <span className="text-sm font-bold font-mono text-purple-300">{summary.totalResponses}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Icon name="users" className="w-3.5 h-3.5 text-cyan-400" />
                        Detail Aktivitas Per-Kader Binaan ({linkedCadres.length})
                      </h5>

                      {linkedCadres.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-500 font-mono text-center">
                          Belum ada kader terdaftar di bawah mitra ini.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                          <table className="w-full text-xs font-mono text-left">
                            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                              <tr>
                                <th className="p-3 border-b border-slate-800">Nama Kader Lapangan</th>
                                <th className="p-3 border-b border-slate-800">Email Login</th>
                                <th className="p-3 border-b border-slate-800">Status Artikel CMS</th>
                                <th className="p-3 border-b border-slate-800">Views Artikel</th>
                                <th className="p-3 border-b border-slate-800">Kode Dibuat</th>
                                <th className="p-3 border-b border-slate-800">Respon Terjaring</th>
                                <th className="p-3 border-b border-slate-800 text-right">Detail Inspeksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {linkedCadres.map((cadre) => {
                                const prog = getCadreProgressSummary(cadre.uid)
                                return (
                                  <tr key={cadre.uid} className="hover:bg-slate-900/50 transition-colors">
                                    <td className="p-3 font-bold text-slate-100">{cadre.displayName}</td>
                                    <td className="p-3 text-slate-400">{cadre.email}</td>
                                    <td className="p-3">
                                      {prog.hasWrittenArticle ? (
                                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] flex items-center gap-1 w-fit">
                                          <Icon name="fileText" className="w-3 h-3 text-emerald-400" />
                                          {prog.articleCount} Artikel Diterbitkan
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-500 border border-slate-800 text-[10px] flex items-center gap-1 w-fit">
                                          <Icon name="xCircle" className="w-3 h-3 text-slate-500" />
                                          Belum Buat Artikel
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      {prog.articleViews > 0 ? (
                                        <span className="font-bold text-cyan-300 font-mono flex items-center gap-1">
                                          <Icon name="eye" className="w-3.5 h-3.5 text-cyan-400" />
                                          {prog.articleViews} Views
                                        </span>
                                      ) : (
                                        <span className="text-slate-500 font-mono">0 Views</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-cyan-400 font-bold">{prog.distCount} Kode</td>
                                    <td className="p-3 text-purple-300 font-bold">{prog.respCount} Respon</td>
                                    <td className="p-3 text-right">
                                      <button
                                        onClick={() => onInspectCadre(cadre)}
                                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700"
                                      >
                                        Inspeksi
                                      </button>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
