'use client'

import { Icon } from '@/components/ui/Icons'
import type { ResponseDoc } from '@/lib/domain/responses/response-types'
import { extractRespondentName, extractRespondentEmail } from '@/lib/domain/responses/respondent-utils'
import { getRespondentAspects } from './helpers'
import CircularScoreGauge from './circular-score-gauge'

type ResponseCardProps = {
  r: ResponseDoc
  selected: boolean
  onToggleSelect: (id: string) => void
  onViewAnswers: (r: ResponseDoc) => void
  onDelete: (r: ResponseDoc) => void
}

export default function ResponseCard({ r, selected, onToggleSelect, onViewAnswers, onDelete }: ResponseCardProps) {
  const res = r.result
  const rawScoreVal =
    res?.percentage ??
    res?.rawScore ??
    (r as any).score ??
    (r as any).totalScore ??
    (r as any).percentage ??
    (r as any).finalScore ??
    0

  const score = Math.min(100, Math.max(0, Math.round(Number(rawScoreVal) || 0)))
  const grade = res?.grade || (score >= 80 ? 'Grade A' : score >= 60 ? 'Grade B' : 'Grade C')
  const thresholdTitle = res?.thresholdTitle || (score >= 80 ? 'Memenuhi Syarat (MS)' : score >= 60 ? 'Binaan Lanjutan' : 'Perlu Perbaikan')

  const formTitle = (r.formTitle || 'Formulir Evaluasi Keamanan Pangan').replace(/^form_[\w\-]+/g, 'Formulir Evaluasi Pangan')
  const distCode = r.distributionCode || 'V1-DIST'
  const ownerName = r.ownerName || 'Penerbit Kode'

  return (
    <div
      className={`rounded-3xl bg-slate-900 border overflow-hidden shadow-xl transition-all flex flex-col justify-between ${
        selected
          ? 'border-cyan-500/80 bg-cyan-950/20'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="p-6 space-y-5">
        {/* Top Row: Circular Score Gauge (Left) + Details (Right) */}
        <div className="flex items-start gap-4">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(r.responseId)}
            className="mt-2 w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950 cursor-pointer shrink-0"
          />
          {/* Left Side: Circular Score Donut Gauge */}
          <CircularScoreGauge score={score} grade={grade} />

          {/* Right Side: Respondent & Form Metadata */}
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-100 truncate" title={formTitle}>
                {formTitle}
              </span>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                TERVERIFIKASI ✓
              </span>
            </div>

            {/* Respondent Name & Contact Info */}
            <div className="space-y-0.5">
              <h3 className="text-sm font-extrabold text-cyan-300 truncate">
                {extractRespondentName(r)}
              </h3>
              {(extractRespondentEmail(r) || r.respondent?.email) && (
                <p className="text-xs text-slate-400 font-mono truncate">{extractRespondentEmail(r) || r.respondent?.email}</p>
              )}
            </div>

            {/* Author Kode & Threshold Badge */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="text-[11px] font-bold text-slate-200 line-clamp-1">
                {thresholdTitle}
              </div>
              <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between gap-2">
                <span>Author: <strong className="text-purple-300 font-sans">{ownerName}</strong> ({distCode})</span>
                <span>{new Date(r.submittedAt || r.updatedAt || Date.now()).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PER-ASPECT BENCHMARK SCORE BREAKDOWN CARD */}
        {(() => {
          const respAspects = getRespondentAspects(r)
          if (respAspects.length === 0) return null
          return (
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 font-mono">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Icon name="layers" className="w-3.5 h-3.5" /> Nilai Per-Aspek Benchmark
                </span>
                <span className="text-[10px] text-slate-400 font-normal">{respAspects.length} Aspek</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {respAspects.map((asp, aIdx) => (
                  <div key={aIdx} className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-300 font-bold truncate max-w-[130px]" title={asp.title}>{asp.title}</span>
                      <span className="text-cyan-300 font-extrabold">{asp.percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          asp.percentage >= 80 ? 'bg-emerald-500' : asp.percentage >= 60 ? 'bg-cyan-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${asp.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Bottom Action Toolbar */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center justify-between gap-2 border-t border-slate-800/80 pt-3 mt-1">
          <button
            type="button"
            onClick={() => onViewAnswers(r)}
            className="px-4 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-extrabold border border-cyan-500/40 flex items-center gap-1.5 transition-all shadow-md flex-1 justify-center"
          >
            <Icon name="eye" className="w-3.5 h-3.5 text-cyan-400" />
            <span>Lihat Jawaban</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(r)}
            className="px-3.5 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center gap-1.5 transition-all"
            title="Hapus tanggapan ini"
          >
            <Icon name="trash" className="w-4 h-4 text-rose-400" />
            <span>Hapus</span>
          </button>
        </div>
      </div>
    </div>
  )
}
