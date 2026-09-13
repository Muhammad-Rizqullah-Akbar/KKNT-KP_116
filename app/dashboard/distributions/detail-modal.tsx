'use client'

import { Icon } from '@/components/ui/Icons'
import type { DistributionDetail } from './types'

interface DetailModalProps {
  isOpen: boolean
  isLoading: boolean
  detail: DistributionDetail | null
  onClose: () => void
  onCopyLink: (code: string) => void
}

export default function DetailModal({ isOpen, isLoading, detail, onClose, onCopyLink }: DetailModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Inspeksi Detail Kode Distribusi
            </span>
            <h3 className="text-base font-extrabold text-slate-100 mt-0.5">
              {detail?.distribution.code || 'Memuat...'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 flex items-center justify-center text-xs text-slate-400 gap-2">
            <Icon name="loader" className="w-5 h-5 text-cyan-400 animate-spin" />
            <span>Mengambil metadata distribusi & skema kuesioner...</span>
          </div>
        ) : detail ? (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400 font-mono uppercase">Judul Channel</p>
                <p className="text-xs font-bold text-slate-100 mt-0.5">{detail.distribution.title}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400 font-mono uppercase">Status Distribusi</p>
                <p className="text-xs font-bold text-emerald-400 uppercase mt-0.5">
                  {detail.distribution.status} ✓
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400 font-mono uppercase">Pemilik (Owner)</p>
                <p className="text-xs font-bold text-purple-300 mt-0.5">
                  {detail.distribution.ownerName} ({detail.distribution.ownerType})
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400 font-mono uppercase">Resolusi Versi</p>
                <p className="text-xs font-mono font-bold text-cyan-300 mt-0.5">
                  {detail.distribution.versionMode === 'pinned'
                    ? `Pinned (${detail.distribution.pinnedVersionId})`
                    : 'Auto-Active (Versi Publik Terbaru)'}
                </p>
              </div>
            </div>

            {detail.formSummary && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">
                    Skema Formulir: {detail.formSummary.title}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                    {detail.formSummary.questionCount} Pertanyaan
                  </span>
                </div>

                <div className="space-y-1.5 font-mono text-[11px] max-h-44 overflow-y-auto pr-1">
                  {detail.formSummary.questions.map((q: any, i: number) => (
                    <div key={q.id || i} className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-slate-300 truncate">#{i + 1}. {q.prompt}</span>
                      <span className="text-[9px] text-slate-500 uppercase flex-shrink-0">{q.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
              <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase">Tautan Publik Kuesioner</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/form/${detail.distribution.code}`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => onCopyLink(detail.distribution.code)}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Icon name="copy" className="w-3.5 h-3.5" />
                  <span>Salin</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
