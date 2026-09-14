import type { BuilderQuestion } from '@/lib/domain/forms/builder-state'
import type { QuestionScoreResult, IndicatorScoreItem } from './scoring-types'
import { expandScaleLabel } from './scoring-labels'
import { getFirstDefined, normalizeQuestionOptions, resolveCorrectOptionIds } from './scoring-options'

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
    const options = normalizeQuestionOptions(question)
    const correctOptionIds = resolveCorrectOptionIds(question, options)

    const optionScores: Record<string, number> = (question.answerKey as any)?.optionScores || {}

    // Calculate maximum score for this question across all options
    const optionMaxScores = options.map((o: any) => typeof o.score === 'number' ? o.score : (optionScores[o.optionId || o.id] ?? 0))
    let maxScore = Math.max(...optionMaxScores, typeof question.scoring?.weight === 'number' ? question.scoring.weight : 0)
    if (maxScore <= 0) maxScore = 5 // Fallback default max score

    const strAnsVal = answerValue !== undefined && answerValue !== null ? String(answerValue).trim() : ''
    const cleanAnsVal = strAnsVal.toLowerCase().replace(/[^a-z0-9]/g, '')

    let selectedOptObj = options.find((o: any) =>
      o.optionId === strAnsVal ||
      o.id === strAnsVal ||
      o.label === strAnsVal ||
      String(o.value ?? o.val ?? '') === strAnsVal
    )

    if (!selectedOptObj && cleanAnsVal) {
      selectedOptObj = options.find((o: any) => {
        const cL = o.label ? o.label.toLowerCase().replace(/[^a-z0-9]/g, '') : ''
        const cId = o.optionId ? o.optionId.toLowerCase().replace(/[^a-z0-9]/g, '') : ''
        return cL === cleanAnsVal || cId === cleanAnsVal
      })
    }

    if (!selectedOptObj && !isNaN(Number(answerValue))) {
      const numIdx = Number(answerValue)
      if (numIdx >= 0 && numIdx < options.length) selectedOptObj = options[numIdx]
      else if (numIdx >= 1 && numIdx <= options.length) selectedOptObj = options[numIdx - 1]
    }

    let awardedScore = 0
    let isCorrect = false

    if (correctOptionIds.length > 0) {
      isCorrect = Boolean(
        strAnsVal
          ? correctOptionIds.some((cid) => {
              const cleanCid = cid.toLowerCase().replace(/[^a-z0-9]/g, '')
              return (
                cid === strAnsVal ||
                (selectedOptObj && (cid === selectedOptObj.optionId || cid === (selectedOptObj as any).id || cid === selectedOptObj.label)) ||
                (cleanCid && (cleanCid === cleanAnsVal || (selectedOptObj && (cleanCid === selectedOptObj.label.toLowerCase().replace(/[^a-z0-9]/g, '') || cleanCid === selectedOptObj.optionId.toLowerCase().replace(/[^a-z0-9]/g, '')))))
              )
            })
          : false
      )

      if (isCorrect) {
        awardedScore = selectedOptObj?.score ?? optionScores[strAnsVal] ?? maxScore
      } else {
        awardedScore = optionScores[strAnsVal] ?? 0
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
      selectedValue: selectedOptObj?.label || strAnsVal || answerValue,
      details: {
        selectedOptionId: selectedOptObj?.optionId || strAnsVal,
        selectedLabel: selectedOptObj?.label || strAnsVal,
        correctOptionIds,
        isCorrect,
      },
    }
  }

  // 2. MULTIPLE CHOICE — BINARY STRICT (BPOM: 1 poin per soal, benar semua = 1, ada salah = 0)
  if (type === 'multiple-choice') {
    const options = normalizeQuestionOptions(question)
    const correctOptionIds = resolveCorrectOptionIds(question, options)

    const optionScores: Record<string, number> = (question.answerKey as any)?.optionScores || {}
    const selectedOptionIds: string[] = Array.isArray(answerValue) ? answerValue : (answerValue !== undefined && answerValue !== null ? [answerValue] : [])

    // BPOM binary: soal dihitung 1 poin penuh jika SEMUA opsi benar dipilih TEPAT (tanpa opsi salah).
    // maxScore = 1 (satu soal), bukan jumlah opsi.
    const maxScore = 1

    let score = 0
    if (correctOptionIds.length > 0 && selectedOptionIds.length > 0) {
      // Resolve selected → optionId (canonical)
      const selectedResolved: string[] = []
      selectedOptionIds.forEach((itemVal) => {
        const strVal = String(itemVal).trim()
        const cleanVal = strVal.toLowerCase().replace(/[^a-z0-9]/g, '')
        let optObj = options.find((o: any) => o.optionId === strVal || o.id === strVal || o.label === strVal)
        if (!optObj && cleanVal) {
          optObj = options.find((o: any) => {
            const cL = o.label ? o.label.toLowerCase().replace(/[^a-z0-9]/g, '') : ''
            const cId = o.optionId ? o.optionId.toLowerCase().replace(/[^a-z0-9]/g, '') : ''
            return cL === cleanVal || cId === cleanVal
          })
        }
        if (optObj) selectedResolved.push(optObj.optionId)
        else selectedResolved.push(strVal)
      })

      // Binary strict: jumlah & isi opsi terpilih HARUS sama persis dengan correct
      const sortedSelected = [...selectedResolved].sort()
      const sortedCorrect = [...correctOptionIds].sort()
      const allCorrect = sortedSelected.length === sortedCorrect.length &&
        sortedSelected.every((s, i) => s === sortedCorrect[i])
      if (allCorrect) score = 1
    }

    const selectedLabels = selectedOptionIds.map((itemVal) => {
      const strVal = String(itemVal).trim()
      const cleanVal = strVal.toLowerCase().replace(/[^a-z0-9]/g, '')
      const optObj = options.find((o: any) => o.optionId === strVal || o.id === strVal || o.label === strVal || (cleanVal && o.label.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanVal))
      return optObj?.label || strVal
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

// Re-exported for internal compatibility
export { getFirstDefined }
