'use client'

import { Icon } from '@/components/ui/Icons'
import { SkeletonTable } from '@/components/ui/Skeleton'
import type { UserProfile, CadreProgressSummary, MitraProgressSummary } from './types'

type ActivitiesViewProps = {
  isLoading: boolean
  partnersList: UserProfile[]
  getCadresForMitra: (mitra: UserProfile) => UserProfile[]
  getCadreProgressSummary: (cadreUid: string) => CadreProgressSummary
  getMitraProgressSummary: (mitra: UserProfile) => MitraProgressSummary
  onInspectCadre: (cadre: UserProfile) => void
}

export default function ActivitiesView({
  isLoading,
  partnersList,
  getCadresForMitra,
  getCadreProgressSummary,
  getMitraProgressSummary,
  onInspectCadre,
}: ActivitiesViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Icon name="trendingUp" className="w-4 h-4 text-cyan-400" />
            Breakdown Aktivitas Operasional Lapangan (Edukasi CMS, Views, & Survei)
          </h3>
          <p className="text-xs text-slate-400">
            Rincian aktivitas lapangan terstruktur hierarkis untuk setiap Mitra Instansi dan Kader Lapangan, termasuk status penulisan artikel edukasi & total views.
          </p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : partnersList.length === 0 ? (
        <div className="py-12 text-center text-slate-500 font-mono text-xs bg-slate-900/40 rounded-2xl border border-slate-800 p-8">
          Belum ada data aktivitas kemitraan ditemukan.
        </div>
      ) : (
        <div className="space-y-6">
          {partnersList.map((mitra) => {
            const summary = getMitraProgressSummary(mitra)
            const linkedCadres = getCadresForMitra(mitra)

            return (
              <div key={mitra.uid} className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-base text-slate-100">{mitra.displayName}</h4>
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {mitra.partnershipType || 'Instansi'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      PIC / Email: {mitra.email} • HP/WA: {mitra.phone || '-'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block font-mono">Kader Binaan</span>
                      <span className="text-sm font-bold font-mono text-slate-100">{summary.cadreCount} Orang</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block font-mono">Artikel Edukasi</span>
                      <span className="text-sm font-bold font-mono text-emerald-400">{summary.totalArticles} Artikel</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block font-mono">Total Pembaca Views</span>
                      <span className="text-sm font-bold font-mono text-emerald-300 flex items-center justify-center gap-1">
                        <Icon name="eye" className="w-3.5 h-3.5 text-emerald-400" />
                        {summary.totalArticleViews}
                      </span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block font-mono">Total Kode Active</span>
                      <span className="text-sm font-bold font-mono text-cyan-400">{summary.totalDists} Kode</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block font-mono">Respon Terkumpul</span>
                      <span className="text-sm font-bold font-mono text-purple-300">{summary.totalResponses}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Icon name="users" className="w-3.5 h-3.5 text-cyan-400" />
                    Detail Aktivitas Per-Kader Binaan ({linkedCadres.length})
                  </h5>

                  {linkedCadres.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-500 font-mono text-center">
                      Belum ada kader terdaftar di bawah mitra ini.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                      <table className="w-full text-xs font-mono text-left">
                        <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                          <tr>
                            <th className="p-3 border-b border-slate-800">Nama Kader Lapangan</th>
                            <th className="p-3 border-b border-slate-800">Email Login</th>
                            <th className="p-3 border-b border-slate-800">Status Artikel CMS</th>
                            <th className="p-3 border-b border-slate-800">Views Artikel</th>
                            <th className="p-3 border-b border-slate-800">Kode Dibuat</th>
                            <th className="p-3 border-b border-slate-800">Respon Terjaring</th>
                            <th className="p-3 border-b border-slate-800 text-right">Detail Inspeksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {linkedCadres.map((cadre) => {
                            const prog = getCadreProgressSummary(cadre.uid)
                            return (
                              <tr key={cadre.uid} className="hover:bg-slate-900/50 transition-colors">
                                <td className="p-3 font-bold text-slate-100">{cadre.displayName}</td>
                                <td className="p-3 text-slate-400">{cadre.email}</td>
                                <td className="p-3">
                                  {prog.hasWrittenArticle ? (
                                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] flex items-center gap-1 w-fit">
                                      <Icon name="fileText" className="w-3 h-3 text-emerald-400" />
                                      {prog.articleCount} Artikel Diterbitkan
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-500 border border-slate-800 text-[10px] flex items-center gap-1 w-fit">
                                      <Icon name="xCircle" className="w-3 h-3 text-slate-500" />
                                      Belum Buat Artikel
                                    </span>
                                  )}
                                </td>
                                <td className="p-3">
                                  {prog.articleViews > 0 ? (
                                    <span className="font-bold text-cyan-300 font-mono flex items-center gap-1">
                                      <Icon name="eye" className="w-3.5 h-3.5 text-cyan-400" />
                                      {prog.articleViews} Views
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 font-mono">0 Views</span>
                                  )}
                                </td>
                                <td className="p-3 text-cyan-400 font-bold">{prog.distCount} Kode</td>
                                <td className="p-3 text-purple-300 font-bold">{prog.respCount} Respon</td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => onInspectCadre(cadre)}
                                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700"
                                  >
                                    Inspeksi
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
