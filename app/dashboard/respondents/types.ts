// ---------- TYPES ----------
export type Respondent = {
  id: string
  name: string
  formId: string
  formCode: string
  formTitle: string
  groupId?: string | null
  groupName?: string | null
  submittedAt: string
  date: string
  answers: Record<string, any>
  respondentName?: string
  respondentEmail?: string
  score: number
  metric: string
  status: string
  scoringDetails?: {
    correctCount: number
    wrongCount: number
    skippedCount: number
    totalQuestions: number
  }
  scoringPerStage?: Record<string, {
    earned: number
    possible: number
    percentage: number
    name: string
  }>
}

export type AspectScore = {
  aspectId: string
  title: string
  percentage: number
  rawScore: number
  maxScore: number
}
