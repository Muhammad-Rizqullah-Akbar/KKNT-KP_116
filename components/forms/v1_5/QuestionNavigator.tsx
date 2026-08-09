'use client'

import React from 'react'
import type { BuilderQuestion, FormAspect } from '@/lib/forms/v1_5/builderState'
import { Icon } from '@/components/ui/Icons'

export type QuestionStatus = 'valid' | 'warning' | 'error'

interface QuestionNavigatorProps {
  questions: BuilderQuestion[]
  aspects?: FormAspect[]
  activeQuestionId: string | null
  questionStatuses?: Record<string, QuestionStatus>
  onSelectQuestion: (questionId: string) => void
  isMobileOnly?: boolean
  isDesktopOnly?: boolean
}

export function QuestionNavigator({
  questions,
  aspects = [],
  activeQuestionId,
  questionStatuses = {},
  onSelectQuestion,
  isMobileOnly = false,
  isDesktopOnly = false,
}: QuestionNavigatorProps) {
  if (questions.length === 0) return null

  // Flattened questions list to calculate derived display numbers 1..N
  const orderedAspectIds = aspects.map((a) => a.aspectId)
  const flattenedQuestions = [...questions].sort((a, b) => {
    const aspAIdx = orderedAspectIds.indexOf(a.aspectId || '')
    const aspBIdx = orderedAspectIds.indexOf(b.aspectId || '')
    return aspAIdx - aspBIdx
  })

  // Map of questionId -> derived display index (1-based)
  const displayNumbers = new Map<string, number>()
  flattenedQuestions.forEach((q, idx) => {
    displayNumbers.set(q.questionId, idx + 1)
  })

  // Mobile view: Sticky horizontal strip at top
  const renderMobileStrip = () => (
    <div className="sticky top-[61px] z-20 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-sm md:hidden">
      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mr-1 flex-shrink-0 uppercase tracking-wider">
        <Icon name="listOrdered" className="w-3.5 h-3.5 text-cyan-400" />
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
        {flattenedQuestions.map((q) => {
          const displayNum = displayNumbers.get(q.questionId) || 1
          const isActive = activeQuestionId === q.questionId
          const status = questionStatuses[q.questionId] || 'valid'

          const statusStyles = {
            valid: 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20',
            warning: 'border-amber-500/40 text-amber-300 hover:bg-amber-500/20 bg-amber-500/10',
            error: 'border-rose-500/50 text-rose-300 hover:bg-rose-500/20 bg-rose-500/10',
          }[status]

          const activeStyle = isActive
            ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 bg-cyan-500/20 text-cyan-200 font-bold border-cyan-400'
            : 'bg-slate-800/80 text-slate-300'

          return (
            <button
              key={q.questionId}
              type="button"
              onClick={() => onSelectQuestion(q.questionId)}
              title={`#${String(displayNum).padStart(2, '0')}: ${q.prompt || 'Tanpa Judul'}`}
              className={`flex items-center justify-center min-w-[32px] h-8 px-2 rounded-lg border text-xs font-mono transition-all flex-shrink-0 ${statusStyles} ${activeStyle}`}
            >
              <span>{String(displayNum).padStart(2, '0')}</span>
              {status === 'valid' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1 inline-block" />}
              {status === 'warning' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-1 inline-block" />}
              {status === 'error' && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 ml-1 inline-block" />}
            </button>
          )
        })}
      </div>
    </div>
  )

  // Desktop view: Persistent STICKY left-side sidebar grouped by Aspect
  const renderDesktopSidebar = () => (
    <aside className="hidden md:block w-64 flex-shrink-0 sticky top-24 max-h-[calc(100vh-110px)] overflow-y-auto pr-2 space-y-4 no-scrollbar">
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex items-center justify-between shadow-md">
        <span className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Icon name="listOrdered" className="w-4 h-4 text-cyan-400" />
          Navigasi Formulir
        </span>
        <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-lg border border-cyan-500/30">
          {questions.length} Q
        </span>
      </div>

      <div className="space-y-4">
        {aspects.map((asp, aspIdx) => {
          const aspectQuestions = questions.filter((q) => (q.aspectId || aspects[0]?.aspectId) === asp.aspectId)

          return (
            <div key={asp.aspectId} className="space-y-1">
              <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider px-3 py-1.5 flex items-center justify-between bg-slate-900/50 rounded-xl border border-slate-800/80">
                <span className="truncate">Bagian {aspIdx + 1}: {asp.title}</span>
                <span className="text-[10px] font-mono text-slate-400">({aspectQuestions.length})</span>
              </div>

              <div className="space-y-1.5 pt-1">
                {aspectQuestions.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic px-3 py-1">(Belum ada pertanyaan)</p>
                ) : (
                  aspectQuestions.map((q) => {
                    const displayNum = displayNumbers.get(q.questionId) || 1
                    const isActive = activeQuestionId === q.questionId
                    const status = questionStatuses[q.questionId] || 'valid'

                    const statusBadge = {
                      valid: <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" title="Lengkap" />,
                      warning: <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="Peringatan" />,
                      error: <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" title="Error" />,
                    }[status]

                    return (
                      <button
                        key={q.questionId}
                        type="button"
                        onClick={() => onSelectQuestion(q.questionId)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all text-left group ${
                          isActive
                            ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 font-semibold shadow-sm ring-1 ring-cyan-500/30'
                            : 'bg-slate-900/70 text-slate-300 border border-slate-800/80 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="font-mono text-[11px] font-bold text-slate-400 group-hover:text-cyan-300 w-5">
                            {String(displayNum).padStart(2, '0')}
                          </span>
                          <span className="truncate text-xs">{q.prompt || '(Tanpa Judul)'}</span>
                        </div>
                        {statusBadge}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )

  if (isMobileOnly) return renderMobileStrip()
  if (isDesktopOnly) return renderDesktopSidebar()

  return (
    <>
      {renderMobileStrip()}
      {renderDesktopSidebar()}
    </>
  )
}
