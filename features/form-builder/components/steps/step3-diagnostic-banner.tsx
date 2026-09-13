'use client'

import type { FormValidationIssue } from '@/lib/domain/forms/validation'
import { Icon } from '@/components/ui/Icons'

interface DiagnosticAuditorBannerProps {
  issues: FormValidationIssue[]
  onNavigateToStep: (step: 1 | 2 | 3 | 4) => void
}

export function DiagnosticAuditorBanner({ issues, onNavigateToStep }: DiagnosticAuditorBannerProps) {
  return (
    <div
      className={`p-4 rounded-2xl border ${
        issues.length === 0
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-amber-500/10 border-amber-500/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon
            name={issues.length === 0 ? 'checkCircle' : 'alertTriangle'}
            className={`w-5 h-5 ${issues.length === 0 ? 'text-emerald-400' : 'text-amber-400'}`}
          />
          <div>
            <h4 className="text-xs font-bold text-slate-100">
              {issues.length === 0
                ? 'Kuesioner Siap Dipublikasikan (0 Masalah Validasi)'
                : `Terdapat ${issues.length} Masalah Validasi Yang Perlu Diperbaiki`}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {issues.length === 0
                ? 'Struktur aspek, bobot total 100%, dan kunci jawaban telah memenuhi standar V1.5.'
                : 'Klik masalah di bawah ini untuk berpindah langsung ke bagian yang bermasalah.'}
            </p>
          </div>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
          {issues.map((issue, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (issue.path.includes('stagePointDistribution')) onNavigateToStep(1)
                else onNavigateToStep(2)
              }}
              className="w-full p-2 rounded-lg bg-slate-950/60 hover:bg-slate-950 border border-amber-500/20 text-left text-xs text-amber-300 flex items-center justify-between transition-colors"
            >
              <span>⚠ {issue.message}</span>
              <span className="text-[10px] font-bold underline text-cyan-400">Perbaiki Sekarang →</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
