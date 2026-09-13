'use client'

import { Icon } from '@/components/ui/Icons'
import { FlexibleQuestion } from './../shared/ElementTypes'
import { getFileNameFromFirebaseUrl, cleanFileName, getFileExtension, getFileTypeFromUrl, formatFileSize, getFileIcon, getFileColor } from './../media-viewers/file-helpers'

interface PreviewMediaProps {
  question: FlexibleQuestion
  onOpenLightbox: (image: { src: string; alt: string }) => void
  onOpenPdf: (pdf: { src: string; fileName: string }) => void
  onOpenVideo: (video: { src: string; caption?: string }) => void
  onDownload: (url: string, fileName?: string) => void
}

export function PreviewMedia({ 
  question, 
  onOpenLightbox, 
  onOpenPdf, 
  onOpenVideo, 
  onDownload,
}: PreviewMediaProps) {
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

  if (question.media.type === 'image') {
    return (
      <div key={`media-${question.id}`} className="mb-3 rounded-xl overflow-hidden border border-white/5 max-w-md mx-auto relative group cursor-pointer" onClick={() => onOpenLightbox({ src: mediaUrl, alt: mediaCaption || displayFileName })}>
        <img src={mediaUrl} alt={mediaCaption || displayFileName} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto"><Icon name="search" className="w-7 h-7 text-white" /></div>
            <p className="text-xs text-white/90 mt-2 font-medium">Klik untuk zoom penuh</p>
          </div>
        </div>
      </div>
    )
  }

  if (question.media.type === 'video') {
    return (
      <div key={`media-${question.id}`} className="mb-3 rounded-xl overflow-hidden border border-white/5 max-w-md mx-auto relative cursor-pointer group" onClick={() => onOpenVideo({ src: mediaUrl, caption: mediaCaption || displayFileName })}>
        <div className="relative w-full h-48 bg-linear-to-br from-gray-900 to-black">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-cyan-500/80 flex items-center justify-center group-hover:bg-cyan-400 transition-all group-hover:scale-110 shadow-2xl">
              <svg className="w-8 h-8 text-white ml-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-black/80 to-transparent">
            <p className="text-xs text-white/70 font-medium">Klik untuk memutar video</p>
            {displayFileName && <p className="text-[10px] text-white/40 truncate mt-0.5">{displayFileName}</p>}
          </div>
        </div>
      </div>
    )
  }

  if (question.media.type === 'file') {
    return (
      <div key={`media-${question.id}`} className="mb-3 rounded-xl overflow-hidden border border-white/5 max-w-md mx-auto p-4 bg-white/2">
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
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); if (fileType === 'pdf') onOpenPdf({ src: mediaUrl, fileName: `${displayFileName}.${fileExtension}` }); else if (fileType === 'image') onOpenLightbox({ src: mediaUrl, alt: displayFileName }) }} className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${(fileType === 'pdf' || fileType === 'image') ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/20 cursor-not-allowed'}`} disabled={fileType !== 'pdf' && fileType !== 'image'}>
            <Icon name="eye" className="w-3.5 h-3.5" />{fileType === 'pdf' ? 'Lihat PDF' : fileType === 'image' ? 'Lihat Gambar' : 'Preview N/A'}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDownload(mediaUrl, `${displayFileName}.${fileExtension}`) }} className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/60 font-medium transition-all flex items-center justify-center gap-1.5">
            <Icon name="download" className="w-3.5 h-3.5" />Unduh
          </button>
        </div>
        {mediaCaption && <p className="text-xs text-white/30 p-2.5 text-center bg-black/20 border-t border-white/5 mt-3">{mediaCaption}</p>}
      </div>
    )
  }

  return null
}
