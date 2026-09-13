'use client'

import { useState, useRef } from 'react'

export function SignaturePad({ 
  width = 400, 
  height = 200, 
  penColor = '#000000', 
  bgColor = '#ffffff',
  label = 'Tanda Tangan',
  onChange 
}: { 
  width?: number
  height?: number
  penColor?: string
  bgColor?: string
  label?: string
  onChange: (dataUrl: string | null) => void 
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDrawing(true)
    lastPos.current = getPos(e)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    const currentPos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current?.x || 0, lastPos.current?.y || 0)
    ctx.lineTo(currentPos.x, currentPos.y)
    ctx.strokeStyle = penColor
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = currentPos
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    lastPos.current = null
    if (canvasRef.current && hasSignature) {
      onChange(canvasRef.current.toDataURL('image/png'))
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <div 
        className="relative rounded-xl overflow-hidden border-2 border-white/8 hover:border-cyan-500/30 transition-colors mx-auto"
        style={{ width: Math.min(width, 500), height: Math.min(height, 250) }}
      >
        <canvas
          ref={canvasRef}
          width={Math.min(width, 500)}
          height={Math.min(height, 250)}
          className="w-full h-full cursor-crosshair touch-none"
          style={{ backgroundColor: bgColor }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-gray-400/50">Tanda tangan di sini</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between max-w-125 mx-auto">
        <p className="text-xs text-white/40">{label}</p>
        <div className="flex items-center gap-2">
          {hasSignature && (
            <>
              <button
                type="button"
                onClick={clearSignature}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                ✎ Ulang
              </button>
              <span className="text-white/20 text-xs">|</span>
              <span className="text-[10px] text-emerald-400/70">✅ Tersimpan</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
