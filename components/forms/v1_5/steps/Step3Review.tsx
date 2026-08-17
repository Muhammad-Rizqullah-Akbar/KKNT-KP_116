'use client'

import React, { useState, useMemo } from 'react'
import type { BuilderState, BuilderQuestion } from '@/lib/forms/v1_5/builderState'
import { updateQuestion } from '@/lib/forms/v1_5/builderState'
import type { CanonicalForm } from '@/lib/forms/v1_5/types'
import { validateCanonicalForm, type FormValidationIssue } from '@/lib/forms/v1_5/validation'
import { calculateResponseScore } from '@/lib/forms/v1_5/scoring/scoringEngine'
import { toPublicFormProjection } from '@/lib/forms/v1_5/legacyAdapter'
import { Icon } from '@/components/ui/Icons'
import { GradeThresholdConfigurator } from '../GradeThresholdConfigurator'
import { AnswerKeyInspector } from '../AnswerKeyInspector'

interface Step3ReviewProps {
  state: BuilderState
  canonicalForm: CanonicalForm
  onChangeState?: (nextState: BuilderState) => void
  onNavigateToStep: (step: 1 | 2 | 3 | 4) => void
  onContinue: () => void
  onBack: () => void
}

export function Step3Review({
  state,
  canonicalForm,
  onChangeState,
  onNavigateToStep,
  onContinue,
  onBack,
}: Step3ReviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'answer_keys' | 'simulator'>('preview')
  const [simulationPreset, setSimulationPreset] = useState<'all_correct' | 'average' | 'minimum' | 'custom'>('all_correct')
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({})
  const [previewAspectIdx, setPreviewAspectIdx] = useState<number>(0)

  // Published articles cache for simulation preview cards
  const [publishedArticlesMap, setPublishedArticlesMap] = useState<Record<string, any>>({})

  React.useEffect(() => {
    async function loadArticles() {
      try {
        const res = await fetch('/api/v1_5/articles/published')
        const data = await res.json()
        if (data.success && Array.isArray(data.articles)) {
          const map: Record<string, any> = {}
          data.articles.forEach((a: any) => {
            map[a.id] = a
          })
          setPublishedArticlesMap(map)
        }
      } catch (e) {
        // Fallback
      }
    }
    loadArticles()
  }, [])

  // Diagnostic Validation Audit
  const validationIssues: FormValidationIssue[] = useMemo(() => {
    return validateCanonicalForm(canonicalForm)
  }, [canonicalForm])

  // Build Simulated Answers Based on Preset with Realistic Biodata Baseline
  const simulatedAnswers = useMemo(() => {
    if (simulationPreset === 'custom') return customAnswers

    const answers: Record<string, any> = {}
    state.questions.forEach((q) => {
      const ak = q.answerKey as any
      const biodataKey = q.biodataKey

      // Specialized Biodata / Identity baseline sample placeholders
      if (biodataKey === 'respondent_name' || q.type === 'biodata-name') {
        answers[q.questionId] = 'Nama Responden (Contoh)'
        return
      }
      if (biodataKey === 'respondent_email' || q.type === 'biodata-email') {
        answers[q.questionId] = 'responden@example.com'
        return
      }
      if (biodataKey === 'respondent_phone' || q.type === 'biodata-phone') {
        answers[q.questionId] = '081200000000'
        return
      }
      if (biodataKey === 'respondent_address' || q.type === 'biodata-address') {
        answers[q.questionId] = 'Alamat Responden (Contoh)'
        return
      }
      if (biodataKey === 'respondent_institution' || q.type === 'biodata-institution') {
        answers[q.questionId] = 'Nama Instansi / Sarana (Contoh)'
        return
      }

      if (q.type === 'indicator-table' || q.type === 'likert') {
        const rawIndicators = (q as any).presentation?.indicators || (q as any).config?.indicators || []
        const indList = rawIndicators.length > 0 ? rawIndicators : [{ indicatorId: `${q.questionId}_ind_1` }]
        const scales = q.presentation?.indicatorScales?.length
          ? q.presentation.indicatorScales
          : [
              { value: 1, label: 'STS' },
              { value: 2, label: 'TS' },
              { value: 3, label: 'N' },
              { value: 4, label: 'S' },
              { value: 5, label: 'SS' },
            ]

        const maxScale = scales[scales.length - 1]
        const midScale = scales[Math.floor(scales.length / 2)]
        const minScale = scales[0]

        const indAns: Record<string, number> = {}
        indList.forEach((ind: any) => {
          const indId = ind.indicatorId || ind.id || ind
          indAns[indId] =
            simulationPreset === 'all_correct'
              ? maxScale
                ? maxScale.value
                : 5
              : simulationPreset === 'average'
              ? midScale
                ? midScale.value
                : 3
              : minScale
              ? minScale.value
              : 1
        })
        answers[q.questionId] = indAns
      } else if (simulationPreset === 'all_correct') {
        if (ak?.kind === 'option' && ak.correctOptionIds?.length > 0) {
          answers[q.questionId] = q.type === 'multiple-choice' ? ak.correctOptionIds : ak.correctOptionIds[0]
        } else if (q.options?.length > 0) {
          answers[q.questionId] = q.options[0].optionId
        }
      } else if (simulationPreset === 'minimum') {
        if (q.options?.length > 0) {
          const incorrect = q.options.find((o) => !(ak?.correctOptionIds || []).includes(o.optionId))
          answers[q.questionId] = incorrect ? incorrect.optionId : q.options[0].optionId
        }
      } else if (simulationPreset === 'average') {
        if (q.options?.length > 0) {
          answers[q.questionId] = q.options[Math.floor(q.options.length / 2)].optionId
        }
      }
    })
    return answers
  }, [state.questions, simulationPreset, customAnswers])

  // Execute Pure Authoritative Scoring Engine
  const simulatedResult = useMemo(() => {
    try {
      return calculateResponseScore(
        {
          aspects: state.aspects,
          questions: state.questions,
          scoring: state.scoring,
          thresholds: state.thresholds,
          recommendations: state.recommendations,
        },
        simulatedAnswers
      )
    } catch (err) {
      console.error('Simulation scoring error:', err)
      return null
    }
  }, [state, simulatedAnswers])

  // Public Security Projection
  const publicProjection = useMemo(() => {
    return toPublicFormProjection(canonicalForm)
  }, [canonicalForm])

  const outputMode = state.scoring.outputMode || 'both'
  const isOverallVisible = outputMode === 'overall' || outputMode === 'both'
  const isAspectVisible = outputMode === 'per_aspect' || outputMode === 'both'

  // Dynamic Respondent Identity Extraction from Biodata Answers
  const respondentIdentity = useMemo(() => {
    let name = ''
    let phone = ''
    let email = ''
    let institution = ''
    let address = ''

    state.questions.forEach((q) => {
      const key = q.biodataKey
      const ans = simulatedAnswers[q.questionId]
      if (key === 'respondent_name' || q.type === 'biodata-name') {
        name = typeof ans === 'string' && ans ? ans : name
      } else if (key === 'respondent_phone' || q.type === 'biodata-phone') {
        phone = (typeof ans === 'string' || typeof ans === 'number') && ans ? String(ans) : phone
      } else if (key === 'respondent_email' || q.type === 'biodata-email') {
        email = typeof ans === 'string' && ans ? ans : email
      } else if (key === 'respondent_institution' || q.type === 'biodata-institution') {
        institution = typeof ans === 'string' && ans ? ans : institution
      } else if (key === 'respondent_address' || q.type === 'biodata-address') {
        address = typeof ans === 'string' && ans ? ans : address
      }
    })

    return {
      name: name || 'Nama Lengkap Responden (Contoh)',
      phone: phone || '081200000000',
      email: email || 'responden@example.com',
      institution: institution || 'Nama Instansi / Sarana (Contoh)',
      address: address || 'Lokasi / Alamat (Contoh)',
    }
  }, [state.questions, simulatedAnswers])

  // Quick Answer Key Toggle Handler
  const handleToggleCorrectOption = (q: BuilderQuestion, optionId: string) => {
    if (!onChangeState) return
    const currentCorrect = q.answerKey.kind === 'option' ? q.answerKey.correctOptionIds : []
    const isSingle = q.type === 'single-choice' || q.type === 'binary' || q.type === 'dropdown'
    const nextCorrect = isSingle
      ? currentCorrect.includes(optionId)
        ? []
        : [optionId]
      : currentCorrect.includes(optionId)
      ? currentCorrect.filter((id) => id !== optionId)
      : [...currentCorrect, optionId]

    const updatedKey = nextCorrect.length > 0 ? { kind: 'option' as const, correctOptionIds: nextCorrect } : { kind: 'none' as const }
    onChangeState(updateQuestion(state, q.questionId, { answerKey: updatedKey }))
  }

  // Active Aspect & Questions for Respondent Preview Page Simulation
  const currentAspect = state.aspects[previewAspectIdx] || state.aspects[0]
  const currentAspectQuestions = (publicProjection.version.questions || []).filter(
    (q: any) => (q.aspectId || state.aspects[0]?.aspectId) === currentAspect?.aspectId
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Icon name="shieldCheck" className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">03 — Pratinjau & Simulasi Skor (Review)</h2>
            <p className="text-xs text-slate-400 mt-0.5">Uji coba simulasi perhitungan hasil, konfigurasi cepat kunci jawaban, dan tampilan responden.</p>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'preview'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon name="eye" className="w-4 h-4" />
            <span>Tampilan Responden</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('answer_keys')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'answer_keys'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon name="checkCircle" className="w-4 h-4" />
            <span>Kunci Jawaban Quick-Config</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'simulator'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon name="award" className="w-4 h-4" />
            <span>Simulasi Hasil</span>
          </button>
        </div>
      </div>

      {/* DIAGNOSTIC AUDITOR CHECKLIST BANNER */}
      <div
        className={`p-4 rounded-2xl border ${
          validationIssues.length === 0
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-amber-500/10 border-amber-500/30'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Icon
              name={validationIssues.length === 0 ? 'checkCircle' : 'alertTriangle'}
              className={`w-5 h-5 ${validationIssues.length === 0 ? 'text-emerald-400' : 'text-amber-400'}`}
            />
            <div>
              <h4 className="text-xs font-bold text-slate-100">
                {validationIssues.length === 0
                  ? 'Kuesioner Siap Dipublikasikan (0 Masalah Validasi)'
                  : `Terdapat ${validationIssues.length} Masalah Validasi Yang Perlu Diperbaiki`}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {validationIssues.length === 0
                  ? 'Struktur aspek, bobot total 100%, dan kunci jawaban telah memenuhi standar V1.5.'
                  : 'Klik masalah di bawah ini untuk berpindah langsung ke bagian yang bermasalah.'}
              </p>
            </div>
          </div>
        </div>

        {validationIssues.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
            {validationIssues.map((issue, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (issue.path.includes('stagePointDistribution')) onNavigateToStep(1)
                  else onNavigateToStep(2)
                }}
                className="w-full p-2 rounded-lg bg-slate-950/60 hover:bg-slate-950 border border-amber-500/20 text-left text-xs text-amber-300 flex items-center justify-between transition-colors"
              >
                <span>⚠ {issue.message}</span>
                <span className="text-[10px] font-bold underline text-cyan-400">Perbaiki Sekarang →</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VIEW 1: ASSESSMENT RESULT SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          {/* GRADE THRESHOLDS & RECOMMENDATION MAPPING CONFIGURATOR */}
          {onChangeState && (
            <GradeThresholdConfigurator
              thresholds={state.thresholds}
              recommendations={state.recommendations}
              onChangeThresholds={(nextThresholds) => onChangeState({ ...state, thresholds: nextThresholds })}
              onChangeRecommendations={(nextRecs) => onChangeState({ ...state, recommendations: nextRecs })}
            />
          )}

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Pilih Preset Jawaban Simulasi:</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                Mode Hasil: {outputMode.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'all_correct', label: 'Semua Benar (100%)' },
                { id: 'average', label: 'Rata-rata (50%)' },
                { id: 'minimum', label: 'Minimal (0%)' },
                { id: 'custom', label: 'Jawaban Kustom' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSimulationPreset(preset.id as any)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    simulationPreset === preset.id
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {simulatedResult && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
              {/* RESPONDENT BIODATA IDENTITY CARD */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Icon name="user" className="w-3.5 h-3.5 text-cyan-400" />
                    Identitas Responden (Pengisian Biodata)
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Status: Terisi & Valid
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 block">Nama Responden</span>
                    <span className="font-bold text-slate-100 block truncate">{respondentIdentity.name}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 block">Instansi / Sarana</span>
                    <span className="font-bold text-slate-100 block truncate">{respondentIdentity.institution}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 block">Lokasi / Alamat</span>
                    <span className="font-bold text-slate-100 block truncate">{respondentIdentity.address}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 block">Kontak / Telp</span>
                    <span className="font-bold text-slate-100 block truncate">{respondentIdentity.phone}</span>
                  </div>
                </div>
              </div>

              {isOverallVisible && (
                <div className="space-y-4">
                  <div className="p-6 rounded-xl bg-gradient-to-br from-slate-950 to-purple-950/40 border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
                    <div className="space-y-1.5 text-center md:text-left">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
                        SKOR AKHIR KESELURUHAN (OVERALL SCORE)
                      </span>
                      <h3 className="text-3xl font-extrabold text-slate-100">{simulatedResult.percentage}%</h3>
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold">
                          Tingkat: {simulatedResult.gradeResult.title} ({simulatedResult.gradeResult.grade})
                        </span>
                        <span className="text-xs text-slate-400">
                          ({simulatedResult.rawScore} / {simulatedResult.maximumScore} Poin Raw)
                        </span>
                      </div>
                    </div>

                    <div className="w-24 h-24 rounded-full border-4 border-purple-500/40 flex items-center justify-center bg-slate-950 shadow-inner shrink-0">
                      <span className="text-2xl font-black text-purple-300">{simulatedResult.percentage}%</span>
                    </div>
                  </div>

                  {/* DYNAMIC ARTICLE RECOMMENDATIONS CARD FOR CALCULATED GRADE */}
                  {(() => {
                    const grade = simulatedResult.gradeResult.grade
                    const mappedArticleIds = (state.recommendations.gradeArticleMap || {})[grade] || []
                    const recommendedArticles = mappedArticleIds
                      .map((id) => publishedArticlesMap[id])
                      .filter(Boolean)

                    return (
                      <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                            <Icon name="bookOpen" className="w-4 h-4 text-cyan-400" />
                            Rekomendasi Artikel Edukasi (Korelasi Grade {grade}):
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {recommendedArticles.length} Artikel Direkomendasikan
                          </span>
                        </div>

                        {recommendedArticles.length === 0 ? (
                          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 italic">
                            Belum ada artikel edukasi yang dipetakan untuk Grade {grade}. Anda dapat memilih artikel pada panel "Konfigurasi Grade Penilaian & Rekomendasi Artikel" di atas.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {recommendedArticles.map((art) => (
                              <div
                                key={art.id}
                                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 space-y-1.5 transition-all"
                              >
                                <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider block">
                                  {art.category}
                                </span>
                                <h5 className="text-xs font-bold text-slate-100 line-clamp-2">{art.title}</h5>
                                <a
                                  href={`/edukasi/${art.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-semibold text-cyan-400 hover:underline inline-block pt-1"
                                >
                                  Baca Artikel Edukasi →
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}

              {isAspectVisible && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Icon name="layers" className="w-4 h-4 text-cyan-400" />
                    <span>Rincian Hasil Per-Aspek Penilaian</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {simulatedResult.aspectResults.map((aspRes) => {
                      const targetAsp = state.aspects.find((a) => a.aspectId === aspRes.aspectId)
                      const isScored = targetAsp?.isScored !== false

                      if (!isScored) {
                        return (
                          <div key={aspRes.aspectId} className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-purple-300 truncate">{aspRes.title}</span>
                              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                Terisi & Valid
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">Aspek Identitas / Biodata Responden (Tanpa Skor Penilaian).</p>
                          </div>
                        )
                      }

                      // Diagnostic check for questions in this aspect
                      const aspQuestions = state.questions.filter((q) => (q.aspectId || state.aspects[0]?.aspectId) === aspRes.aspectId)
                      const hasZeroQuestions = aspQuestions.length === 0
                      const missingKeyQuestions = aspQuestions.filter((q) => {
                        if (q.type === 'indicator-table' || q.type === 'likert') {
                          const indicators = (q as any).presentation?.indicators || (q as any).config?.indicators || []
                          return indicators.length === 0
                        }
                        const isNonScoring = ['biodata-name', 'biodata-email', 'biodata-phone', 'biodata-address', 'biodata-institution', 'short-text', 'long-text', 'text', 'textarea', 'file-upload', 'image', 'signature', 'date'].includes(q.type)
                        if (isNonScoring) return false
                        return q.answerKey?.kind === 'none' || !(q.answerKey as any)?.correctOptionIds?.length
                      })

                      return (
                        <div
                          key={aspRes.aspectId}
                          className={`p-4 rounded-xl space-y-3 shadow-sm border transition-all ${
                            hasZeroQuestions
                              ? 'bg-rose-950/20 border-rose-500/50'
                              : missingKeyQuestions.length > 0
                              ? 'bg-slate-950 border-amber-500/40'
                              : 'bg-slate-950 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-100 truncate">{aspRes.title}</span>
                            {hasZeroQuestions ? (
                              <span className="text-[11px] font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40 shrink-0">
                                Belum Ada Soal
                              </span>
                            ) : missingKeyQuestions.length > 0 ? (
                              <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 shrink-0">
                                {aspRes.percentage}% (Belum Lengkap)
                              </span>
                            ) : (
                              <span className="text-sm font-black text-cyan-400 shrink-0">{aspRes.percentage}%</span>
                            )}
                          </div>

                          {/* Progress Bar */}
                          {!hasZeroQuestions && (
                            <div className="w-full h-2 rounded-full bg-slate-850 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 rounded-full ${
                                  missingKeyQuestions.length > 0 ? 'bg-amber-500' : 'bg-cyan-500'
                                }`}
                                style={{ width: `${aspRes.percentage}%` }}
                              />
                            </div>
                          )}

                          {/* DIAGNOSTIC NOTICE: 0 QUESTIONS */}
                          {hasZeroQuestions && (
                            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5 font-medium">
                                <Icon name="alertTriangle" className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                Belum ada soal pada dimensi ini (Skor 0%)
                              </span>
                              <button
                                type="button"
                                onClick={() => onNavigateToStep(2)}
                                className="font-bold underline text-rose-300 hover:text-rose-100 shrink-0"
                              >
                                + Tambah Soal
                              </button>
                            </div>
                          )}

                          {/* DIAGNOSTIC NOTICE: MISSING ANSWER KEYS */}
                          {!hasZeroQuestions && missingKeyQuestions.length > 0 && (
                            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] space-y-1">
                              <div className="flex items-center justify-between font-bold gap-2">
                                <span className="flex items-center gap-1.5">
                                  <Icon name="alertTriangle" className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  {missingKeyQuestions.length} Soal Belum Ada Kunci Jawaban
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('answer_keys')}
                                  className="underline text-amber-300 hover:text-amber-100 shrink-0"
                                >
                                  Atur Kunci Jawaban →
                                </button>
                              </div>
                              <p className="text-[10px] text-amber-300/80 leading-tight">
                                Soal tanpa kunci jawaban belum bisa dikalkulasikan nilainya secara penuh.
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                            <span>Raw: {aspRes.rawScore} / {aspRes.maximumScore} Poin</span>
                            {isOverallVisible && <span>Bobot Total: {aspRes.weightPercentage}%</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: QUICK ANSWER KEY RECONFIGURATION FOR ALL QUESTION TYPES */}
      {activeTab === 'answer_keys' && (
        <AnswerKeyInspector
          questions={state.questions}
          aspects={state.aspects}
          scoring={state.scoring}
          onUpdateScoring={(nextScoring) => {
            if (onChangeState) {
              onChangeState({ ...state, scoring: { ...state.scoring, ...nextScoring } })
            }
          }}
          onUpdateQuestion={(questionId, update) => {
            if (onChangeState) {
              onChangeState(updateQuestion(state, questionId, update))
            }
          }}
          onSelectQuestion={() => onNavigateToStep(2)}
        />
      )}

      {/* VIEW 3: AUTHENTIC RESPONDENT FORM PREVIEW WITH ASPECT NAVIGATION & TABLE GRID */}
      {activeTab === 'preview' && (
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
                  onClick={() => setPreviewAspectIdx(idx)}
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
              currentAspectQuestions.map((q: any, idx: number) => {
                const isTable = q.type === 'indicator-table' || q.type === 'likert'
                const rawIndicators = q.presentation?.indicators || q.config?.indicators || []
                const indicators = rawIndicators.length > 0 ? rawIndicators : [{ indicatorId: 'ind_1', label: 'Indikator 1' }]
                const scales = q.presentation?.indicatorScales || [
                  { value: 1, label: 'STS' },
                  { value: 2, label: 'TS' },
                  { value: 3, label: 'N' },
                  { value: 4, label: 'S' },
                  { value: 5, label: 'SS' },
                ]

                return (
                  <div key={q.questionId} className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 shadow-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-cyan-400 font-mono">P{idx + 1}.</span>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-100">
                          {q.prompt} {q.required && <span className="text-rose-400">*</span>}
                        </h4>
                        {q.presentation?.description && (
                          <p className="text-[11px] text-slate-400">{q.presentation.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Image Attachment */}
                    {q.presentation?.media?.url && (
                      <div className="pl-5">
                        <img
                          src={q.presentation.media.url}
                          alt={q.presentation.media.caption || 'Lampiran'}
                          className="max-h-48 object-cover rounded-lg border border-slate-800"
                        />
                      </div>
                    )}

                    {/* INDICATOR TABLE / LIKERT GRID RENDERING */}
                    {isTable ? (
                      <div className="space-y-4 pt-2">
                        {/* DESKTOP & TABLET HORIZONTAL GRID (md and above) */}
                        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-900 text-slate-300">
                                <th className="p-3 border border-slate-800 font-bold">Indikator Penilaian</th>
                                {scales.map((scale: any) => (
                                  <th key={scale.value} className="p-3 border border-slate-800 text-center font-bold">
                                    {scale.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {indicators.map((ind: any, iIdx: number) => {
                                return (
                                  <tr key={ind.indicatorId || iIdx} className="hover:bg-slate-900/50">
                                    <td className="p-3 border border-slate-800 font-medium text-slate-200">
                                      {ind.label || ind.title || `Indikator ${iIdx + 1}`}
                                    </td>
                                    {scales.map((scale: any) => {
                                      const indId = ind.indicatorId || `ind_${iIdx}`
                                      const isSelected = (simulatedAnswers[q.questionId] || {})[indId] === scale.value

                                      return (
                                        <td key={scale.value} className="p-3 border border-slate-800 text-center">
                                          <input
                                            type="radio"
                                            name={`table-${q.questionId}-${indId}`}
                                            value={scale.value}
                                            checked={isSelected}
                                            onChange={() => {
                                              const currentTableAns = simulatedAnswers[q.questionId] || {}
                                              setCustomAnswers((prev) => ({
                                                ...prev,
                                                [q.questionId]: { ...currentTableAns, [indId]: scale.value },
                                              }))
                                            }}
                                            className="w-4 h-4 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                                          />
                                        </td>
                                      )
                                    })}
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* MOBILE VERTICAL CARD LAYOUT (< md) */}
                        <div className="block md:hidden space-y-3">
                          {indicators.map((ind: any, iIdx: number) => {
                            const indId = ind.indicatorId || `ind_${iIdx}`
                            const currentTableAns = simulatedAnswers[q.questionId] || {}

                            return (
                              <div key={indId} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                                <div className="text-xs font-bold text-slate-200">
                                  {iIdx + 1}. {ind.label || ind.title || `Indikator ${iIdx + 1}`}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                                  {scales.map((scale: any) => {
                                    const isSelected = currentTableAns[indId] === scale.value

                                    return (
                                      <button
                                        key={scale.value}
                                        type="button"
                                        onClick={() => {
                                          setCustomAnswers((prev) => ({
                                            ...prev,
                                            [q.questionId]: { ...currentTableAns, [indId]: scale.value },
                                          }))
                                        }}
                                        className={`p-2.5 rounded-lg border text-center text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                                          isSelected
                                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                                        }`}
                                      >
                                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-cyan-400' : 'bg-slate-700'}`} />
                                        <span className="truncate">{scale.label}</span>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : ['single-choice', 'multiple-choice', 'dropdown', 'binary'].includes(q.type) ? (
                      /* SINGLE / MULTIPLE CHOICE OPTIONS */
                      <div className="pl-5 space-y-2 pt-1">
                        {q.type === 'multiple-choice' && (
                          <div className="text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-lg mb-2 inline-block">
                            Pilih tepat {(state.questions.find(sq => sq.questionId === q.questionId)?.answerKey as any)?.correctOptionIds?.length || 1} opsi jawaban.
                          </div>
                        )}
                        {(q.options || []).map((opt: any) => {
                          const isMultiple = q.type === 'multiple-choice'
                          const currentVal = simulatedAnswers[q.questionId]
                          const isChecked = isMultiple
                            ? Array.isArray(currentVal) && currentVal.includes(opt.optionId)
                            : currentVal === opt.optionId

                          return (
                            <label
                              key={opt.optionId}
                              onClick={() => {
                                setSimulationPreset('custom')
                                if (isMultiple) {
                                  const currentArr: string[] = Array.isArray(currentVal) ? currentVal : []
                                  const nextArr = currentArr.includes(opt.optionId)
                                    ? currentArr.filter((id) => id !== opt.optionId)
                                    : [...currentArr, opt.optionId]
                                  setCustomAnswers((prev) => ({ ...prev, [q.questionId]: nextArr }))
                                } else {
                                  setCustomAnswers((prev) => ({ ...prev, [q.questionId]: opt.optionId }))
                                }
                              }}
                              className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50 font-semibold shadow-sm'
                                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <input
                                type={isMultiple ? 'checkbox' : 'radio'}
                                name={`preview-${q.questionId}`}
                                checked={isChecked}
                                onChange={() => {}} // Handled in label onClick
                                className="w-4 h-4 text-cyan-500 focus:ring-cyan-400 rounded cursor-pointer"
                              />
                              <span className="text-xs">{opt.label}</span>
                            </label>
                          )
                        })}
                      </div>
                    ) : q.type === 'biodata-address' || q.type === 'textarea' ? (
                      <div className="pl-5 pt-1">
                        <textarea
                          rows={2}
                          value={simulatedAnswers[q.questionId] || ''}
                          onChange={(e) => {
                            setSimulationPreset('custom')
                            setCustomAnswers((prev) => ({ ...prev, [q.questionId]: e.target.value }))
                          }}
                          placeholder={q.presentation?.placeholder || 'Tuliskan alamat lengkap...'}
                          className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    ) : (
                      <div className="pl-5 pt-1">
                        <input
                          type={q.type === 'biodata-phone' || q.type === 'number' ? 'number' : q.type === 'biodata-email' ? 'email' : 'text'}
                          value={simulatedAnswers[q.questionId] || ''}
                          onChange={(e) => {
                            setSimulationPreset('custom')
                            setCustomAnswers((prev) => ({ ...prev, [q.questionId]: e.target.value }))
                          }}
                          placeholder={q.presentation?.placeholder || 'Isikan jawaban responden di sini...'}
                          className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Authentic Aspect Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={previewAspectIdx === 0}
              onClick={() => setPreviewAspectIdx((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Icon name="arrowLeft" className="w-4 h-4" />
              <span>Aspek Sebelumnya</span>
            </button>

            <button
              type="button"
              disabled={previewAspectIdx >= state.aspects.length - 1}
              onClick={() => setPreviewAspectIdx((prev) => Math.min(state.aspects.length - 1, prev + 1))}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <span>Lanjutkan Aspek Berikutnya</span>
              <Icon name="arrowRight" className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation Footer Action */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-all"
        >
          <Icon name="arrowLeft" className="w-4 h-4" />
          <span>Kembali ke 02 Build</span>
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
        >
          <span>Lanjutkan ke 04 Publish</span>
          <Icon name="arrowRight" className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
