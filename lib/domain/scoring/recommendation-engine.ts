import type { RecommendationConfig } from '@/lib/forms/v1_5/builderState'

/**
 * Pure recommendation resolver.
 * Maps resolved grade to recommended article IDs configured in recommendationConfig.
 */
export function resolveRecommendationArticleIds(
  grade: string,
  config?: RecommendationConfig
): string[] {
  if (!config || config.mode === 'disabled') {
    return []
  }

  const gradeMap = config.gradeArticleMap || {}
  const mappedIds = gradeMap[grade] || []

  if (mappedIds.length > 0) {
    return mappedIds
  }

  // Fallback to manual global article IDs if set
  if (config.manualArticleIds && config.manualArticleIds.length > 0) {
    return config.manualArticleIds
  }

  return []
}
