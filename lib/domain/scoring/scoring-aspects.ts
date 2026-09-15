import type { BuilderQuestion, FormAspect, ScoringConfig, GradeThreshold, RecommendationConfig } from '@/lib/domain/forms/builder-state'
import type { QuestionScoreResult, AspectScoreResult } from './scoring-types'
import { isBiodataAspect, resolveQuestionAnswer } from './scoring-labels'
import { calculateQuestionScore } from './scoring-compute'
import { resolveGradeThreshold } from './threshold-engine'
import { resolveRecommendationArticleIds } from './recommendation-engine'

/**
 * Calculates Aspect score breakdowns.
 */
export function calculateAspectScores(
  aspects: FormAspect[],
  questions: BuilderQuestion[],
  answers: Record<string, any>,
  stagePointDistribution: Record<string, number> = {}
): AspectScoreResult[] {
  const aspectResults: AspectScoreResult[] = []

  const effectiveAspects =
    aspects && aspects.length > 0
      ? aspects
      : [
          {
            aspectId: 'default',
            title: 'Semua Pertanyaan',
            description: '',
            questionIds: questions.map((q) => q.questionId),
          },
        ]

  const questionsByAspect = new Map<string, BuilderQuestion[]>()
  effectiveAspects.forEach((asp) => questionsByAspect.set(asp.aspectId, []))

  questions.forEach((q) => {
    const rawAspId = q.aspectId || 'default'

    if (questionsByAspect.has(rawAspId)) {
      questionsByAspect.get(rawAspId)!.push(q)
      return
    }

    const matchedAsp = effectiveAspects.find(
      (a, aIdx) =>
        a.aspectId === rawAspId ||
        a.title === rawAspId ||
        `asp_${aIdx}` === rawAspId ||
        `stg_${aIdx}` === rawAspId ||
        `stage${aIdx + 1}` === rawAspId ||
        (a as any).id === rawAspId
    )

    if (matchedAsp) {
      questionsByAspect.get(matchedAsp.aspectId)!.push(q)
    } else if (effectiveAspects.length > 0) {
      questionsByAspect.get(effectiveAspects[0].aspectId)!.push(q)
    }
  })

  // Equal weight distribution fallback calculated only among scored non-biodata aspects
  const scoredAspectsList = effectiveAspects.filter((a: any) => a.isScored !== false && !isBiodataAspect(a.title))
  const autoWeight = scoredAspectsList.length > 0 ? Math.floor(100 / scoredAspectsList.length) : 100

  effectiveAspects.forEach((asp, idx) => {
    const aspQuestions = questionsByAspect.get(asp.aspectId) || []
    const questionResults: QuestionScoreResult[] = []

    let rawScore = 0
    let maximumScore = 0

    // If aspect is non-evaluated / biodata / sumber informasi, omit from scoring
    const isScored = (asp as any).isScored !== false && !isBiodataAspect(asp.title)

    aspQuestions.forEach((q) => {
      const qIdx = questions.indexOf(q)
      const resolvedAns = resolveQuestionAnswer(q, answers, qIdx)
      const qAns = resolvedAns !== undefined ? resolvedAns : answers
      const qRes = isScored
        ? calculateQuestionScore(q, qAns)
        : {
            questionId: q.questionId,
            aspectId: asp.aspectId,
            questionType: q.type,
            prompt: q.prompt,
            rawScore: 0,
            maximumScore: 0,
            percentage: 0,
            includedInTotal: false,
          }
      questionResults.push(qRes)

      if (isScored && qRes.includedInTotal) {
        rawScore += qRes.rawScore
        maximumScore += qRes.maximumScore
      }
    })

    const percentage = isScored && maximumScore > 0 ? Math.round((rawScore / maximumScore) * 100) : 0

    let weightPercentage = 0
    if (isScored) {
      const explicitWeight = stagePointDistribution[asp.aspectId] ?? stagePointDistribution[(asp as any).id]
      if (explicitWeight !== undefined && explicitWeight !== null) {
        weightPercentage = explicitWeight
      } else {
        const scoredIdx = scoredAspectsList.findIndex((a) => a.aspectId === asp.aspectId)
        weightPercentage =
          scoredIdx === scoredAspectsList.length - 1
            ? 100 - autoWeight * (scoredAspectsList.length - 1)
            : autoWeight
      }
    }

    const weightedContribution = Math.round((percentage * (weightPercentage / 100)) * 100) / 100

    aspectResults.push({
      aspectId: asp.aspectId,
      title: asp.title,
      rawScore,
      maximumScore,
      percentage,
      weightPercentage,
      weightedContribution,
      questions: questionResults,
    })
  })

  return aspectResults
}

/**
 * PURE AUTHORITATIVE SCORING ENGINE ENTRY POINT:
 * Calculates total response score, percentage, grade, and recommendations from snapshot.
 */
export function calculateResponseScore(
  formDocumentSnapshot: {
    aspects: FormAspect[]
    questions: BuilderQuestion[]
    scoring: ScoringConfig
    thresholds: GradeThreshold[]
    recommendations: RecommendationConfig
  },
  answers: Record<string, any>
): {
  rawScore: number
  maximumScore: number
  percentage: number
  gradeResult: ReturnType<typeof resolveGradeThreshold>
  aspectResults: AspectScoreResult[]
  questionResults: QuestionScoreResult[]
  recommendedArticleIds: string[]
} {
  const { aspects, questions, scoring, thresholds, recommendations } = formDocumentSnapshot

  // 1. Calculate Aspect Scores
  const aspectResults = calculateAspectScores(aspects, questions, answers, scoring.stagePointDistribution)

  // 2. Aggregate Total Raw & Maximum Scores
  let totalRaw = 0
  let totalMax = 0
  let finalPercentage = 0

  const allQuestionResults: QuestionScoreResult[] = []
  aspectResults.forEach((asp) => {
    totalRaw += asp.rawScore
    totalMax += asp.maximumScore
    allQuestionResults.push(...asp.questions)
  })

  // Calculate Weighted Final Percentage Score (0–100%)
  if (aspectResults.length > 0) {
    const sumWeighted = aspectResults.reduce((acc, a) => acc + a.weightedContribution, 0)
    finalPercentage = Math.min(100, Math.max(0, Math.round(sumWeighted * 100) / 100))
  } else {
    finalPercentage = totalMax > 0 ? Math.round((totalRaw / totalMax) * 100) : 0
  }

  // 3. Resolve Grade Threshold
  const gradeResult = resolveGradeThreshold(finalPercentage, thresholds)

  // 4. Resolve Article Recommendations
  const recommendedArticleIds = resolveRecommendationArticleIds(gradeResult.grade, recommendations)

  return {
    rawScore: totalRaw,
    maximumScore: totalMax,
    percentage: finalPercentage,
    gradeResult,
    aspectResults,
    questionResults: allQuestionResults,
    recommendedArticleIds,
  }
}
