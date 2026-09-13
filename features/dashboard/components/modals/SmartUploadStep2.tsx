// modals/SmartUploadStep2.tsx
// Step 2: tinjau materi terstruktur + lampiran foto.

'use client'

import { Icon } from '@/components/ui/Icons'
import type { ParsedArticle } from '@/lib/domain/articles/smart-article-parser'

interface SmartUploadStep2Props {
  parsedArticle: ParsedArticle
  attachedFiles: File[]
  setAttachedFiles: (updater: (prev: File[]) => File[]) => void
}

export function SmartUploadStep2({
  parsedArticle,
  attachedFiles,
  setAttachedFiles,
}: SmartUploadStep2Props) {
  return (
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
  )
}
