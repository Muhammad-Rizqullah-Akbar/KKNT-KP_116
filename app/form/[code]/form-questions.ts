import { isBiodataAspect } from '@/lib/domain/scoring/scoring-engine'

export interface UnansweredItem {
  index: number
  questionId: string
  prompt: string
}

// Check unanswered mandatory questions
export function checkUnansweredQuestions(
  questions: any[],
  answers: Record<string, any>
): UnansweredItem[] {
  const unanswered: UnansweredItem[] = []

  questions.forEach((q: any, idx: number) => {
    if (q.required === false) return

    const val = answers[q.questionId]
    let isAnswered = false

    if (val !== undefined && val !== null && val !== '') {
      const type = q.type || q.answerType
      if (type === 'indicator-table' || type === 'likert') {
        const indicators = q.presentation?.indicators || q.indicators || q.config?.indicators || []
        if (indicators.length === 0) {
          isAnswered = true
        } else {
          isAnswered = typeof val === 'object' && indicators.every((ind: any) => {
            const indId = ind.indicatorId || ind.id || ind
            return val[indId] !== undefined && val[indId] !== null && val[indId] !== ''
          })
        }
      } else if (type === 'multiple-choice') {
        isAnswered = Array.isArray(val) && val.length > 0
      } else if (typeof val === 'object') {
        isAnswered = Object.keys(val).length > 0
      } else {
        isAnswered = true
      }
    }

    if (!isAnswered) {
      unanswered.push({
        index: idx,
        questionId: q.questionId,
        prompt: q.prompt,
      })
    }
  })

  return unanswered
}

export interface BiodataEntry {
  label: string
  value: string
}

// Extract biodata entries for receipt summary
export function extractBiodata(
  questionsList: any[],
  aspectsList: any[],
  answers: Record<string, any>
): BiodataEntry[] {
  const extractedBiodata: BiodataEntry[] = []

  questionsList.forEach((q: any) => {
    const prompt = q.prompt || q.title || q.label || ''
    const promptLower = prompt.toLowerCase()
    const aspectObj = aspectsList.find((a: any) => a.aspectId === q.aspectId || a.id === q.aspectId)
    const aspectTitle = aspectObj?.title || aspectObj?.name || q.aspectTitle || q.category || ''
    const isNonScoredAspect = (aspectObj && aspectObj.isScored === false) || isBiodataAspect(aspectTitle)
    const isBiodataQuestion =
      isNonScoredAspect ||
      q.category === 'biodata' ||
      q.isBiodata === true ||
      !!q.biodataKey ||
      (typeof q.type === 'string' && q.type.startsWith('biodata-')) ||
      promptLower.includes('nama') ||
      promptLower.includes('email') ||
      promptLower.includes('telepon') ||
      promptLower.includes('no. hp') ||
      promptLower.includes('hp') ||
      promptLower.includes('instansi') ||
      promptLower.includes('organisasi') ||
      promptLower.includes('lokasi') ||
      promptLower.includes('alamat') ||
      promptLower.includes('sumber informasi') ||
      promptLower.includes('darimana')

    if (isBiodataQuestion) {
      const val = answers[q.questionId]
      if (val !== undefined && val !== null && val !== '') {
        let displayVal = String(val)
        if (Array.isArray(val) && q.options) {
          const selectedLabels = val.map((v: any) => {
            const opt = q.options.find((o: any) => o.id === v || o.optionId === v || o.val === v || o.value === v)
            return opt ? (opt.label || opt.text || opt.prompt || v) : v
          })
          displayVal = selectedLabels.join(', ')
        } else if (typeof val === 'string' && q.options) {
          const opt = q.options.find((o: any) => o.id === val || o.optionId === val || o.val === val || o.value === val)
          if (opt) displayVal = opt.label || opt.text || opt.prompt || val
        }
        extractedBiodata.push({
          label: prompt,
          value: displayVal,
        })
      }
    }
  })

  return extractedBiodata
}
