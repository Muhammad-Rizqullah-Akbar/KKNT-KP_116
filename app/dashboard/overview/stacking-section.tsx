'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'

type StackingSectionProps = {
  activeOverviewStackObj: any
  respondentAnswerDistribution: {
    totalRes: number
    highCount: number
    highPct: number
    midCount: number
    midPct: number
    lowCount: number
    lowPct: number
  }
  perStackPartitionBreakdown: Array<{
    stackId: string
    title: string
    respondentCount: number
    sharePct: number
    preCount: number
    postCount: number
    avgPretest: number
    avgPosttest: number
    delta: number
    highCount: number
    midCount: number
    lowCount: number
  }>
  aspectFormMatrix: {
    targetForms: Array<{ id: string; title: string }>
    aspectRows: Array<{ aspectTitle: string; formAverages: Record<string, number> }>
  }
}

export default function StackingSection({
  activeOverviewStackObj,
  respondentAnswerDistribution,
  perStackPartitionBreakdown,
  aspectFormMatrix,
}: StackingSectionProps) {
  return (
    <div className="rounded-3xl bg-[#080812] border border-purple-500/20 p-6 space-y-5 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Icon name="layers" className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Stacking Accounting Assessment (Pretest vs Posttest)</h3>
            <p className="text-xs text-white/40 font-mono">Daftar perbandingan assessment yang dikonfigurasi melalui CMS Builder.</p>
          </div>
        </div>

        <Link href="/dashboard/widgets">
          <button className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold transition-colors">
            + Edit / Tambah Stack →
          </button>
        </Link>
      </div>



      {/* SEBARAN JAWABAN RESPONDEN & DISTRIBUSI KATEGORI (BERDASARKAN STACKING AKTIF) */}
      <div className="pt-4 border-t border-white/[0.05] space-y-3 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Icon name="users" className="w-4 h-4 text-cyan-400" />
              <span>Sebaran Responden & Distribusi Kategori Jawaban Stacking ({respondentAnswerDistribution.totalRes} Responden)</span>
            </h4>
            <p className="text-[11px] text-white/40 mt-0.5">
              Distribusi persentase sebaran tingkat pemahaman untuk <strong className="text-cyan-300">{activeOverviewStackObj?.stack?.title || 'Stacking Active'}</strong> ({respondentAnswerDistribution.totalRes} responden terdeteksi).
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
            TOTAL STACKING AKTIF: {respondentAnswerDistribution.totalRes} RESPONDEN
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* SANGAT BAIK / MEMENUHI */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-emerald-500/30 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-emerald-300">Sangat Dipahami (Skor ≥80%)</span>
              <span className="font-black text-emerald-400 text-base">{respondentAnswerDistribution.highPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden border border-white/[0.06]">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${respondentAnswerDistribution.highPct}%` }} />
            </div>
            <span className="text-[10px] text-white/40 block">{respondentAnswerDistribution.highCount} Responden Pemahaman Tinggi</span>
          </div>

          {/* CUKUP DIPAHAMI */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-cyan-500/30 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-cyan-300">Cukup Dipahami (Skor 60-79%)</span>
              <span className="font-black text-cyan-400 text-base">{respondentAnswerDistribution.midPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden border border-white/[0.06]">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${respondentAnswerDistribution.midPct}%` }} />
            </div>
            <span className="text-[10px] text-white/40 block">{respondentAnswerDistribution.midCount} Responden Pemahaman Sedang</span>
          </div>

          {/* PERLU PERBAIKAN */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-amber-500/30 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-amber-300">Perlu Pendampingan (Skor &lt;60%)</span>
              <span className="font-black text-amber-400 text-base">{respondentAnswerDistribution.lowPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden border border-white/[0.06]">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${respondentAnswerDistribution.lowPct}%` }} />
            </div>
            <span className="text-[10px] text-white/40 block">{respondentAnswerDistribution.lowCount} Responden Perlu Penyuluhan Ulang</span>
          </div>
        </div>

        {/* KONSOLIDASI NILAI & PARTISI RESPONDEN PER-STACKING */}
        <div className="pt-4 border-t border-white/[0.05] space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
              <Icon name="layers" className="w-3.5 h-3.5 text-purple-400" />
              <span>Konsolidasi Nilai & Rincian Responden Per-Stacking ({perStackPartitionBreakdown.length} Stack Terdaftar)</span>
            </h5>
            <span className="text-[10px] text-white/40">Rincian Lengkap Seluruh Assessment Stacking</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {perStackPartitionBreakdown.map((st, sIdx) => (
              <div key={st.stackId} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <div>
                    <span className="font-bold text-white text-xs">{st.title}</span>
                    <span className="ml-2 px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px]">
                      Stack #{sIdx + 1}
                    </span>
                  </div>
                  <span className="font-mono text-cyan-400 font-bold text-xs">
                    {st.respondentCount} Responden Unik ({st.sharePct}%)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                    Pretest: {st.preCount} Responden
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
                    Posttest: {st.postCount} Responden
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[9px] text-white/40 block font-bold">Rata² Pretest</span>
                    <span className="font-bold text-cyan-400">{st.avgPretest}%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[9px] text-purple-300 block font-bold">Rata² Posttest</span>
                    <span className="font-bold text-purple-300">{st.avgPosttest}%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[9px] text-emerald-400 block font-bold">Gain Delta</span>
                    <span className="font-bold text-emerald-300">+{st.delta}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/[0.04]">
                  <span>Sangat Dipahami: <strong className="text-emerald-300">{st.highCount}</strong></span>
                  <span>Cukup: <strong className="text-cyan-300">{st.midCount}</strong></span>
                  <span>Perlu Pendampingan: <strong className="text-amber-300">{st.lowCount}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PER-ASPECT FORM COMPARISON MATRIX TABLE FOR MAIN OVERVIEW DASHBOARD */}
      <div className="pt-4 border-t border-white/[0.05] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-white flex items-center gap-2 font-mono">
              <Icon name="layers" className="w-4 h-4 text-emerald-400" />
              <span>Matriks Perbandingan Nilai Rata-Rata Per Aspek Per Formulir</span>
            </h4>
            <p className="text-[11px] text-white/40 font-mono mt-0.5">
              Komparasi skor aspek (Pengetahuan, Sikap, Perilaku) untuk setiap formulir yang terhubung pada fase setup ({aspectFormMatrix.targetForms.length} Form).
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
            DATA RESPONDEN PARITY
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#080812]">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-white/[0.03] text-white/40 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="p-3.5 border-b border-white/[0.06]">Aspek Penilaian Evaluasi</th>
                {aspectFormMatrix.targetForms.map((fObj) => (
                  <th key={fObj.id} className="p-3.5 border-b border-white/[0.06] text-center min-w-[140px]">
                    {fObj.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {aspectFormMatrix.aspectRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-3.5 font-bold text-white flex items-center gap-2">
                    <Icon name="checkCircle" className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{row.aspectTitle}</span>
                  </td>
                  {aspectFormMatrix.targetForms.map((fObj) => {
                    const val = row.formAverages[fObj.id] || 0
                    return (
                      <td key={fObj.id} className="p-3.5 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-xl font-bold font-mono text-xs border ${
                            val >= 80
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : val >= 60
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {val}%
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
