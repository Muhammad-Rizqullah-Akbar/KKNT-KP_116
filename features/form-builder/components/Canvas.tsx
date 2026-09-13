// components/form-builder/Canvas.tsx

'use client'

import { useState, useRef, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Icon } from '@/components/ui/Icons'
import { FlexibleQuestion, FormStage, ANSWER_TYPES } from './ElementTypes'
import { SortableFlexibleElement } from './SortableFlexibleElement'

interface CanvasProps {
  elements: FlexibleQuestion[]
  stages: FormStage[]
  stageMode: 'single' | 'multi'
  onElementClick: (element: FlexibleQuestion) => void
  onElementDelete: (id: string) => void
  onElementMove: (id: string, direction: 'up' | 'down') => void
  onElementDuplicate?: (element: FlexibleQuestion) => void
  onReorder?: (startIndex: number, endIndex: number) => void
  onMoveQuestionToStage?: (questionId: string, stageId: string) => void
  selectedId?: string | null
  onDropFromToolbar?: (elementType: string, targetIndex?: number) => void
  // ===== NEW PROPS =====
  validationMode?: 'all_required' | 'all_required_except' | 'free'
  allowScoringOverride?: boolean
  scoringDistribution?: Record<string, number>
}

export function Canvas({
  elements,
  stages,
  stageMode,
  onElementClick,
  onElementDelete,
  onElementMove,
  onElementDuplicate,
  onReorder,
  onMoveQuestionToStage,
  selectedId,
  onDropFromToolbar,
  validationMode = 'all_required',
  allowScoringOverride = true,
  scoringDistribution = {},
}: CanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isToolbarDragging, setIsToolbarDragging] = useState(false)
  const [toolbarDragOverIndex, setToolbarDragOverIndex] = useState<number | null>(null)
  const [toolbarDragOverStageId, setToolbarDragOverStageId] = useState<string | null>(null)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // ============ HELPERS ============
  const getQuestionsByStage = useCallback((stageId: string) => {
    return elements.filter(el => el.stageId === stageId)
  }, [elements])

  // ============ DnD HANDLERS ============
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    setDragOverStageId(null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return
    
    const overId = over.id as string
    
    // Deteksi drag di atas stage header
    if (overId.startsWith('stage-header-')) {
      const targetStageId = overId.replace('stage-header-', '')
      setDragOverStageId(targetStageId)
      setToolbarDragOverStageId(targetStageId)
    } else {
      // Jika drag di atas elemen, cek stage dari elemen tersebut
      const overElement = elements.find(el => el.id === overId)
      if (overElement) {
        setDragOverStageId(overElement.stageId || null)
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const activeId = active.id as string
    
    setActiveId(null)
    setDragOverStageId(null)
    setToolbarDragOverStageId(null)
    
    if (!over) return
    
    const overId = over.id as string
    
    // CASE 1: Drop di Stage Header → Pindah Stage
    if (overId.startsWith('stage-header-')) {
      const targetStageId = overId.replace('stage-header-', '')
      if (onMoveQuestionToStage && activeId) {
        onMoveQuestionToStage(activeId, targetStageId)
      }
      return
    }
    
    // CASE 2: Drop di Elemen Lain
    if (activeId !== overId) {
      const oldIndex = elements.findIndex((el) => el.id === activeId)
      const newIndex = elements.findIndex((el) => el.id === overId)
      
      if (oldIndex !== -1 && newIndex !== -1 && onReorder) {
        const sourceElement = elements[oldIndex]
        const targetElement = elements[newIndex]
        
        // Jika elemen berbeda stage, pindahkan dulu
        if (sourceElement && targetElement && 
            sourceElement.stageId !== targetElement.stageId && 
            onMoveQuestionToStage) {
          onMoveQuestionToStage(activeId, targetElement.stageId || stages[0]?.id || '')
        }
        
        // Lalu reorder
        onReorder(oldIndex, newIndex)
      }
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setDragOverStageId(null)
    setIsToolbarDragging(false)
    setToolbarDragOverIndex(null)
    setToolbarDragOverStageId(null)
  }

  // ============ TOOLBAR DRAG HANDLERS ============
  const getDropIndex = (e: React.DragEvent, container: HTMLElement): number => {
    const rect = container.getBoundingClientRect()
    const y = e.clientY - rect.top
    const padding = 16
    const availableHeight = rect.height - padding * 2
    const elementHeight = Math.max(availableHeight / (elements.length + 1), 40)
    let index = Math.floor(y / elementHeight)
    index = Math.max(0, Math.min(index, elements.length))
    return index
  }

  const getDropStageId = (e: React.DragEvent): string | null => {
    if (stageMode === 'single' || stages.length <= 1) {
      return stages[0]?.id || null
    }

    const container = canvasRef.current
    if (!container) return null

    const stageHeaders = container.querySelectorAll('.stage-header')
    for (let i = 0; i < stageHeaders.length; i++) {
      const header = stageHeaders[i] as HTMLElement
      const headerRect = header.getBoundingClientRect()
      if (e.clientY < headerRect.bottom) {
        return header.dataset.stageId || null
      }
    }
    
    return stages[stages.length - 1]?.id || null
  }

  const handleToolbarDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsToolbarDragging(true)
    
    const container = canvasRef.current
    if (container) {
      const dropIndex = getDropIndex(e, container)
      setToolbarDragOverIndex(dropIndex)
    }
    
    const stageId = getDropStageId(e)
    setToolbarDragOverStageId(stageId)
    setDragOverStageId(stageId)
  }

  const handleToolbarDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setIsToolbarDragging(false)
      setToolbarDragOverIndex(null)
      setToolbarDragOverStageId(null)
      setDragOverStageId(null)
    }
  }

  const handleToolbarDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const dropIndex = toolbarDragOverIndex
    setIsToolbarDragging(false)
    setToolbarDragOverIndex(null)
    setToolbarDragOverStageId(null)
    setDragOverStageId(null)
    
    const elementType = e.dataTransfer.getData('elementType')
    if (elementType && onDropFromToolbar) {
      onDropFromToolbar(elementType, dropIndex !== null ? dropIndex : elements.length)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const elementType = e.dataTransfer.getData('elementType')
    if (elementType && onDropFromToolbar) {
      onDropFromToolbar(elementType, elements.length)
    }
    setIsToolbarDragging(false)
    setToolbarDragOverIndex(null)
    setToolbarDragOverStageId(null)
    setDragOverStageId(null)
  }

  const handleDragOverCanvas = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const activeElement = elements.find(el => el.id === activeId)

  // ============ RENDER INDICATOR ============
  const renderToolbarIndicator = () => {
    if (!isToolbarDragging || toolbarDragOverIndex === null) return null
    
    const index = toolbarDragOverIndex
    const isAtEnd = index === elements.length
    const stageName = toolbarDragOverStageId 
      ? stages.find(s => s.id === toolbarDragOverStageId)?.name 
      : null
    
    return (
      <div className="relative w-full h-8 -my-2 flex items-center justify-center z-20 pointer-events-none">
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full animate-pulse-line" />
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50 ring-2 ring-cyan-400/20 animate-pulse-dot" />
        <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-[8px] text-cyan-400 font-medium bg-[#0e0e1a] px-2 py-0.5 rounded-full whitespace-nowrap border border-cyan-400/20">
          {isAtEnd 
            ? `⬇ Taruh di akhir${stageName ? ` (${stageName})` : ''}` 
            : `⬇ Taruh di sini (setelah nomor ${index})${stageName ? ` di ${stageName}` : ''}`
          }
        </span>
      </div>
    )
  }

  // ============ RENDER STAGE HEADER ============
  const renderStageHeader = (stage: FormStage, stageIndex: number) => {
    const stageQuestions = getQuestionsByStage(stage.id)
    const isDragOver = dragOverStageId === stage.id
    
    return (
      <div 
        key={stage.id}
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
            <span className="text-xs text-white/30">({stageQuestions.length} pertanyaan)</span>
          </div>
          {stageQuestions.length === 0 && (
            <span className={`text-xs ml-2 transition-all ${isDragOver ? 'text-cyan-400/80' : 'text-white/20'}`}>
              {isDragOver ? '⬇ Lepaskan di sini' : 'Kosong - seret pertanyaan ke sini'}
            </span>
          )}
          {isDragOver && (
            <span className="ml-auto text-xs text-cyan-400 font-medium animate-pulse">
              ⬇ Lepaskan
            </span>
          )}
          {stageMode === 'multi' && stages.length > 1 && !isDragOver && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-white/20">
                {stageIndex + 1} / {stages.length}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ============ EMPTY STATE ============
  if (elements.length === 0) {
    return (
      <div 
        ref={canvasRef}
        className="h-full flex flex-col items-center justify-center text-white/20 min-h-[200px] border-2 border-dashed border-white/5 rounded-xl relative"
        onDrop={handleDrop}
        onDragOver={handleDragOverCanvas}
      >
        <Icon name="move" className="w-12 h-12 mb-4" />
        <p className="text-sm">Belum ada elemen</p>
        <p className="text-xs text-white/10 mt-1">Drag elemen dari toolbar atau klik untuk menambahkan</p>
        {isToolbarDragging && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full animate-pulse-line" />
            <span className="absolute left-1/2 -translate-x-1/2 text-[8px] text-cyan-400 font-medium bg-[#0e0e1a] px-2 py-0.5 rounded-full border border-cyan-400/20">
              ⬇ Taruh di sini
            </span>
          </div>
        )}
      </div>
    )
  }

  // ============ MAIN RENDER ============
  const isSingleMode = stageMode === 'single' || stages.length <= 1

  // Single mode: semua pertanyaan dalam satu daftar
  if (isSingleMode) {
    return (
      <div 
        ref={canvasRef}
        className="min-h-[200px] relative"
        onDrop={handleToolbarDrop}
        onDragOver={handleToolbarDragOver}
        onDragLeave={handleToolbarDragLeave}
      >
        {renderToolbarIndicator()}
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={elements.map(el => el.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3 pb-4">
              {elements.map((element, index) => (
                <SortableFlexibleElement
                  key={element.id}
                  id={element.id}
                  element={element}
                  index={index}
                  isSelected={selectedId === element.id}
                  isDragging={activeId === element.id}
                  onSelect={() => onElementClick(element)}
                  onDelete={() => onElementDelete(element.id)}
                  onDuplicate={() => onElementDuplicate && onElementDuplicate(element)}
                  onMoveUp={() => onElementMove(element.id, 'up')}
                  onMoveDown={() => onElementMove(element.id, 'down')}
                  stages={stages}
                  onMoveToStage={onMoveQuestionToStage}
                  validationMode={validationMode}
                  allowScoringOverride={allowScoringOverride}
                  scoringDistribution={scoringDistribution}
                />
              ))}
            </div>
          </SortableContext>
          
          <DragOverlay>
            {activeElement ? (
              <div className="p-4 rounded-xl border-2 border-cyan-500/50 bg-[#0e0e1a] shadow-2xl shadow-cyan-500/20 w-[300px] cursor-grabbing">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-medium text-white/20 w-6 flex-shrink-0">
                    {elements.findIndex(el => el.id === activeElement.id) + 1}.
                  </span>
                  <p className="text-sm text-white/80 truncate">{activeElement.question}</p>
                </div>
                <div className="text-xs text-white/30">
                  {ANSWER_TYPES.find(t => t.value === activeElement.answerType)?.label || activeElement.answerType}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    )
  }

  // ============ MULTI STAGE MODE ============
  return (
    <div 
      ref={canvasRef}
      className="min-h-[200px] relative"
      onDrop={handleToolbarDrop}
      onDragOver={handleToolbarDragOver}
      onDragLeave={handleToolbarDragLeave}
    >
      {renderToolbarIndicator()}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="space-y-4 pb-4">
          {stages.map((stage, stageIndex) => {
            const stageQuestions = getQuestionsByStage(stage.id)
            const isDragOver = dragOverStageId === stage.id
            
            return (
              <div key={stage.id}>
                {renderStageHeader(stage, stageIndex)}
                
                {stageQuestions.length === 0 ? (
                  <div 
                    className={`ml-4 pl-4 border-l-2 transition-all duration-200 p-4 rounded-xl border-2 border-dashed text-center mb-4 ${
                      isDragOver 
                        ? 'border-cyan-400/40 bg-cyan-500/5' 
                        : 'border-white/[0.04]'
                    }`}
                    onDrop={(e) => {
                      e.preventDefault()
                      const elementType = e.dataTransfer.getData('elementType')
                      if (elementType && onDropFromToolbar) {
                        onDropFromToolbar(elementType, elements.length)
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <p className={`text-xs transition-all ${isDragOver ? 'text-cyan-400/70' : 'text-white/20'}`}>
                      {isDragOver 
                        ? '⬇ Lepaskan di sini untuk menambahkan' 
                        : 'Kosong - seret pertanyaan ke sini atau dari toolbar'}
                    </p>
                  </div>
                ) : (
                  <SortableContext
                    items={stageQuestions.map(el => el.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="ml-4 pl-4 border-l-2 border-white/[0.05] space-y-2 mb-4">
                      {stageQuestions.map((el) => {
                        const globalIndex = elements.indexOf(el)
                        return (
                          <SortableFlexibleElement
                            key={el.id}
                            id={el.id}
                            element={el}
                            index={globalIndex}
                            isSelected={selectedId === el.id}
                            isDragging={activeId === el.id}
                            onSelect={() => onElementClick(el)}
                            onDelete={() => onElementDelete(el.id)}
                            onDuplicate={() => onElementDuplicate && onElementDuplicate(el)}
                            onMoveUp={() => onElementMove(el.id, 'up')}
                            onMoveDown={() => onElementMove(el.id, 'down')}
                            stageId={stage.id}
                            stages={stages}
                            onMoveToStage={onMoveQuestionToStage}
                            validationMode={validationMode}
                            allowScoringOverride={allowScoringOverride}
                            scoringDistribution={scoringDistribution}
                          />
                        )
                      })}
                    </div>
                  </SortableContext>
                )}
              </div>
            )
          })}
        </div>
        
        <DragOverlay>
          {activeElement ? (
            <div className="p-4 rounded-xl border-2 border-cyan-500/50 bg-[#0e0e1a] shadow-2xl shadow-cyan-500/20 w-[300px] cursor-grabbing">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-medium text-white/20 w-6 flex-shrink-0">
                  {elements.findIndex(el => el.id === activeElement.id) + 1}.
                </span>
                <p className="text-sm text-white/80 truncate">{activeElement.question}</p>
              </div>
              <div className="text-xs text-white/30">
                {ANSWER_TYPES.find(t => t.value === activeElement.answerType)?.label || activeElement.answerType}
                {activeElement.stageId && stages.length > 1 && (
                  <> • {stages.find(s => s.id === activeElement.stageId)?.name || ''}</>
                )}
              </div>
              {dragOverStageId && (
                <div className="mt-2 text-[10px] text-cyan-400 font-medium text-center animate-pulse">
                  → Pindah ke {stages.find(s => s.id === dragOverStageId)?.name || ''}
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}