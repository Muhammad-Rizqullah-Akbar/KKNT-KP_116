'use client'

import React from 'react'
import { Icon } from '@/components/ui/Icons'

export type BuilderStepId = 1 | 2 | 3 | 4

interface FormBuilderStepperProps {
  currentStep: BuilderStepId
  onStepClick: (step: BuilderStepId) => void
  completedSteps?: BuilderStepId[]
}

const STEPS = [
  { id: 1 as const, number: '01', title: 'Setup', description: 'Informasi & Mode Penilaian' },
  { id: 2 as const, number: '02', title: 'Build', description: 'Struktur Aspek & Pertanyaan' },
  { id: 3 as const, number: '03', title: 'Review', description: 'Pratinjau & Simulasi Hasil' },
  { id: 4 as const, number: '04', title: 'Publish', description: 'Ringkasan & Publikasi' },
]

export function FormBuilderStepper({ currentStep, onStepClick, completedSteps = [] }: FormBuilderStepperProps) {
  return (
    <div className="w-full bg-slate-900/90 border-b border-slate-800/90 backdrop-blur-md px-4 sm:px-6 py-3">
      <nav className="max-w-6xl mx-auto flex items-center justify-between" aria-label="Workflow Stepper">
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          {STEPS.map((step) => {
            const isActive = currentStep === step.id
            const isCompleted = completedSteps.includes(step.id) || step.id < currentStep

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick(step.id)}
                className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/10 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : isCompleted
                    ? 'bg-slate-850/60 border-emerald-500/30 hover:bg-slate-800/80 text-slate-300'
                    : 'bg-slate-950/40 border-slate-800 hover:bg-slate-850/60 text-slate-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isCompleted && !isActive ? <Icon name="check" className="w-4 h-4 text-emerald-400" /> : step.number}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold truncate ${
                        isActive ? 'text-cyan-300' : isCompleted ? 'text-slate-200' : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate hidden sm:block mt-0.5">{step.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
