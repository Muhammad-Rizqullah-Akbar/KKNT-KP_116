import { adminFirestore } from '@/lib/infra/firebase-admin'
import { recursivelyOffloadBase64Media } from '@/lib/infra/media-offloader'
import { safeGetDoc, safeGetCollectionDocs, safeSetDoc } from './safe-firestore'
import type { FormAggregateDoc, FormVersionSnapshotDoc } from './form-versions.normalize'
import { normalizeFormAggregate } from './form-versions.normalize'

export type { FormAggregateDoc, FormVersionSnapshotDoc } from './form-versions.normalize'

const FORMS_COLLECTION = 'forms'
const VERSIONS_COLLECTION = 'versions'

/**
 * 1 FIRESTORE DOCUMENT READ: Load current active Form aggregate document.
 */
export async function getFormAggregateFromDb(formId: string): Promise<FormAggregateDoc | null> {
  const norm = (formId || '').trim().toUpperCase()
  let docObj = await safeGetDoc(FORMS_COLLECTION, formId)
  if (!docObj) {
    const allForms = await safeGetCollectionDocs(FORMS_COLLECTION)
    docObj =
      allForms.find(
        (d) =>
          d.id === formId ||
          d.data?.formId === formId ||
          d.data?.code === formId ||
          (d.data?.code && d.data.code.toUpperCase() === norm) ||
          (d.data?.normalizedCode && d.data.normalizedCode === norm) ||
          (d.data?.posttestCode && d.data.posttestCode.toUpperCase() === norm) ||
          (d.data?.pretestCode && d.data.pretestCode.toUpperCase() === norm)
      ) || null
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

  const docs = docs1
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
  // Offload any base64 images inside payload to disk/storage before persisting to Firestore
  const cleanedPayload = await recursivelyOffloadBase64Media(data, formId)

  const existing = await safeGetDoc(FORMS_COLLECTION, formId)

  const now = new Date().toISOString()
  if (!existing) {
    const newDoc: FormAggregateDoc = {
      formId,
      metadata: cleanedPayload.metadata || {
        title: 'Formulir Penilaian ',
        kind: 'official',
        status: 'draft',
      },
      activeVersionId: cleanedPayload.activeVersionId || `${formId}_v1`,
      activeVersionNumber: cleanedPayload.activeVersionNumber || 1,
      status: cleanedPayload.status || 'draft',
      aspects: cleanedPayload.aspects || [],
      questions: cleanedPayload.questions || [],
      scoring: cleanedPayload.scoring || { totalPoints: 100, mode: 'auto', stagePointDistribution: {}, allowOverride: true, autoBalance: true },
      validation: cleanedPayload.validation || { mode: 'all_required', exceptionQuestionIds: [], allowOverride: true },
      thresholds: cleanedPayload.thresholds || [],
      recommendations: cleanedPayload.recommendations || { mode: 'automatic', gradeArticleMap: {} },
      distribution: cleanedPayload.distribution || { allowCadreDistribution: true },
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
      ...cleanedPayload,
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
