/** Canonical, persistence-agnostic V1.5 form domain model. */
export const FORM_STATUSES = ['draft', 'published', 'archived'] as const
export type FormStatus = (typeof FORM_STATUSES)[number]
export const FORM_KINDS = ['official', 'user-created'] as const
export type FormKind = (typeof FORM_KINDS)[number]
export const QUESTION_TYPES = ['single-choice', 'multiple-choice', 'binary', 'dropdown', 'rating', 'indicator-table', 'likert', 'image', 'file-upload', 'signature', 'short-text', 'long-text', 'text', 'textarea', 'date', 'number'] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

export type QuestionOption = { optionId: string; label: string }
export type Indicator = { indicatorId: string; label: string; weight?: number; reverse?: boolean }
export type IndicatorScale = { value: number; label: string }
export type QuestionPresentation = {
  description?: string; media?: { type: 'none' | 'image'; url?: string; caption?: string }; placeholder?: string
  min?: number; max?: number; step?: number; fileTypes?: string[]; maxFileSizeMb?: number
  ratingMin?: number; ratingMax?: number; indicators?: Indicator[]; indicatorScales?: IndicatorScale[]; showWeightedScore?: boolean
}
/** Private-only assessment information. Never include this in public DTOs. */
export type AnswerKey = { kind: 'none' } | { kind: 'option'; correctOptionIds: string[] } | { kind: 'indicator'; reverseIndicatorIds: string[] }
export type QuestionScoring = { scheme: 'none' | 'binary' | 'likert' | 'indicator' | 'rating'; weight: number }
export type Question = { questionId: string; aspectId?: string; type: QuestionType; prompt: string; required: boolean; options: QuestionOption[]; presentation: QuestionPresentation; scoring: QuestionScoring; answerKey: AnswerKey }
export type ScoringConfig = { totalPoints: number; mode: 'auto' | 'hybrid' | 'manual'; stagePointDistribution: Record<string, number>; allowOverride: boolean; autoBalance: boolean }
export type ValidationConfig = { mode: 'all_required' | 'all_required_except' | 'free'; exceptionQuestionIds: string[]; allowOverride: boolean }
export type FormMetadata = { title: string; description?: string; target?: string; category?: string; kind: FormKind; status: FormStatus; allowCadreDistribution?: boolean }
export type Form = { formId: string; metadata: FormMetadata; activeVersionId?: string; createdBy?: string; createdAt?: string; updatedAt?: string }
export type FormVersion = { versionId: string; formId: string; versionNumber: number; status: FormStatus; questions: Question[]; scoring: ScoringConfig; validation: ValidationConfig; createdAt?: string; createdBy?: string }
export type CanonicalForm = { form: Form; version: FormVersion }
export type PublicQuestion = Omit<Question, 'answerKey' | 'scoring'> & { aspectId?: string; answerType?: string; config?: any; answerKey?: any }
export type PublicFormVersion = Omit<FormVersion, 'questions' | 'scoring' | 'validation'> & { questions: PublicQuestion[] }
export type PublicCanonicalForm = Omit<CanonicalForm, 'version'> & { version: PublicFormVersion }
export type PublicFormProjection = PublicCanonicalForm
export type PublicAspect = { aspectId: string; title: string; description?: string; questions?: PublicQuestion[] }
/** Input contract for a future adapter around the protected legacy engine. */
export type LegacyScoringAdapterInput = { questions: Question[]; scoring: ScoringConfig; validation: ValidationConfig }
