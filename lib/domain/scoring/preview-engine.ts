// lib/scoring/ScoringEngine.ts
// Barrel + ScoringEngine class. The public export API is preserved:
// ScoringEngine (class), ScoringResult, AnswerMap are re-exported here.
// Internal per-question scoring helpers moved to preview-question-score.ts,
// grade/recommendation resolvers moved to preview-recommendation.ts,
// and shared types moved to preview-types.ts.

import { FormScoring, FormValidation, FormStage } from '@/features/form-builder/components/shared/ElementTypes'
import type { ScoringResult, AnswerMap } from './preview-types'
import { calculateQuestionScore } from './preview-question-score'
import { generateRecommendations, getGrade } from './preview-recommendation'

export type { ScoringResult, AnswerMap } from './preview-types'

export class ScoringEngine {
  private questions: any[]
  private scoring: FormScoring
  private stages: FormStage[]

  constructor(
    questions: any[],
    scoring: FormScoring,
    _validation: FormValidation,
    stages: FormStage[]
  ) {
    this.questions = questions
    this.scoring = scoring
    this.stages = stages
  }

  /**
   * Dapatkan stage yang masuk penilaian
   */
  /**
   * Dapatkan stage yang masuk penilaian
   */
  private getScoredStages(): FormStage[] {
    const distributionMap = this.scoring?.distribution || (this.scoring as any)?.stagePointDistribution || {}
    const hasExplicitDist = Object.keys(distributionMap).some(k => Number(distributionMap[k]) > 0)

    return this.stages.filter((s) => {
      if (s.includeInScoring === false || (s as any).isScored === false) return false
      if (hasExplicitDist) {
        const allocated = Number(distributionMap[s.id]) || 0
        return allocated > 0
      }
      return true
    })
  }

  /**
   * Hitung skor berdasarkan jawaban user
   */
  calculateScore(answers: AnswerMap): ScoringResult {
    const perQuestion: Record<string, any> = {}
    const perStage: Record<string, any> = {}
    let correctCount = 0
    let wrongCount = 0
    let skippedCount = 0
    let totalQuestions = 0

    // Inisialisasi per stage
    this.stages.forEach(stage => {
      perStage[stage.id] = {
        earned: 0,
        possible: 0,
        percentage: 0,
        name: stage.name,
        rawEarned: 0,
        rawPossible: 0,
      }
    })

    // Filter pertanyaan yang bisa discore
    const scorableQuestions = this.questions.filter((q: any) => {
      const type = q.answerType || q.type || 'short-text'
      return type !== 'image' && type !== 'file-upload' && type !== 'signature'
    })

    totalQuestions = scorableQuestions.length

    // ===== HITUNG SKOR MENTAH (RAW SCORE) =====
    scorableQuestions.forEach((q: any) => {
      const result = calculateQuestionScore(q, answers)
      const label = q.question || q.label || `Pertanyaan ${q.order + 1 || ''}`

      perQuestion[q.id] = {
        ...result,
        label
      }

      // Akumulasi ke stage (RAW)
      const stageId = q.stageId || q.aspectId || (this.stages.find(s => s.questionIds?.includes(q.id))?.id) || this.stages[0]?.id
      if (stageId && perStage[stageId]) {
        perStage[stageId].rawEarned += result.earned
        perStage[stageId].rawPossible += result.possible
      }

      // Statistik
      if (result.possible > 0) {
        if (result.earned === result.possible) {
          correctCount++
        } else if (result.earned === 0) {
          wrongCount++
        } else {
          // Partial correct
          correctCount++
        }
      } else {
        skippedCount++
      }
    })

    // ===== HITUNG PERSENTASE PER STAGE (RAW) =====
    Object.keys(perStage).forEach(stageId => {
      const stage = perStage[stageId]
      const rawPercentage = stage.rawPossible > 0
        ? Math.round((stage.rawEarned / stage.rawPossible) * 100)
        : 0
      stage.percentage = rawPercentage
    })

    // ===== NORMALISASI KE TOTAL POINTS =====
    let totalEarnedPoints = 0
    let totalPossiblePoints = 0
    const scoredStages = this.getScoredStages()
    const distributionMap = this.scoring?.distribution || (this.scoring as any)?.stagePointDistribution || {}
    const hasExplicitDist = Object.keys(distributionMap).some(k => Number(distributionMap[k]) > 0)

    scoredStages.forEach(stage => {
      const stageData = perStage[stage.id] || { rawEarned: 0, rawPossible: 0, percentage: 0, name: stage.name || 'Aspect', earned: 0, possible: 0 }

      if (hasExplicitDist) {
        const allocatedPoints = Number(distributionMap[stage.id]) || 0
        const stagePct = Number(stageData.percentage) || 0
        const normalizedEarned = (stagePct / 100) * allocatedPoints
        stageData.earned = Math.round(normalizedEarned * 100) / 100
        stageData.possible = allocatedPoints
      } else {
        stageData.earned = stageData.rawEarned
        stageData.possible = stageData.rawPossible
        stageData.percentage = stageData.rawPossible > 0 ? Math.round((stageData.rawEarned / stageData.rawPossible) * 100) : 0
      }

      perStage[stage.id] = stageData
      totalEarnedPoints += stageData.earned
      totalPossiblePoints += stageData.possible
    })

    // ===== UNSCORED STAGES =====
    this.stages.forEach(stage => {
      if (!scoredStages.find(s => s.id === stage.id)) {
        perStage[stage.id].earned = 0
        perStage[stage.id].possible = 0
        perStage[stage.id].percentage = 0
      }
    })

    // ===== TOTAL =====
    const totalPercentage = totalPossiblePoints > 0
      ? Math.round((totalEarnedPoints / totalPossiblePoints) * 100)
      : 0

    const grade = getGrade(totalPercentage)
    const recommendations = generateRecommendations(perStage, totalPercentage)

    return {
      totalScore: Math.round(totalEarnedPoints * 100) / 100,
      maxScore: this.scoring.totalPoints,
      percentage: totalPercentage,
      grade,
      perQuestion,
      perStage,
      details: {
        correctCount,
        wrongCount,
        skippedCount,
        totalQuestions,
        scoredQuestions: scorableQuestions.length,
        unscoredQuestions: this.questions.length - scorableQuestions.length,
      },
      recommendations
    }
  }
}
