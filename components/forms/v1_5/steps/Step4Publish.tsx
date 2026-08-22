import React, { useState } from 'react'
import type { BuilderState } from '@/lib/forms/v1_5/builderState'
import { computeBalancedAspectWeights, updateScoring } from '@/lib/forms/v1_5/builderState'
import { Icon } from '@/components/ui/Icons'
import { calculateQuestionScore } from '@/lib/forms/v1_5/scoring/scoringEngine'

interface Step4PublishProps {
  state: BuilderState
  activeVersionNumber?: number
  onChangeState?: (state: BuilderState) => void
  onPublishVersion?: () => Promise<void>
  onNavigateToStep?: (step: 1 | 2 | 3 | 4) => void
  onBack: () => void
}

export function Step4Publish({
  state,
  activeVersionNumber = 1,
  onChangeState,
  onPublishVersion,
  onNavigateToStep,
  onBack,
}: Step4PublishProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPublishedSuccess, setIsPublishedSuccess] = useState(state.metadata.status === 'published')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const outputMode = state.scoring.outputMode || 'both'
  const totalMaxScore = state.questions.reduce((acc, q) => acc + (q.scoring?.weight ?? 5), 0)

  // 1. Structure Readiness Check
  const hasZeroQuestionAspects = state.aspects.some((asp) => {
    const count = state.questions.filter((q) => (q.aspectId || state.aspects[0]?.aspectId) === asp.aspectId).length
    return count === 0
  })
  const isStructureValid = state.aspects.length > 0 && state.questions.length > 0 && !hasZeroQuestionAspects

  // 2. Answer Keys Readiness Check
  const missingKeyQuestions = state.questions.filter((q) => {
    if (q.type === 'indicator-table' || q.type === 'likert') {
      const indicators = (q as any).presentation?.indicators || (q as any).config?.indicators || []
      return indicators.length === 0
    }
    const targetAspect = state.aspects.find((a) => a.aspectId === (q.aspectId || state.aspects[0]?.aspectId))
    const isNonScoring = targetAspect?.isScored === false || ['biodata-name', 'biodata-email', 'biodata-phone', 'biodata-address', 'biodata-institution', 'short-text', 'long-text', 'text', 'textarea', 'file-upload', 'image', 'signature', 'date'].includes(q.type)
    if (isNonScoring) return false
    return q.answerKey?.kind === 'none' || !(q.answerKey as any)?.correctOptionIds?.length
  })
  const isAnswerKeysValid = missingKeyQuestions.length === 0

  // 3. Scoring Config & Weight Distribution Readiness Check
  const scoredAspects = state.aspects.filter((a) => a.isScored !== false)
  const totalWeightPct = scoredAspects.reduce((sum, asp) => {
    return sum + (state.scoring.stagePointDistribution?.[asp.aspectId] ?? 0)
  }, 0)
  const isScoringConfigValid = outputMode === 'per_aspect' || scoredAspects.length === 0 ? true : Math.round(totalWeightPct) === 100

  // 4. Security & Metadata Projection Check
  const isSecurityProjectionValid = Boolean(state.metadata.title && state.metadata.title.trim().length > 0)

  // Overall Form Readiness Gatekeeper
  const isFormReadyForPublish = isStructureValid && isAnswerKeysValid && isScoringConfigValid && isSecurityProjectionValid

  const handlePublish = async () => {
    let currentState = state
    const currentScoredAspects = currentState.aspects.filter((a) => a.isScored !== false)
    const currentWeightSum = currentScoredAspects.reduce((sum, asp) => {
      return sum + (currentState.scoring.stagePointDistribution?.[asp.aspectId] ?? 0)
    }, 0)

    if (outputMode !== 'per_aspect' && currentScoredAspects.length > 0 && Math.round(currentWeightSum) !== 100) {
      const stageDist = computeBalancedAspectWeights(currentState.aspects)
      currentState = updateScoring(currentState, { stagePointDistribution: stageDist })
      onChangeState?.(currentState)
    }

    if (!isFormReadyForPublish && Math.round(currentWeightSum) !== 100) {
      // Recheck after auto balance
      const newScoredAspects = currentState.aspects.filter((a) => a.isScored !== false)
      const newWeightSum = newScoredAspects.reduce((sum, asp) => {
        return sum + (currentState.scoring.stagePointDistribution?.[asp.aspectId] ?? 0)
      }, 0)
      if (Math.round(newWeightSum) !== 100) {
        setErrorMsg('Formulir belum memenuhi kelayakan publikasi. Selesaikan kriteria pemeriksaan yang belum lengkap.')
        return
      }
    }

    if (!onPublishVersion) {
      setErrorMsg('Mode pratinjau lokal: Publikasi memerlukan integrasi server.')
      return
    }

    setIsPublishing(true)
    setErrorMsg(null)
    try {
      await onPublishVersion()
      setIsPublishedSuccess(true)
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mempublikasikan versi formulir.')
    } finally {
      setIsPublishing(false)
    }
  }

  // Calculate aspect max raw scores using authoritative calculateQuestionScore
  const aspectScoreBreakdowns = React.useMemo(() => {
    return state.aspects.map((asp) => {
      const aspQuestions = state.questions.filter(
        (q) => (q.aspectId || state.aspects[0]?.aspectId) === asp.aspectId
      )
      const isScored = asp.isScored !== false

      const maxScore = aspQuestions.reduce((sum, q) => {
        if (!isScored) return sum
        return sum + calculateQuestionScore(q, null).maximumScore
      }, 0)

      const weightPct = state.scoring.stagePointDistribution?.[asp.aspectId] ?? 0

      return {
        aspectId: asp.aspectId,
        title: asp.title,
        questionCount: aspQuestions.length,
        maxScore,
        weightPct,
        isScored,
      }
    })
  }, [state.aspects, state.questions, state.scoring])

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Icon name="checkCircle" className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">04 — Ringkasan & Publikasi Versi (Publish)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Finalisasi pembuatan formulir dan kunci snapshot versi sebelum mendistribusikan kuesioner.
            </p>
          </div>
        </div>
      </div>

      {/* SUMMARY CARD */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-6">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Icon name="fileText" className="w-4 h-4 text-emerald-400" />
            <span>Metadata & Distribusi Skor Assessment</span>
          </h3>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
            Versi {activeVersionNumber}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Judul Formulir</span>
            <p className="text-xs font-bold text-slate-100 truncate">{state.metadata.title}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Jumlah Aspek</span>
            <p className="text-xs font-bold text-amber-300">{state.aspects.length} Dimensi / Aspek</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Jumlah Pertanyaan</span>
            <p className="text-xs font-bold text-cyan-300">{state.questions.length} Pertanyaan</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Mode Hasil (Output)</span>
            <p className="text-xs font-bold text-purple-300 uppercase">
              {outputMode === 'per_aspect' ? '100% Per-Aspek' : outputMode}
            </p>
          </div>
        </div>

        {/* ASPECT WEIGHT DISTRIBUTION TABLE */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Icon name="sliders" className="w-4 h-4 text-amber-400" />
              <span>Struktur Penilaian Per-Aspek ({state.aspects.length} Aspek Form)</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-400">Total Potential Raw Score: {totalMaxScore} Poin</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {aspectScoreBreakdowns.map((asp, idx) => (
              <div
                key={asp.aspectId}
                className={`p-4 rounded-xl border space-y-2 ${
                  !asp.isScored
                    ? 'bg-purple-950/20 border-purple-500/30'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    ASPEK {String(idx + 1).padStart(2, '0')}
                  </span>
                  {!asp.isScored ? (
                    <span className="text-[11px] font-semibold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      Identitas / Biodata
                    </span>
                  ) : outputMode === 'per_aspect' ? (
                    <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      100% Independent
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {asp.weightPct}% Bobot
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-slate-100 truncate">{asp.title}</h4>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>{asp.questionCount} Pertanyaan</span>
                  {asp.isScored && (
                    <span className="font-bold text-amber-300">Max {asp.maxScore} Poin</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Authentic Diagnostic Readiness Checklist */}
        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Icon name="shieldCheck" className="w-4 h-4 text-cyan-400" />
              <span>Pemeriksaan Kelayakan Publikasi (Publish Gatekeeper)</span>
            </span>
            <span
              className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded border ${
                isFormReadyForPublish
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {isFormReadyForPublish ? '100% LULUS KELAYAKAN' : 'BELUM LAYAK PUBLIKASI'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* ITEM 1 */}
            <div
              className={`p-3 rounded-lg border flex items-center justify-between text-xs font-medium ${
                isStructureValid
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon name={isStructureValid ? 'checkCircle' : 'alertTriangle'} className="w-4 h-4 shrink-0" />
                <span className="truncate">Struktur Aspek & Soal ({state.questions.length} Soal)</span>
              </div>
              {!isStructureValid && onNavigateToStep && (
                <button
                  type="button"
                  onClick={() => onNavigateToStep(2)}
                  className="text-[10px] font-bold underline shrink-0 hover:text-white"
                >
                  + Soal →
                </button>
              )}
            </div>

            {/* ITEM 2 */}
            <div
              className={`p-3 rounded-lg border flex items-center justify-between text-xs font-medium ${
                isAnswerKeysValid
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon name={isAnswerKeysValid ? 'checkCircle' : 'alertTriangle'} className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {isAnswerKeysValid ? 'Kunci Jawaban Terkonfigurasi' : `${missingKeyQuestions.length} Soal Belum Ada Kunci`}
                </span>
              </div>
              {!isAnswerKeysValid && onNavigateToStep && (
                <button
                  type="button"
                  onClick={() => onNavigateToStep(3)}
                  className="text-[10px] font-bold underline shrink-0 hover:text-white"
                >
                  Atur Kunci →
                </button>
              )}
            </div>

            {/* ITEM 3 */}
            <div
              className={`p-3 rounded-lg border flex items-center justify-between text-xs font-medium ${
                isScoringConfigValid
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon name={isScoringConfigValid ? 'checkCircle' : 'alertTriangle'} className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {isScoringConfigValid
                    ? outputMode === 'per_aspect'
                      ? 'Skor Per-Aspek Independent'
                      : 'Bobot Aspect Total 100%'
                    : `Bobot Total ${totalWeightPct}% (Harus 100%)`}
                </span>
              </div>
              {!isScoringConfigValid && (
                <div className="flex items-center gap-2 shrink-0">
                  {onChangeState && (
                    <button
                      type="button"
                      onClick={() => {
                        const stageDist = computeBalancedAspectWeights(state.aspects)
                        onChangeState(updateScoring(state, { stagePointDistribution: stageDist }))
                      }}
                      className="text-[10px] font-bold px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shrink-0 transition-colors"
                      title="Klik untuk menyeimbangkan bobot aspek secara otomatis menjadi 100%"
                    >
                      ⚡ Seimbangkan (100%)
                    </button>
                  )}
                  {onNavigateToStep && (
                    <button
                      type="button"
                      onClick={() => onNavigateToStep(1)}
                      className="text-[10px] font-bold underline shrink-0 hover:text-white"
                    >
                      Atur Bobot →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ITEM 4 */}
            <div
              className={`p-3 rounded-lg border flex items-center justify-between text-xs font-medium ${
                isSecurityProjectionValid
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon name={isSecurityProjectionValid ? 'checkCircle' : 'alertTriangle'} className="w-4 h-4 shrink-0" />
                <span className="truncate">Proyeksi Keamanan Snapshot Valid</span>
              </div>
              {!isSecurityProjectionValid && onNavigateToStep && (
                <button
                  type="button"
                  onClick={() => onNavigateToStep(1)}
                  className="text-[10px] font-bold underline shrink-0 hover:text-white"
                >
                  Atur Judul →
                </button>
              )}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            ⚠ {errorMsg}
          </div>
        )}
      </div>

      {/* POST-PUBLISH SUCCESS HANDOFF CARD */}
      {isPublishedSuccess ? (
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
            <Icon name="checkCircle" className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-100">Formulir Versi Snapshot Berhasil Dipublikasikan!</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Snapshot versi formulir telah tersimpan secara imutabel. Anda sekarang dapat membuat kode distribusi atau QR link untuk responden.
            </p>
          </div>

          <a
            href="/dashboard/distributions"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Icon name="send" className="w-4 h-4" />
            <span>Lanjut ke Manajemen Distribusi Kode / QR</span>
          </a>
        </div>
      ) : (
        /* PUBLISH ACTION TRIGGER WITH GATED BUTTON */
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Icon name="arrowLeft" className="w-4 h-4" />
            <span>Kembali ke 03 Review</span>
          </button>

          <div className="w-full sm:w-auto flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={handlePublish}
              disabled={!isFormReadyForPublish || isPublishing}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                isFormReadyForPublish && !isPublishing
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              {isPublishing ? (
                <Icon name="spinner" className="w-4 h-4 animate-spin" />
              ) : (
                <Icon name="checkCircle" className="w-4 h-4" />
              )}
              <span>{isPublishing ? 'Mempublikasikan Versi...' : 'Publikasikan Versi & Lanjut ke Distribusi'}</span>
            </button>

            {!isFormReadyForPublish && (
              <span className="text-[10px] text-rose-400 font-medium">
                ⚠ Lengkapi kriteria pemeriksaan bertanda merah di atas sebelum mempublikasikan.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
