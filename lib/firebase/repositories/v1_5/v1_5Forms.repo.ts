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

/**
 * 1 FIRESTORE DOCUMENT READ: Load current active Form aggregate document.
 */
export async function getFormAggregateFromDb(formId: string): Promise<FormAggregateDoc | null> {
  const docSnap = await adminFirestore.collection(FORMS_COLLECTION).doc(formId).get()
  if (!docSnap.exists) return null
  return docSnap.data() as FormAggregateDoc
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
  let query: FirebaseAdmin.Firestore.Query = adminFirestore.collection(FORMS_COLLECTION)

  if (options?.status && options.status !== 'all') {
    query = query.where('status', '==', options.status)
  }
  if (options?.kind && options.kind !== 'all') {
    query = query.where('metadata.kind', '==', options.kind)
  }

  const snapshot = await query.get()
  let forms = snapshot.docs.map((doc) => doc.data() as FormAggregateDoc)

  if (options?.category && options.category !== 'all') {
    forms = forms.filter(
      (f) => f.metadata.category?.toLowerCase() === options.category?.toLowerCase()
    )
  }

  if (options?.search) {
    const term = options.search.toLowerCase()
    forms = forms.filter(
      (f) =>
        f.metadata.title.toLowerCase().includes(term) ||
        f.formId.toLowerCase().includes(term) ||
        f.metadata.description?.toLowerCase().includes(term)
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
  const docRef = adminFirestore.collection(FORMS_COLLECTION).doc(formId)
  const existing = await docRef.get()

  const now = new Date().toISOString()
  if (!existing.exists) {
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
      scoring: data.scoring || { totalPoints: 100, mode: 'auto', stagePointDistribution: {} },
      validation: data.validation || { mode: 'all_required', allowOverride: true },
      thresholds: data.thresholds || [],
      recommendations: data.recommendations || { mode: 'manual' },
      distribution: data.distribution || { allowCadreDistribution: true },
      createdAt: now,
      createdBy: sessionUid,
      updatedAt: now,
      updatedBy: sessionUid,
    }
    await docRef.set(newDoc)
    return newDoc
  } else {
    const updateData: Partial<FormAggregateDoc> = {
      ...data,
      updatedAt: now,
      updatedBy: sessionUid,
    }
    await docRef.update(updateData)
    const updatedSnap = await docRef.get()
    return updatedSnap.data() as FormAggregateDoc
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
 * FETCH HISTORICAL VERSION SNAPSHOTS:
 * Query subcollection forms/{formId}/versions/*
 */
export async function getFormVersionSnapshotsFromDb(
  formId: string
): Promise<FormVersionSnapshotDoc[]> {
  const versionsSnap = await adminFirestore
    .collection(FORMS_COLLECTION)
    .doc(formId)
    .collection(VERSIONS_COLLECTION)
    .orderBy('versionNumber', 'desc')
    .get()

  return versionsSnap.docs.map((doc) => doc.data() as FormVersionSnapshotDoc)
}
