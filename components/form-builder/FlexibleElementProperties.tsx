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
  IndicatorItem,
  IndicatorScale,
} from './ElementTypes'
import { uploadImage } from '@/lib/firebase/storage'

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
    if (['single-choice', 'multiple-choice', 'dropdown'].includes(type)) {
      const isMultiple = type === 'multiple-choice'
      const correctAnswer = config.correctAnswer
      const isCorrect = (opt: string) => {
        if (isMultiple && Array.isArray(correctAnswer)) {
          return correctAnswer.includes(opt)
        }
        return opt === correctAnswer
      }
      
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wider flex items-center justify-between">
              <span>Pengaturan Opsi Pilihan</span>
              <button
                type="button"
                onClick={() => {
                  const newOptions = [...(config.options || []), `Opsi ${(config.options || []).length + 1}`]
                  setLocalElement({ ...localElement, config: { ...config, options: newOptions } })
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                <Icon name="plus" className="w-3 h-3" /> Tambah Opsi
              </button>
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {(config.options || []).map((opt: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-white/20 w-5 shrink-0">{index + 1}.</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...(config.options || [])]
                      newOptions[index] = e.target.value
                      setLocalElement({ ...localElement, config: { ...config, options: newOptions } })
                    }}
                    className="flex-1 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40"
                    placeholder={`Opsi ${index + 1}`}
                  />
                  {isCorrect(opt) && (
                    <span className="text-[10px] text-emerald-400 font-medium shrink-0">✅ Benar</span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const newOptions = (config.options || []).filter((_: string, i: number) => i !== index)
                      setLocalElement({ ...localElement, config: { ...config, options: newOptions } })
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                  >
                    <Icon name="trash" className="w-4 h-4 text-white/30 hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* KUNCI JAWABAN */}
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wider">
              {isMultiple ? 'Kunci Jawaban (Pilih yang benar)' : 'Kunci Jawaban Kompetensi'}
            </label>
            <div className="space-y-1.5">
              {(config.options || []).map((opt: string, i: number) => {
                const isChecked = isCorrect(opt)
                return (
                  <label key={i} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                    isChecked ? 'bg-emerald-500/10 border border-emerald-500/20' : 'hover:bg-white/[0.03]'
                  }`}>
                    <input
                      type={isMultiple ? 'checkbox' : 'radio'}
                      name={`correct-answer-${localElement.id}`}
                      checked={isChecked}
                      onChange={() => {
                        let newCorrectAnswer: string | string[] | undefined
                        if (isMultiple) {
                          const current = Array.isArray(config.correctAnswer) ? config.correctAnswer : []
                          newCorrectAnswer = isChecked 
                            ? current.filter((v: string) => v !== opt)
                            : [...current, opt]
                        } else {
                          newCorrectAnswer = isChecked ? undefined : opt
                        }
                        setLocalElement({
                          ...localElement,
                          config: { ...config, correctAnswer: newCorrectAnswer }
                        })
                      }}
                      className="accent-cyan-400 w-4 h-4 cursor-pointer"
                    />
                    <span className={`text-sm ${isChecked ? 'text-white/90' : 'text-white/50'}`}>{opt}</span>
                    {isChecked && (
                      <span className="ml-auto text-[10px] text-emerald-400">
                        {isMultiple ? '✅ Benar' : '✅ Kunci'}
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
            <p className="text-[10px] text-white/20 mt-1">
              {isMultiple 
                ? 'Pilih semua opsi yang merupakan jawaban benar (Partial scoring)' 
                : 'Pilih satu opsi sebagai jawaban benar'}
            </p>
          </div>

          {/* BOBOT JAWABAN */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Bobot Jawaban Benar</label>
              <input
                type="number"
                value={config.scoreCorrect ?? 1}
                onChange={(e) => setLocalElement({
                  ...localElement,
                  config: { ...config, scoreCorrect: parseInt(e.target.value) || 1 }
                })}
                min={0}
                max={100}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Bobot Jawaban Salah</label>
              <input
                type="number"
                value={config.scoreIncorrect ?? 0}
                onChange={(e) => setLocalElement({
                  ...localElement,
                  config: { ...config, scoreIncorrect: parseInt(e.target.value) || 0 }
                })}
                min={0}
                max={100}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
              />
            </div>
          </div>
          {isMultiple && Array.isArray(config.correctAnswer) && config.correctAnswer.length > 0 && (
            <div className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
              <p className="text-[10px] text-cyan-400">
                💡 Total jawaban benar: {config.correctAnswer.length} opsi
                {config.scoreCorrect !== undefined && ` · Nilai per opsi: ${(config.scoreCorrect / config.correctAnswer.length).toFixed(2)} poin`}
              </p>
            </div>
          )}
        </div>
      )
    }

    if (['short-text', 'long-text'].includes(type)) {
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wider">Placeholder Input</label>
            <input
              type="text"
              value={config.placeholder || ''}
              onChange={(e) => setLocalElement({
                ...localElement,
                config: { ...config, placeholder: e.target.value }
              })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40"
              placeholder="Tulis contoh pengisian..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Min Karakter</label>
              <input
                type="number"
                value={config.minLength || 0}
                onChange={(e) => setLocalElement({
                  ...localElement,
                  config: { ...config, minLength: parseInt(e.target.value) || 0 }
                })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Max Karakter</label>
              <input
                type="number"
                value={config.maxLength || (type === 'short-text' ? 200 : 1000)}
                onChange={(e) => setLocalElement({
                  ...localElement,
                  config: { ...config, maxLength: parseInt(e.target.value) || 0 }
                })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      )
    }

    // ============================================================
    // ===== INDICATOR TABLE - DIPERBAIKI =====
    // ============================================================
    if (type === 'indicator-table') {
      // Helper untuk menghitung max score
      const getMaxScaleValue = (): number => {
        const scales = config.indicatorScales || []
        if (scales.length === 0) return 5
        return Math.max(...scales.map((s: IndicatorScale) => s.value))
      }

      const getTotalMaxScore = (): number => {
        const indicators = config.indicators || []
        const maxVal = getMaxScaleValue()
        let total = 0
        indicators.forEach((ind: IndicatorItem) => {
          total += (ind.weight || 1) * maxVal
        })
        return total
      }

      return (
        <div className="space-y-5">
          {/* ===== SKALA JAWABAN ===== */}
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wider flex items-center justify-between">
              <span>Skala Jawaban (Kolom)</span>
              <button
                type="button"
                onClick={() => {
                  const currentScales = config.indicatorScales || []
                  const newScales = [
                    ...currentScales,
                    { value: currentScales.length + 1, label: `Skala ${currentScales.length + 1}` }
                  ]
                  setLocalElement({ 
                    ...localElement, 
                    config: { ...config, indicatorScales: newScales, indicatorColumns: newScales.length } 
                  })
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                <Icon name="plus" className="w-3 h-3" /> Tambah Skala
              </button>
            </label>
            
            {/* Preset Skala */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { label: 'Ya/Tidak', scales: [{ value: 1, label: 'Ya' }, { value: 0, label: 'Tidak' }] },
                { label: 'STS-SS (5)', scales: [
                  { value: 1, label: 'STS' }, { value: 2, label: 'TS' }, 
                  { value: 3, label: 'N' }, { value: 4, label: 'S' }, { value: 5, label: 'SS' }
                ]},
                { label: '1-4', scales: [
                  { value: 1, label: '1' }, { value: 2, label: '2' }, 
                  { value: 3, label: '3' }, { value: 4, label: '4' }
                ]},
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setLocalElement({
                    ...localElement,
                    config: { ...config, indicatorScales: preset.scales, indicatorColumns: preset.scales.length }
                  })}
                  className="px-3 py-1.5 rounded-lg text-[10px] bg-white/[0.03] border border-white/[0.06] text-white/50 hover:text-white hover:border-cyan-500/30 transition-all"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            
            {(!config.indicatorScales || config.indicatorScales.length === 0) ? (
              <div className="text-center py-4 text-white/20">
                <Icon name="columns" className="w-6 h-6 mx-auto mb-1 opacity-30" />
                <p className="text-xs">Gunakan preset di atas atau tambah manual.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                {(config.indicatorScales || []).map((scale: IndicatorScale, index: number) => {
                  const isLowest = scale.value === Math.min(...config.indicatorScales.map((s: IndicatorScale) => s.value))
                  const isHighest = scale.value === Math.max(...config.indicatorScales.map((s: IndicatorScale) => s.value))
                  
                  return (
                    <div key={index} className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      isLowest ? 'bg-red-500/5 border border-red-500/10' :
                      isHighest ? 'bg-emerald-500/5 border border-emerald-500/10' :
                      'hover:bg-white/[0.02]'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                        isLowest ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                        isHighest ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                        'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      }`}>
                        {scale.value}
                      </div>
                      <input
                        type="text"
                        value={scale.label}
                        onChange={(e) => {
                          const newScales = [...(config.indicatorScales || [])]
                          newScales[index] = { ...newScales[index], label: e.target.value }
                          setLocalElement({ ...localElement, config: { ...config, indicatorScales: newScales } })
                        }}
                        className="flex-1 px-3 py-2 rounded-lg bg-transparent border border-transparent hover:border-white/[0.06] focus:border-cyan-400/40 text-sm text-white focus:outline-none transition-all"
                        placeholder="Label skala"
                      />
                      <span className="text-[10px] text-white/20 shrink-0">
                        {isLowest ? '⬅️ Terendah' : isHighest ? 'Tertinggi ➡️' : `${scale.value} poin`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newScales = (config.indicatorScales || []).filter((_: IndicatorScale, i: number) => i !== index)
                          setLocalElement({ 
                            ...localElement, 
                            config: { ...config, indicatorScales: newScales, indicatorColumns: newScales.length } 
                          })
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                        title="Hapus skala"
                      >
                        <Icon name="trash" className="w-4 h-4 text-white/30 hover:text-red-400" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Info skala */}
            {config.indicatorScales && config.indicatorScales.length > 0 && (
              <div className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                <div className="flex items-center gap-2 text-[10px] text-cyan-400/70">
                  <Icon name="info" className="w-3.5 h-3.5" />
                  <span>
                    Skala: {config.indicatorScales.map((s: IndicatorScale) => `${s.label}=${s.value}`).join(' | ')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-cyan-400/40 mt-0.5">
                  <span>⬅️ Rendah ({config.indicatorScales[0]?.label}={config.indicatorScales[0]?.value})</span>
                  <span className="w-8 h-0.5 bg-cyan-400/20 rounded-full" />
                  <span>Tinggi ({config.indicatorScales[config.indicatorScales.length - 1]?.label}={config.indicatorScales[config.indicatorScales.length - 1]?.value}) ➡️</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.06]" />

          {/* ===== DAFTAR PERTANYAAN / INDIKATOR ===== */}
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wider flex items-center justify-between">
              <span>Daftar Pertanyaan ({config.indicators?.length || 0})</span>
              <button
                type="button"
                onClick={() => {
                  const newIndicators = [
                    ...(config.indicators || []),
                    {
                      id: `q-${Date.now()}`,
                      label: `Pertanyaan ${(config.indicators || []).length + 1}`,
                      weight: 1,
                      reverse: false,
                    }
                  ]
                  setLocalElement({ ...localElement, config: { ...config, indicators: newIndicators } })
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                <Icon name="plus" className="w-3 h-3" /> Tambah Pertanyaan
              </button>
            </label>
            
            {(!config.indicators || config.indicators.length === 0) ? (
              <div className="text-center py-8 text-white/20">
                <Icon name="table" className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Belum ada pertanyaan.</p>
                <p className="text-[10px] mt-1">Klik "Tambah Pertanyaan" untuk memulai.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {(config.indicators || []).map((item: IndicatorItem, index: number) => {
                  const maxVal = getMaxScaleValue()
                  const maxScore = (item.weight || 1) * maxVal
                  
                  return (
                    <div 
                      key={item.id || index} 
                      className={`p-3 rounded-xl border transition-all group ${
                        item.reverse === true 
                          ? 'bg-amber-500/5 border-amber-500/20' 
                          : 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.08]'
                      }`}
                    >
                      {/* Header: Nomor + Label */}
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${
                          item.reverse === true 
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
                            : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                        }`}>
                          {index + 1}
                        </div>
                        
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => {
                            const newIndicators = [...(config.indicators || [])]
                            newIndicators[index] = { ...newIndicators[index], label: e.target.value }
                            setLocalElement({ ...localElement, config: { ...config, indicators: newIndicators } })
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-transparent border border-transparent hover:border-white/[0.06] focus:border-cyan-400/40 text-sm text-white placeholder-white/20 focus:outline-none transition-all"
                          placeholder={`Pertanyaan ${index + 1}`}
                        />
                        
                        <button
                          type="button"
                          onClick={() => {
                            const newIndicators = (config.indicators || []).filter((_: IndicatorItem, i: number) => i !== index)
                            setLocalElement({ ...localElement, config: { ...config, indicators: newIndicators } })
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                        >
                          <Icon name="trash" className="w-4 h-4 text-white/30 hover:text-red-400" />
                        </button>
                      </div>
                      
                      {/* Body: Reverse + Bobot + Info Skor */}
                      <div className="flex items-center gap-4 mt-2 ml-9 flex-wrap">
                        {/* REVERSE SCORING */}
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.reverse === true}
                            onChange={(e) => {
                              const newIndicators = [...(config.indicators || [])]
                              newIndicators[index] = { ...newIndicators[index], reverse: e.target.checked }
                              setLocalElement({ ...localElement, config: { ...config, indicators: newIndicators } })
                            }}
                            className="accent-cyan-400 w-3.5 h-3.5 cursor-pointer rounded"
                          />
                          <span className={`text-[10px] ${item.reverse ? 'text-amber-400 font-medium' : 'text-white/30'}`}>
                            {item.reverse ? '🔄 STS=Baik (Reverse)' : '↕ Normal (SS=Baik)'}
                          </span>
                        </label>
                        
                        {/* BOBOT */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-white/30">⚖️ Bobot:</span>
                          <input
                            type="number"
                            value={item.weight || 1}
                            onChange={(e) => {
                              const newIndicators = [...(config.indicators || [])]
                              newIndicators[index] = { ...newIndicators[index], weight: parseInt(e.target.value) || 1 }
                              setLocalElement({ ...localElement, config: { ...config, indicators: newIndicators } })
                            }}
                            min={1}
                            max={10}
                            className="w-14 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white focus:outline-none focus:border-cyan-400/40 text-center"
                          />
                          <span className="text-[10px] text-white/20">×</span>
                        </div>
                        
                        {/* INFO SKOR MAKSIMAL */}
                        <div className="ml-auto">
                          <span className={`text-[10px] ${maxScore > 0 ? 'text-emerald-400/60' : 'text-white/20'}`}>
                            📊 Maks: {maxScore} poin
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* OPSI TAMBAHAN */}
          <div className="pt-3 border-t border-white/[0.06] space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Label Kolom Pertanyaan</label>
              <input
                type="text"
                value={config.indicatorTitle || 'Pertanyaan'}
                onChange={(e) => setLocalElement({
                  ...localElement,
                  config: { ...config, indicatorTitle: e.target.value }
                })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-cyan-400/40"
                placeholder="Label kolom pertanyaan..."
              />
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showTotalScore === true}
                  onChange={(e) => setLocalElement({
                    ...localElement,
                    config: { ...config, showTotalScore: e.target.checked }
                  })}
                  className="accent-cyan-400 w-4 h-4 cursor-pointer rounded"
                />
                <span>Tampilkan Total Skor</span>
              </label>

              <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showWeightedScore === true}
                  onChange={(e) => setLocalElement({
                    ...localElement,
                    config: { ...config, showWeightedScore: e.target.checked }
                  })}
                  className="accent-cyan-400 w-4 h-4 cursor-pointer rounded"
                />
                <span>Skor Berbobot</span>
              </label>

              {/* Total Skor Maksimal */}
              {config.indicators && config.indicators.length > 0 && (
                <span className="text-[10px] text-cyan-400/60 bg-cyan-500/5 px-3 py-1 rounded-full border border-cyan-500/10">
                  Total Maks: {getTotalMaxScore()} poin
                </span>
              )}
            </div>
          </div>

          {/* ===== PREVIEW MINI TABEL ===== */}
          {config.indicators && config.indicators.length > 0 && config.indicatorScales && config.indicatorScales.length > 0 && (
            <div className="pt-3 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-white/50 uppercase tracking-wider">Pratinjau Tabel</label>
                <div className="flex items-center gap-3 text-[9px] text-white/20">
                  <span>📊 {config.indicators.length} pertanyaan</span>
                  <span>📋 {config.indicatorScales.length} skala</span>
                  <span>⚖️ {config.indicators.reduce((sum: number, ind: IndicatorItem) => sum + (ind.weight || 1), 0)} total bobot</span>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-white/[0.03]">
                      <th className="text-left py-2 px-3 text-white/40 font-medium border-r border-white/[0.05] w-8">#</th>
                      <th className="text-left py-2 px-3 text-white/40 font-medium border-r border-white/[0.05] min-w-[150px]">
                        {config.indicatorTitle || 'Pertanyaan'}
                        {config.indicators?.some((ind: IndicatorItem) => ind.reverse === true) && (
                          <span className="text-[9px] text-amber-400/60 ml-1">(↕ STS=baik)</span>
                        )}
                      </th>
                      {(config.indicatorScales || []).map((scale: IndicatorScale, i: number) => {
                        const isLowest = scale.value === Math.min(...config.indicatorScales.map((s: IndicatorScale) => s.value))
                        const isHighest = scale.value === Math.max(...config.indicatorScales.map((s: IndicatorScale) => s.value))
                        
                        return (
                          <th key={i} className={`text-center py-2 px-3 font-medium border-r border-white/[0.05] min-w-[40px] ${
                            isLowest ? 'text-red-400/60' : isHighest ? 'text-emerald-400/60' : 'text-white/40'
                          }`}>
                            <div className="flex flex-col items-center">
                              <span className="font-bold">{scale.label}</span>
                              <span className="text-[8px] text-white/20">({scale.value})</span>
                            </div>
                          </th>
                        )
                      })}
                      {config.showTotalScore && (
                        <th className="text-center py-2 px-3 text-white/40 font-medium min-w-[50px]">Skor</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(config.indicators || []).slice(0, 4).map((indicator: IndicatorItem, i: number) => {
                      const isReverse = indicator.reverse === true
                      const maxVal = getMaxScaleValue()
                      const displayLabel = isReverse ? `${indicator.label} 🔄` : indicator.label
                      
                      return (
                        <tr key={i} className={`border-t border-white/[0.03] hover:bg-white/[0.01] ${isReverse ? 'bg-amber-500/5' : ''}`}>
                          <td className="py-2 px-3 text-white/30 border-r border-white/[0.05] text-center">{i + 1}</td>
                          <td className="py-2 px-3 text-white/60 border-r border-white/[0.05] truncate max-w-[150px]">
                            {displayLabel}
                            {isReverse && (
                              <span className="text-[8px] text-amber-400/50 ml-1">(STS=baik)</span>
                            )}
                            <span className="text-[8px] text-white/20 ml-1">×{indicator.weight || 1}</span>
                          </td>
                          {(config.indicatorScales || []).map((scale: IndicatorScale, j: number) => {
                            const isHighlight = (isReverse && scale.value === 1) || (!isReverse && scale.value === maxVal)
                            return (
                              <td key={j} className="text-center py-2 px-3 border-r border-white/[0.05]">
                                <div className={`w-4 h-4 mx-auto rounded-full border transition-all ${
                                  isHighlight
                                    ? 'border-emerald-400/50 bg-emerald-500/10 ring-1 ring-emerald-400/30'
                                    : 'border-white/10'
                                }`} />
                              </td>
                            )
                          })}
                          {config.showTotalScore && (
                            <td className="text-center py-2 px-3 text-white/20">-</td>
                          )}
                        </tr>
                      )
                    })}
                    {config.indicators.length > 4 && (
                      <tr className="border-t border-white/[0.03]">
                        <td colSpan={2 + (config.indicatorScales || []).length + (config.showTotalScore ? 1 : 0)} 
                            className="py-2 px-3 text-center text-[10px] text-white/20">
                          + {config.indicators.length - 4} pertanyaan lainnya
                        </td>
                      </tr>
                    )}
                    {config.showTotalScore && (
                      <tr className="border-t border-white/[0.06] bg-white/[0.02]">
                        <td colSpan={2} className="py-2 px-3 text-white/50 font-medium text-right border-r border-white/[0.05]">
                          Total Skor Maksimal
                        </td>
                        {(config.indicatorScales || []).map((_: IndicatorScale, i: number) => (
                          <td key={i} className="border-r border-white/[0.05]"></td>
                        ))}
                        <td className="text-center py-2 px-3 text-cyan-400 font-bold">
                          {getTotalMaxScore()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )
    }

    // ===== SIGNATURE =====
    if (type === 'signature') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Lebar Canvas (px)</label>
              <input
                type="number"
                value={config.signatureWidth || 400}
                onChange={(e) => setLocalElement({
                  ...localElement,
                  config: { ...config, signatureWidth: parseInt(e.target.value) || 400 }
                })}
                min={200}
                max={800}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Tinggi Canvas (px)</label>
              <input
                type="number"
                value={config.signatureHeight || 200}
                onChange={(e) => setLocalElement({
                  ...localElement,
                  config: { ...config, signatureHeight: parseInt(e.target.value) || 200 }
                })}
                min={100}
                max={400}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Warna Pena</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.signaturePenColor || '#000000'}
                  onChange={(e) => setLocalElement({
                    ...localElement,
                    config: { ...config, signaturePenColor: e.target.value }
                  })}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={config.signaturePenColor || '#000000'}
                  onChange={(e) => setLocalElement({
                    ...localElement,
                    config: { ...config, signaturePenColor: e.target.value }
                  })}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white font-mono focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Warna Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.signatureBgColor || '#ffffff'}
                  onChange={(e) => setLocalElement({
                    ...localElement,
                    config: { ...config, signatureBgColor: e.target.value }
                  })}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={config.signatureBgColor || '#ffffff'}
                  onChange={(e) => setLocalElement({
                    ...localElement,
                    config: { ...config, signatureBgColor: e.target.value }
                  })}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wider">Label Tanda Tangan</label>
            <input
              type="text"
              value={config.signatureLabel || 'Tanda Tangan'}
              onChange={(e) => setLocalElement({
                ...localElement,
                config: { ...config, signatureLabel: e.target.value }
              })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
              placeholder="Tanda Tangan"
            />
          </div>

          <div className="pt-3 border-t border-white/[0.06]">
            <label className="text-xs text-white/50 uppercase tracking-wider block mb-2">Pratinjau</label>
            <div 
              className="rounded-xl border-2 border-dashed border-white/[0.08] flex items-center justify-center mx-auto"
              style={{
                width: `${Math.min(config.signatureWidth || 400, 400)}px`,
                height: `${Math.min(config.signatureHeight || 200, 200)}px`,
                backgroundColor: config.signatureBgColor || '#ffffff',
              }}
            >
              <p className="text-xs text-black/30">Area Tanda Tangan</p>
            </div>
          </div>
        </div>
      )
    }

    // ===== RATING =====
    if (type === 'rating') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Min Rating</label>
              <input
                type="number"
                value={config.ratingMin || 1}
                onChange={(e) => setLocalElement({
                  ...localElement,
                  config: { ...config, ratingMin: parseInt(e.target.value) || 1 }
                })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wider">Max Rating</label>
              <input
                type="number"
                value={config.ratingMax || 5}
                onChange={(e) => setLocalElement({
                  ...localElement,
                  config: { ...config, ratingMax: parseInt(e.target.value) || 5 }
                })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <span className="text-xs text-white/30">Preview:</span>
            <div className="flex gap-1">
              {Array.from({ length: config.ratingMax || 5 }, (_: any, i: number) => (
                <span key={i} className={`text-lg ${i < 3 ? 'text-amber-400' : 'text-white/15'}`}>★</span>
              ))}
            </div>
          </div>
        </div>
      )
    }

    // ===== NUMBER =====
    if (type === 'number') {
      return (
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wider">Min</label>
            <input
              type="number"
              value={config.min !== undefined ? config.min : 0}
              onChange={(e) => setLocalElement({ ...localElement, config: { ...config, min: parseInt(e.target.value) || 0 } })}
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wider">Max</label>
            <input
              type="number"
              value={config.max !== undefined ? config.max : 100}
              onChange={(e) => setLocalElement({ ...localElement, config: { ...config, max: parseInt(e.target.value) || 0 } })}
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wider">Step</label>
            <input
              type="number"
              value={config.step !== undefined ? config.step : 1}
              onChange={(e) => setLocalElement({ ...localElement, config: { ...config, step: parseInt(e.target.value) || 1 } })}
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
            />
          </div>
        </div>
      )
    }

    // ===== DATE =====
    if (type === 'date') {
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wider">Format Tanggal</label>
            <select
              value={config.dateFormat || 'DD/MM/YYYY'}
              onChange={(e) => setLocalElement({
                ...localElement,
                config: { ...config, dateFormat: e.target.value }
              })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none"
            >
              <option value="DD/MM/YYYY" className="bg-[#0e0e1a]">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY" className="bg-[#0e0e1a]">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD" className="bg-[#0e0e1a]">YYYY-MM-DD</option>
            </select>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <p className="text-xs text-white/30">Preview:</p>
            <input
              type="date"
              disabled
              className="mt-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/40 cursor-not-allowed"
            />
          </div>
        </div>
      )
    }

    // ===== FILE UPLOAD =====
    if (type === 'file-upload') {
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wider">Tipe File yang Diizinkan</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'image/*', label: 'Gambar (JPG, PNG)' },
                { value: 'application/pdf', label: 'PDF' },
                { value: '.doc,.docx', label: 'Word (DOC, DOCX)' },
                { value: '.xls,.xlsx', label: 'Excel (XLS, XLSX)' },
                { value: '.ppt,.pptx', label: 'PowerPoint' },
                { value: '.txt', label: 'Text (TXT)' },
              ].map((fileType) => (
                <label key={fileType.value} className="flex items-center gap-2 text-xs text-white/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(config.fileTypes || []).includes(fileType.value)}
                    onChange={(e) => {
                      const currentTypes = config.fileTypes || []
                      let newTypes: string[]
                      if (e.target.checked) {
                        newTypes = [...currentTypes, fileType.value]
                      } else {
                        newTypes = currentTypes.filter((t: string) => t !== fileType.value)
                      }
                      setLocalElement({
                        ...localElement,
                        config: { ...config, fileTypes: newTypes }
                      })
                    }}
                    className="accent-cyan-400 w-3.5 h-3.5 cursor-pointer"
                  />
                  {fileType.label}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wider">Ukuran Maksimal File (MB)</label>
            <input
              type="number"
              value={config.maxFileSize || 5}
              onChange={(e) => setLocalElement({
                ...localElement,
                config: { ...config, maxFileSize: parseInt(e.target.value) || 5 }
              })}
              min={1}
              max={25}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
            />
          </div>
        </div>
      )
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