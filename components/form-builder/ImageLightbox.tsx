'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/Icons'

export function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': onClose(); break
        case '+': case '=': setZoomLevel(prev => Math.min(prev + 0.25, 5)); break
        case '-': setZoomLevel(prev => Math.max(prev - 0.25, 0.5)); break
        case '0': setZoomLevel(1); setPosition({ x: 0, y: 0 }); break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoomLevel(prev => Math.min(Math.max(0.5, prev + delta), 5))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => setIsDragging(false)
  const resetZoom = () => { setZoomLevel(1); setPosition({ x: 0, y: 0 }) }

  const handleDownload = (url: string, name: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = name || 'image'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 z-70 bg-black/95 flex items-center justify-center animate-fadeIn" onClick={onClose}>
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
            <span className="text-xs text-white/60">{Math.round(zoomLevel * 100)}%</span>
          </div>
          {alt && <p className="text-sm text-white/70 truncate max-w-50 hidden sm:block">{alt}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={(e) => { e.stopPropagation(); setZoomLevel(prev => Math.min(prev + 0.25, 5)) }} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="Zoom In (+)"><Icon name="plus" className="w-5 h-5 text-white" /></button>
          <button onClick={(e) => { e.stopPropagation(); setZoomLevel(prev => Math.max(prev - 0.25, 0.5)) }} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="Zoom Out (-)"><Icon name="minus" className="w-5 h-5 text-white" /></button>
          <button onClick={(e) => { e.stopPropagation(); resetZoom() }} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="Reset (0)"><Icon name="search" className="w-4 h-4 text-white" /></button>
          <button onClick={(e) => { e.stopPropagation(); handleDownload(src, alt) }} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="Download"><Icon name="download" className="w-4 h-4 text-white" /></button>
          <button onClick={onClose} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors ml-2" title="Tutup (Esc)"><Icon name="x" className="w-5 h-5 text-white" /></button>
        </div>
      </div>
      <div className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel} onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt} className="w-full h-full object-contain transition-transform duration-200 select-none pointer-events-none" style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})` }} draggable={false} />
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-xs text-white/50 flex items-center gap-3">
          <span>🖱️ Scroll: Zoom</span><span className="w-1 h-1 rounded-full bg-white/20" /><span>✋ Drag: Geser</span><span className="w-1 h-1 rounded-full bg-white/20" /><span>0: Reset</span>
        </div>
      </div>
    </div>
  )
}
