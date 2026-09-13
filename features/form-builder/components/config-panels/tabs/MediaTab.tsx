// config-panels/tabs/MediaTab.tsx
// Tab "Media Lampiran" — tipe media, unggah berkas, embed video, caption.

'use client'

import { useState, useRef } from 'react'
import { Icon } from '@/components/ui/Icons'
import { FlexibleQuestion, MEDIA_TYPES } from './../../shared/ElementTypes'
import { uploadImage } from '@/lib/infra/storage'

interface MediaTabProps {
  element: FlexibleQuestion
  setElement: (updated: FlexibleQuestion) => void
  formId?: string | null
  formCode?: string
}

export function MediaTab({ element, setElement, formId, formCode }: MediaTabProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const media = element.media

  const handleFileUpload = async (file: File) => {
    const storageFolder = formId || formCode || 'temp_builder'

    let detectedType: 'image' | 'file' = 'file'
    if (file.type.startsWith('image/')) {
      detectedType = 'image'
    }

    setIsUploading(true)
    setUploadProgress(0)
    try {
      const url = await uploadImage(
        file,
        'forms',
        storageFolder,
        (progress) => {
          setUploadProgress(progress.progress)
        }
      )

      setElement({
        ...element,
        media: {
          ...element.media,
          type: detectedType,
          url: url,
          caption: element.media.caption || file.name,
        }
      })

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Gagal mengunggah dokumen. Silakan coba lagi.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 uppercase tracking-wider">Tipe Lampiran Media</label>
        <div className="grid grid-cols-4 gap-2">
          {MEDIA_TYPES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setElement({
                ...element,
                media: { type: m.value, url: '', caption: '' }
              })}
              className={`p-3 rounded-xl text-center transition-all border ${
                media.type === m.value
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                  : 'bg-white/[0.02] text-white/50 hover:text-white/80 border-white/[0.05]'
              }`}
            >
              <Icon name={m.icon as any} className="w-5 h-5 mx-auto mb-1" />
              <span className="text-[10px] block">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {(media.type === 'image' || media.type === 'file') && (
        <div className="space-y-3">
          <label className="text-xs text-white/50 uppercase tracking-wider block">
            {media.type === 'image' ? 'Unggah Berkas Gambar (JPG, PNG)' : 'Unggah Berkas Dokumen (PDF, Word, Docx, xlsx)'}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept={media.type === 'image' ? 'image/*' : '.pdf,.doc,.docx,.xls,.xlsx,.txt'}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file)
            }}
            className="hidden"
          />
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isUploading ? 'opacity-50 pointer-events-none border-cyan-400/40 bg-cyan-500/5' : 'border-white/[0.08] hover:border-cyan-500/30'
            }`}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            {isUploading ? (
              <div className="space-y-2">
                <Icon name="loader" className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
                <p className="text-xs text-white/50">Mengunggah ke Firebase Storage... {Math.round(uploadProgress)}%</p>
              </div>
            ) : (
              <div>
                <Icon name="upload" className="w-6 h-6 text-white/20 mx-auto mb-1" />
                <p className="text-xs text-white/40">Klik atau seret berkas untuk diunggah</p>
                <p className="text-[10px] text-white/20">Maksimal kapasitas file: 5MB</p>
              </div>
            )}
          </div>

          {media.url && media.type === 'file' && (
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
              <Icon name="fileText" className="w-8 h-8 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">Dokumen Berhasil Terupload</p>
                <a href={media.url} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline">
                  Buka tautan file di tab baru ↗
                </a>
              </div>
              <button
                type="button"
                onClick={() => setElement({ ...element, media: { ...media, url: '' } })}
                className="p-1 rounded-md hover:bg-white/[0.05] text-white/30 hover:text-white shrink-0"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>
          )}

          {media.url && media.type === 'image' && (
            <div className="mt-2 relative rounded-xl overflow-hidden border border-white/[0.06] max-w-sm mx-auto">
              <img src={media.url} alt="Media Asset" className="w-full h-36 object-cover" />
              <button
                type="button"
                onClick={() => setElement({ ...element, media: { ...media, url: '' } })}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white/70 hover:text-white"
              >
                <Icon name="x" className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {media.type === 'video' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wider block">Tautan Embed Video</label>
            <input
              type="text"
              value={media.url || ''}
              onChange={(e) => setElement({
                ...element,
                media: { ...media, url: e.target.value }
              })}
              placeholder="Masukkan link YouTube atau Link Share Google Drive..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40"
            />
            <p className="text-[10px] text-amber-400/80 leading-normal">
              💡 Sistem mengunci integrasi tautan luar guna menghemat bandwidth kuota Firebase server. Silakan pakai link sharing umum.
            </p>
          </div>

          {media.url && (
            <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-xs text-cyan-400 flex items-center gap-2">
              <Icon name="checkCircle" className="w-4 h-4 shrink-0" />
              <span className="truncate">Tautan video berhasil direkam: {media.url}</span>
            </div>
          )}
        </div>
      )}

      {media.type !== 'none' && (
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 uppercase tracking-wider block">Caption / Judul Media</label>
          <input
            type="text"
            value={media.caption || ''}
            onChange={(e) => setElement({
              ...element,
              media: { ...media, caption: e.target.value }
            })}
            placeholder="Tulis judul berkas atau arahan media..."
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-cyan-400/40"
          />
        </div>
      )}
    </div>
  )
}
