// components/form-builder/ResizableToolbar.tsx

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Icon } from '@/components/ui/Icons'
import { ELEMENTS, CATEGORIES, FormElement } from './ElementTypes'
import { ElementButton } from './ElementButton'

interface ResizableToolbarProps {
  onAddElement: (element: FormElement) => void
  isMobile?: boolean
}

export function ResizableToolbar({ onAddElement, isMobile = false }: ResizableToolbarProps) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [height, setHeight] = useState(160)
  const [isDragging, setIsDragging] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)

  const filteredElements = ELEMENTS.filter(el => {
    return activeCategory === 'all' || el.category === activeCategory
  })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartY.current = e.clientY
    dragStartHeight.current = height
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'ns-resize'
  }, [height])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartY.current = e.touches[0].clientY
    dragStartHeight.current = height
    document.body.style.userSelect = 'none'
  }, [height])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const delta = dragStartY.current - e.clientY
      const newHeight = Math.min(Math.max(dragStartHeight.current + delta, 80), 400)
      setHeight(newHeight)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return
      const delta = dragStartY.current - e.touches[0].clientY
      const newHeight = Math.min(Math.max(dragStartHeight.current + delta, 80), 400)
      setHeight(newHeight)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('touchmove', handleTouchMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchend', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging, height])

  const quickCategories = ['all', 'Input', 'Pilihan', 'Skala', 'Tabel']

  const toggleExpand = () => {
    if (isExpanded) {
      setHeight(160)
    } else {
      setHeight(320)
    }
    setIsExpanded(!isExpanded)
  }

  const toggleOpen = () => {
    setIsOpen(!isOpen)
  }

  if (!isOpen) {
    return (
      <div 
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 bg-[#080812] border border-white/[0.06] rounded-full shadow-lg px-4 py-2 cursor-pointer hover:bg-white/[0.05] transition-all"
        onClick={toggleOpen}
      >
        <div className="flex items-center gap-2 text-white/50 text-xs">
          <Icon name="plus" className="w-3 h-3" />
          <span>Tambah Elemen</span>
        </div>
      </div>
    )
  }

  const toolbarLeft = isMobile ? '0px' : 'var(--sidebar-width, 288px)'

  return (
    <div
      ref={toolbarRef}
      className="fixed bottom-0 z-30 bg-[#080812] border-t border-white/[0.06] transition-all duration-150"
      style={{ 
        height: `${height}px`,
        left: toolbarLeft,
        right: 0,
      }}
    >
      {/* Drag Handle */}
      <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 flex items-center justify-center cursor-ns-resize group z-10"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="w-12 h-1 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors" />
      </div>

      {/* Tombol Close */}
      <button
        onClick={toggleOpen}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/[0.08] transition-colors group"
        title="Tutup toolbar"
      >
        <Icon name="x" className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
      </button>

      {/* Tombol Expand/Collapse */}
      <button
        onClick={toggleExpand}
        className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/[0.08] transition-colors group"
        title={isExpanded ? 'Perkecil' : 'Perbesar'}
      >
        <Icon name={isExpanded ? 'chevronDown' : 'chevronUp'} className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
      </button>

      {/* Kategori Filter */}
      <div className="flex gap-1 overflow-x-auto custom-scrollbar px-12 pt-4 pb-1.5">
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
      </div>

      {/* Elemen Grid */}
      <div
        className="flex gap-1 overflow-y-auto custom-scrollbar px-3 pb-3 transition-all duration-300 flex-wrap content-start"
        style={{ height: `calc(100% - 40px)` }}
      >
        {filteredElements.map((el) => (
          <ElementButton
            key={el.id}
            element={el}
            onClick={() => onAddElement(el)}
          />
        ))}
      </div>

      {/* Resize Indicator */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-transparent hover:bg-cyan-500/20 transition-colors cursor-ns-resize"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      />
    </div>
  )
}