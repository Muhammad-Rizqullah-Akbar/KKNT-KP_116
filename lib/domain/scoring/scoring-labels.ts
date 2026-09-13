import type { BuilderQuestion } from '@/lib/domain/forms/builder-state'

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

export function isBiodataAspect(title: string): boolean {
  if (!title) return false
  const clean = title.trim().toLowerCase()
  const biodataKeywords = [
    'data responden',
    'informasi responden',
    'identitas responden',
    'biodata',
    'demografi',
    'profil responden',
    'data diri',
    'data umum',
    'sumber informasi',
    'sumber informasi & media',
    'sumber informasi kader',
    'sumber data',
  ]
  return biodataKeywords.some((k) => clean === k || clean.startsWith(`${k}:`) || clean.startsWith(`${k} -`))
}
