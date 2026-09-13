'use client'

import type { PublicQuestion } from '@/lib/domain/forms/types'
import { Icon } from '@/components/ui/Icons'
import { QuestionInput } from './QuestionInput'

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
              const mediaUrl =
                question.presentation?.media?.url ||
                (question as any).presentation?.imageUrl ||
                (question as any).imageUrl ||
                (question as any).image ||
                (question as any).mediaUrl ||
                (question as any).photoURL ||
                (question as any).media?.url ||
                (question as any).config?.imageUrl ||
                (question as any).config?.media?.url
              const caption =
                question.presentation?.media?.caption ||
                (question as any).imageCaption ||
                (question as any).caption ||
                (question as any).config?.caption
              if (!mediaUrl) return null
              return (
                <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-3 max-w-md shadow-md my-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl}
                    alt={caption || 'Lampiran Gambar Pertanyaan'}
                    className="w-full h-auto max-h-80 object-contain rounded-xl"
                    loading="lazy"
                    onError={(e) => {
                      // If relative local upload path fails on Vercel, try checking if base64 or alternative property exists
                      const target = e.currentTarget
                      const altUrl = (question as any).imageUrl || (question as any).image || (question as any).mediaUrl
                      if (altUrl && altUrl !== mediaUrl) {
                        target.src = altUrl
                      }
                    }}
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
              <QuestionInput
                question={question}
                value={answerValue}
                onChange={(val) => onAnswerChange?.(question.questionId, val)}
                isDisabled={disabled || readOnly}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
