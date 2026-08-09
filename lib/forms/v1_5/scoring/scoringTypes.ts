export interface IndicatorScoreItem {
  indicatorId: string
  label: string
  selectedValue?: number
  selectedLabel?: string
  score: number
  maximumScore: number
}

export interface QuestionScoreResult {
  questionId: string
  aspectId: string
  questionType: string
  prompt: string
  rawScore: number
  maximumScore: number
  percentage: number
  includedInTotal: boolean
  details?: {
    selectedOptionIds?: string[]
    correctOptionIds?: string[]
    indicators?: IndicatorScoreItem[]
    ratingValue?: number
    [key: string]: any
  }
}

export interface AspectScoreResult {
  aspectId: string
  title: string
  rawScore: number
  maximumScore: number
  percentage: number
  weightPercentage: number
  weightedContribution: number
  questions: QuestionScoreResult[]
}

export interface GradeResult {
  thresholdId: string
  grade: string
  title: string
  description?: string
  min: number
  max: number
}

export interface RecommendationItem {
  articleId: string
  title: string
  slug?: string
  category?: string
}

export interface ResponseResultDoc {
  scoringEngineVersion: string
  calculatedAt: string
  rawScore: number
  maximumScore: number
  percentage: number
  grade: string
  thresholdId: string
  thresholdTitle: string
  thresholdDescription?: string
  aspects: AspectScoreResult[]
  questions: QuestionScoreResult[]
  recommendations: RecommendationItem[]
}
