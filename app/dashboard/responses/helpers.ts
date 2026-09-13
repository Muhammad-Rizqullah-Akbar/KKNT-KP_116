export type AspectScore = {
  aspectId: string
  title: string
  percentage: number
  rawScore: number
  maxScore: number
}

export function getRespondentAspects(r: any): AspectScore[] {
  if (!r) return []

  const isBiodataAspect = (title: string, asp: any) => {
    const t = String(title || '').toLowerCase()
    if (t.includes('biodata') || t.includes('data diri') || t.includes('profil') || t.includes('demografi') || t.includes('informasi umum')) return true
    if (asp?.isScored === false || asp?.isScoring === false) return true
    if (typeof asp?.maximumScore === 'number' && asp.maximumScore === 0) return true
    if (typeof asp?.maxScore === 'number' && asp.maxScore === 0) return true
    return false
  }

  let aspects: AspectScore[] = []

  if (r.result?.aspects && Array.isArray(r.result.aspects) && r.result.aspects.length > 0) {
    aspects = r.result.aspects.map((asp: any) => ({
      aspectId: asp.aspectId || asp.id || 'asp',
      title: asp.title || asp.name || asp.aspectId || 'Aspek Utama',
      percentage: Math.min(100, Math.max(0, Math.round(asp.percentage ?? (asp.score && asp.maxScore ? (asp.score / asp.maxScore) * 100 : 0)))),
      rawScore: asp.rawScore ?? asp.score ?? 0,
      maxScore: asp.maximumScore ?? asp.maxScore ?? 100,
    })).filter((asp: any) => !isBiodataAspect(asp.title, asp))
  } else if (r.result?.aspectScores && typeof r.result.aspectScores === 'object') {
    aspects = Object.entries(r.result.aspectScores).map(([key, val]: [string, any]) => ({
      aspectId: key,
      title: typeof val === 'object' ? val.title || key : key,
      percentage: Math.min(100, Math.max(0, Math.round(typeof val === 'number' ? val : val?.percentage || 0))),
      rawScore: typeof val === 'object' ? val.score || 0 : val || 0,
      maxScore: typeof val === 'object' ? val.maxScore || 100 : 100,
    })).filter((asp: any) => !isBiodataAspect(asp.title, asp))
  } else if (r.aspectScores && typeof r.aspectScores === 'object') {
    aspects = Object.entries(r.aspectScores).map(([key, val]: [string, any]) => ({
      aspectId: key,
      title: typeof val === 'object' ? val.title || key : key,
      percentage: Math.min(100, Math.max(0, Math.round(typeof val === 'number' ? val : val?.percentage || 0))),
      rawScore: typeof val === 'object' ? val.score || 0 : val || 0,
      maxScore: typeof val === 'object' ? val.maxScore || 100 : 100,
    })).filter((asp: any) => !isBiodataAspect(asp.title, asp))
  }

  return aspects
}

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

// FORMAT ANSWER VALUE HELPER (MATCHING DATA RESPONDEN)
export const formatAnswerValue = (value: any): { type: 'text' | 'signature' | 'table' | 'array'; content: any } => {
  if (value === null || value === undefined) return { type: 'text', content: '-' }
  if (typeof value === 'string' && value.startsWith('data:image'))
    return { type: 'signature', content: value }
  if (Array.isArray(value)) return { type: 'array', content: value }
  if (typeof value === 'object') return { type: 'table', content: value }
  return { type: 'text', content: String(value) }
}
