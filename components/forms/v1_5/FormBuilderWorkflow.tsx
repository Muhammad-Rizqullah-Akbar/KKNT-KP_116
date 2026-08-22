'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { BuilderState } from '@/lib/forms/v1_5/builderState'
import {
  DEFAULT_ASPECTS,
  DEFAULT_SCORING_CONFIG,
  DEFAULT_VALIDATION_CONFIG,
  DEFAULT_THRESHOLDS,
  DEFAULT_RECOMMENDATIONS,
  DEFAULT_DISTRIBUTION,
} from '@/lib/forms/v1_5/builderState'
import type { CanonicalForm } from '@/lib/forms/v1_5/types'
import { validateCanonicalForm } from '@/lib/forms/v1_5/validation'

import { FormBuilderStepper, type BuilderStepId } from './FormBuilderStepper'
import { Step1Setup } from './steps/Step1Setup'
import { Step2Build } from './steps/Step2Build'
import { Step3Review } from './steps/Step3Review'
import { Step4Publish } from './steps/Step4Publish'
import { Icon } from '@/components/ui/Icons'

interface FormBuilderWorkflowProps {
  formId?: string
  activeVersionId?: string
  activeVersionNumber?: number
  initialState?: BuilderState
  onSaveDraftToServer?: (state: BuilderState) => Promise<void>
  onPublishVersion?: () => Promise<void>
  onOpenVersionHistory?: () => void
}

export function FormBuilderWorkflow({
  formId,
  activeVersionId,
  activeVersionNumber = 1,
  initialState,
  onSaveDraftToServer,
  onPublishVersion,
  onOpenVersionHistory,
}: FormBuilderWorkflowProps) {
  const router = useRouter()
  // Wizard Step State
  const [currentStep, setCurrentStep] = useState<BuilderStepId>(1)
  const [completedSteps, setCompletedSteps] = useState<BuilderStepId[]>([])

  // Master State
  const [state, setState] = useState<BuilderState>(
    initialState || {
      metadata: {
        title: 'Draft Formulir Kuesioner Baru',
        description: 'Tuliskan deskripsi dan petunjuk pengisian formulir di sini...',
        target: 'Umum & Sarana Pangan',
        category: 'Umum',
        kind: 'official',
        status: 'draft',
      },
      aspects: DEFAULT_ASPECTS,
      questions: [],
      scoring: DEFAULT_SCORING_CONFIG,
      validation: DEFAULT_VALIDATION_CONFIG,
      thresholds: DEFAULT_THRESHOLDS,
      recommendations: DEFAULT_RECOMMENDATIONS,
      distribution: DEFAULT_DISTRIBUTION,
    }
  )

  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  // Canonical Form Construction for Validation & Engine
  const canonicalForm: CanonicalForm = useMemo(() => {
    const currentFormId = formId || `form_${state.metadata.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'v1_5'}`
    const vId = activeVersionId || `${currentFormId}_v${activeVersionNumber}`

    return {
      form: {
        formId: currentFormId,
        metadata: state.metadata,
        activeVersionId: vId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      version: {
        versionId: vId,
        formId: currentFormId,
        versionNumber: activeVersionNumber,
        status: state.metadata.status,
        questions: state.questions,
        scoring: state.scoring,
        validation: state.validation,
        createdAt: new Date().toISOString(),
      },
    }
  }, [state, formId, activeVersionId, activeVersionNumber])

  // Step Navigation Helper
  const handleStepClick = (stepId: BuilderStepId) => {
    if (stepId > currentStep) {
      // Validate canonical form before advancing forward
      const issues = validateCanonicalForm(canonicalForm)
      if (issues.length > 0 && stepId >= 3) {
        showToast('error', `Terdapat ${issues.length} masalah yang harus diperbaiki sebelum ke langkah berikutnya.`)
      }
    }
    setCurrentStep(stepId)
  }

  const handleStepContinue = () => {
    setCompletedSteps((prev) => (prev.includes(currentStep) ? prev : [...prev, currentStep]))
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as BuilderStepId)
    }
  }

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as BuilderStepId)
    }
  }

  // Save Draft Action
  const handleSaveDraft = async () => {
    if (!onSaveDraftToServer) {
      setLastSaved(new Date().toLocaleTimeString())
      showToast('success', 'Draft tersimpan di memori lokal.')
      return
    }

    setIsSaving(true)
    try {
      await onSaveDraftToServer(state)
      setLastSaved(new Date().toLocaleTimeString())
      showToast('success', 'Draft formulir berhasil tersimpan ke Firebase!')
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan draft.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* PERSISTENT TOP HEADER & STEPPER */}
      <header className="sticky top-0 z-30 bg-slate-950 border-b border-slate-800">
        {/* Top Navbar */}
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4 border-b border-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Icon name="fileText" className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 max-w-xs sm:max-w-md truncate">
                  {state.metadata.title || 'Kuesioner Evaluasi V1.5'}
                </h1>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    state.metadata.status === 'published'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {state.metadata.status} (v{activeVersionNumber})
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {state.aspects.length} Aspek • {state.questions.length} Pertanyaan • Mode: {(state.scoring.outputMode || 'both').toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard/forms/v1-5-list')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <Icon name="arrowLeft" className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Daftar Form V1.5</span>
            </button>

            {onOpenVersionHistory && (
              <button
                type="button"
                onClick={onOpenVersionHistory}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <Icon name="history" className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Riwayat Versi</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              {isSaving ? <Icon name="spinner" className="w-3.5 h-3.5 animate-spin" /> : <Icon name="save" className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Draft'}</span>
            </button>
          </div>
        </div>

        {/* Persistent 4-Step Stepper Header */}
        <FormBuilderStepper currentStep={currentStep} onStepClick={handleStepClick} completedSteps={completedSteps} />
      </header>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl border text-xs font-bold shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : toast.type === 'error'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* MAIN STEP WORKSPACE CANVAS */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentStep === 1 && <Step1Setup state={state} onChange={setState} onContinue={handleStepContinue} />}
        {currentStep === 2 && <Step2Build state={state} onChange={setState} onContinue={handleStepContinue} onBack={handleStepBack} />}
        {currentStep === 3 && (
          <Step3Review
            state={state}
            canonicalForm={canonicalForm}
            onChangeState={setState}
            onNavigateToStep={(s) => setCurrentStep(s)}
            onContinue={handleStepContinue}
            onBack={handleStepBack}
          />
        )}
        {currentStep === 4 && (
          <Step4Publish
            state={state}
            activeVersionNumber={activeVersionNumber}
            onChangeState={setState}
            onPublishVersion={onPublishVersion}
            onNavigateToStep={(s) => setCurrentStep(s)}
            onBack={handleStepBack}
          />
        )}
      </main>
    </div>
  )
}
