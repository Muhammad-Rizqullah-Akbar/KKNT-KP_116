'use client'

import React, { useState, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'

import type { BuilderState, BuilderQuestion } from '@/lib/forms/v1_5/builderState'
import {
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestion,
  duplicateQuestion,
  moveQuestionToAspect,
  addAspect,
  updateAspect,
} from '@/lib/forms/v1_5/builderState'
import type { QuestionType } from '@/lib/forms/v1_5/types'
import { QuestionEditor } from '../QuestionEditor'
import { Icon } from '@/components/ui/Icons'
import { AddAspectModal, ConfirmDeleteModal } from '../modals/FormBuilderModals'

interface Step2BuildProps {
  state: BuilderState
  onChange: (nextState: BuilderState) => void
  onContinue: () => void
  onBack: () => void
}

export function Step2Build({ state, onChange, onContinue, onBack }: Step2BuildProps) {
  const { aspects, questions } = state
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(
    questions[0]?.questionId || null
  )

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  // Compute Global Sequential Number Map for Questions across all aspects
  const globalQuestionNumberMap = useMemo(() => {
    const map = new Map<string, number>()
    let currentGlobalNum = 1

    aspects.forEach((asp) => {
      const aspQuestions = questions.filter((q) => (q.aspectId || aspects[0]?.aspectId) === asp.aspectId)
      aspQuestions.forEach((q) => {
        map.set(q.questionId, currentGlobalNum++)
      })
    })
    return map
  }, [aspects, questions])

  const [isAddAspectModalOpen, setIsAddAspectModalOpen] = useState(false)
  const [deleteQuestionIdTarget, setDeleteQuestionIdTarget] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Add Question to Aspect
  const handleAddQuestionToAspect = (aspectId: string, type: QuestionType = 'single-choice') => {
    const newId = `q_${crypto.randomUUID()}`
    const defaultQuestion: BuilderQuestion = {
      questionId: newId,
      aspectId,
      type,
      prompt: `Pertanyaan Evaluasi ${questions.length + 1}`,
      required: true,
      options:
        ['single-choice', 'multiple-choice', 'dropdown', 'binary'].includes(type)
          ? [
              { optionId: `${newId}-option-1`, label: 'Opsi 1 — Memenuhi Standar' },
              { optionId: `${newId}-option-2`, label: 'Opsi 2 — Tidak Memenuhi Standar' },
            ]
          : [],
      presentation: {
        description: '',
        media: { type: 'none' },
        indicators: [],
        indicatorScales: [],
      },
      scoring: { scheme: 'none', weight: 5 },
      answerKey: { kind: 'none' },
    }

    try {
      const updated = addQuestion(state, defaultQuestion)
      onChange(updated)
      setExpandedQuestionId(newId)
    } catch (err: any) {
      showToast(err.message || 'Gagal menambah pertanyaan.')
    }
  }

  // Update Question
  const handleUpdateQuestion = (qId: string, update: Partial<BuilderQuestion>) => {
    onChange(updateQuestion(state, qId, update))
  }

  // Confirm Delete Question Execution
  const executeDeleteQuestion = (qId: string) => {
    const updated = deleteQuestion(state, qId)
    onChange(updated)
    if (expandedQuestionId === qId) {
      setExpandedQuestionId(null)
    }
    showToast('Pertanyaan berhasil dihapus.')
  }

  // Duplicate Question
  const handleDuplicateQuestion = (qId: string) => {
    try {
      const updated = duplicateQuestion(state, qId)
      onChange(updated)
      showToast('Pertanyaan berhasil diduplikat.')
    } catch (err: any) {
      showToast(err.message || 'Gagal menduplikat pertanyaan.')
    }
  }

  // DND Drag Handler across aspects and reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    const activeQIdx = questions.findIndex((q) => q.questionId === activeId)
    const overQIdx = questions.findIndex((q) => q.questionId === overId)

    if (activeQIdx !== -1 && overQIdx !== -1) {
      const overQ = questions[overQIdx]
      let nextState = state
      if (questions[activeQIdx].aspectId !== overQ.aspectId && overQ.aspectId) {
        nextState = moveQuestionToAspect(nextState, activeId, overQ.aspectId)
      }
      nextState = reorderQuestion(nextState, activeId, overQIdx)
      onChange(nextState)
    }
  }

  // Add New Aspect via Modal Submit
  const handleAddAspectSubmit = (title: string, description: string, isScored: boolean) => {
    const newAspectId = `asp_${crypto.randomUUID()}`
    try {
      const updated = addAspect(state, {
        aspectId: newAspectId,
        title,
        description,
        isScored,
      })
      onChange(updated)
      showToast(`Aspek "${title}" berhasil ditambahkan.`)
    } catch (err: any) {
      showToast(err.message || 'Gagal menambah aspek baru.')
    }
  }

  return (
    <div className="space-y-4 py-2">
      {/* Header Info */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Icon name="edit" className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">02 — Canvas Penyusunan Pertanyaan & Accordion Pengatur</h2>
            <p className="text-xs text-slate-400">
              Klik pertanyaan untuk membuka/menutup accordion pengatur kunci jawaban dan opsi. Penomoran berurutan secara otomatis.
            </p>
          </div>
        </div>
      </div>

      {/* 2-COLUMN LAYOUT: 25% LEFT NAVIGATOR / 75% MAIN CANVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMN 1: LEFT ASPECT & QUESTION TREE NAVIGATOR (3 cols = 25%) */}
        <div className="lg:col-span-3 rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-4 sticky top-24">
          <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 min-w-0">
              <Icon name="layers" className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate">Struktur Kuesioner</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAddAspectModalOpen(true)}
              className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0"
              title="Tambah Aspek Baru"
            >
              <Icon name="plus" className="w-3 h-3" />
              <span>Aspek</span>
            </button>
          </div>

          <div className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {aspects.map((asp, idx) => {
              const aspQuestions = questions.filter((q) => (q.aspectId || aspects[0]?.aspectId) === asp.aspectId)

              return (
                <div key={asp.aspectId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300 px-2 py-1.5 rounded bg-slate-950/60 border border-slate-800 gap-1">
                    <span className="truncate flex items-center gap-1.5 min-w-0">
                      <span>{idx + 1}. {asp.title}</span>
                      {asp.isScored === false && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 font-normal">
                          Biodata
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">({aspQuestions.length})</span>
                  </div>

                  <div className="pl-2 space-y-1 border-l-2 border-slate-800">
                    {aspQuestions.map((q) => {
                      const globalNum = globalQuestionNumberMap.get(q.questionId) || 1
                      const isExpanded = q.questionId === expandedQuestionId

                      return (
                        <button
                          key={q.questionId}
                          type="button"
                          onClick={() => {
                            setExpandedQuestionId(isExpanded ? null : q.questionId)
                            const el = document.getElementById(`question-card-${q.questionId}`)
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          }}
                          className={`w-full p-2 rounded-lg text-left text-xs transition-all flex items-center justify-between gap-2 ${
                            isExpanded
                              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-bold'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                          }`}
                        >
                          <span className="truncate">
                            P{globalNum}. {q.prompt || 'Tanpa Judul'}
                          </span>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                            {q.type}
                          </span>
                        </button>
                      )
                    })}

                    <button
                      type="button"
                      onClick={() => handleAddQuestionToAspect(asp.aspectId)}
                      className="w-full py-1 px-2 rounded border border-dashed border-slate-800 text-[11px] text-cyan-400 hover:bg-cyan-500/10 flex items-center justify-center gap-1 transition-colors mt-1"
                    >
                      <Icon name="plus" className="w-3 h-3" />
                      <span>Tambah Pertanyaan</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* COLUMN 2: MAIN CANVAS WITH ACCORDION QUESTION INSPECTORS (9 cols = 75%) */}
        <div className="lg:col-span-9 space-y-6">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {aspects.map((asp, aIdx) => {
              const aspQuestions = questions.filter((q) => (q.aspectId || aspects[0]?.aspectId) === asp.aspectId)
              const isScored = asp.isScored !== false
              const outputMode = state.scoring.outputMode || 'both'
              const isWeightedMode = outputMode === 'overall' || outputMode === 'both'

              return (
                <div
                  key={asp.aspectId}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-md"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                          Dimensi {aIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => onChange(updateAspect(state, asp.aspectId, { isScored: !isScored }))}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-colors ${
                            !isScored
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          }`}
                          title="Klik untuk mengubah mode penilaian aspek ini"
                        >
                          {!isScored
                            ? 'BIODATA / TANPA SKOR'
                            : isWeightedMode
                              ? `PENILAIAN BERBOBOT (${state.scoring.stagePointDistribution?.[asp.aspectId] ?? 0}%)`
                              : 'PENILAIAN INDEPENDENT'}
                        </button>
                      </div>
                      <h3 className="text-sm font-bold text-slate-100">{asp.title}</h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddQuestionToAspect(asp.aspectId)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <Icon name="plus" className="w-3.5 h-3.5" />
                      <span>Tambah Pertanyaan</span>
                    </button>
                  </div>

                  {aspQuestions.length === 0 ? (
                    <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center space-y-2">
                      <p className="text-xs text-slate-400">Belum ada pertanyaan pada aspek ini.</p>
                      <button
                        type="button"
                        onClick={() => handleAddQuestionToAspect(asp.aspectId)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold transition-colors"
                      >
                        + Tambah Pertanyaan Pertama
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {aspQuestions.map((q) => {
                        const globalNum = globalQuestionNumberMap.get(q.questionId) || 1
                        const isExpanded = q.questionId === expandedQuestionId

                        return (
                          <div
                            key={q.questionId}
                            id={`question-card-${q.questionId}`}
                            className={`rounded-xl border transition-all ${
                              isExpanded
                                ? 'bg-slate-950 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {/* ACCORDION HEADER CARD */}
                            <div
                              onClick={() => setExpandedQuestionId(isExpanded ? null : q.questionId)}
                              className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center border border-cyan-500/20 shrink-0">
                                  {globalNum}
                                </span>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-slate-100 truncate">
                                    P{globalNum}. {q.prompt || 'Tuliskan teks pertanyaan...'}
                                  </h4>
                                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                    Tipe: <span className="uppercase text-purple-300 font-semibold">{q.type}</span> • {q.options.length} Opsi
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDuplicateQuestion(q.questionId)
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-900 rounded-lg"
                                  title="Duplikat"
                                >
                                  <Icon name="copy" className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeleteQuestionIdTarget(q.questionId)
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                  title="Hapus"
                                >
                                  <Icon name="trash" className="w-4 h-4" />
                                </button>

                                {/* ACCORDION CHEVRON ARROW TOGGLE */}
                                <div className="p-1.5 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors">
                                  <Icon name={isExpanded ? 'chevronUp' : 'chevronDown'} className="w-4 h-4" />
                                </div>
                              </div>
                            </div>

                            {/* COLLAPSIBLE ACCORDION BODY: QUESTION EDITOR & ANSWER KEY */}
                            {isExpanded && (
                              <div className="border-t border-slate-800 bg-slate-950 p-4">
                                <QuestionEditor
                                  question={q}
                                  aspects={aspects}
                                  onUpdate={(update) => handleUpdateQuestion(q.questionId, update)}
                                  onClose={() => setExpandedQuestionId(null)}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </DndContext>
        </div>
      </div>

      {/* Navigation Footer Action */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-all"
        >
          <Icon name="arrowLeft" className="w-4 h-4" />
          <span>Kembali ke 01 Setup</span>
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
        >
          <span>Lanjutkan ke 03 Review</span>
          <Icon name="arrowRight" className="w-4 h-4" />
        </button>
      </div>

      {/* MODAL DIALOGS & TOAST NOTIFICATIONS */}
      <AddAspectModal
        isOpen={isAddAspectModalOpen}
        onClose={() => setIsAddAspectModalOpen(false)}
        onSubmit={handleAddAspectSubmit}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deleteQuestionIdTarget)}
        title="Hapus Pertanyaan"
        message="Apakah Anda yakin ingin menghapus pertanyaan ini dari kuesioner?"
        onClose={() => setDeleteQuestionIdTarget(null)}
        onConfirm={() => {
          if (deleteQuestionIdTarget) executeDeleteQuestion(deleteQuestionIdTarget)
        }}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
