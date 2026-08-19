import type { AnswerKey, CanonicalForm, FormStatus, LegacyScoringAdapterInput, PublicCanonicalForm, PublicQuestion, Question, QuestionOption, QuestionType } from './types'
import { QUESTION_TYPES } from './types'

type LegacyQuestion = { id?: string; type?: string; answerType?: string; question?: string; label?: string; description?: string; required?: boolean; options?: string[]; media?: { type?: string; url?: string; caption?: string }; config?: Record<string, unknown>; scoring?: { scheme?: string; weight?: number } }
type LegacyForm = { id?: string; title?: string; code?: string; description?: string; target?: string; category?: string; status?: string; questions?: LegacyQuestion[]; scoring?: Record<string, unknown>; validation?: Record<string, unknown>; createdAt?: string; updatedAt?: string; createdBy?: string }
export type LegacyAdaptationResult = { canonical: CanonicalForm; warnings: string[] }

const isQuestionType = (value: string): value is QuestionType => QUESTION_TYPES.includes(value as QuestionType)
const normalizeStatus = (value: unknown): FormStatus => value === 'published' || value === 'archived' ? value : 'draft'
function fallbackId(formId: string, source: LegacyQuestion): string { const text = `${formId}|${source.answerType || source.type || ''}|${source.question || source.label || ''}`; let hash = 0; for (let index = 0; index < text.length; index += 1) hash = (hash * 31 + text.charCodeAt(index)) >>> 0; return `legacy-${formId}-${hash.toString(36)}` }
function optionId(questionId: string, label: string, position: number): string { let hash = 0; for (let index = 0; index < label.length; index += 1) hash = (hash * 31 + label.charCodeAt(index)) >>> 0; return `${questionId}-option-${position + 1}-${hash.toString(36)}` }
function answerKey(raw: unknown, options: QuestionOption[]): AnswerKey {
  if (raw === undefined || raw === null || raw === '') return { kind: 'none' }
  const labels = Array.isArray(raw) ? raw : [raw]
  const correctOptionIds: string[] = []
  labels.forEach((label) => {
    if (typeof label === 'string') {
      const matched = options.find((option) => option.label === label || option.optionId === label)
      if (matched) {
        correctOptionIds.push(matched.optionId)
      } else {
        correctOptionIds.push(label)
      }
    }
  })
  return correctOptionIds.length ? { kind: 'option', correctOptionIds } : { kind: 'none' }
}

function adaptQuestion(formId: string, source: LegacyQuestion, warnings: string[]): Question {
  const rawType = source.answerType || source.type || ''
  const type: QuestionType = (rawType === 'indicator' || rawType === 'table') ? 'indicator-table' : (isQuestionType(rawType) ? rawType : 'short-text')
  const questionId = source.id || fallbackId(formId, source)
  if (!source.id) warnings.push(`Question "${source.question || source.label || questionId}" has no legacy id; a read-only fallback identity was generated.`)

  const config = source.config || {}
  const rawOptions = Array.isArray(config.options) ? config.options : source.options || []
  const options = rawOptions.map((optItem, index) => {
    if (typeof optItem === 'string') {
      return { optionId: optionId(questionId, optItem, index), label: optItem, score: 1 }
    }
    if (optItem && typeof optItem === 'object') {
      const lbl = (optItem as any).label || (optItem as any).text || (optItem as any).title || String(optItem)
      return {
        optionId: (optItem as any).optionId || (optItem as any).id || optionId(questionId, lbl, index),
        label: lbl,
        score: typeof (optItem as any).score === 'number' ? (optItem as any).score : 1,
      }
    }
    return { optionId: optionId(questionId, String(optItem), index), label: String(optItem), score: 1 }
  })

  // Extract raw indicators for indicator-table / likert
  const rawIndicators = config.indicators || config.statements || source.options || []
  const indicators = Array.isArray(rawIndicators)
    ? rawIndicators.map((ind: any, index: number) => {
        if (typeof ind === 'string') return { indicatorId: `${questionId}_ind_${index}`, label: ind, weight: 1, reverse: false }
        if (ind && typeof ind === 'object') {
          return {
            indicatorId: ind.id || ind.indicatorId || `${questionId}_ind_${index}`,
            label: ind.label || ind.title || ind.text || String(ind),
            weight: typeof ind.weight === 'number' ? ind.weight : 1,
            reverse: ind.reverse === true,
          }
        }
        return { indicatorId: `${questionId}_ind_${index}`, label: String(ind), weight: 1, reverse: false }
      })
    : []

  // Extract raw indicatorScales
  const defaultScales = [
    { value: 1, label: 'STS' },
    { value: 2, label: 'TS' },
    { value: 3, label: 'N' },
    { value: 4, label: 'S' },
    { value: 5, label: 'SS' },
  ]
  const rawScales = config.indicatorScales || config.scales || defaultScales
  const indicatorScales = Array.isArray(rawScales) && rawScales.length > 0
    ? rawScales.map((sc: any, idx: number) => {
        if (typeof sc === 'number' || typeof sc === 'string') return { value: Number(sc) || (idx + 1), label: String(sc) }
        if (sc && typeof sc === 'object') return { value: Number(sc.value) || (idx + 1), label: String(sc.label || sc.value || idx + 1) }
        return { value: idx + 1, label: String(idx + 1) }
      })
    : defaultScales

  // Dynamic scheme inference learned from legacy version
  let defaultScheme: Question['scoring']['scheme'] = 'none'
  if (['single-choice', 'dropdown', 'binary', 'multiple-choice'].includes(type)) {
    defaultScheme = 'binary'
  } else if (['indicator-table', 'likert'].includes(type)) {
    defaultScheme = 'indicator'
  } else if (type === 'rating') {
    defaultScheme = 'rating'
  }

  const explicitScheme = typeof source.scoring?.scheme === 'string' && ['none', 'binary', 'likert', 'indicator', 'rating'].includes(source.scoring.scheme)
    ? (source.scoring.scheme as Question['scoring']['scheme'])
    : undefined

  const finalScheme = explicitScheme !== undefined ? explicitScheme : defaultScheme
  const weight = typeof source.scoring?.weight === 'number' ? source.scoring.weight : 1

  return {
    questionId,
    type,
    prompt: source.question || source.label || '',
    required: source.required === true,
    options,
    presentation: {
      description: source.description || '',
      media: { type: source.media?.type === 'image' ? 'image' : 'none', url: source.media?.url, caption: source.media?.caption },
      placeholder: typeof config.placeholder === 'string' ? config.placeholder : undefined,
      ratingMin: typeof config.ratingMin === 'number' ? config.ratingMin : undefined,
      ratingMax: typeof config.ratingMax === 'number' ? config.ratingMax : undefined,
      indicators,
      indicatorScales,
      showWeightedScore: config.showWeightedScore === true,
    },
    scoring: {
      scheme: finalScheme,
      weight,
    },
    answerKey: answerKey(config.correctAnswer || (source as any).correctAnswer, options),
  }
}
/** Read-only conversion. It never writes, migrates, or mutates a legacy document. */
export function adaptLegacyForm(legacy: LegacyForm): LegacyAdaptationResult {
  const formId = legacy.id || legacy.code || 'legacy-form'
  const warnings: string[] = []
  const rawScoring = legacy.scoring || {}
  const rawValidation = legacy.validation || {}
  const versionId = `legacy-${formId}-v1`

  const rawStages: any[] = (legacy as any).stages || (legacy as any).aspects || []
  const rawDistribution: Record<string, number> =
    typeof rawScoring.distribution === 'object' && rawScoring.distribution
      ? (rawScoring.distribution as Record<string, number>)
      : (rawScoring.stagePointDistribution as Record<string, number>) || {}

  let adaptedAspects: any[] = []
  let adaptedDistribution: Record<string, number> = {}

  if (Array.isArray(rawStages) && rawStages.length > 0) {
    const autoWeight = Math.floor(100 / rawStages.length)
    adaptedAspects = rawStages.map((stg: any, idx: number) => {
      const stgId = stg.id || stg.aspectId || `stage_${idx}`
      const stgTitle = stg.name || stg.title || stg.label || `Aspek ${idx + 1}`
      const isScored = stg.includeInScoring !== false && stg.isScored !== false
      const weight = Number(rawDistribution[stgId]) || (idx === rawStages.length - 1 ? 100 - autoWeight * (rawStages.length - 1) : autoWeight)
      adaptedDistribution[stgId] = weight

      return {
        aspectId: stgId,
        title: stgTitle,
        weightPercentage: weight,
        isScored,
      }
    })
  } else {
    adaptedAspects = [
      {
        aspectId: 'default',
        title: 'Evaluasi Kuesioner',
        weightPercentage: 100,
        isScored: true,
      },
    ]
    adaptedDistribution = { default: 100 }
  }

  return {
    canonical: {
      form: {
        formId,
        metadata: {
          title: legacy.title || '',
          description: legacy.description,
          target: legacy.target,
          category: legacy.category,
          kind: 'official',
          status: normalizeStatus(legacy.status),
        },
        activeVersionId: versionId,
        createdBy: legacy.createdBy,
        createdAt: legacy.createdAt,
        updatedAt: legacy.updatedAt,
      },
      version: {
        versionId,
        formId,
        versionNumber: 1,
        status: normalizeStatus(legacy.status),
        aspects: adaptedAspects as any,
        questions: (legacy.questions || []).map((question) => adaptQuestion(formId, question, warnings)),
        scoring: {
          totalPoints: typeof rawScoring.totalPoints === 'number' ? rawScoring.totalPoints : 100,
          mode: rawScoring.mode === 'hybrid' || rawScoring.mode === 'manual' ? rawScoring.mode : 'auto',
          stagePointDistribution: adaptedDistribution,
          allowOverride: typeof rawScoring.allowOverride === 'boolean' ? rawScoring.allowOverride : true,
          autoBalance: typeof rawScoring.autoBalance === 'boolean' ? rawScoring.autoBalance : true,
        },
        validation: {
          mode: rawValidation.mode === 'free' || rawValidation.mode === 'all_required_except' ? rawValidation.mode : 'all_required',
          exceptionQuestionIds: Array.isArray(rawValidation.exceptions) ? rawValidation.exceptions.filter((id): id is string => typeof id === 'string') : [],
          allowOverride: typeof rawValidation.allowOverride === 'boolean' ? rawValidation.allowOverride : true,
        },
        createdAt: legacy.createdAt,
        createdBy: legacy.createdBy,
      },
    },
    warnings,
  }
}
function toPublicQuestion(question: any): PublicQuestion {
  const questionId = question.questionId || question.id || `q_${Math.random().toString(36).substring(2, 7)}`
  const aspectId = question.aspectId || question.stageId || question.stage_id || question.aspect || question.category || 'default'
  const prompt = question.prompt || question.title || question.question || question.label || 'Pertanyaan'
  const rawType = question.type || question.answerType || 'short-text'
  const normalizedType = (rawType === 'indicator' || rawType === 'table') ? 'indicator-table' : rawType
  const required = question.required !== false

  const rawOpts = Array.isArray(question.options) ? question.options : question.config?.options || []
  const options = rawOpts.map((o: any, idx: number) => {
    if (typeof o === 'string') {
      return { optionId: `opt_${questionId}_${idx}`, label: o }
    }
    if (o && typeof o === 'object') {
      return {
        optionId: o.optionId || o.id || `opt_${questionId}_${idx}`,
        label: o.label || o.text || o.title || String(o)
      }
    }
    return { optionId: `opt_${questionId}_${idx}`, label: String(o) }
  })

  // Normalize indicators for indicator-table / indicator types
  const rawIndicators = question.presentation?.indicators || question.indicators || question.config?.indicators || []
  let indicators = rawIndicators.map((ind: any, idx: number) => {
    if (typeof ind === 'string') return { indicatorId: `ind_${questionId}_${idx}`, label: ind }
    if (ind && typeof ind === 'object') return { indicatorId: ind.indicatorId || ind.id || `ind_${questionId}_${idx}`, label: ind.label || ind.title || ind.text || String(ind) }
    return { indicatorId: `ind_${questionId}_${idx}`, label: String(ind) }
  })

  if (indicators.length === 0 && (normalizedType === 'indicator-table' || rawType === 'indicator')) {
    // If options exist, use options as indicators for indicator-table
    indicators = options.map((o: any) => ({ indicatorId: o.optionId, label: o.label }))
  }

  // Normalize indicatorScales for indicator-table / likert
  const rawScales = question.presentation?.indicatorScales || question.indicatorScales || question.config?.indicatorScales || question.scales || []
  const indicatorScales = rawScales.map((sc: any, idx: number) => {
    if (typeof sc === 'number' || typeof sc === 'string') return { value: Number(sc) || (idx + 1), label: String(sc) }
    if (sc && typeof sc === 'object') return { value: Number(sc.value) || (idx + 1), label: String(sc.label || sc.value || idx + 1) }
    return { value: idx + 1, label: String(idx + 1) }
  })

  const mediaUrl = question.presentation?.media?.url || question.mediaUrl || question.imageUrl || question.photoURL || question.image || question.config?.imageUrl || question.config?.mediaUrl || null
  const mediaCaption = question.presentation?.media?.caption || question.imageCaption || question.config?.imageCaption || ''

  return {
    questionId,
    aspectId,
    type: normalizedType as any,
    prompt,
    required,
    options,
    presentation: {
      description: question.presentation?.description || question.description || question.config?.description || '',
      placeholder: question.presentation?.placeholder || question.placeholder || question.config?.placeholder || undefined,
      media: mediaUrl ? { type: 'image', url: mediaUrl, caption: mediaCaption } : question.presentation?.media || { type: 'none' },
      ratingMin: question.presentation?.ratingMin || question.ratingMin || question.config?.ratingMin || 1,
      ratingMax: question.presentation?.ratingMax || question.ratingMax || question.config?.ratingMax || 5,
      indicators: indicators.length > 0 ? indicators : undefined,
      indicatorScales: indicatorScales.length > 0 ? indicatorScales : [
        { value: 1, label: 'STS' },
        { value: 2, label: 'TS' },
        { value: 3, label: 'N' },
        { value: 4, label: 'S' },
        { value: 5, label: 'SS' },
      ],
    }
  }
}
export function toPublicFormProjection(canonical: CanonicalForm): PublicCanonicalForm {
  const rawQuestions = Array.isArray(canonical.version?.questions) ? canonical.version.questions : []
  return {
    form: {
      formId: canonical.form.formId,
      metadata: {
        title: canonical.form.metadata?.title || 'Formulir Evaluasi',
        description: canonical.form.metadata?.description || '',
        target: canonical.form.metadata?.target || '',
        category: canonical.form.metadata?.category || '',
        kind: canonical.form.metadata?.kind || 'official',
        status: canonical.form.metadata?.status || 'published',
        allowCadreDistribution: canonical.form.metadata?.allowCadreDistribution ?? true,
      },
      activeVersionId: canonical.form.activeVersionId,
      createdAt: canonical.form.createdAt,
    },
    version: {
      versionId: canonical.version?.versionId || 'v1',
      formId: canonical.version?.formId || canonical.form.formId,
      versionNumber: canonical.version?.versionNumber || 1,
      status: canonical.version?.status || 'published',
      questions: rawQuestions.map(toPublicQuestion),
    }
  }
}
/** Boundary only: later infrastructure can map this input to the legacy engine without changing formulas. */
export function toLegacyScoringAdapterInput(canonical: CanonicalForm): LegacyScoringAdapterInput { return { questions: canonical.version.questions, scoring: canonical.version.scoring, validation: canonical.version.validation } }
