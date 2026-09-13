'use client'

import React, { useState, useMemo } from 'react'
import type { BuilderState } from '@/lib/domain/forms/builder-state'
import { updateQuestion } from '@/lib/domain/forms/builder-state'
import type { CanonicalForm } from '@/lib/domain/forms/types'
import { validateCanonicalForm, type FormValidationIssue } from '@/lib/domain/forms/validation'
import { calculateResponseScore } from '@/lib/domain/scoring/scoring-engine'
import { toPublicFormProjection } from '@/lib/domain/forms/legacy-adapter'
import { Icon } from '@/components/ui/Icons'
import { GradeThresholdConfigurator } from '../GradeThresholdConfigurator'
import { AnswerKeyInspector } from '../AnswerKeyInspector'
import { DiagnosticAuditorBanner } from './step3-diagnostic-banner'
import { SimulationPresetPicker, type SimulationPreset } from './step3-simulation-preset-picker'
import { RespondentIdentityCard, type RespondentIdentity } from './step3-respondent-identity-card'
import { OverallScoreCard } from './step3-overall-score-card'
import { AspectResultsPanel } from './step3-aspect-results-panel'
import { RespondentPreview } from './step3-respondent-preview'

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
  const [simulationPreset, setSimulationPreset] = useState<SimulationPreset>('all_correct')
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({})
  const [previewAspectIdx, setPreviewAspectIdx] = useState<number>(0)

  // Published articles cache for simulation preview cards
  const [publishedArticlesMap, setPublishedArticlesMap] = useState<Record<string, any>>({})

  React.useEffect(() => {
    async function loadArticles() {
      try {
        const res = await fetch('/api/articles/published')
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
  const respondentIdentity: RespondentIdentity = useMemo(() => {
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
      <DiagnosticAuditorBanner issues={validationIssues} onNavigateToStep={onNavigateToStep} />

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

          <SimulationPresetPicker outputMode={outputMode} value={simulationPreset} onChange={setSimulationPreset} />

          {simulatedResult && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
              {/* RESPONDENT BIODATA IDENTITY CARD */}
              <RespondentIdentityCard identity={respondentIdentity} />

              {isOverallVisible && (
                <OverallScoreCard
                  result={simulatedResult}
                  gradeArticleMap={state.recommendations.gradeArticleMap || {}}
                  publishedArticlesMap={publishedArticlesMap}
                />
              )}

              {isAspectVisible && (
                <AspectResultsPanel
                  aspectResults={simulatedResult.aspectResults}
                  aspects={state.aspects}
                  questions={state.questions}
                  isOverallVisible={isOverallVisible}
                  onNavigateToStep={onNavigateToStep}
                  onGoToAnswerKeys={() => setActiveTab('answer_keys')}
                />
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
        <RespondentPreview
          state={state}
          publicProjection={publicProjection}
          previewAspectIdx={previewAspectIdx}
          onPreviewAspectIdxChange={setPreviewAspectIdx}
          simulatedAnswers={simulatedAnswers}
          setCustomAnswers={setCustomAnswers}
          setSimulationPreset={setSimulationPreset}
        />
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
