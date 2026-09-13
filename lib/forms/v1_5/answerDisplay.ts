/**
 * Answer Display Helper
 * 
 * Helper functions untuk menampilkan jawaban dengan benar di dashboard.
 * Sejak implementasi answerNormalization, jawaban sudah disimpan sebagai label readable.
 * Helper ini berguna untuk legacy data atau fallback.
 */

import type { BuilderQuestion } from './builderState'

/**
 * Struktur opsi
 */
export interface FormOption {
  optionId?: string
  id?: string
  label?: string
  text?: string
  title?: string
  value?: string | number
  val?: string | number
  score?: number
}

/**
 * Format jawaban untuk display di dashboard/laporan
 * Menghandle both normalized (label) dan legacy (ID) data
 */
export function formatAnswerForDisplay(
  rawValue: any,
  question?: BuilderQuestion | null
): string {
  // Null/undefined
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return '-'
  }

  // Array (multiple choice)
  if (Array.isArray(rawValue)) {
    if (rawValue.length === 0) return '-'
    return rawValue.join(', ')
  }

  // Object (indicator table)
  if (typeof rawValue === 'object') {
    const entries = Object.entries(rawValue)
    if (entries.length === 0) return '-'
    
    // Check if it's already normalized (has label property)
    const firstVal = entries[0][1]
    if (firstVal && typeof firstVal === 'object' && 'label' in firstVal) {
      return entries
        .map(([key, val]: [string, any]) => `${key}: ${val.label || val.value}`)
        .join(', ')
    }
    
    // Legacy format
    return entries
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ')
  }

  // Check if already a readable string (not an ID)
  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim()
    
    // Check if it looks like a label (has spaces or is longer than 2 chars)
    if (trimmed.length > 2 && /\s/.test(trimmed)) {
      return trimmed // Already a label
    }
    
    // Check if it's a short code that needs mapping
    if (trimmed.length <= 3 && question) {
      return mapShortCodeToLabel(trimmed, question)
    }
    
    return trimmed
  }

  // Number
  if (typeof rawValue === 'number') {
    if (question) {
      return mapNumericToLabel(rawValue, question)
    }
    return String(rawValue)
  }

  return String(rawValue)
}

/**
 * Map short code (like "1", "0", "STS") ke label lengkap
 */
function mapShortCodeToLabel(code: string, question: BuilderQuestion): string {
  const type = question.answerType || (question as any).type
  
  if (type === 'single-choice' || type === 'binary' || type === 'dropdown') {
    const rawOptions = question.options || 
                     (question as any).presentation?.options || 
                     (question as any).config?.options || []
    
    const options = rawOptions.map((o: any, idx: number) => {
      if (typeof o === 'string') return { label: o }
      return {
        label: o.label || o.text || o.title,
        optionId: o.optionId || o.id,
      }
    })

    // Try exact match
    let match = options.find(o => o.label?.toLowerCase() === code.toLowerCase())
    
    // Try index match (if code is numeric)
    if (!match) {
      const numIdx = parseInt(code)
      if (!isNaN(numIdx) && numIdx >= 0 && numIdx < options.length) {
        match = options[numIdx]
      }
    }

    if (match?.label) return match.label
  }

  // Scale short codes
  const scaleMap: Record<string, string> = {
    'STS': 'Sangat Tidak Setuju',
    'TS': 'Tidak Setuju',
    'N': 'Netral',
    'S': 'Setuju',
    'SS': 'Sangat Setuju',
    'STMS': 'Sangat Tidak Memenuhi Syarat',
    'TMS': 'Tidak Memenuhi Syarat',
    'MS': 'Memenuhi Syarat',
    'SMS': 'Sangat Memenuhi Syarat',
    'SK': 'Sangat Kurang',
    'K': 'Kurang',
    'C': 'Cukup',
    'B': 'Baik',
    'SB': 'Sangat Baik',
  }

  if (scaleMap[code.toUpperCase()]) {
    return scaleMap[code.toUpperCase()]
  }

  return code
}

/**
 * Map numeric value ke label
 */
function mapNumericToLabel(num: number, question: BuilderQuestion): string {
  const type = question.answerType || (question as any).type

  if (type === 'rating') {
    const ratingLabels: Record<number, string> = {
      1: 'Sangat Buruk',
      2: 'Buruk',
      3: 'Netral',
      4: 'Baik',
      5: 'Sangat Baik',
    }
    return ratingLabels[num] || `${num}/5`
  }

  if (type === 'single-choice' || type === 'binary' || type === 'dropdown') {
    const rawOptions = question.options || 
                     (question as any).presentation?.options || 
                     (question as any).config?.options || []
    
    const options = rawOptions.map((o: any) => {
      if (typeof o === 'string') return { label: o }
      return { label: o.label || o.text || o.title }
    })

    // Index-based (0 or 1-based)
    if (num >= 0 && num < options.length) {
      return options[num]?.label || String(num)
    }
    if (num >= 1 && num <= options.length) {
      return options[num - 1]?.label || String(num)
    }
  }

  if (type === 'indicator-table' || type === 'likert') {
    const scaleLabels: Record<number, string> = {
      1: 'Sangat Buruk',
      2: 'Buruk',
      3: 'Netral',
      4: 'Baik',
      5: 'Sangat Baik',
    }
    return scaleLabels[num] || String(num)
  }

  return String(num)
}

/**
 * Check jika jawaban perlu di-normalisasi (masih berupa ID)
 */
export function needsNormalization(rawValue: any): boolean {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return false
  }

  // String that's just a single digit or short code
  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim()
    // Only single chars that might be indices
    if (trimmed.length <= 1 && /^\d$/.test(trimmed)) {
      return true
    }
    // Short codes
    if (/^(STS|TS|N|S|SS|STMS|TMS|MS|SMS|SK|K|C|B|SB)$/i.test(trimmed)) {
      return true
    }
    return false
  }

  // Numbers (likely indices)
  if (typeof rawValue === 'number') {
    return rawValue >= 0 && rawValue <= 10
  }

  return false
}

/**
 * Get display text untuk indicator table answer
 */
export function formatIndicatorAnswer(
  indicatorAnswers: Record<string, any>
): string {
  if (!indicatorAnswers || typeof indicatorAnswers !== 'object') {
    return '-'
  }

  return Object.entries(indicatorAnswers)
    .map(([indicator, value]) => {
      if (value && typeof value === 'object' && 'label' in value) {
        return `${indicator}: ${value.label}`
      }
      return `${indicator}: ${value}`
    })
    .join('\n')
}
