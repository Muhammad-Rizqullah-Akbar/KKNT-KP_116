'use client'

import React, { useState, useMemo } from 'react'
import type { CanonicalForm } from '@/lib/forms/v1_5/types'
import { toPublicFormProjection } from '@/lib/forms/v1_5/legacyAdapter'
import { FormPublicRenderer } from './FormPublicRenderer'
import { Icon } from '@/components/ui/Icons'

interface FormPreviewModalProps {
  isOpen: boolean
  canonicalForm: CanonicalForm
  onClose: () => void
}

export function FormPreviewModal({ isOpen, canonicalForm, onClose }: FormPreviewModalProps) {
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Public projection guarantees answer keys and scoring rules are completely removed
  const publicForm = useMemo(() => {
    return toPublicFormProjection(canonicalForm)
  }, [canonicalForm])

  if (!isOpen) return null

  const handleAnswerChange = (questionId: string, value: any) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
  }

  const handleScrollToQuestion = (qId: string) => {
    const el = document.getElementById(`preview-q-${qId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 px-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm">
              <Icon name="eye" className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-slate-100">{publicForm.form.metadata.title || 'Formulir Tanpa Judul'}</h3>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  PUBLIC PREVIEW MODE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Tampilan publik responden (Kunci Jawaban & Bobot Skor Tersembunyi Aman)</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-white rounded-2xl bg-slate-800/80 hover:bg-slate-700 transition-colors border border-slate-700/80"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        {/* Public Preview Sticky Navigator Strip */}
        <div className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800/90 px-6 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2 flex-shrink-0 flex items-center gap-1.5">
            <Icon name="listOrdered" className="w-3.5 h-3.5 text-cyan-400" />
            Navigasi Soal:
          </span>
          <div className="flex items-center gap-2">
            {publicForm.version.questions.map((q, idx) => {
              const isAnswered = userAnswers[q.questionId] !== undefined && userAnswers[q.questionId] !== ''
              return (
                <button
                  key={q.questionId}
                  type="button"
                  onClick={() => handleScrollToQuestion(q.questionId)}
                  className={`flex-shrink-0 min-w-[32px] h-8 px-2.5 rounded-xl border text-xs font-mono font-semibold transition-all ${
                    isAnswered
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:border-slate-600'
                  }`}
                >
                  {String(idx + 1).padStart(2, '0')}
                </button>
              )
            })}
          </div>
        </div>

        {/* Form Body - Scrollable with Generous Spacing & Padding */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 no-scrollbar">
          {publicForm.form.metadata.description && (
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-sm text-slate-300 leading-relaxed shadow-sm">
              {publicForm.form.metadata.description}
            </div>
          )}

          {isSubmitted ? (
            <div className="p-10 text-center space-y-4 bg-emerald-950/20 border border-emerald-500/30 rounded-3xl animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shadow-lg">
                <Icon name="checkCircle" className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-emerald-300">Simulasi Pengiriman Berhasil!</h4>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Tanggapan Anda telah disimulasikan secara publik. Pada aplikasi nyata, data ini akan diproses oleh layanan scoring backend tepercaya.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false)
                  setUserAnswers({})
                }}
                className="mt-3 px-5 py-2.5 text-xs font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all"
              >
                Coba Isi Lagi
              </button>
            </div>
          ) : (
            <form onSubmit={handleSimulateSubmit} className="space-y-8">
              <FormPublicRenderer
                questions={publicForm.version.questions}
                answers={userAnswers}
                onAnswerChange={handleAnswerChange}
              />

              <div className="pt-6 border-t border-slate-800 flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  Tutup Pratinjau
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-xl shadow-cyan-500/20 transition-all"
                >
                  <Icon name="send" className="w-4 h-4" />
                  <span>Simulasi Kirim Jawaban</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
