'use client'

import React from 'react'
import type { PublicAspect, PublicQuestion } from '@/lib/forms/v1_5/types'
import { Icon } from '@/components/ui/Icons'

import { FormPublicRenderer } from '@/components/forms/v1_5/FormPublicRenderer'

interface PublicReviewScreenProps {
  code: string
  title: string
  aspects: PublicAspect[]
  questions: PublicQuestion[]
  answers: Record<string, any>
  onBackToFilling: () => void
  onSubmit: () => void
  onAnswerChange?: (questionId: string, value: any) => void
  isSubmitting?: boolean
  errorMessage?: string | null
}

function expandScaleLabel(label: any): string {
  if (label === undefined || label === null || label === '') return '-'
  const str = String(label).trim()
  const clean = str.replace(/^(\d+[\.\-\s\(\)\:]+)+/g, '').replace(/[\(\)]/g, '').trim()
  const upper = clean.toUpperCase()

  if (upper === 'STS') return 'Sangat Tidak Setuju'
  if (upper === 'TS') return 'Tidak Setuju'
  if (upper === 'N') return 'Netral'
  if (upper === 'S') return 'Setuju'
  if (upper === 'SS') return 'Sangat Setuju'

  if (upper === 'STMS') return 'Sangat Tidak Memenuhi Syarat'
  if (upper === 'TMS') return 'Tidak Memenuhi Syarat'
  if (upper === 'MS') return 'Memenuhi Syarat'
  if (upper === 'SMS') return 'Sangat Memenuhi Syarat'

  if (upper === 'SK') return 'Sangat Kurang'
  if (upper === 'K') return 'Kurang'
  if (upper === 'C') return 'Cukup'
  if (upper === 'B') return 'Baik'
  if (upper === 'SB') return 'Sangat Baik'

  return str
}

function formatAnswerDisplay(question: PublicQuestion, val: any): React.ReactNode {
  if (val === undefined || val === null || val === '') return '-'

  const rawOptions = (question as any).options || (question as any).presentation?.options || (question as any).config?.options || []
  const options = rawOptions.map((o: any, idx: number) => {
    if (typeof o === 'string') return { optionId: `opt_${question.questionId}_${idx}`, label: o }
    if (o && typeof o === 'object') return { optionId: o.optionId || o.id || o.value || `opt_${question.questionId}_${idx}`, label: o.label || o.text || o.prompt || String(o) }
    return { optionId: `opt_${question.questionId}_${idx}`, label: String(o) }
  })

  // Single Choice / Dropdown / Radio / Boolean
  if (typeof val === 'string' || typeof val === 'number') {
    const strVal = String(val).trim()
    const cleanVal = strVal.toLowerCase().replace(/[^a-z0-9]/g, '')
    let matchOpt = options.find((o: any) => o.optionId === strVal || o.id === strVal || o.label === strVal)
    if (!matchOpt && cleanVal) {
      matchOpt = options.find((o: any) => {
        const cL = o.label ? o.label.toLowerCase().replace(/[^a-z0-9]/g, '') : ''
        const cId = o.optionId ? o.optionId.toLowerCase().replace(/[^a-z0-9]/g, '') : ''
        return cL === cleanVal || cId === cleanVal
      })
    }
    if (matchOpt) {
      return expandScaleLabel(matchOpt.label)
    }
    return expandScaleLabel(val)
  }

  // Multiple Choice / Checkbox (array)
  if (Array.isArray(val)) {
    const labels = val.map((itemVal) => {
      const strVal = String(itemVal).trim()
      const cleanVal = strVal.toLowerCase().replace(/[^a-z0-9]/g, '')
      let matchOpt = options.find((o: any) => o.optionId === strVal || o.id === strVal || o.label === strVal)
      if (!matchOpt && cleanVal) {
        matchOpt = options.find((o: any) => {
          const cL = o.label ? o.label.toLowerCase().replace(/[^a-z0-9]/g, '') : ''
          const cId = o.optionId ? o.optionId.toLowerCase().replace(/[^a-z0-9]/g, '') : ''
          return cL === cleanVal || cId === cleanVal
        })
      }
      return expandScaleLabel(matchOpt ? matchOpt.label : String(itemVal))
    })
    return labels.join(', ')
  }

  // Indicator Table / Likert Matrix (object: { indId: optId })
  if (typeof val === 'object' && val !== null) {
    const indicators = (question as any).presentation?.indicators || (question as any).indicators || (question as any).config?.indicators || []
    const rawScales = (question as any).presentation?.indicatorScales || (question as any).config?.indicatorScales || (question as any).indicatorScales || (question as any).scales || options || []

    const sanitizedScales = rawScales.map((sc: any, sIdx: number) => {
      let text = String(sc.label || sc.text || sc.name || '')
      let clean = text.replace(/^(\d+[\.\-\s\(\)\:]+)+/g, '').replace(/[\(\)]/g, '').trim()
      if (!clean) clean = text || `Skala ${sIdx + 1}`
      return {
        value: sc.value ?? sc.id ?? (sIdx + 1),
        id: sc.id || sc.optionId || sc.key || clean,
        label: clean,
      }
    })

    const rows: { label: string; optLabel: string }[] = []

    if (indicators.length > 0) {
      indicators.forEach((ind: any, iIdx: number) => {
        const indId = ind.indicatorId || ind.id || ind
        const indLabel = ind.label || ind.title || ind.prompt || ind.name || `Indikator ${iIdx + 1}`

        const rawOptVal =
          val[indId] ??
          val[`${question.questionId}-${iIdx}`] ??
          val[`${question.questionId}_${iIdx}`] ??
          val[ind.id] ??
          val[ind.indicatorId]

        if (rawOptVal !== undefined && rawOptVal !== null && rawOptVal !== '') {
          const strVal = String(rawOptVal).trim().toLowerCase()
          const matchedScale = sanitizedScales.find(
            (s: any) =>
              String(s.label).trim().toLowerCase() === strVal ||
              String(s.id).trim().toLowerCase() === strVal ||
              String(s.value).trim().toLowerCase() === strVal
          )
          const optLabel = matchedScale ? matchedScale.label : String(rawOptVal)
          rows.push({ label: indLabel, optLabel: expandScaleLabel(optLabel) })
        }
      })
    } else {
      Object.entries(val).forEach(([k, rawOptVal]) => {
        if (k.startsWith(`${question.questionId}-`) || k.startsWith(`${question.questionId}_`)) return
        if (rawOptVal !== undefined && rawOptVal !== null && rawOptVal !== '') {
          const strVal = String(rawOptVal).trim().toLowerCase()
          const matchedScale = sanitizedScales.find(
            (s: any) =>
              String(s.label).trim().toLowerCase() === strVal ||
              String(s.id).trim().toLowerCase() === strVal ||
              String(s.value).trim().toLowerCase() === strVal
          )
          const optLabel = matchedScale ? matchedScale.label : String(rawOptVal)
          rows.push({ label: k, optLabel: expandScaleLabel(optLabel) })
        }
      })
    }

    if (rows.length > 0) {
      return (
        <div className="space-y-1.5 text-xs">
          {rows.map((row, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-1.5 last:border-0 last:pb-0">
              <span className="text-slate-300 font-sans">{row.label}</span>
              <strong className="text-cyan-300 font-semibold">{row.optLabel}</strong>
            </div>
          ))}
        </div>
      )
    }
    return '-'
  }

  return String(val)
}

export function PublicReviewScreen({
  code,
  title,
  aspects,
  questions,
  answers,
  onBackToFilling,
  onSubmit,
  onAnswerChange,
  isSubmitting,
  errorMessage,
}: PublicReviewScreenProps) {
  const totalQuestions = questions.length
  const filledCount = Object.keys(answers).length
  const [editingQuestion, setEditingQuestion] = React.useState<{ question: PublicQuestion; index: number } | null>(null)

  // Group questions by aspect
  const questionsByAspect = React.useMemo(() => {
    const map = new Map<string, { aspect: PublicAspect; items: { question: PublicQuestion; globalIndex: number }[] }>()

    aspects.forEach((asp) => {
      map.set(asp.aspectId, { aspect: asp, items: [] })
    })

    questions.forEach((q, idx) => {
      const aspId = (q as any).aspectId || (q as any).stageId || (q as any).stage_id || (q as any).aspect || (q as any).category || aspects[0]?.aspectId || 'default'
      if (!map.has(aspId)) {
        const matched = aspects.find((a) => a.aspectId === aspId)
        map.set(aspId, {
          aspect: matched || { aspectId: aspId, title: (q as any).aspectTitle || (aspId === 'default' ? 'Aspek Penilaian' : `Aspek ${aspId}`), description: '' },
          items: [],
        })
      }
      map.get(aspId)!.items.push({ question: q, globalIndex: idx })
    })

    const groups = Array.from(map.values()).filter((group) => group.items.length > 0)
    groups.forEach((group) => {
      group.items.sort((a, b) => a.globalIndex - b.globalIndex)
    })
    groups.sort((a, b) => (a.items[0]?.globalIndex ?? 0) - (b.items[0]?.globalIndex ?? 0))
    return groups
  }, [aspects, questions])

  const isQuestionAnswered = (q: PublicQuestion) => {
    const val = answers[q.questionId]
    if (val === undefined || val === null || val === '') return false

    const type = q.answerType || (q as any).type
    if (type === 'indicator-table' || type === 'likert') {
      const indicators = q.presentation?.indicators || (q as any).indicators || (q as any).config?.indicators || []
      if (indicators.length === 0) return true
      return typeof val === 'object' && indicators.every((ind: any) => val[ind.indicatorId || ind.id || ind] !== undefined && val[ind.indicatorId || ind.id || ind] !== null && val[ind.indicatorId || ind.id || ind] !== '')
    }

    if (type === 'multiple-choice') {
      return Array.isArray(val) && val.length > 0
    }

    return true
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-cyan-400 font-extrabold text-xs px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/40">
              {code}
            </span>
            <h2 className="text-base font-bold text-slate-100">Pratinjau Jawaban Kuesioner</h2>
          </div>

          <span className="text-xs font-mono font-bold text-cyan-300 px-3 py-1 rounded-lg bg-cyan-950 border border-cyan-500/40">
            {filledCount} / {totalQuestions} Soal Terisi
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Periksa kembali ringkasan jawaban Anda di bawah ini. Klik pada nomor atau baris soal mana pun untuk langsung mengubah jawaban.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 shadow-lg animate-in fade-in duration-200">
          <Icon name="alertCircle" className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Review Grouped by Aspect */}
      <div className="space-y-6">
        {questionsByAspect.map(({ aspect, items }) => (
          <div key={aspect.aspectId} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
            <h3 className="text-xs font-bold text-cyan-300 font-mono uppercase tracking-wider border-b border-slate-800 pb-2">
              {aspect.title}
            </h3>

            <div className="space-y-3">
              {items.map(({ globalIndex, question }) => {
                const val = answers[question.questionId]
                const answered = isQuestionAnswered(question)
                const numStr = String(globalIndex + 1).padStart(2, '0')

                return (
                  <div
                    key={question.questionId}
                    onClick={() => setEditingQuestion({ question, index: globalIndex })}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-cyan-500/60 transition-all cursor-pointer group space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingQuestion({ question, index: globalIndex })
                          }}
                          className="w-7 h-7 rounded-xl bg-cyan-500/10 text-cyan-400 font-bold text-xs font-mono flex items-center justify-center flex-shrink-0 mt-0.5 border border-cyan-500/30 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all"
                          title="Klik untuk Edit Soal Ini"
                        >
                          {numStr}
                        </button>
                        <div>
                          <p className="text-xs font-bold text-slate-200 group-hover:text-cyan-200 transition-colors">
                            {question.prompt}
                          </p>
                          <span className="text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold font-mono">
                            Klik untuk Ubah Jawaban ✎
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase font-mono flex-shrink-0 border ${
                          answered
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {answered ? 'Terisi ✓' : 'Belum Terisi ✗'}
                      </span>
                    </div>

                    <div className="pl-10 text-xs font-mono">
                      {answered ? (
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 break-words font-sans">
                          {formatAnswerDisplay(question, val)}
                        </div>
                      ) : (
                        <span className="text-rose-400 italic">Belum diisi - Klik di sini untuk mengisi</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-400 font-extrabold text-xs px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/40">
                  Soal {String(editingQuestion.index + 1).padStart(2, '0')}
                </span>
                <h3 className="text-sm font-bold text-slate-100">Ubah Jawaban Pertanyaan</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 border border-slate-700 transition-colors"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <FormPublicRenderer
              questions={[editingQuestion.question]}
              answers={answers}
              onAnswerChange={(qId, val) => onAnswerChange?.(qId, val)}
              allQuestions={questions}
            />

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold shadow-lg shadow-cyan-600/25 flex items-center gap-2 transition-all"
              >
                <Icon name="check" className="w-4 h-4" />
                <span>Simpan & Tutup Modal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onBackToFilling}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
        >
          Kembali Edit Jawaban
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold shadow-lg shadow-cyan-600/25 flex items-center gap-2 disabled:bg-slate-800 transition-all"
        >
          {isSubmitting ? (
            <>
              <Icon name="loader" className="w-4 h-4 animate-spin" />
              <span>Mengirimkan...</span>
            </>
          ) : (
            <>
              <Icon name="check" className="w-4 h-4" />
              <span>Kirimkan Tanggapan Akhir</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
