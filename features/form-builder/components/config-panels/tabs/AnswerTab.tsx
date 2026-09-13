// config-panels/tabs/AnswerTab.tsx
// Tab "Jawaban & Opsi" — ganti tipe render input + panel konfigurasi per tipe.

'use client'

import { Icon } from '@/components/ui/Icons'
import { FlexibleQuestion, ANSWER_TYPES, getDefaultConfig, AnswerType } from './../../shared/ElementTypes'
import { ChoiceConfig } from './../choice-config'
import { TextConfig } from './../text-config'
import { IndicatorTableConfig } from './../indicator-table-config'
import { SignatureConfig } from './../signature-config'
import { RatingConfig } from './../rating-config'
import { NumberConfig } from './../number-config'
import { DateConfig } from './../date-config'
import { FileUploadConfig } from './../file-upload-config'

interface AnswerTabProps {
  element: FlexibleQuestion
  setElement: (updated: FlexibleQuestion) => void
}

export function AnswerTab({ element, setElement }: AnswerTabProps) {
  const handleAnswerTypeChange = (newType: AnswerType) => {
    const currentType = element.answerType
    const currentConfig = element.config

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

    setElement({
      ...element,
      answerType: newType,
      config: newConfig,
      scoring: {
        ...element.scoring,
        scheme: newType === 'indicator-table' ? 'indicator' :
                newType === 'rating' ? 'rating' :
                newType === 'single-choice' || newType === 'multiple-choice' ? 'binary' : 'none'
      }
    })
  }

  // ============ RENDER CONFIG BY TYPE ============
  const renderConfigByType = (type: string, config: any) => {
    const panelProps = { config, element, onUpdate: setElement }

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

  const config = element.config
  const answerType = element.answerType

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
                element.answerType === type.value
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
