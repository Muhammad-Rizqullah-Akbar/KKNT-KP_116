'use client'

import type { BuilderQuestion, FormAspect } from '@/lib/domain/forms/builder-state'
import type { AspectScoreResult } from '@/lib/domain/scoring/scoring-types'
import { Icon } from '@/components/ui/Icons'

interface AspectResultsPanelProps {
  aspectResults: AspectScoreResult[]
  aspects: FormAspect[]
  questions: BuilderQuestion[]
  isOverallVisible: boolean
  onNavigateToStep: (step: 1 | 2 | 3 | 4) => void
  onGoToAnswerKeys: () => void
}

export function AspectResultsPanel({
  aspectResults,
  aspects,
  questions,
  isOverallVisible,
  onNavigateToStep,
  onGoToAnswerKeys,
}: AspectResultsPanelProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <Icon name="layers" className="w-4 h-4 text-cyan-400" />
        <span>Rincian Hasil Per-Aspek Penilaian</span>
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {aspectResults.map((aspRes) => {
          const targetAsp = aspects.find((a) => a.aspectId === aspRes.aspectId)
          const isScored = targetAsp?.isScored !== false

          if (!isScored) {
            return (
              <div key={aspRes.aspectId} className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 truncate">{aspRes.title}</span>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Terisi & Valid
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Aspek Identitas / Biodata Responden (Tanpa Skor Penilaian).</p>
              </div>
            )
          }

          // Diagnostic check for questions in this aspect
          const aspQuestions = questions.filter((q) => (q.aspectId || aspects[0]?.aspectId) === aspRes.aspectId)
          const hasZeroQuestions = aspQuestions.length === 0
          const missingKeyQuestions = aspQuestions.filter((q) => {
            if (q.type === 'indicator-table' || q.type === 'likert') {
              const indicators = (q as any).presentation?.indicators || (q as any).config?.indicators || []
              return indicators.length === 0
            }
            const targetAspect = aspects.find((a) => a.aspectId === (q.aspectId || aspects[0]?.aspectId))
            const isNonScoring = targetAspect?.isScored === false || ['biodata-name', 'biodata-email', 'biodata-phone', 'biodata-address', 'biodata-institution', 'short-text', 'long-text', 'text', 'textarea', 'file-upload', 'image', 'signature', 'date'].includes(q.type)
            if (isNonScoring) return false
            return q.answerKey?.kind === 'none' || !(q.answerKey as any)?.correctOptionIds?.length
          })

          return (
            <div
              key={aspRes.aspectId}
              className={`p-4 rounded-xl space-y-3 shadow-sm border transition-all ${
                hasZeroQuestions
                  ? 'bg-rose-950/20 border-rose-500/50'
                  : missingKeyQuestions.length > 0
                  ? 'bg-slate-950 border-amber-500/40'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-100 truncate">{aspRes.title}</span>
                {hasZeroQuestions ? (
                  <span className="text-[11px] font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40 shrink-0">
                    Belum Ada Soal
                  </span>
                ) : missingKeyQuestions.length > 0 ? (
                  <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 shrink-0">
                    {aspRes.percentage}% (Belum Lengkap)
                  </span>
                ) : (
                  <span className="text-sm font-black text-cyan-400 shrink-0">{aspRes.percentage}%</span>
                )}
              </div>

              {/* Progress Bar */}
              {!hasZeroQuestions && (
                <div className="w-full h-2 rounded-full bg-slate-850 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      missingKeyQuestions.length > 0 ? 'bg-amber-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${aspRes.percentage}%` }}
                  />
                </div>
              )}

              {/* DIAGNOSTIC NOTICE: 0 QUESTIONS */}
              {hasZeroQuestions && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Icon name="alertTriangle" className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    Belum ada soal pada dimensi ini (Skor 0%)
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigateToStep(2)}
                    className="font-bold underline text-rose-300 hover:text-rose-100 shrink-0"
                  >
                    + Tambah Soal
                  </button>
                </div>
              )}

              {/* DIAGNOSTIC NOTICE: MISSING ANSWER KEYS */}
              {!hasZeroQuestions && missingKeyQuestions.length > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-bold gap-2">
                    <span className="flex items-center gap-1.5">
                      <Icon name="alertTriangle" className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      {missingKeyQuestions.length} Soal Belum Ada Kunci Jawaban
                    </span>
                    <button
                      type="button"
                      onClick={onGoToAnswerKeys}
                      className="underline text-amber-300 hover:text-amber-100 shrink-0"
                    >
                      Atur Kunci Jawaban →
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-300/80 leading-tight">
                    Soal tanpa kunci jawaban belum bisa dikalkulasikan nilainya secara penuh.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Raw: {aspRes.rawScore} / {aspRes.maximumScore} Poin</span>
                {isOverallVisible && <span>Bobot Total: {aspRes.weightPercentage}%</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
