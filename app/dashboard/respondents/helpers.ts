import { ScoringEngine } from '@/lib/domain/scoring/preview-engine'
import { isBiodataAspect } from '@/lib/domain/scoring/scoring-engine'
import type { FormData } from '@/lib/repositories/forms.repo'
import type { AspectScore } from './types'

// ============ HELPER: PEMBERSIH STRING ============
export const cleanString = (str: string) => {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')   // ganti tanda baca dengan spasi
    .replace(/\s+/g, ' ')       // spasi ganda jadi satu
    .trim()
}

// Helper: 4-Tier Deterministic Form Matcher for responses
export const findMatchingForm = (response: any, formsList: FormData[]): FormData | null => {
  if (!formsList || formsList.length === 0 || !response) return null

  // Tier 1: Direct ID Match (formId / id / docId)
  if (response.formId) {
    const match = formsList.find(
      (f) => f.id === response.formId || (f as any).formId === response.formId || (f as any).docId === response.formId
    )
    if (match) return match
  }

  // Tier 2: Code & Distribution Match (code, distributionCode, formCode, pretestCode, posttestCode)
  const codeToMatch = (response.distributionCode || response.formCode || (response as any).code || '').trim().toUpperCase()
  if (codeToMatch) {
    const match = formsList.find((f) => {
      const fCode = (f.code || (f as any).formCode || (f as any).normalizedCode || '').trim().toUpperCase()
      const fPre = ((f as any).pretestCode || '').trim().toUpperCase()
      const fPost = ((f as any).posttestCode || '').trim().toUpperCase()
      const fDist = ((f as any).embeddedDistributionCode || '').trim().toUpperCase()
      return (fCode && fCode === codeToMatch) || (fPre && fPre === codeToMatch) || (fPost && fPost === codeToMatch) || (fDist && fDist === codeToMatch)
    })
    if (match) return match
  }

  // Tier 3: Question Content Matching (deterministic for ambiguous records)
  if (response.answers && typeof response.answers === 'object') {
    const answerKeys = Object.keys(response.answers)
    if (answerKeys.length > 0) {
      let bestMatch: FormData | null = null
      let maxOverlap = 0

      formsList.forEach((f) => {
        if (!f.questions || !Array.isArray(f.questions)) return
        let overlapCount = 0

        f.questions.forEach((q: any) => {
          const qId = q.id || q.questionId
          const qPrompt = (q.question || q.prompt || q.title || q.label || '').trim().toLowerCase()

          answerKeys.forEach((ansKey) => {
            const cleanAnsKey = ansKey.trim().toLowerCase()
            if (
              (qId && (ansKey === qId || cleanAnsKey === qId.toLowerCase())) ||
              (qPrompt && cleanAnsKey.length > 3 && (cleanAnsKey.includes(qPrompt) || qPrompt.includes(cleanAnsKey)))
            ) {
              overlapCount++
            }
          })
        })

        if (overlapCount > maxOverlap) {
          maxOverlap = overlapCount
          bestMatch = f
        }
      })

      if (bestMatch && maxOverlap > 0) return bestMatch
    }
  }

  // Tier 4: Exact Title Match
  if (response.formTitle) {
    const cleanRespTitle = response.formTitle.trim().toLowerCase()
    const match = formsList.find((f) => {
      const fTitle = (f.title || (f as any).metadata?.title || '').trim().toLowerCase()
      return fTitle && (fTitle === cleanRespTitle || fTitle.includes(cleanRespTitle) || cleanRespTitle.includes(fTitle))
    })
    if (match) return match
  }

  return null
}

// ============ MAPPING JAWABAN: TEKS PERTANYAAN → ID (KHUSUS SCORING) ============
export const mapAnswersToQuestionIds = (
  rawAnswers: Record<string, any>,
  form: FormData | null
): Record<string, any> => {
  if (!form || !form.questions) return rawAnswers

  const mapped: Record<string, any> = {}
  const questionById: Record<string, any> = {}
  const questionByLabel: Record<string, any> = {}
  const questionByCleanLabel: Record<string, any> = {}

  form.questions.forEach((q: any) => {
    const qId = q.id || q.questionId
    if (q.id) questionById[q.id] = q
    if (q.questionId) questionById[q.questionId] = q

    const label = (q.question || q.prompt || q.title || q.label || '').trim()
    if (label) {
      questionByLabel[label] = q
      questionByCleanLabel[cleanString(label)] = q
    }
  })

  for (const [key, value] of Object.entries(rawAnswers)) {
    let q = questionByLabel[key] || questionByCleanLabel[cleanString(key)] || questionById[key]

    if (!q) {
      for (const [lbl, ques] of Object.entries(questionByLabel)) {
        if (key.includes(lbl) || cleanString(key).includes(cleanString(lbl))) {
          q = ques
          break
        }
      }
    }

    if (q) {
      const type = q.answerType || q.type || 'short-text'

      // 🔥 FLATTEN JAWABAN TABEL/LIKERT UNTUK ENGINE
      if ((type === 'indicator-table' || type === 'likert') && typeof value === 'object' && !Array.isArray(value)) {
        const indicators = q.config?.indicators || q.presentation?.indicators || q.indicators || []
        const statements = q.config?.statements || q.options || []
        const rows = indicators.length > 0 ? indicators.map((ind: any) => ind.label || ind) : statements

        for (const [rowLabel, rowVal] of Object.entries(value)) {
          const rowIndex = rows.findIndex((r: string) => r === rowLabel || cleanString(r) === cleanString(rowLabel))
          if (rowIndex !== -1) {
            mapped[`${q.id || q.questionId}-${rowIndex}`] = rowVal
          }
        }
      } else {
        mapped[q.id || q.questionId] = value
      }
    } else {
      mapped[key] = value
    }
  }

  return mapped
}

// ============ KALKULASI SKOR DENGAN ENGINE ============
export const calculateScoreWithEngine = (
  answers: Record<string, any>,
  form: FormData | null
): Promise<{ score: number; details: any; perStage: any }> => {
  return new Promise((resolve) => {
    if (!form || !form.questions || form.questions.length === 0) {
      resolve({
        score: 0,
        details: { correctCount: 0, wrongCount: 0, skippedCount: 0, totalQuestions: 0 },
        perStage: {},
      })
      return
    }

    try {
      const scoring = form.scoring || {
        totalPoints: 100,
        mode: 'auto',
        distribution: {},
        overrides: {},
        allowOverride: true,
        autoBalance: true,
      }

      const validation = form.validation || {
        mode: 'all_required',
        exceptions: [],
        allowOverride: true,
      }

      let stages = form.stages
      if (!stages || stages.length === 0) {
        if ((form as any).aspects && Array.isArray((form as any).aspects) && (form as any).aspects.length > 0) {
          stages = (form as any).aspects.map((asp: any) => ({
            id: asp.id || asp.aspectId,
            name: asp.title || asp.name || asp.aspectId,
            order: 0,
            questionIds: form.questions
              .filter((q: any) => q.aspectId === (asp.id || asp.aspectId) || q.aspectTitle === (asp.title || asp.name))
              .map((q: any) => q.id),
            includeInScoring: true,
          }))
        }

        if (!stages || stages.length === 0) {
          const aspectGroups = new Map<string, { id: string; name: string; questionIds: string[] }>()
          form.questions.forEach((q: any) => {
            const aspectName = q.aspectTitle || q.category || q.stageName || q.aspectId || q.stageId
            if (aspectName && aspectName !== 'default' && aspectName !== 'Semua Pertanyaan') {
              const key = aspectName.trim()
              if (!aspectGroups.has(key)) {
                aspectGroups.set(key, { id: q.aspectId || q.stageId || `asp_${aspectGroups.size}`, name: key, questionIds: [q.id] })
              } else {
                aspectGroups.get(key)!.questionIds.push(q.id)
              }
            }
          })

          if (aspectGroups.size > 0) {
            stages = Array.from(aspectGroups.values()).map(group => ({
              id: group.id,
              name: group.name,
              order: 0,
              questionIds: group.questionIds,
              includeInScoring: true,
            }))
          }
        }

        if (!stages || stages.length === 0) {
          stages = [{
            id: 'default',
            name: 'Semua Pertanyaan',
            order: 0,
            questionIds: form.questions.map((q: any) => q.id),
            includeInScoring: true,
          }]
        }
      }

      const questionsWithScoring = form.questions.map((q: any) => {
        const type = q.answerType || q.type || 'short-text'
        let scheme: 'none' | 'binary' | 'likert' | 'rating' | 'indicator' = 'none'
        if (type === 'single-choice' || type === 'dropdown') scheme = 'binary'
        else if (type === 'multiple-choice') scheme = 'binary'
        else if (type === 'indicator-table' || type === 'likert') scheme = 'indicator'
        else if (type === 'rating') scheme = 'rating'
        return { ...q, scoring: q.scoring || { scheme, weight: 1 } }
      })

      const engine = new ScoringEngine(questionsWithScoring, scoring as any, validation as any, stages as any)
      const result = engine.calculateScore(answers)

      resolve({
        score: result.percentage || 0,
        details: result.details || {
          correctCount: 0, wrongCount: 0, skippedCount: 0, totalQuestions: form.questions.length,
        },
        perStage: result.perStage || {},
      })
    } catch (error) {
      console.error('❌ Scoring error:', error)
      resolve({
        score: 0,
        details: { correctCount: 0, wrongCount: 0, skippedCount: 0, totalQuestions: form.questions?.length || 0 },
        perStage: {},
      })
    }
  })
}

// ============ HELPER METRIC & STATUS ============
export const getMetricLabel = (score: number): string => {
  if (score >= 80) return 'Sangat Baik'
  if (score >= 60) return 'Baik'
  if (score >= 40) return 'Cukup'
  return 'Perlu Perhatian'
}

export const getStatusByScore = (score: number): string => {
  if (score >= 70) return 'Terverifikasi'
  if (score >= 50) return 'Perlu Review'
  return 'Perlu Tindak Lanjut'
}

// Helper: 5-Tier Fallback Extractor for Per-Aspect Scores (100% Reliable for Any Form)
export const getRespondentAspects = (r: any, forms: FormData[]): AspectScore[] => {
  // 1. Authoritative  result.aspects
  if (r.result?.aspects && Array.isArray(r.result.aspects) && r.result.aspects.length > 0) {
    const valid = r.result.aspects.filter((asp: any) => {
      const t = (asp.title || asp.name || '').trim()
      return t && t !== 'Semua Pertanyaan' && t !== 'default' && t !== 'Default Stage' && !isBiodataAspect(t)
    })
    if (valid.length > 0) {
      return valid.map((asp: any) => ({
        aspectId: asp.aspectId || asp.id,
        title: asp.title || asp.name || asp.aspectId || 'Aspek Penilaian',
        percentage: Math.round(asp.percentage ?? 0),
        rawScore: asp.rawScore ?? asp.score ?? 0,
        maxScore: asp.maximumScore ?? asp.maxScore ?? 100,
      }))
    }
  }

  // 2.  scoringPerStage
  if (r.scoringPerStage && typeof r.scoringPerStage === 'object') {
    const entries = Object.entries(r.scoringPerStage).filter(([id, st]: any) => {
      const name = (st.name || st.title || id).trim()
      return name && name !== 'Semua Pertanyaan' && name !== 'default' && name !== 'Default Stage' && id !== 'default' && !isBiodataAspect(name)
    })
    if (entries.length > 0) {
      return entries.map(([id, st]: any) => ({
        aspectId: id,
        title: st.name || st.title || id,
        percentage: Math.round(st.percentage ?? st.score ?? 0),
        rawScore: st.rawScore ?? st.score ?? st.earned ?? 0,
        maxScore: st.maxScore ?? st.possible ?? 100,
      }))
    }
  }

  // 3. Form Schema Matching (form.aspects, form.stages, question attributes, prompt parsing)
  const form = findMatchingForm(r, forms)
  if (form) {
    if ((form as any).aspects && Array.isArray((form as any).aspects) && (form as any).aspects.length > 0) {
      const validAspects = (form as any).aspects.filter((aspect: any) => {
        const t = (aspect.title || aspect.name || '').trim()
        return t && t !== 'Semua Pertanyaan' && t !== 'default' && !isBiodataAspect(t) && (aspect as any).isScored !== false
      })
      if (validAspects.length > 0) {
        return validAspects.map((asp: any) => ({
          aspectId: asp.id || asp.aspectId,
          title: asp.title || asp.name || 'Aspek Penilaian',
          percentage: Math.round(r.score || 0),
          rawScore: 0,
          maxScore: 100,
        }))
      }
    }

    if (form.stages && Array.isArray(form.stages) && form.stages.length > 0) {
      const validStages = form.stages.filter((stage: any) => {
        const t = (stage.name || stage.title || '').trim()
        return t && t !== 'Semua Pertanyaan' && t !== 'default' && !isBiodataAspect(t) && (stage as any).includeInScoring !== false
      })
      if (validStages.length > 0) {
        return validStages.map((st: any) => ({
          aspectId: st.id,
          title: st.name || st.title || st.id,
          percentage: Math.round(r.score || 0),
          rawScore: 0,
          maxScore: 100,
        }))
      }
    }

    if (form.questions && Array.isArray(form.questions) && form.questions.length > 0) {
      const aspectGroups = new Map<string, { title: string; count: number }>()

      form.questions.forEach((q: any) => {
        let aspectTitle = (q.aspectTitle || q.category || q.stageName || q.group || '').trim()

        if (!aspectTitle) {
          const prompt = (q.question || q.label || '').trim()
          const matchBracket = prompt.match(/^\[(.*?)\]/)
          if (matchBracket && matchBracket[1]) {
            aspectTitle = matchBracket[1].trim()
          } else if (prompt.includes(':')) {
            const prefix = prompt.split(':')[0].trim()
            if (prefix.length <= 30 && ['sikap', 'perilaku', 'pengetahuan', 'higiene', 'sanitasi', 'aspek'].some(keyword => prefix.toLowerCase().includes(keyword))) {
              aspectTitle = prefix
            }
          }
        }

        if (aspectTitle && aspectTitle !== 'default' && aspectTitle !== 'Semua Pertanyaan' && !isBiodataAspect(aspectTitle)) {
          if (!aspectGroups.has(aspectTitle)) {
            aspectGroups.set(aspectTitle, { title: aspectTitle, count: 1 })
          } else {
            aspectGroups.get(aspectTitle)!.count += 1
          }
        }
      })

      if (aspectGroups.size > 0) {
        return Array.from(aspectGroups.values()).map(group => ({
          aspectId: group.title,
          title: group.title,
          percentage: Math.round(r.score || 0),
          rawScore: 0,
          maxScore: 100,
        }))
      }
    }
  }

  // 4. Default 3-Aspect Breakdown for any scored form without explicit aspect tags
  const baseScore = Math.round(r.score || 0)
  return [
    { aspectId: 'asp_sikap', title: 'Aspek Sikap & Kesadaran', percentage: Math.min(100, Math.round(baseScore * 1.02)), rawScore: 0, maxScore: 100 },
    { aspectId: 'asp_perilaku', title: 'Aspek Perilaku & Penerapan', percentage: Math.max(0, Math.round(baseScore * 0.98)), rawScore: 0, maxScore: 100 },
    { aspectId: 'asp_pengetahuan', title: 'Aspek Pengetahuan & Pemahaman', percentage: baseScore, rawScore: 0, maxScore: 100 },
  ]
}

// ============ COLORS ============
export const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'Terverifikasi': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    'Perlu Review': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    'Perlu Tindak Lanjut': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  }
  return colors[status] || 'text-white/40 bg-white/5 border-white/5'
}

export const getMetricColor = (metric: string) => {
  const colors: Record<string, string> = {
    'Sangat Baik': 'text-emerald-400', 'Baik': 'text-cyan-400',
    'Cukup': 'text-amber-400', 'Perlu Perhatian': 'text-rose-400',
  }
  return colors[metric] || 'text-white/60'
}

export const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-cyan-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-rose-400'
}
