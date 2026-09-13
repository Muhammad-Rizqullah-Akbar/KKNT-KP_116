'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/Icons'
import { getFileNameFromFirebaseUrl, cleanFileName, getFileExtension } from './file-helpers'

export function PDFViewerModal({ src, fileName, onClose }: { src: string; fileName: string; onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
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
    <div className="fixed inset-0 z-70 bg-black/95 flex flex-col animate-fadeIn" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 bg-[#0e0e1a]/90 backdrop-blur-sm border-b border-white/10 shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0"><Icon name="fileText" className="w-4 h-4 text-red-400" /></div>
          <div className="min-w-0">
            <p className="text-sm text-white/80 font-medium truncate max-w-62.5 sm:max-w-100" title={rawName}>{displayName}</p>
            <p className="text-[10px] text-white/30 uppercase">{extension}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleDownload} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all flex items-center gap-2 shadow-lg shadow-cyan-600/25"><Icon name="download" className="w-4 h-4" /><span className="hidden sm:inline">Unduh</span></button>
          <button onClick={onClose} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors ml-1" title="Tutup (Esc)"><Icon name="x" className="w-5 h-5 text-white" /></button>
        </div>
      </div>
      <div className="flex-1 relative" onClick={(e) => e.stopPropagation()}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto"><Icon name="loader" className="w-8 h-8 text-cyan-400 animate-spin" /></div>
              <div><p className="text-sm text-white/60 font-medium">Memuat Dokumen</p><p className="text-xs text-white/30 mt-1">{displayName}</p></div>
            </div>
          </div>
        )}
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md px-6">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto"><Icon name="alertCircle" className="w-8 h-8 text-amber-400" /></div>
              <div><p className="text-sm text-white/60 font-medium">Gagal Memuat Pratinjau</p><p className="text-xs text-white/30 mt-1">File PDF mungkin tidak dapat dirender di browser.</p></div>
              <button onClick={handleDownload} className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all inline-flex items-center gap-2 shadow-lg shadow-cyan-600/25"><Icon name="download" className="w-4 h-4" /> Unduh File</button>
            </div>
          </div>
        ) : (
          <iframe src={`${src}#toolbar=0&navpanes=1&scrollbar=1&view=FitH`} className="w-full h-full border-0" title={displayName} onLoad={() => setIsLoading(false)} onError={() => { setIsLoading(false); setError('Gagal memuat PDF') }} sandbox="allow-scripts allow-same-origin allow-popups allow-forms" />
        )}
      </div>
      <div className="px-4 py-2 bg-[#0e0e1a]/90 backdrop-blur-sm border-t border-white/10 shrink-0 flex items-center justify-center gap-2">
        <p className="text-[10px] text-white/30">Tekan <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 text-[9px] font-mono">Esc</kbd> untuk menutup</p>
      </div>
    </div>
  )
}
