import type { AnswerMap } from './preview-types'

/**
 * Cek apakah jawaban kosong
 */
export function isAnswerEmpty(answer: any, type: string): boolean {
  if (answer === undefined || answer === null) return true

  if (type === 'indicator-table' || type === 'likert') {
    if (typeof answer === 'object') {
      return Object.values(answer).every(v => !v || v === '')
    }
    return true
  }

  if (type === 'multiple-choice') {
    return !Array.isArray(answer) || answer.length === 0
  }

  if (type === 'signature') {
    return !answer || answer === ''
  }

  return answer === ''
}

/**
 * Hitung skor untuk single choice
 */
export function calculateSingleChoice(
  question: any,
  userAnswer: string,
  weight: number
): number {
  const config = question.config || {}
  const correctAnswer = config.correctAnswer

  if (!correctAnswer) return 0

  if (userAnswer === correctAnswer) {
    return weight
  }

  return 0
}

/**
 * Hitung skor untuk multiple choice (Partial Scoring - TANPA PENALTI)
 */
export function calculateMultipleChoice(
  question: any,
  userAnswers: string[],
  weight: number
): number {
  const config = question.config || {}
  const correctAnswers = config.correctAnswer
    ? (Array.isArray(config.correctAnswer)
        ? config.correctAnswer
        : [config.correctAnswer])
    : []

  if (correctAnswers.length === 0) return 0
  if (!Array.isArray(userAnswers) || userAnswers.length === 0) return 0

  // Hitung jawaban benar yang dipilih (TANPA PENALTI)
  let correctSelected = 0
  userAnswers.forEach(ans => {
    if (correctAnswers.includes(ans)) {
      correctSelected++
    }
  })

  // Partial scoring: (correct_selected / total_correct) * weight
  const maxScore = correctAnswers.length
  const score = Math.min(correctSelected, maxScore)

  return (score / maxScore) * weight
}

/**
 * Hitung skor untuk indicator table - DENGAN REVERSE SCORING
 */
export function calculateIndicatorTable(
  question: any,
  userAnswers: Record<string, string>
): number {
  const config = question.config || {}
  const indicators = config.indicators || []
  const scales = config.indicatorScales || [
    { value: 1, label: 'STS' },
    { value: 2, label: 'TS' },
    { value: 3, label: 'N' },
    { value: 4, label: 'S' },
    { value: 5, label: 'SS' },
  ]
  const showWeighted = config.showWeightedScore || false

  if (indicators.length === 0) return 0

  // Ambil min dan max dari skala yang SEBENARNYA
  const maxVal = scales.length > 0 ? Math.max(...scales.map((s: any) => s.value)) : 5
  const minVal = scales.length > 0 ? Math.min(...scales.map((s: any) => s.value)) : 1

  let totalEarned = 0

  indicators.forEach((indicator: any, index: number) => {
    const key = `${question.id}-${index}`
    const selectedLabel = userAnswers[key] || ''
    const selectedScale = scales.find((s: any) => s.label === selectedLabel)
    let value = selectedScale?.value || 0
    const weight = indicator.weight || 1

    // 🔥 REVERSE SCORING: balik nilainya jika reverse === true
    // Contoh: STS(1) → SS(5), TS(2) → S(4), dst.
    if (indicator.reverse === true && value > 0) {
      value = maxVal - value + minVal
    }

    totalEarned += showWeighted ? value * weight : value
  })

  return totalEarned
}

/**
 * Hitung skor untuk rating
 */
export function calculateRating(
  question: any,
  userAnswer: number,
  weight: number
): number {
  const config = question.config || {}
  const maxRating = config.ratingMax || 5

  const rating = Number(userAnswer) || 0
  return (rating / maxRating) * weight
}

/**
 * Dapatkan skor maksimal per pertanyaan
 */
export function getMaxScore(question: any): number {
  const type = question.answerType || question.type || 'short-text'
  const scoring = question.scoring || { scheme: 'none', weight: 1 }
  const weight = scoring.weight || 1

  switch (type) {
    case 'single-choice':
    case 'binary':
    case 'dropdown':
      return weight

    case 'multiple-choice': {
      return weight
    }

    case 'indicator-table':
    case 'likert': {
      const config = question.config || {}
      const indicators = config.indicators || []
      const scales = config.indicatorScales || [
        { value: 1, label: 'STS' },
        { value: 2, label: 'TS' },
        { value: 3, label: 'N' },
        { value: 4, label: 'S' },
        { value: 5, label: 'SS' },
      ]
      const showWeighted = config.showWeightedScore || false

      // 🔥 Cari nilai maksimal dari skala yang SEBENARNYA
      const maxScaleValue = scales.length > 0
        ? Math.max(...scales.map((s: any) => s.value))
        : 5

      let max = 0
      indicators.forEach((ind: any) => {
        const w = ind.weight || 1
        max += showWeighted ? maxScaleValue * w : maxScaleValue
      })
      return max || 1
    }

    case 'rating':
      return weight

    default:
      return weight
  }
}

/**
 * Hitung skor per pertanyaan
 */
export function calculateQuestionScore(
  question: any,
  answers: AnswerMap
): { earned: number; possible: number; percentage: number } {
  const type = question.answerType || question.type || 'short-text'
  const scoring = question.scoring || { scheme: 'none', weight: 1 }
  const weight = scoring.weight || 1

  // Jika tidak ada skema penilaian
  if (scoring.scheme === 'none') {
    return { earned: 0, possible: 0, percentage: 0 }
  }

  // Dapatkan jawaban user
  let userAnswer = answers[question.id]

  // Untuk indicator table, ambil semua jawaban per row
  if (type === 'indicator-table' || type === 'likert') {
    const indicators = question.config?.indicators || []
    const statements = question.config?.statements || question.options || []
    const rows = indicators.length > 0 ? indicators : statements
    const rowAnswers: Record<string, string> = {}
    rows.forEach((_: any, i: number) => {
      const key = `${question.id}-${i}`
      if (answers[key]) {
        rowAnswers[key] = answers[key]
      }
    })
    userAnswer = rowAnswers
  }

  // Jika pertanyaan tidak dijawab
  if (isAnswerEmpty(userAnswer, type)) {
    const possible = getMaxScore(question)
    return { earned: 0, possible, percentage: 0 }
  }

  let earned = 0
  const possible = getMaxScore(question)

  switch (type) {
    case 'single-choice':
    case 'binary':
      earned = calculateSingleChoice(question, userAnswer, weight)
      break

    case 'multiple-choice':
      earned = calculateMultipleChoice(question, userAnswer, weight)
      break

    case 'indicator-table':
    case 'likert':
      earned = calculateIndicatorTable(question, userAnswer)
      break

    case 'rating':
      earned = calculateRating(question, userAnswer, weight)
      break

    case 'dropdown':
      earned = calculateSingleChoice(question, userAnswer, weight)
      break

    default:
      earned = userAnswer ? possible : 0
  }

  const percentage = possible > 0 ? Math.round((earned / possible) * 100) : 0

  return { earned, possible, percentage }
}
