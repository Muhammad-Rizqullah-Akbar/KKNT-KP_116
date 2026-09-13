'use client'

import { Icon } from '@/components/ui/Icons'

type StatsCardsProps = {
  stats: {
    totalForms: number
    activeForms: number
    totalRespondents: number
    avgScore: number
    passRate: number
    evaluatedCount: number
  }
  selectedFormId: string
}

export default function StatsCards({ stats, selectedFormId }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/40 uppercase tracking-wider">Total Formulir</span>
          <Icon name="fileText" className="w-4 h-4 text-cyan-400" />
        </div>
        <p className="text-3xl font-bold font-display text-white">{stats.totalForms}</p>
        <p className="text-xs text-white/35 mt-1">{stats.activeForms} formulir aktif terdaftar</p>
      </div>

      <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/40 uppercase tracking-wider">Responden Terkumpul</span>
          <Icon name="users" className="w-4 h-4 text-violet-400" />
        </div>
        <p className="text-3xl font-bold font-display text-white">{stats.totalRespondents}</p>
        <p className="text-xs text-cyan-300 font-mono mt-1 truncate">
          {selectedFormId === 'all' ? 'Seluruh formulir database' : `Form Filter Terpilih`}
        </p>
      </div>

      <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/40 uppercase tracking-wider">Rata-rata Skor</span>
          <Icon name="barChart" className="w-4 h-4 text-amber-400" />
        </div>
        <p className="text-3xl font-bold font-display text-white">{stats.avgScore}%</p>
        <p className="text-xs text-emerald-400 font-mono mt-1">
          Dihitung dari {stats.evaluatedCount} respon terfilter
        </p>
      </div>

      <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/40 uppercase tracking-wider">Tingkat Kelulusan (≥80%)</span>
          <Icon name="checkCircle" className="w-4 h-4 text-emerald-400" />
        </div>
        <p className="text-3xl font-bold font-display text-emerald-300">{stats.passRate}%</p>
        <p className="text-xs text-white/35 mt-1">Pass rate respon terfilter</p>
      </div>
    </div>
  )
}
