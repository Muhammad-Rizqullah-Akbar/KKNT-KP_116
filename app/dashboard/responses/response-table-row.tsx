'use client'

import { Icon } from '@/components/ui/Icons'
import type { ResponseDoc } from '@/lib/domain/responses/response-types'

type ResponseTableRowProps = {
  r: ResponseDoc
  selected: boolean
  onToggleSelect: (id: string) => void
  onViewAnswers: (r: ResponseDoc) => void
  onDelete: (r: ResponseDoc) => void
}

export default function ResponseTableRow({ r, selected, onToggleSelect, onViewAnswers, onDelete }: ResponseTableRowProps) {
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
  const grade = res?.grade || (score >= 80 ? 'A' : score >= 60 ? 'B' : 'C')
  const thresholdTitle = res?.thresholdTitle || (score >= 80 ? 'Memenuhi Syarat (MS)' : score >= 60 ? 'Binaan Lanjutan' : 'Perlu Perbaikan')
  const formTitle = (r.formTitle || 'Formulir Evaluasi Keamanan Pangan').replace(/^form_[\w\-]+/g, 'Formulir Evaluasi Pangan')
  const ownerName = r.ownerName || 'Penerbit Kode'

  return (
    <div
      className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        selected
          ? 'bg-cyan-950/30'
          : 'hover:bg-slate-800/40'
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(r.responseId)}
          className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950 cursor-pointer shrink-0"
        />
        <div className="space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          <span className="font-bold text-slate-100 font-sans">
            {formTitle}
          </span>
          <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-bold border border-purple-500/30">
            Author: {ownerName}
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40">
            TERVERIFIKASI ✓
          </span>
        </div>

        <div className="text-sm font-bold text-cyan-300">
          {r.respondent?.name || 'Responden Publik (Anonim)'}
        </div>

        <div className="text-xs font-mono text-slate-300 font-bold">
          Skor: {score}% — Predikat {grade} ({thresholdTitle})
        </div>
      </div>
    </div>

    <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onViewAnswers(r)}
          className="px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-extrabold border border-cyan-500/40 flex items-center gap-1.5 transition-all shadow-md"
        >
          <Icon name="eye" className="w-3.5 h-3.5 text-cyan-400" />
          <span>Lihat Jawaban</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(r)}
          className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center gap-1 transition-all"
          title="Hapus tanggapan ini"
        >
          <Icon name="trash" className="w-3.5 h-3.5 text-rose-400" />
          <span>Hapus</span>
        </button>
      </div>
    </div>
  )
}
