// components/form-builder/ElementToolbar.tsx

'use client'

import { useState, useRef, useEffect } from 'react'
import { Icon } from '@/components/ui/Icons'
import { ELEMENTS, CATEGORIES, FormElement } from './ElementTypes'
import { ElementButton } from './ElementButton'

interface ElementToolbarProps {
  onAddElement: (element: FormElement) => void
  isMobile?: boolean
}

export function ElementToolbar({ onAddElement, isMobile = false }: ElementToolbarProps) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [isExpanded, setIsExpanded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const filteredElements = ELEMENTS.filter(el => {
    return activeCategory === 'all' || el.category === activeCategory
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0
    }
  }, [activeCategory])

  const quickCategories = ['all', 'Input', 'Pilihan', 'Skala', 'Tabel']

  const handleDragStart = (e: React.DragEvent, element: FormElement) => {
    e.dataTransfer.setData('elementType', element.type)
    e.dataTransfer.setData('elementLabel', element.label)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#080812] border-t border-white/[0.06]">
      {/* Kategori Filter */}
      <div className="flex gap-1 overflow-x-auto custom-scrollbar px-3 pt-2 pb-1.5">
        {(isMobile ? quickCategories : CATEGORIES).map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap ${
              activeCategory === cat.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Icon name={cat.icon as any} className="w-3 h-3 inline mr-1" />
            {cat.label}
          </button>
        ))}
        {isMobile && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 rounded-lg text-[10px] font-medium text-white/40 hover:text-white/70 transition-all whitespace-nowrap"
          >
            {isExpanded ? '✕' : '⋮'}
          </button>
        )}
      </div>

      {/* Elemen Grid */}
      <div
        ref={scrollRef}
        className={`flex gap-1 overflow-x-auto custom-scrollbar px-3 pb-3 transition-all duration-300 ${
          isMobile && !isExpanded ? 'max-h-[64px] overflow-y-hidden' : 'max-h-[120px] flex-wrap'
        }`}
      >
        {filteredElements.map((el) => (
          <ElementButton
            key={el.id}
            element={el}
            onClick={() => onAddElement(el)}
            onDragStart={handleDragStart}
          />
        ))}
      </div>
    </div>
  )
}