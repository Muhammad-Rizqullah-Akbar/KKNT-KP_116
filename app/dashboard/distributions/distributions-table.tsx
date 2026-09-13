'use client'

import { Icon } from '@/components/ui/Icons'
import { SkeletonTable } from '@/components/ui/Skeleton'
import type { DistributionDoc } from '@/lib/domain/distributions/distribution-types'

interface DistributionsTableProps {
  distributions: DistributionDoc[]
  filteredCount: number
  selectedDistIds: string[]
  isLoading: boolean
  error: string | null
  onLoadData: () => void
  onToggleSelectDist: (distId: string) => void
  onToggleSelectAll: () => void
  onOpenDetail: (distId: string) => void
  onOpenEdit: (distribution: DistributionDoc) => void
  onCopyLink: (code: string) => void
  onTogglePause: (distId: string) => void
  onDeleteClick: (distId: string, code: string, title: string) => void
}

export default function DistributionsTable({
  distributions,
  filteredCount,
  selectedDistIds,
  isLoading,
  error,
  onLoadData,
  onToggleSelectDist,
  onToggleSelectAll,
  onOpenDetail,
  onOpenEdit,
  onCopyLink,
  onTogglePause,
  onDeleteClick,
}: DistributionsTableProps) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md">
      {/* Table Select-All Header Control */}
      {filteredCount > 0 && (
        <div className="p-3.5 px-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 text-xs">
          <label className="flex items-center gap-2.5 font-mono font-bold text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selectedDistIds.length > 0 && selectedDistIds.length === filteredCount}
              onChange={onToggleSelectAll}
              className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
            />
            <span>Pilih Semua ({filteredCount} Kode Distribusi)</span>
          </label>

          {selectedDistIds.length > 0 && (
            <span className="text-[11px] font-mono text-cyan-400 font-bold bg-cyan-950/80 px-2.5 py-0.5 rounded-md border border-cyan-500/30">
              {selectedDistIds.length} Terpilih
            </span>
          )}
        </div>
      )}

      {isLoading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : error ? (
        <div className="p-8 text-center text-xs text-rose-300 space-y-2">
          <p className="font-semibold">{error}</p>
          <button onClick={onLoadData} className="px-3 py-1.5 rounded-lg bg-rose-950 border border-rose-500/40 text-rose-200">
            Coba Ulang
          </button>
        </div>
      ) : filteredCount === 0 ? (
        <div className="text-center py-16 text-slate-500 space-y-2">
          <Icon name="share2" className="w-10 h-10 mx-auto text-slate-700" />
          <p className="text-sm font-semibold text-slate-300">Belum Ada Kode Distribusi</p>
          <p className="text-xs text-slate-500">Klik "+ Buat Kode Distribusi" untuk menghasilkan tautan publik baru.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/80">
          {distributions.map((distribution) => {
            const isActive = distribution.status === 'active'
            const isPaused = distribution.status === 'paused'
            const isChecked = selectedDistIds.includes(distribution.distributionId)

            return (
              <div
                key={distribution.distributionId}
                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors border-b border-slate-800/50 last:border-0 ${
                  isChecked ? 'bg-slate-800/60' : 'hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-start gap-3.5 max-w-xl">
                  {/* Item Checkbox */}
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleSelectDist(distribution.distributionId)}
                    className="w-4 h-4 rounded accent-cyan-500 cursor-pointer mt-1 flex-shrink-0"
                  />

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-cyan-400 font-extrabold text-sm px-2.5 py-0.5 rounded-lg bg-cyan-950 border border-cyan-500/30">
                        {distribution.code}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase border ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : isPaused
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {distribution.status}
                      </span>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        {distribution.versionMode === 'pinned' ? `Pinned (${distribution.pinnedVersionId})` : 'Auto-Active (Versi Publik Terbaru)'}
                      </span>

                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-500/30 capitalize">
                        {distribution.ownerType === 'super_admin' ? 'BPOM Pusat' : distribution.ownerType === 'cadre' ? 'Kader Desa' : 'Kemitraan'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100">{distribution.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-1">{distribution.description || 'Tidak ada deskripsi tambahan.'}</p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono pt-1">
                      <span>Form ID: {distribution.formId}</span>
                      <span>•</span>
                      <span>Pemilik: {distribution.ownerName}</span>
                      <span>•</span>
                      <span>Dibuat: {new Date(distribution.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 self-start md:self-center flex-wrap pl-7 md:pl-0">
                  <button
                    type="button"
                    onClick={() => onOpenDetail(distribution.distributionId)}
                    className="px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Icon name="eye" className="w-3.5 h-3.5 text-purple-300" />
                    <span>Detail & Form</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenEdit(distribution)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Icon name="edit" className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCopyLink(distribution.code)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Icon name="copy" className="w-3.5 h-3.5" />
                    <span>Salin Link</span>
                  </button>

                  <a
                    href={`/form/${distribution.code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Icon name="externalLink" className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Buka</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => onTogglePause(distribution.distributionId)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isPaused
                        ? 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-200 border-emerald-500/40'
                        : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 border-amber-500/40'
                    }`}
                  >
                    <Icon name={isPaused ? 'play' : 'pause'} className="w-3.5 h-3.5" />
                    <span>{isPaused ? 'Aktifkan' : 'Jeda'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteClick(distribution.distributionId, distribution.code, distribution.title)}
                    className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Hapus Kode Distribusi Permanen"
                  >
                    <Icon name="trash" className="w-3.5 h-3.5 text-rose-400" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
