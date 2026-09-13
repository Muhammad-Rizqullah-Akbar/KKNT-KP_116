// config-panels/FlexibleElementPreview.tsx
// Preview renderer for a FlexibleQuestion (switch per answer type).

'use client'

import { Icon } from '@/components/ui/Icons'
import { FlexibleQuestion, IndicatorItem, IndicatorScale } from './../shared/ElementTypes'

interface FlexibleElementPreviewProps {
  element: FlexibleQuestion
}

export function FlexibleElementPreview({ element }: FlexibleElementPreviewProps) {
  const answerTypeLabel = element.answerType

  switch (element.answerType) {
    case 'single-choice':
      return (
        <div className="space-y-2">
          <p className="text-sm text-white/90">{element.question}</p>
          {element.description && (
            <p className="text-xs text-white/40">{element.description}</p>
          )}
          <div className="space-y-1.5">
            {(element.config.options || ['Opsi 1', 'Opsi 2', 'Opsi 3']).map((opt: string, i: number) => (
              <label key={i} className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                <input type="radio" name={element.id} disabled className="accent-cyan-400 w-4 h-4" />
                {opt}
                {/* Tampilkan correct answer jika ada */}
                {element.scoring?.scheme === 'binary' && element.config.correctAnswer === opt && (
                  <span className="text-[10px] text-emerald-400/50 ml-1">✓</span>
                )}
              </label>
            ))}
          </div>
          {element.scoring?.scheme === 'binary' && element.config.correctAnswer && (
            <p className="text-[10px] text-emerald-400/40 mt-1">
              Kunci jawaban: {element.config.correctAnswer}
            </p>
          )}
        </div>
      )

    case 'multiple-choice':
      return (
        <div className="space-y-2">
          <p className="text-sm text-white/90">{element.question}</p>
          {element.description && (
            <p className="text-xs text-white/40">{element.description}</p>
          )}
          <div className="space-y-1.5">
            {(element.config.options || ['Opsi 1', 'Opsi 2', 'Opsi 3']).map((opt: string, i: number) => (
              <label key={i} className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                <input type="checkbox" disabled className="accent-cyan-400 w-4 h-4" />
                {opt}
              </label>
            ))}
          </div>
        </div>
      )

    case 'dropdown':
      return (
        <div className="space-y-2">
          <p className="text-sm text-white/90">{element.question}</p>
          {element.description && (
            <p className="text-xs text-white/40">{element.description}</p>
          )}
          <select
            disabled
            className="w-full max-w-[250px] px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/40 focus:outline-none focus:border-cyan-400/40 transition-all cursor-default"
          >
            <option>Pilih opsi...</option>
            {(element.config.options || ['Opsi 1', 'Opsi 2', 'Opsi 3']).map((opt: string, i: number) => (
              <option key={i}>{opt}</option>
            ))}
          </select>
        </div>
      )

    case 'short-text':
      return (
        <div className="space-y-2">
          <p className="text-sm text-white/90">{element.question}</p>
          {element.description && (
            <p className="text-xs text-white/40">{element.description}</p>
          )}
          <input
            type="text"
            placeholder={element.config.placeholder || 'Tulis jawaban...'}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all cursor-default"
            disabled
          />
          {element.config.maxLength && (
            <p className="text-[10px] text-white/20">Maksimal {element.config.maxLength} karakter</p>
          )}
        </div>
      )

    case 'long-text':
      return (
        <div className="space-y-2">
          <p className="text-sm text-white/90">{element.question}</p>
          {element.description && (
            <p className="text-xs text-white/40">{element.description}</p>
          )}
          <textarea
            placeholder={element.config.placeholder || 'Tulis jawaban...'}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all resize-none cursor-default"
            disabled
          />
        </div>
      )

    case 'number':
      return (
        <div className="space-y-2">
          <p className="text-sm text-white/90">{element.question}</p>
          {element.description && (
            <p className="text-xs text-white/40">{element.description}</p>
          )}
          <input
            type="number"
            placeholder="0"
            className="w-full max-w-[120px] px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all cursor-default"
            disabled
          />
          {(element.config.min !== undefined || element.config.max !== undefined) && (
            <p className="text-[10px] text-white/20">
              {element.config.min !== undefined && `Min: ${element.config.min}`}
              {element.config.min !== undefined && element.config.max !== undefined && ' • '}
              {element.config.max !== undefined && `Maks: ${element.config.max}`}
            </p>
          )}
        </div>
      )

    case 'date':
      return (
        <div className="space-y-2">
          <p className="text-sm text-white/90">{element.question}</p>
          {element.description && (
            <p className="text-xs text-white/40">{element.description}</p>
          )}
          <input
            type="date"
            className="w-full max-w-[180px] px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-cyan-400/40 transition-all cursor-default"
            disabled
          />
        </div>
      )

    // ==================== TABEL PERTANYAAN / INDIKATOR ====================
    case 'indicator-table': {
      const indicators = element.config.indicators || []
      const scales = element.config.indicatorScales || []
      const indicatorTitle = element.config.indicatorTitle || 'Pertanyaan'
      const showTotal = element.config.showTotalScore || false
      const showWeighted = element.config.showWeightedScore || false

      if (indicators.length === 0 || scales.length === 0) {
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/90">{element.question || 'Tabel Pertanyaan'}</p>
            {element.description && (
              <p className="text-xs text-white/40">{element.description}</p>
            )}
            <div className="p-4 rounded-xl border-2 border-dashed border-white/[0.08] text-center">
              <Icon name="table" className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/30">
                {indicators.length === 0 ? 'Belum ada pertanyaan' : 'Belum ada skala jawaban'}
              </p>
              <p className="text-[10px] text-white/15 mt-1">Klik untuk mengkonfigurasi</p>
            </div>
          </div>
        )
      }

      return (
        <div className="space-y-2">
          <p className="text-sm text-white/90">{element.question || 'Tabel Pertanyaan'}</p>
          {element.description && (
            <p className="text-xs text-white/40">{element.description}</p>
          )}
          <div className="overflow-x-auto custom-scrollbar rounded-lg border border-white/[0.05]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="text-left text-[10px] text-white/40 font-medium py-2 px-2.5 border-r border-white/[0.05] w-7">#</th>
                  <th className="text-left text-[10px] text-white/40 font-medium py-2 px-2.5 border-r border-white/[0.05] min-w-[120px]">
                    {indicatorTitle}
                  </th>
                  {scales.map((scale: IndicatorScale, i: number) => (
                    <th key={i} className="text-center text-[10px] text-white/40 font-medium py-2 px-2 border-r border-white/[0.05]">
                      {scale.label}
                    </th>
                  ))}
                  {showTotal && (
                    <th className="text-center text-[10px] text-white/40 font-medium py-2 px-2">Skor</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {indicators.slice(0, 5).map((indicator: IndicatorItem, i: number) => (
                  <tr key={indicator.id || i} className="border-t border-white/[0.03] hover:bg-white/[0.01]">
                    <td className="py-2 px-2.5 text-white/30 text-[10px] border-r border-white/[0.05] text-center">{i + 1}</td>
                    <td className="py-2 px-2.5 text-white/70 text-[11px] border-r border-white/[0.05] truncate max-w-[180px]">
                      {indicator.label}
                      {showWeighted && (indicator.weight || 1) !== 1 && (
                        <span className="text-[9px] text-cyan-400/50 ml-1">×{indicator.weight}</span>
                      )}
                    </td>
                    {scales.map((_: IndicatorScale, j: number) => (
                      <td key={j} className="text-center py-2 px-2 border-r border-white/[0.05]">
                        <input type="radio" disabled className="w-3 h-3 opacity-20" />
                      </td>
                    ))}
                    {showTotal && (
                      <td className="text-center py-2 px-2 text-white/20 text-[10px]">-</td>
                    )}
                  </tr>
                ))}
                {indicators.length > 5 && (
                  <tr className="border-t border-white/[0.03]">
                    <td colSpan={2 + scales.length + (showTotal ? 1 : 0)} className="py-2 text-center text-white/20 text-[10px]">
                      + {indicators.length - 5} pertanyaan lainnya
                    </td>
                  </tr>
                )}
                {showTotal && (
                  <tr className="border-t border-white/[0.08] bg-white/[0.02]">
                    <td colSpan={2} className="py-2 px-2.5 text-white/50 font-medium text-[10px] text-right border-r border-white/[0.05]">Total Skor</td>
                    {scales.map((_: IndicatorScale, i: number) => (
                      <td key={i} className="border-r border-white/[0.05]"></td>
                    ))}                      <td className="text-center py-2 px-2 text-cyan-400 font-bold text-[11px]">0</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-white/20">
            <span>{indicators.length} pertanyaan</span>
            <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
            <span>{scales.length} skala</span>
            {showWeighted && (
              <>
                <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
                <span className="text-cyan-400/40">berbobot</span>
              </>
            )}
          </div>
        </div>
      )
    }

    // ==================== SIGNATURE ====================
    case 'signature':
      return (
        <div className="space-y-2">
          <p className="text-sm text-white/90">{element.question || 'Tanda Tangan'}</p>
          {element.description && (
            <p className="text-xs text-white/40">{element.description}</p>
          )}
          <div
            className="rounded-xl border-2 border-dashed border-white/[0.08] flex items-center justify-center mx-auto bg-white/5"
            style={{
              width: `${Math.min(element.config.signatureWidth || 400, 300)}px`,
              height: `${Math.min(element.config.signatureHeight || 200, 150)}px`,
            }}
          >
            <div className="text-center">
              <Icon name="edit" className="w-6 h-6 text-white/20 mx-auto mb-1" />
              <p className="text-[10px] text-white/20">
                {element.config.signatureLabel || 'Tanda Tangan'}
              </p>
            </div>
          </div>
        </div>
      )

    case 'rating':
      return (
        <div className="space-y-2">
          <p className="text-sm text-white/90">{element.question}</p>
          {element.description && (
            <p className="text-xs text-white/40">{element.description}</p>
          )}
          <div className="flex gap-2">
            {Array.from({ length: element.config.ratingMax || 5 }, (_: any, i: number) => (
              <button key={i} disabled className="text-3xl text-white/20 hover:text-amber-400 transition-colors cursor-default">
                ★
              </button>
            ))}
          </div>
        </div>
      )

    case 'file-upload':
      return (
        <div className="space-y-2">
          <p className="text-sm text-white/90">{element.question}</p>
          {element.description && (
            <p className="text-xs text-white/40">{element.description}</p>
          )}
          <div className="p-4 rounded-xl border-2 border-dashed border-white/[0.08] text-center">
            <Icon name="upload" className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-xs text-white/30">Upload file</p>
            <p className="text-[10px] text-white/15">Maks {element.config.maxFileSize || 5}MB</p>
          </div>
        </div>
      )

    default:
      return (
        <div className="space-y-2">
          <p className="text-sm text-white/90">{element.question}</p>
          {element.description && (
            <p className="text-xs text-white/40">{element.description}</p>
          )}
          <p className="text-xs text-white/20">Tipe: {answerTypeLabel}</p>
        </div>
      )
  }
}
