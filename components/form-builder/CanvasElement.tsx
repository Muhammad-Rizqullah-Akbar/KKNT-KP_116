// components/form-builder/CanvasElement.tsx

'use client'

import { Icon } from '@/components/ui/Icons'
import { CanvasElement as CanvasElementType } from './ElementTypes'

interface CanvasElementProps {
  element: CanvasElementType
  index: number
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

export function CanvasElement({
  element,
  index,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: CanvasElementProps) {
  const renderPreview = () => {
    switch (element.type) {
      case 'short-text':
      case 'text':
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/90">{element.question}</p>
            <input
              type="text"
              placeholder={element.defaultProps?.placeholder || 'Tulis jawaban...'}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all cursor-default"
              disabled
            />
          </div>
        )

      case 'long-text':
      case 'textarea':
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/90">{element.question}</p>
            <textarea
              placeholder={element.defaultProps?.placeholder || 'Tulis jawaban panjang...'}
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

      case 'email':
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/90">{element.question}</p>
            <input
              type="email"
              placeholder="email@domain.com"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all cursor-default"
              disabled
            />
          </div>
        )

      case 'phone':
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/90">{element.question}</p>
            <input
              type="tel"
              placeholder="0812-3456-7890"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all cursor-default"
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

      case 'yes-no':
      case 'binary':
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/90">{element.question}</p>
            <div className="flex gap-6">
              {['Ya', 'Tidak'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                  <input type="radio" name={element.id} disabled className="accent-cyan-400 w-4 h-4" />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        )

      case 'single-choice':
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/90">{element.question}</p>
            <div className="space-y-1.5">
              {(element.options || ['Opsi 1', 'Opsi 2', 'Opsi 3']).map((opt, i) => (
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
              {(element.options || ['Opsi 1', 'Opsi 2', 'Opsi 3']).map((opt, i) => (
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
              {(element.options || ['Opsi 1', 'Opsi 2', 'Opsi 3']).map((opt, i) => (
                <option key={i}>{opt}</option>
              ))}
            </select>
          </div>
        )

      case 'multiselect':
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/90">{element.question}</p>
            <select
              multiple
              disabled
              className="w-full max-w-[250px] px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/40 focus:outline-none focus:border-cyan-400/40 transition-all cursor-default"
            >
              {(element.options || ['Opsi 1', 'Opsi 2', 'Opsi 3']).map((opt, i) => (
                <option key={i}>{opt}</option>
              ))}
            </select>
            <p className="text-xs text-white/20">Tekan Ctrl untuk pilih beberapa</p>
          </div>
        )

      case 'likert':
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/90">{element.question}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-white/[0.05] rounded-xl">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="text-left text-xs text-white/40 font-medium py-2 px-3">Pernyataan</th>
                    {['STS', 'TS', 'CS', 'S', 'SS'].map((label) => (
                      <th key={label} className="text-center text-xs text-white/40 font-medium py-2 px-2">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(element.options || ['Pernyataan 1', 'Pernyataan 2']).map((row, i) => (
                    <tr key={i} className="border-t border-white/[0.05]">
                      <td className="py-2 px-3 text-sm text-white/60">{row}</td>
                      {['STS', 'TS', 'CS', 'S', 'SS'].map((label) => (
                        <td key={label} className="text-center py-2 px-2">
                          <input type="radio" name={`${element.id}-${i}`} disabled className="accent-cyan-400 w-4 h-4" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'rating':
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/90">{element.question}</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} disabled className="text-3xl text-white/20 hover:text-amber-400 transition-colors cursor-default">
                  ★
                </button>
              ))}
            </div>
          </div>
        )

      case 'table-binary':
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/90">{element.question}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-white/[0.05] rounded-xl">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="text-left text-xs text-white/40 font-medium py-2 px-3">Indikator</th>
                    <th className="text-center text-xs text-white/40 font-medium py-2 px-2">Ya</th>
                    <th className="text-center text-xs text-white/40 font-medium py-2 px-2">Tidak</th>
                  </tr>
                </thead>
                <tbody>
                  {(element.rows || [{ id: '1', label: 'Indikator 1' }, { id: '2', label: 'Indikator 2' }]).map((row) => (
                    <tr key={row.id} className="border-t border-white/[0.05]">
                      <td className="py-2 px-3 text-sm text-white/60">{row.label}</td>
                      <td className="text-center py-2 px-2">
                        <input type="radio" name={`${element.id}-${row.id}`} disabled className="accent-cyan-400 w-4 h-4" />
                      </td>
                      <td className="text-center py-2 px-2">
                        <input type="radio" name={`${element.id}-${row.id}`} disabled className="accent-cyan-400 w-4 h-4" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'image':
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/90">{element.question}</p>
            <div className="rounded-xl bg-gradient-to-br from-cyan-700/30 to-violet-800/30 border border-white/[0.05] h-40 flex items-center justify-center">
              {element.imageUrl ? (
                <img src={element.imageUrl} alt="Preview" className="h-full w-full object-cover rounded-xl" />
              ) : (
                <div className="text-center">
                  <Icon name="image" className="w-10 h-10 text-white/20 mx-auto mb-2" />
                  <p className="text-xs text-white/25">Upload gambar</p>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              {(element.options || ['Opsi A', 'Opsi B']).map((opt, i) => (
                <label key={i} className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                  <input type="radio" name={element.id} disabled className="accent-cyan-400 w-4 h-4" />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        )

      case 'section-header':
        return (
          <div className="py-4 border-b border-white/[0.05]">
            <h2 className="font-display text-xl font-semibold text-white">{element.question}</h2>
            {element.defaultProps?.description && (
              <p className="text-sm text-white/40 mt-1">{element.defaultProps.description}</p>
            )}
          </div>
        )

      case 'page-break':
        return (
          <div className="py-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-white/30 font-medium">━ {element.question || 'Halaman Berikutnya'} ━</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>
        )

      default:
        return (
          <div className="space-y-2">
            <p className="text-sm text-white/90">{element.question}</p>
            <p className="text-xs text-white/20">Elemen: {element.type}</p>
          </div>
        )
    }
  }

  const getIdentifierLabel = () => {
    if (!element.isIdentifier) return null
    switch (element.identifierType) {
      case 'name': return '🏷️ Nama'
      case 'location': return '📍 Lokasi'
      case 'email': return '📧 Email'
      case 'phone': return '📞 Telepon'
      default: return '🔖 Penanda'
    }
  }

  const identifierLabel = getIdentifierLabel()

  return (
    <div
      className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? 'border-cyan-500/50 bg-cyan-500/5 shadow-lg shadow-cyan-500/10'
          : 'border-white/[0.05] bg-white/[0.01] hover:border-white/[0.1] hover:bg-white/[0.02]'
      }`}
      onClick={onSelect}
    >
      {/* Drag Handle - Tiga garis di kiri */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none">
        <div className="flex flex-col gap-0.5 p-1.5 rounded hover:bg-white/[0.08]">
          <div className="w-4 h-0.5 bg-white/40 rounded-full" />
          <div className="w-4 h-0.5 bg-white/40 rounded-full" />
          <div className="w-4 h-0.5 bg-white/40 rounded-full" />
        </div>
      </div>

      {/* Nomor Urut & Actions */}
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
        {element.scoringScheme && element.scoringScheme !== 'none' && (
          <span className="text-[10px] text-amber-400/70 bg-amber-500/10 px-2 py-0.5 rounded-full">
            📊 {element.scoringScheme === 'binary' ? 'Benar/Salah' :
                element.scoringScheme === 'likert' ? 'Likert' :
                element.scoringScheme === 'rating' ? 'Rating' : 'Dinilai'}
            {element.weight && element.weight > 1 && ` x${element.weight}`}
          </span>
        )}
        <span className="text-[10px] text-white/20 bg-white/[0.05] px-2 py-0.5 rounded-full">
          {element.type}
        </span>
      </div>
    </div>
  )
}