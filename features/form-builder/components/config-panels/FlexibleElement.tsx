// components/form-builder/FlexibleElement.tsx

'use client'

import { Icon } from '@/components/ui/Icons'
import { FlexibleQuestion, ANSWER_TYPES, FormStage } from './../shared/ElementTypes'
import { FlexibleElementPreview } from '././FlexibleElementPreview'

interface FlexibleElementProps {
  element: FlexibleQuestion
  index: number
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  // ===== NEW PROPS =====
  stages?: FormStage[]
  onMoveToStage?: (questionId: string, stageId: string) => void
  validationMode?: 'all_required' | 'all_required_except' | 'free'
  allowScoringOverride?: boolean
  scoringDistribution?: Record<string, number>
}

export function FlexibleElement({
  element,
  index,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  stages = [],
  onMoveToStage,
  validationMode = 'all_required',
  allowScoringOverride = true,
  scoringDistribution = {},
}: FlexibleElementProps) {
  const answerTypeLabel = ANSWER_TYPES.find(t => t.value === element.answerType)?.label || element.answerType

  // ===== HELPER: Cek apakah pertanyaan wajib berdasarkan mode validasi =====
  const isRequired = () => {
    if (validationMode === 'free') return false
    if (validationMode === 'all_required_except') {
      // exceptions akan dihandle di parent, tapi kita tetap tampilkan
      return element.required
    }
    return element.required
  }

  // ===== GET SCORING POINTS FOR THIS QUESTION =====
  const getQuestionPoints = (): number => {
    // Cek override points dulu
    if (element.overridePoints !== null) {
      return element.overridePoints
    }
    // Cek dari distribution
    if (scoringDistribution && scoringDistribution[element.id] !== undefined) {
      return scoringDistribution[element.id]
    }
    // Cek dari scoring weight (fallback)
    return element.scoring?.weight || 1
  }

  const points = getQuestionPoints()
  const hasScoring = element.scoring.scheme !== 'none'

  // ===== RENDER STAGE SELECTOR =====
  const renderStageSelector = () => {
    if (stages.length <= 1) return null

    return (
      <select
        value={element.stageId || ''}
        onChange={(e) => onMoveToStage?.(element.id, e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="text-[10px] px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/50 focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer max-w-[120px]"
      >
        {stages.map(stage => (
          <option
            key={stage.id}
            value={stage.id}
            className="bg-[#080812] text-white/80"
          >
            {stage.name}
          </option>
        ))}
      </select>
    )
  }

  // ===== RENDER SCORING OVERRIDE BADGE =====
  const renderScoringOverride = () => {
    if (!allowScoringOverride) return null
    if (element.overridePoints === null) return null

    return (
      <div className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <Icon name="edit" className="w-3 h-3" />
        <span className="font-mono">{element.overridePoints}</span>
        <span className="text-[8px] opacity-50">pts</span>
        {element.scoring?.weight > 1 && (
          <span className="text-[8px] opacity-50">×{element.scoring.weight}</span>
        )}
      </div>
    )
  }

  // ===== RENDER MEDIA =====
  const renderMedia = () => {
    if (element.media.type === 'none' || !element.media.url) return null

    return (
      <div className="mt-2 mb-3 rounded-xl overflow-hidden border border-white/[0.05]">
        {element.media.type === 'image' && (
          <img src={element.media.url} alt={element.media.caption || 'Gambar'} className="w-full h-32 object-cover" />
        )}
        {element.media.type === 'video' && (
          <video src={element.media.url} controls className="w-full h-32 object-cover" />
        )}
        {element.media.type === 'file' && (
          <div className="p-4 bg-white/[0.02] flex items-center gap-3">
            <Icon name="fileText" className="w-8 h-8 text-white/30" />
            <div>
              <p className="text-sm text-white/60 truncate">{element.media.url.split('/').pop()}</p>
              <p className="text-xs text-white/20">File</p>
            </div>
          </div>
        )}
        {element.media.caption && (
          <p className="text-xs text-white/30 p-2 text-center">{element.media.caption}</p>
        )}
      </div>
    )
  }

  // ===== BADGES =====
  const identifierLabel = element.isIdentifier ?
    (element.identifierType === 'name' ? '🏷️ Nama' :
     element.identifierType === 'location' ? '📍 Lokasi' :
     element.identifierType === 'email' ? '📧 Email' :
     element.identifierType === 'phone' ? '📞 Telepon' : '🔖 Penanda') : null

  const scoringLabel = element.scoring.scheme !== 'none' ?
    (element.scoring.scheme === 'binary' ? '✅ Benar/Salah' :
     element.scoring.scheme === 'likert' ? '📊 Skala' :
     element.scoring.scheme === 'indicator' ? '📋 Indikator' :
     element.scoring.scheme === 'rating' ? '⭐ Rating' : '📊 Dinilai') : null

  // ===== MAIN RENDER =====
  return (
    <div
      className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? 'border-cyan-500/50 bg-cyan-500/5 shadow-lg shadow-cyan-500/10'
          : 'border-white/[0.05] bg-white/[0.01] hover:border-white/[0.1] hover:bg-white/[0.02]'
      }`}
      onClick={onSelect}
    >
      {/* Header: Nomor + Actions + Stage Selector */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs font-medium text-white/20 w-6 flex-shrink-0">
          {index + 1}.
        </span>
        <div className="flex-1" />

        {/* Stage Selector */}
        {renderStageSelector()}

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp() }}
            className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
            disabled={index === 0}
          >
            <Icon name="arrowUp" className={`w-3.5 h-3.5 ${index === 0 ? 'text-white/10' : 'text-white/30 hover:text-white/60'}`} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown() }}
            className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <Icon name="arrowDown" className="w-3.5 h-3.5 text-white/30 hover:text-white/60" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate() }}
            className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <Icon name="copy" className="w-3.5 h-3.5 text-white/30 hover:text-amber-400" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <Icon name="trash" className="w-3.5 h-3.5 text-white/30 hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Media Preview */}
      {renderMedia()}

      {/* Preview */}
      <div className="pl-6">
        <FlexibleElementPreview element={element} />
      </div>

      {/* Badges - Bottom */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 mt-3 pl-6">
        <div className="flex flex-wrap gap-1.5">
          {/* Required badge */}
          {isRequired() && (
            <span className="text-[10px] text-rose-400/70 bg-rose-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Icon name="alertCircle" className="w-3 h-3" />
              Wajib
            </span>
          )}

          {/* Override points badge */}
          {renderScoringOverride()}

          {/* Identifier badge */}
          {identifierLabel && (
            <span className="text-[10px] text-cyan-400/70 bg-cyan-500/10 px-2 py-0.5 rounded-full">
              {identifierLabel}
            </span>
          )}

          {/* Scoring badge */}
          {scoringLabel && (
            <span className="text-[10px] text-amber-400/70 bg-amber-500/10 px-2 py-0.5 rounded-full">
              {scoringLabel}
              {element.scoring.weight > 1 && ` ×${element.scoring.weight}`}
            </span>
          )}

          {/* Stage badge */}
          {stages.length > 1 && element.stageId && (
            <span className="text-[10px] text-white/30 bg-white/[0.05] px-2 py-0.5 rounded-full">
              {stages.find(s => s.id === element.stageId)?.name || ''}
            </span>
          )}

          {/* Type badge */}
          <span className="text-[10px] text-white/20 bg-white/[0.05] px-2 py-0.5 rounded-full">
            {answerTypeLabel}
          </span>
        </div>

        {/* ===== NEW: SCORE DISPLAY - POJOK KANAN BAWAH ===== */}
        {hasScoring && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex-shrink-0">
            <Icon name="barChart" className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] font-medium text-cyan-400">
              {points} {points > 1 ? 'poin' : 'poin'}
            </span>
            {element.overridePoints !== null && (
              <span className="text-[8px] text-amber-400/70 ml-0.5">(override)</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
