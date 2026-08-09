'use client'

import React from 'react'
import type { PublicAspect, PublicQuestion } from '@/lib/forms/v1_5/types'
import { Icon } from '@/components/ui/Icons'

interface PublicReviewScreenProps {
  code: string
  title: string
  aspects: PublicAspect[]
  questions: PublicQuestion[]
  answers: Record<string, any>
  onBackToFilling: () => void
  onSubmit: () => void
  isSubmitting?: boolean
  errorMessage?: string | null
}

export function PublicReviewScreen({
  code,
  title,
  aspects,
  questions,
  answers,
  onBackToFilling,
  onSubmit,
  isSubmitting,
  errorMessage,
}: PublicReviewScreenProps) {
  const totalQuestions = questions.length
  const filledCount = Object.keys(answers).length

  // Group questions by aspect
  const questionsByAspect = React.useMemo(() => {
    const map = new Map<string, { aspect: PublicAspect; items: { question: PublicQuestion; globalIndex: number }[] }>()

    aspects.forEach((asp) => {
      map.set(asp.aspectId, { aspect: asp, items: [] })
    })

    questions.forEach((q, idx) => {
      const aspId = (q as any).aspectId || aspects[0]?.aspectId || 'default'
      if (!map.has(aspId)) {
        map.set(aspId, {
          aspect: { aspectId: aspId, title: 'Aspek Penilaian', description: '' },
          items: [],
        })
      }
      map.get(aspId)!.items.push({ question: q, globalIndex: idx })
    })

    return Array.from(map.values()).filter((group) => group.items.length > 0)
  }, [aspects, questions])

  const isQuestionAnswered = (q: PublicQuestion) => {
    const val = answers[q.questionId]
    if (val === undefined || val === null || val === '') return false

    const type = q.answerType || (q as any).type
    if (type === 'indicator-table' || type === 'likert') {
      const indicators = q.config?.indicators || []
      if (indicators.length === 0) return true
      return typeof val === 'object' && indicators.every((ind: any) => val[ind.indicatorId || ind.id || ind] !== undefined)
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
          Periksa kembali ringkasan jawaban Anda di bawah ini sebelum mengirimkan kuesioner secara permanen.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
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
                  <div key={question.questionId} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-cyan-500/10 text-cyan-400 font-bold text-xs font-mono flex items-center justify-center flex-shrink-0 mt-0.5">
                          {numStr}
                        </span>
                        <p className="text-xs font-semibold text-slate-200">{question.prompt}</p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono flex-shrink-0 border ${
                          answered
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {answered ? 'Terisi' : 'Belum'}
                      </span>
                    </div>

                    <div className="pl-7 text-xs font-mono">
                      {answered ? (
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 text-cyan-300 break-words">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </div>
                      ) : (
                        <span className="text-rose-400 italic">Belum diisi</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

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
