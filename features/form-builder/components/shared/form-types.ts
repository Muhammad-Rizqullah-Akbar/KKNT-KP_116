// components/form-builder/form-types.ts
// Domain: form-level structures (stages, validation, scoring config)

export interface FormStage {
  id: string
  name: string
  order: number
  questionIds: string[]
  includeInScoring: boolean
}

export interface FormValidation {
  mode: 'all_required' | 'all_required_except' | 'free'
  exceptions: string[]
  allowOverride: boolean
}

export interface ScoringOverride {
  points: number
  defaultPoints: number
  reason?: string
}

export interface FormScoring {
  totalPoints: number
  mode: 'auto' | 'hybrid' | 'manual'
  distribution: Record<string, number>
  overrides: Record<string, ScoringOverride>
  allowOverride: boolean
  autoBalance: boolean
  lastBalancedAt?: string
}

/**
 * Get default validation config
 */
export const getDefaultValidation = (): FormValidation => ({
  mode: 'all_required',
  exceptions: [],
  allowOverride: true,
})

/**
 * Get default scoring config
 */
export const getDefaultScoring = (): FormScoring => ({
  totalPoints: 100,
  mode: 'auto',
  distribution: {},
  overrides: {},
  allowOverride: true,
  autoBalance: true,
})

/**
 * Get default stage config
 */
export const getDefaultStage = (name: string = 'Tahap 1'): FormStage => ({
  id: `stage-${Date.now()}`,
  name,
  order: 0,
  questionIds: [],
  includeInScoring: true,
})
