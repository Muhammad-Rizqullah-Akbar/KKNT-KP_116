import type {
  FormAspect,
  BuilderQuestion,
  GradeThreshold,
  RecommendationConfig,
  FormDistributionConfig,
} from '@/lib/domain/forms/builder-state'
import type { FormMetadata, ScoringConfig, ValidationConfig } from '@/lib/domain/forms/types'

export interface FormAggregateDoc {
  formId: string
  metadata: FormMetadata
  activeVersionId: string
  activeVersionNumber: number
  status: 'draft' | 'published' | 'archived'
  allowCadreDistribution?: boolean
  aspects: FormAspect[]
  questions: BuilderQuestion[]
  scoring: ScoringConfig
  validation: ValidationConfig
  thresholds: GradeThreshold[]
  recommendations: RecommendationConfig
  distribution?: FormDistributionConfig
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  publishedAt?: string
  publishedBy?: string
}

export interface FormVersionSnapshotDoc {
  versionId: string
  formId: string
  versionNumber: number
  status: 'draft' | 'published' | 'archived'
  metadata: FormMetadata
  aspects: FormAspect[]
  questions: BuilderQuestion[]
  scoring: ScoringConfig
  validation: ValidationConfig
  thresholds: GradeThreshold[]
  recommendations: RecommendationConfig
  distribution?: FormDistributionConfig
  createdAt: string
  createdBy: string
  publishedAt?: string
  publishedBy?: string
}

export function normalizeFormAggregate(docId: string, data: any): FormAggregateDoc {
  if (!data) {
    return {
      formId: docId,
      metadata: { title: 'Formulir Tanpa Judul', category: 'Umum', kind: 'official', status: 'draft' },
      activeVersionId: `v1-${docId}`,
      activeVersionNumber: 1,
      status: 'draft',
      aspects: [],
      questions: [],
      scoring: { totalPoints: 100, mode: 'auto', stagePointDistribution: {}, allowOverride: true, autoBalance: true },
      validation: { mode: 'all_required', exceptionQuestionIds: [], allowOverride: true },
      thresholds: [],
      recommendations: { mode: 'automatic', gradeArticleMap: {} },
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    }
  }

  // Extract & normalize questions array from any V1 /  form document structure
  const rawQuestions = Array.isArray(data.questions) ? data.questions : []
  const questions = rawQuestions.map((q: any, idx: number) => {
    const qId = q.questionId || q.id || `q_${idx}_${Math.random().toString(36).substring(2, 6)}`
    const prompt = q.prompt || q.title || q.question || q.label || `Pertanyaan ${idx + 1}`
    const rawType = q.type || q.answerType || 'short-text'
    const aspectId = q.aspectId || q.stageId || q.stage_id || q.aspect || q.category || 'default'
    const rawOpts = Array.isArray(q.options) ? q.options : q.config?.options || []

    const options = rawOpts.map((optItem: any, oIdx: number) => {
      if (typeof optItem === 'string') {
        return { optionId: `opt_${qId}_${oIdx}`, label: optItem, score: 1 }
      }
      if (optItem && typeof optItem === 'object') {
        const lbl = optItem.label || optItem.text || optItem.title || String(optItem)
        return {
          optionId: optItem.optionId || optItem.id || `opt_${qId}_${oIdx}`,
          label: lbl,
          score: typeof optItem.score === 'number' ? optItem.score : 1,
        }
      }
      return { optionId: `opt_${qId}_${oIdx}`, label: String(optItem), score: 1 }
    })

    const rawCorrectAnswer =
      q.answerKey?.correctOptionIds ||
      q.answerKey?.optionId ||
      q.config?.correctAnswer ||
      q.config?.correct_answer ||
      q.correctAnswer ||
      q.correct_answer ||
      q.answer ||
      q.scoring?.correctAnswer

    let parsedAnswerKey = q.answerKey
    if (!parsedAnswerKey || !Array.isArray(parsedAnswerKey.correctOptionIds) || parsedAnswerKey.correctOptionIds.length === 0) {
      if (rawCorrectAnswer !== undefined && rawCorrectAnswer !== null && rawCorrectAnswer !== '') {
        const items = Array.isArray(rawCorrectAnswer) ? rawCorrectAnswer : [rawCorrectAnswer]
        const correctOptionIds: string[] = []
        items.forEach((it: any) => {
          if (it === undefined || it === null || it === '') return
          const strIt = String(it).trim()
          const cleanIt = strIt.toLowerCase().replace(/[^a-z0-9]/g, '')
          let matched = options.find((o: any) => o.optionId === strIt || o.label === strIt)
          if (!matched && cleanIt) {
            matched = options.find((o: any) => {
              const cL = o.label ? o.label.toLowerCase().replace(/[^a-z0-9]/g, '') : ''
              const cId = o.optionId ? o.optionId.toLowerCase().replace(/[^a-z0-9]/g, '') : ''
              return cL === cleanIt || cId === cleanIt
            })
          }
          if (!matched) {
            const numIdx = Number(it)
            if (!isNaN(numIdx)) {
              if (numIdx >= 0 && numIdx < options.length) matched = options[numIdx]
              else if (numIdx >= 1 && numIdx <= options.length) matched = options[numIdx - 1]
            }
          }
          if (matched) {
            if (!correctOptionIds.includes(matched.optionId)) correctOptionIds.push(matched.optionId)
          } else {
            if (!correctOptionIds.includes(strIt)) correctOptionIds.push(strIt)
          }
        })
        if (correctOptionIds.length > 0) {
          parsedAnswerKey = { kind: 'option', correctOptionIds }
        }
      }
    }
    if (!parsedAnswerKey) parsedAnswerKey = { kind: 'none' }

    const mediaUrl = q.presentation?.media?.url || q.media?.url || q.imageUrl || q.image || q.photoURL || q.config?.imageUrl || q.config?.mediaUrl || null
    const mediaCaption = q.presentation?.media?.caption || q.media?.caption || q.imageCaption || q.caption || ''

    let scheme = q.scoring?.scheme
    if (!scheme || scheme === 'none') {
      if (parsedAnswerKey.kind === 'option' && ['single-choice', 'dropdown', 'binary', 'multiple-choice'].includes(rawType)) {
        scheme = 'binary'
      }
    }

    return {
      ...q,
      id: qId,
      questionId: qId,
      aspectId,
      type: rawType,
      prompt,
      title: prompt,
      required: q.required !== false,
      options,
      answerKey: parsedAnswerKey,
      config: q.config || {},
      scoring: {
        scheme: scheme || 'none',
        weight: typeof q.scoring?.weight === 'number' ? q.scoring.weight : 1,
        ...q.scoring,
      },
      presentation: {
        description: q.presentation?.description || q.description || q.config?.description || '',
        placeholder: q.presentation?.placeholder || q.placeholder || q.config?.placeholder || undefined,
        media: mediaUrl ? { type: 'image', url: mediaUrl, caption: mediaCaption } : (q.presentation?.media || { type: 'none' }),
        ratingMin: q.presentation?.ratingMin || q.ratingMin || q.config?.ratingMin || 1,
        ratingMax: q.presentation?.ratingMax || q.ratingMax || q.config?.ratingMax || 5,
        indicators: q.presentation?.indicators || q.indicators || q.config?.indicators || undefined,
        indicatorScales: q.presentation?.indicatorScales || q.indicatorScales || q.config?.indicatorScales || undefined,
      },
    }
  })

  // Extract & normalize aspects array (supporting V1 data.stages and  data.aspects)
  let aspects: any[] = []
  if (Array.isArray(data.aspects) && data.aspects.length > 0) {
    aspects = data.aspects.map((asp: any, idx: number) => ({
      aspectId: asp.aspectId || asp.id || `asp_${idx}`,
      title: asp.title || asp.name || asp.label || `Aspek ${idx + 1}`,
      description: asp.description || '',
      questionIds: asp.questionIds || [],
    }))
  } else if (Array.isArray(data.stages) && data.stages.length > 0) {
    // Stored stages mapping to aspects
    aspects = data.stages.map((stg: any, idx: number) => ({
      aspectId: stg.id || stg.stageId || `stg_${idx}`,
      title: stg.name || stg.title || `Aspek ${idx + 1}`,
      description: stg.description || '',
      questionIds: stg.questionIds || [],
    }))
  }

  if (aspects.length === 0 && questions.length > 0) {
    const aspectMap = new Map<string, string>()
    questions.forEach((q: any) => {
      const aspId = q.aspectId || q.stageId || q.stage_id || 'default'
      const aspName = q.aspectTitle || q.aspect || q.category || (aspId === 'default' ? 'Evaluasi Kebersihan & Keamanan Pangan' : `Aspek ${aspId}`)
      if (!aspectMap.has(aspId)) {
        aspectMap.set(aspId, aspName)
      }
    })

    aspects = Array.from(aspectMap.entries()).map(([aspectId, title]) => ({
      aspectId,
      title,
      description: `Aspek Penilaian: ${title}`,
      questionIds: questions.filter((q: any) => (q.aspectId || q.stageId || 'default') === aspectId).map((q: any) => q.questionId),
    }))
  }

  let rawTitle = data.metadata?.title || data.title || 'Formulir ' + docId
  if (rawTitle.startsWith('[Salinan') || rawTitle.startsWith('Salinan')) {
    rawTitle = rawTitle.replace(/^\[Salinan[^\]]*\]\s*/i, '').replace(/^Salinan\s*(?:V1\.5)?\s*[-–:]\s*/i, '').trim()
  }
  const title = rawTitle
  const description = data.metadata?.description || data.description || ''
  const category = data.metadata?.category || data.category || 'Umum'
  const target = data.metadata?.target || data.target || 'Umum'
  const status = (data.status === 'published' || data.metadata?.status === 'published' || data.status === 'archived') ? data.status : 'draft'
  const allowCadreDistribution = Boolean(data.allowCadreDistribution === true || data.metadata?.allowCadreDistribution === true)

  return {
    ...data,
    formId: data.formId || data.id || docId,
    metadata: {
      title,
      description,
      category,
      kind: data.metadata?.kind || 'official',
      status,
      target,
      allowCadreDistribution,
    },
    activeVersionId: data.activeVersionId || `v1-${docId}`,
    activeVersionNumber: data.activeVersionNumber || 1,
    status,
    allowCadreDistribution,
    aspects,
    questions,
    scoring: data.scoring || { totalPoints: 100, mode: 'auto', stagePointDistribution: {}, allowOverride: true, autoBalance: true },
    validation: data.validation || { mode: 'all_required', exceptionQuestionIds: [], allowOverride: true },
    thresholds: Array.isArray(data.thresholds) ? data.thresholds : [],
    recommendations: data.recommendations || { gradeArticleMap: {} },
    createdAt: data.createdAt || new Date().toISOString(),
    createdBy: data.createdBy || 'system',
    updatedAt: data.updatedAt || new Date().toISOString(),
    updatedBy: data.updatedBy || 'system',
  }
}
