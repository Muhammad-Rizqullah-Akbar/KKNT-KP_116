'use client'

import { Icon } from '@/components/ui/Icons'
import type { ResolvedAspect } from './form-aspects'

interface LandingViewProps {
  code: string
  title: string
  description?: string
  ownerName: string
  resolvedVersionNumber: number
  aspects: ResolvedAspect[]
  questionCount: number
  isStartingSession: boolean
  onStartSession: () => void
}

export function LandingView({
  code,
  title,
  description,
  ownerName,
  resolvedVersionNumber,
  aspects,
  questionCount,
  isStartingSession,
  onStartSession,
}: LandingViewProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-xl w-full rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm">
              <Icon name="fileText" className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">
                Instrumen Evaluasi Resmi BPOM
              </span>
              <h1 className="text-lg font-bold text-slate-100">{title}</h1>
            </div>
          </div>
          <span className="font-mono text-cyan-300 font-extrabold text-xs px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-500/40">
            {code}
          </span>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
            {description || 'Silakan isi formulir penilaian di bawah ini sesuai dengan kondisi riil di lapangan.'}
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Penyelenggara / Pemilik</span>
              <p className="font-semibold text-slate-200 truncate">{ownerName}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Struktur Soal</span>
              <p className="font-semibold text-cyan-300 font-mono">
                {aspects.length} Aspek • {questionCount} Pertanyaan
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-between border-t border-slate-800">
          <span className="text-[11px] text-slate-500 font-mono">
            Versi Instrumen: v{resolvedVersionNumber}
          </span>

          <button
            type="button"
            onClick={onStartSession}
            disabled={isStartingSession}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white text-xs font-extrabold shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2 transition-all"
          >
            {isStartingSession ? (
              <>
                <Icon name="loader" className="w-4 h-4 animate-spin" />
                <span>Memulai Sesi...</span>
              </>
            ) : (
              <>
                <span>Mulai Pengisian Formulir</span>
                <Icon name="arrowRight" className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
