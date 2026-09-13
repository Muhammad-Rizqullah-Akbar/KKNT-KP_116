'use client'

import { Icon } from '@/components/ui/Icons'
import { SkeletonTable } from '@/components/ui/Skeleton'
import type { CadreMetric, UserProfile } from './types'

interface CadresTabProps {
  filteredRankedCadreMetrics: CadreMetric[]
  paginatedCadreLeaderboard: CadreMetric[]
  isLoading: boolean
  cadreCurrentPage: number
  cadreTotalPages: number
  onPrevPage: () => void
  onNextPage: () => void
  onInspectCadre: (cadre: UserProfile) => void
}

export default function CadresTab({
  filteredRankedCadreMetrics,
  paginatedCadreLeaderboard,
  isLoading,
  cadreCurrentPage,
  cadreTotalPages,
  onPrevPage,
  onNextPage,
  onInspectCadre,
}: CadresTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Icon name="award" className="w-4.5 h-4.5 text-amber-400" />
          <span className="font-bold text-slate-200">Leaderboard Kontribusi Kader Lapangan Nasional</span>
        </div>
        <span className="text-cyan-400 font-bold">Total: {filteredRankedCadreMetrics.length} Kader</span>
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} cols={8} />
      ) : filteredRankedCadreMetrics.length === 0 ? (
        <div className="py-12 text-center text-slate-500 font-mono text-xs bg-slate-900/40 rounded-2xl border border-slate-800 p-8">
          Tidak ada data kader ditemukan untuk filter ini.
        </div>
      ) : (
        <div className="space-y-4">
          {/* LEADERBOARD CARD LIST */}
          <div className="space-y-3">
            {paginatedCadreLeaderboard.map((item, idx) => {
              const globalRank = (cadreCurrentPage - 1) * 20 + idx + 1
              const isTop1 = globalRank === 1
              const isTop2 = globalRank === 2
              const isTop3 = globalRank === 3

              return (
                <div
                  key={item.cadre.uid}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isTop1
                      ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/50 shadow-xl shadow-amber-950/20'
                      : isTop2
                      ? 'bg-gradient-to-r from-slate-800/40 via-slate-900 to-slate-950 border-slate-400/40 shadow-lg'
                      : isTop3
                      ? 'bg-gradient-to-r from-orange-950/30 via-slate-900 to-slate-950 border-orange-500/40 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* RANK & CADRE INFO */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 border font-mono ${
                        isTop1
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : isTop2
                          ? 'bg-slate-700/30 border-slate-400/40 text-slate-200'
                          : isTop3
                          ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {isTop1 ? (
                        <Icon name="trophy" className="w-5 h-5 text-amber-400" />
                      ) : isTop2 ? (
                        <Icon name="award" className="w-5 h-5 text-slate-300" />
                      ) : isTop3 ? (
                        <Icon name="award" className="w-5 h-5 text-orange-400" />
                      ) : (
                        `#${globalRank}`
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-100">{item.cadre.displayName}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          🏢 {item.organizationName}
                        </span>
                        {isTop1 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            CHAMPION #1
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono">{item.cadre.email}</p>
                    </div>
                  </div>

                  {/* METRICS & ACTIONS */}
                  <div className="flex items-center gap-4 flex-wrap self-end md:self-auto justify-between md:justify-end w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <div className="text-center px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Kode Dibuat</span>
                        <span className="font-bold text-slate-300">{item.distCount} Kode</span>
                      </div>

                      <div className="text-center px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Respon Terjaring</span>
                        <span className="font-bold text-cyan-300">{item.respCount} Respon</span>
                      </div>

                      <div className="text-center px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Pass Rate</span>
                        <span className="font-bold text-emerald-400">{item.passRate}%</span>
                      </div>

                      <div className="text-center px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Skor Evaluasi</span>
                        <span className="font-bold text-emerald-300">{item.respCount > 0 ? `${item.avgScore}%` : '-'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onInspectCadre(item.cadre)}
                      className="px-3.5 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold text-xs font-mono transition-colors shrink-0"
                    >
                      Inspeksi Kontribusi →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* CADRE LEADERBOARD PAGINATION CONTROLS (MAX 20 CADRES PER PAGE) */}
          {cadreTotalPages > 1 && (
            <div className="flex items-center justify-between pt-4 text-xs font-mono">
              <button
                disabled={cadreCurrentPage === 1}
                onClick={onPrevPage}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-30 text-slate-300 hover:text-white"
              >
                ← Leaderboard Sebelumnya
              </button>
              <span className="text-slate-400">
                Halaman Leaderboard <strong className="text-cyan-400">{cadreCurrentPage}</strong> dari <strong>{cadreTotalPages}</strong>
              </span>
              <button
                disabled={cadreCurrentPage === cadreTotalPages}
                onClick={onNextPage}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-30 text-slate-300 hover:text-white"
              >
                Leaderboard Selanjutnya →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
