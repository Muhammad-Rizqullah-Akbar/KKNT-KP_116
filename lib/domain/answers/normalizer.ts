import type { BuilderQuestion } from '@/lib/domain/forms/builder-state'

/**
 * CANONICAL ANSWER NORMALIZER — single source of truth for converting raw
 * submitted answers (legacy text-key + numeric-index values) into clean,
 * human-readable values that reflect the real form options.
 *
 * This module resolves the long-standing "2 tipe data" bug where:
 *   - single-choice binary questions stored label text ("1. Laki Laki")
 *   - multiple-choice knowledge questions stored numeric indices (["2","4"])
 *   - indicator-table (Sikap/Perilaku) stored a { statement: "SS" } map
 *
 * One function, one contract: `normalizeAnswerValue(question, rawAnswer)`.
 */

export interface NormalizedOption {
  optionId: string
  label: string
  score: number
}

export function cleanString(s: string): string {
  return String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Extracts the option list from any question shape (V1.0 legacy, V1.5 builder).
 */
export function getQuestionOptions(question: BuilderQuestion | any): NormalizedOption[] {
  const raw =
    question?.options ||
    question?.presentation?.options ||
    question?.config?.options ||
    question?.answerOptions ||
    []
  if (!Array.isArray(raw)) return []
  return raw.map((o: any, idx: number) => {
    if (typeof o === 'string') {
      return { optionId: `opt_${question?.questionId ?? question?.id ?? idx}_${idx}`, label: o, score: 1 }
    }
    if (o && typeof o === 'object') {
      const label = o.label || o.text || o.title || o.value || String(o)
      return {
        optionId: o.optionId || o.id || `opt_${question?.questionId ?? question?.id ?? idx}_${idx}`,
        label,
        score: typeof o.score === 'number' ? o.score : 1,
      }
    }
    return { optionId: `opt_${question?.questionId ?? question?.id ?? idx}_${idx}`, label: String(o), score: 1 }
  })
}

/**
 * Resolves a single raw answer value to its human-readable label.
 * Handles numeric indices (0-based AND 1-based), option IDs, and exact labels.
 * If the value cannot be resolved, returns the raw value unchanged (never invents "Pilihan N").
 */
export function resolveOptionLabel(question: BuilderQuestion | any, rawValue: any): string {
  if (rawValue === undefined || rawValue === null || rawValue === '') return ''

  const options = getQuestionOptions(question)
  if (options.length === 0) return String(rawValue).trim()

  const str = String(rawValue).trim()
  const clean = cleanString(str)

  // 1. Exact optionId match
  const byId = options.find((o) => o.optionId === str || cleanString(o.optionId) === clean)
  if (byId) return byId.label

  // 2. Exact label match
  const byLabel = options.find((o) => o.label === str || cleanString(o.label) === clean)
  if (byLabel) return byLabel.label

  // 3. Numeric index match (1-based first, then 0-based)
  const num = Number(str)
  if (!isNaN(num)) {
    // 1-based index (most common: answers stored "1" = first option)
    if (num >= 1 && num <= options.length) {
      const oneBased = options[num - 1]
      if (oneBased) return oneBased.label
    }
    // 0-based fallback
    if (num >= 0 && num < options.length) {
      return options[num].label
    }
  }

  // 4. Prefix match: "1. Laki Laki" → strip leading "N. " and match label
  const withoutNumberPrefix = str.replace(/^\d+[\.\)\-:]\s*/, '').trim()
  if (withoutNumberPrefix && withoutNumberPrefix !== str) {
    const byStripped = options.find((o) => o.label === withoutNumberPrefix || cleanString(o.label) === cleanString(withoutNumberPrefix))
    if (byStripped) return byStripped.label
  }

  // 5. Substring fallback (contains)
  if (clean.length >= 2) {
    const byContains = options.find((o) => o.label.includes(str) || (clean.length >= 3 && cleanString(o.label).includes(clean)))
    if (byContains) return byContains.label
  }

  // Unresolvable → return raw (never fabricate a label)
  return str
}

/**
 * Canonical normalizer: converts a raw answer to a clean human-readable value.
 * - single value → label string
 * - array (multiple-choice) → array of labels
 * - object (indicator-table/likert) → { statement: scaleLabel }
 */
export function normalizeAnswerValue(question: BuilderQuestion | any, rawAnswer: any): any {
  const type = question?.answerType || question?.type || 'short-text'

  // indicator-table / likert → map of statement → scale label
  if (type === 'indicator-table' || type === 'likert') {
    if (rawAnswer && typeof rawAnswer === 'object' && !Array.isArray(rawAnswer)) {
      const result: Record<string, any> = {}
      for (const [k, v] of Object.entries(rawAnswer)) {
        result[k] = normalizeScaleLabel(v)
      }
      return result
    }
  }

  // array → resolve each element to label
  if (Array.isArray(rawAnswer)) {
    return rawAnswer.map((v) => resolveOptionLabel(question, v))
  }

  // single value → resolve to label
  return resolveOptionLabel(question, rawAnswer)
}

/**
 * Normalizes Likert/indicator scale abbreviations to full Indonesian labels.
 */
export function normalizeScaleLabel(value: any): string {
  if (value === undefined || value === null || value === '') return ''
  const s = String(value).trim().toUpperCase()
  const map: Record<string, string> = {
    STS: 'Sangat Tidak Setuju',
    TS: 'Tidak Setuju',
    N: 'Netral',
    S: 'Setuju',
    SS: 'Sangat Setuju',
    STMS: 'Sangat Tidak Memenuhi Syarat',
    TMS: 'Tidak Memenuhi Syarat',
    MS: 'Memenuhi Syarat',
    SMS: 'Sangat Memenuhi Syarat',
    'TIDAK PERNAH': 'Tidak Pernah',
    'KADANG-KADANG': 'Kadang-Kadang',
    'SERING/SELALU': 'Sering/Selalu',
  }
  return map[s] || String(value).trim()
}

/**
 * Resolves the raw answer from an answers map for a given question.
 * Prioritizes questionId → prompt text → normalized text → index.
 * Returns undefined if no answer found.
 */
export function resolveAnswer(question: BuilderQuestion | any, answers: Record<string, any>, indexInForm?: number): any {
  if (!answers || typeof answers !== 'object') return undefined

  // 1. questionId
  const qid = question?.questionId || question?.id
  if (qid && answers[qid] !== undefined) return answers[qid]

  // 2. prompt text variants
  const prompt = question?.prompt || question?.question || question?.label || question?.title || ''
  if (prompt) {
    const cleanPrompt = cleanString(prompt)
    if (cleanPrompt) {
      // exact
      if (answers[prompt] !== undefined) return answers[prompt]
      // normalized key scan
      for (const [k, v] of Object.entries(answers)) {
        if (cleanString(k) === cleanPrompt) return v
      }
      // contains (prompt in key)
      for (const [k, v] of Object.entries(answers)) {
        if (cleanString(k).includes(cleanPrompt) || cleanPrompt.includes(cleanString(k))) return v
      }
    }
  }

  // 3. index-based
  if (typeof indexInForm === 'number') {
    const keys = [String(indexInForm), `q_${indexInForm}`, `q${indexInForm}`, `q_${indexInForm + 1}`, `q${indexInForm + 1}`]
    for (const k of keys) if (answers[k] !== undefined) return answers[k]
  }

  return undefined
}
