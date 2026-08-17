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
  allQuestions?: PublicQuestion[]
  startIndex?: number
}

export function FormPublicRenderer({
  questions,
  answers = {},
  onAnswerChange,
  readOnly = false,
  disabled = false,
  className = '',
  allQuestions,
  startIndex,
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
        const globalNum = allQuestions && allQuestions.length > 0
          ? allQuestions.findIndex((q) => q.questionId === question.questionId) + 1
          : (startIndex !== undefined ? startIndex + index + 1 : index + 1)
        const numStr = String(globalNum > 0 ? globalNum : index + 1).padStart(2, '0')

        return (
          <div
            key={question.questionId}
            id={`preview-q-${question.questionId}`}
            className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg backdrop-blur-sm transition-all hover:border-slate-700 space-y-5"
          >
            {/* Question Header with Generous Spacing */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-xl bg-cyan-500/10 text-cyan-400 font-bold text-xs border border-cyan-500/20 mt-0.5 shadow-sm font-mono">
                  {numStr}
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

            {/* Media Attachment if available (V1 & V1.5 Universal Renderer) */}
            {(() => {
              const mediaUrl = question.presentation?.media?.url || (question as any).imageUrl || (question as any).image || (question as any).mediaUrl || (question as any).photoURL
              const caption = question.presentation?.media?.caption || (question as any).imageCaption || (question as any).caption
              if (!mediaUrl) return null
              return (
                <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-3 max-w-md shadow-md my-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl}
                    alt={caption || 'Lampiran Gambar Pertanyaan'}
                    className="w-full h-auto max-h-72 object-contain rounded-xl"
                  />
                  {caption && (
                    <p className="text-xs text-slate-400 text-center mt-2 italic font-medium">
                      {caption}
                    </p>
                  )}
                </div>
              )
            })()}

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
      const correctFromOpts = options.filter((o: any) => o.isCorrect || o.correct).length
      const requiredCount =
        question.answerKey?.correctOptionIds?.length ||
        correctFromOpts ||
        (question as any).requiredSelectionCount ||
        (question as any).config?.requiredSelectionCount ||
        (question as any).presentation?.maxSelections ||
        0

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
              <span className={`px-2.5 py-0.5 rounded-lg font-bold ${
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
        let text = String(sc.label || sc.text || sc.name || '')
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
        let text = String(sc.label || sc.text || sc.name || '')
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

    default:
      return <p className="text-xs text-slate-400 italic">Tipe pertanyaan tidak dikenal.</p>
  }
}

function PublicFileUpload({
  question,
  value,
  onChange,
  isDisabled,
}: {
  question: PublicQuestion
  value: any
  onChange: (val: any) => void
  isDisabled: boolean
}) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const isImageOnly = question.type === 'image'
  const maxMb = question.presentation?.maxFileSizeMb || 5
  const currentUrl = typeof value === 'string' ? value : value?.url || ''

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    if (file.size > maxMb * 1024 * 1024) {
      setUploadError(`Ukuran berkas melebihi batas maksimum (${maxMb}MB).`)
      return
    }

    setIsUploading(true)
    setUploadProgress(10)

    try {
      const { uploadResponseFile } = await import('@/lib/firebase/storage')
      const url = await uploadResponseFile(
        file,
        'public_response',
        question.questionId,
        (prog) => setUploadProgress(Math.round(prog.progress))
      )
      onChange(url)
    } catch (err: any) {
      console.error('File upload failed:', err)
      setUploadError(err.message || 'Gagal mengunggah berkas ke storage. Silakan coba lagi.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClear = () => {
    onChange('')
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (currentUrl) {
    return (
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {isImageOnly || currentUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) ? (
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentUrl} alt="Pratinjau Berkas" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Icon name="fileText" className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                <Icon name="checkCircle" className="w-4 h-4" /> Berkas Terunggah
              </span>
              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-300 hover:text-cyan-400 underline truncate block font-mono"
              >
                {currentUrl.split('/').pop() || 'Lihat Berkas Terunggah'}
              </a>
            </div>
          </div>

          {!isDisabled && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center gap-1.5 transition-colors"
            >
              <Icon name="trash" className="w-3.5 h-3.5" />
              <span>Ganti</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={isImageOnly ? 'image/*' : undefined}
        onChange={handleFileChange}
        disabled={isDisabled || isUploading}
        className="hidden"
      />

      <div
        onClick={() => !isDisabled && !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center space-y-3 transition-all cursor-pointer ${
          isUploading
            ? 'border-cyan-500/50 bg-cyan-950/20'
            : 'border-slate-800 hover:border-cyan-500/60 bg-slate-950/60 hover:bg-slate-900/60'
        }`}
      >
        {isUploading ? (
          <div className="space-y-3">
            <Icon name="loader" className="w-8 h-8 mx-auto text-cyan-400 animate-spin" />
            <p className="text-xs font-bold text-cyan-300 font-mono">Mengunggah ke Firebase Storage... {uploadProgress}%</p>
            <div className="w-full max-w-xs mx-auto h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div className="h-full bg-cyan-500 transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mx-auto">
              <Icon name="upload" className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Klik di sini untuk memilih berkas</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isImageOnly ? 'Format: JPG, PNG, WEBP' : 'Semua format berkas diperbolehkan'} • Maks: {maxMb}MB
              </p>
            </div>
          </>
        )}
      </div>

      {uploadError && (
        <p className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 px-1">
          <Icon name="alertCircle" className="w-3.5 h-3.5" />
          <span>{uploadError}</span>
        </p>
      )}
    </div>
  )
}
