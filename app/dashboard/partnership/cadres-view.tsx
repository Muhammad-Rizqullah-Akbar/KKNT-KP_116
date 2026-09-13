'use client'

import { Icon } from '@/components/ui/Icons'
import { SkeletonTable } from '@/components/ui/Skeleton'
import type { CadresByMitraGroup, UserProfile } from './types'

type CadresViewProps = {
  isLoading: boolean
  cadresByMitraGroup: CadresByMitraGroup
  onOpenCreateCadreModal: (mitra?: UserProfile) => void
  onInspectCadre: (cadre: UserProfile) => void
}

function CadreTable({ cadres, onInspectCadre }: { cadres: UserProfile[]; onInspectCadre: (cadre: UserProfile) => void }) {
  return (
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
  )
}

export default function CadresView({
  isLoading,
  cadresByMitraGroup,
  onOpenCreateCadreModal,
  onInspectCadre,
}: CadresViewProps) {
  return (
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
                <CadreTable cadres={cadres} onInspectCadre={onInspectCadre} />
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

              <CadreTable cadres={cadresByMitraGroup.unattachedCadres} onInspectCadre={onInspectCadre} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
