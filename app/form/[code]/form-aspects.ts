// Pure helper: derive a normalized aspects array from a form version's
// raw aspects / stages, or dynamically from questions when neither is present.

export interface ResolvedAspect {
  aspectId: string
  title: string
  description?: string
}

export function resolveFormAspects(rawAspects: any[], rawQuestions: any[], rawStages?: any[]): ResolvedAspect[] {
  if (Array.isArray(rawAspects) && rawAspects.length > 0) {
    return rawAspects.map((asp: any, idx: number) => {
      const rawTitle = asp.title || asp.name || asp.label || `Aspek ${idx + 1}`
      const isRandom = typeof rawTitle === 'string' && (rawTitle.startsWith('asp_') || rawTitle.startsWith('stg_'))
      return {
        ...asp,
        aspectId: asp.aspectId || asp.id || `asp_${idx + 1}`,
        title: isRandom ? `Aspek Penilaian ${idx + 1}` : rawTitle,
      }
    })
  }
  if (Array.isArray(rawStages) && rawStages.length > 0) {
    return rawStages.map((stg: any, idx: number) => {
      const rawTitle = stg.name || stg.title || stg.label || `Aspek ${idx + 1}`
      const isRandom = typeof rawTitle === 'string' && (rawTitle.startsWith('stg_') || rawTitle.startsWith('asp_'))
      return {
        aspectId: stg.id || stg.stageId || `stg_${idx + 1}`,
        title: isRandom ? `Aspek Penilaian ${idx + 1}` : rawTitle,
        description: stg.description || '',
      }
    })
  }

  const aspectMap = new Map<string, string>()
  rawQuestions.forEach((q: any) => {
    const aId = q.aspectId || q.stageId || q.stage_id || q.aspect || q.category || 'default'
    let aTitle = q.aspectTitle || q.stageName || (typeof q.aspect === 'string' && !q.aspect.startsWith('asp_') ? q.aspect : null) || (typeof q.category === 'string' && q.category !== 'default' ? q.category : null)
    if (!aTitle || aTitle.startsWith('asp_') || aTitle.startsWith('stg_')) {
      aTitle = aId === 'default' ? 'Evaluasi Kebersihan & Keamanan Pangan' : `Aspek Penilaian ${aspectMap.size + 1}`
    }
    if (!aspectMap.has(aId)) {
      aspectMap.set(aId, aTitle)
    }
  })
  return Array.from(aspectMap.entries()).map(([aspectId, title], idx) => ({
    aspectId,
    title: (title.startsWith('asp_') || title.startsWith('stg_')) ? `Aspek Penilaian ${idx + 1}` : title,
    description: '',
  }))
}
