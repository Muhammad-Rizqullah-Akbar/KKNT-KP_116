import { adminFirestore } from '@/lib/firebaseAdmin'
import type { FormMetadata, ScoringConfig, ValidationConfig, CanonicalForm } from '@/lib/forms/v1_5/types'
import type {
  FormAspect,
  BuilderQuestion,
  GradeThreshold,
  RecommendationConfig,
  FormDistributionConfig,
} from '@/lib/forms/v1_5/builderState'

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

const FORMS_COLLECTION = 'forms'
const VERSIONS_COLLECTION = 'versions'

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

  // Extract & normalize questions array from any V1 / V1.5 form document structure
  const rawQuestions = Array.isArray(data.questions) ? data.questions : []
  const questions = rawQuestions.map((q: any, idx: number) => {
    const qId = q.questionId || q.id || `q_${idx}_${Math.random().toString(36).substring(2, 6)}`
    const prompt = q.prompt || q.title || q.question || q.label || `Pertanyaan ${idx + 1}`
    const rawType = q.type || q.answerType || 'short-text'
    const aspectId = q.aspectId || q.stageId || q.stage_id || q.aspect || q.category || 'default'
    const rawOpts = Array.isArray(q.options) ? q.options : q.config?.options || []

    const mediaUrl = q.presentation?.media?.url || q.media?.url || q.imageUrl || q.image || q.photoURL || q.config?.imageUrl || q.config?.mediaUrl || null
    const mediaCaption = q.presentation?.media?.caption || q.media?.caption || q.imageCaption || q.caption || ''

    return {
      ...q,
      id: qId,
      questionId: qId,
      aspectId,
      type: rawType,
      prompt,
      title: prompt,
      required: q.required !== false,
      options: rawOpts,
      config: q.config || {},
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

  // Extract & normalize aspects array (supporting V1 data.stages and V1.5 data.aspects)
  let aspects: any[] = []
  if (Array.isArray(data.aspects) && data.aspects.length > 0) {
    aspects = data.aspects.map((asp: any, idx: number) => ({
      aspectId: asp.aspectId || asp.id || `asp_${idx}`,
      title: asp.title || asp.name || asp.label || `Aspek ${idx + 1}`,
      description: asp.description || '',
      questionIds: asp.questionIds || [],
    }))
  } else if (Array.isArray(data.stages) && data.stages.length > 0) {
    // V1 legacy stages mapping to V1.5 aspects
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

  const title = data.metadata?.title || data.title || 'Formulir ' + docId
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

import { safeGetDoc, safeGetCollectionDocs, safeSetDoc } from './safeFirestore'

/**
 * 1 FIRESTORE DOCUMENT READ: Load current active Form aggregate document.
 */
export async function getFormAggregateFromDb(formId: string): Promise<FormAggregateDoc | null> {
  let docObj = await safeGetDoc(FORMS_COLLECTION, formId)
  if (!docObj) {
    docObj = await safeGetDoc('v1_5_forms', formId)
  }
  if (!docObj) {
    const allForms = await safeGetCollectionDocs(FORMS_COLLECTION)
    docObj = allForms.find((d) => d.id === formId || d.data?.formId === formId || d.data?.code === formId) || null
  }
  if (!docObj) {
    const allV15 = await safeGetCollectionDocs('v1_5_forms')
    docObj = allV15.find((d) => d.id === formId || d.data?.formId === formId || d.data?.code === formId) || null
  }
  if (!docObj) return null
  return normalizeFormAggregate(docObj.id, docObj.data)
}

/**
 * List Form Aggregate Documents with optional filter.
 */
export async function listFormAggregatesFromDb(options?: {
  status?: string
  kind?: string
  category?: string
  search?: string
}): Promise<FormAggregateDoc[]> {
  const docs1 = await safeGetCollectionDocs(FORMS_COLLECTION)
  const docs2 = await safeGetCollectionDocs('v1_5_forms')

  const combinedMap = new Map<string, { id: string; data: any }>()
  docs1.forEach((d) => combinedMap.set(d.id, d))
  docs2.forEach((d) => {
    if (!combinedMap.has(d.id)) combinedMap.set(d.id, d)
  })

  const docs = Array.from(combinedMap.values())
  let forms = docs.map((doc) => normalizeFormAggregate(doc.id, doc.data))

  if (options?.status && options.status !== 'all') {
    forms = forms.filter((f) => f.status === options.status)
  }

  if (options?.kind && options.kind !== 'all') {
    forms = forms.filter((f) => f.metadata?.kind === options.kind)
  }

  if (options?.category && options.category !== 'all') {
    forms = forms.filter(
      (f) => f.metadata?.category?.toLowerCase() === options.category?.toLowerCase()
    )
  }

  if (options?.search) {
    const term = options.search.toLowerCase()
    forms = forms.filter(
      (f) =>
        f.metadata?.title?.toLowerCase().includes(term) ||
        f.formId.toLowerCase().includes(term) ||
        f.metadata?.description?.toLowerCase().includes(term)
    )
  }

  // Sort by updatedAt desc
  return forms.sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  )
}

/**
 * Save / update Form Aggregate Draft document.
 */
export async function saveFormAggregateToDb(
  formId: string,
  data: Partial<FormAggregateDoc>,
  sessionUid: string
): Promise<FormAggregateDoc> {
  const existing = await safeGetDoc(FORMS_COLLECTION, formId)

  const now = new Date().toISOString()
  if (!existing) {
    const newDoc: FormAggregateDoc = {
      formId,
      metadata: data.metadata || {
        title: 'Formulir Penilaian V1.5',
        kind: 'official',
        status: 'draft',
      },
      activeVersionId: data.activeVersionId || `${formId}_v1`,
      activeVersionNumber: data.activeVersionNumber || 1,
      status: data.status || 'draft',
      aspects: data.aspects || [],
      questions: data.questions || [],
      scoring: data.scoring || { totalPoints: 100, mode: 'auto', stagePointDistribution: {}, allowOverride: true, autoBalance: true },
      validation: data.validation || { mode: 'all_required', exceptionQuestionIds: [], allowOverride: true },
      thresholds: data.thresholds || [],
      recommendations: data.recommendations || { mode: 'automatic', gradeArticleMap: {} },
      distribution: data.distribution || { allowCadreDistribution: true },
      createdAt: now,
      createdBy: sessionUid,
      updatedAt: now,
      updatedBy: sessionUid,
    }
    await safeSetDoc(FORMS_COLLECTION, formId, newDoc)
    return newDoc
  } else {
    const updateData: Partial<FormAggregateDoc> = {
      ...existing.data,
      ...data,
      updatedAt: now,
      updatedBy: sessionUid,
    }
    await safeSetDoc(FORMS_COLLECTION, formId, updateData)
    return updateData as FormAggregateDoc
  }
}

/**
 * ATOMIC PUBLISHING TRANSACTION:
 * Atomically writes immutable snapshot to forms/{formId}/versions/{versionId}
 * and updates forms/{formId} aggregate with activeVersionId, activeVersionNumber, status: published.
 */
export async function publishFormVersionInDb(
  formId: string,
  sessionUid: string
): Promise<{ aggregate: FormAggregateDoc; snapshot: FormVersionSnapshotDoc }> {
  const formRef = adminFirestore.collection(FORMS_COLLECTION).doc(formId)
  const now = new Date().toISOString()

  let resultAggregate!: FormAggregateDoc
  let resultSnapshot!: FormVersionSnapshotDoc

  await adminFirestore.runTransaction(async (transaction) => {
    const formSnap = await transaction.get(formRef)
    if (!formSnap.exists) {
      throw new Error(`Formulir dengan ID "${formId}" tidak ditemukan.`)
    }

    const currentForm = formSnap.data() as FormAggregateDoc
    const versionNumber = currentForm.activeVersionNumber || 1
    const versionId = `${formId}_v${versionNumber}`

    resultSnapshot = {
      versionId,
      formId,
      versionNumber,
      status: 'published',
      metadata: { ...currentForm.metadata, status: 'published' },
      aspects: currentForm.aspects,
      questions: currentForm.questions,
      scoring: currentForm.scoring,
      validation: currentForm.validation,
      thresholds: currentForm.thresholds,
      recommendations: currentForm.recommendations,
      distribution: currentForm.distribution,
      createdAt: currentForm.createdAt,
      createdBy: currentForm.createdBy,
      publishedAt: now,
      publishedBy: sessionUid,
    }

    const versionRef = formRef.collection(VERSIONS_COLLECTION).doc(versionId)
    transaction.set(versionRef, resultSnapshot)

    resultAggregate = {
      ...currentForm,
      metadata: { ...currentForm.metadata, status: 'published' },
      status: 'published',
      activeVersionId: versionId,
      activeVersionNumber: versionNumber,
      updatedAt: now,
      updatedBy: sessionUid,
      publishedAt: now,
      publishedBy: sessionUid,
    }

    transaction.update(formRef, {
      metadata: resultAggregate.metadata,
      status: 'published',
      activeVersionId: versionId,
      activeVersionNumber: versionNumber,
      updatedAt: now,
      updatedBy: sessionUid,
      publishedAt: now,
      publishedBy: sessionUid,
    })
  })

  return { aggregate: resultAggregate, snapshot: resultSnapshot }
}

/**
 * CREATE NEW DRAFT VERSION:
 * Increments activeVersionNumber and resets status to 'draft' on current aggregate.
 */
export async function createNewVersionInDb(
  formId: string,
  sessionUid: string
): Promise<FormAggregateDoc> {
  const formRef = adminFirestore.collection(FORMS_COLLECTION).doc(formId)
  const now = new Date().toISOString()

  let resultAggregate!: FormAggregateDoc

  await adminFirestore.runTransaction(async (transaction) => {
    const formSnap = await transaction.get(formRef)
    if (!formSnap.exists) {
      throw new Error(`Formulir dengan ID "${formId}" tidak ditemukan.`)
    }

    const currentForm = formSnap.data() as FormAggregateDoc
    const nextVersionNumber = (currentForm.activeVersionNumber || 1) + 1
    const nextVersionId = `${formId}_v${nextVersionNumber}`

    resultAggregate = {
      ...currentForm,
      metadata: { ...currentForm.metadata, status: 'draft' },
      status: 'draft',
      activeVersionId: nextVersionId,
      activeVersionNumber: nextVersionNumber,
      updatedAt: now,
      updatedBy: sessionUid,
    }

    transaction.update(formRef, {
      metadata: resultAggregate.metadata,
      status: 'draft',
      activeVersionId: nextVersionId,
      activeVersionNumber: nextVersionNumber,
      updatedAt: now,
      updatedBy: sessionUid,
    })
  })

  return resultAggregate
}

/**
 * ARCHIVE FORM AGGREGATE.
 */
export async function archiveFormInDb(
  formId: string,
  sessionUid: string
): Promise<FormAggregateDoc> {
  const formRef = adminFirestore.collection(FORMS_COLLECTION).doc(formId)
  const now = new Date().toISOString()
  const formSnap = await formRef.get()
  if (!formSnap.exists) {
    throw new Error(`Formulir dengan ID "${formId}" tidak ditemukan.`)
  }

  const current = formSnap.data() as FormAggregateDoc
  const updated: FormAggregateDoc = {
    ...current,
    status: 'archived',
    metadata: { ...current.metadata, status: 'archived' },
    updatedAt: now,
    updatedBy: sessionUid,
  }

  await formRef.update({
    status: 'archived',
    'metadata.status': 'archived',
    updatedAt: now,
    updatedBy: sessionUid,
  })

  return updated
}

/**
 * RESTORE FORM VERSION SNAPSHOT
 */
export async function restoreFormInDb(
  formId: string,
  sessionUid: string
): Promise<FormAggregateDoc> {
  const existing = await getFormAggregateFromDb(formId)
  if (!existing) {
    throw new Error(`Formulir dengan ID "${formId}" tidak ditemukan.`)
  }

  const restoredStatus = existing.activeVersionNumber > 1 ? 'published' : 'draft'
  const now = new Date().toISOString()

  const updated: FormAggregateDoc = {
    ...existing,
    status: restoredStatus,
    metadata: { ...existing.metadata, status: restoredStatus },
    updatedAt: now,
    updatedBy: sessionUid,
  }

  await safeSetDoc(FORMS_COLLECTION, formId, {
    status: restoredStatus,
    'metadata.status': restoredStatus,
    updatedAt: now,
    updatedBy: sessionUid,
  })

  return updated
}

/**
 * FETCH HISTORICAL VERSION SNAPSHOTS:
 * Query subcollection forms/{formId}/versions/*
 */
export async function getFormVersionSnapshotsFromDb(
  formId: string
): Promise<FormVersionSnapshotDoc[]> {
  try {
    const versionsSnap = await adminFirestore
      .collection(FORMS_COLLECTION)
      .doc(formId)
      .collection(VERSIONS_COLLECTION)
      .orderBy('versionNumber', 'desc')
      .get()

    const list = versionsSnap.docs.map((doc) => doc.data() as FormVersionSnapshotDoc)
    if (list.length > 0) return list
  } catch (e) {
    // Ignore Admin SDK error
  }

  // Fallback to active aggregate snapshot
  const mainAgg = await getFormAggregateFromDb(formId)
  if (mainAgg) {
    return [
      {
        versionId: mainAgg.activeVersionId || `${formId}_v1`,
        formId: mainAgg.formId,
        versionNumber: mainAgg.activeVersionNumber || 1,
        status: mainAgg.status === 'published' ? 'published' : 'published',
        metadata: mainAgg.metadata,
        aspects: mainAgg.aspects,
        questions: mainAgg.questions,
        scoring: mainAgg.scoring,
        validation: mainAgg.validation,
        thresholds: mainAgg.thresholds,
        recommendations: mainAgg.recommendations,
        createdAt: mainAgg.createdAt,
        createdBy: mainAgg.createdBy,
      },
    ]
  }

  return []
}
