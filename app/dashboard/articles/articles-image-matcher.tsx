'use client'

import { Dispatch, SetStateAction } from 'react'
import { Icon } from '@/components/ui/Icons'
import type { DetectedMarker } from './articles-types'

type ArticlesImageMatcherProps = {
  isOpen: boolean
  detectedMarkers: DetectedMarker[]
  setDetectedMarkers: Dispatch<SetStateAction<DetectedMarker[]>>
  handleApplyMatchedImages: () => void
  setIsImageMatcherOpen: Dispatch<SetStateAction<boolean>>
  setIsPreviewOpen: Dispatch<SetStateAction<boolean>>
}

export default function ArticlesImageMatcher({
  isOpen,
  detectedMarkers,
  setDetectedMarkers,
  handleApplyMatchedImages,
  setIsImageMatcherOpen,
  setIsPreviewOpen,
}: ArticlesImageMatcherProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" onClick={() => setIsImageMatcherOpen(false)}>
      <div className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Icon name="image" className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Ditemukan Tag Gambar pada File JSON</h3>
              <p className="text-xs text-slate-400">Silakan unggah foto untuk setiap penanda (Mark) yang terdeteksi</p>
            </div>
          </div>
          <button onClick={() => setIsImageMatcherOpen(false)} className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Sistem mengidentifikasi <strong>{detectedMarkers.length} tag/penanda gambar</strong> pada file JSON artikel. Unggah file gambar lokal untuk tiap tag berikut:
          </p>

          <div className="space-y-3">
            {detectedMarkers.map((marker, idx) => (
              <div key={marker.key || idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    Tag #{idx + 1}: {marker.label}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold uppercase">
                    {marker.targetType}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setDetectedMarkers((prev) =>
                          prev.map((m, i) => (i === idx ? { ...m, file } : m))
                        )
                      }
                    }}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-950 file:text-amber-300 hover:file:bg-amber-900 border border-slate-800 rounded-xl p-1 bg-slate-950"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <button onClick={() => { setIsImageMatcherOpen(false); setIsPreviewOpen(true); }} className="px-4 py-2 text-xs text-slate-400 hover:text-white">
            Lewati (Gunakan Fallback)
          </button>

          <button
            onClick={handleApplyMatchedImages}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20"
          >
            Terapkan Foto & Lanjut ke Preview →
          </button>
        </div>
      </div>
    </div>
  )
}
