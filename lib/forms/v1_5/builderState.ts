import type { FormMetadata, Question, ScoringConfig, ValidationConfig } from './types'
export type { ScoringConfig, ValidationConfig }

export type FormAspect = {
  aspectId: string
  title: string
  description?: string
  isScored?: boolean // default true. If false, aspect is non-scored / biodata / survey only
}

export type GradeThreshold = {
  id: string
  min: number
  max: number
  grade: string
  title: string
  description?: string
}

export type RecommendationConfig = {
  mode: 'disabled' | 'manual' | 'automatic' | 'hybrid'
  manualArticleIds?: string[]
  gradeArticleMap?: Record<string, string[]>
}

export type FormDistributionConfig = {
  allowCadreDistribution: boolean
  distributionCodePrefix?: string
}

export type BuilderQuestion = Question & { aspectId?: string; answerType?: string; config?: any }

export type BuilderState = {
  metadata: FormMetadata
  aspects: FormAspect[]
  questions: BuilderQuestion[]
  scoring: ScoringConfig
  validation: ValidationConfig
  thresholds: GradeThreshold[]
  recommendations: RecommendationConfig
  distribution: FormDistributionConfig
}

export type QuestionIdFactory = () => string

export const DEFAULT_ASPECTS: FormAspect[] = [
  { aspectId: 'aspect_hygiene', title: 'Aspek 1 — Higiene & Sanitasi', description: 'Evaluasi standar kebersihan diri dan sarana' },
  { aspectId: 'aspect_storage', title: 'Aspek 2 — Penyimpanan Pangan', description: 'Evaluasi tata cara penyimpanan bahan dan produk pangan' },
]

export const DEFAULT_THRESHOLDS: GradeThreshold[] = [
  { id: 't_a', min: 90, max: 100, grade: 'A', title: 'Sangat Baik', description: 'Pemahaman dan penerapan materi sangat unggul' },
  { id: 't_b', min: 80, max: 89, grade: 'B', title: 'Baik', description: 'Pemahaman materi baik dan memenuhi standar' },
  { id: 't_c', min: 70, max: 79, grade: 'C', title: 'Cukup', description: 'Pemahaman memenuhi batas minimal' },
  { id: 't_d', min: 60, max: 69, grade: 'D', title: 'Perlu Perbaikan', description: 'Memerlukan evaluasi ulang beberapa materi' },
  { id: 't_e', min: 0, max: 59, grade: 'E', title: 'Perlu Pembinaan', description: 'Memerlukan pembinaan intensif' },
]

export const DEFAULT_RECOMMENDATIONS: RecommendationConfig = {
  mode: 'manual',
  manualArticleIds: [],
}

export const DEFAULT_DISTRIBUTION: FormDistributionConfig = {
  allowCadreDistribution: true,
  distributionCodePrefix: 'KDR-BPOM',
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  totalPoints: 100,
  mode: 'auto',
  stagePointDistribution: { aspect_hygiene: 50, aspect_storage: 50 },
  allowOverride: true,
  autoBalance: true,
}

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  mode: 'all_required',
  exceptionQuestionIds: [],
  allowOverride: true,
}

const defaultQuestionIdFactory: QuestionIdFactory = () => `q_${crypto.randomUUID()}`
const cloneQuestion = (question: BuilderQuestion): BuilderQuestion => structuredClone(question)

function cloneWithFreshIds(question: BuilderQuestion, questionIdFactory: QuestionIdFactory): BuilderQuestion {
  const copy = cloneQuestion(question)
  const optionIdMap = new Map<string, string>()
  copy.questionId = questionIdFactory()
  copy.options = copy.options.map((option) => {
    const optionId = `${copy.questionId}-option-${crypto.randomUUID()}`
    optionIdMap.set(option.optionId, optionId)
    return { ...option, optionId }
  })
  if (copy.answerKey.kind === 'option') {
    copy.answerKey = { kind: 'option', correctOptionIds: copy.answerKey.correctOptionIds.map((id) => optionIdMap.get(id)).filter((id): id is string => Boolean(id)) }
  }
  return copy
}

export function addQuestion(state: BuilderState, question: BuilderQuestion): BuilderState {
  if (state.questions.some((current) => current.questionId === question.questionId)) throw new Error('questionId must be unique.')
  const defaultAspectId = state.aspects[0]?.aspectId || 'aspect_hygiene'
  const newQ = cloneQuestion({ ...question, aspectId: question.aspectId || defaultAspectId })
  return { ...state, questions: [...state.questions, newQ] }
}

export function updateQuestion(state: BuilderState, questionId: string, update: Omit<Partial<BuilderQuestion>, 'questionId'>): BuilderState {
  return { ...state, questions: state.questions.map((question) => question.questionId === questionId ? { ...question, ...structuredClone(update), questionId } : question) }
}

export function deleteQuestion(state: BuilderState, questionId: string): BuilderState {
  return { ...state, questions: state.questions.filter((question) => question.questionId !== questionId) }
}

export function reorderQuestion(state: BuilderState, questionId: string, destinationIndex: number): BuilderState {
  const sourceIndex = state.questions.findIndex((question) => question.questionId === questionId)
  if (sourceIndex < 0) return state
  const questions = [...state.questions]
  const [question] = questions.splice(sourceIndex, 1)
  questions.splice(Math.max(0, Math.min(destinationIndex, questions.length)), 0, question)
  return { ...state, questions }
}

export function duplicateQuestion(state: BuilderState, questionId: string, questionIdFactory = defaultQuestionIdFactory): BuilderState {
  const sourceIndex = state.questions.findIndex((question) => question.questionId === questionId)
  if (sourceIndex < 0) throw new Error('Question not found.')
  const questions = [...state.questions]
  questions.splice(sourceIndex + 1, 0, cloneWithFreshIds(state.questions[sourceIndex], questionIdFactory))
  return { ...state, questions }
}

export function moveQuestionToAspect(state: BuilderState, questionId: string, targetAspectId: string): BuilderState {
  return {
    ...state,
    questions: state.questions.map((q) => (q.questionId === questionId ? { ...q, aspectId: targetAspectId } : q)),
  }
}

export function addAspect(state: BuilderState, aspect: FormAspect): BuilderState {
  if (state.aspects.some((a) => a.aspectId === aspect.aspectId)) throw new Error('aspectId must be unique.')
  const updatedAspects = [...state.aspects, structuredClone(aspect)]
  const autoPoints = Math.floor(100 / updatedAspects.length)
  const stageDist: Record<string, number> = {}
  updatedAspects.forEach((a, idx) => {
    stageDist[a.aspectId] = idx === updatedAspects.length - 1 ? 100 - autoPoints * (updatedAspects.length - 1) : autoPoints
  })

  return {
    ...state,
    aspects: updatedAspects,
    scoring: { ...state.scoring, stagePointDistribution: stageDist },
  }
}

export function updateAspect(state: BuilderState, aspectId: string, update: Partial<FormAspect>): BuilderState {
  const updatedAspects = state.aspects.map((a) => (a.aspectId === aspectId ? { ...a, ...structuredClone(update), aspectId } : a))
  const stageDist = { ...(state.scoring?.stagePointDistribution || {}) }

  if (update.isScored === false) {
    delete stageDist[aspectId]
  }

  return {
    ...state,
    aspects: updatedAspects,
    scoring: { ...state.scoring, stagePointDistribution: stageDist },
  }
}

export function deleteAspect(state: BuilderState, aspectId: string): BuilderState {
  if (state.aspects.length <= 1) throw new Error('Formulir harus memiliki minimal 1 Aspek.')
  const updatedAspects = state.aspects.filter((a) => a.aspectId !== aspectId)
  const fallbackAspectId = updatedAspects[0].aspectId
  const updatedQuestions = state.questions.map((q) => (q.aspectId === aspectId ? { ...q, aspectId: fallbackAspectId } : q))
  const stageDist = { ...state.scoring.stagePointDistribution }
  delete stageDist[aspectId]
  return {
    ...state,
    aspects: updatedAspects,
    questions: updatedQuestions,
    scoring: { ...state.scoring, stagePointDistribution: stageDist },
  }
}

export function reorderAspect(state: BuilderState, aspectId: string, destinationIndex: number): BuilderState {
  const sourceIndex = state.aspects.findIndex((a) => a.aspectId === aspectId)
  if (sourceIndex < 0) return state
  const aspects = [...state.aspects]
  const [aspect] = aspects.splice(sourceIndex, 1)
  aspects.splice(Math.max(0, Math.min(destinationIndex, aspects.length)), 0, aspect)
  return { ...state, aspects }
}

export function updateMetadata(state: BuilderState, metadata: Partial<FormMetadata>): BuilderState {
  return { ...state, metadata: { ...state.metadata, ...structuredClone(metadata) } }
}

export function updateScoring(state: BuilderState, scoring: Partial<ScoringConfig>): BuilderState {
  return { ...state, scoring: { ...state.scoring, ...structuredClone(scoring) } }
}

export function updateValidation(state: BuilderState, validation: Partial<ValidationConfig>): BuilderState {
  return { ...state, validation: { ...state.validation, ...structuredClone(validation) } }
}

export function updateThresholds(state: BuilderState, thresholds: GradeThreshold[]): BuilderState {
  return { ...state, thresholds: structuredClone(thresholds) }
}

export function updateRecommendations(state: BuilderState, recommendations: Partial<RecommendationConfig>): BuilderState {
  return { ...state, recommendations: { ...state.recommendations, ...structuredClone(recommendations) } }
}

export function updateDistribution(state: BuilderState, distribution: Partial<FormDistributionConfig>): BuilderState {
  return { ...state, distribution: { ...state.distribution, ...structuredClone(distribution) } }
}
