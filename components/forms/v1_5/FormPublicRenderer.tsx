'use client'

import React from 'react'
import type { PublicQuestion } from '@/lib/forms/v1_5/types'
import { Icon } from '@/components/ui/Icons'

interface FormPublicRendererProps {
  questions: PublicQuestion[]
  answers?: Record<string, any>
  onAnswerChange?: (questionId: string, value: any) => void
  readOnly?: boolean
  disabled?: boolean
  className?: string
}

export function FormPublicRenderer({
  questions,
  answers = {},
  onAnswerChange,
  readOnly = false,
  disabled = false,
  className = '',
}: FormPublicRendererProps) {
  if (!questions || questions.length === 0) {
    return (
      <div className="p-10 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/40 text-slate-400 space-y-2">
        <Icon name="fileQuestion" className="w-12 h-12 mx-auto text-slate-500" />
        <p className="font-semibold text-slate-200 text-sm">Belum ada pertanyaan pada formulir ini.</p>
        <p className="text-xs text-slate-500">Pertanyaan yang ditambahkan di editor akan tampil secara otomatis di sini.</p>
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {questions.map((question, index) => {
        const answerValue = answers[question.questionId]

        return (
          <div
            key={question.questionId}
            id={`preview-q-${question.questionId}`}
            className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg backdrop-blur-sm transition-all hover:border-slate-700 space-y-5"
          >
            {/* Question Header with Generous Spacing */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-xl bg-cyan-500/10 text-cyan-400 font-bold text-xs border border-cyan-500/20 mt-0.5 shadow-sm">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-100 leading-snug">
                    {question.prompt || <span className="italic text-slate-500">(Teks pertanyaan belum diisi)</span>}
                    {question.required && <span className="text-rose-400 ml-1.5 font-bold">*</span>}
                  </h3>
                  {question.presentation?.description && (
                    <p className="text-xs text-slate-400 leading-relaxed pt-0.5">
                      {question.presentation.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Media Attachment if available */}
            {question.presentation?.media?.type === 'image' && question.presentation.media.url && (
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-3 max-w-md shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={question.presentation.media.url}
                  alt={question.presentation.media.caption || 'Lampiran pertanyaan'}
                  className="w-full h-auto max-h-64 object-contain rounded-lg"
                />
                {question.presentation.media.caption && (
                  <p className="text-xs text-slate-400 text-center mt-2 italic font-medium">
                    {question.presentation.media.caption}
                  </p>
                )}
              </div>
            )}

            {/* Input Element according to QuestionType */}
            <div className="pt-1">
              {renderQuestionInput(question, answerValue, (val) => onAnswerChange?.(question.questionId, val), disabled || readOnly)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function renderQuestionInput(
  question: PublicQuestion,
  value: any,
  onChange: (val: any) => void,
  isDisabled: boolean
) {
  const { type, options, presentation } = question

  switch (type) {
    case 'single-choice':
    case 'binary':
      return (
        <div className="space-y-2.5">
          {options.length === 0 ? (
            <p className="text-xs text-amber-400/80 italic p-3 bg-slate-950 rounded-xl border border-slate-800">
              Belum ada pilihan jawaban.
            </p>
          ) : (
            options.map((opt) => (
              <label
                key={opt.optionId}
                className={`flex items-center gap-3.5 p-4 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                  value === opt.optionId
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 shadow-sm ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name={question.questionId}
                  value={opt.optionId}
                  checked={value === opt.optionId}
                  onChange={() => onChange(opt.optionId)}
                  disabled={isDisabled}
                  className="w-4 h-4 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900"
                />
                <span>{opt.label || <span className="italic text-slate-500">Opsi tanpa label</span>}</span>
              </label>
            ))
          )}
        </div>
      )

    case 'multiple-choice': {
      const selectedValues: string[] = Array.isArray(value) ? value : []
      const requiredCount = question.answerKey?.correctOptionIds?.length || 0
      const isLimitReached = requiredCount > 0 && selectedValues.length >= requiredCount

      const toggleOption = (optId: string) => {
        if (selectedValues.includes(optId)) {
          onChange(selectedValues.filter((id) => id !== optId))
        } else {
          if (requiredCount > 0 && selectedValues.length >= requiredCount) return
          onChange([...selectedValues, optId])
        }
      }

      return (
        <div className="space-y-3">
          {requiredCount > 0 && (
            <div className="flex items-center justify-between text-xs font-mono px-1">
              <span className="text-cyan-400 font-bold">
                Pilih tepat {requiredCount} jawaban
              </span>
              <span className={`px-2 py-0.5 rounded font-bold ${
                selectedValues.length === requiredCount
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {selectedValues.length} / {requiredCount} dipilih
              </span>
            </div>
          )}

          {options.length === 0 ? (
            <p className="text-xs text-amber-400/80 italic p-3 bg-slate-950 rounded-xl border border-slate-800">
              Belum ada pilihan jawaban.
            </p>
          ) : (
            options.map((opt) => {
              const isChecked = selectedValues.includes(opt.optionId)
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
                    onChange={() => toggleOption(opt.optionId)}
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

    case 'dropdown':
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled}
          className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-cyan-500 shadow-sm"
        >
          <option value="">-- Pilih Jawaban --</option>
          {options.map((opt) => (
            <option key={opt.optionId} value={opt.optionId}>
              {opt.label}
            </option>
          ))}
        </select>
      )

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
      const scales = presentation?.indicatorScales?.length
        ? presentation.indicatorScales
        : [
            { value: 1, label: 'STS' },
            { value: 2, label: 'TS' },
            { value: 3, label: 'N' },
            { value: 4, label: 'S' },
            { value: 5, label: 'SS' },
          ]

      return (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {scales.map((sc) => (
            <button
              key={sc.value}
              type="button"
              onClick={() => onChange(sc.value)}
              disabled={isDisabled}
              className={`p-4 rounded-xl border text-center text-xs font-semibold transition-all ${
                value === sc.value
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/40 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="text-lg font-bold mb-1 font-mono">{sc.value}</div>
              <div className="truncate">{sc.label}</div>
            </button>
          ))}
        </div>
      )
    }

    case 'indicator-table': {
      const indicators = presentation?.indicators || []
      const scales = presentation?.indicatorScales?.length
        ? presentation.indicatorScales
        : [
            { value: 1, label: '1' },
            { value: 2, label: '2' },
            { value: 3, label: '3' },
            { value: 4, label: '4' },
            { value: 5, label: '5' },
          ]

      const tableAnswers: Record<string, number> = typeof value === 'object' && value ? value : {}

      const setIndicatorVal = (indId: string, val: number) => {
        onChange({ ...tableAnswers, [indId]: val })
      }

      if (indicators.length === 0) {
        return <p className="text-xs text-amber-400/80 italic p-3 bg-slate-950 rounded-xl border border-slate-800">Belum ada indikator yang dikonfigurasi.</p>
      }

      return (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-sm">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4 px-5">Indikator</th>
                {scales.map((sc) => (
                  <th key={sc.value} className="p-4 px-3 text-center w-20">
                    {sc.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 bg-slate-900/50">
              {indicators.map((ind) => (
                <tr key={ind.indicatorId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 px-5 font-semibold text-slate-200 leading-relaxed">{ind.label}</td>
                  {scales.map((sc) => (
                    <td key={sc.value} className="p-4 text-center">
                      <input
                        type="radio"
                        name={`${question.questionId}-${ind.indicatorId}`}
                        checked={tableAnswers[ind.indicatorId] === sc.value}
                        onChange={() => setIndicatorVal(ind.indicatorId, sc.value)}
                        disabled={isDisabled}
                        className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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
        <div className="border-2 border-dashed border-slate-700/80 rounded-2xl p-6 bg-slate-950/40 text-center space-y-2">
          <Icon name="upload" className="w-9 h-9 mx-auto text-slate-500" />
          <p className="text-xs font-semibold text-slate-300">Pilih berkas untuk diunggah</p>
          <p className="text-[11px] text-slate-500">
            Format: {presentation?.fileTypes?.join(', ') || 'Semua format valid'} • Maks: {presentation?.maxFileSizeMb || 5}MB
          </p>
          <button
            type="button"
            disabled={isDisabled}
            className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
          >
            Pilih Berkas
          </button>
        </div>
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

    default:
      return <p className="text-xs text-slate-400 italic">Tipe pertanyaan tidak dikenal.</p>
  }
}
