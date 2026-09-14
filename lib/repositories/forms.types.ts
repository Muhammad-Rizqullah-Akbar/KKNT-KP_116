// lib/repositories/forms.types.ts

export interface FormValidation {
  mode: 'all_required' | 'all_required_except' | 'free'
  exceptions: string[]
  allowOverride: boolean
}

export interface FormStage {
  id: string
  name: string
  order: number
  questionIds: string[]
  includeInScoring?: boolean // <-- tambahan
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

export interface FormQuestion {
  id: string
  type: 'binary' | 'single-choice' | 'multiple-choice' | 'image' | 'likert' | 'text' | 'textarea' | 'indicator-table' | 'signature' | 'rating' | 'date' | 'number' | 'file-upload' | 'short-text' | 'long-text' | 'dropdown'
  label?: string
  question: string
  description?: string
  options?: string[]
  required?: boolean
  imageUrl?: string
  rowIndex?: number
  order?: number
  answerType?: string
  media?: {
    type: string
    url?: string
    caption?: string
  }
  config?: Record<string, any>
  isIdentifier?: boolean
  identifierType?: string
  scoring?: {
    scheme: string
    weight: number
  }
  statements?: string[]
  scale?: number
  indicators?: { id: string; label: string; weight?: number }[]
  indicatorScales?: { value: number; label: string }[]
  indicatorTitle?: string
  showTotalScore?: boolean
  showWeightedScore?: boolean
  ratingMax?: number
  signatureWidth?: number
  signatureHeight?: number
  signaturePenColor?: string
  signatureBgColor?: string
  signatureLabel?: string
  placeholder?: string
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  step?: number
  fileTypes?: string[]
  maxFileSize?: number
  dateFormat?: string
  stageId?: string | null
  overridePoints?: number | null
}

export interface FormData {
  id?: string
  title: string
  code: string
  description?: string
  target?: string
  category?: string
  status: 'draft' | 'published' | 'archived'
  groupId?: string | null
  groupCode?: string | null
  questions: FormQuestion[]
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  filledCount?: number
  validation?: FormValidation
  stages?: FormStage[]
  scoring?: FormScoring
}

export interface FormResponse {
  id?: string
  formId: string
  formCode: string
  formTitle: string
  distributionCode?: string
  distributionId?: string
  respondent?: any
  answers: Record<string, any>
  respondentName?: string
  respondentEmail?: string
  submittedAt?: string
  createdAt?: any
  userAgent?: string
  ipAddress?: string
}

export interface DashboardStats {
  totalForms: number
  activeForms: number
  totalResponses: number
  averageScore: number
  totalGroups: number
}
