// components/form-builder/scoring-types.ts
// Domain: scoring calculation, distribution, and scoring info helpers

import type { FlexibleQuestion } from './element-types'
import type { FormStage } from './form-types'

/**
 * Menghitung total bobot dari semua pertanyaan
 */
export const calculateTotalWeight = (questions: FlexibleQuestion[]): number => {
  let total = 0
  questions.forEach(q => {
    if (q.answerType === 'indicator-table' && q.config?.indicators) {
      q.config.indicators.forEach(ind => {
        total += ind.weight || 1
      })
    } else {
      total += q.scoring?.weight || 1
    }
  })
  return total
}

/**
 * Menghitung bobot per stage
 */
export const calculateStageWeights = (
  questions: FlexibleQuestion[],
  stages: FormStage[]
): Record<string, number> => {
  const weights: Record<string, number> = {}

  stages.forEach(stage => {
    weights[stage.id] = 0
  })

  questions.forEach(q => {
    const stageId = q.stageId || stages[0]?.id
    if (stageId && weights[stageId] !== undefined) {
      let weight = q.scoring?.weight || 1
      if (q.answerType === 'indicator-table' && q.config?.indicators) {
        weight = q.config.indicators.reduce((sum, ind) => sum + (ind.weight || 1), 0)
      }
      weights[stageId] += weight
    }
  })

  return weights
}

/**
 * Mendapatkan daftar stage yang dinilai
 */
export const getScoredStages = (stages: FormStage[]): FormStage[] => {
  return stages.filter(s => s.includeInScoring !== false)
}

/**
 * Mendapatkan daftar stage yang TIDAK dinilai
 */
export const getUnscoredStages = (stages: FormStage[]): FormStage[] => {
  return stages.filter(s => s.includeInScoring === false)
}

/**
 * Mendapatkan daftar pertanyaan untuk stage tertentu
 */
export const getQuestionsByStage = (
  questions: FlexibleQuestion[],
  stageId: string
): FlexibleQuestion[] => {
  return questions.filter(q => q.stageId === stageId)
}

/**
 * Mendapatkan daftar pertanyaan yang dinilai (hanya dari scored stages)
 */
export const getScoredQuestions = (
  questions: FlexibleQuestion[],
  stages: FormStage[]
): FlexibleQuestion[] => {
  const scoredStageIds = getScoredStages(stages).map(s => s.id)
  return questions.filter(q =>
    q.stageId && scoredStageIds.includes(q.stageId) &&
    (q.answerType as string) !== 'image' &&
    q.answerType !== 'file-upload' &&
    q.answerType !== 'signature'
  )
}

/**
 * Menghitung skor maksimal per pertanyaan
 */
export const calculateQuestionMaxScore = (question: FlexibleQuestion): number => {
  const weight = question.scoring?.weight || 1

  switch (question.answerType) {
    case 'single-choice':
    case 'dropdown':
    case 'rating':
    case 'number':
      return weight

    case 'multiple-choice': {
      const correctAnswers = question.config?.correctAnswer
      if (Array.isArray(correctAnswers)) {
        return weight
      }
      return weight
    }

    case 'indicator-table': {
      const indicators = question.config?.indicators || []
      let max = 0
      indicators.forEach(ind => {
        const w = ind.weight || 1
        max += 5 * w
      })
      return max || 1
    }

    default:
      return 0
  }
}

/**
 * Validasi apakah total distribusi sesuai dengan total points
 */
export const validateDistribution = (
  distribution: Record<string, number>,
  totalPoints: number
): { valid: boolean; total: number; diff: number } => {
  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0)
  return {
    valid: Math.abs(total - totalPoints) < 0.01,
    total,
    diff: totalPoints - total,
  }
}

/**
 * Generate scoring distribution untuk manual mode
 */
export const generateManualDistribution = (
  questions: FlexibleQuestion[],
  totalPoints: number
): Record<string, number> => {
  const distribution: Record<string, number> = {}
  const count = questions.length || 1
  const perQuestion = Math.floor(totalPoints / count)
  let remainder = totalPoints - (perQuestion * count)

  questions.forEach((q, index) => {
    let points = perQuestion
    if (remainder > 0) {
      points += 1
      remainder -= 1
    }
    distribution[q.id] = points
  })

  return distribution
}

/**
 * Generate scoring distribution berdasarkan bobot per stage (Auto-Balance)
 */
export const generateAutoDistribution = (
  questions: FlexibleQuestion[],
  stages: FormStage[],
  totalPoints: number
): Record<string, number> => {
  const distribution: Record<string, number> = {}
  const scoredStages = getScoredStages(stages)
  const stageWeights = calculateStageWeights(questions, scoredStages)
  const totalWeight = Object.values(stageWeights).reduce((sum, w) => sum + w, 0)

  if (totalWeight === 0) {
    const perStage = totalPoints / scoredStages.length
    scoredStages.forEach(stage => {
      distribution[stage.id] = Math.round(perStage * 100) / 100
    })
    return distribution
  }

  scoredStages.forEach(stage => {
    const weight = stageWeights[stage.id] || 0
    const points = (weight / totalWeight) * totalPoints
    distribution[stage.id] = Math.round(points * 100) / 100
  })

  return distribution
}

/**
 * Helper: Reset scoring distribution
 */
export const resetScoringDistribution = (
  questions: FlexibleQuestion[],
  stages: FormStage[],
  totalPoints: number,
  mode: 'auto' | 'manual'
): Record<string, number> => {
  if (mode === 'auto') {
    return generateAutoDistribution(questions, stages, totalPoints)
  } else {
    return generateManualDistribution(questions, totalPoints)
  }
}

// ============================================================
// SCORING INFO HELPERS (Untuk Display di Card)
// ============================================================

/**
 * Mendapatkan informasi scoring untuk single choice
 */
export const getSingleChoiceScoringInfo = (question: FlexibleQuestion) => {
  const config = question.config
  const correctAnswer = config?.correctAnswer as string | undefined
  const scoreCorrect = config?.scoreCorrect ?? 1
  const scoreIncorrect = config?.scoreIncorrect ?? 0

  return {
    correctAnswer,
    scoreCorrect,
    scoreIncorrect,
    isCorrect: (option: string) => option === correctAnswer,
    getScore: (option: string) => option === correctAnswer ? scoreCorrect : scoreIncorrect,
  }
}

/**
 * Mendapatkan informasi scoring untuk multiple choice
 */
export const getMultipleChoiceScoringInfo = (question: FlexibleQuestion) => {
  const config = question.config
  const correctAnswers = Array.isArray(config?.correctAnswer)
    ? config.correctAnswer
    : []
  const scoreCorrect = config?.scoreCorrect ?? 1

  return {
    correctAnswers,
    scoreCorrect,
    totalCorrect: correctAnswers.length,
    isCorrect: (option: string) => correctAnswers.includes(option),
    getScore: (option: string) => correctAnswers.includes(option) ? scoreCorrect : 0,
  }
}

/**
 * Mendapatkan informasi scoring untuk indicator table
 */
export const getIndicatorScoringInfo = (question: FlexibleQuestion) => {
  const config = question.config
  const indicators = config?.indicators || []
  const scales = config?.indicatorScales || []
  const showWeighted = config?.showWeightedScore || false

  return {
    indicators,
    scales,
    showWeighted,
    getScaleValue: (label: string) => {
      const scale = scales.find(s => s.label === label)
      return scale?.value || 0
    },
    getMaxScore: () => {
      let max = 0
      indicators.forEach(ind => {
        const w = ind.weight || 1
        max += showWeighted ? 5 * w : 5
      })
      return max
    },
  }
}

/**
 * Mendapatkan informasi scoring untuk rating
 */
export const getRatingScoringInfo = (question: FlexibleQuestion) => {
  const config = question.config
  const maxRating = config?.ratingMax || 5
  const weight = question.scoring?.weight || 1

  return {
    maxRating,
    weight,
    getScore: (rating: number) => (rating / maxRating) * weight,
  }
}
