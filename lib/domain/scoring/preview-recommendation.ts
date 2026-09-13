/**
 * Generate rekomendasi berdasarkan hasil
 */
export function generateRecommendations(
  perStage: Record<string, any>,
  totalPercentage: number
): string[] {
  const recommendations: string[] = []

  if (totalPercentage < 40) {
    recommendations.push('🔴 Perlu perbaikan signifikan pada pemahaman materi.')
  } else if (totalPercentage < 60) {
    recommendations.push('🟡 Masih perlu peningkatan pemahaman.')
  } else if (totalPercentage < 80) {
    recommendations.push('🟢 Pemahaman sudah cukup baik.')
  } else {
    recommendations.push('🌟 Pemahaman sangat baik, pertahankan!')
  }

  const sortedStages = Object.entries(perStage)
    .filter(([_, data]) => data.possible > 0)
    .sort((a, b) => a[1].percentage - b[1].percentage)

  if (sortedStages.length > 0) {
    const lowest = sortedStages[0]
    if (lowest[1].percentage < 60) {
      recommendations.push(`📚 Fokus perbaiki pada: "${lowest[1].name}" (${lowest[1].percentage}%)`)
    }
  }

  return recommendations
}

/**
 * Dapatkan grade berdasarkan persentase
 */
export function getGrade(percentage: number): string {
  if (percentage >= 90) return 'A (Sangat Baik)'
  if (percentage >= 80) return 'B (Baik)'
  if (percentage >= 70) return 'C (Cukup)'
  if (percentage >= 60) return 'D (Kurang)'
  return 'E (Sangat Kurang)'
}
