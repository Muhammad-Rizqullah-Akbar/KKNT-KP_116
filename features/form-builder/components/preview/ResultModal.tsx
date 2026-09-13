'use client'

import { Icon } from '@/components/ui/Icons'
import { FormStage } from './../shared/ElementTypes'
import { ScoringResult } from '@/lib/domain/scoring/preview-engine'

// ============================================================================
// RESULT MODAL COMPONENT (UPDATED)
// ============================================================================

export function ResultModal({ 
  result, 
  onClose, 
  onReset,
  onClosePreview,
  stages = [],
}: { 
  result: ScoringResult
  onClose: () => void
  onReset: () => void
  onClosePreview: () => void
  stages?: FormStage[]
}) {
  const { totalScore, maxScore, percentage, grade, perStage, details, recommendations } = result

  // Filter hanya stage yang dinilai (includeInScoring = true)
  const scoredStageIds = stages.filter(s => s.includeInScoring !== false).map(s => s.id)
  const scoredStagesData = Object.entries(perStage)
    .filter(([stageId]) => scoredStageIds.includes(stageId))
    .sort((a, b) => {
      const stageA = stages.find(s => s.id === a[0])
      const stageB = stages.find(s => s.id === b[0])
      return (stageA?.order || 0) - (stageB?.order || 0)
    })

  // Hitung total unscored questions
  const unscoredCount = details.totalQuestions - (details.scoredQuestions || 0)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">📊 Hasil Penilaian (Preview)</h3>
            <p className="text-xs text-white/30">Simulasi penilaian berdasarkan jawaban yang Anda pilih</p>
          </div>
          <button onClick={() => { onClose(); onClosePreview(); }} className="w-8 h-8 rounded-lg hover:bg-white/[0.05] transition-colors">
            <Icon name="x" className="w-5 h-5 text-white/50" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Score Circle */}
          <div className="flex justify-center">
            <div className="relative w-36 h-36">
              <svg className="w-36 h-36 -rotate-90">
                <circle cx="72" cy="72" r="64" fill="none" stroke="white/5" strokeWidth="6" />
                <circle cx="72" cy="72" r="64" fill="none" 
                  stroke={percentage >= 70 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444'} 
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${(percentage / 100) * 402.123} 402.123`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold font-display">{percentage}%</span>
                <span className="text-[10px] text-white/40">{totalScore} / {maxScore} poin</span>
              </div>
            </div>
          </div>

          {/* Grade */}
          <div className="text-center">
            <div className={`inline-block px-5 py-1.5 rounded-full text-sm font-semibold ${
              percentage >= 90 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              percentage >= 80 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              percentage >= 70 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
              percentage >= 60 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {grade}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
              <p className="text-xl font-bold text-emerald-400">{details.correctCount}</p>
              <p className="text-[10px] text-white/30 uppercase">Benar</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
              <p className="text-xl font-bold text-rose-400">{details.wrongCount}</p>
              <p className="text-[10px] text-white/30 uppercase">Salah</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
              <p className="text-xl font-bold text-amber-400">{details.skippedCount}</p>
              <p className="text-[10px] text-white/30 uppercase">Dilewati</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
              <p className="text-xl font-bold text-cyan-400">{details.scoredQuestions || details.totalQuestions}</p>
              <p className="text-[10px] text-white/30 uppercase">Dinilai</p>
            </div>
          </div>

          {/* Per Stage - HANYA YANG SCORED */}
          {scoredStagesData.length > 0 && (
            <div>
              <h4 className="text-xs text-white/40 uppercase tracking-wider mb-2">📂 Per Tahapan (Dinilai)</h4>
              <div className="space-y-1.5">
                {scoredStagesData.map(([stageId, data]) => {
                  const stage = stages.find(s => s.id === stageId)
                  const isScored = stage?.includeInScoring !== false
                  
                  return (
                    <div key={stageId} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-xs text-white/60 flex-1">
                        {data.name}
                        {!isScored && (
                          <span className="ml-2 text-[10px] text-amber-400/50">(tidak dinilai)</span>
                        )}
                      </span>
                      <span className="text-[10px] text-white/30">{data.earned} / {data.possible}</span>
                      <div className="w-20 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          data.percentage >= 70 ? 'bg-emerald-400' :
                          data.percentage >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                        }`} style={{ width: `${data.percentage}%` }} />
                      </div>
                      <span className={`text-[10px] font-medium min-w-[32px] text-right ${
                        data.percentage >= 70 ? 'text-emerald-400' :
                        data.percentage >= 50 ? 'text-amber-400' : 'text-rose-400'
                      }`}>{data.percentage}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Total Questions - Include unscored info */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Total Pertanyaan</span>
              <span className="text-sm text-white/80">{details.totalQuestions}</span>
            </div>
            {unscoredCount > 0 && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-amber-400/50">Tidak dinilai</span>
                <span className="text-xs text-amber-400/50">{unscoredCount} pertanyaan</span>
              </div>
            )}
            {details.scoredQuestions !== undefined && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-emerald-400/50">Dinilai</span>
                <span className="text-xs text-emerald-400/50">{details.scoredQuestions} pertanyaan</span>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
              <h4 className="text-xs font-medium text-cyan-400 mb-2">💡 Rekomendasi</h4>
              <ul className="space-y-1">
                {recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-white/50 flex items-start gap-2">
                    <span className="text-cyan-400">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06] shrink-0">
          <button onClick={onReset} className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.03] transition-all">
            Isi Ulang
          </button>
          <button onClick={() => { onClose(); onClosePreview(); }} className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25">
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
