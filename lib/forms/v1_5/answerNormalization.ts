/**
 * Answer Normalization Service
 * 
 * Purpose: Memastikan jawaban yang disimpan adalah LABEL READABLE,
 * bukan ID/index yang tidak informatif.
 * 
 * Contoh:
 * - Input: "1" → Output: "Sangat Baik"
 * - Input: ["0", "2"] → Output: ["Tidak", "Ya"]
 * - Input: { ind1: 4 } → Output: { "Kebersihan": 4, "label": "Baik" }
 */

import type { BuilderQuestion } from './builderState'

/**
 * Struktur opsi yang diharapkan
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
 * Konversi nilai jawaban dari ID/index ke LABEL READABLE
 */
export function normalizeAnswerValue(
  rawValue: any,
  question: BuilderQuestion
): { normalized: any; originalId?: any } {
  const type = question.answerType || (question as any).type
  
  // Get options dari berbagai kemungkinan lokasi
  const rawOptions = question.options || 
                     (question as any).presentation?.options || 
                     (question as any).config?.options || 
                     []
  
  // Parse options into standardized format
  const options: FormOption[] = rawOptions.map((o: any, idx: number) => {
    if (typeof o === 'string') {
      return { label: o, optionId: `opt_${question.questionId}_${idx}` }
    }
    return {
      optionId: o.optionId || o.id,
      label: o.label || o.text || o.title,
      value: o.value ?? o.val,
      score: o.score,
    }
  })

  // Single Choice / Binary / Dropdown
  if (type === 'single-choice' || type === 'binary' || type === 'dropdown') {
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return { normalized: '' }
    }

    const strVal = String(rawValue).trim()
    const cleanVal = strVal.toLowerCase().replace(/[^a-z0-9]/g, '')

    // Find matching option
    let matchedOption = options.find(o => {
      const oId = String(o.optionId || '').trim()
      const oLabel = String(o.label || '').trim()
      const oValue = String(o.value ?? o.val ?? '').trim()
      
      return oId === strVal || 
             oLabel === strVal ||
             oValue === strVal ||
             (cleanVal && oId.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanVal) ||
             (cleanVal && oLabel.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanVal)
    })

    // Try index-based lookup if no match
    if (!matchedOption) {
      const numIdx = Number(rawValue)
      if (!isNaN(numIdx) && numIdx >= 0 && numIdx < options.length) {
        matchedOption = options[numIdx]
      } else if (!isNaN(numIdx) && numIdx >= 1 && numIdx <= options.length) {
        matchedOption = options[numIdx - 1]
      }
    }

    if (matchedOption) {
      return {
        normalized: matchedOption.label || strVal,
        originalId: strVal,
      }
    }

    // If no option found, return as-is (might be text input)
    return { normalized: strVal }
  }

  // Multiple Choice
  if (type === 'multiple-choice') {
    if (!Array.isArray(rawValue) || rawValue.length === 0) {
      return { normalized: rawValue || [] }
    }

    const normalizedLabels: string[] = []
    const originalIds: string[] = []

    for (const item of rawValue) {
      const strItem = String(item).trim()
      const cleanItem = strItem.toLowerCase().replace(/[^a-z0-9]/g, '')

      let matchedOption = options.find(o => {
        const oId = String(o.optionId || o.id || '').trim()
        const oLabel = String(o.label || o.text || o.title || '').trim()
        return oId === strItem || oLabel === strItem ||
               (cleanItem && oId.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanItem)
      })

      if (!matchedOption) {
        const numIdx = Number(item)
        if (!isNaN(numIdx) && numIdx >= 0 && numIdx < options.length) {
          matchedOption = options[numIdx]
        }
      }

      if (matchedOption) {
        normalizedLabels.push(matchedOption.label || strItem)
        originalIds.push(strItem)
      } else {
        normalizedLabels.push(strItem)
      }
    }

    return {
      normalized: normalizedLabels,
      originalId: originalIds,
    }
  }

  // Indicator Table / Likert Scale
  if (type === 'indicator-table' || type === 'likert') {
    if (typeof rawValue !== 'object' || rawValue === null) {
      return { normalized: rawValue }
    }

    const indicators = (question as any).config?.indicators || 
                       (question as any).indicators || 
                       []
    const scales = (question as any).config?.indicatorScales || 
                   [
                     { value: 1, label: 'Sangat Buruk' },
                     { value: 2, label: 'Buruk' },
                     { value: 3, label: 'Netral' },
                     { value: 4, label: 'Baik' },
                     { value: 5, label: 'Sangat Baik' },
                   ]

    const normalizedObj: Record<string, any> = {}

    for (const [key, val] of Object.entries(rawValue)) {
      // Find indicator info
      const indicatorInfo = indicators.find((ind: any) => {
        const indId = ind.indicatorId || ind.id || ind
        const indLabel = ind.label || ind.title || ind.name || ''
        return indId === key || indLabel === key
      })

      // Find scale label
      const numVal = Number(val)
      const scaleInfo = scales.find((s: any) => Number(s.value) === numVal)
      const scaleLabel = scaleInfo?.label || scaleInfo?.text || String(val)

      normalizedObj[key] = {
        value: numVal,
        label: scaleLabel,
        indicatorLabel: indicatorInfo?.label || indicatorInfo?.title || key,
      }
    }

    return { normalized: normalizedObj }
  }

  // Rating
  if (type === 'rating') {
    const numVal = Number(rawValue)
    if (isNaN(numVal)) return { normalized: rawValue }
    
    const ratingLabels: Record<number, string> = {
      1: 'Sangat Buruk',
      2: 'Buruk',
      3: 'Netral',
      4: 'Baik',
      5: 'Sangat Baik',
    }
    
    return {
      normalized: ratingLabels[numVal] || `${numVal}/5`,
      originalId: numVal,
    }
  }

  // Text types - return as-is
  return { normalized: rawValue }
}

/**
 * Normalize semua jawaban dalam satu object
 */
export function normalizeAllAnswers(
  answers: Record<string, any>,
  questions: BuilderQuestion[]
): { normalizedAnswers: Record<string, any>; idMap: Record<string, any> } {
  const normalizedAnswers: Record<string, any> = {}
  const idMap: Record<string, any> = {}

  for (const question of questions) {
    const rawValue = answers[question.questionId]
    if (rawValue === undefined) continue

    const { normalized, originalId } = normalizeAnswerValue(rawValue, question)
    
    normalizedAnswers[question.questionId] = normalized
    
    if (originalId !== undefined) {
      idMap[`${question.questionId}_id`] = originalId
    }
  }

  // Also include non-question answers (biodata, etc.)
  for (const [key, value] of Object.entries(answers)) {
    if (!normalizedAnswers[key] && !idMap[key]) {
      normalizedAnswers[key] = value
    }
  }

  return { normalizedAnswers, idMap }
}

/**
 * Helper: Ambil label dari nilai jawaban
 * Untuk digunakan di scoring engine dan display
 */
export function getAnswerDisplayValue(
  rawValue: any,
  question: BuilderQuestion
): string {
  const { normalized } = normalizeAnswerValue(rawValue, question)
  
  if (Array.isArray(normalized)) {
    return normalized.join(', ')
  }
  
  if (typeof normalized === 'object' && normalized !== null) {
    // Untuk indicator table
    const labels = Object.values(normalized)
      .filter((v: any) => v && v.label)
      .map((v: any) => v.label)
    return labels.join(', ')
  }
  
  return String(normalized || '-')
}

/**
 * Helper: Get human-readable score description
 */
export function getScoreDescription(percentage: number): string {
  if (percentage >= 90) return 'Sangat Memuaskan'
  if (percentage >= 80) return 'Memenuhi Syarat'
  if (percentage >= 70) return 'Baik'
  if (percentage >= 60) return 'Binaan Lanjutan'
  if (percentage >= 50) return 'Perlu Perbaikan'
  return 'Belum Memenuhi Syarat'
}
