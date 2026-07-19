// components/form-builder/FlexibleElement.tsx

'use client'

import { Icon } from '@/components/ui/Icons'
import { FlexibleQuestion, ANSWER_TYPES, IndicatorItem, IndicatorScale } from './ElementTypes'

interface FlexibleElementProps {
  element: FlexibleQuestion
  index: number
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

export function FlexibleElement({
  element,
  index,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: FlexibleElementProps) {
  const answerTypeLabel = ANSWER_TYPES.find(t => t.value === element.answerType)?.label || element.answerType

  const renderPreview = () => {
    switch (element.answerType) {
      case 'single-choice':
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/90">{element.question}</p>
            <div className="space-y-1.5">
              {(element.config.options || ['Opsi 1', 'Opsi 2', 'Opsi 3']).map((opt: string, i: number) => (
                <label key={i} className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                  <input type="radio" name={element.id} disabled className="accent-cyan-400 w-4 h-4" />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        )

      case 'multiple-choice':
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/90">{element.question}</p>
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
            <input
              type="text"
              placeholder={element.config.placeholder || 'Tulis jawaban...'}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all cursor-default"
              disabled
            />
          </div>
        )

      case 'long-text':
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/90">{element.question}</p>
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
            <input
              type="number"
              placeholder="0"
              className="w-full max-w-[120px] px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all cursor-default"
              disabled
            />
          </div>
        )

      case 'date':
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/90">{element.question}</p>
            <input
              type="date"
              className="w-full max-w-[180px] px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-cyan-400/40 transition-all cursor-default"
              disabled
            />
          </div>
        )

      // ==================== TABEL PERTANYAAN / INDIKATOR ====================
      case 'indicator-table':
        const indicators = element.config.indicators || []
        const scales = element.config.indicatorScales || []
        const indicatorTitle = element.config.indicatorTitle || 'Pertanyaan'
        const showTotal = element.config.showTotalScore || false
        const showWeighted = element.config.showWeightedScore || false
        
        if (indicators.length === 0 || scales.length === 0) {
          return (
            <div className="space-y-2">
              <p className="text-sm text-white/90">{element.question || 'Tabel Pertanyaan'}</p>
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
                      ))}
                      <td className="text-center py-2 px-2 text-cyan-400 font-bold text-[11px]">0</td>
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

      // ==================== SIGNATURE ====================
      case 'signature':
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/90">{element.question || 'Tanda Tangan'}</p>
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
            <div className="p-4 rounded-xl border-2 border-dashed border-white/[0.08] text-center">
              <Icon name="upload" className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/30">Upload file (max {element.config.maxFileSize || 5}MB)</p>
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/90">{element.question}</p>
            <p className="text-xs text-white/20">Tipe: {answerTypeLabel}</p>
          </div>
        )
    }
  }

  // Render media preview
  const renderMedia = () => {
    if (element.media.type === 'none' || !element.media.url) return null
    
    return (
      <div className="mt-2 mb-3 rounded-xl overflow-hidden border border-white/[0.05]">
        {element.media.type === 'image' && (
          <img src={element.media.url} alt={element.media.caption || 'Gambar'} className="w-full h-32 object-cover" />
        )}
        {element.media.type === 'video' && (
          <video src={element.media.url} controls className="w-full h-32 object-cover" />
        )}
        {element.media.type === 'file' && (
          <div className="p-4 bg-white/[0.02] flex items-center gap-3">
            <Icon name="fileText" className="w-8 h-8 text-white/30" />
            <div>
              <p className="text-sm text-white/60 truncate">{element.media.url.split('/').pop()}</p>
              <p className="text-xs text-white/20">File</p>
            </div>
          </div>
        )}
        {element.media.caption && (
          <p className="text-xs text-white/30 p-2 text-center">{element.media.caption}</p>
        )}
      </div>
    )
  }

  const identifierLabel = element.isIdentifier ? 
    (element.identifierType === 'name' ? '🏷️ Nama' :
     element.identifierType === 'location' ? '📍 Lokasi' :
     element.identifierType === 'email' ? '📧 Email' :
     element.identifierType === 'phone' ? '📞 Telepon' : '🔖 Penanda') : null

  const scoringLabel = element.scoring.scheme !== 'none' ? 
    (element.scoring.scheme === 'binary' ? 'Benar/Salah' :
     element.scoring.scheme === 'likert' ? 'Skala' :
     element.scoring.scheme === 'indicator' ? 'Indikator' :
     element.scoring.scheme === 'rating' ? 'Rating' : 'Dinilai') : null

  return (
    <div
      className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? 'border-cyan-500/50 bg-cyan-500/5 shadow-lg shadow-cyan-500/10'
          : 'border-white/[0.05] bg-white/[0.01] hover:border-white/[0.1] hover:bg-white/[0.02]'
      }`}
      onClick={onSelect}
    >
      {/* Drag Handle */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none">
        <div className="flex flex-col gap-0.5 p-1.5 rounded hover:bg-white/[0.08]">
          <div className="w-4 h-0.5 bg-white/40 rounded-full" />
          <div className="w-4 h-0.5 bg-white/40 rounded-full" />
          <div className="w-4 h-0.5 bg-white/40 rounded-full" />
        </div>
      </div>

      {/* Nomor & Actions */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-medium text-white/20 w-6 flex-shrink-0">
          {index + 1}.
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp() }}
            className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
            disabled={index === 0}
          >
            <Icon name="arrowUp" className={`w-3.5 h-3.5 ${index === 0 ? 'text-white/10' : 'text-white/30 hover:text-white/60'}`} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown() }}
            className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <Icon name="arrowDown" className="w-3.5 h-3.5 text-white/30 hover:text-white/60" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate() }}
            className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <Icon name="copy" className="w-3.5 h-3.5 text-white/30 hover:text-amber-400" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <Icon name="trash" className="w-3.5 h-3.5 text-white/30 hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Media Preview */}
      {renderMedia()}

      {/* Preview */}
      <div className="pl-6">
        {renderPreview()}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mt-3 pl-6">
        {element.required && (
          <span className="text-[10px] text-rose-400/70 bg-rose-500/10 px-2 py-0.5 rounded-full">Wajib</span>
        )}
        {identifierLabel && (
          <span className="text-[10px] text-cyan-400/70 bg-cyan-500/10 px-2 py-0.5 rounded-full">
            {identifierLabel}
          </span>
        )}
        {scoringLabel && (
          <span className="text-[10px] text-amber-400/70 bg-amber-500/10 px-2 py-0.5 rounded-full">
            📊 {scoringLabel}
            {element.scoring.weight > 1 && ` x${element.scoring.weight}`}
          </span>
        )}
        <span className="text-[10px] text-white/20 bg-white/[0.05] px-2 py-0.5 rounded-full">
          {answerTypeLabel}
        </span>
      </div>
    </div>
  )
}