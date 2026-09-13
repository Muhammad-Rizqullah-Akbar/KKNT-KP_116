'use client'

import type { BuilderState } from '@/lib/domain/forms/builder-state'
import type { PublicCanonicalForm } from '@/lib/domain/forms/types'
import { Icon } from '@/components/ui/Icons'
import { PreviewQuestionCard } from '././step3-preview-question-card'
import type { SimulationPreset } from '././step3-simulation-preset-picker'

interface RespondentPreviewProps {
  state: BuilderState
  publicProjection: PublicCanonicalForm
  previewAspectIdx: number
  onPreviewAspectIdxChange: (idx: number) => void
  simulatedAnswers: Record<string, any>
  setCustomAnswers: React.Dispatch<React.SetStateAction<Record<string, any>>>
  setSimulationPreset: React.Dispatch<React.SetStateAction<SimulationPreset>>
}

export function RespondentPreview({
  state,
  publicProjection,
  previewAspectIdx,
  onPreviewAspectIdxChange,
  simulatedAnswers,
  setCustomAnswers,
  setSimulationPreset,
}: RespondentPreviewProps) {
  const currentAspect = state.aspects[previewAspectIdx] || state.aspects[0]
  const currentAspectQuestions = (publicProjection.version.questions || []).filter(
    (q: any) => (q.aspectId || state.aspects[0]?.aspectId) === currentAspect?.aspectId
  )

  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
      {/* Authentic Header */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-cyan-950/60 via-slate-950 to-purple-950/60 border border-cyan-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
            BPOM RI — KUESIONER EVALUASI RESMI
          </span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Pratinjau Responden Otentik
          </span>
        </div>
        <h3 className="text-lg font-extrabold text-slate-100">{publicProjection.form.metadata.title}</h3>
        <p className="text-xs text-slate-300 leading-relaxed">{publicProjection.form.metadata.description}</p>
      </div>

      {/* Authentic Aspect Progress Bar & Navigation Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Kemajuan Pengisian: Aspek {previewAspectIdx + 1} dari {state.aspects.length}</span>
          <span className="font-mono font-bold text-cyan-400">
            {Math.round(((previewAspectIdx + 1) / state.aspects.length) * 100)}%
          </span>
        </div>
        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-cyan-500 transition-all duration-300"
            style={{ width: `${((previewAspectIdx + 1) / state.aspects.length) * 100}%` }}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1">
          {state.aspects.map((asp, idx) => (
            <button
              key={asp.aspectId}
              type="button"
              onClick={() => onPreviewAspectIdxChange(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                previewAspectIdx === idx
                  ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {idx + 1}. {asp.title}
            </button>
          ))}
        </div>
      </div>

      {/* Current Aspect Header */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
        <h4 className="text-sm font-bold text-amber-300">
          Bagian {previewAspectIdx + 1}: {currentAspect?.title}
        </h4>
        {currentAspect?.description && (
          <p className="text-xs text-slate-400">{currentAspect.description}</p>
        )}
      </div>

      {/* Questions List inside Current Aspect */}
      <div className="space-y-6">
        {currentAspectQuestions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 italic border border-dashed border-slate-800 rounded-xl">
            Belum ada pertanyaan di bagian aspek ini.
          </div>
        ) : (
          currentAspectQuestions.map((q: any, idx: number) => (
            <PreviewQuestionCard
              key={q.questionId}
              question={q}
              index={idx}
              questions={state.questions}
              simulatedAnswers={simulatedAnswers}
              setCustomAnswers={setCustomAnswers}
              setSimulationPreset={setSimulationPreset}
            />
          ))
        )}
      </div>

      {/* Authentic Aspect Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          disabled={previewAspectIdx === 0}
          onClick={() => onPreviewAspectIdxChange(Math.max(0, previewAspectIdx - 1))}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <Icon name="arrowLeft" className="w-4 h-4" />
          <span>Aspek Sebelumnya</span>
        </button>

        <button
          type="button"
          disabled={previewAspectIdx >= state.aspects.length - 1}
          onClick={() => onPreviewAspectIdxChange(Math.min(state.aspects.length - 1, previewAspectIdx + 1))}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
        >
          <span>Lanjutkan Aspek Berikutnya</span>
          <Icon name="arrowRight" className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
