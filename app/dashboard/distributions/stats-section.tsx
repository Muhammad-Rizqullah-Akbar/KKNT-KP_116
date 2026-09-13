'use client'

import { Icon } from '@/components/ui/Icons'
import type { DistributionStats } from './types'

export default function StatsSection({ stats }: { stats: DistributionStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Total Distribusi</span>
          <Icon name="share2" className="w-4 h-4 text-cyan-400" />
        </div>
        <p className="text-2xl font-bold font-mono text-slate-100 mt-2">{stats.total}</p>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Aktif Menyebar</span>
          <Icon name="checkCircle" className="w-4 h-4 text-emerald-400" />
        </div>
        <p className="text-2xl font-bold font-mono text-emerald-300 mt-2">{stats.active}</p>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Dijeda Sementara</span>
          <Icon name="pauseCircle" className="w-4 h-4 text-amber-400" />
        </div>
        <p className="text-2xl font-bold font-mono text-amber-300 mt-2">{stats.paused}</p>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Masa Berlaku Habis</span>
          <Icon name="clock" className="w-4 h-4 text-rose-400" />
        </div>
        <p className="text-2xl font-bold font-mono text-rose-300 mt-2">{stats.expired}</p>
      </div>
    </div>
  )
}
