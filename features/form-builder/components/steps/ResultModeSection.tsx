'use client'

import type { AssessmentOutputMode } from '@/lib/domain/forms/types'
import { Icon } from '@/components/ui/Icons'

interface ResultModeSectionProps {
  currentOutputMode: AssessmentOutputMode
  onSelectOutputMode: (mode: AssessmentOutputMode) => void
}

export function ResultModeSection({ currentOutputMode, onSelectOutputMode }: ResultModeSectionProps) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-5">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Icon name="award" className="w-4 h-4 text-purple-400" />
          <span>Mode Penyajian Hasil Assessment (Result Mode)</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">Pilih bagaimana hasil skor akhir akan disajikan kepada responden dan pengawas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: PER_ASPECT */}
        <button
          type="button"
          onClick={() => onSelectOutputMode('per_aspect')}
          className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
            currentOutputMode === 'per_aspect'
              ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/10'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-cyan-400">Mode 01</span>
              {currentOutputMode === 'per_aspect' && <Icon name="checkCircle" className="w-4 h-4 text-cyan-400" />}
            </div>
            <h4 className="text-sm font-bold text-slate-100">Per-Aspek (Independent)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Setiap Aspek menghasilkan skor persentase mandiri. Tidak memerlukan penghitungan total nilai akhir.
            </p>
          </div>
        </button>

        {/* Card 2: OVERALL */}
        <button
          type="button"
          onClick={() => onSelectOutputMode('overall')}
          className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
            currentOutputMode === 'overall'
              ? 'bg-purple-500/10 border-purple-500/50 shadow-md shadow-purple-500/10'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-purple-400">Mode 02</span>
              {currentOutputMode === 'overall' && <Icon name="checkCircle" className="w-4 h-4 text-purple-400" />}
            </div>
            <h4 className="text-sm font-bold text-slate-100">Keseluruhan (Overall)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Menyajikan satu nilai persentase akumulasi akhir berdasarkan pembobotan aspek.
            </p>
          </div>
        </button>

        {/* Card 3: BOTH */}
        <button
          type="button"
          onClick={() => onSelectOutputMode('both')}
          className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
            currentOutputMode === 'both'
              ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/10'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-emerald-400">Rekomendasi BPOM</span>
              {currentOutputMode === 'both' && <Icon name="checkCircle" className="w-4 h-4 text-emerald-400" />}
            </div>
            <h4 className="text-sm font-bold text-slate-100">Per-Aspek & Overall (Both)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Menampilkan rincian skor tiap Aspek sekaligus akumulasi nilai akhir keseluruhan.
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}
