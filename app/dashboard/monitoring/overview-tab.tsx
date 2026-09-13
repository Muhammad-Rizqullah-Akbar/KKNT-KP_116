'use client'

import { Icon } from '@/components/ui/Icons'
import type { MonitoringStats, TopContributorsByMitra, UserProfile } from './types'

interface OverviewTabProps {
  stats: MonitoringStats
  topContributorsByMitra: TopContributorsByMitra
  onOpenCadres: () => void
  onInspectCadre: (cadre: UserProfile) => void
}

export default function OverviewTab({ stats, topContributorsByMitra, onOpenCadres, onInspectCadre }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-950 border border-violet-500/30 space-y-2">
          <span className="text-[10px] font-mono text-violet-300 uppercase font-bold tracking-wider">Total Kader Lapangan</span>
          <p className="text-3xl font-black font-mono text-violet-200">{stats.totalCadres}</p>
          <p className="text-[11px] text-slate-400 font-mono">
            <span className="text-emerald-400 font-bold">{stats.activeCadresCount}</span> Kader Aktif Berkontribusi
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 space-y-2">
          <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">Total Mitra Instansi</span>
          <p className="text-3xl font-black font-mono text-cyan-200">{stats.totalMitra}</p>
          <p className="text-[11px] text-slate-400 font-mono">Sponsorship / Mitra</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-2">
          <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">Rata-Rata Nilai Evaluasi</span>
          <p className="text-3xl font-black font-mono text-emerald-200">{stats.avgScore}%</p>
          <p className="text-[11px] text-slate-400 font-mono">Seluruh Kader & Responden</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 space-y-2">
          <span className="text-[10px] font-mono text-amber-300 uppercase font-bold tracking-wider">Total Tanggapan Terkumpul</span>
          <p className="text-3xl font-black font-mono text-amber-200">{stats.totalResponses}</p>
          <p className="text-[11px] text-slate-400 font-mono">Terkumpul oleh Kader</p>
        </div>
      </div>

      {/* TOP KONTRIBUTOR KADER DIPISAHKAN PER-MITRA */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Icon name="award" className="w-5 h-5 text-amber-400" />
              <span>Top Kontributor Kader Lapangan (Dipisahkan Per-Mitra Instansi)</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Peringkat kontributor kader terbaik yang dikelompokkan secara terpisah untuk setiap Mitra Instansi.
            </p>
          </div>

          <button
            onClick={onOpenCadres}
            className="text-xs font-mono text-cyan-400 hover:underline shrink-0"
          >
            Buka Leaderboard Kader ({stats.totalCadres}) →
          </button>
        </div>

        {/* ITERATE TOP CONTRIBUTORS PER MITRA */}
        <div className="space-y-6">
          {topContributorsByMitra.mitraGroups.map(({ mitra, topCadres }) => (
            <div key={mitra.uid} className="rounded-2xl bg-slate-950 border border-slate-800/80 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Icon name="building" className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{mitra.displayName}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">{mitra.partnershipType || 'Instansi'} • {mitra.email}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-mono font-bold">
                  {topCadres.length} Top Kontributor
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {topCadres.map((item, idx) => (
                  <div key={item.cadre.uid} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center gap-1">
                        <Icon name="trophy" className="w-3 h-3 text-amber-400" />
                        RANK #{idx + 1} BEST
                      </span>
                      <span className="text-emerald-400 font-bold">{item.avgScore}% Skor</span>
                    </div>

                    <div>
                      <p className="font-bold text-slate-100 text-xs">{item.cadre.displayName}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{item.cadre.email}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-950 p-2 rounded-lg">
                      <div>
                        <span className="text-slate-500 block">Respon:</span>
                        <span className="font-bold text-cyan-300">{item.respCount} Tanggapan</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Pass Rate:</span>
                        <span className="font-bold text-emerald-400">{item.passRate}%</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onInspectCadre(item.cadre)}
                      className="w-full py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold transition-colors"
                    >
                      Inspeksi Kontribusi →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {topContributorsByMitra.topIndependent.length > 0 && (
            <div className="rounded-2xl bg-slate-950 border border-slate-800/80 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Icon name="user" className="w-4 h-4 text-slate-300" />
                  <h4 className="font-bold text-sm text-slate-200">Kader Lapangan Independen / Tanpa Mitra Induk</h4>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {topContributorsByMitra.topIndependent.map((item, idx) => (
                  <div key={item.cadre.uid} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold flex items-center gap-1">
                        <Icon name="award" className="w-3 h-3 text-slate-400" />
                        INDIE #{idx + 1}
                      </span>
                      <span className="text-emerald-400 font-bold">{item.avgScore}% Skor</span>
                    </div>

                    <div>
                      <p className="font-bold text-slate-100 text-xs">{item.cadre.displayName}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{item.cadre.email}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-950 p-2 rounded-lg">
                      <div>
                        <span className="text-slate-500 block">Respon:</span>
                        <span className="font-bold text-cyan-300">{item.respCount} Tanggapan</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Pass Rate:</span>
                        <span className="font-bold text-emerald-400">{item.passRate}%</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onInspectCadre(item.cadre)}
                      className="w-full py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold transition-colors"
                    >
                      Inspeksi Kontribusi →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
