import type { BuilderQuestion, FormAspect, ScoringConfig, GradeThreshold, RecommendationConfig } from '@/lib/forms/v1_5/builderState'
import type { QuestionScoreResult, AspectScoreResult, ResponseResultDoc, IndicatorScoreItem } from '@/lib/forms/v1_5/scoring/scoringTypes'
import { resolveGradeThreshold } from '@/lib/forms/v1_5/scoring/thresholdEngine'
import { resolveRecommendationArticleIds } from '@/lib/forms/v1_5/scoring/recommendationEngine'

export function expandScaleLabel(label: any): string {
  if (label === undefined || label === null || label === '') return '-'
  const str = String(label).trim()
  const clean = str.replace(/^(\d+[\.\-\s\(\)\:]+)+/g, '').replace(/[\(\)]/g, '').trim()
  const upper = clean.toUpperCase()

  if (upper === 'STS') return 'Sangat Tidak Setuju'
  if (upper === 'TS') return 'Tidak Setuju'
  if (upper === 'N') return 'Netral'
  if (upper === 'S') return 'Setuju'
  if (upper === 'SS') return 'Sangat Setuju'

  if (upper === 'STMS') return 'Sangat Tidak Memenuhi Syarat'
  if (upper === 'TMS') return 'Tidak Memenuhi Syarat'
  if (upper === 'MS') return 'Memenuhi Syarat'
  if (upper === 'SMS') return 'Sangat Memenuhi Syarat'

  if (upper === 'SK') return 'Sangat Kurang'
  if (upper === 'K') return 'Kurang'
  if (upper === 'C') return 'Cukup'
  if (upper === 'B') return 'Baik'
  if (upper === 'SB') return 'Sangat Baik'

  return str
}

/**
 * Safely resolves the answer value for a question from the submitted answers map.
 * Supports modern V1.5 (questionId), legacy prompt text, legacy question labels, and index-based keys.
 */
export function resolveQuestionAnswer(
  question: BuilderQuestion,
  answers: Record<string, any>,
  indexInForm?: number
): any {
  if (!answers || typeof answers !== 'object') return undefined

  // 1. Direct V1.5 questionId lookup (Highest priority)
  if (answers[question.questionId] !== undefined) {
    return answers[question.questionId]
  }

  const prompt = question.prompt || (question as any).question || (question as any).label || (question as any).title || ''
  const cleanPromptStr = typeof prompt === 'string' ? prompt.trim() : ''

  // 2. Exact Prompt / Label text lookup
  if (cleanPromptStr && answers[cleanPromptStr] !== undefined) {
    return answers[cleanPromptStr]
  }

  // 3. Lowercase & normalized prompt text lookup
  if (cleanPromptStr) {
    const cleanLower = cleanPromptStr.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (cleanLower) {
      for (const [key, val] of Object.entries(answers)) {
        const keyClean = key.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (keyClean === cleanLower) {
          return val
        }
      }
    }
  }

  // 4. Index-based fallback (e.g., answers["0"], answers["q_0"], answers["q1"])
  if (typeof indexInForm === 'number') {
    const indexKeys = [
      String(indexInForm),
      `q_${indexInForm}`,
      `q${indexInForm}`,
      `q_${indexInForm + 1}`,
      `q${indexInForm + 1}`,
      `question_${indexInForm}`,
      `question_${indexInForm + 1}`,
    ]
    for (const key of indexKeys) {
      if (answers[key] !== undefined) {
        return answers[key]
      }
    }
  }

  // 5. Legacy ID fallback if question has an id property different from questionId
  const legacyId = (question as any).id
  if (legacyId && answers[legacyId] !== undefined) {
    return answers[legacyId]
  }

  return undefined
}

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
      selectedValue: answerValue,
    }
  }

  // 1. SINGLE CHOICE / BINARY / DROPDOWN
  if (type === 'single-choice' || type === 'binary' || type === 'dropdown') {
    const options = question.options || (question as any).presentation?.options || []
    const answerKey = (question.answerKey as any) || {}
    const correctOptionIds: string[] = answerKey.correctOptionIds || (answerKey.optionId ? [answerKey.optionId] : [])
    const optionScores: Record<string, number> = answerKey.optionScores || {}

    // Calculate maximum score for this question across all options
    const optionMaxScores = options.map((o) => typeof o.score === 'number' ? o.score : (optionScores[o.optionId || (o as any).id] ?? 0))
    let maxScore = Math.max(...optionMaxScores, typeof question.scoring?.weight === 'number' ? question.scoring.weight : 0)
    if (maxScore <= 0) maxScore = 5 // Fallback default max score

    const selectedOptId = typeof answerValue === 'string' ? answerValue : ''
    const selectedOptObj = options.find((o: any) =>
      o.optionId === selectedOptId ||
      o.id === selectedOptId ||
      o.label === selectedOptId ||
      String(o.val || o.value) === selectedOptId
    )

    let awardedScore = 0
    let isCorrect = false

    if (correctOptionIds.length > 0) {
      isCorrect = Boolean(
        selectedOptId
          ? correctOptionIds.includes(selectedOptId) || (selectedOptObj && correctOptionIds.includes(selectedOptObj.optionId || (selectedOptObj as any).id))
          : false
      )
      
      if (isCorrect) {
        awardedScore = selectedOptObj?.score ?? optionScores[selectedOptId] ?? maxScore
      } else if (selectedOptObj && typeof selectedOptObj.score === 'number') {
        awardedScore = selectedOptObj.score
      }
    } else {
      if (selectedOptObj) {
        awardedScore = typeof selectedOptObj.score === 'number'
          ? selectedOptObj.score
          : (optionScores[selectedOptObj.optionId || (selectedOptObj as any).id] ?? 0)
        isCorrect = awardedScore > 0
      }
    }

    return {
      questionId: question.questionId,
      aspectId,
      questionType: type,
      prompt,
      rawScore: awardedScore,
      maximumScore: maxScore,
      percentage: maxScore > 0 ? Math.round((awardedScore / maxScore) * 100) : 0,
      includedInTotal: true,
      selectedValue: selectedOptObj?.label || selectedOptId || answerValue,
      details: {
        selectedOptionId: selectedOptId,
        selectedLabel: selectedOptObj?.label || selectedOptId,
        correctOptionIds,
        isCorrect,
      },
    }
  }

  // 2. MULTIPLE CHOICE
  if (type === 'multiple-choice') {
    const options = question.options || (question as any).presentation?.options || []
    const answerKey = (question.answerKey as any) || {}
    const correctOptionIds: string[] = answerKey.correctOptionIds || []
    const optionScores: Record<string, number> = answerKey.optionScores || {}
    const selectedOptionIds: string[] = Array.isArray(answerValue) ? answerValue : []

    let maxScore = 0
    if (correctOptionIds.length > 0) {
      correctOptionIds.forEach((optId) => {
        const optObj = options.find((o) => o.optionId === optId || (o as any).id === optId)
        const optPts = optObj?.score ?? optionScores[optId] ?? 5
        maxScore += optPts
      })
    } else {
      options.forEach((o) => {
        const pts = typeof o.score === 'number' ? o.score : (optionScores[o.optionId || (o as any).id] ?? 0)
        if (pts > 0) maxScore += pts
      })
    }
    if (maxScore <= 0) maxScore = 5

    let score = 0
    selectedOptionIds.forEach((itemVal) => {
      const optObj = options.find((o: any) =>
        o.optionId === itemVal ||
        o.id === itemVal ||
        o.label === itemVal ||
        String(o.val || o.value) === itemVal
      )

      if (correctOptionIds.length > 0) {
        if (optObj && (correctOptionIds.includes(optObj.optionId || (optObj as any).id) || correctOptionIds.includes(itemVal))) {
          score += optObj?.score ?? optionScores[itemVal] ?? (maxScore / correctOptionIds.length)
        }
      } else {
        if (optObj && typeof optObj.score === 'number') {
          score += optObj.score
        } else if (optionScores[itemVal] !== undefined) {
          score += optionScores[itemVal]
        }
      }
    })

    const selectedLabels = selectedOptionIds.map((itemVal) => {
      const optObj = options.find((o: any) => o.optionId === itemVal || o.id === itemVal || o.label === itemVal)
      return optObj?.label || itemVal
    })

    return {
      questionId: question.questionId,
      aspectId,
      questionType: type,
      prompt,
      rawScore: score,
      maximumScore: maxScore,
      percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
      includedInTotal: true,
      selectedValue: selectedLabels,
      details: {
        selectedOptionIds,
        correctOptionIds,
      },
    }
  }

  // 3. INDICATOR TABLE / LIKERT
  if (type === 'indicator-table' || type === 'likert') {
    const rawIndicators =
      (question as any).indicators ||
      (question as any).presentation?.indicators ||
      (question as any).config?.indicators ||
      (question as any).config?.statements ||
      (question as any).items ||
      (question as any).options ||
      []

    const presentationScales = (question as any).presentation?.indicatorScales
    const configScales = (question as any).config?.indicatorScales
    const questionScales = (question as any).indicatorScales || (question as any).scales || (question as any).options
    const defaultScales = [
      { value: 1, label: 'STS', score: 1 },
      { value: 2, label: 'TS', score: 2 },
      { value: 3, label: 'N', score: 3 },
      { value: 4, label: 'S', score: 4 },
      { value: 5, label: 'SS', score: 5 },
    ]

    const scales =
      presentationScales && presentationScales.length > 0
        ? presentationScales
        : configScales && configScales.length > 0
        ? configScales
        : questionScales && questionScales.length > 0
        ? questionScales
        : defaultScales

    const showWeighted = (question as any).config?.showWeightedScore || (question as any).presentation?.showWeightedScore || false

    const indicators = rawIndicators.length > 0 ? rawIndicators : [{ indicatorId: `${question.questionId}_ind_1`, label: 'Indikator Standar' }]

    // Maximum and minimum scale values across scales
    const scaleValues = scales.map((s: any) => typeof s.score === 'number' ? s.score : typeof s.value === 'number' ? s.value : 5)
    const maxScaleValue = scaleValues.length > 0 ? Math.max(...scaleValues) : 5
    const minScaleValue = scaleValues.length > 0 ? Math.min(...scaleValues) : 1

    let totalRawScore = 0
    let totalMaxScore = 0
    const indicatorDetails: IndicatorScoreItem[] = []

    // Extract table answers (support nested object OR flat keys)
    let tableAnswers: Record<string, any> = {}
    if (typeof answerValue === 'object' && answerValue && !Array.isArray(answerValue)) {
      tableAnswers = { ...answerValue }
    } else if (answerValue !== undefined && answerValue !== null) {
      tableAnswers = { [question.questionId]: answerValue }
    }

    indicators.forEach((ind: any, index: number) => {
      const indId = ind.indicatorId || ind.id || ind.code || ind.key || `${question.questionId}-${index}`
      const indLabel = ind.label || ind.title || ind.prompt || ind.name || indId
      const weight = typeof ind.weight === 'number' ? ind.weight : 1
      const isReverse = ind.reverse === true

      const indScales = ind.scales && ind.scales.length > 0 ? ind.scales : scales
      const indScores = ind.scores || (question as any).answerKey?.optionScores || {}

      // Calculate max score for this indicator
      let indMax = showWeighted ? maxScaleValue * weight : maxScaleValue
      if (indMax <= 0) indMax = 5

      // Resolve selected value from tableAnswers using all possible keys
      let selectedVal =
        tableAnswers[indId] ??
        tableAnswers[`${question.questionId}-${index}`] ??
        tableAnswers[`${question.questionId}_${index}`] ??
        tableAnswers[ind.id] ??
        tableAnswers[ind.indicatorId] ??
        tableAnswers[ind.name] ??
        tableAnswers[ind.label] ??
        tableAnswers[String(index)] ??
        tableAnswers[String(index + 1)]

      let score = 0
      if (selectedVal !== undefined && selectedVal !== null && selectedVal !== '') {
        const strVal = String(selectedVal).trim().toLowerCase()
        const cleanSelected = strVal.replace(/^(\d+[\.\-\s\(\)\:]+)+/g, '').replace(/[\(\)]/g, '').trim()
        const expSelected = expandScaleLabel(selectedVal).trim().toLowerCase()

        let numVal = Number(selectedVal)
        if (isNaN(numVal) && typeof selectedVal === 'string') {
          const parsed = parseFloat(selectedVal.replace(/[^0-9\.]/g, ''))
          if (!isNaN(parsed)) numVal = parsed
        }

        let matchedScale = indScales.find((s: any, sIdx: number) => {
          const rawSLabel = String(s.label || s.text || s.name || s.title || s || '')
          const expSLabel = expandScaleLabel(rawSLabel).trim().toLowerCase()
          const cleanSLabel = rawSLabel.replace(/^(\d+[\.\-\s\(\)\:]+)+/g, '').replace(/[\(\)]/g, '').trim().toLowerCase()
          const sLabel = rawSLabel.trim().toLowerCase()
          const sId = String(s.id || s.optionId || s.key || '').trim().toLowerCase()
          const sVal = String(s.value ?? s.score ?? '').trim().toLowerCase()
          return (
            (expSLabel && (expSLabel === expSelected || expSLabel === strVal || expSLabel === cleanSelected)) ||
            (cleanSLabel && (cleanSLabel === strVal || cleanSLabel === cleanSelected || cleanSLabel === expSelected)) ||
            (sLabel && (sLabel === strVal || sLabel === cleanSelected || sLabel === expSelected)) ||
            (sId && sId === strVal) ||
            (sVal && sVal === strVal) ||
            (!isNaN(numVal) && Number(s.value ?? s.score) === numVal) ||
            `op_${s.value}` === strVal ||
            (!isNaN(numVal) && (sIdx + 1) === numVal)
          )
        })

        if (!matchedScale && indScales.length > 0) {
          if (!isNaN(numVal) && numVal >= 1 && numVal <= indScales.length) {
            matchedScale = indScales[numVal - 1]
          } else {
            const likertLevelMap: Record<string, number> = {
              'sts': 1, 'sangat tidak setuju': 1, 'stms': 1, 'sangat tidak memenuhi syarat': 1, 'sangat kurang': 1, 'sk': 1, '1': 1,
              'ts': 2, 'tidak setuju': 2, 'tms': 2, 'tidak memenuhi syarat': 2, 'kurang': 2, 'k': 2, '2': 2,
              'n': 3, 'netral': 3, 'cukup': 3, 'c': 3, '3': 3,
              's': 4, 'setuju': 4, 'ms': 4, 'memenuhi syarat': 4, 'baik': 4, 'b': 4, '4': 4,
              'ss': 5, 'sangat setuju': 5, 'sms': 5, 'sangat memenuhi syarat': 5, 'sangat baik': 5, 'sb': 5, '5': 5,
            }
            const lvl = likertLevelMap[cleanSelected] || likertLevelMap[expSelected] || likertLevelMap[strVal]
            if (lvl && lvl >= 1 && lvl <= indScales.length) {
              matchedScale = indScales[lvl - 1]
            }
          }
        }

        if (matchedScale) {
          let scaleVal = typeof matchedScale.score === 'number'
            ? matchedScale.score
            : typeof matchedScale.value === 'number'
            ? matchedScale.value
            : !isNaN(Number(matchedScale.score))
            ? Number(matchedScale.score)
            : !isNaN(Number(matchedScale.value))
            ? Number(matchedScale.value)
            : !isNaN(numVal)
            ? numVal
            : 0

          const labelKey = matchedScale.label
          if (indScores[labelKey] !== undefined) scaleVal = Number(indScores[labelKey])

          // Apply REVERSE SCORING if indicator.reverse === true
          if (isReverse && scaleVal > 0) {
            scaleVal = maxScaleValue - scaleVal + minScaleValue
          }

          score = showWeighted ? scaleVal * weight : scaleVal
        } else if (indScores[selectedVal] !== undefined) {
          score = Number(indScores[selectedVal])
        } else if (!isNaN(numVal)) {
          let scaleVal = Math.min(maxScaleValue, Math.max(minScaleValue, numVal))
          if (isReverse && scaleVal > 0) {
            scaleVal = maxScaleValue - scaleVal + minScaleValue
          }
          score = showWeighted ? scaleVal * weight : scaleVal
        }
      }

      totalRawScore += score
      totalMaxScore += indMax

      indicatorDetails.push({
        indicatorId: indId,
        label: indLabel,
        selectedValue: selectedVal,
        score,
        maximumScore: indMax,
      })
    })

    return {
      questionId: question.questionId,
      aspectId,
      questionType: type,
      prompt,
      rawScore: totalRawScore,
      maximumScore: totalMaxScore,
      percentage: totalMaxScore > 0 ? Math.round((totalRawScore / totalMaxScore) * 100) : 0,
      includedInTotal: true,
      selectedValue: tableAnswers,
      details: {
        indicatorCount: indicators.length,
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
      selectedValue: answerValue,
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
    selectedValue: answerValue,
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

  const effectiveAspects =
    Array.isArray(aspects) && aspects.length > 0
      ? aspects
      : [
          {
            aspectId: 'default',
            title: 'Evaluasi Kuesioner',
            weightPercentage: 100,
            isScored: true,
          },
        ]

  const questionsByAspect = new Map<string, BuilderQuestion[]>()
  effectiveAspects.forEach((asp) => questionsByAspect.set(asp.aspectId, []))

  questions.forEach((q) => {
    const rawAspId =
      q.aspectId ||
      (q as any).stageId ||
      (q as any).stage_id ||
      (q as any).aspect ||
      (q as any).category ||
      'default'

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

  // Equal weight distribution fallback
  const autoWeight = effectiveAspects.length > 0 ? Math.floor(100 / effectiveAspects.length) : 100

  effectiveAspects.forEach((asp, idx) => {
    const aspQuestions = questionsByAspect.get(asp.aspectId) || []
    const questionResults: QuestionScoreResult[] = []

    let rawScore = 0
    let maximumScore = 0

    // If aspect is non-evaluated / biodata (isScored === false), omit scoring
    const isScored = asp.isScored !== false

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
    const weightPercentage = isScored
      ? stagePointDistribution[asp.aspectId] ??
        stagePointDistribution[(asp as any).id] ??
        (idx === aspects.length - 1 ? 100 - autoWeight * (aspects.length - 1) : autoWeight)
      : 0

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
