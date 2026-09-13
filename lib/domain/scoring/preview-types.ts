export interface ScoringResult {
  totalScore: number
  maxScore: number
  percentage: number
  grade: string
  perQuestion: Record<string, {
    earned: number
    possible: number
    percentage: number
    label: string
  }>
  perStage: Record<string, {
    earned: number
    possible: number
    percentage: number
    name: string
    rawEarned?: number
    rawPossible?: number
  }>
  details: {
    correctCount: number
    wrongCount: number
    skippedCount: number
    totalQuestions: number
    scoredQuestions?: number
    unscoredQuestions?: number
  }
  recommendations: string[]
}

export interface AnswerMap {
  [questionId: string]: any
}
