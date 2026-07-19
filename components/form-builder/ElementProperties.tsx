// components/form-builder/ElementProperties.tsx

'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/Icons'
import { CanvasElement } from './ElementTypes'

interface ElementPropertiesProps {
  element: CanvasElement | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedElement: CanvasElement) => void
}

export function ElementProperties({
  element,
  isOpen,
  onClose,
  onSave,
}: ElementPropertiesProps) {
  const [localElement, setLocalElement] = useState<CanvasElement | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (element) {
      setLocalElement({ ...element })
    }
  }, [element])

  if (!isOpen || !localElement) return null

  const handleSave = () => {
    if (localElement) {
      onSave(localElement)
    }
  }

  const handleClose = () => {
    const hasChanges = JSON.stringify(element) !== JSON.stringify(localElement)
    if (hasChanges) {
      setShowConfirm(true)
    } else {
      onClose()
    }
  }

  const renderProperties = () => {
    switch (localElement.type) {
      case 'short-text':
      case 'text':
      case 'long-text':
      case 'textarea':
      case 'email':
      case 'phone':
      case 'number':
      case 'date':
        return (
          <>
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Pertanyaan</label>
              <input
                type="text"
                value={localElement.question}
                onChange={(e) => setLocalElement({ ...localElement, question: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                placeholder="Masukkan pertanyaan..."
              />
            </div>

            {(localElement.type === 'short-text' || localElement.type === 'text' || localElement.type === 'long-text' || localElement.type === 'textarea') && (
              <div className="space-y-1.5">
                <label className="text-xs text-white/50 uppercase tracking-wider">Placeholder</label>
                <input
                  type="text"
                  value={localElement.defaultProps?.placeholder || ''}
                  onChange={(e) => setLocalElement({
                    ...localElement,
                    defaultProps: { ...localElement.defaultProps, placeholder: e.target.value }
                  })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                  placeholder="Placeholder..."
                />
              </div>
            )}

            {localElement.type === 'number' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Min</label>
                  <input
                    type="number"
                    value={localElement.validation?.min || 0}
                    onChange={(e) => setLocalElement({
                      ...localElement,
                      validation: { ...localElement.validation, min: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Max</label>
                  <input
                    type="number"
                    value={localElement.validation?.max || 100}
                    onChange={(e) => setLocalElement({
                      ...localElement,
                      validation: { ...localElement.validation, max: parseInt(e.target.value) || 100 }
                    })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                  />
                </div>
              </div>
            )}
          </>
        )

      case 'single-choice':
      case 'multiple-choice':
      case 'dropdown':
      case 'multiselect':
        return (
          <>
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Pertanyaan</label>
              <input
                type="text"
                value={localElement.question}
                onChange={(e) => setLocalElement({ ...localElement, question: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                placeholder="Masukkan pertanyaan..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Opsi Jawaban</label>
              <div className="space-y-2">
                {(localElement.options || ['']).map((opt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...(localElement.options || [])]
                        newOptions[index] = e.target.value
                        setLocalElement({ ...localElement, options: newOptions })
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                      placeholder={`Opsi ${index + 1}`}
                    />
                    <button
                      onClick={() => {
                        const newOptions = (localElement.options || []).filter((_, i) => i !== index)
                        setLocalElement({ ...localElement, options: newOptions })
                      }}
                      className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <Icon name="trash" className="w-4 h-4 text-white/30 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const newOptions = [...(localElement.options || []), '']
                  setLocalElement({ ...localElement, options: newOptions })
                }}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                <Icon name="plus" className="w-3 h-3" /> Tambah Opsi
              </button>
            </div>

            {localElement.type === 'single-choice' && (
              <div className="space-y-1.5">
                <label className="text-xs text-white/50 uppercase tracking-wider">Jawaban Benar (untuk scoring)</label>
                <select
                  value={localElement.correctAnswer as string || ''}
                  onChange={(e) => setLocalElement({ ...localElement, correctAnswer: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none focus:border-cyan-400/40 transition-all"
                >
                  <option value="" className="bg-[#0e0e1a]">Tidak ada (tidak dinilai)</option>
                  {(localElement.options || []).map((opt, i) => (
                    <option key={i} value={opt} className="bg-[#0e0e1a]">{opt}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )

      case 'table-binary':
        return (
          <>
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Pertanyaan</label>
              <input
                type="text"
                value={localElement.question}
                onChange={(e) => setLocalElement({ ...localElement, question: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                placeholder="Masukkan pertanyaan..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Baris / Indikator</label>
              <div className="space-y-2">
                {(localElement.rows || []).map((row, index) => (
                  <div key={row.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => {
                        const newRows = [...(localElement.rows || [])]
                        newRows[index] = { ...row, label: e.target.value }
                        setLocalElement({ ...localElement, rows: newRows })
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                      placeholder={`Indikator ${index + 1}`}
                    />
                    <button
                      onClick={() => {
                        const newRows = (localElement.rows || []).filter((_, i) => i !== index)
                        setLocalElement({ ...localElement, rows: newRows })
                      }}
                      className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <Icon name="trash" className="w-4 h-4 text-white/30 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const newRows = [...(localElement.rows || []), { id: `row-${Date.now()}`, label: `Indikator ${(localElement.rows || []).length + 1}` }]
                  setLocalElement({ ...localElement, rows: newRows })
                }}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                <Icon name="plus" className="w-3 h-3" /> Tambah Baris
              </button>
            </div>
          </>
        )

      case 'likert':
        return (
          <>
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Pertanyaan</label>
              <input
                type="text"
                value={localElement.question}
                onChange={(e) => setLocalElement({ ...localElement, question: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                placeholder="Masukkan pertanyaan..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Pernyataan</label>
              <div className="space-y-2">
                {(localElement.options || ['']).map((opt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...(localElement.options || [])]
                        newOptions[index] = e.target.value
                        setLocalElement({ ...localElement, options: newOptions })
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                      placeholder={`Pernyataan ${index + 1}`}
                    />
                    <button
                      onClick={() => {
                        const newOptions = (localElement.options || []).filter((_, i) => i !== index)
                        setLocalElement({ ...localElement, options: newOptions })
                      }}
                      className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <Icon name="trash" className="w-4 h-4 text-white/30 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const newOptions = [...(localElement.options || []), '']
                  setLocalElement({ ...localElement, options: newOptions })
                }}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                <Icon name="plus" className="w-3 h-3" /> Tambah Pernyataan
              </button>
            </div>
          </>
        )

      case 'image':
        return (
          <>
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Pertanyaan</label>
              <input
                type="text"
                value={localElement.question}
                onChange={(e) => setLocalElement({ ...localElement, question: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                placeholder="Masukkan pertanyaan..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">URL Gambar</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={localElement.imageUrl || ''}
                  onChange={(e) => setLocalElement({ ...localElement, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                />
                <button className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/50 hover:text-white hover:border-cyan-400/20 transition-all">
                  Upload
                </button>
              </div>
              <div className="w-full h-32 rounded-xl bg-gradient-to-br from-cyan-700/30 to-emerald-800/30 border border-white/[0.05] flex items-center justify-center mt-2 overflow-hidden">
                {localElement.imageUrl ? (
                  <img src={localElement.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Icon name="image" className="w-8 h-8 text-white/20" />
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Opsi Jawaban</label>
              <div className="space-y-2">
                {(localElement.options || ['']).map((opt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...(localElement.options || [])]
                        newOptions[index] = e.target.value
                        setLocalElement({ ...localElement, options: newOptions })
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                      placeholder={`Opsi ${index + 1}`}
                    />
                    <button
                      onClick={() => {
                        const newOptions = (localElement.options || []).filter((_, i) => i !== index)
                        setLocalElement({ ...localElement, options: newOptions })
                      }}
                      className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <Icon name="trash" className="w-4 h-4 text-white/30 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const newOptions = [...(localElement.options || []), '']
                  setLocalElement({ ...localElement, options: newOptions })
                }}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                <Icon name="plus" className="w-3 h-3" /> Tambah Opsi
              </button>
            </div>
          </>
        )

      case 'section-header':
        return (
          <>
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Judul Section</label>
              <input
                type="text"
                value={localElement.question}
                onChange={(e) => setLocalElement({ ...localElement, question: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                placeholder="Masukkan judul section..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Deskripsi (opsional)</label>
              <input
                type="text"
                value={localElement.defaultProps?.description || ''}
                onChange={(e) => setLocalElement({
                  ...localElement,
                  defaultProps: { ...localElement.defaultProps, description: e.target.value }
                })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                placeholder="Deskripsi section..."
              />
            </div>
          </>
        )

      default:
        return (
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wider">Pertanyaan</label>
            <input
              type="text"
              value={localElement.question}
              onChange={(e) => setLocalElement({ ...localElement, question: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
              placeholder="Masukkan pertanyaan..."
            />
          </div>
        )
    }
  }

  return (
    <>
      {/* Modal Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        onClick={handleClose}
      >
        <div
          className="relative w-full max-w-2xl bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
            <div>
              <h3 className="font-display text-lg font-semibold text-white">Properti Elemen</h3>
              <p className="text-xs text-white/30">{localElement.label}</p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center transition-colors"
            >
              <Icon name="x" className="w-5 h-5 text-white/50" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
            {renderProperties()}

            {/* Required & Penanda */}
            <div className="pt-4 border-t border-white/[0.06]">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Wajib Diisi</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                      <input
                        type="radio"
                        checked={localElement.required === true}
                        onChange={() => setLocalElement({ ...localElement, required: true })}
                        className="accent-cyan-400"
                      /> Ya
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                      <input
                        type="radio"
                        checked={localElement.required === false}
                        onChange={() => setLocalElement({ ...localElement, required: false })}
                        className="accent-cyan-400"
                      /> Tidak
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Jadikan Penanda</label>
                  <select
                    value={localElement.isIdentifier ? localElement.identifierType || 'custom' : 'none'}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === 'none') {
                        setLocalElement({ ...localElement, isIdentifier: false, identifierType: undefined })
                      } else {
                        setLocalElement({ ...localElement, isIdentifier: true, identifierType: value as 'name' | 'location' | 'email' | 'phone' | 'custom' })
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none focus:border-cyan-400/40 transition-all"
                  >
                    <option value="none" className="bg-[#0e0e1a]">Tidak</option>
                    <option value="name" className="bg-[#0e0e1a]">🏷️ Nama Responden</option>
                    <option value="location" className="bg-[#0e0e1a]">📍 Lokasi / Asal</option>
                    <option value="email" className="bg-[#0e0e1a]">📧 Email</option>
                    <option value="phone" className="bg-[#0e0e1a]">📞 Telepon</option>
                    <option value="custom" className="bg-[#0e0e1a]">🔖 Custom</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Scoring */}
            <div className="pt-4 border-t border-white/[0.06]">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Skema Penilaian</label>
                  <select
                    value={localElement.scoringScheme || 'none'}
                    onChange={(e) => setLocalElement({ ...localElement, scoringScheme: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none focus:border-cyan-400/40 transition-all"
                  >
                    <option value="none" className="bg-[#0e0e1a]">Tidak Dinilai</option>
                    <option value="binary" className="bg-[#0e0e1a]">Benar/Salah</option>
                    <option value="likert" className="bg-[#0e0e1a]">Likert</option>
                    <option value="rating" className="bg-[#0e0e1a]">Rating</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Bobot</label>
                  <input
                    type="number"
                    value={localElement.weight || 1}
                    onChange={(e) => setLocalElement({ ...localElement, weight: parseInt(e.target.value) || 1 })}
                    min={1}
                    max={10}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] flex-shrink-0">
            <button
              onClick={() => {
                if (localElement) {
                  // Reset ke default
                  const resetElement: CanvasElement = {
                    ...localElement,
                    required: false,
                    isIdentifier: false,
                    identifierType: undefined,
                    scoringScheme: 'none',
                    weight: 1,
                  }
                  setLocalElement(resetElement)
                }
              }}
              className="px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/[0.03] transition-all"
            >
              Reset
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.03] transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25 flex items-center gap-2"
              >
                <Icon name="save" className="w-4 h-4" /> Simpan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
          <div className="relative w-full max-w-md bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Icon name="alertCircle" className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">Perubahan Belum Disimpan</h3>
              <p className="text-sm text-white/50 mb-6">
                Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin keluar?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 hover:text-white transition-all"
                >
                  Lanjutkan Edit
                </button>
                <button
                  onClick={() => {
                    setShowConfirm(false)
                    onClose()
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-medium text-white transition-all"
                >
                  Keluar Tanpa Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}