// components/form-builder/ElementButton.tsx

'use client'

import { Icon } from '@/components/ui/Icons'
import { FormElement } from './ElementTypes'

interface ElementButtonProps {
  element: FormElement
  onClick: () => void
  onDragStart?: (e: React.DragEvent, element: FormElement) => void
}

export function ElementButton({ element, onClick, onDragStart }: ElementButtonProps) {
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, element)
    } else {
      e.dataTransfer.setData('elementType', element.type)
      e.dataTransfer.effectAllowed = 'copy'
    }
  }

  return (
    <button
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
      className="flex flex-col items-center gap-0.5 p-2 min-w-[60px] rounded-xl hover:bg-white/[0.05] transition-colors group flex-shrink-0"
    >
      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
        <Icon name={element.icon as any} className="w-5 h-5 text-cyan-400" />
      </div>
      <span className="text-[9px] text-white/50 group-hover:text-white/80 truncate w-full text-center">
        {element.label}
      </span>
    </button>
  )
}