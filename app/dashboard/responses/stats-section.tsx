'use client'

import { Icon } from '@/components/ui/Icons'

type Stats = { total: number; avgScore: number; passCount: number }

type StatsSectionProps = {
  stats: Stats
  filteredAspectAverages: Array<{ title: string; avgPercentage: number; count: number }>
  selectedFormId: string
  filteredCount: number
}

export default function StatsSection({
  stats,
  filteredAspectAverages,
  selectedFormId,
  filteredCount,
}: StatsSectionProps) {
  return (
    <>
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold">Total Laporan Terverifikasi</span>
            <Icon name="checkCircle" className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black font-mono text-slate-100">{stats.total}</p>
          <p className="text-[11px] text-emerald-400/80 font-mono">Hasil terfilter aktif ({selectedFormId === 'all' ? 'Semua form' : 'Form terpilih'})</p>
        </div>

        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold">Rata-rata Skor Evaluasi</span>
            <Icon name="award" className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-black font-mono text-purple-300">{stats.avgScore}%</p>
          <p className="text-[11px] text-slate-500 font-mono">Rerata skor respon terfilter</p>
        </div>

        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold">Memenuhi Syarat (MS)</span>
            <Icon name="shieldCheck" className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black font-mono text-amber-300">{stats.passCount}</p>
          <p className="text-[11px] text-amber-400/80 font-mono">Skor kelayakan &ge; 75% terfilter</p>
        </div>
      </div>

      {/* RATA-RATA SKOR PER-ASPEK UTAMA (BENCHMARK TERFILTER) */}
      {filteredAspectAverages.length > 0 && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Icon name="layers" className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
                Rata-rata Skor Per-Aspek Utama ({filteredAspectAverages.length} Aspek Benchmark)
              </h3>
            </div>
            <span className="text-[11px] text-cyan-400 font-bold bg-cyan-950 px-2.5 py-0.5 rounded-md border border-cyan-500/30">
              Terintegrasi Filter ({filteredCount} Tanggapan)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredAspectAverages.map((asp, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 truncate max-w-[170px]" title={asp.title}>
                    {asp.title}
                  </span>
                  <span className="font-black text-cyan-300">{asp.avgPercentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      asp.avgPercentage >= 80 ? 'bg-emerald-500' : asp.avgPercentage >= 60 ? 'bg-cyan-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${asp.avgPercentage}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                  <span>Rata-rata terfilter</span>
                  <span className="text-slate-300 font-bold">{asp.count} respon</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
