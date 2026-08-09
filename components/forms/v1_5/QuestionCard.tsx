'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { BuilderQuestion, FormAspect } from '@/lib/forms/v1_5/builderState'
import { Icon } from '@/components/ui/Icons'

interface QuestionCardProps {
  question: BuilderQuestion
  index: number
  totalQuestions: number
  aspects?: FormAspect[]
  isEditing: boolean
  onToggleEdit: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onMoveToAspect?: (targetAspectId: string) => void
  onDuplicate: () => void
  onDelete: () => void
}

export function QuestionCard({
  question,
  index,
  totalQuestions,
  aspects = [],
  isEditing,
  onToggleEdit,
  onMoveUp,
  onMoveDown,
  onMoveToAspect,
  onDuplicate,
  onDelete,
}: QuestionCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.questionId,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const hasAnswerKey = question.answerKey.kind !== 'none'
  const currentAspect = aspects.find((a) => a.aspectId === question.aspectId)
  const isIndicatorTable = question.type === 'indicator-table' || question.type === 'likert'

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`question-${question.questionId}`}
      className={`rounded-2xl border transition-all duration-200 shadow-sm ${
        isEditing
          ? 'bg-slate-900 border-cyan-500/60 ring-1 ring-cyan-500/30'
          : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900'
      }`}
    >
      {/* Summary Row */}
      <div className="p-4 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Drag Handle & Reordering Up/Down */}
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="p-1 cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 transition-colors"
            title="Tarik untuk memindahkan pertanyaan"
          >
            <Icon name="gripVertical" className="w-4 h-4" />
          </button>

          {/* Keyboard Accessible Fallback Move Up/Down */}
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={index === 0}
              title="Pindah Ke Atas (Aksesibilitas)"
              aria-label="Pindah Ke Atas"
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 disabled:opacity-30 transition-colors"
            >
              <Icon name="arrowUp" className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={index === totalQuestions - 1}
              title="Pindah Ke Bawah (Aksesibilitas)"
              aria-label="Pindah Ke Bawah"
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 disabled:opacity-30 transition-colors"
            >
              <Icon name="arrowDown" className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700/80">
            {index + 1}
          </span>
        </div>

        {/* Question Title & Visual Section Badges */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggleEdit}>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {/* Aspect Badge */}
            {currentAspect && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 truncate max-w-[150px]">
                {currentAspect.title}
              </span>
            )}

            {/* 🔵 CONTENT BADGE */}
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              {question.type}
            </span>

            {/* 🟣 VALIDATION BADGE */}
            {question.required ? (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Wajib *
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Opsional
              </span>
            )}

            {/* 🟢 ANSWER CONFIG BADGE */}
            {hasAnswerKey && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                <Icon name="check" className="w-3 h-3 text-emerald-400" />
                Kunci Jawaban
              </span>
            )}

            {/* 🟡 SCORING BADGE */}
            {isIndicatorTable ? (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Skor Per-Indikator
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {question.scoring.weight} pt ({question.scoring.scheme})
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-slate-100 truncate">
            {question.prompt || <span className="italic text-slate-500">(Tuliskan teks pertanyaan...)</span>}
          </h3>
        </div>

        {/* Move to Aspect Select & Quick Actions */}
        <div className="flex items-center gap-1.5">
          {aspects.length > 1 && onMoveToAspect && (
            <select
              value={question.aspectId || ''}
              onChange={(e) => onMoveToAspect(e.target.value)}
              title="Pindahkan Ke Aspek Lain"
              className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
            >
              {aspects.map((asp) => (
                <option key={asp.aspectId} value={asp.aspectId}>
                  Pindah: {asp.title}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={onToggleEdit}
            className={`p-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              isEditing
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            <Icon name={isEditing ? 'chevronDown' : 'pencil'} className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEditing ? 'Tutup' : 'Edit'}</span>
          </button>

          <button
            type="button"
            onClick={onDuplicate}
            title="Duplikat Pertanyaan"
            aria-label="Duplikat Pertanyaan"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
          >
            <Icon name="copy" className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            title="Hapus Pertanyaan"
            aria-label="Hapus Pertanyaan"
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-colors"
          >
            <Icon name="trash" className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
