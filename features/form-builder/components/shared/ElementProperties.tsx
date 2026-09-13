// components/form-builder/ElementProperties.tsx

'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/Icons'
import { CanvasElement } from '././ElementTypes'
import { TextFields } from '././fields/TextFields'
import { ChoiceFields } from '././fields/ChoiceFields'
import { TableBinaryFields } from '././fields/TableBinaryFields'
import { LikertFields } from '././fields/LikertFields'
import { ImageFields } from '././fields/ImageFields'
import { SectionHeaderFields } from '././fields/SectionHeaderFields'
import { DefaultFields } from '././fields/DefaultFields'

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
        return <TextFields element={localElement} setElement={setLocalElement} />

      case 'single-choice':
      case 'multiple-choice':
      case 'dropdown':
      case 'multiselect':
        return <ChoiceFields element={localElement} setElement={setLocalElement} />

      case 'table-binary':
        return <TableBinaryFields element={localElement} setElement={setLocalElement} />

      case 'likert':
        return <LikertFields element={localElement} setElement={setLocalElement} />

      case 'image':
        return <ImageFields element={localElement} setElement={setLocalElement} />

      case 'section-header':
        return <SectionHeaderFields element={localElement} setElement={setLocalElement} />

      default:
        return <DefaultFields element={localElement} setElement={setLocalElement} />
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
