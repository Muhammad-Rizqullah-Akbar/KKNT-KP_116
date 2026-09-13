// components/form-builder/SortableFlexibleElement.tsx

'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FlexibleElement } from './FlexibleElement'
import { FormStage } from './ElementTypes'

interface SortableFlexibleElementProps {
  id: string
  element: any
  index: number
  isSelected: boolean
  isDragging: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  // ===== NEW PROPS =====
  stageId?: string
  stages?: FormStage[]
  onMoveToStage?: (questionId: string, stageId: string) => void
  validationMode?: 'all_required' | 'all_required_except' | 'free'
  allowScoringOverride?: boolean
  scoringDistribution?: Record<string, number>
}

export function SortableFlexibleElement({
  id,
  element,
  index,
  isSelected,
  isDragging,
  onSelect,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  // ===== NEW PROPS =====
  stageId,
  stages = [],
  onMoveToStage,
  validationMode = 'all_required',
  allowScoringOverride = true,
  scoringDistribution = {},
}: SortableFlexibleElementProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
    isOver,
  } = useSortable({ 
    id,
    disabled: isDragging,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging || isDragging ? 0.4 : 1,
    zIndex: isSortableDragging ? 10 : 0,
  }

  const showIndicator = isOver && !isSortableDragging && !isDragging

  // ===== HANDLE MOVE TO STAGE =====
  const handleMoveToStage = (targetStageId: string) => {
    if (onMoveToStage && targetStageId !== stageId) {
      onMoveToStage(id, targetStageId)
    }
  }

  // ===== RENDER STAGE SELECTOR =====
  const renderStageSelector = () => {
    if (stages.length <= 1) return null

    return (
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[10px] text-white/20">Pindah:</span>
        <select
          value={stageId || ''}
          onChange={(e) => handleMoveToStage(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-white/50 focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer max-w-[100px]"
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
      </div>
    )
  }

  // ===== RENDER OVERRIDE INDICATOR =====
  const renderOverrideIndicator = () => {
    if (element.overridePoints === null) return null
    
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-0.5 flex-shrink-0">
        <span className="font-mono">{element.overridePoints}</span>
        <span className="text-[8px] opacity-50">pts</span>
      </span>
    )
  }

  // ===== RENDER REQUIRED INDICATOR =====
  const renderRequiredIndicator = () => {
    if (!element.required) return null
    
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex-shrink-0">
        Wajib
      </span>
    )
  }

  // ===== RENDER IDENTIFIER INDICATOR =====
  const renderIdentifierIndicator = () => {
    if (!element.isIdentifier || element.identifierType === 'none') return null
    
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
        ID: {element.identifierType}
      </span>
    )
  }

  // ===== RENDER SCORING SCHEME INDICATOR =====
  const renderScoringIndicator = () => {
    if (!element.scoring || element.scoring.scheme === 'none') return null
    
    const schemeLabels: Record<string, string> = {
      'binary': 'Benar/Salah',
      'likert': 'Skala',
      'rating': 'Rating',
      'indicator': 'Indikator',
    }
    
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 flex-shrink-0">
        {schemeLabels[element.scoring.scheme] || element.scoring.scheme}
      </span>
    )
  }

  // ===== RENDER DRAG HANDLE =====
  const renderDragHandle = () => {
    return (
      <div 
        className={`
          absolute left-0 top-1/2 -translate-y-1/2 
          -ml-6 p-1.5 rounded-lg 
          cursor-grab active:cursor-grabbing touch-none
          opacity-0 group-hover:opacity-100 transition-opacity
          hover:bg-white/[0.08]
          ${isSortableDragging || isDragging ? 'opacity-100' : ''}
        `}
        {...attributes}
        {...listeners}
      >
        <div className="flex flex-col gap-0.5">
          <div className="w-3.5 h-0.5 bg-white/40 rounded-full" />
          <div className="w-3.5 h-0.5 bg-white/40 rounded-full" />
          <div className="w-3.5 h-0.5 bg-white/40 rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative group">
      {/* Drop Indicator - Top */}
      {showIndicator && (
        <div className="relative w-full h-6 -mb-2 flex items-center justify-center">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full animate-pulse" />
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50 ring-2 ring-cyan-400/20" />
          <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-[8px] text-cyan-400 font-medium bg-[#0e0e1a] px-1.5 rounded whitespace-nowrap border border-cyan-400/20">
            ↓ Taruh di sini
          </span>
        </div>
      )}

      {/* Main Element */}
      <div
        ref={setNodeRef}
        style={style}
        className={`touch-none ${isSortableDragging || isDragging ? 'opacity-40' : ''}`}
      >
        <div className="relative pl-6">
          {/* Drag Handle - kiri elemen */}
          {renderDragHandle()}

          {/* Extra Info Bar - muncul di atas element */}
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 mb-0.5 flex-wrap">
            {renderRequiredIndicator()}
            {renderIdentifierIndicator()}
            {renderScoringIndicator()}
            {renderOverrideIndicator()}
            {renderStageSelector()}
            
            {/* Stage badge jika element punya stage dan stages > 1 */}
            {stageId && stages.length > 1 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.03] text-white/20 border border-white/[0.05] flex-shrink-0">
                {stages.find(s => s.id === stageId)?.name || ''}
              </span>
            )}
          </div>

          {/* FlexibleElement asli */}
          <FlexibleElement
            element={element}
            index={index}
            isSelected={isSelected}
            onSelect={onSelect}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            stages={stages}
            onMoveToStage={onMoveToStage}
            validationMode={validationMode}
            allowScoringOverride={allowScoringOverride}
            scoringDistribution={scoringDistribution}
          />
        </div>
      </div>

      {/* Drop Indicator - Bottom */}
      {showIndicator && (
        <div className="relative w-full h-6 -mt-2 flex items-center justify-center">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full animate-pulse" />
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50 ring-2 ring-cyan-400/20" />
          <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-[8px] text-cyan-400 font-medium bg-[#0e0e1a] px-1.5 rounded whitespace-nowrap border border-cyan-400/20">
            ↓ Taruh di sini
          </span>
        </div>
      )}
    </div>
  )
}