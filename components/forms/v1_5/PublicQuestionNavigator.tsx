'use client'

import React from 'react'
import type { PublicAspect, PublicQuestion } from '@/lib/forms/v1_5/types'
import { Icon } from '@/components/ui/Icons'

interface PublicQuestionNavigatorProps {
  aspects: PublicAspect[]
  questions: PublicQuestion[]
  currentQuestionIndex: number
  answers: Record<string, any>
  onSelectQuestionIndex: (index: number) => void
  isMobileDrawer?: boolean
  onCloseMobileDrawer?: () => void
  hasAttemptedSubmit?: boolean
}

export function PublicQuestionNavigator({
  aspects,
  questions,
  currentQuestionIndex,
  answers,
  onSelectQuestionIndex,
  isMobileDrawer,
  onCloseMobileDrawer,
  hasAttemptedSubmit,
}: PublicQuestionNavigatorProps) {
  // Map questions grouped by aspect
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

  const content = (
    <div className="space-y-5 text-xs font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] font-mono flex items-center gap-2">
          <Icon name="list" className="w-4 h-4 text-cyan-400" />
          <span>Navigasi Soal</span>
        </h3>
        <span className="font-mono text-[10px] text-slate-400">
          {Object.keys(answers).length} / {questions.length} Terisi
        </span>
      </div>

      <div className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
        {questionsByAspect.map(({ aspect, items }) => (
          <div key={aspect.aspectId} className="space-y-2">
            <div className="text-[11px] font-semibold text-cyan-400 font-mono line-clamp-1">
              {aspect.title}
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {items.map(({ globalIndex, question }) => {
                const isCurrent = globalIndex === currentQuestionIndex
                const isAnswered = isQuestionAnswered(question)
                const isUnansweredAlert = hasAttemptedSubmit && !isAnswered
                const numStr = String(globalIndex + 1).padStart(2, '0')

                return (
                  <button
                    key={question.questionId}
                    type="button"
                    onClick={() => {
                      onSelectQuestionIndex(globalIndex)
                      if (onCloseMobileDrawer) onCloseMobileDrawer()
                    }}
                    className={`h-9 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center relative ${
                      isCurrent
                        ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 scale-105 z-10 shadow-md shadow-cyan-500/20'
                        : isUnansweredAlert
                        ? 'bg-rose-950/90 text-rose-300 border border-rose-500 ring-2 ring-rose-500/50 animate-pulse shadow-md shadow-rose-500/20'
                        : isAnswered
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                    title={`Soal ${numStr} ${isAnswered ? '(Terisi)' : '(Belum Terisi)'}`}
                  >
                    <span>{numStr}</span>
                    {isAnswered && !isCurrent && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950" />
                    )}
                    {isUnansweredAlert && !isCurrent && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-slate-950 animate-ping" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (isMobileDrawer) {
    return (
      <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200 md:hidden">
        <div className="w-4/5 max-w-xs bg-slate-900 border-l border-slate-800 p-5 h-full space-y-4 overflow-y-auto">
          <div className="flex justify-end">
            <button
              onClick={onCloseMobileDrawer}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
          {content}
        </div>
      </div>
    )
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl hidden md:block sticky top-20 self-start">
      {content}
    </aside>
  )
}
