// modals/SmartUploadStep1.tsx
// Step 1: input draf (tempel teks / upload file / template).

'use client'

import React from 'react'
import { Icon } from '@/components/ui/Icons'
import type { ParsedArticle } from '@/lib/domain/articles/smart-article-parser'

interface SmartUploadStep1Props {
  inputMode: 'text' | 'file' | 'template'
  setInputMode: (mode: 'text' | 'file' | 'template') => void
  rawText: string
  setRawText: (value: string) => void
  uploadedFileName: string | null
  isDragOver: boolean
  setIsDragOver: (value: boolean) => void
  handleDrop: (e: React.DragEvent) => void
  handleFileUpload: (file: File) => void
  handleLoadSample: () => void
  parsedArticle: ParsedArticle | null
}

export function SmartUploadStep1({
  inputMode,
  setInputMode,
  rawText,
  setRawText,
  uploadedFileName,
  isDragOver,
  setIsDragOver,
  handleDrop,
  handleFileUpload,
  handleLoadSample,
  parsedArticle,
}: SmartUploadStep1Props) {
  return (
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
  )
}
