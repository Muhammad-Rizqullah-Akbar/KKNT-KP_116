// Barrel module: re-exports the authoritative scoring engine split across
// per-concern modules while preserving the original public export API.
export { expandScaleLabel, resolveQuestionAnswer, isBiodataAspect } from './scoring-labels'
export { getFirstDefined, normalizeQuestionOptions, resolveCorrectOptionIds } from './scoring-options'
export type { NormalizedOption } from './scoring-options'
export { calculateQuestionScore } from './scoring-compute'
export { calculateAspectScores, calculateResponseScore } from './scoring-aspects'
