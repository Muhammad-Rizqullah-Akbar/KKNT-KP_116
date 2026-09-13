'use client'

import { Icon } from '@/components/ui/Icons'
import { 
  FormStage, 
  FormScoring,
  FlexibleQuestion,
  ANSWER_TYPES,
  getScoredStages,
  getUnscoredStages,
  getQuestionsByStage,
  calculateStageWeights,
  validateDistribution,
} from './../shared/ElementTypes'

interface ScoringTabProps {
  scoring: FormScoring
  stages: FormStage[]
  elements: FlexibleQuestion[]
  onTotalPointsChange: (value: number) => void
  onScoringModeChange: (mode: FormScoring['mode']) => void
  onAllowScoringOverrideToggle: () => void
  onDistributionChange: (stageId: string, points: number) => void
  onQuestionWeightChange: (questionId: string, weight: number) => void
  onStageScoringToggle: (stageId: string, include: boolean) => void
  onAutoBalance: () => void
}

export function ScoringTab({
  scoring,
  stages,
  elements,
  onTotalPointsChange,
  onScoringModeChange,
  onAllowScoringOverrideToggle,
  onDistributionChange,
  onQuestionWeightChange,
  onStageScoringToggle,
  onAutoBalance,
}: ScoringTabProps) {
  const scoredStages = getScoredStages(stages)
  const unscoredStages = getUnscoredStages(stages)
  const totalDistributed = Object.values(scoring.distribution).reduce((sum, val) => sum + val, 0)
  const { valid: isBalanced } = validateDistribution(scoring.distribution, scoring.totalPoints)
  const stageWeights = calculateStageWeights(elements, stages)
  
  // Check if any scored stage has zero weight
  const hasZeroWeightStage = scoredStages.some(stage => 
    (stageWeights[stage.id] || 0) === 0 && 
    getQuestionsByStage(elements, stage.id).length > 0
  )

  return (
    <div className="space-y-4">
      {/* Total Points */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
        <h4 className="text-sm font-medium text-white mb-3">Total Nilai</h4>
        <div className="flex items-center gap-4 flex-wrap">
          <input
            type="number"
            value={scoring.totalPoints}
            onChange={(e) => onTotalPointsChange(Number(e.target.value))}
            min={1}
            className="w-32 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white focus:outline-none focus:border-cyan-400/40 transition-all"
          />
          <span className="text-sm text-white/40">poin</span>
          <button
            onClick={onAutoBalance}
            className="px-4 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-all flex items-center gap-2"
          >
            <Icon name="refreshCw" className="w-4 h-4" />
            Auto-Balance
          </button>
        </div>
        <p className="text-xs text-white/30 mt-2">
          Klik Auto-Balance untuk distribusi nilai secara proporsional berdasarkan bobot
        </p>
      </div>

      {/* Scoring Mode */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
        <h4 className="text-sm font-medium text-white mb-3">Mode Penilaian</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] cursor-pointer hover:bg-white/[0.04] transition-all">
            <input
              type="radio"
              name="scoringMode"
              value="auto"
              checked={scoring.mode === 'auto'}
              onChange={() => onScoringModeChange('auto')}
              className="w-4 h-4 text-cyan-500"
            />
            <div>
              <p className="text-sm text-white/80">Auto-Scoring</p>
              <p className="text-xs text-white/30">Nilai terdistribusi otomatis proporsional berdasarkan bobot</p>
            </div>
          </label>
          
          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] cursor-pointer hover:bg-white/[0.04] transition-all">
            <input
              type="radio"
              name="scoringMode"
              value="hybrid"
              checked={scoring.mode === 'hybrid'}
              onChange={() => onScoringModeChange('hybrid')}
              className="w-4 h-4 text-cyan-500"
            />
            <div>
              <p className="text-sm text-white/80">Hybrid</p>
              <p className="text-xs text-white/30">Auto + Manual override per pertanyaan</p>
            </div>
          </label>
          
          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] cursor-pointer hover:bg-white/[0.04] transition-all">
            <input
              type="radio"
              name="scoringMode"
              value="manual"
              checked={scoring.mode === 'manual'}
              onChange={() => onScoringModeChange('manual')}
              className="w-4 h-4 text-cyan-500"
            />
            <div>
              <p className="text-sm text-white/80">Manual</p>
              <p className="text-xs text-white/30">Atur nilai per pertanyaan secara manual</p>
            </div>
          </label>
        </div>
      </div>

      {/* ===== NEW: Distribution with Scoring Toggle ===== */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
        <h4 className="text-sm font-medium text-white mb-3">Distribusi Nilai per Tahapan</h4>
        
        <div className="space-y-4">
          {stages.map((stage) => {
            const isScored = stage.includeInScoring !== false
            const points = isScored ? (scoring.distribution[stage.id] || 0) : 0
            const percentage = scoring.totalPoints > 0 
              ? Math.round((points / scoring.totalPoints) * 100) 
              : 0
            const stageQuestionCount = getQuestionsByStage(elements, stage.id).length
            const stageWeight = stageWeights[stage.id] || 0
            const hasWeight = stageWeight > 0
            
            return (
              <div key={stage.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                {/* Header: Stage Name + Toggle */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white/80">{stage.name}</span>
                    <span className="text-xs text-white/30">
                      ({stageQuestionCount} pertanyaan)
                    </span>
                    {!isScored && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium">
                        Tidak Dinilai
                      </span>
                    )}
                    {isScored && !hasWeight && stageQuestionCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-medium">
                        ⚠️ Bobot 0
                      </span>
                    )}
                  </div>
                  
                  {/* Toggle Include in Scoring */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[10px] text-white/40">
                      {isScored ? 'Dinilai' : 'Tidak'}
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isScored}
                        onChange={(e) => {
                          onStageScoringToggle(stage.id, e.target.checked)
                          // If turning off, set points to 0
                          if (!e.target.checked) {
                            onDistributionChange(stage.id, 0)
                          }
                        }}
                        className="sr-only"
                      />
                      <div className={`w-10 h-5 rounded-full transition-all ${
                        isScored ? 'bg-cyan-500' : 'bg-white/20'
                      }`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-all mt-0.5 ${
                          isScored ? 'ml-5' : 'ml-0.5'
                        }`} />
                      </div>
                    </div>
                  </label>
                </div>
                
                {/* Points Input (only if scored) */}
                {isScored ? (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={points}
                          onChange={(e) => onDistributionChange(stage.id, Number(e.target.value))}
                          min={0}
                          className="w-20 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-cyan-400/40 transition-all text-center"
                        />
                        <span className="text-xs text-white/30">poin</span>
                        <span className="text-xs text-white/20">({percentage}%)</span>
                        {hasWeight && (
                          <span className="text-[10px] text-white/20 ml-2">
                            Bobot: {stageWeight}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-24 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          percentage > 0 ? 'bg-gradient-to-r from-cyan-500 to-violet-500' : 'bg-white/10'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-white/20 italic">
                    Tahapan ini tidak dimasukkan dalam perhitungan nilai
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Summary */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/40">Total</span>
            <span className="text-xs text-white/30">
              {scoredStages.length} tahapan dinilai
              {unscoredStages.length > 0 && `, ${unscoredStages.length} tidak dinilai`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalDistributed} / {scoring.totalPoints} poin
            </span>
            {!isBalanced && (
              <span className="text-xs text-rose-400/70 bg-rose-500/10 px-2 py-0.5 rounded-full">
                ⚠️ Tidak seimbang
              </span>
            )}
            {hasZeroWeightStage && (
              <span className="text-xs text-amber-400/70 bg-amber-500/10 px-2 py-0.5 rounded-full">
                ⚠️ Ada bobot 0
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ===== NEW: Question Weights (Hybrid/Manual Mode) ===== */}
      {(scoring.mode === 'hybrid' || scoring.mode === 'manual') && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <h4 className="text-sm font-medium text-white mb-3">
            Bobot Pertanyaan
            <span className="text-xs text-white/30 ml-2">
              (Atur bobot per pertanyaan, 1-100)
            </span>
          </h4>
          
          {stages.map((stage) => {
            const stageQuestions = getQuestionsByStage(elements, stage.id)
            if (stageQuestions.length === 0) return null
            
            const isScored = stage.includeInScoring !== false
            const stageTotalWeight = stageWeights[stage.id] || 1
            
            return (
              <div key={stage.id} className="mb-4 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-white/60">{stage.name}</span>
                  <span className="text-[10px] text-white/30">
                    Total bobot: {stageTotalWeight}
                  </span>
                  {!isScored && (
                    <span className="text-[10px] text-amber-400/50">
                      (tidak dinilai)
                    </span>
                  )}
                </div>
                
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                  {stageQuestions.map((el) => {
                    const weight = el.scoring?.weight || 1
                    const percentage = stageTotalWeight > 0 
                      ? Math.round((weight / stageTotalWeight) * 100) 
                      : 0
                    
                    return (
                      <div key={el.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-all">
                        <span className="text-xs text-white/50 flex-1 truncate">
                          {el.question || `Pertanyaan ${el.order + 1}`}
                        </span>
                        <span className="text-[10px] text-white/20 flex-shrink-0">
                          {ANSWER_TYPES.find(t => t.value === el.answerType)?.label || el.answerType}
                        </span>
                        <input
                          type="number"
                          value={weight}
                          onChange={(e) => {
                            const val = Number(e.target.value)
                            if (val >= 1 && val <= 100) {
                              onQuestionWeightChange(el.id, val)
                            }
                          }}
                          min={1}
                          max={100}
                          disabled={!isScored}
                          className={`w-16 px-2 py-1 rounded-lg text-sm text-center transition-all ${
                            isScored 
                              ? 'bg-white/[0.03] border border-white/[0.06] text-white focus:outline-none focus:border-cyan-400/40'
                              : 'bg-white/[0.01] border border-white/[0.03] text-white/30 cursor-not-allowed'
                          }`}
                        />
                        <span className="text-[10px] text-white/20 w-12 text-right">
                          {percentage}%
                        </span>
                        <div className="w-12 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-cyan-500/40 rounded-full"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Override toggle */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={scoring.allowOverride}
            onChange={onAllowScoringOverrideToggle}
            className="w-4 h-4 rounded text-cyan-500"
          />
          <div>
            <p className="text-sm text-white/80">Izinkan override per pertanyaan</p>
            <p className="text-xs text-white/30">
              {scoring.allowOverride 
                ? 'Desainer bisa mengatur skor individual di properties pertanyaan' 
                : 'Semua pertanyaan mengikuti skema penilaian global'}
            </p>
          </div>
        </label>
      </div>
    </div>
  )
}
