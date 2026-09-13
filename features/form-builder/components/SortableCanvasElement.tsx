// components/form-builder/SortableCanvasElement.tsx

'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CanvasElement } from './CanvasElement'

interface SortableCanvasElementProps {
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
}

export function SortableCanvasElement({
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
}: SortableCanvasElementProps) {
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

  // Tampilkan indicator saat ada elemen di-drag di atas elemen ini
  const showIndicator = isOver && !isSortableDragging && !isDragging

  return (
    <div className="relative">
      {/* Indicator Line DI ATAS elemen */}
      {showIndicator && (
        <div className="relative w-full h-6 -mb-2 flex items-center justify-center">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full animate-pulse" />
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50 ring-2 ring-cyan-400/20" />
          <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-[8px] text-cyan-400 font-medium bg-[#0e0e1a] px-1.5 rounded">
            ↓ Taruh di sini
          </span>
        </div>
      )}

      {/* Elemen */}
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`touch-none ${isSortableDragging || isDragging ? 'opacity-40' : ''}`}
      >
        <CanvasElement
          element={element}
          index={index}
          isSelected={isSelected}
          onSelect={onSelect}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
      </div>

      {/* Indicator Line DI BAWAH elemen */}
      {showIndicator && (
        <div className="relative w-full h-6 -mt-2 flex items-center justify-center">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full animate-pulse" />
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50 ring-2 ring-cyan-400/20" />
          <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-[8px] text-cyan-400 font-medium bg-[#0e0e1a] px-1.5 rounded">
            ↓ Taruh di sini
          </span>
        </div>
      )}
    </div>
  )
}