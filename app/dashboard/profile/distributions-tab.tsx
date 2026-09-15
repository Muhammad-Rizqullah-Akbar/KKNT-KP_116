'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'
import type { DistributionDoc } from '@/lib/domain/distributions/distribution-types'

type DistributionsTabProps = {
  distributions: DistributionDoc[]
}

export default function DistributionsTab({ distributions }: DistributionsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
          <Icon name="send" className="w-4 h-4 text-cyan-400" />
          <span>Kode Distribusi Kuesioner  Milik Anda</span>
        </h3>

        <Link
          href="/dashboard/distributions"
          className="px-3 py-1.5 rounded-xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold hover:bg-cyan-600/30 transition-all"
        >
          + Buat Kode Distribusi
        </Link>
      </div>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
        {distributions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <Icon name="send" className="w-10 h-10 mx-auto text-slate-700" />
            <p className="font-bold text-slate-300">Belum ada kode distribusi instrumen </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {distributions.map((d) => (
              <div key={d.distributionId} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-cyan-400 font-extrabold text-xs px-2.5 py-0.5 rounded-lg bg-cyan-950 border border-cyan-500/30">
                      {d.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                      d.status === 'active' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}>
                      {d.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100">{d.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-1">{d.description || 'Distribusi kuesioner .'}</p>
                </div>

                <a
                  href={`/form/${d.code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-cyan-600/20 text-cyan-200 border border-cyan-500/40 text-xs font-semibold self-start md:self-center transition-colors"
                >
                  Buka Form Publik
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
