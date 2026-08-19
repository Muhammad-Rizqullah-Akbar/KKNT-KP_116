'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Icon } from '@/components/ui/Icons'
import {
  parseRawTextToArticle,
  getSampleDraftText,
  cleanAndRepairJson,
  exportArticleToJson,
  type ParsedArticle,
} from '@/lib/cms/smartArticleParser'
import { storage } from '@/lib/firebaseClient'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

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
            <div className="space-y-4">
              {/* Input Mode Switcher */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setInputMode('text')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      inputMode === 'text'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon name="fileText" className="w-3.5 h-3.5" />
                    Tempel Draf Teks
                  </button>

                  <button
                    onClick={() => setInputMode('file')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      inputMode === 'file'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon name="upload" className="w-3.5 h-3.5" />
                    Upload File (.txt/.md/.json)
                  </button>

                  <button
                    onClick={() => setInputMode('template')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      inputMode === 'template'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon name="clipboardList" className="w-3.5 h-3.5" />
                    Contoh Format
                  </button>
                </div>

                <button
                  onClick={handleLoadSample}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                >
                  <Icon name="sparkles" className="w-3.5 h-3.5" />
                  Coba Contoh Draf Otomatis
                </button>
              </div>

              {/* MODE 1: TEMPEL TEKS */}
              {inputMode === 'text' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Ketik atau tempel draf artikel dari Word / Docs / Catatan:</span>
                    {rawText.length > 0 && (
                      <span className="font-mono text-cyan-400">
                        {rawText.split(/\s+/).filter(Boolean).length} kata terdeteksi
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={10}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`Judul: 5 Kunci Keamanan Pangan Keluarga Sehat\nKategori: Keamanan Pangan\nPenulis: Dr. Ahmad Hidayat\nKode Distribusi: KKPDR48\n\nPangan yang aman dan higienis sangat penting bagi kesehatan keluarga...\n\n1. Pentingnya Kebersihan Tangan\nCuci tangan dengan sabun sebelum mengolah makanan...\n\n2. Panduan Mengolah Makanan\n- Jaga kebersihan dapur\n- Pisahkan bahan mentah dan matang`}
                    className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 leading-relaxed custom-scrollbar"
                  />
                </div>
              )}

              {/* MODE 2: UPLOAD FILE DRAG AND DROP */}
              {inputMode === 'file' && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragOver(true)
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-3 ${
                    isDragOver
                      ? 'border-cyan-400 bg-cyan-500/10'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Icon name="upload" className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">
                      Tarik & Lepas File Draf ke Sini
                    </p>
                    <p className="text-xs text-slate-400">
                      Mendukung format file <code className="text-cyan-300">.txt</code>,{' '}
                      <code className="text-cyan-300">.md</code>, atau{' '}
                      <code className="text-cyan-300">.json</code>
                    </p>
                  </div>

                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono transition-all shadow-md">
                    <span>Pilih File dari Komputer</span>
                    <input
                      type="file"
                      accept=".txt,.md,.json,application/json,text/plain,text/markdown"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file)
                      }}
                      className="hidden"
                    />
                  </label>

                  {uploadedFileName && (
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                      <Icon name="checkCircle" className="w-4 h-4" />
                      <span>File berhasil dimuat: {uploadedFileName}</span>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 3: TEMPLATE PANDUAN */}
              {inputMode === 'template' && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-white text-sm">💡 Format Draf Sederhana yang Didukung</h4>
                    <button
                      onClick={handleLoadSample}
                      className="px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs font-mono"
                    >
                      Gunakan Template Ini
                    </button>
                  </div>

                  <p className="text-slate-400 leading-relaxed">
                    Anda tidak perlu menghafal kode khusus. Cukup tulis draf seperti biasa dengan format berikut:
                  </p>

                  <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-cyan-300 space-y-1 border border-slate-800/80">
                    <p><span className="text-purple-400 font-bold">Judul:</span> [Nama Artikel Anda]</p>
                    <p><span className="text-purple-400 font-bold">Kategori:</span> Keamanan Pangan / Teknologi / Regulasi / Tips & Trik / Berita</p>
                    <p><span className="text-purple-400 font-bold">Penulis:</span> [Nama Penulis]</p>
                    <p><span className="text-purple-400 font-bold">Kode Distribusi:</span> [Kode Kuesioner jika ada, misal KKPDR48]</p>
                    <p><span className="text-slate-500">---</span></p>
                    <p>[Paragraf pembuka artikel...]</p>
                    <p><span className="text-emerald-400 font-bold">1. Sub-bab Pertama</span> (Otomatis jadi Judul Bagian)</p>
                    <p>[Isi penjelasan...]</p>
                    <p><span className="text-emerald-400 font-bold">- Poin daftar 1</span></p>
                    <p><span className="text-emerald-400 font-bold">- Poin daftar 2</span></p>
                  </div>
                </div>
              )}

              {/* REAL-TIME PREVIEW CARD SUMMARY */}
              {parsedArticle && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/30 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <Icon name="sparkles" className="w-3.5 h-3.5" />
                      Hasil Pemindaian Cerdas (Siap Diimpor)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {parsedArticle.category}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-white line-clamp-1">
                      {parsedArticle.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {parsedArticle.excerpt}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
                    <span>👤 {parsedArticle.author}</span>
                    <span>⏱️ ~{parsedArticle.readTime} menit baca</span>
                    {parsedArticle.embeddedDistributionCode && (
                      <span className="text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                        🔗 Kode Kuesioner: {parsedArticle.embeddedDistributionCode}
                      </span>
                    )}
                    <span>📑 {parsedArticle.blocks.length} Elemen Konten</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============ STEP 2: REVIEW & ATTACH PHOTOS ============ */}
          {currentStep === 2 && parsedArticle && (
            <div className="space-y-5">
              {/* Detailed Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Icon name="eye" className="w-4 h-4 text-cyan-400" />
                  Rincian Materi Terstruktur
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Judul Artikel</span>
                    <p className="font-bold text-white">{parsedArticle.title}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Kategori & Waktu Baca</span>
                    <p className="font-bold text-cyan-300">
                      {parsedArticle.category} • ~{parsedArticle.readTime} Menit
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Penulis & Bio</span>
                    <p className="font-bold text-slate-200">
                      {parsedArticle.author} ({parsedArticle.authorBio})
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Interaktivitas Kuesioner</span>
                    <p className="font-bold text-purple-300">
                      {parsedArticle.embeddedDistributionCode
                        ? `Terhubung ke Distribusi ${parsedArticle.embeddedDistributionCode}`
                        : 'Materi Edukasi Standar'}
                    </p>
                  </div>
                </div>

                {/* Blocks Breakdown Preview */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Susunan Blok Konten ({parsedArticle.blocks.length}):</span>
                  <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                    {parsedArticle.blocks.map((b, idx) => (
                      <div
                        key={b.id || idx}
                        className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800/60 text-xs"
                      >
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            b.type === 'h2'
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : b.type === 'quote'
                              ? 'bg-amber-500/20 text-amber-300'
                              : b.type === 'list'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : b.type === 'image'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {b.type.toUpperCase()}
                        </span>
                        <span className="text-slate-300 truncate flex-1">
                          {b.value || b.imageCaption || b.imageUrl || 'Konten'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Photo Attachments (Optional & Simple) */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <Icon name="image" className="w-4 h-4 text-emerald-400" />
                      Lampirkan Foto Banner & Galeri (Opsional)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Pilih foto dari komputer untuk otomatis diunggah dan dijadikan cover artikel & galeri dokumentasi.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 font-bold text-xs font-mono transition-all flex items-center gap-2 shrink-0">
                    <Icon name="upload" className="w-4 h-4" />
                    <span>Pilih Foto (.jpg / .png)</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)])
                        }
                      }}
                      className="hidden"
                    />
                  </label>

                  <div className="text-xs text-slate-400 flex-1">
                    {attachedFiles.length > 0 ? (
                      <span className="text-emerald-300 font-mono font-bold">
                        ✓ {attachedFiles.length} foto siap diunggah ke Firebase Storage.
                      </span>
                    ) : (
                      <span>Belum ada foto yang dipilih. Artikel tetap bisa dibuat dengan ilustrasi default.</span>
                    )}
                  </div>
                </div>

                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {attachedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                      >
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <button
                          onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <Icon name="x" className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
