// question-editor/QuestionKeyCard.tsx
// Single question's answer-key editing card.

'use client'

import { Icon } from '@/components/ui/Icons'
import type { BuilderQuestion } from '@/lib/domain/forms/builder-state'
import type { DetailedIndicator } from '././LikertScaleEditor'

interface QuestionKeyCardProps {
  q: BuilderQuestion
  displayNum: number
  onUpdateQuestion: (questionId: string, update: any) => void
  onSelectQuestion?: (questionId: string) => void
  toggleCorrectOption: (question: BuilderQuestion, optionId: string) => void
  updateIndicatorScoreInInspector: (
    question: BuilderQuestion,
    indicatorId: string,
    choiceKey: string,
    newScore: number
  ) => void
}

export function QuestionKeyCard({
  q,
  displayNum,
  onUpdateQuestion,
  onSelectQuestion,
  toggleCorrectOption,
  updateIndicatorScoreInInspector,
}: QuestionKeyCardProps) {
  const isIndicatorTable = q.type === 'indicator-table' || q.type === 'likert'
  const hasKey = q.answerKey.kind !== 'none'

  // Calculate automatic table result for indicator tables
  const indicators: DetailedIndicator[] = (q.presentation.indicators as DetailedIndicator[]) || []
  const scales = q.presentation.indicatorScales?.length
    ? q.presentation.indicatorScales
    : [
        { value: 1, label: 'STS' },
        { value: 2, label: 'TS' },
        { value: 3, label: 'N' },
        { value: 4, label: 'S' },
        { value: 5, label: 'SS' },
      ]

  let totalTableMax = 0
  indicators.forEach((ind) => {
    const indScores = ind.scores || {}
    const indMax = Math.max(
      ...scales.map((s) => {
        const key = s.label || `op_${s.value}`
        return indScores[key] !== undefined ? indScores[key] : s.value
      }),
      1
    )
    totalTableMax += indMax
  })

  const sampleRawScore = Math.round(totalTableMax * 0.8)
  const sampleNormalized = totalTableMax > 0 ? Math.round((sampleRawScore / totalTableMax) * 100) : 0

  return (
    <div
      className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all shadow-md space-y-4"
    >
      {/* Header & Prompt */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-mono text-cyan-300 font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              #{String(displayNum).padStart(2, '0')}
            </span>
            <span className="text-slate-300 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">
              {q.type}
            </span>
          </div>

          <input
            type="text"
            value={q.prompt}
            onChange={(e) => onUpdateQuestion(q.questionId, { prompt: e.target.value })}
            placeholder="Teks pertanyaan..."
            className="w-full bg-slate-950 border border-slate-700 text-slate-100 font-bold text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {onSelectQuestion && (
          <button
            type="button"
            onClick={() => onSelectQuestion(q.questionId)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 self-start"
          >
            <Icon name="pencil" className="w-3.5 h-3.5" />
            <span>Buka di Editor</span>
          </button>
        )}
      </div>

      {/* Direct Answer Keys & Option Management */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            KUNCI JAWABAN & DETAIL SKOR PER INDIKATOR
          </span>
          <span className="font-mono text-[11px] text-emerald-300">
            {hasKey ? 'TERKUNCI' : 'OPSI TERSEDIA'}
          </span>
        </div>

        {/* Choice / Dropdown / Binary Option Keys Direct Editing */}
        {['single-choice', 'multiple-choice', 'binary', 'dropdown'].includes(q.type) && (
          <div className="space-y-2">
            {q.options.length === 0 ? (
              <p className="text-xs text-amber-400 italic">Belum ada opsi.</p>
            ) : (
              q.options.map((opt) => {
                const isCorrect =
                  q.answerKey.kind === 'option' &&
                  q.answerKey.correctOptionIds.includes(opt.optionId)

                return (
                  <div
                    key={opt.optionId}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                      isCorrect
                        ? 'bg-emerald-950/40 border-emerald-500/60'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleCorrectOption(q, opt.optionId)}
                      className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                        isCorrect
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-emerald-300'
                      }`}
                    >
                      {isCorrect ? '✓ Kunci Benar' : '+ Set Kunci'}
                    </button>

                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => {
                        const updatedOptions = q.options.map((o) =>
                          o.optionId === opt.optionId ? { ...o, label: e.target.value } : o
                        )
                        onUpdateQuestion(q.questionId, { options: updatedOptions })
                      }}
                      className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 px-2 py-1 rounded focus:outline-none"
                    />
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Rating Scale Direct Key Config */}
        {q.type === 'rating' && (
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <div className="font-semibold text-slate-200">Konfigurasi Target Nilai Rating:</div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Target Skala Maksimal:</span>
              <input
                type="number"
                min={1}
                max={10}
                value={q.presentation?.ratingMax || 5}
                onChange={(e) =>
                  onUpdateQuestion(q.questionId, {
                    presentation: { ...q.presentation, ratingMax: Number(e.target.value) || 5 },
                  })
                }
                className="w-16 bg-slate-950 border border-slate-700 text-amber-300 font-bold text-center text-xs rounded px-2 py-1 focus:outline-none"
              />
              <span className="text-slate-400">Skala Bintang/Poin</span>
            </div>
          </div>
        )}

        {/* Text / Textarea / Short Text / Long Text Direct Key Notes */}
        {['text', 'textarea', 'short-text', 'long-text'].includes(q.type) && (
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <div className="font-semibold text-slate-200">Kunci Referensi Jawaban Teks / Uraian:</div>
            <textarea
              rows={2}
              value={q.presentation?.placeholder || ''}
              onChange={(e) =>
                onUpdateQuestion(q.questionId, {
                  presentation: { ...q.presentation, placeholder: e.target.value },
                })
              }
              placeholder="Tuliskan kata kunci / panduan penilaian uraian di sini..."
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-cyan-500"
            />
          </div>
        )}

        {/* Number / Date Direct Key Reference */}
        {['number', 'date'].includes(q.type) && (
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <div className="font-semibold text-slate-200">
              Target Referensi {q.type === 'number' ? 'Angka / Nilai' : 'Tanggal'}:
            </div>
            <input
              type={q.type === 'number' ? 'number' : 'text'}
              value={q.presentation?.placeholder || ''}
              onChange={(e) =>
                onUpdateQuestion(q.questionId, {
                  presentation: { ...q.presentation, placeholder: e.target.value },
                })
              }
              placeholder={q.type === 'number' ? 'Misal: 100' : 'Misal: YYYY-MM-DD'}
              className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-bold text-xs rounded-lg px-3 py-2 focus:outline-none"
            />
          </div>
        )}

        {/* File Upload / Image / Signature Verification Note */}
        {['file-upload', 'image', 'signature'].includes(q.type) && (
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <div className="font-semibold text-slate-200">Panduan Verifikasi Lampiran / Tanda Tangan:</div>
            <input
              type="text"
              value={q.presentation?.placeholder || ''}
              onChange={(e) =>
                onUpdateQuestion(q.questionId, {
                  presentation: { ...q.presentation, placeholder: e.target.value },
                })
              }
              placeholder="Panduan verifikasi berkas / Bukti fisik..."
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none"
            />
          </div>
        )}

        {/* Indicator Table / Likert Direct Detailed Score Customization for EVERY Single Indicator */}
        {isIndicatorTable && (
          <div className="space-y-3">
            {indicators.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada indikator yang dikonfigurasi.</p>
            ) : (
              <div className="space-y-3">
                {indicators.map((ind, indIdx) => {
                  const indScores = ind.scores || {}

                  return (
                    <div
                      key={ind.indicatorId}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="font-semibold text-slate-200">
                        {indIdx + 1}. {ind.label}
                      </div>

                      {/* Per-choice score inputs for this specific indicator */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                        {scales.map((s, sIdx) => {
                          const choiceKey = s.label || `op_${s.value}`
                          const currentScoreVal = indScores[choiceKey] !== undefined ? indScores[choiceKey] : s.value

                          return (
                            <div
                              key={sIdx}
                              className="p-1.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between gap-1 text-[11px]"
                            >
                              <span className="text-slate-400 truncate pr-1 font-medium">
                                {s.label}
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={scales.length}
                                value={currentScoreVal}
                                onChange={(e) => {
                                  const rawVal = Number(e.target.value) || 0
                                  const clampedVal = Math.min(scales.length, Math.max(0, rawVal))
                                  updateIndicatorScoreInInspector(
                                    q,
                                    ind.indicatorId,
                                    choiceKey,
                                    clampedVal
                                  )
                                }}
                                className="w-10 bg-slate-900 border border-slate-700 text-amber-300 font-bold text-center text-xs rounded px-1 py-0.5 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* AUTOMATIC TABLE RESULT CALCULATION DISPLAY */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 mt-3">
                  <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
                    <span>HASIL PERHITUNGAN TABEL INDIKATOR</span>
                    <span className="text-[10px] font-mono text-slate-400">Otomatis ({indicators.length} Indikator)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Maksimum Tabel</div>
                      <div className="font-bold text-cyan-300">{totalTableMax} pt</div>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Skor Mentah (Contoh)</div>
                      <div className="font-bold text-amber-300">{sampleRawScore} pt</div>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Normalisasi Aspek</div>
                      <div className="font-bold text-emerald-400">{sampleNormalized}%</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Question Weight Section (ONLY FOR ORDINARY SCORED QUESTIONS, HIDDEN FOR INDICATOR TABLES) */}
      {!isIndicatorTable && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <span className="font-bold text-slate-300">BOBOT / POIN SOAL (WEIGHT 0–50):</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={50}
              step={0.5}
              value={q.scoring.weight}
              onChange={(e) =>
                onUpdateQuestion(q.questionId, {
                  scoring: {
                    ...q.scoring,
                    weight: Math.min(50, Math.max(0, Number(e.target.value) || 0)),
                  },
                })
              }
              className="w-16 bg-slate-900 border border-slate-700 text-amber-300 font-bold text-center text-xs rounded-lg px-2 py-1 focus:outline-none"
            />
            <span className="text-amber-300 font-bold">pt</span>
          </div>
        </div>
      )}
    </div>
  )
}
