// question-editor/AnswerKeySummaryBar.tsx
// Summary metric cards for AnswerKeyInspector.

'use client'

import { Icon } from '@/components/ui/Icons'
import type { ScoringConfig } from '@/lib/domain/forms/types'

interface AnswerKeySummaryBarProps {
  totalQuestions: number
  configuredKeys: number
  totalWeight: number
  totalTableMaxPoints: number
  scoring: ScoringConfig
}

export function AnswerKeySummaryBar({
  totalQuestions,
  configuredKeys,
  totalWeight,
  totalTableMaxPoints,
  scoring,
}: AnswerKeySummaryBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
          <Icon name="fileQuestion" className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-slate-400 truncate">Total Pertanyaan</div>
          <div className="text-lg font-bold text-slate-100">{totalQuestions}</div>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
          <Icon name="checkCircle" className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-slate-400 truncate">Kunci Terkonfigurasi</div>
          <div className="text-lg font-bold text-emerald-400">
            {configuredKeys} <span className="text-xs font-normal text-slate-400">/ {totalQuestions}</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
          <Icon name="zap" className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-slate-400 truncate">Bobot Soal Biasa</div>
          <div className="text-lg font-bold text-amber-300">{totalWeight} pt</div>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
          <Icon name="layers" className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-slate-400 truncate">Max Tabel Indikator</div>
          <div className="text-lg font-bold text-blue-300">{totalTableMaxPoints} pt</div>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3 col-span-2 sm:col-span-1">
        <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
          <Icon name="sliders" className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-slate-400 truncate">Target Evaluasi</div>
          <div className="text-xs font-extrabold text-purple-300 truncate">
            {scoring?.outputMode === 'per_aspect' ? '100% Per-Aspek' : `${scoring?.totalPoints ?? 100} pt (Keseluruhan)`}
          </div>
        </div>
      </div>
    </div>
  )
}
