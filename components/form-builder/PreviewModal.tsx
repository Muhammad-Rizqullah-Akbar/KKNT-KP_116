// components/form-builder/PreviewModal.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Icon } from '@/components/ui/Icons'
import { FlexibleQuestion, IndicatorItem, IndicatorScale } from './ElementTypes'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  elements: FlexibleQuestion[]
  formTitle: string
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getFileNameFromFirebaseUrl(url: string): string {
  try {
    const decodedUrl = decodeURIComponent(url)
    const pathMatch = decodedUrl.match(/\/o\/(.+?)\?alt=media/)
    if (pathMatch && pathMatch[1]) {
      const fullPath = pathMatch[1]
      const fileName = fullPath.split('/').pop() || fullPath
      return fileName
    }
    const urlParts = decodedUrl.split('/')
    const lastPart = urlParts[urlParts.length - 1]
    return lastPart.split('?')[0]
  } catch {
    return 'unknown-file'
  }
}

function cleanFileName(fileName: string): string {
  let cleaned = fileName.replace(/^(img|file|doc|video|audio)_\d+_/, '')
  cleaned = cleaned.replace(/_/g, ' ')
  const nameWithoutExt = cleaned.replace(/\.[^/.]+$/, '')
  return nameWithoutExt || cleaned
}

function getFileExtension(url: string): string {
  try {
    const decoded = decodeURIComponent(url)
    const match = decoded.match(/\.([^./?]+)(\?|$)/)
    return match ? match[1].toLowerCase() : 'unknown'
  } catch {
    return 'unknown'
  }
}

function getFileTypeFromUrl(url: string): 'image' | 'pdf' | 'video' | 'document' | 'spreadsheet' | 'presentation' | 'unknown' {
  const ext = getFileExtension(url)
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv'].includes(ext)) return 'video'
  if (['doc', 'docx'].includes(ext)) return 'document'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spreadsheet'
  if (['ppt', 'pptx'].includes(ext)) return 'presentation'
  if (['txt', 'rtf', 'md'].includes(ext)) return 'document'
  return 'unknown'
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getFileIcon(fileType: string): string {
  switch (fileType) {
    case 'pdf': return 'fileText'
    case 'document': return 'fileText'
    case 'spreadsheet': return 'table'
    case 'presentation': return 'monitor'
    case 'video': return 'image'
    case 'image': return 'image'
    default: return 'fileText'
  }
}

function getFileColor(fileType: string): string {
  switch (fileType) {
    case 'pdf': return 'text-red-400 bg-red-500/10'
    case 'document': return 'text-blue-400 bg-blue-500/10'
    case 'spreadsheet': return 'text-green-400 bg-green-500/10'
    case 'presentation': return 'text-orange-400 bg-orange-500/10'
    case 'video': return 'text-purple-400 bg-purple-500/10'
    case 'image': return 'text-pink-400 bg-pink-500/10'
    default: return 'text-cyan-400 bg-cyan-500/10'
  }
}

// ============================================================================
// SIGNATURE PAD COMPONENT
// ============================================================================

function SignaturePad({ 
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
        className="relative rounded-xl overflow-hidden border-2 border-white/[0.08] hover:border-cyan-500/30 transition-colors mx-auto"
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
      <div className="flex items-center justify-between max-w-[500px] mx-auto">
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

// ============================================================================
// IMAGE LIGHTBOX COMPONENT (Zoom Gambar Full Screen)
// ============================================================================

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case '+':
        case '=':
          setZoomLevel(prev => Math.min(prev + 0.25, 5))
          break
        case '-':
          setZoomLevel(prev => Math.max(prev - 0.25, 0.5))
          break
        case '0':
          setZoomLevel(1)
          setPosition({ x: 0, y: 0 })
          break
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

  const resetZoom = () => {
    setZoomLevel(1)
    setPosition({ x: 0, y: 0 })
  }

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
    <div
      className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      {/* Top Toolbar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
            <span className="text-xs text-white/60">{Math.round(zoomLevel * 100)}%</span>
          </div>
          {alt && (
            <p className="text-sm text-white/70 truncate max-w-[200px] hidden sm:block">{alt}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); setZoomLevel(prev => Math.min(prev + 0.25, 5)) }}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Zoom In (+)"
          >
            <Icon name="plus" className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setZoomLevel(prev => Math.max(prev - 0.25, 0.5)) }}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Zoom Out (-)"
          >
            <Icon name="dash" className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); resetZoom() }}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Reset (0)"
          >
            <Icon name="search" className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDownload(src, alt) }}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Download"
          >
            <Icon name="download" className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors ml-2"
            title="Tutup (Esc)"
          >
            <Icon name="x" className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className="w-full h-full object-contain transition-transform duration-200 select-none pointer-events-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
          }}
          draggable={false}
        />
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-xs text-white/50 flex items-center gap-3">
          <span>🖱️ Scroll: Zoom</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>✋ Drag: Geser</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>0: Reset</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PDF VIEWER MODAL COMPONENT
// ============================================================================

function PDFViewerModal({ src, fileName, onClose }: { src: string; fileName: string; onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    const link = document.createElement('a')
    link.href = src
    link.download = fileName || 'dokumen.pdf'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const rawName = getFileNameFromFirebaseUrl(src)
  const displayName = cleanFileName(rawName)
  const extension = getFileExtension(src)

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/95 flex flex-col animate-fadeIn"
      onClick={onClose}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0e0e1a]/90 backdrop-blur-sm border-b border-white/10 shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
            <Icon name="fileText" className="w-4 h-4 text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white/80 font-medium truncate max-w-[250px] sm:max-w-[400px]" title={rawName}>
              {displayName}
            </p>
            <p className="text-[10px] text-white/30 uppercase">{extension}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all flex items-center gap-2 shadow-lg shadow-cyan-600/25"
            title="Download PDF"
          >
            <Icon name="download" className="w-4 h-4" />
            <span className="hidden sm:inline">Unduh</span>
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors ml-1"
            title="Tutup (Esc)"
          >
            <Icon name="x" className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 relative" onClick={(e) => e.stopPropagation()}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
                <Icon name="loader" className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
              <div>
                <p className="text-sm text-white/60 font-medium">Memuat Dokumen</p>
                <p className="text-xs text-white/30 mt-1">{displayName}</p>
              </div>
            </div>
          </div>
        )}
        
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md px-6">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                <Icon name="alertCircle" className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-white/60 font-medium">Gagal Memuat Pratinjau</p>
                <p className="text-xs text-white/30 mt-1">File PDF mungkin tidak dapat dirender di browser.</p>
              </div>
              <button
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all inline-flex items-center gap-2 shadow-lg shadow-cyan-600/25"
              >
                <Icon name="download" className="w-4 h-4" /> Unduh File
              </button>
            </div>
          </div>
        ) : (
          <iframe
            src={`${src}#toolbar=0&navpanes=1&scrollbar=1&view=FitH`}
            className="w-full h-full border-0"
            title={displayName}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false)
              setError('Gagal memuat PDF')
            }}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        )}
      </div>

      {/* Bottom Bar */}
      <div className="px-4 py-2 bg-[#0e0e1a]/90 backdrop-blur-sm border-t border-white/10 shrink-0 flex items-center justify-center gap-2">
        <p className="text-[10px] text-white/30">
          Tekan <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 text-[9px] font-mono">Esc</kbd> untuk menutup
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// VIDEO PLAYER MODAL COMPONENT
// ============================================================================

function VideoPlayerModal({ src, caption, onClose }: { src: string; caption?: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const controlsTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const isYouTubeLink = src.includes('youtube.com') || src.includes('youtu.be')
  const isGoogleDriveLink = src.includes('drive.google.com')

  const getEmbedUrl = () => {
    if (isYouTubeLink) {
      const videoId = src.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/)?.[1]
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1` : src
    }
    if (isGoogleDriveLink) {
      const fileId = src.match(/\/d\/([^/]+)/)?.[1]
      return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : src
    }
    return src
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) { videoRef.current.pause() } else { videoRef.current.play() }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime) }
  const handleLoadedMetadata = () => { if (videoRef.current) setDuration(videoRef.current.duration) }
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) { videoRef.current.currentTime = time; setCurrentTime(time) }
  }
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value); setVolume(vol)
    if (videoRef.current) { videoRef.current.volume = vol; setIsMuted(vol === 0) }
  }
  const toggleMute = () => { if (videoRef.current) { videoRef.current.muted = !isMuted; setIsMuted(!isMuted) } }
  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) { containerRef.current.requestFullscreen(); setIsFullscreen(true) }
      else { document.exitFullscreen(); setIsFullscreen(false) }
    }
  }
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const m = Math.floor(time / 60); const s = Math.floor(time % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }
  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = setTimeout(() => { if (isPlaying) setShowControls(false) }, 3000)
  }
  const skipTime = (seconds: number) => {
    if (videoRef.current) videoRef.current.currentTime = Math.min(Math.max(videoRef.current.currentTime + seconds, 0), duration)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': onClose(); break
        case ' ': e.preventDefault(); togglePlay(); break
        case 'ArrowLeft': skipTime(-10); break
        case 'ArrowRight': skipTime(10); break
        case 'ArrowUp': setVolume(prev => Math.min(prev + 0.1, 1)); break
        case 'ArrowDown': setVolume(prev => Math.max(prev - 0.1, 0)); break
        case 'f': toggleFullscreen(); break
        case 'm': toggleMute(); break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => { window.removeEventListener('keydown', handleKeyDown); if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current) }
  }, [onClose, isPlaying, duration])

  const rawName = getFileNameFromFirebaseUrl(src)
  const displayName = cleanFileName(rawName)

  return (
    <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center animate-fadeIn" onClick={onClose}>
      <div ref={containerRef} className="relative w-full max-w-5xl max-h-[90vh] mx-4 bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()} onMouseMove={handleMouseMove} onMouseLeave={() => isPlaying && setShowControls(false)}>
        <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-lg bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors z-20 backdrop-blur-sm"><Icon name="x" className="w-5 h-5 text-white" /></button>
        {displayName && !isYouTubeLink && !isGoogleDriveLink && (
          <div className="absolute top-4 left-4 z-20"><div className="px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm"><p className="text-xs text-white/80 truncate max-w-[300px]">{displayName}</p></div></div>
        )}
        {(isYouTubeLink || isGoogleDriveLink) ? (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe src={getEmbedUrl()} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={caption || displayName || 'Video Player'} />
          </div>
        ) : (
          <div className="relative group bg-black">
            <video ref={videoRef} src={src} className="w-full max-h-[80vh] cursor-pointer" onClick={togglePlay} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} playsInline />
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer z-10" onClick={togglePlay}>
                <div className="w-20 h-20 rounded-full bg-cyan-500/90 hover:bg-cyan-400 flex items-center justify-center transition-all hover:scale-110 shadow-2xl">
                  <svg className="w-10 h-10 text-white ml-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
              </div>
            )}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-16 pb-4 px-5 transition-opacity duration-300 z-10 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="relative mb-3 group/progress">
                <input type="range" min={0} max={duration || 0} value={currentTime} onChange={handleSeek} className="w-full h-1.5 rounded-full appearance-none bg-white/20 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:opacity-0 [&::-webkit-slider-thumb]:group-hover/progress:opacity-100" />
                <div className="absolute top-0 left-0 h-1.5 rounded-full bg-cyan-400 pointer-events-none" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="text-white hover:text-cyan-400 transition-colors">
                  {isPlaying ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  )}
                </button>
                <button onClick={() => skipTime(-10)} className="text-white/70 hover:text-white transition-colors hidden sm:block"><Icon name="chevronLeft" className="w-5 h-5" /></button>
                <button onClick={() => skipTime(10)} className="text-white/70 hover:text-white transition-colors hidden sm:block"><Icon name="chevronRight" className="w-5 h-5" /></button>
                <span className="text-xs text-white/70 font-mono min-w-[100px]">{formatTime(currentTime)} / {formatTime(duration)}</span>
                <div className="flex-1" />
                <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                  {isMuted || volume === 0 ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072" /><path strokeLinecap="round" strokeLinejoin="round" d="M17.95 6.05a8 8 0 010 11.9" /><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                  )}
                </button>
                <input type="range" min={0} max={1} step={0.05} value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-20 h-1 rounded-full appearance-none bg-white/20 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer" />
                <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors ml-1"><Icon name={isFullscreen ? 'minimize' : 'maximize'} className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        )}
        {caption && <div className="px-4 py-3 bg-[#0e0e1a]/90 backdrop-blur-sm border-t border-white/10"><p className="text-sm text-white/60 text-center">{caption}</p></div>}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PREVIEW MODAL COMPONENT
// ============================================================================

export function PreviewModal({
  isOpen,
  onClose,
  elements,
  formTitle,
}: PreviewModalProps) {
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({})
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({})
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null)
  const [pdfViewer, setPdfViewer] = useState<{ src: string; fileName: string } | null>(null)
  const [videoPlayer, setVideoPlayer] = useState<{ src: string; caption?: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      setPreviewAnswers({})
      Object.values(filePreviews).forEach(url => URL.revokeObjectURL(url))
      setFilePreviews({})
    }
  }, [isOpen])

  useEffect(() => {
    return () => {
      Object.values(filePreviews).forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !lightboxImage && !pdfViewer && !videoPlayer) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, lightboxImage, pdfViewer, videoPlayer])

  if (!isOpen) return null

  const handleAnswerChange = (questionId: string, value: any) => {
    setPreviewAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSimulatedFileUpload = (questionId: string, file: File | null) => {
    if (!file) return
    const localUrl = URL.createObjectURL(file)
    handleAnswerChange(questionId, file.name)
    
    if (file.type.startsWith('image/')) {
      setFilePreviews(prev => ({ ...prev, [questionId]: localUrl }))
    } else {
      setFilePreviews(prev => {
        const updated = { ...prev }
        delete updated[questionId]
        return updated
      })
    }
  }

  const handleDownload = (url: string, fileName?: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName || 'file'
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ============================================================================
  // RENDER MEDIA
  // ============================================================================

  const renderMedia = (question: FlexibleQuestion) => {
    if (question.media.type === 'none' || !question.media.url) return null
    
    const mediaUrl = question.media.url
    const mediaCaption = question.media.caption
    const rawFileName = getFileNameFromFirebaseUrl(mediaUrl)
    const displayFileName = cleanFileName(rawFileName)
    const fileExtension = getFileExtension(mediaUrl)
    const fileType = getFileTypeFromUrl(mediaUrl)
    const fileSize = (question.media as any).fileSize ? formatFileSize((question.media as any).fileSize) : null
    const fileIcon = getFileIcon(fileType)
    const fileColorClass = getFileColor(fileType)

    return (
      <div className="mb-3 rounded-xl overflow-hidden border border-white/[0.05] max-w-md mx-auto">
        {question.media.type === 'image' && (
          <div className="relative group cursor-pointer" onClick={() => setLightboxImage({ src: mediaUrl, alt: mediaCaption || displayFileName })}>
            <img src={mediaUrl} alt={mediaCaption || displayFileName} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto"><Icon name="search" className="w-7 h-7 text-white" /></div>
                <p className="text-xs text-white/90 mt-2 font-medium">Klik untuk zoom penuh</p>
                {displayFileName && <p className="text-[10px] text-white/50 mt-0.5 truncate max-w-[200px] mx-auto">{displayFileName}.{fileExtension}</p>}
              </div>
            </div>
          </div>
        )}

        {question.media.type === 'video' && (
          <div className="relative cursor-pointer group" onClick={() => setVideoPlayer({ src: mediaUrl, caption: mediaCaption || displayFileName })}>
            <div className="relative w-full h-48 bg-gradient-to-br from-gray-900 to-black">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-cyan-500/80 flex items-center justify-center group-hover:bg-cyan-400 transition-all group-hover:scale-110 shadow-2xl">
                  <svg className="w-8 h-8 text-white ml-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-xs text-white/70 font-medium">Klik untuk memutar video</p>
                {displayFileName && <p className="text-[10px] text-white/40 truncate mt-0.5">{displayFileName}</p>}
              </div>
              <div className="absolute top-3 right-3"><div className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center"><Icon name="image" className="w-4 h-4 text-purple-400" /></div></div>
            </div>
          </div>
        )}

        {question.media.type === 'file' && (
          <div className="p-4 bg-white/[0.02]">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl ${fileColorClass.split(' ')[1]} flex items-center justify-center shrink-0`}>
                <Icon name={fileIcon as any} className={`w-6 h-6 ${fileColorClass.split(' ')[0]}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white/80 font-medium truncate" title={rawFileName}>{displayFileName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-white/30 uppercase bg-white/5 px-1.5 py-0.5 rounded">{fileExtension}</span>
                  {fileSize && <><span className="w-1 h-1 rounded-full bg-white/10" /><span className="text-[10px] text-white/30">{fileSize}</span></>}
                </div>
                <p className="text-[9px] text-white/15 truncate mt-1" title={rawFileName}>{rawFileName}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); if (fileType === 'pdf') setPdfViewer({ src: mediaUrl, fileName: `${displayFileName}.${fileExtension}` }); else if (fileType === 'image') setLightboxImage({ src: mediaUrl, alt: displayFileName }) }}
                className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${(fileType === 'pdf' || fileType === 'image') ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400' : 'bg-white/[0.03] text-white/20 cursor-not-allowed'}`}
                disabled={fileType !== 'pdf' && fileType !== 'image'}>
                <Icon name="eye" className="w-3.5 h-3.5" />{fileType === 'pdf' ? 'Lihat PDF' : fileType === 'image' ? 'Lihat Gambar' : 'Preview N/A'}
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleDownload(mediaUrl, `${displayFileName}.${fileExtension}`) }} className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/60 font-medium transition-all flex items-center justify-center gap-1.5">
                <Icon name="download" className="w-3.5 h-3.5" />Unduh
              </button>
            </div>
          </div>
        )}

        {mediaCaption && <p className="text-xs text-white/30 p-2.5 text-center bg-black/20 border-t border-white/[0.03]">{mediaCaption}</p>}
      </div>
    )
  }

  // ============================================================================
  // RENDER QUESTION
  // ============================================================================

  const renderQuestion = (question: FlexibleQuestion, index: number) => {
    const answerType = question.answerType
    const config = question.config
    const requiredMark = question.required ? <span className="text-rose-400 ml-1">*</span> : null
    const currentAnswer = previewAnswers[question.id]

    switch (answerType) {
      case 'single-choice':
      case 'dropdown':
        return (
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
            {renderMedia(question)}
            {answerType === 'single-choice' ? (
              <div className="space-y-2">
                {(config.options || []).map((opt: string, i: number) => (
                  <label key={i} className="flex items-center gap-3 text-sm text-white/60 cursor-pointer hover:text-white transition-colors">
                    <input type="radio" name={`preview-${question.id}`} checked={currentAnswer === opt} onChange={() => handleAnswerChange(question.id, opt)} className="accent-cyan-400 w-4 h-4 cursor-pointer" />{opt}
                  </label>
                ))}
              </div>
            ) : (
              <select value={currentAnswer || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} className="w-full max-w-[300px] px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer">
                <option value="" className="bg-[#0e0e1a] text-white/40">Pilih opsi...</option>
                {(config.options || []).map((opt: string, i: number) => (<option key={i} value={opt} className="bg-[#0e0e1a]">{opt}</option>))}
              </select>
            )}
          </div>
        )

      case 'multiple-choice': {
        const selectedOptions = Array.isArray(currentAnswer) ? currentAnswer : []
        return (
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
            {renderMedia(question)}
            <div className="space-y-2">
              {(config.options || []).map((opt: string, i: number) => (
                <label key={i} className="flex items-center gap-3 text-sm text-white/60 cursor-pointer hover:text-white transition-colors">
                  <input type="checkbox" checked={selectedOptions.includes(opt)} onChange={(e) => {
                    if (e.target.checked) handleAnswerChange(question.id, [...selectedOptions, opt])
                    else handleAnswerChange(question.id, selectedOptions.filter((v: string) => v !== opt))
                  }} className="accent-cyan-400 w-4 h-4 cursor-pointer" />{opt}
                </label>
              ))}
            </div>
          </div>
        )
      }

      case 'short-text':
        return (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
            {renderMedia(question)}
            <input type="text" value={currentAnswer || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} placeholder={config.placeholder || 'Tulis jawaban Anda di sini...'} className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all" />
          </div>
        )

      case 'long-text':
        return (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
            {renderMedia(question)}
            <textarea value={currentAnswer || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} placeholder={config.placeholder || 'Tulis jawaban panjang Anda di sini...'} rows={4} className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all resize-none" />
          </div>
        )

      case 'indicator-table': {
        const indicators: IndicatorItem[] = config.indicators || []
        const scales: IndicatorScale[] = config.indicatorScales || []
        const indicatorTitle = config.indicatorTitle || 'Pertanyaan'
        const showTotal = config.showTotalScore || false
        const showWeighted = config.showWeightedScore || false

        if (indicators.length === 0 || scales.length === 0) {
          return (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3">
              <p className="text-sm font-medium text-white/90">{index + 1}. {question.question || 'Tabel Pertanyaan'} {requiredMark}</p>
              {renderMedia(question)}
              <div className="p-4 rounded-xl border-2 border-dashed border-white/[0.08] text-center">
                <Icon name="table" className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-xs text-white/30">{indicators.length === 0 ? 'Belum ada pertanyaan' : 'Belum ada skala jawaban'}</p>
              </div>
            </div>
          )
        }

        const calculateTotal = () => {
          let total = 0
          indicators.forEach((indicator: IndicatorItem, i: number) => {
            const rowKey = `${question.id}-${i}`
            const selLabel = previewAnswers[rowKey]
            const selScale = scales.find((s: IndicatorScale) => s.label === selLabel)
            const selValue = selScale?.value || 0
            const w = indicator.weight || 1
            total += showWeighted ? selValue * w : selValue
          })
          return total
        }

        return (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question || 'Tabel Pertanyaan'} {requiredMark}</p>
            {renderMedia(question)}
            {question.description && <p className="text-xs text-white/40">{question.description}</p>}
            <div className="overflow-x-auto custom-scrollbar rounded-lg border border-white/[0.05]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/[0.03]">
                    <th className="text-left text-xs text-white/40 font-medium py-2.5 px-3 border-r border-white/[0.05] w-10">#</th>
                    <th className="text-left text-xs text-white/40 font-medium py-2.5 px-3 border-r border-white/[0.05] min-w-[150px]">{indicatorTitle}</th>
                    {scales.map((scale: IndicatorScale, i: number) => (
                      <th key={i} className="text-center text-xs text-white/40 font-medium py-2.5 px-3 border-r border-white/[0.05]">{scale.label}</th>
                    ))}
                    {showTotal && <th className="text-center text-xs text-white/40 font-medium py-2.5 px-3">Skor</th>}
                  </tr>
                </thead>
                <tbody>
                  {indicators.map((indicator: IndicatorItem, i: number) => {
                    const rowKey = `${question.id}-${i}`
                    const selectedScale = previewAnswers[rowKey]
                    const selScale = scales.find((s: IndicatorScale) => s.label === selectedScale)
                    const selValue = selScale?.value || 0
                    const weight = indicator.weight || 1
                    const rowScore = showWeighted ? selValue * weight : selValue
                    return (
                      <tr key={indicator.id || i} className="border-t border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                        <td className="py-2.5 px-3 text-white/30 text-xs border-r border-white/[0.05] text-center">{i + 1}</td>
                        <td className="py-2.5 px-3 text-white/70 text-xs border-r border-white/[0.05]">
                          {indicator.label}
                          {showWeighted && weight !== 1 && <span className="text-[10px] text-cyan-400/60 ml-1">(×{weight})</span>}
                        </td>
                        {scales.map((scale: IndicatorScale, j: number) => (
                          <td key={j} className="text-center py-2.5 px-3 border-r border-white/[0.05]">
                            <input type="radio" name={`preview-indicator-${rowKey}`} checked={previewAnswers[rowKey] === scale.label} onChange={() => handleAnswerChange(rowKey, scale.label)} className="accent-cyan-400 w-4 h-4 cursor-pointer" />
                          </td>
                        ))}
                        {showTotal && (
                          <td className="text-center py-2.5 px-3">
                            <span className={`text-xs font-mono ${selValue > 0 ? 'text-cyan-400' : 'text-white/20'}`}>{selValue > 0 ? rowScore : '-'}</span>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                  {showTotal && (
                    <tr className="border-t border-white/[0.08] bg-white/[0.02] font-medium">
                      <td colSpan={2} className="py-3 px-3 text-white/60 text-xs text-right border-r border-white/[0.05]">Total Skor</td>
                      {scales.map((_: IndicatorScale, i: number) => (<td key={i} className="border-r border-white/[0.05]"></td>))}
                      <td className="text-center py-3 px-3"><span className="text-sm text-cyan-400 font-bold">{calculateTotal() > 0 ? calculateTotal() : '-'}</span></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      case 'rating': {
        const ratingVal = Number(currentAnswer) || 0
        const maxStars = config.ratingMax || 5
        return (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
            {renderMedia(question)}
            <div className="flex gap-2.5 items-center">
              {Array.from({ length: maxStars }, (_: any, i: number) => {
                const starIndex = i + 1
                return (
                  <button key={i} type="button" onClick={() => handleAnswerChange(question.id, starIndex)}
                    className={`text-3xl transition-all hover:scale-110 ${starIndex <= ratingVal ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'text-white/20'}`}>★</button>
                )
              })}
              {ratingVal > 0 && <span className="text-xs text-white/40 ml-2">({ratingVal} / {maxStars})</span>}
            </div>
          </div>
        )
      }

      case 'number':
        return (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
            {renderMedia(question)}
            <input type="number" value={currentAnswer || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} min={config.min} max={config.max} step={config.step} placeholder="0" className="w-full max-w-[150px] px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all" />
          </div>
        )

      case 'date':
        return (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
            {renderMedia(question)}
            <input type="date" value={currentAnswer || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} className="w-full max-w-[200px] px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer" />
          </div>
        )

      case 'file-upload': {
        const simulatedUrl = filePreviews[question.id]
        return (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
            {renderMedia(question)}
            <input type="file" id={`file-input-${question.id}`} accept={(config.fileTypes || []).join(',')} onChange={(e) => { const file = e.target.files?.[0] || null; handleSimulatedFileUpload(question.id, file) }} className="hidden" />
            <label htmlFor={`file-input-${question.id}`} className="block p-5 rounded-xl border-2 border-dashed border-white/[0.08] hover:border-cyan-500/40 hover:bg-cyan-500/5 text-center cursor-pointer transition-all">
              <Icon name="upload" className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/40">{currentAnswer ? `File terpilih: ${currentAnswer}` : 'Klik area ini untuk simulasi upload file'}</p>
              <p className="text-[10px] text-white/20 mt-1">Maksimal file {config.maxFileSize || 5}MB. Mendukung: {(config.fileTypes || ['image/*', 'application/pdf']).join(', ')}</p>
            </label>
            {simulatedUrl && (
              <div className="mt-3 relative rounded-xl overflow-hidden border border-white/[0.08] max-w-xs mx-auto group cursor-pointer" onClick={() => setLightboxImage({ src: simulatedUrl, alt: currentAnswer || 'Preview' })}>
                <img src={simulatedUrl} alt="Simulated Preview" className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-center"><Icon name="search" className="w-8 h-8 text-white mx-auto" /><p className="text-[10px] text-white mt-1">Klik untuk zoom penuh</p></div>
                </div>
              </div>
            )}
          </div>
        )
      }

      case 'signature':
        return (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3">
            <p className="text-sm font-medium text-white/90">
              {index + 1}. {question.question || 'Tanda Tangan'} {requiredMark}
            </p>
            {renderMedia(question)}
            {question.description && (
              <p className="text-xs text-white/40">{question.description}</p>
            )}
            <SignaturePad
              width={config.signatureWidth || 400}
              height={config.signatureHeight || 200}
              penColor={config.signaturePenColor || '#000000'}
              bgColor={config.signatureBgColor || '#ffffff'}
              label={config.signatureLabel || 'Tanda Tangan'}
              onChange={(dataUrl) => handleAnswerChange(question.id, dataUrl)}
            />
            {currentAnswer && (
              <div className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-center">
                <p className="text-[10px] text-cyan-400">
                  ✅ Tanda tangan tersimpan sebagai PNG ({(currentAnswer.length / 1024).toFixed(1)} KB)
                </p>
                <button
                  type="button"
                  onClick={() => handleAnswerChange(question.id, null)}
                  className="text-[10px] text-rose-400 hover:text-rose-300 mt-1"
                >
                  Hapus tanda tangan
                </button>
              </div>
            )}
          </div>
        )

      default:
        return (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
            <p className="text-xs text-white/20 mt-1">Tipe: {answerType}</p>
          </div>
        )
    }
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={onClose}>
        <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
            <div>
              <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />Mode Simulasi Kuesioner</h3>
              <p className="text-xs text-white/30 truncate max-w-[500px]">{formTitle || 'Formulir Tanpa Judul'}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center transition-colors"><Icon name="x" className="w-5 h-5 text-white/50" /></button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-grid-pattern">
            <div className="p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10 flex items-start gap-2.5 mb-2">
              <Icon name="info" className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-white/40 leading-relaxed">
                Anda berada di dalam sandbox <span className="text-cyan-400">Pratinjau Interaktif</span>. 
                Anda dapat mencoba mengisi formulir, melihat dokumen PDF, memutar video, zoom gambar, 
                dan mengunduh file secara aman tanpa memengaruhi database.
              </p>
            </div>
            {elements.length === 0 ? (
              <div className="text-center py-12 text-white/30"><Icon name="fileText" className="w-12 h-12 mx-auto mb-2 text-white/10" /><p className="text-sm">Belum ada elemen pertanyaan.</p></div>
            ) : (
              elements.map((element, index) => <div key={element.id}>{renderQuestion(element, index)}</div>)
            )}
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] flex-shrink-0">
            <span className="text-xs text-white/35 font-mono">{Object.keys(previewAnswers).length} Field Berinteraksi</span>
            <div className="flex gap-2">
              <button onClick={() => { setPreviewAnswers({}); setFilePreviews({}) }} disabled={Object.keys(previewAnswers).length === 0} className="px-4 py-2 rounded-xl text-xs font-medium bg-white/[0.02] border border-white/[0.06] text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">Reset Jawaban</button>
              <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25">Tutup Preview</button>
            </div>
          </div>
        </div>
      </div>
      {lightboxImage && <ImageLightbox src={lightboxImage.src} alt={lightboxImage.alt} onClose={() => setLightboxImage(null)} />}
      {pdfViewer && <PDFViewerModal src={pdfViewer.src} fileName={pdfViewer.fileName} onClose={() => setPdfViewer(null)} />}
      {videoPlayer && <VideoPlayerModal src={videoPlayer.src} caption={videoPlayer.caption} onClose={() => setVideoPlayer(null)} />}
    </>
  )
}