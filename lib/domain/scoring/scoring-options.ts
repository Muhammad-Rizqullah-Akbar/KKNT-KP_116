import type { BuilderQuestion } from '@/lib/domain/forms/builder-state'

export function getFirstDefined(...vals: any[]) {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '') return v
  }
  return undefined
}

export interface NormalizedOption {
  optionId: string
  label: string
  score: number
}

/**
 * Normalizes raw option definitions (string | object) into a canonical shape.
 */
export function normalizeQuestionOptions(question: BuilderQuestion): NormalizedOption[] {
  const rawOptions = question.options || (question as any).presentation?.options || (question as any).config?.options || []
  return rawOptions.map((o: any, idx: number) => {
    if (typeof o === 'string') return { optionId: `opt_${question.questionId}_${idx}`, label: o, score: 1 }
    if (o && typeof o === 'object') {
      const lbl = o.label || o.text || o.title || String(o)
      return {
        optionId: o.optionId || o.id || `opt_${question.questionId}_${idx}`,
        label: lbl,
        score: typeof o.score === 'number' ? o.score : 1,
      }
    }
    return { optionId: `opt_${question.questionId}_${idx}`, label: String(o), score: 1 }
  })
}

/**
 * Resolves the correct option IDs (and labels) from a question's answer key.
 */
export function resolveCorrectOptionIds(question: BuilderQuestion, options: NormalizedOption[]): string[] {
  const rawCorrect = getFirstDefined(
    (question.answerKey as any)?.correctOptionIds,
    (question.answerKey as any)?.optionId,
    (question as any).config?.correctAnswer,
    (question as any).config?.correct_answer,
    (question as any).correctAnswer,
    (question as any).correct_answer,
    (question as any).answerKey,
    (question as any).answer,
    (question as any).scoring?.correctAnswer
  )

  const correctOptionIds: string[] = []
  if (rawCorrect !== undefined && rawCorrect !== null && rawCorrect !== '') {
    const list = Array.isArray(rawCorrect) ? rawCorrect : [rawCorrect]
    list.forEach((item: any) => {
      if (item === undefined || item === null || item === '') return
      const strItem = String(item).trim()
      const cleanItem = strItem.toLowerCase().replace(/[^a-z0-9]/g, '')
      let matched = options.find((o: any) => o.optionId === strItem || o.label === strItem)
      if (!matched && cleanItem) {
        matched = options.find((o: any) => {
          const cL = o.label ? o.label.toLowerCase().replace(/[^a-z0-9]/g, '') : ''
          const cId = o.optionId ? o.optionId.toLowerCase().replace(/[^a-z0-9]/g, '') : ''
          return cL === cleanItem || cId === cleanItem
        })
      }
      if (!matched) {
        const numIdx = Number(item)
        if (!isNaN(numIdx)) {
          if (numIdx >= 0 && numIdx < options.length) matched = options[numIdx]
          else if (numIdx >= 1 && numIdx <= options.length) matched = options[numIdx - 1]
        }
      }
      if (matched) {
        if (!correctOptionIds.includes(matched.optionId)) correctOptionIds.push(matched.optionId)
        if (!correctOptionIds.includes(matched.label)) correctOptionIds.push(matched.label)
      } else {
        if (!correctOptionIds.includes(strItem)) correctOptionIds.push(strItem)
      }
    })
  }

  return correctOptionIds
}
