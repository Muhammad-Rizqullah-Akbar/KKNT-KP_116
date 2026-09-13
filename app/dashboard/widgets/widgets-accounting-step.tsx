'use client'

import { Icon } from '@/components/ui/Icons'
import type {
  AccountingResult,
  StackedAccountingItem,
} from './widgets-utils'

type AspectFormMatrix = {
  targetForms: { id: string; title: string }[]
  aspectRows: { aspectTitle: string; formAverages: Record<string, number> }[]
}

type PerStackPartitionItem = {
  stackId: string
  title: string
  mode: string
  scoringScheme: string
  respondentCount: number
  preCount: number
  postCount: number
  sharePct: number
  avgPretest: number
  avgPosttest: number
  delta: number
  passRate: number
  highCount: number
  midCount: number
  lowCount: number
}

type RespondentAnswerDistribution = {
  totalRes: number
  highCount: number
  highPct: number
  midCount: number
  midPct: number
  lowCount: number
  lowPct: number
}

type WidgetsAccountingStepProps = {
  accountingStacks: StackedAccountingItem[]
  activeStackId: string
  setActiveStackId: (id: string) => void
  activeStackObj: StackedAccountingItem
  activeAccountingResult: AccountingResult
  respondentAnswerDistribution: RespondentAnswerDistribution
  perStackPartitionBreakdown: PerStackPartitionItem[]
  aspectFormMatrix: AspectFormMatrix
  handleUpdateStackItem: (stackId: string, updates: Partial<StackedAccountingItem>) => void
  onContinue: () => void
}

export function WidgetsAccountingStep({
  accountingStacks,
  activeStackId,
  setActiveStackId,
  activeStackObj,
  activeAccountingResult,
  respondentAnswerDistribution,
  perStackPartitionBreakdown,
  aspectFormMatrix,
  handleUpdateStackItem,
  onContinue,
}: WidgetsAccountingStepProps) {
  return (
    <div className="space-y-6">
      {/* STACK SELECTOR & SKEMA PENILAIAN TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-400 font-bold shrink-0">Stack Accounting:</span>
          {accountingStacks.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveStackId(s.id)}
              className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 font-bold ${
                activeStackId === s.id
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              #{idx + 1} {s.title}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-400 font-bold">Skema Penilaian:</span>
          <select
            value={activeStackObj.scoringScheme || 'all'}
            onChange={(e) => handleUpdateStackItem(activeStackObj.id, { scoringScheme: e.target.value as any })}
            className="bg-slate-950 border border-emerald-500/40 text-emerald-300 rounded-xl px-3 py-1.5 font-bold focus:outline-none focus:border-emerald-400"
          >
            <option value="all">Semua Skema (Gabungan V1.0 & V1.5)</option>
            <option value="v1_0">Skema V1.0 (Data Responden Legacy)</option>
            <option value="v1_5">Skema V1.5 (Hasil Penilaian Resmi)</option>
          </select>
        </div>
      </div>

      {/* ACCOUNTING METRIC PODS DYNAMIC FROM DATABASE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Rata-Rata Pretest Instansi</span>
          <p className="text-3xl font-black font-mono text-cyan-400">{activeAccountingResult.avgPretest}%</p>
          <span className="text-[10px] text-slate-500 font-mono">Skor Awal Benchmark</span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-purple-300 uppercase font-bold">Rata-Rata Posttest Instansi</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
              +{activeAccountingResult.delta}% Gain
            </span>
          </div>
          <p className="text-3xl font-black font-mono text-purple-300">{activeAccountingResult.avgPosttest}%</p>
          <span className="text-[10px] text-purple-400 font-mono">Pasca Intervensi (Terdapat Gain)</span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-1">
          <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Peningkatan Delta</span>
          <p className="text-3xl font-black font-mono text-emerald-300">+{activeAccountingResult.delta}%</p>
          <span className="text-[10px] text-emerald-400 font-mono">Gain Pemahaman Pangan</span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 space-y-1">
          <span className="text-[10px] font-mono text-amber-300 uppercase font-bold">Tingkat Kelulusan MS</span>
          <p className="text-3xl font-black font-mono text-amber-200">{activeAccountingResult.passRate}%</p>
          <span className="text-[10px] text-slate-400 font-mono">{activeAccountingResult.totalRespondents} Responden Database</span>
        </div>
      </div>

      {/* PRETEST VS POSTTEST PER MITRA COMPARISON TABLE & VISUAL BARS (DATABASE DRIVEN) */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <Icon name="barChart" className="w-5 h-5 text-purple-400" />
              <span>Hasil Accounting Pretest vs Posttest: {activeStackObj.title}</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Rincian accounting per-Mitra yang ditarik secara presisi berdasarkan formulir responden. Gain (%) ditampilkan pada Posttest.
            </p>
          </div>

          <button
            onClick={onContinue}
            className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-all self-start md:self-auto"
          >
            <span>Lanjut ke Analisis Per-Soal</span>
            <Icon name="chevronRight" className="w-4 h-4" />
          </button>
        </div>

        {/* MITRA COMPARISON LIST */}
        {activeAccountingResult.mitraBreakdown.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs bg-slate-950 rounded-2xl border border-slate-800">
            Belum ada data Mitra Instansi atau respon terdaftar di database.
          </div>
        ) : (
          <div className="space-y-4 font-mono text-xs">
            {activeAccountingResult.mitraBreakdown.map((item) => (
              <div key={item.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                  <div className="flex items-center gap-2.5">
                    <Icon name="building" className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-100 text-sm">{item.name}</span>
                      <span className="ml-2 px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-400">{item.respondents} Responden DB</span>
                    <span className="font-bold text-emerald-400">Pass Rate: {item.passRate}%</span>
                  </div>
                </div>

                {/* COMPARATIVE PROGRESS BARS */}
                {item.hasData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* PRETEST BAR (BASELINE - NO GAIN DISPLAYED) */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400 font-bold">Pretest Form (Skor Awal):</span>
                        <span className="text-cyan-400 font-bold">{item.pretestAvg}%</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${item.pretestAvg}%` }} />
                      </div>
                    </div>

                    {/* POSTTEST BAR (CONTAINS GAIN DISPLAY) */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-purple-300 font-bold">Posttest Form (Skor Akhir):</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-purple-300 font-bold">{item.posttestAvg}%</span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[9px] border border-emerald-500/30">
                            +{item.delta}% Gain
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${item.posttestAvg}%` }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-center text-slate-500 font-mono text-[11px] bg-slate-900/60 rounded-xl">
                    Belum ada respon kuesioner terkumpul untuk instansi mitra ini di database.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* SEBARAN JAWABAN RESPONDEN & DISTRIBUSI KATEGORI (BERDASARKAN STACKING AKTIF) */}
        <div className="pt-6 border-t border-slate-800 space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Icon name="users" className="w-4 h-4 text-cyan-400" />
                <span>Sebaran Responden & Distribusi Kategori Jawaban Stacking ({respondentAnswerDistribution.totalRes} Responden)</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Distribusi persentase sebaran tingkat pemahaman untuk <strong className="text-cyan-300">{activeStackObj.title}</strong> ({respondentAnswerDistribution.totalRes} responden terdeteksi).
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
              TOTAL STACKING AKTIF: {respondentAnswerDistribution.totalRes} RESPONDEN
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SANGAT BAIK / MEMENUHI */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-300">Sangat Dipahami (Skor ≥80%)</span>
                <span className="font-black text-emerald-400 text-base">{respondentAnswerDistribution.highPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${respondentAnswerDistribution.highPct}%` }} />
              </div>
              <span className="text-[10px] text-slate-400 block">{respondentAnswerDistribution.highCount} Responden Pemahaman Tinggi</span>
            </div>

            {/* CUKUP DIPAHAMI */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-cyan-300">Cukup Dipahami (Skor 60-79%)</span>
                <span className="font-black text-cyan-400 text-base">{respondentAnswerDistribution.midPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${respondentAnswerDistribution.midPct}%` }} />
              </div>
              <span className="text-[10px] text-slate-400 block">{respondentAnswerDistribution.midCount} Responden Pemahaman Sedang</span>
            </div>

            {/* PERLU PERBAIKAN */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-amber-300">Perlu Pendampingan (Skor &lt;60%)</span>
                <span className="font-black text-amber-400 text-base">{respondentAnswerDistribution.lowPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${respondentAnswerDistribution.lowPct}%` }} />
              </div>
              <span className="text-[10px] text-slate-400 block">{respondentAnswerDistribution.lowCount} Responden Perlu Penyuluhan Ulang</span>
            </div>
          </div>

          {/* KONSOLIDASI NILAI & PARTISI RESPONDEN PER-STACKING */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Icon name="layers" className="w-3.5 h-3.5 text-purple-400" />
                <span>Konsolidasi Nilai & Rincian Responden Per-Stacking ({perStackPartitionBreakdown.length} Stack Terdaftar)</span>
              </h5>
              <span className="text-[10px] text-slate-400">Rincian Lengkap Seluruh Assessment Stacking</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {perStackPartitionBreakdown.map((st, sIdx) => (
                <div key={st.stackId} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div>
                      <span className="font-bold text-slate-100 text-xs">{st.title}</span>
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
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-bold">Rata² Pretest</span>
                      <span className="font-bold text-cyan-400">{st.avgPretest}%</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-purple-300 block font-bold">Rata² Posttest</span>
                      <span className="font-bold text-purple-300">{st.avgPosttest}%</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-emerald-400 block font-bold">Gain Delta</span>
                      <span className="font-bold text-emerald-300">+{st.delta}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/40">
                    <span>Sangat Dipahami: <strong className="text-emerald-300">{st.highCount}</strong></span>
                    <span>Cukup: <strong className="text-cyan-300">{st.midCount}</strong></span>
                    <span>Perlu Pendampingan: <strong className="text-amber-300">{st.lowCount}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PER-ASPECT FORM COMPARISON MATRIX (SEBAGAIMANA HALAMAN DATA RESPONDEN) */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Icon name="layers" className="w-4 h-4 text-emerald-400" />
                <span>Matriks Perbandingan Nilai Rata-Rata Per Aspek Per Formulir</span>
              </h4>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Dihitung dari engine Data Responden untuk setiap formulir yang ada pada fase setup ({aspectFormMatrix.targetForms.length} Form).
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
              PARITY WITH DATA RESPONDEN
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3.5 border-b border-slate-800">Aspek Penilaian Evaluasi</th>
                  {aspectFormMatrix.targetForms.map((fObj) => (
                    <th key={fObj.id} className="p-3.5 border-b border-slate-800 text-center min-w-[140px]">
                      {fObj.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {aspectFormMatrix.aspectRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-3.5 font-bold text-slate-100 flex items-center gap-2">
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
    </div>
  )
}
