// components/ui/FileUpload.tsx

'use client'

import { useState, useRef } from 'react'
import { Icon } from './Icons'

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>
  accept?: string
  maxSize?: number // in MB
  label?: string
  className?: string
  multiple?: boolean
}

export function FileUpload({
  onUpload,
  accept = 'image/*',
  maxSize = 5,
  label = 'Upload File',
  className = '',
  multiple = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(null)
    
    // Validate size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File terlalu besar. Maksimal ${maxSize}MB.`)
      return
    }

    // Validate type
    if (accept !== '*/*') {
      const acceptTypes = accept.split(',').map(t => t.trim())
      const isValidType = acceptTypes.some(type => {
        if (type.endsWith('/*')) {
          const baseType = type.replace('/*', '')
          return file.type.startsWith(baseType)
        }
        return file.type === type
      })
      if (!isValidType) {
        setError(`Tipe file tidak didukung. Terima: ${accept}`)
        return
      }
    }

    setIsUploading(true)
    setProgress(0)

    try {
      await onUpload(file)
      setProgress(100)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      setError(err.message || 'Upload gagal')
    } finally {
      setIsUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      if (multiple) {
        Array.from(files).forEach(f => handleFile(f))
      } else {
        handleFile(files[0])
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      if (multiple) {
        Array.from(files).forEach(f => handleFile(f))
      } else {
        handleFile(files[0])
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  return (
    <div className={className}>
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-cyan-400/50 bg-cyan-500/5'
            : 'border-white/[0.08] hover:border-white/20'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          multiple={multiple}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-2">
            <Icon name="loader" className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
            <p className="text-sm text-white/60">Uploading... {Math.round(progress)}%</p>
            <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-400 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div>
            <Icon name="upload" className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/50">{label}</p>
            <p className="text-xs text-white/20 mt-1">
              Drag & drop atau klik untuk pilih file
            </p>
            {accept !== '*/*' && (
              <p className="text-xs text-white/20 mt-1">
                {accept.split(',').join(' • ')} • Max {maxSize}MB
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="text-xs text-rose-400 mt-2">{error}</p>
        )}
      </div>
    </div>
  )
}