'use client'

import type { BuilderQuestion } from '@/lib/domain/forms/builder-state'
import type { SimulationPreset } from './step3-simulation-preset-picker'

interface PreviewQuestionCardProps {
  question: BuilderQuestion
  index: number
  questions: BuilderQuestion[]
  simulatedAnswers: Record<string, any>
  setCustomAnswers: React.Dispatch<React.SetStateAction<Record<string, any>>>
  setSimulationPreset: React.Dispatch<React.SetStateAction<SimulationPreset>>
}

export function PreviewQuestionCard({
  question: q,
  index: idx,
  questions,
  simulatedAnswers,
  setCustomAnswers,
  setSimulationPreset,
}: PreviewQuestionCardProps) {
  const isTable = q.type === 'indicator-table' || q.type === 'likert'
  const rawIndicators = q.presentation?.indicators || q.config?.indicators || []
  const indicators = rawIndicators.length > 0 ? rawIndicators : [{ indicatorId: 'ind_1', label: 'Indikator 1' }]
  const scales = q.presentation?.indicatorScales || [
    { value: 1, label: 'STS' },
    { value: 2, label: 'TS' },
    { value: 3, label: 'N' },
    { value: 4, label: 'S' },
    { value: 5, label: 'SS' },
  ]

  return (
    <div key={q.questionId} className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 shadow-sm">
      <div className="flex items-start gap-2">
        <span className="text-xs font-bold text-cyan-400 font-mono">P{idx + 1}.</span>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-100">
            {q.prompt} {q.required && <span className="text-rose-400">*</span>}
          </h4>
          {q.presentation?.description && (
            <p className="text-[11px] text-slate-400">{q.presentation.description}</p>
          )}
        </div>
      </div>

      {/* Image Attachment */}
      {(() => {
        const mediaUrl =
          q.presentation?.media?.url ||
          (q as any).imageUrl ||
          (q as any).image ||
          (q as any).mediaUrl ||
          (q as any).photoURL ||
          (q as any).config?.imageUrl ||
          (q as any).config?.media?.url
        const caption = q.presentation?.media?.caption || (q as any).imageCaption || (q as any).caption
        if (!mediaUrl) return null
        return (
          <div className="pl-5 my-2">
            <img
              src={mediaUrl}
              alt={caption || 'Lampiran Gambar Pertanyaan'}
              className="max-h-64 object-contain rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-sm"
              loading="lazy"
            />
            {caption && (
              <p className="text-xs text-slate-400 mt-1 italic font-medium">
                {caption}
              </p>
            )}
          </div>
        )
      })()}

      {/* INDICATOR TABLE / LIKERT GRID RENDERING */}
      {isTable ? (
        <div className="space-y-4 pt-2">
          {/* DESKTOP & TABLET HORIZONTAL GRID (md and above) */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-300">
                  <th className="p-3 border border-slate-800 font-bold">Indikator Penilaian</th>
                  {scales.map((scale: any) => (
                    <th key={scale.value} className="p-3 border border-slate-800 text-center font-bold">
                      {scale.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {indicators.map((ind: any, iIdx: number) => {
                  return (
                    <tr key={ind.indicatorId || iIdx} className="hover:bg-slate-900/50">
                      <td className="p-3 border border-slate-800 font-medium text-slate-200">
                        {ind.label || ind.title || `Indikator ${iIdx + 1}`}
                      </td>
                      {scales.map((scale: any) => {
                        const indId = ind.indicatorId || `ind_${iIdx}`
                        const isSelected = (simulatedAnswers[q.questionId] || {})[indId] === scale.value

                        return (
                          <td key={scale.value} className="p-3 border border-slate-800 text-center">
                            <input
                              type="radio"
                              name={`table-${q.questionId}-${indId}`}
                              value={scale.value}
                              checked={isSelected}
                              onChange={() => {
                                const currentTableAns = simulatedAnswers[q.questionId] || {}
                                setCustomAnswers((prev) => ({
                                  ...prev,
                                  [q.questionId]: { ...currentTableAns, [indId]: scale.value },
                                }))
                              }}
                              className="w-4 h-4 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                            />
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE VERTICAL CARD LAYOUT (< md) */}
          <div className="block md:hidden space-y-3">
            {indicators.map((ind: any, iIdx: number) => {
              const indId = ind.indicatorId || `ind_${iIdx}`
              const currentTableAns = simulatedAnswers[q.questionId] || {}

              return (
                <div key={indId} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-slate-200">
                    {iIdx + 1}. {ind.label || ind.title || `Indikator ${iIdx + 1}`}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {scales.map((scale: any) => {
                      const isSelected = currentTableAns[indId] === scale.value

                      return (
                        <button
                          key={scale.value}
                          type="button"
                          onClick={() => {
                            setCustomAnswers((prev) => ({
                              ...prev,
                              [q.questionId]: { ...currentTableAns, [indId]: scale.value },
                            }))
                          }}
                          className={`p-2.5 rounded-lg border text-center text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-cyan-400' : 'bg-slate-700'}`} />
                          <span className="truncate">{scale.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : ['single-choice', 'multiple-choice', 'dropdown', 'binary'].includes(q.type) ? (
        /* SINGLE / MULTIPLE CHOICE OPTIONS */
        <div className="pl-5 space-y-2 pt-1">
          {q.type === 'multiple-choice' && (
            <div className="text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-lg mb-2 inline-block">
              Pilih tepat {(questions.find(sq => sq.questionId === q.questionId)?.answerKey as any)?.correctOptionIds?.length || 1} opsi jawaban.
            </div>
          )}
          {(q.options || []).map((opt: any) => {
            const isMultiple = q.type === 'multiple-choice'
            const currentVal = simulatedAnswers[q.questionId]
            const isChecked = isMultiple
              ? Array.isArray(currentVal) && currentVal.includes(opt.optionId)
              : currentVal === opt.optionId

            return (
              <label
                key={opt.optionId}
                onClick={() => {
                  setSimulationPreset('custom')
                  if (isMultiple) {
                    const currentArr: string[] = Array.isArray(currentVal) ? currentVal : []
                    const nextArr = currentArr.includes(opt.optionId)
                      ? currentArr.filter((id) => id !== opt.optionId)
                      : [...currentArr, opt.optionId]
                    setCustomAnswers((prev) => ({ ...prev, [q.questionId]: nextArr }))
                  } else {
                    setCustomAnswers((prev) => ({ ...prev, [q.questionId]: opt.optionId }))
                  }
                }}
                className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-all ${
                  isChecked
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50 font-semibold shadow-sm'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <input
                  type={isMultiple ? 'checkbox' : 'radio'}
                  name={`preview-${q.questionId}`}
                  checked={isChecked}
                  onChange={() => {}} // Handled in label onClick
                  className="w-4 h-4 text-cyan-500 focus:ring-cyan-400 rounded cursor-pointer"
                />
                <span className="text-xs">{opt.label}</span>
              </label>
            )
          })}
        </div>
      ) : q.type === 'biodata-address' || q.type === 'textarea' ? (
        <div className="pl-5 pt-1">
          <textarea
            rows={2}
            value={simulatedAnswers[q.questionId] || ''}
            onChange={(e) => {
              setSimulationPreset('custom')
              setCustomAnswers((prev) => ({ ...prev, [q.questionId]: e.target.value }))
            }}
            placeholder={q.presentation?.placeholder || 'Tuliskan alamat lengkap...'}
            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      ) : (
        <div className="pl-5 pt-1">
          <input
            type={q.type === 'biodata-phone' || q.type === 'number' ? 'number' : q.type === 'biodata-email' ? 'email' : 'text'}
            value={simulatedAnswers[q.questionId] || ''}
            onChange={(e) => {
              setSimulationPreset('custom')
              setCustomAnswers((prev) => ({ ...prev, [q.questionId]: e.target.value }))
            }}
            placeholder={q.presentation?.placeholder || 'Isikan jawaban responden di sini...'}
            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      )}
    </div>
  )
}
