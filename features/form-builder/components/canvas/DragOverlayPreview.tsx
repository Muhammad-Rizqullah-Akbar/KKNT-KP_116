'use client'

import type { FlexibleQuestion } from './../shared/ElementTypes'

interface DragOverlayPreviewProps {
  activeElement: FlexibleQuestion
  index: number
  answerTypeLabel: string
  stageName?: string
  targetStageName?: string
}

export function DragOverlayPreview({
  activeElement,
  index,
  answerTypeLabel,
  stageName,
  targetStageName,
}: DragOverlayPreviewProps) {
  return (
    <div className="p-4 rounded-xl border-2 border-cyan-500/50 bg-[#0e0e1a] shadow-2xl shadow-cyan-500/20 w-[300px] cursor-grabbing">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs font-medium text-white/20 w-6 flex-shrink-0">
          {index}.
        </span>
        <p className="text-sm text-white/80 truncate">{activeElement.question}</p>
      </div>
      <div className="text-xs text-white/30">
        {answerTypeLabel}
        {stageName && (
          <> • {stageName}</>
        )}
      </div>
      {targetStageName && (
        <div className="mt-2 text-[10px] text-cyan-400 font-medium text-center animate-pulse">
          → Pindah ke {targetStageName}
        </div>
      )}
    </div>
  )
}
