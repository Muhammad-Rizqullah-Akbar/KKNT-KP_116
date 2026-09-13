// components/form-builder/FlexibleElementProperties.tsx

'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/Icons'
import { FlexibleQuestion } from './../shared/ElementTypes'
import { BasicTab } from '././tabs/BasicTab'
import { AnswerTab } from '././tabs/AnswerTab'
import { MediaTab } from '././tabs/MediaTab'

interface FlexibleElementPropertiesProps {
  element: FlexibleQuestion | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedElement: FlexibleQuestion) => void
  formId?: string | null
  formCode?: string
  validationMode?: 'all_required' | 'all_required_except' | 'free'
  validationExceptions?: string[]
  allowScoringOverride?: boolean
  onScoringOverride?: (questionId: string, points: number | null) => void
}

export function FlexibleElementProperties({
  element,
  isOpen,
  onClose,
  onSave,
  formId,
  formCode,
  validationMode = 'all_required',
  validationExceptions = [],
  allowScoringOverride = true,
  onScoringOverride,
}: FlexibleElementPropertiesProps) {
  const [localElement, setLocalElement] = useState<FlexibleQuestion | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'answer' | 'media'>('basic')

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

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      >
        <div
          className="relative w-full max-w-2xl bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
            <div>
              <h3 className="font-display text-lg font-semibold text-white">Properti Konfigurasi Elemen</h3>
              <p className="text-xs text-white/30">
                {localElement.answerType === 'indicator-table'
                  ? 'Konfigurasi Tabel Pertanyaan'
                  : localElement.answerType === 'signature'
                  ? 'Konfigurasi Tanda Tangan'
                  : 'Modifikasi fleksibel tipe input & kelola media kuesioner'}
              </p>
            </div>
            <button onClick={handleClose} className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center transition-colors">
              <Icon name="x" className="w-5 h-5 text-white/50" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 px-6 pt-2 border-b border-white/[0.06] shrink-0 overflow-x-auto custom-scrollbar">
            {[
              { id: 'basic', label: 'Dasar', icon: 'settings' },
              { id: 'answer', label: localElement.answerType === 'indicator-table' ? 'Pertanyaan & Skala' : localElement.answerType === 'signature' ? 'Pengaturan' : 'Jawaban & Opsi', icon: localElement.answerType === 'indicator-table' ? 'table' : localElement.answerType === 'signature' ? 'edit' : 'list' },
              { id: 'media', label: 'Media Lampiran', icon: 'image' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-medium transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-cyan-400 border-cyan-400'
                    : 'text-white/40 border-transparent hover:text-white/70'
                }`}
              >
                <Icon name={tab.icon as any} className="w-3.5 h-3.5 inline mr-1.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-grid-pattern">
            {activeTab === 'basic' && (
              <BasicTab
                element={localElement}
                setElement={setLocalElement}
                validationMode={validationMode}
                validationExceptions={validationExceptions}
              />
            )}
            {activeTab === 'answer' && (
              <AnswerTab element={localElement} setElement={setLocalElement} />
            )}
            {activeTab === 'media' && (
              <MediaTab
                element={localElement}
                setElement={setLocalElement}
                formId={formId}
                formCode={formCode}
              />
            )}
          </div>

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06] shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.03] transition-all"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25 flex items-center gap-2"
            >
              <Icon name="save" className="w-4 h-4" /> Simpan Konfigurasi
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Unsaved Changes Box */}
      {showConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80" onClick={() => setShowConfirm(false)}>
          <div className="relative w-full max-w-md bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Icon name="alertCircle" className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">Perubahan Belum Disimpan</h3>
              <p className="text-sm text-white/50 mb-6">Keluar tanpa menerapkan perubahan baru pada pertanyaan ini?</p>
              <div className="flex gap-3 justify-center">
                <button type="button" onClick={() => setShowConfirm(false)} className="px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 hover:text-white">
                  Lanjutkan Edit
                </button>
                <button type="button" onClick={() => { setShowConfirm(false); onClose() }} className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-medium text-white shadow-lg">
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
