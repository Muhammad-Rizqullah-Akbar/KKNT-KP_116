'use client'

import { FormPublicRenderer } from '@/features/form-builder/components/preview/FormPublicRenderer'
import { PublicProgressHeader } from '@/features/form-builder/components/preview/PublicProgressHeader'
import { PublicQuestionNavigator } from '@/features/form-builder/components/question-editor/PublicQuestionNavigator'
import { Icon } from '@/components/ui/Icons'
import type { ResolvedAspect } from './form-aspects'

interface FillingViewProps {
  code: string
  title: string
  resolvedVersionNumber: number
  questions: any[]
  aspects: ResolvedAspect[]
  currentQuestionIndex: number
  answers: Record<string, any>
  viewMode: 'single' | 'aspect_all'
  isMobileNavigatorOpen: boolean
  validationError: string | null
  onToggleViewMode: (mode: 'single' | 'aspect_all') => void
  onToggleNavigator: () => void
  onCloseMobileDrawer: () => void
  onSelectQuestionIndex: (idx: number) => void
  onAnswerChange: (qId: string, val: any) => void
  onDismissError: () => void
  onGoToReview: () => void
}

export function FillingView({
  code,
  title,
  resolvedVersionNumber,
  questions,
  aspects,
  currentQuestionIndex,
  answers,
  viewMode,
  isMobileNavigatorOpen,
  validationError,
  onToggleViewMode,
  onToggleNavigator,
  onCloseMobileDrawer,
  onSelectQuestionIndex,
  onAnswerChange,
  onDismissError,
  onGoToReview,
}: FillingViewProps) {
  const activeQuestion = questions[currentQuestionIndex]
  const activeAspectId = (activeQuestion as any)?.aspectId || (activeQuestion as any)?.stageId || aspects[0]?.aspectId
  const activeAspect = aspects.find((a) => a.aspectId === activeAspectId) || aspects[0]

  // Questions belonging to active aspect for 'aspect_all' mode, sorted by global question index
  const activeAspectQuestions = questions.filter((q: any) => {
    const aId = (q as any).aspectId || (q as any).stageId || (q as any).stage_id || 'default'
    return aId === activeAspectId || aId === activeAspect?.aspectId
  })
  activeAspectQuestions.sort((a: any, b: any) => {
    const idxA = questions.findIndex((q: any) => q.questionId === a.questionId)
    const idxB = questions.findIndex((q: any) => q.questionId === b.questionId)
    return idxA - idxB
  })

  const currentAspectIndex = aspects.findIndex((a) => a.aspectId === activeAspectId)
  const isFirstAspect = currentAspectIndex <= 0
  const isLastAspect = currentAspectIndex >= aspects.length - 1

  const isFirstQuestion = currentQuestionIndex === 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Sticky Responsive Progress Header */}
      <PublicProgressHeader
        code={code}
        title={title}
        activeAspectTitle={activeAspect?.title}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        versionNumber={resolvedVersionNumber}
        viewMode={viewMode}
        onToggleViewMode={onToggleViewMode}
        onToggleNavigator={onToggleNavigator}
        isNavigatorOpen={isMobileNavigatorOpen}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex items-start gap-6">
        {/* Desktop Persistent Left-Side Question Navigator */}
        <PublicQuestionNavigator
          aspects={aspects}
          questions={questions}
          currentQuestionIndex={currentQuestionIndex}
          answers={answers}
          hasAttemptedSubmit={!!validationError}
          onSelectQuestionIndex={(idx) => {
            onSelectQuestionIndex(idx)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />

        {/* Mobile Drawer Navigator */}
        {isMobileNavigatorOpen && (
          <PublicQuestionNavigator
            aspects={aspects}
            questions={questions}
            currentQuestionIndex={currentQuestionIndex}
            answers={answers}
            hasAttemptedSubmit={!!validationError}
            onSelectQuestionIndex={(idx) => {
              onSelectQuestionIndex(idx)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            isMobileDrawer
            onCloseMobileDrawer={onCloseMobileDrawer}
          />
        )}

        {/* Focused Question Workspace Canvas */}
        <main className="flex-1 min-w-0 space-y-6">
          {validationError && (
            <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs font-semibold flex items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <Icon name="alertCircle" className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span>{validationError}</span>
              </div>
              <button
                type="button"
                onClick={onDismissError}
                className="text-amber-400 hover:text-white p-1"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeAspect && (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider">
                  Aspek {currentAspectIndex >= 0 ? currentAspectIndex + 1 : 1} dari {aspects.length}
                </span>
                <h2 className="text-sm font-bold text-slate-100">{activeAspect.title}</h2>
              </div>
              {activeAspect.description && (
                <span className="text-xs text-slate-400 hidden sm:inline line-clamp-1">
                  {activeAspect.description}
                </span>
              )}
            </div>
          )}

          {/* View Mode Canvas Rendering */}
          {viewMode === 'aspect_all' ? (
            /* Mode All Questions in Aspect */
            <div className="space-y-6">
              <FormPublicRenderer
                questions={activeAspectQuestions.length > 0 ? activeAspectQuestions : [activeQuestion]}
                answers={answers}
                onAnswerChange={onAnswerChange}
                allQuestions={questions}
              />

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 flex-wrap shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    if (!isFirstAspect) {
                      const prevAspect = aspects[currentAspectIndex - 1]
                      const firstQ = questions.findIndex(
                        (q: any) => ((q as any).aspectId || (q as any).stageId || 'default') === prevAspect.aspectId
                      )
                      if (firstQ >= 0) onSelectQuestionIndex(firstQ)
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  disabled={isFirstAspect}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Icon name="arrowLeft" className="w-4 h-4" />
                  <span>Aspek Sebelumnya</span>
                </button>

                {isLastAspect ? (
                  <button
                    type="button"
                    onClick={() => {
                      onGoToReview()
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold shadow-lg shadow-cyan-600/25 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Tinjau & Kirim Jawaban</span>
                    <Icon name="arrowRight" className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const nextAspect = aspects[currentAspectIndex + 1]
                      const firstQ = questions.findIndex(
                        (q: any) => ((q as any).aspectId || (q as any).stageId || 'default') === nextAspect.aspectId
                      )
                      if (firstQ >= 0) onSelectQuestionIndex(firstQ)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Aspek Selanjutnya</span>
                    <Icon name="arrowRight" className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Mode Single Question */
            <div className="space-y-6">
              {activeQuestion ? (
                <FormPublicRenderer
                  questions={[activeQuestion]}
                  answers={answers}
                  onAnswerChange={onAnswerChange}
                  allQuestions={questions}
                />
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
                  Tidak ada pertanyaan pada indeks ini.
                </div>
              )}

              {/* Previous / Next Controls Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    onSelectQuestionIndex(Math.max(0, currentQuestionIndex - 1))
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  disabled={isFirstQuestion}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition-colors"
                >
                  <Icon name="arrowLeft" className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                {isLastQuestion ? (
                  <button
                    type="button"
                    onClick={onGoToReview}
                    className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold shadow-lg shadow-cyan-600/25 flex items-center gap-2 transition-all"
                  >
                    <span>Tinjau Jawaban</span>
                    <Icon name="arrowRight" className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Selanjutnya</span>
                    <Icon name="arrowRight" className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
