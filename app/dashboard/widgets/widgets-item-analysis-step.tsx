'use client'

import { Icon } from '@/components/ui/Icons'

interface ItemAnalysisRow {
  id: string
  text: string
  formTitle: string
  formId: string
  questionId: string
  totalAnswers: number
  pretestPass: number
  posttestPass: number
  delta: number
  difficulty: string
  status: string
}

interface WidgetsItemAnalysisStepProps {
  itemQuestionAnalysis: ItemAnalysisRow[]
  itemAnalysisFormFilter: string
  setItemAnalysisFormFilter: (id: string) => void
  targetForms: { id: string; title: string }[]
  onContinue: () => void
}

export function WidgetsItemAnalysisStep({
  itemQuestionAnalysis,
  itemAnalysisFormFilter,
  setItemAnalysisFormFilter,
  targetForms,
  onContinue,
}: WidgetsItemAnalysisStepProps) {
  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <Icon name="clipboardList" className="w-5 h-5 text-emerald-400" />
            <span>Langkah 3: Analisis Per-Soal Terpisah Per Formulir (*Item Analysis*)</span>
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Inspeksi butir soal secara terpisah untuk setiap formulir yang dikonfigurasi pada fase setup.
          </p>
        </div>

        <button
          onClick={onContinue}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-all self-start md:self-auto"
        >
          <span>Lanjut ke Pilih Tampilan & Sync</span>
          <Icon name="chevronRight" className="w-4 h-4" />
        </button>
      </div>

      {/* FORM SELECTOR TABS FOR STEP 3 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80 font-mono text-xs">
        <span className="text-slate-400 font-bold shrink-0">Filter Formulir:</span>
        <button
          onClick={() => setItemAnalysisFormFilter('all')}
          className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 font-bold ${
            itemAnalysisFormFilter === 'all'
              ? 'bg-cyan-500 text-slate-950 border-cyan-400'
              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
          }`}
        >
          Semua Formulir Stacked ({targetForms.length} Form)
        </button>
        {targetForms.map((fObj) => (
          <button
            key={fObj.id}
            onClick={() => setItemAnalysisFormFilter(fObj.id)}
            className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 font-bold ${
              itemAnalysisFormFilter === fObj.id
                ? 'bg-purple-500 text-slate-950 border-purple-400'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            {fObj.title}
          </button>
        ))}
      </div>

      {/* ITEM ANALYSIS TABLE */}
      {itemQuestionAnalysis.length === 0 ? (
        <div className="p-8 text-center text-slate-500 font-mono text-xs bg-slate-950 rounded-2xl border border-slate-800">
          Belum ada butir pertanyaan ditemukan pada formulir yang dipilih.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="p-3.5 border-b border-slate-800">Teks Pertanyaan / Indikator Evaluasi</th>
                <th className="p-3.5 border-b border-slate-800 text-center">Jawaban DB</th>
                <th className="p-3.5 border-b border-slate-800 text-center">Pretest (%)</th>
                <th className="p-3.5 border-b border-slate-800 text-center">Posttest (%)</th>
                <th className="p-3.5 border-b border-slate-800 text-center">Indeks Kesulitan</th>
                <th className="p-3.5 border-b border-slate-800 text-right">Status Pemahaman</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {itemQuestionAnalysis.map((q) => (
                <tr key={q.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="p-3.5 max-w-xs">
                    <div className="font-bold text-slate-100">{q.text}</div>
                    <div className="text-[10px] text-purple-300 font-mono">{q.formTitle}</div>
                  </td>
                  <td className="p-3.5 text-center text-slate-300 font-bold">{q.totalAnswers} Jawaban</td>
                  <td className="p-3.5 text-center text-cyan-400 font-bold">{q.pretestPass}%</td>
                  <td className="p-3.5 text-center text-purple-300 font-bold">{q.posttestPass}%</td>
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[10px]">
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        q.status === 'Sangat Dipahami'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : q.status === 'Cukup Dipahami'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          : q.status === 'Belum Ada Respon'
                          ? 'bg-slate-900 text-slate-500 border-slate-800'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {q.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
