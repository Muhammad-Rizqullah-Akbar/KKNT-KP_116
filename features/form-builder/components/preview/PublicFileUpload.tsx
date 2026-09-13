'use client'

import React from 'react'
import { Icon } from '@/components/ui/Icons'
import type { PublicQuestion } from '@/lib/domain/forms/types'

interface PublicFileUploadProps {
  question: PublicQuestion
  value: any
  onChange: (val: any) => void
  isDisabled: boolean
}

export function PublicFileUpload({
  question,
  value,
  onChange,
  isDisabled,
}: PublicFileUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const isImageOnly = question.type === 'image'
  const maxMb = question.presentation?.maxFileSizeMb || 5
  const currentUrl = typeof value === 'string' ? value : value?.url || ''

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    if (file.size > maxMb * 1024 * 1024) {
      setUploadError(`Ukuran berkas melebihi batas maksimum (${maxMb}MB).`)
      return
    }

    setIsUploading(true)
    setUploadProgress(10)

    try {
      const { uploadResponseFile } = await import('@/lib/infra/storage')
      const url = await uploadResponseFile(
        file,
        'public_response',
        question.questionId,
        (prog) => setUploadProgress(Math.round(prog.progress))
      )
      onChange(url)
    } catch (err: any) {
      console.error('File upload failed:', err)
      setUploadError(err.message || 'Gagal mengunggah berkas ke storage. Silakan coba lagi.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClear = () => {
    onChange('')
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (currentUrl) {
    return (
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {isImageOnly || currentUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) ? (
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentUrl} alt="Pratinjau Berkas" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Icon name="fileText" className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                <Icon name="checkCircle" className="w-4 h-4" /> Berkas Terunggah
              </span>
              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-300 hover:text-cyan-400 underline truncate block font-mono"
              >
                {currentUrl.split('/').pop() || 'Lihat Berkas Terunggah'}
              </a>
            </div>
          </div>

          {!isDisabled && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center gap-1.5 transition-colors"
            >
              <Icon name="trash" className="w-3.5 h-3.5" />
              <span>Ganti</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={isImageOnly ? 'image/*' : undefined}
        onChange={handleFileChange}
        disabled={isDisabled || isUploading}
        className="hidden"
      />

      <div
        onClick={() => !isDisabled && !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center space-y-3 transition-all cursor-pointer ${
          isUploading
            ? 'border-cyan-500/50 bg-cyan-950/20'
            : 'border-slate-800 hover:border-cyan-500/60 bg-slate-950/60 hover:bg-slate-900/60'
        }`}
      >
        {isUploading ? (
          <div className="space-y-3">
            <Icon name="loader" className="w-8 h-8 mx-auto text-cyan-400 animate-spin" />
            <p className="text-xs font-bold text-cyan-300 font-mono">Mengunggah ke Firebase Storage... {uploadProgress}%</p>
            <div className="w-full max-w-xs mx-auto h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div className="h-full bg-cyan-500 transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mx-auto">
              <Icon name="upload" className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Klik di sini untuk memilih berkas</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isImageOnly ? 'Format: JPG, PNG, WEBP' : 'Semua format berkas diperbolehkan'} • Maks: {maxMb}MB
              </p>
            </div>
          </>
        )}
      </div>

      {uploadError && (
        <p className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 px-1">
          <Icon name="alertCircle" className="w-3.5 h-3.5" />
          <span>{uploadError}</span>
        </p>
      )}
    </div>
  )
}
