'use client'

import { Icon } from '@/components/ui/Icons'
import type { AlertGroup, UserProfile } from './types'

interface AlertsTabProps {
  alertCardsGroupedByMitra: AlertGroup[]
  allClassifiedAlertCardsCount: number
  alertCurrentPage: number
  alertTotalPages: number
  onPrevPage: () => void
  onNextPage: () => void
  onInspectCadre: (cadre: UserProfile) => void
}

export default function AlertsTab({
  alertCardsGroupedByMitra,
  allClassifiedAlertCardsCount,
  alertCurrentPage,
  alertTotalPages,
  onPrevPage,
  onNextPage,
  onInspectCadre,
}: AlertsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Icon name="alertCircle" className="w-4 h-4 text-amber-400" />
            Alert & Insight Lapangan (Dipisahkan Per-Mitra Instansi)
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Seluruh kartu alert dikelompokkan secara terpisah untuk setiap Mitra Instansi (Max 10 kartu per halaman).
          </p>
        </div>
        <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
          Total Alert Active: {allClassifiedAlertCardsCount} Kartu
        </span>
      </div>

      {/* ALERT CARDS GROUPED BY MITRA INSTANSI */}
      {alertCardsGroupedByMitra.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-emerald-400 font-mono flex items-center justify-center gap-2">
          <Icon name="checkCircle" className="w-5 h-5 text-emerald-400" />
          <span>Seluruh kondisi operasional lapangan terpantau optimal. Tidak ada alert peringatan kritis.</span>
        </div>
      ) : (
        <div className="space-y-6">
          {alertCardsGroupedByMitra.map(({ mitraName, mitra, cards }) => (
            <div key={mitraName} className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                    <Icon name="building" className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{mitraName}</h4>
                    {mitra && (
                      <p className="text-[11px] text-slate-400 font-mono">{mitra.partnershipType} • {mitra.email}</p>
                    )}
                  </div>
                </div>

                <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono font-bold">
                  {cards.length} Alert Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cards.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border backdrop-blur-md transition-all flex flex-col justify-between space-y-3 ${
                      alert.type === 'danger'
                        ? 'bg-rose-950/20 border-rose-500/40 shadow-md shadow-rose-950/20'
                        : alert.type === 'warning'
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-md shadow-amber-950/20'
                        : 'bg-emerald-950/20 border-emerald-500/40 shadow-md shadow-emerald-950/20'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase tracking-wider ${
                            alert.type === 'danger'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : alert.type === 'warning'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {alert.categoryTitle}
                        </span>
                      </div>

                      <div>
                        <h5 className="font-bold text-xs text-slate-100">{alert.title}</h5>
                        <p className="text-[11px] text-slate-300 font-mono mt-1 leading-relaxed bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                          {alert.desc}
                        </p>
                      </div>
                    </div>

                    {alert.cadre && alert.actionLabel && (
                      <button
                        onClick={() => onInspectCadre(alert.cadre!)}
                        className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5 border border-slate-700/50"
                      >
                        <Icon name="eye" className="w-3.5 h-3.5 text-cyan-400" />
                        {alert.actionLabel} →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* ALERT PAGINATION CONTROLS (MAX 10 CARDS PER PAGE) */}
          {alertTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs font-mono">
              <button
                disabled={alertCurrentPage === 1}
                onClick={onPrevPage}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-30 text-slate-300 hover:text-white"
              >
                ← Halaman Alert Sebelumnya
              </button>
              <span className="text-slate-400">
                Halaman Kartu <strong className="text-amber-400">{alertCurrentPage}</strong> dari <strong>{alertTotalPages}</strong>
              </span>
              <button
                disabled={alertCurrentPage === alertTotalPages}
                onClick={onNextPage}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-30 text-slate-300 hover:text-white"
              >
                Halaman Alert Selanjutnya →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
