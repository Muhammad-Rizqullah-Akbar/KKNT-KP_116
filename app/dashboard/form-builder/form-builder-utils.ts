import {
  getScoredStages,
  getDefaultConfig,
  type FlexibleQuestion,
  type FormScoring,
  type FormStage,
  type FormValidation,
} from '@/features/form-builder/components/shared/ElementTypes'
import type { FormData } from '@/lib/repositories/forms.repo'

export const generateId = () => Math.random().toString(36).substring(2, 9)

export const generateFormCode = () => {
  const prefix = 'FRM'
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${random}`
}

// ============ DEFAULT CONFIGURATIONS ============
export const DEFAULT_VALIDATION: FormValidation = {
  mode: 'all_required',
  exceptions: [],
  allowOverride: true,
}

export const DEFAULT_SCORING: FormScoring = {
  totalPoints: 100,
  mode: 'auto',
  distribution: {},
  overrides: {},
  allowOverride: true,
  autoBalance: true,
}

export const colorOptions = [
  { id: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
  { id: 'violet', label: 'Violet', class: 'bg-violet-500' },
  { id: 'rose', label: 'Rose', class: 'bg-rose-500' },
  { id: 'emerald', label: 'Emerald', class: 'bg-emerald-500' },
  { id: 'amber', label: 'Amber', class: 'bg-amber-500' },
]

// ============ AUTO-BALANCE (pure) ============
// Distributes scoring.totalPoints across stages weighted by element weights,
// honoring includeInScoring. Returns the new distribution map.
export function computeAutoBalanceDistribution(
  stages: FormStage[],
  elements: FlexibleQuestion[],
  totalPoints: number
): Record<string, number> {
  const scoredStages = getScoredStages(stages)
  const distribution: Record<string, number> = {}

  if (scoredStages.length === 0) {
    // No scored stages, set all to 0
    stages.forEach(stage => {
      distribution[stage.id] = 0
    })
    return distribution
  }

  // Calculate weights per stage
  const stageWeights: Record<string, number> = {}
  let totalWeight = 0

  scoredStages.forEach(stage => {
    stageWeights[stage.id] = 0
  })

  elements.forEach(el => {
    const stageId = el.stageId || stages[0]?.id
    if (stageId && stageWeights[stageId] !== undefined) {
      let weight = el.scoring?.weight || 1
      if (el.answerType === 'indicator-table' && el.config?.indicators) {
        weight = el.config.indicators.reduce((sum, ind) => sum + (ind.weight || 1), 0)
      }
      stageWeights[stageId] += weight
      totalWeight += weight
    }
  })

  if (totalWeight === 0) {
    // Equal distribution if no weight
    const perStage = totalPoints / scoredStages.length
    stages.forEach(stage => {
      distribution[stage.id] = 0
    })
    scoredStages.forEach(stage => {
      distribution[stage.id] = Math.round(perStage * 100) / 100
    })
    return distribution
  }

  // Distribute based on weight
  stages.forEach(stage => {
    distribution[stage.id] = 0
  })

  let distributedTotal = 0

  scoredStages.forEach(stage => {
    const weight = stageWeights[stage.id] || 0
    const points = Math.round((weight / totalWeight) * totalPoints)
    distribution[stage.id] = points
    distributedTotal += points
  })

  // Fix rounding issues
  if (distributedTotal !== totalPoints) {
    const diff = totalPoints - distributedTotal
    const maxStage = Object.keys(distribution).reduce((a, b) =>
      (distribution[a] || 0) > (distribution[b] || 0) ? a : b
    )
    if (maxStage) {
      distribution[maxStage] = (distribution[maxStage] || 0) + diff
    }
  }

  return distribution
}

// Konversi questions (FormData) ke FlexibleQuestion[]
export function convertQuestionsToElements(form: FormData): FlexibleQuestion[] {
  return (form.questions || []).map((question: any, index: number) => {
    const answerType = question.answerType || question.type || 'short-text'
    const config = question.config || {}

    const fullConfig = {
      ...getDefaultConfig(answerType),
      ...config,
    }

    return {
      id: question.id || generateId(),
      question: question.question || question.label || '',
      description: question.description || '',
      required: question.required || false,
      order: question.order || index,
      media: question.media || { type: 'none' as const },
      answerType: answerType,
      config: fullConfig,
      isIdentifier: question.isIdentifier || false,
      identifierType: question.identifierType || 'none',
      scoring: question.scoring || { scheme: 'none' as const, weight: 1 },
      stageId: question.stageId || null,
      overridePoints: question.overridePoints || null,
    } as FlexibleQuestion
  })
}

// Pastikan semua stage punya includeInScoring
export function ensureStageScoring(stages: { id: string; name: string; order: number; questionIds: string[]; includeInScoring?: boolean }[]): FormStage[] {
  return stages.map((stage) => ({
    ...stage,
    includeInScoring: stage.includeInScoring !== false,
  }))
}
