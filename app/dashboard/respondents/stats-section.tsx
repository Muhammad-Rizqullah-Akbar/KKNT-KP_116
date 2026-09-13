'use client'

import { Icon, type IconName } from '@/components/ui/Icons'
import type { Respondent } from './types'

type StatsSectionProps = {
  filteredData: Respondent[]
  aspectAverages: Array<{ title: string; avgPercentage: number; count: number }>
}

export default function StatsSection({ filteredData, aspectAverages }: StatsSectionProps) {
  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Responden', value: filteredData.length, icon: 'users', color: 'text-cyan-400', bg: 'border-cyan-500/20 bg-cyan-500/5' },
          { label: 'Rata-Rata Overall', value: `${filteredData.length > 0 ? Math.round(filteredData.reduce((sum, resp) => sum + resp.score, 0) / filteredData.length) : 0}%`, icon: 'award', color: 'text-purple-400', bg: 'border-purple-500/20 bg-purple-500/5' },
          { label: 'Terverifikasi', value: filteredData.filter(r => r.status === 'Terverifikasi').length, icon: 'checkCircle', color: 'text-emerald-400', bg: 'border-emerald-500/20 bg-emerald-500/5' },
          { label: 'Perlu Review', value: filteredData.filter(r => r.status === 'Perlu Review').length, icon: 'alertCircle', color: 'text-amber-400', bg: 'border-amber-500/20 bg-amber-500/5' },
          { label: 'Tindak Lanjut', value: filteredData.filter(r => r.status === 'Perlu Tindak Lanjut').length, icon: 'info', color: 'text-rose-400', bg: 'border-rose-500/20 bg-rose-500/5' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-2xl border p-3.5 space-y-1 ${stat.bg}`}>
            <div className="flex items-center gap-2">
              <Icon name={stat.icon as IconName} className={`w-4 h-4 ${stat.color}`} />
              <span className="text-[10px] font-mono text-white/60 uppercase font-bold">{stat.label}</span>
            </div>
            <p className={`text-2xl font-black font-mono tracking-tight ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* SUMMARY RATA-RATA PENILAIAN PER ASPEK (ASPEK SIKAP, PERILAKU, DLL) */}
      {aspectAverages.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#080812] border border-white/10 space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <h3 className="text-xs font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-2">
              <Icon name="layers" className="w-4 h-4 text-cyan-400" />
              <span>Rata-Rata Penilaian Per Aspek (Ringkasan Aspek Sikap, Perilaku & Aspek Lainnya)</span>
            </h3>
            <span className="text-[10px] font-mono text-white/40">
              {aspectAverages.length} Aspek Terkonfigurasi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {aspectAverages.map((asp, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white/3 border border-white/5 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-100 truncate pr-2">{asp.title}</span>
                  <span className="text-sm font-black font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                    {asp.avgPercentage}%
                  </span>
                </div>

                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      asp.avgPercentage >= 80 ? 'bg-emerald-400' : asp.avgPercentage >= 60 ? 'bg-cyan-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, asp.avgPercentage))}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-white/40">
                  <span>Kategori: <strong className={asp.avgPercentage >= 80 ? 'text-emerald-400' : asp.avgPercentage >= 60 ? 'text-cyan-400' : 'text-amber-400'}>
                    {asp.avgPercentage >= 80 ? 'Sangat Baik' : asp.avgPercentage >= 60 ? 'Baik' : 'Perlu Perhatian'}
                  </strong></span>
                  <span>({asp.count} responden)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
