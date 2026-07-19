// components/form-builder/Canvas.tsx

'use client'

import { useState, useRef } from 'react'
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
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Icon } from '@/components/ui/Icons'
import { FlexibleQuestion, ELEMENTS } from './ElementTypes'
import { SortableFlexibleElement } from './SortableFlexibleElement'

interface CanvasProps {
  elements: FlexibleQuestion[]
  onElementClick: (element: FlexibleQuestion) => void
  onElementDelete: (id: string) => void
  onElementMove: (id: string, direction: 'up' | 'down') => void
  onElementDuplicate?: (element: FlexibleQuestion) => void
  onReorder?: (startIndex: number, endIndex: number) => void
  selectedId?: string | null
  onDropFromToolbar?: (elementType: string, targetIndex?: number) => void
}

export function Canvas({
  elements,
  onElementClick,
  onElementDelete,
  onElementMove,
  onElementDuplicate,
  onReorder,
  selectedId,
  onDropFromToolbar,
}: CanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isToolbarDragging, setIsToolbarDragging] = useState(false)
  const [toolbarDragOverIndex, setToolbarDragOverIndex] = useState<number | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const getDropIndex = (e: React.DragEvent): number => {
    const container = canvasRef.current
    if (!container) return elements.length

    const rect = container.getBoundingClientRect()
    const y = e.clientY - rect.top
    const padding = 16
    const availableHeight = rect.height - padding * 2
    const elementHeight = availableHeight / (elements.length + 1)
    let index = Math.floor(y / elementHeight)
    index = Math.max(0, Math.min(index, elements.length))
    return index
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setIsToolbarDragging(false)
    setToolbarDragOverIndex(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    setIsToolbarDragging(false)
    setToolbarDragOverIndex(null)
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = elements.findIndex((el) => el.id === active.id)
      const newIndex = elements.findIndex((el) => el.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        if (onReorder) {
          onReorder(oldIndex, newIndex)
        }
      }
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setIsToolbarDragging(false)
    setToolbarDragOverIndex(null)
  }

  // ============ TOOLBAR DRAG HANDLERS ============
  const handleToolbarDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsToolbarDragging(true)
    const dropIndex = getDropIndex(e)
    setToolbarDragOverIndex(dropIndex)
  }

  const handleToolbarDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setIsToolbarDragging(false)
      setToolbarDragOverIndex(null)
    }
  }

  const handleToolbarDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const dropIndex = toolbarDragOverIndex
    setIsToolbarDragging(false)
    setToolbarDragOverIndex(null)
    
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
  }

  const handleDragOverCanvas = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const activeElement = elements.find(el => el.id === activeId)

  // Render indicator untuk toolbar drag
  const renderToolbarIndicator = () => {
    if (!isToolbarDragging || toolbarDragOverIndex === null) return null
    
    const index = toolbarDragOverIndex
    const isAtEnd = index === elements.length
    
    return (
      <div className="relative w-full h-8 -my-2 flex items-center justify-center z-20 pointer-events-none">
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full animate-pulse-line" />
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50 ring-2 ring-cyan-400/20 animate-pulse-dot" />
        <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-[8px] text-cyan-400 font-medium bg-[#0e0e1a] px-2 py-0.5 rounded-full whitespace-nowrap border border-cyan-400/20">
          {isAtEnd ? '⬇ Taruh di akhir' : `⬇ Taruh di sini (setelah nomor ${index})`}
        </span>
      </div>
    )
  }

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
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
        >
          {activeElement ? (
            <div className="p-4 rounded-xl border-2 border-cyan-500/50 bg-[#0e0e1a] shadow-2xl shadow-cyan-500/20 w-[300px] cursor-grabbing">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-medium text-white/20 w-6 flex-shrink-0">
                  {elements.findIndex(el => el.id === activeElement.id) + 1}.
                </span>
                <p className="text-sm text-white/80 truncate">{activeElement.question}</p>
              </div>
              <div className="text-xs text-white/30">
                {activeElement.answerType} • {activeElement.question}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}