'use client'

import { Icon } from '@/components/ui/Icons'
import type { PublicQuestion } from '@/lib/domain/forms/types'
import { PublicFileUpload } from './PublicFileUpload'

interface QuestionInputProps {
  question: PublicQuestion
  value: any
  onChange: (val: any) => void
  isDisabled: boolean
}

export function QuestionInput({ question, value, onChange, isDisabled }: QuestionInputProps) {
  const { type, options, presentation } = question

  switch (type) {
    case 'single-choice':
    case 'binary': {
      const sanitizedSingleOpts = options.map((opt: any, idx: number) => {
        if (typeof opt === 'string') return { optionId: `opt_${question.questionId}_${idx}`, label: opt }
        if (opt && typeof opt === 'object') return { optionId: opt.optionId || opt.id || opt.value || `opt_${question.questionId}_${idx}`, label: opt.label || opt.text || opt.prompt || String(opt) }
        return { optionId: `opt_${question.questionId}_${idx}`, label: String(opt) }
      })

      return (
        <div className="space-y-2.5">
          {sanitizedSingleOpts.length === 0 ? (
            <p className="text-xs text-amber-400/80 italic p-3 bg-slate-950 rounded-xl border border-slate-800">
              Belum ada pilihan jawaban.
            </p>
          ) : (
            sanitizedSingleOpts.map((opt) => {
              const isChecked = value === opt.optionId || value === opt.label || String(value) === String(opt.optionId)
              return (
                <label
                  key={opt.optionId}
                  className={`flex items-center gap-3.5 p-4 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 shadow-sm ring-1 ring-cyan-500/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name={question.questionId}
                    value={opt.optionId}
                    checked={isChecked}
                    onChange={() => onChange(opt.optionId)}
                    disabled={isDisabled}
                    className="w-4 h-4 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900"
                  />
                  <span>{opt.label || <span className="italic text-slate-500">Opsi tanpa label</span>}</span>
                </label>
              )
            })
          )}
        </div>
      )
    }

    case 'multiple-choice': {
      const sanitizedMultiOpts = options.map((opt: any, idx: number) => {
        if (typeof opt === 'string') return { optionId: `opt_${question.questionId}_${idx}`, label: opt }
        if (opt && typeof opt === 'object') return { optionId: opt.optionId || opt.id || opt.value || `opt_${question.questionId}_${idx}`, label: opt.label || opt.text || opt.prompt || String(opt) }
        return { optionId: `opt_${question.questionId}_${idx}`, label: String(opt) }
      })

      const selectedValues: string[] = Array.isArray(value) ? value : (value !== undefined && value !== null ? [String(value)] : [])
      const correctFromOpts = sanitizedMultiOpts.filter((o: any) => o.isCorrect || o.correct).length
      const requiredCount =
        question.answerKey?.correctOptionIds?.length ||
        correctFromOpts ||
        (question as any).requiredSelectionCount ||
        (question as any).config?.requiredSelectionCount ||
        (question as any).presentation?.maxSelections ||
        0

      const isLimitReached = requiredCount > 0 && selectedValues.length >= requiredCount

      const toggleOption = (opt: { optionId: string; label: string }) => {
        const isCurrentlyChecked = selectedValues.some((v) => v === opt.optionId || v === opt.label)
        if (isCurrentlyChecked) {
          onChange(selectedValues.filter((id) => id !== opt.optionId && id !== opt.label))
        } else {
          if (requiredCount > 0 && selectedValues.length >= requiredCount) return
          onChange([...selectedValues, opt.optionId])
        }
      }

      return (
        <div className="space-y-3">
          {requiredCount > 0 && (
            <div className="flex items-center justify-between text-xs font-mono px-1">
              <span className="text-cyan-400 font-bold">
                Pilih tepat {requiredCount} jawaban
              </span>
              <span className={`px-2.5 py-0.5 rounded-lg font-bold ${
                selectedValues.length === requiredCount
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {selectedValues.length} / {requiredCount} dipilih
              </span>
            </div>
          )}

          {sanitizedMultiOpts.length === 0 ? (
            <p className="text-xs text-amber-400/80 italic p-3 bg-slate-950 rounded-xl border border-slate-800">
              Belum ada pilihan jawaban.
            </p>
          ) : (
            sanitizedMultiOpts.map((opt) => {
              const isChecked = selectedValues.some((v) => v === opt.optionId || v === opt.label)
              const isOptionDisabled = isDisabled || (!isChecked && isLimitReached)

              return (
                <label
                  key={opt.optionId}
                  className={`flex items-center gap-3.5 p-4 rounded-xl border text-sm font-medium transition-all ${
                    isOptionDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    isChecked
                      ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 shadow-sm ring-1 ring-cyan-500/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleOption(opt)}
                    disabled={isOptionDisabled}
                    className="w-4 h-4 text-cyan-500 rounded focus:ring-cyan-400 focus:ring-offset-slate-900"
                  />
                  <span>{opt.label || <span className="italic text-slate-500">Opsi tanpa label</span>}</span>
                </label>
              )
            })
          )}
        </div>
      )
    }

    case 'dropdown': {
      const sanitizedDropOpts = options.map((opt: any, idx: number) => {
        if (typeof opt === 'string') return { optionId: `opt_${question.questionId}_${idx}`, label: opt }
        if (opt && typeof opt === 'object') return { optionId: opt.optionId || opt.id || opt.value || `opt_${question.questionId}_${idx}`, label: opt.label || opt.text || opt.prompt || String(opt) }
        return { optionId: `opt_${question.questionId}_${idx}`, label: String(opt) }
      })

      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled}
          className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-cyan-500 shadow-sm"
        >
          <option value="">-- Pilih Jawaban --</option>
          {sanitizedDropOpts.map((opt) => (
            <option key={opt.optionId} value={opt.optionId}>
              {opt.label}
            </option>
          ))}
        </select>
      )
    }

    case 'rating': {
      const min = presentation?.ratingMin ?? 1
      const max = presentation?.ratingMax ?? 5
      const ratingOptions = Array.from({ length: max - min + 1 }, (_, i) => min + i)
      const currentRating = typeof value === 'number' ? value : 0

      return (
        <div className="flex items-center gap-2.5 flex-wrap">
          {ratingOptions.map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              disabled={isDisabled}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                currentRating >= star
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <Icon name="star" className={`w-4 h-4 ${currentRating >= star ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{star}</span>
            </button>
          ))}
        </div>
      )
    }

    case 'likert': {
      const rawScales = presentation?.indicatorScales?.length
        ? presentation.indicatorScales
        : [
            { value: 1, label: 'Sangat Kurang' },
            { value: 2, label: 'Kurang' },
            { value: 3, label: 'Cukup' },
            { value: 4, label: 'Baik' },
            { value: 5, label: 'Sangat Baik' },
          ]

      const sanitizedScales = rawScales.map((sc: any, sIdx: number) => {
        const text = String(sc.label || sc.text || sc.name || '')
        let clean = text.replace(/^(\d+[\.\-\s\(\)\:]+)+/g, '').replace(/[\(\)]/g, '').trim()
        if (!clean) clean = text || `Skala ${sIdx + 1}`
        return {
          value: sc.value ?? sc.id ?? (sIdx + 1),
          key: sc.id || clean,
          label: clean,
        }
      })

      return (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {sanitizedScales.map((sc: any) => {
            const isSelected = value === sc.label || value === sc.key || value === sc.value

            return (
              <button
                key={sc.key}
                type="button"
                onClick={() => onChange(sc.label)}
                disabled={isDisabled}
                className={`p-4 rounded-xl border text-center text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/40 shadow-sm font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold font-sans truncate">{sc.label}</div>
              </button>
            )
          })}
        </div>
      )
    }

    case 'indicator-table': {
      const indicators = presentation?.indicators || (question as any).indicators || []
      const rawScales = presentation?.indicatorScales?.length
        ? presentation.indicatorScales
        : (question as any).indicatorScales?.length
        ? (question as any).indicatorScales
        : [
            { value: 1, label: 'Sangat Kurang' },
            { value: 2, label: 'Kurang' },
            { value: 3, label: 'Cukup' },
            { value: 4, label: 'Baik' },
            { value: 5, label: 'Sangat Baik' },
          ]

      const sanitizedScales = rawScales.map((sc: any, sIdx: number) => {
        const text = String(sc.label || sc.text || sc.name || '')
        let clean = text.replace(/^(\d+[\.\-\s\(\)\:]+)+/g, '').replace(/[\(\)]/g, '').trim()
        if (!clean) clean = text || `Skala ${sIdx + 1}`
        return {
          value: sc.value ?? sc.id ?? sc.score ?? (sIdx + 1),
          key: sc.id || clean,
          label: clean,
        }
      })

      const tableAnswers: Record<string, any> = typeof value === 'object' && value ? value : {}

      const setIndicatorVal = (indId: string, val: any) => {
        onChange({
          ...tableAnswers,
          [indId]: val,
        })
      }

      if (indicators.length === 0) {
        return <p className="text-xs text-amber-400/80 italic p-3 bg-slate-950 rounded-xl border border-slate-800">Belum ada indikator yang dikonfigurasi.</p>
      }

      return (
        <div className="space-y-4">
          {/* DESKTOP & TABLET HORIZONTAL TABLE GRID (md and above) */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-800 shadow-sm">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4 px-5">Indikator Penilaian</th>
                  {sanitizedScales.map((sc: any) => (
                    <th key={sc.key} className="p-4 px-3 text-center min-w-[6rem]">
                      {sc.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 bg-slate-900/50">
                {indicators.map((ind: any, iIdx: number) => {
                  const indId = ind.indicatorId || ind.id || ind
                  const indexKey = `${question.questionId}-${iIdx}`
                  const altKey = `${question.questionId}_${iIdx}`
                  const currentVal = tableAnswers[indId] ?? tableAnswers[indexKey] ?? tableAnswers[altKey]

                  return (
                    <tr key={indId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 px-5 font-semibold text-slate-200 leading-relaxed">{ind.label || ind.prompt || ind.name}</td>
                      {sanitizedScales.map((sc: any) => {
                        const isChecked = currentVal === sc.value || currentVal === sc.label || currentVal === sc.key || String(currentVal) === String(sc.value) || String(currentVal) === String(sc.label)

                        return (
                          <td key={sc.key} className="p-4 text-center">
                            <input
                              type="radio"
                              name={`${question.questionId}-${indId}`}
                              checked={isChecked}
                              onChange={() => setIndicatorVal(indId, sc.value ?? sc.label)}
                              disabled={isDisabled}
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
              const indId = ind.indicatorId || ind.id || ind
              const indexKey = `${question.questionId}-${iIdx}`
              const altKey = `${question.questionId}_${iIdx}`
              const currentVal = tableAnswers[indId] ?? tableAnswers[indexKey] ?? tableAnswers[altKey]

              return (
                <div key={indId} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-slate-100 leading-relaxed">
                    {iIdx + 1}. {ind.label || ind.prompt || ind.name}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {sanitizedScales.map((sc: any) => {
                      const isSelected = currentVal === sc.value || currentVal === sc.label || currentVal === sc.key || String(currentVal) === String(sc.value) || String(currentVal) === String(sc.label)

                      return (
                        <button
                          key={sc.key}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setIndicatorVal(indId, sc.value ?? sc.label)}
                          className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500 ring-1 ring-cyan-500/40 shadow-sm font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-cyan-400' : 'bg-slate-700'}`} />
                          <span className="truncate">{sc.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    case 'short-text':
    case 'text':
      return (
        <input
          type="text"
          value={value || ''}
          placeholder={presentation?.placeholder || 'Ketik jawaban Anda...'}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled}
          className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-600 shadow-sm"
        />
      )

    case 'long-text':
    case 'textarea':
      return (
        <textarea
          rows={4}
          value={value || ''}
          placeholder={presentation?.placeholder || 'Tuliskan deskripsi lengkap jawaban Anda...'}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled}
          className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-600 resize-y shadow-sm"
        />
      )

    case 'number':
      return (
        <input
          type="number"
          min={presentation?.min}
          max={presentation?.max}
          step={presentation?.step || 1}
          value={value !== undefined ? value : ''}
          placeholder={presentation?.placeholder || 'Masukkan angka...'}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={isDisabled}
          className="w-full max-w-xs bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-600 shadow-sm"
        />
      )

    case 'date':
      return (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled}
          className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 shadow-sm"
        />
      )

    case 'file-upload':
    case 'image':
      return (
        <PublicFileUpload
          question={question}
          value={value}
          onChange={onChange}
          isDisabled={isDisabled}
        />
      )

    case 'signature':
      return (
        <div className="border border-slate-700 rounded-2xl p-5 bg-slate-950 text-center space-y-3">
          <div className="h-32 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-600 text-xs font-medium">
            [ Area Tanda Tangan Digital ]
          </div>
          <button
            type="button"
            disabled={isDisabled}
            className="text-xs text-cyan-400 hover:underline font-semibold"
          >
            Bersihkan Tanda Tangan
          </button>
        </div>
      )

    case 'biodata-name':
    case 'biodata-address':
    case 'biodata-institution':
      return (
        <input
          type="text"
          value={value || ''}
          placeholder={presentation?.placeholder || 'Ketik data di sini...'}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled}
          className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-600 shadow-sm"
        />
      )

    case 'biodata-email':
      return (
        <input
          type="email"
          value={value || ''}
          placeholder={presentation?.placeholder || 'contoh@email.com'}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled}
          className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-600 shadow-sm"
        />
      )

    case 'biodata-phone':
      return (
        <input
          type="tel"
          value={value || ''}
          placeholder={presentation?.placeholder || '08xxxxxxxxxx'}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled}
          className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-600 shadow-sm"
        />
      )

    default:
      return <p className="text-xs text-slate-400 italic">Tipe pertanyaan tidak dikenal.</p>
  }
}
