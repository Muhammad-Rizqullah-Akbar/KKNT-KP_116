'use client'

import { Icon } from '@/components/ui/Icons'
import type { FormStage } from './../shared/ElementTypes'

interface StageHeaderProps {
  stage: FormStage
  stageIndex: number
  questionCount: number
  isDragOver: boolean
  stageMode: 'single' | 'multi'
  totalStages: number
}

export function StageHeader({
  stage,
  stageIndex,
  questionCount,
  isDragOver,
  stageMode,
  totalStages,
}: StageHeaderProps) {
  return (
    <div
      className={`stage-header transition-all duration-200 ${
        isDragOver ? 'ring-2 ring-cyan-400/60 rounded-xl scale-[1.01]' : ''
      }`}
      data-stage-id={stage.id}
      id={`stage-header-${stage.id}`}
    >
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 ${
        isDragOver
          ? 'bg-cyan-500/15 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
          : 'bg-white/[0.03] border-white/[0.05]'
      } mb-3`}>
        <div className="flex items-center gap-2">
          <Icon name={isDragOver ? "arrowRight" : "list"} className={`w-4 h-4 transition-all ${isDragOver ? 'text-cyan-400 animate-pulse' : 'text-cyan-400'}`} />
          <span className={`text-sm font-medium transition-all ${isDragOver ? 'text-white' : 'text-white'}`}>
            {stage.name}
          </span>
          <span className="text-xs text-white/30">({questionCount} pertanyaan)</span>
        </div>
        {questionCount === 0 && (
          <span className={`text-xs ml-2 transition-all ${isDragOver ? 'text-cyan-400/80' : 'text-white/20'}`}>
            {isDragOver ? '⬇ Lepaskan di sini' : 'Kosong - seret pertanyaan ke sini'}
          </span>
        )}
        {isDragOver && (
          <span className="ml-auto text-xs text-cyan-400 font-medium animate-pulse">
            ⬇ Lepaskan
          </span>
        )}
        {stageMode === 'multi' && totalStages > 1 && !isDragOver && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-white/20">
              {stageIndex + 1} / {totalStages}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
