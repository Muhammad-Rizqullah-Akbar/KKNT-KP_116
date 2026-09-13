'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Icon } from '@/components/ui/Icons'
import {
  parseRawTextToArticle,
  getSampleDraftText,
  cleanAndRepairJson,
  exportArticleToJson,
  type ParsedArticle,
} from '@/lib/domain/articles/smart-article-parser'
import { storage } from '@/lib/infra/firebase-client'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { SmartUploadStep1 } from '././SmartUploadStep1'
import { SmartUploadStep2 } from '././SmartUploadStep2'

interface SmartUploadArticleModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyArticle: (articleData: any, uploadedAttachedUrls?: string[]) => void
  currentUserName?: string
}

export function SmartUploadArticleModal({
  isOpen,
  onClose,
  onApplyArticle,
  currentUserName,
}: SmartUploadArticleModalProps) {
  // Wizard Steps: 1 = Input, 2 = Review & Photos
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)

  // Input Mode: 'text' (Paste Text/Doc) | 'file' (Upload File) | 'template' (Example Template)
  const [inputMode, setInputMode] = useState<'text' | 'file' | 'template'>('text')

  // Text state
  const [rawText, setRawText] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)

  // Attached local image files
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [uploadProgressText, setUploadProgressText] = useState('')

  // Drag & drop state
  const [isDragOver, setIsDragOver] = useState(false)

  // Error & warning state
  const [parseError, setParseError] = useState<string | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1)
      setParseError(null)
      if (!rawText.trim()) {
        // start blank
      }
    }
  }, [isOpen])

  // Live Parsing Result
  const parsedArticle = useMemo<ParsedArticle | null>(() => {
    if (!rawText.trim()) return null
    try {
      return parseRawTextToArticle(rawText, {
        defaultAuthor: currentUserName || 'Penulis KKPD-KP',
        defaultBio: 'Kader Edukator Keamanan Pangan BPOM',
      })
    } catch (err: any) {
      return null
    }
  }, [rawText, currentUserName])

  // Load sample draft
  const handleLoadSample = () => {
    const sample = getSampleDraftText()
    setRawText(sample)
    setUploadedFileName('contoh-draf-keamanan-pangan.txt')
    setInputMode('text')
  }

  // Handle File Input (.txt, .md, .json)
  const handleFileUpload = (file: File) => {
    setUploadedFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        setRawText(content)
      }
    }
    reader.readAsText(file)
  }

  // Handle Dropzone
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const docFile = files.find((f) => /\.(txt|md|json)$/i.test(f.name))
      const imageFiles = files.filter((f) => /\.(png|jpe?g|webp|gif)$/i.test(f.name))

      if (docFile) {
        handleFileUpload(docFile)
      }
      if (imageFiles.length > 0) {
        setAttachedFiles((prev) => [...prev, ...imageFiles])
      }
    }
  }

  // Handle finalize and submit to editor
  const handleFinalize = async () => {
    if (!parsedArticle) return
    setIsUploadingImages(true)
    setUploadProgressText('Menyiapkan materi artikel...')

    try {
      const uploadedUrls: string[] = []

      // Upload any attached local images to Firebase Storage
      if (attachedFiles.length > 0) {
        for (let i = 0; i < attachedFiles.length; i++) {
          const file = attachedFiles[i]
          setUploadProgressText(`Mengunggah gambar ${i + 1} dari ${attachedFiles.length}...`)
          try {
            const storageRef = ref(storage, `articles/${Date.now()}_${file.name}`)
            const snapshot = await uploadBytes(storageRef, file)
            const url = await getDownloadURL(snapshot.ref)
            uploadedUrls.push(url)
          } catch (e) {
            console.warn('Image upload failed:', e)
          }
        }
      }

      let featuredImage = parsedArticle.featuredImage
      if (!featuredImage && uploadedUrls.length > 0) {
        featuredImage = uploadedUrls.shift() || ''
      }

      const gallery = [...parsedArticle.gallery]
      uploadedUrls.forEach((imgUrl, idx) => {
        gallery.push({
          id: `g_upload_${Date.now()}_${idx}`,
          url: imgUrl,
          caption: `Dokumentasi Foto ${gallery.length + 1}`,
        })
      })

      const finalPayload = {
        title: parsedArticle.title,
        category: parsedArticle.category,
        author: parsedArticle.author,
        authorBio: parsedArticle.authorBio,
        status: parsedArticle.status,
        readTime: parsedArticle.readTime,
        featuredImage,
        excerpt: parsedArticle.excerpt,
        tags: parsedArticle.tags.join(', '),
        embeddedDistributionCode: parsedArticle.embeddedDistributionCode,
        gallery,
        blocks: parsedArticle.blocks,
      }

      onApplyArticle(finalPayload, uploadedUrls)
      onClose()
    } catch (err: any) {
      setParseError(err.message || 'Terjadi kesalahan saat memproses materi.')
    } finally {
      setIsUploadingImages(false)
      setUploadProgressText('')
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Icon name="upload" className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">Unggah / Impor Draf Artikel</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  OTOMATIS RAPI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tempel draf teks atau upload file (.txt / .md / .json). Sistem otomatis merapikan judul, sub-bab, dan poin penting.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        {/* STEP PROGRESS INDICATOR */}
        <div className="px-6 py-2.5 bg-slate-900/30 border-b border-slate-800/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 font-bold transition-colors ${
                currentStep === 1 ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep === 1 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                }`}
              >
                1
              </span>
              <span>1. Masukkan Draf / File</span>
            </button>

            <Icon name="chevronRight" className="w-3.5 h-3.5 text-slate-600" />

            <button
              onClick={() => {
                if (parsedArticle) setCurrentStep(2)
              }}
              disabled={!parsedArticle}
              className={`flex items-center gap-2 font-bold transition-colors disabled:opacity-40 ${
                currentStep === 2 ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep === 2 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                }`}
              >
                2
              </span>
              <span>2. Tinjau & Foto Pendukung</span>
            </button>
          </div>

          {parsedArticle && (
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              <Icon name="checkCircle" className="w-3.5 h-3.5" />
              <span>{parsedArticle.blocks.length} Blok Terstruktur</span>
            </div>
          )}
        </div>

        {/* BODY CONTENT SCROLLABLE */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-5">
          {/* ============ STEP 1: INPUT CONTENT ============ */}
          {currentStep === 1 && (
            <SmartUploadStep1
              inputMode={inputMode}
              setInputMode={setInputMode}
              rawText={rawText}
              setRawText={setRawText}
              uploadedFileName={uploadedFileName}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              handleDrop={handleDrop}
              handleFileUpload={handleFileUpload}
              handleLoadSample={handleLoadSample}
              parsedArticle={parsedArticle}
            />
          )}

          {/* ============ STEP 2: REVIEW & ATTACH PHOTOS ============ */}
          {currentStep === 2 && parsedArticle && (
            <SmartUploadStep2
              parsedArticle={parsedArticle}
              attachedFiles={attachedFiles}
              setAttachedFiles={setAttachedFiles}
            />
          )}

          {parseError && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 font-mono">
              ❌ {parseError}
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-slate-900/50">
          <div>
            {parsedArticle && (
              <button
                onClick={() => {
                  const jsonStr = exportArticleToJson(parsedArticle)
                  navigator.clipboard.writeText(jsonStr)
                  alert('Skema JSON artikel berhasil disalin ke clipboard!')
                }}
                className="text-xs text-slate-500 hover:text-slate-300 underline font-mono"
              >
                Salin Format JSON
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isUploadingImages}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              Batal
            </button>

            {currentStep === 1 ? (
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!parsedArticle}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 text-xs font-extrabold shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-2"
              >
                <span>Lanjut ke Tinjauan</span>
                <Icon name="chevronRight" className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep(1)}
                  disabled={isUploadingImages}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all"
                >
                  ← Kembali
                </button>
                <button
                  onClick={handleFinalize}
                  disabled={isUploadingImages}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold shadow-xl shadow-cyan-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isUploadingImages ? (
                    <>
                      <Icon name="spinner" className="w-4 h-4 animate-spin text-slate-950" />
                      <span>{uploadProgressText || 'Memproses...'}</span>
                    </>
                  ) : (
                    <>
                      <Icon name="check" className="w-4 h-4 text-slate-950 font-bold" />
                      <span>Gunakan di Editor Canvas →</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
