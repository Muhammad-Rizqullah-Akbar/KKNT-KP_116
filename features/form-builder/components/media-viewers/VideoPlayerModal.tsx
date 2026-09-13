'use client'

import { useState, useEffect, useRef } from 'react'
import { Icon } from '@/components/ui/Icons'
import { getFileNameFromFirebaseUrl, cleanFileName } from '././file-helpers'

export function VideoPlayerModal({ src, caption, onClose }: { src: string; caption?: string; onClose: () => void }) {
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

  const togglePlay = () => { if (videoRef.current) { if (isPlaying) videoRef.current.pause(); else videoRef.current.play(); setIsPlaying(!isPlaying) } }
  const handleTimeUpdate = () => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime) }
  const handleLoadedMetadata = () => { if (videoRef.current) setDuration(videoRef.current.duration) }
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => { const time = parseFloat(e.target.value); if (videoRef.current) { videoRef.current.currentTime = time; setCurrentTime(time) } }
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => { const vol = parseFloat(e.target.value); setVolume(vol); if (videoRef.current) { videoRef.current.volume = vol; setIsMuted(vol === 0) } }
  const toggleMute = () => { if (videoRef.current) { videoRef.current.muted = !isMuted; setIsMuted(!isMuted) } }
  const toggleFullscreen = () => { if (containerRef.current) { if (!document.fullscreenElement) { containerRef.current.requestFullscreen(); setIsFullscreen(true) } else { document.exitFullscreen(); setIsFullscreen(false) } } }
  const formatTime = (time: number) => { if (isNaN(time)) return '0:00'; const m = Math.floor(time / 60); const s = Math.floor(time % 60); return `${m}:${s.toString().padStart(2, '0')}` }
  const handleMouseMove = () => { setShowControls(true); if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); controlsTimerRef.current = setTimeout(() => { if (isPlaying) setShowControls(false) }, 3000) }
  const skipTime = (seconds: number) => { if (videoRef.current) videoRef.current.currentTime = Math.min(Math.max(videoRef.current.currentTime + seconds, 0), duration) }

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
    <div className="fixed inset-0 z-70 bg-black/95 flex items-center justify-center animate-fadeIn" onClick={onClose}>
      <div ref={containerRef} className="relative w-full max-w-5xl max-h-[90vh] mx-4 bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()} onMouseMove={handleMouseMove} onMouseLeave={() => isPlaying && setShowControls(false)}>
        <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-lg bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors z-20 backdrop-blur-sm"><Icon name="x" className="w-5 h-5 text-white" /></button>
        {displayName && !isYouTubeLink && !isGoogleDriveLink && (
          <div className="absolute top-4 left-4 z-20"><div className="px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm"><p className="text-xs text-white/80 truncate max-w-75">{displayName}</p></div></div>
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
            <div className={`absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/95 via-black/70 to-transparent pt-16 pb-4 px-5 transition-opacity duration-300 z-10 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="relative mb-3 group/progress">
                <input type="range" min={0} max={duration || 0} value={currentTime} onChange={handleSeek} className="w-full h-1.5 rounded-full appearance-none bg-white/20 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:opacity-0 [&::-webkit-slider-thumb]:group-hover/progress:opacity-100" />
                <div className="absolute top-0 left-0 h-1.5 rounded-full bg-cyan-400 pointer-events-none" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="text-white hover:text-cyan-400 transition-colors">
                  {isPlaying ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg> : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
                </button>
                <button onClick={() => skipTime(-10)} className="text-white/70 hover:text-white transition-colors hidden sm:block"><Icon name="chevronLeft" className="w-5 h-5" /></button>
                <button onClick={() => skipTime(10)} className="text-white/70 hover:text-white transition-colors hidden sm:block"><Icon name="chevronRight" className="w-5 h-5" /></button>
                <span className="text-xs text-white/70 font-mono min-w-25">{formatTime(currentTime)} / {formatTime(duration)}</span>
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
