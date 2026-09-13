// components/form-builder/FlexibleElementProperties.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { Icon } from '@/components/ui/Icons'
import { 
  FlexibleQuestion, 
  ANSWER_TYPES, 
  MEDIA_TYPES, 
  IDENTIFIER_TYPES, 
  getDefaultConfig,
  AnswerType,
} from './../shared/ElementTypes'
import { uploadImage } from '@/lib/infra/storage'
import { ChoiceConfig } from '././choice-config'
import { TextConfig } from '././text-config'
import { IndicatorTableConfig } from '././indicator-table-config'
import { SignatureConfig } from '././signature-config'
import { RatingConfig } from '././rating-config'
import { NumberConfig } from '././number-config'
import { DateConfig } from '././date-config'
import { FileUploadConfig } from '././file-upload-config'

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
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // ===== CEK APAKAH PERTANYAAN TERMASUK EXCEPTION =====
  const isException = (questionId: string): boolean => {
    return validationExceptions.includes(questionId)
  }

  // ===== CEK APAKAH PERTANYAAN WAJIB =====
  const isQuestionRequired = (): boolean => {
    if (validationMode === 'free') return false
    if (validationMode === 'all_required_except') {
      return !isException(localElement.id)
    }
    return localElement.required
  }

  // ===== APAKAH USER BISA MENGUBAH STATUS WAJIB? =====
  const canChangeRequired = (): boolean => {
    if (validationMode === 'all_required') return false
    if (validationMode === 'free') return false
    if (validationMode === 'all_required_except') {
      return true
    }
    return true
  }

  const handleAnswerTypeChange = (newType: AnswerType) => {
    const currentType = localElement.answerType
    const currentConfig = localElement.config
    
    const isChoiceGroup = (t: string) => ['single-choice', 'multiple-choice', 'dropdown'].includes(t)
    const isTextGroup = (t: string) => ['short-text', 'long-text'].includes(t)
    const isScaleGroup = (t: string) => ['indicator-table', 'rating'].includes(t)

    let newConfig = {}

    if (isChoiceGroup(currentType) && isChoiceGroup(newType)) {
      newConfig = { options: currentConfig.options || ['Opsi 1', 'Opsi 2', 'Opsi 3'] }
      if (newType === 'single-choice' && currentConfig.correctAnswer) {
        newConfig = { ...newConfig, correctAnswer: currentConfig.correctAnswer }
      }
      if (newType === 'multiple-choice' && Array.isArray(currentConfig.correctAnswer)) {
        newConfig = { ...newConfig, correctAnswer: currentConfig.correctAnswer }
      }
    } else if (isTextGroup(currentType) && isTextGroup(newType)) {
      newConfig = { 
        placeholder: currentConfig.placeholder || 'Tulis jawaban...',
        minLength: currentConfig.minLength || 0,
        maxLength: currentConfig.maxLength || (newType === 'short-text' ? 200 : 1000),
      }
    } else if (isScaleGroup(currentType) && isScaleGroup(newType)) {
      newConfig = { ...currentConfig }
    } else {
      newConfig = getDefaultConfig(newType)
    }

    setLocalElement({
      ...localElement,
      answerType: newType,
      config: newConfig,
      scoring: {
        ...localElement.scoring,
        scheme: newType === 'indicator-table' ? 'indicator' : 
                newType === 'rating' ? 'rating' :
                newType === 'single-choice' || newType === 'multiple-choice' ? 'binary' : 'none'
      }
    })
  }

  const handleFileUpload = async (file: File) => {
    const storageFolder = formId || formCode || 'temp_builder'
    
    let detectedType: 'image' | 'file' = 'file'
    if (file.type.startsWith('image/')) {
      detectedType = 'image'
    }

    setIsUploading(true)
    setUploadProgress(0)
    try {
      const url = await uploadImage(
        file,
        'forms',
        storageFolder,
        (progress) => {
          setUploadProgress(progress.progress)
        }
      )
      
      setLocalElement({
        ...localElement,
        media: {
          ...localElement.media,
          type: detectedType,
          url: url,
          caption: localElement.media.caption || file.name,
        }
      })
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Gagal mengunggah dokumen. Silakan coba lagi.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // ============ GET LABEL MODE VALIDASI ============
  const getValidationModeLabel = (): string => {
    switch (validationMode) {
      case 'all_required': return 'Semua Wajib'
      case 'all_required_except': return 'Kecuali yang Dipilih'
      case 'free': return 'Bebas (Tidak Wajib)'
      default: return 'Semua Wajib'
    }
  }

  const getValidationModeDescription = (): string => {
    switch (validationMode) {
      case 'all_required': 
        return '⚡ Semua pertanyaan wajib diisi. Atur di ⚙️ Pengaturan Form → Validasi.'
      case 'all_required_except': 
        return '⚡ Hanya pertanyaan yang dipilih yang opsional. Atur di ⚙️ Pengaturan Form → Validasi.'
      case 'free': 
        return '⚡ Pertanyaan bersifat opsional. Atur di ⚙️ Pengaturan Form → Validasi.'
      default: 
        return '⚡ Semua pertanyaan wajib diisi. Atur di ⚙️ Pengaturan Form → Validasi.'
    }
  }

  const getValidationModeColor = (): string => {
    switch (validationMode) {
      case 'all_required': return 'text-rose-400'
      case 'all_required_except': return 'text-amber-400'
      case 'free': return 'text-emerald-400'
      default: return 'text-rose-400'
    }
  }

  // ============ RENDER CONFIG BY TYPE ============
  const renderConfigByType = (type: string, config: any) => {
    const panelProps = { config, element: localElement, onUpdate: setLocalElement }

    if (['single-choice', 'multiple-choice', 'dropdown'].includes(type)) {
      return <ChoiceConfig type={type} {...panelProps} />
    }

    if (['short-text', 'long-text'].includes(type)) {
      return <TextConfig type={type} {...panelProps} />
    }

    // ============================================================
    // ===== INDICATOR TABLE - DIPERBAIKI =====
    // ============================================================
    if (type === 'indicator-table') {
      return <IndicatorTableConfig {...panelProps} />
    }

    // ===== SIGNATURE =====
    if (type === 'signature') {
      return <SignatureConfig {...panelProps} />
    }

    // ===== RATING =====
    if (type === 'rating') {
      return <RatingConfig {...panelProps} />
    }

    // ===== NUMBER =====
    if (type === 'number') {
      return <NumberConfig {...panelProps} />
    }

    // ===== DATE =====
    if (type === 'date') {
      return <DateConfig {...panelProps} />
    }

    // ===== FILE UPLOAD =====
    if (type === 'file-upload') {
      return <FileUploadConfig {...panelProps} />
    }

    return <p className="text-xs text-white/30 italic">Tidak ada konfigurasi parameter khusus untuk tipe ini.</p>
  }

  // ============ TAB 1: PENGATURAN DASAR ============
  const renderBasicTab = () => {
    const isRequired = isQuestionRequired()
    const canChange = canChangeRequired()
    const isExceptionQuestion = isException(localElement.id)
    
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 uppercase tracking-wider">
            {localElement.answerType === 'indicator-table' ? 'Judul Tabel' : 
             localElement.answerType === 'signature' ? 'Label Tanda Tangan' : 
             'Pertanyaan'} <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={localElement.question}
            onChange={(e) => setLocalElement({ ...localElement, question: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
            placeholder={
              localElement.answerType === 'indicator-table' ? 'Judul tabel pertanyaan...' : 
              localElement.answerType === 'signature' ? 'Label tanda tangan...' :
              'Masukkan pertanyaan...'
            }
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-white/50 uppercase tracking-wider">Deskripsi Tambahan (opsional)</label>
          <input
            type="text"
            value={localElement.description || ''}
            onChange={(e) => setLocalElement({ ...localElement, description: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
            placeholder="Deskripsi atau instruksi pengerjaan..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-white/50 uppercase tracking-wider flex items-center gap-2">
            <span>Sifat Pertanyaan</span>
            <span className="text-[9px] text-white/20 font-normal">
              (mode: <span className={getValidationModeColor()}>{getValidationModeLabel()}</span>)
            </span>
          </label>

          <div className="p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/10 mb-2">
            <div className="flex items-center gap-2">
              <Icon name="info" className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <p className="text-[10px] text-white/40">
                Mode validasi global: 
                <span className={`font-medium ml-1 ${getValidationModeColor()}`}>
                  {getValidationModeLabel()}
                </span>
              </p>
            </div>
            <p className="text-[9px] text-white/25 mt-0.5 ml-5">
              {getValidationModeDescription()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className={`flex items-center gap-2 text-sm cursor-pointer ${
              !canChange || validationMode === 'all_required'
                ? 'text-white/40 cursor-not-allowed' 
                : 'text-white/60 hover:text-white/80'
            }`}>
              <input
                type="radio"
                name="required-radio"
                checked={localElement.required === true}
                onChange={() => {
                  if (canChange) {
                    setLocalElement({ ...localElement, required: true })
                  }
                }}
                disabled={!canChange || validationMode === 'all_required'}
                className={`accent-cyan-400 w-4 h-4 ${
                  !canChange || validationMode === 'all_required' 
                    ? 'opacity-30 cursor-not-allowed' 
                    : 'cursor-pointer'
                }`}
              />
              <span>Ya, Wajib Diisi</span>
              {(validationMode === 'all_required' || !canChange) && (
                <span className="text-[9px] text-white/20 ml-1">(global)</span>
              )}
            </label>
            
            <label className={`flex items-center gap-2 text-sm cursor-pointer ${
              !canChange || validationMode === 'free'
                ? 'text-white/40 cursor-not-allowed' 
                : 'text-white/60 hover:text-white/80'
            }`}>
              <input
                type="radio"
                name="required-radio"
                checked={localElement.required === false}
                onChange={() => {
                  if (canChange) {
                    setLocalElement({ ...localElement, required: false })
                  }
                }}
                disabled={!canChange || validationMode === 'free'}
                className={`accent-cyan-400 w-4 h-4 ${
                  !canChange || validationMode === 'free'
                    ? 'opacity-30 cursor-not-allowed' 
                    : 'cursor-pointer'
                }`}
              />
              <span>Opsional</span>
              {(validationMode === 'free' || !canChange) && (
                <span className="text-[9px] text-white/20 ml-1">(global)</span>
              )}
            </label>

            {validationMode === 'all_required_except' && (
              <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                isExceptionQuestion 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {isExceptionQuestion ? '🔓 Dikecualikan (Opsional)' : '🔒 Wajib (Default)'}
              </span>
            )}

            {localElement.overridePoints !== null && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                ⚡ Override: {localElement.overridePoints} pts
              </span>
            )}
          </div>

          {validationMode === 'all_required_except' && (
            <div className={`mt-2 p-2 rounded-lg ${
              isExceptionQuestion 
                ? 'bg-amber-500/5 border border-amber-500/10'
                : 'bg-rose-500/5 border border-rose-500/10'
            }`}>
              <div className="flex items-center gap-2">
                <Icon name={isExceptionQuestion ? 'checkCircle' : 'alertCircle'} 
                  className={`w-3.5 h-3.5 ${
                    isExceptionQuestion ? 'text-amber-400' : 'text-rose-400'
                  }`} 
                />
                <p className={`text-[10px] ${
                  isExceptionQuestion ? 'text-amber-400/70' : 'text-rose-400/70'
                }`}>
                  {isExceptionQuestion 
                    ? '✅ Pertanyaan ini OPSIONAL (telah ditambahkan ke daftar pengecualian di ⚙️ Pengaturan Form → Validasi)' 
                    : '🔒 Pertanyaan ini WAJIB (belum ditambahkan ke daftar pengecualian)'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
          <label className="text-xs text-white/50 uppercase tracking-wider">Gunakan Sebagai Penanda Biodata</label>
          <select
            value={localElement.identifierType || 'none'}
            onChange={(e) => setLocalElement({
              ...localElement,
              isIdentifier: e.target.value !== 'none',
              identifierType: e.target.value as any,
            })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer"
          >
            {IDENTIFIER_TYPES.map((type) => (
              <option key={type.value} value={type.value} className="bg-[#0e0e1a]">
                {type.label}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-white/25">Pemetaan otomatis kolom identitas responden pada dashboard laporan.</p>
        </div>
      </div>
    )
  }

  // ============ TAB 2: OPSI JAWABAN & TIPE INPUT ============
  const renderAnswerTab = () => {
    const config = localElement.config
    const answerType = localElement.answerType

    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 uppercase tracking-wider">Ubah Tipe Render Input</label>
          <div className="grid grid-cols-2 gap-1.5">
            {ANSWER_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleAnswerTypeChange(type.value)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all text-left flex items-center gap-2 border ${
                  localElement.answerType === type.value
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                    : 'bg-white/[0.02] text-white/50 hover:text-white/80 border-white/[0.05] hover:border-white/10'
                }`}
              >
                <Icon name={type.icon as any} className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{type.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="pt-3 border-t border-white/[0.06]">
          {renderConfigByType(answerType, config)}
        </div>
      </div>
    )
  }

  // ============ TAB 3: MEDIA LAMPIRAN ============
  const renderMediaTab = () => {
    const media = localElement.media
    
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 uppercase tracking-wider">Tipe Lampiran Media</label>
          <div className="grid grid-cols-4 gap-2">
            {MEDIA_TYPES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setLocalElement({
                  ...localElement,
                  media: { type: m.value, url: '', caption: '' }
                })}
                className={`p-3 rounded-xl text-center transition-all border ${
                  media.type === m.value
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                    : 'bg-white/[0.02] text-white/50 hover:text-white/80 border-white/[0.05]'
                }`}
              >
                <Icon name={m.icon as any} className="w-5 h-5 mx-auto mb-1" />
                <span className="text-[10px] block">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {(media.type === 'image' || media.type === 'file') && (
          <div className="space-y-3">
            <label className="text-xs text-white/50 uppercase tracking-wider block">
              {media.type === 'image' ? 'Unggah Berkas Gambar (JPG, PNG)' : 'Unggah Berkas Dokumen (PDF, Word, Docx, xlsx)'}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept={media.type === 'image' ? 'image/*' : '.pdf,.doc,.docx,.xls,.xlsx,.txt'}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
              className="hidden"
            />
            <div 
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isUploading ? 'opacity-50 pointer-events-none border-cyan-400/40 bg-cyan-500/5' : 'border-white/[0.08] hover:border-cyan-500/30'
              }`}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="space-y-2">
                  <Icon name="loader" className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
                  <p className="text-xs text-white/50">Mengunggah ke Firebase Storage... {Math.round(uploadProgress)}%</p>
                </div>
              ) : (
                <div>
                  <Icon name="upload" className="w-6 h-6 text-white/20 mx-auto mb-1" />
                  <p className="text-xs text-white/40">Klik atau seret berkas untuk diunggah</p>
                  <p className="text-[10px] text-white/20">Maksimal kapasitas file: 5MB</p>
                </div>
              )}
            </div>

            {media.url && media.type === 'file' && (
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
                <Icon name="fileText" className="w-8 h-8 text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">Dokumen Berhasil Terupload</p>
                  <a href={media.url} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline">
                    Buka tautan file di tab baru ↗
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setLocalElement({ ...localElement, media: { ...media, url: '' } })}
                  className="p-1 rounded-md hover:bg-white/[0.05] text-white/30 hover:text-white shrink-0"
                >
                  <Icon name="x" className="w-4 h-4" />
                </button>
              </div>
            )}

            {media.url && media.type === 'image' && (
              <div className="mt-2 relative rounded-xl overflow-hidden border border-white/[0.06] max-w-sm mx-auto">
                <img src={media.url} alt="Media Asset" className="w-full h-36 object-cover" />
                <button
                  type="button"
                  onClick={() => setLocalElement({ ...localElement, media: { ...media, url: '' } })}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white/70 hover:text-white"
                >
                  <Icon name="x" className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {media.type === 'video' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider block">Tautan Embed Video</label>
              <input
                type="text"
                value={media.url || ''}
                onChange={(e) => setLocalElement({
                  ...localElement,
                  media: { ...media, url: e.target.value }
                })}
                placeholder="Masukkan link YouTube atau Link Share Google Drive..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40"
              />
              <p className="text-[10px] text-amber-400/80 leading-normal">
                💡 Sistem mengunci integrasi tautan luar guna menghemat bandwidth kuota Firebase server. Silakan pakai link sharing umum.
              </p>
            </div>

            {media.url && (
              <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-xs text-cyan-400 flex items-center gap-2">
                <Icon name="checkCircle" className="w-4 h-4 shrink-0" />
                <span className="truncate">Tautan video berhasil direkam: {media.url}</span>
              </div>
            )}
          </div>
        )}

        {media.type !== 'none' && (
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wider block">Caption / Judul Media</label>
            <input
              type="text"
              value={media.caption || ''}
              onChange={(e) => setLocalElement({
                ...localElement,
                media: { ...media, caption: e.target.value }
              })}
              placeholder="Tulis judul berkas atau arahan media..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-cyan-400/40"
            />
          </div>
        )}
      </div>
    )
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
            {activeTab === 'basic' && renderBasicTab()}
            {activeTab === 'answer' && renderAnswerTab()}
            {activeTab === 'media' && renderMediaTab()}
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
