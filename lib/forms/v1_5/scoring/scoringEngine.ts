import type { BuilderQuestion, FormAspect, ScoringConfig, GradeThreshold, RecommendationConfig } from '@/lib/forms/v1_5/builderState'
import type { QuestionScoreResult, AspectScoreResult, ResponseResultDoc, IndicatorScoreItem } from '@/lib/forms/v1_5/scoring/scoringTypes'
import { resolveGradeThreshold } from '@/lib/forms/v1_5/scoring/thresholdEngine'
import { resolveRecommendationArticleIds } from '@/lib/forms/v1_5/scoring/recommendationEngine'

/**
 * Calculates score for a single question based on canonical V1.5 question definition and submitted answer.
 */
export function calculateQuestionScore(
  question: BuilderQuestion,
  answerValue: any
): QuestionScoreResult {
  const type = question.answerType || (question as any).type
  const prompt = question.prompt || question.questionId
  const aspectId = question.aspectId || 'default'

  // Non-scoring question types
  const nonScoringTypes = ['short-text', 'long-text', 'text', 'textarea', 'date', 'file-upload', 'image', 'signature', 'descriptive']
  if (nonScoringTypes.includes(type)) {
    return {
      questionId: question.questionId,
      aspectId,
      questionType: type,
      prompt,
      rawScore: 0,
      maximumScore: 0,
      percentage: 0,
      includedInTotal: false,
    }
  }

  // 1. SINGLE CHOICE / BINARY / DROPDOWN
  if (type === 'single-choice' || type === 'binary' || type === 'dropdown') {
    const defaultWeight = 5
    const maxScore = question.scoring?.weight ?? defaultWeight
    const answerKey = (question.answerKey as any) || {}
    const correctOptionIds = answerKey.correctOptionIds || (answerKey.optionId ? [answerKey.optionId] : [])

    const selectedOptId = typeof answerValue === 'string' ? answerValue : ''
    const isCorrect = correctOptionIds.length > 0 && correctOptionIds.includes(selectedOptId)
    const score = isCorrect ? maxScore : 0

    return {
      questionId: question.questionId,
      aspectId,
      questionType: type,
      prompt,
      rawScore: score,
      maximumScore: maxScore,
      percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
      includedInTotal: true,
      details: {
        selectedOptionId: selectedOptId,
        correctOptionIds,
        isCorrect,
      },
    }
  }

  // 2. MULTIPLE CHOICE
  if (type === 'multiple-choice') {
    const answerKey = (question.answerKey as any) || {}
    const correctOptionIds = answerKey.correctOptionIds || []
    const selectedOptionIds: string[] = Array.isArray(answerValue) ? answerValue : []

    // Exact cardinality requirement: selected count must equal correct option count
    const requiredSelectionCount = correctOptionIds.length
    const isCardinalityValid = requiredSelectionCount === 0 || selectedOptionIds.length === requiredSelectionCount

    let score = 0
    const maxScore = correctOptionIds.length > 0 ? correctOptionIds.length * 2 : 5

    if (isCardinalityValid && selectedOptionIds.length > 0) {
      // Award partial credit for each correct option selected
      for (const optId of selectedOptionIds) {
        if (correctOptionIds.includes(optId)) {
          score += 2
        }
      }
    }

    return {
      questionId: question.questionId,
      aspectId,
      questionType: type,
      prompt,
      rawScore: score,
      maximumScore: maxScore,
      percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
      includedInTotal: true,
      details: {
        selectedOptionIds,
        correctOptionIds,
        requiredSelectionCount,
        isCardinalityValid,
      },
    }
  }

  // 3. INDICATOR TABLE / LIKERT
  if (type === 'indicator-table' || type === 'likert') {
    const indicators = question.config?.indicators || []
    const defaultScales = [
      { value: 1, label: 'STS' },
      { value: 2, label: 'TS' },
      { value: 3, label: 'N' },
      { value: 4, label: 'S' },
      { value: 5, label: 'SS' },
    ]
    const scales = question.config?.indicatorScales || defaultScales

    // Compute max score per indicator (max numeric scale value)
    const maxScaleValue = Math.max(...scales.map((s: any) => Number(s.value ?? s)))

    let totalRawScore = 0
    let totalMaxScore = 0
    const indicatorDetails: IndicatorScoreItem[] = []

    const tableAnswers: Record<string, any> = typeof answerValue === 'object' && answerValue ? answerValue : {}

    for (const ind of indicators) {
      const indId = ind.indicatorId || ind.id || ind
      const indLabel = ind.label || ind.title || indId
      const indScales = ind.scales || scales
      const indMax = Math.max(...indScales.map((s: any) => Number(s.value ?? s)))

      const selectedVal = tableAnswers[indId] !== undefined ? Number(tableAnswers[indId]) : undefined
      const score = selectedVal !== undefined && !isNaN(selectedVal) ? selectedVal : 0

      totalRawScore += score
      totalMaxScore += indMax

      indicatorDetails.push({
        indicatorId: indId,
        label: indLabel,
        selectedValue: selectedVal,
        score,
        maximumScore: indMax,
      })
    }

    // NO SECONDARY QUESTION WEIGHT APPLIED TO INDICATOR TABLES!
    return {
      questionId: question.questionId,
      aspectId,
      questionType: type,
      prompt,
      rawScore: totalRawScore,
      maximumScore: totalMaxScore,
      percentage: totalMaxScore > 0 ? Math.round((totalRawScore / totalMaxScore) * 100) : 0,
      includedInTotal: true,
      details: {
        indicators: indicatorDetails,
      },
    }
  }

  // 4. RATING
  if (type === 'rating') {
    const ratingMax = question.config?.ratingMax || 5
    const numVal = Number(answerValue)
    const score = !isNaN(numVal) && numVal >= 1 ? Math.min(ratingMax, Math.max(1, numVal)) : 0

    return {
      questionId: question.questionId,
      aspectId,
      questionType: type,
      prompt,
      rawScore: score,
      maximumScore: ratingMax,
      percentage: ratingMax > 0 ? Math.round((score / ratingMax) * 100) : 0,
      includedInTotal: true,
      details: {
        ratingValue: numVal,
        ratingMax,
      },
    }
  }

  // Fallback
  return {
    questionId: question.questionId,
    aspectId,
    questionType: type,
    prompt,
    rawScore: 0,
    maximumScore: 0,
    percentage: 0,
    includedInTotal: false,
  }
}

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

  const questionsByAspect = new Map<string, BuilderQuestion[]>()
  aspects.forEach((asp) => questionsByAspect.set(asp.aspectId, []))

  questions.forEach((q) => {
    const aspId = q.aspectId || aspects[0]?.aspectId || 'default'
    if (!questionsByAspect.has(aspId)) {
      questionsByAspect.set(aspId, [])
    }
    questionsByAspect.get(aspId)!.push(q)
  })

  // Equal weight distribution fallback
  const autoWeight = aspects.length > 0 ? Math.floor(100 / aspects.length) : 100

  aspects.forEach((asp, idx) => {
    const aspQuestions = questionsByAspect.get(asp.aspectId) || []
    const questionResults: QuestionScoreResult[] = []

    let rawScore = 0
    let maximumScore = 0

    aspQuestions.forEach((q) => {
      const qRes = calculateQuestionScore(q, answers[q.questionId])
      questionResults.push(qRes)

      if (qRes.includedInTotal) {
        rawScore += qRes.rawScore
        maximumScore += qRes.maximumScore
      }
    })

    const percentage = maximumScore > 0 ? Math.round((rawScore / maximumScore) * 100) : 0
    const weightPercentage =
      stagePointDistribution[asp.aspectId] ??
      (idx === aspects.length - 1 ? 100 - autoWeight * (aspects.length - 1) : autoWeight)

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
  canonicalSnapshot: {
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
  const { aspects, questions, scoring, thresholds, recommendations } = canonicalSnapshot

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
