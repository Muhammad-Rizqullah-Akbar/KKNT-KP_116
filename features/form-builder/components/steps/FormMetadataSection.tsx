'use client'

import type { FormMetadata } from '@/lib/domain/forms/types'
import { Icon } from '@/components/ui/Icons'

interface FormMetadataSectionProps {
  metadata: FormMetadata
  currentCat: string
  currentTgt: string
  categoryOptions: string[]
  targetOptions: string[]
  isCustomCategory: boolean
  isCustomTarget: boolean
  setIsCustomCategory: (v: boolean) => void
  setIsCustomTarget: (v: boolean) => void
  onMetadataChange: (field: string, val: string) => void
}

export function FormMetadataSection({
  metadata,
  currentCat,
  currentTgt,
  categoryOptions,
  targetOptions,
  isCustomCategory,
  isCustomTarget,
  setIsCustomCategory,
  setIsCustomTarget,
  onMetadataChange,
}: FormMetadataSectionProps) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-5">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Icon name="info" className="w-4 h-4 text-cyan-400" />
          <span>Informasi Dasar Formulir</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">Detail judul dan petunjuk bagi responden sebelum mengisi kuesioner.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-semibold text-slate-300">Judul Penilaian / Kuesioner *</label>
          <input
            type="text"
            value={metadata.title}
            onChange={(e) => onMetadataChange('title', e.target.value)}
            placeholder="Contoh: Audit Keamanan Pangan Kantin Sekolah "
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-semibold text-slate-300">Deskripsi Singkat</label>
          <textarea
            rows={2}
            value={metadata.description || ''}
            onChange={(e) => onMetadataChange('description', e.target.value)}
            placeholder="Jelaskan tujuan evaluasi atau pengawasan ini..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all resize-none"
          />
        </div>

        {/* Kategori Evaluasi */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Kategori Evaluasi</label>
          <div className="space-y-2">
            <select
              value={isCustomCategory || categoryOptions.length === 0 ? 'custom' : currentCat || categoryOptions[0]}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setIsCustomCategory(true)
                } else {
                  setIsCustomCategory(false)
                  onMetadataChange('category', e.target.value)
                }
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500/50 transition-all"
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="custom">
                {categoryOptions.length === 0 ? 'Belum Ada Kategori Terdaftar — Ketik Baru' : 'Ketik Kategori Baru...'}
              </option>
            </select>

            {(isCustomCategory || categoryOptions.length === 0) && (
              <input
                type="text"
                autoFocus
                value={currentCat}
                onChange={(e) => onMetadataChange('category', e.target.value)}
                placeholder="Tuliskan nama kategori evaluasi baru..."
                className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-xs text-cyan-200 placeholder-slate-500 focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* Sasaran Responden */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Sasaran Responden</label>
          <div className="space-y-2">
            <select
              value={isCustomTarget || targetOptions.length === 0 ? 'custom' : currentTgt || targetOptions[0]}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setIsCustomTarget(true)
                } else {
                  setIsCustomTarget(false)
                  onMetadataChange('target', e.target.value)
                }
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500/50 transition-all"
            >
              {targetOptions.map((tgt) => (
                <option key={tgt} value={tgt}>
                  {tgt}
                </option>
              ))}
              <option value="custom">
                {targetOptions.length === 0 ? 'Belum Ada Sasaran Terdaftar — Ketik Baru' : 'Ketik Sasaran Responden Baru...'}
              </option>
            </select>

            {(isCustomTarget || targetOptions.length === 0) && (
              <input
                type="text"
                autoFocus
                value={currentTgt}
                onChange={(e) => onMetadataChange('target', e.target.value)}
                placeholder="Tuliskan sasaran responden baru..."
                className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-xs text-cyan-200 placeholder-slate-500 focus:outline-none"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
