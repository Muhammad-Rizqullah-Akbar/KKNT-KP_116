'use client'

import { Icon } from '@/components/ui/Icons'
import type { MitraMetric, UserProfile } from './types'

interface MitraTabProps {
  mitraMetrics: MitraMetric[]
  onInspectCadre: (cadre: UserProfile) => void
}

export default function MitraTab({ mitraMetrics, onInspectCadre }: MitraTabProps) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono">
        <p className="font-bold text-sm text-purple-200">Mode Analisis Per-Mitra Instansi</p>
        <p className="text-purple-300/80 mt-0.5">
          Rincian mitra instansi menampilkan maksimal <strong>5 kader perwakilan teratas (*top 5 representative cadres*)</strong> per mitra untuk efisiensi beban browser & resource memory.
        </p>
      </div>

      <div className="space-y-4">
        {mitraMetrics.map((item) => (
          <div key={item.mitra.uid} className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold">
                  <Icon name="building" className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100">{item.mitra.displayName}</h3>
                  <p className="text-xs text-slate-400 font-mono">{item.mitra.email} • {item.mitra.partnershipType || 'Instansi'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-cyan-300">
                  {item.cadreCount} Kader Terikat
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-purple-300">
                  {item.respCount} Tanggapan
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-400">
                  {item.avgScore}% Rata-Rata Nilai
                </span>
              </div>
            </div>

            {/* MAX 5 TOP REPRESENTATIVE CADRES UNDER THIS MITRA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <h4 className="font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Icon name="users" className="w-3.5 h-3.5 text-cyan-400" />
                  Perwakilan 5 Kader Teratas Performa ({Math.min(5, item.topRepresentativeCadres.length)} / {item.cadreCount})
                </h4>
                {item.cadreCount > 5 && (
                  <span className="text-slate-500 font-bold">+ {item.cadreCount - 5} kader lainnya</span>
                )}
              </div>

              {item.topRepresentativeCadres.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500 font-mono text-center">
                  Belum ada kader terdaftar di bawah mitra ini.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-xs font-mono text-left">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-3 border-b border-slate-800">Nama Kader Perwakilan</th>
                        <th className="p-3 border-b border-slate-800">Email</th>
                        <th className="p-3 border-b border-slate-800 text-center">Kode Dibuat</th>
                        <th className="p-3 border-b border-slate-800 text-center">Respon Dikumpulkan</th>
                        <th className="p-3 border-b border-slate-800 text-center">Rata-Rata Skor</th>
                        <th className="p-3 border-b border-slate-800 text-right">Aksi Inspeksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {item.topRepresentativeCadres.map((cadMetric) => (
                        <tr key={cadMetric.cadre.uid} className="hover:bg-slate-900/60 transition-colors">
                          <td className="p-3 font-bold text-slate-100">{cadMetric.cadre.displayName}</td>
                          <td className="p-3 text-slate-400">{cadMetric.cadre.email}</td>
                          <td className="p-3 text-center font-bold text-slate-300">{cadMetric.distCount} Kode</td>
                          <td className="p-3 text-center font-bold text-cyan-300">{cadMetric.respCount} Respon</td>
                          <td className="p-3 text-center font-bold text-emerald-400">{cadMetric.respCount > 0 ? `${cadMetric.avgScore}%` : '-'}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => onInspectCadre(cadMetric.cadre)}
                              className="px-2.5 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold"
                            >
                              Inspeksi
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
