'use client'

import React, { useState } from 'react'
import type { ScoringConfig } from '@/lib/domain/forms/types'
import type { FormAspect, BuilderQuestion } from '@/lib/domain/forms/builder-state'
import type { DetailedIndicator } from '././LikertScaleEditor'
import { QUESTION_TYPES } from '@/lib/domain/forms/types'
import { calculateQuestionScore } from '@/lib/domain/scoring/scoring-engine'
import { Icon } from '@/components/ui/Icons'
import { AnswerKeySummaryBar } from '././AnswerKeySummaryBar'
import { QuestionKeyCard } from '././QuestionKeyCard'

interface AnswerKeyInspectorProps {
  questions: BuilderQuestion[]
  aspects?: FormAspect[]
  scoring: ScoringConfig
  onUpdateQuestion: (questionId: string, update: any) => void
  onUpdateScoring: (update: Partial<ScoringConfig>) => void
  onSelectQuestion?: (questionId: string) => void
}

export function AnswerKeyInspector({
  questions,
  aspects = [],
  scoring,
  onUpdateQuestion,
  onUpdateScoring,
  onSelectQuestion,
}: AnswerKeyInspectorProps) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterAspect, setFilterAspect] = useState<string>('all')
  const [collapsedAspects, setCollapsedAspects] = useState<Record<string, boolean>>({})

  const toggleAspectCollapse = (aspectId: string) => {
    setCollapsedAspects((prev) => ({ ...prev, [aspectId]: !prev[aspectId] }))
  }

  // Calculate total weight and total indicator table max score using authoritative calculateQuestionScore
  const { totalWeight, totalTableMaxPoints } = React.useMemo(() => {
    let weight = 0
    let tableMax = 0

    questions.forEach((q) => {
      const qScore = calculateQuestionScore(q, null)
      if (q.type === 'indicator-table' || q.type === 'likert') {
        tableMax += qScore.maximumScore
      } else {
        weight += qScore.maximumScore
      }
    })

    return { totalWeight: weight, totalTableMaxPoints: tableMax }
  }, [questions])

  const questionsWithKeys = questions.filter((q) => q.answerKey.kind !== 'none')

  // 1. STRICT FORM ORDER: Aspect order -> Question order inside Aspect
  const orderedAspects = aspects.length > 0 ? aspects : [{ aspectId: 'default', title: 'Pertanyaan Formulir' }]
  const displayNumbers = new Map<string, number>()

  let globalCounter = 1
  orderedAspects.forEach((asp) => {
    const aspQuestions = questions.filter((q) => (q.aspectId || orderedAspects[0].aspectId) === asp.aspectId)
    aspQuestions.forEach((q) => {
      displayNumbers.set(q.questionId, globalCounter++)
    })
  })

  // Direct toggle correct option in Inspector
  const toggleCorrectOption = (question: BuilderQuestion, optionId: string) => {
    const currentCorrect =
      question.answerKey.kind === 'option' ? question.answerKey.correctOptionIds : []
    const isSingle = question.type === 'single-choice' || question.type === 'binary' || question.type === 'dropdown'

    let nextCorrect: string[]
    if (isSingle) {
      nextCorrect = currentCorrect.includes(optionId) ? [] : [optionId]
    } else {
      nextCorrect = currentCorrect.includes(optionId)
        ? currentCorrect.filter((id) => id !== optionId)
        : [...currentCorrect, optionId]
    }

    onUpdateQuestion(question.questionId, {
      answerKey: nextCorrect.length > 0 ? { kind: 'option', correctOptionIds: nextCorrect } : { kind: 'none' },
    })
  }

  // Update specific indicator score for a choice
  const updateIndicatorScoreInInspector = (
    question: BuilderQuestion,
    indicatorId: string,
    choiceKey: string,
    newScore: number
  ) => {
    const indicators: DetailedIndicator[] = (question.presentation.indicators as DetailedIndicator[]) || []
    const updatedIndicators = indicators.map((ind) => {
      if (ind.indicatorId === indicatorId) {
        const currentScores = ind.scores || {}
        return { ...ind, scores: { ...currentScores, [choiceKey]: newScore } }
      }
      return ind
    })

    onUpdateQuestion(question.questionId, {
      presentation: { ...question.presentation, indicators: updatedIndicators },
      answerKey: { kind: 'indicator' },
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <AnswerKeySummaryBar
        totalQuestions={questions.length}
        configuredKeys={questionsWithKeys.length}
        totalWeight={totalWeight}
        totalTableMaxPoints={totalTableMaxPoints}
        scoring={scoring}
      />

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-64">
          <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Cari pertanyaan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {aspects.length > 0 && (
            <select
              value={filterAspect}
              onChange={(e) => setFilterAspect(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="all">Semua Aspek</option>
              {aspects.map((asp) => (
                <option key={asp.aspectId} value={asp.aspectId}>
                  {asp.title}
                </option>
              ))}
            </select>
          )}

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none"
          >
            <option value="all">Semua Tipe</option>
            {QUESTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* STRICT ASPECT-GROUPED QUESTION LIST */}
      <div className="space-y-6">
        {orderedAspects.map((asp, aspIdx) => {
          if (asp.isScored === false) {
            return null // Biodata aspects have no answer keys
          }

          const aspectQuestions = questions.filter((q) => {
            const matchesAspect = filterAspect === 'all' || q.aspectId === filterAspect
            const matchesSearch = q.prompt.toLowerCase().includes(search.toLowerCase()) || q.questionId.toLowerCase().includes(search.toLowerCase())
            const matchesType = filterType === 'all' || q.type === filterType
            const isBelonging = (q.aspectId || orderedAspects[0].aspectId) === asp.aspectId
            return isBelonging && matchesAspect && matchesSearch && matchesType
          })

          if (aspectQuestions.length === 0) return null

          // Calculate max score across ALL questions belonging to this aspect (unfiltered by UI search filter)
          const allAspQuestions = questions.filter(
            (q) => (q.aspectId || orderedAspects[0].aspectId) === asp.aspectId
          )

          const aspChoiceWeight = allAspQuestions.reduce((sum, q) => {
            if (q.type === 'indicator-table' || q.type === 'likert') return sum
            return sum + calculateQuestionScore(q, null).maximumScore
          }, 0)

          const aspTableMax = allAspQuestions.reduce((sum, q) => {
            if (q.type !== 'indicator-table' && q.type !== 'likert') return sum
            return sum + calculateQuestionScore(q, null).maximumScore
          }, 0)

          const aspMaxScore = aspChoiceWeight + aspTableMax

          return (
            <div key={asp.aspectId} className="space-y-4">
              {/* Aspect Header Accordion Banner */}
              <button
                type="button"
                onClick={() => toggleAspectCollapse(asp.aspectId)}
                className="w-full p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between transition-all cursor-pointer text-left shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    ASPEK {String(aspIdx + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100">{asp.title}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span className="text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Max {aspMaxScore} pt {aspTableMax > 0 ? `(${aspChoiceWeight} pt Opsi + ${aspTableMax} pt Tabel)` : ''}
                  </span>
                  <span>({aspectQuestions.length} Soal)</span>
                  <Icon name={collapsedAspects[asp.aspectId] ? 'chevronDown' : 'chevronUp'} className="w-4 h-4 text-cyan-400 shrink-0" />
                </div>
              </button>

              {/* Questions inside Aspect */}
              {!collapsedAspects[asp.aspectId] && (
                <div className="space-y-4">
                {aspectQuestions.map((q) => {
                  const displayNum = displayNumbers.get(q.questionId) || 1

                  return (
                    <QuestionKeyCard
                      key={q.questionId}
                      q={q}
                      displayNum={displayNum}
                      onUpdateQuestion={onUpdateQuestion}
                      onSelectQuestion={onSelectQuestion}
                      toggleCorrectOption={toggleCorrectOption}
                      updateIndicatorScoreInInspector={updateIndicatorScoreInInspector}
                    />
                  )
                })}
              </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
