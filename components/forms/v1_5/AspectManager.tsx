'use client'

import React, { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { FormAspect, BuilderQuestion } from '@/lib/forms/v1_5/builderState'
import { QuestionCard } from './QuestionCard'
import { QuestionEditor } from './QuestionEditor'
import { Icon } from '@/components/ui/Icons'

interface AspectManagerProps {
  aspect: FormAspect
  aspectIndex: number
  totalAspects: number
  allocatedPoints?: number
  questions: BuilderQuestion[]
  allAspects: FormAspect[]
  editingQuestionId: string | null
  onUpdateAspect: (aspectId: string, update: Partial<FormAspect>) => void
  onUpdateAllocatedPoints: (aspectId: string, points: number) => void
  onDeleteAspect: (aspectId: string) => void
  onMoveAspectUp: () => void
  onMoveAspectDown: () => void
  onAddQuestionToAspect: (aspectId: string) => void
  onToggleEditQuestion: (questionId: string) => void
  onMoveQuestionUp: (questionIndex: number) => void
  onMoveQuestionDown: (questionIndex: number) => void
  onMoveQuestionToAspect: (questionId: string, targetAspectId: string) => void
  onDuplicateQuestion: (questionId: string) => void
  onDeleteQuestion: (questionId: string) => void
  onUpdateQuestion: (questionId: string, update: any) => void
}

export function AspectManager({
  aspect,
  aspectIndex,
  totalAspects,
  allocatedPoints = 0,
  questions,
  allAspects,
  editingQuestionId,
  onUpdateAspect,
  onUpdateAllocatedPoints,
  onDeleteAspect,
  onMoveAspectUp,
  onMoveAspectDown,
  onAddQuestionToAspect,
  onToggleEditQuestion,
  onMoveQuestionUp,
  onMoveQuestionDown,
  onMoveQuestionToAspect,
  onDuplicateQuestion,
  onDeleteQuestion,
  onUpdateQuestion,
}: AspectManagerProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: aspect.aspectId,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const [isHeaderEditing, setIsHeaderEditing] = useState(false)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg overflow-hidden space-y-4"
    >
      {/* Aspect Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          {/* Drag Handle for Aspect */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="p-1.5 cursor-grab active:cursor-grabbing text-slate-500 hover:text-cyan-400 transition-colors"
            title="Tarik untuk memindahkan aspek ini"
          >
            <Icon name="gripVertical" className="w-5 h-5" />
          </button>

          {/* Reorder Buttons (Keyboard Fallback) */}
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={onMoveAspectUp}
              disabled={aspectIndex === 0}
              title="Pindah Aspek Ke Atas (Aksesibilitas)"
              className="p-1 text-slate-400 hover:text-cyan-400 disabled:opacity-30 transition-colors"
            >
              <Icon name="arrowUp" className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onMoveAspectDown}
              disabled={aspectIndex === totalAspects - 1}
              title="Pindah Aspek Ke Bawah (Aksesibilitas)"
              className="p-1 text-slate-400 hover:text-cyan-400 disabled:opacity-30 transition-colors"
            >
              <Icon name="arrowDown" className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Aspect Title & Description */}
          <div className="flex-1">
            {isHeaderEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={aspect.title}
                  onChange={(e) => onUpdateAspect(aspect.aspectId, { title: e.target.value })}
                  placeholder="Nama Aspek..."
                  className="w-full bg-slate-950 border border-cyan-500 text-slate-100 font-bold text-sm rounded-lg px-3 py-1.5 focus:outline-none"
                />
                <input
                  type="text"
                  value={aspect.description || ''}
                  onChange={(e) => onUpdateAspect(aspect.aspectId, { description: e.target.value })}
                  placeholder="Deskripsi Aspek..."
                  className="w-full bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setIsHeaderEditing(false)}
                  className="text-xs text-cyan-400 hover:underline font-semibold"
                >
                  Selesai Mengedit Aspek
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    Bagian {aspectIndex + 1}
                  </span>
                  <h3 className="text-base font-bold text-slate-100">{aspect.title}</h3>
                  <button
                    type="button"
                    onClick={() => setIsHeaderEditing(true)}
                    className="text-slate-500 hover:text-cyan-400 p-1"
                    title="Edit Nama / Deskripsi Aspek"
                  >
                    <Icon name="pencil" className="w-3.5 h-3.5" />
                  </button>
                </div>
                {aspect.description && <p className="text-xs text-slate-400 mt-0.5">{aspect.description}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Aspect Points & Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Sakelar Toggle Penilaian */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Aspek Dinilai:</span>
            <button
              type="button"
              onClick={() => {
                const nextIsScored = aspect.isScored === false ? true : false
                onUpdateAspect(aspect.aspectId, { isScored: nextIsScored })
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                aspect.isScored !== false ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
              title={aspect.isScored !== false ? 'Aspek ini dinilai dalam skor akhir' : 'Aspek ini murni Biodata/Informasi (Tanpa Penilaian)'}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  aspect.isScored !== false ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`font-bold ${aspect.isScored !== false ? 'text-emerald-400' : 'text-slate-400'}`}>
              {aspect.isScored !== false ? 'Ya (Aktif)' : 'Tidak (Biodata)'}
            </span>
          </div>

          {/* HANYA TAMPILKAN INPUT POIN JIKA TOGGLE PENILAIAN AKTIF */}
          {aspect.isScored !== false && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400">Target Poin:</span>
              <input
                type="number"
                min={0}
                value={allocatedPoints}
                onChange={(e) => onUpdateAllocatedPoints(aspect.aspectId, Number(e.target.value) || 0)}
                className="w-14 bg-slate-900 border border-slate-700 text-amber-300 font-bold text-center text-xs rounded px-1 py-0.5 focus:outline-none"
              />
              <span className="text-amber-400 font-semibold">pt</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => onAddQuestionToAspect(aspect.aspectId)}
            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-colors"
          >
            <Icon name="plus" className="w-3.5 h-3.5" />
            <span>+ Pertanyaan</span>
          </button>

          {totalAspects > 1 && (
            <button
              type="button"
              onClick={() => onDeleteAspect(aspect.aspectId)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
              title="Hapus Aspek Ini"
            >
              <Icon name="trash" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Aspect Questions */}
      <div className="p-4 space-y-3">
        {questions.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-slate-500 text-xs space-y-2">
            <p>Belum ada pertanyaan pada aspek ini.</p>
            <button
              type="button"
              onClick={() => onAddQuestionToAspect(aspect.aspectId)}
              className="text-cyan-400 hover:underline font-semibold"
            >
              + Tambah Pertanyaan Pertama di Aspek Ini
            </button>
          </div>
        ) : (
          questions.map((q, idx) => {
            const isEditing = editingQuestionId === q.questionId

            return (
              <div key={q.questionId} className="space-y-2">
                <QuestionCard
                  question={q}
                  index={idx}
                  totalQuestions={questions.length}
                  aspects={allAspects}
                  isEditing={isEditing}
                  onToggleEdit={() => onToggleEditQuestion(q.questionId)}
                  onMoveUp={() => onMoveQuestionUp(idx)}
                  onMoveDown={() => onMoveQuestionDown(idx)}
                  onMoveToAspect={(targetAspectId) => onMoveQuestionToAspect(q.questionId, targetAspectId)}
                  onDuplicate={() => onDuplicateQuestion(q.questionId)}
                  onDelete={() => onDeleteQuestion(q.questionId)}
                />

                {isEditing && (
                  <QuestionEditor
                    question={q}
                    aspects={allAspects}
                    onUpdate={(update) => onUpdateQuestion(q.questionId, update)}
                    onClose={() => onToggleEditQuestion(q.questionId)}
                  />
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
