import type { GradeThreshold } from '@/lib/forms/v1_5/builderState'
import type { GradeResult } from '@/lib/forms/v1_5/scoring/scoringTypes'

/**
 * Deterministic grade threshold resolver.
 * Maps final percentage (0–100) to configured GradeThreshold (e.g. A, B, C, D, E).
 * Avoids floating-point boundary ambiguity (e.g. 89.999 vs 90.000).
 */
export function resolveGradeThreshold(
  percentage: number,
  thresholds: GradeThreshold[]
): GradeResult {
  if (!thresholds || thresholds.length === 0) {
    // Default fallback threshold
    return {
      thresholdId: 'default',
      grade: percentage >= 70 ? 'LULUS' : 'PERLU_PERBAIKAN',
      title: percentage >= 70 ? 'Memenuhi Standar' : 'Perlu Pembinaan',
      description: 'Hasil evaluasi kuesioner',
      min: 0,
      max: 100,
    }
  }

  // Round percentage to 2 decimal places to ensure deterministic boundary evaluation
  const rounded = Math.round(percentage * 100) / 100

  // Sort thresholds by min descending
  const sorted = [...thresholds].sort((a, b) => b.min - a.min)

  for (const t of sorted) {
    // Check if percentage falls within range [min, max]
    // Upper boundary tolerance for maximum score = 100
    if (rounded >= t.min && rounded <= t.max + 0.001) {
      return {
        thresholdId: t.id,
        grade: t.grade,
        title: t.title,
        description: t.description,
        min: t.min,
        max: t.max,
      }
    }
  }

  // Fallback to lowest threshold if below all ranges
  const lowest = sorted[sorted.length - 1]
  return {
    thresholdId: lowest.id,
    grade: lowest.grade,
    title: lowest.title,
    description: lowest.description,
    min: lowest.min,
    max: lowest.max,
  }
}
