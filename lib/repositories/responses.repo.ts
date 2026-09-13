import { safeGetDoc, safeGetCollectionDocs, safeSetDoc, safeDeleteDoc } from './safe-firestore'
import type { ResponseDoc, ResponseFilterOptions } from '@/lib/domain/responses/response-types'
import { normalizeResponseDoc } from './responses.normalize'
import { enrichResponsesWithFormScoring } from './responses.enrich'

const RESPONSES_COLLECTION = 'responses'

/**
 * Creates a new response document in Firestore.
 */
export async function createResponseDoc(docData: ResponseDoc): Promise<ResponseDoc> {
  await safeSetDoc(RESPONSES_COLLECTION, docData.responseId, docData)
  return docData
}

export interface FormOptionMeta {
  formId: string
  title: string
  versionNumber: number
  versionLabel: string
}

export interface DistributionOptionMeta {
  distributionId: string
  code: string
  title: string
  ownerName?: string
  ownerType?: string
  formId?: string
}

/**
 * Retrieves all available forms and distribution groups across V1 and V1.5 for admin filter dropdowns.
 */
export async function getFormAndDistributionOptions(): Promise<{
  forms: FormOptionMeta[]
  distributions: DistributionOptionMeta[]
}> {
  try {
    const [rawForms, rawV15Forms, rawGroups, rawV15Distributions, rawDistributions, rawUsers] = await Promise.all([
      safeGetCollectionDocs('forms'),
      safeGetCollectionDocs('v1_5_forms'),
      safeGetCollectionDocs('formGroups'),
      safeGetCollectionDocs('v1_5_distributions'),
      safeGetCollectionDocs('distributions'),
      safeGetCollectionDocs('users'),
    ])

    const userMap: Record<string, string> = {}
    rawUsers.forEach((u) => {
      const name = u.data.displayName || u.data.name || (u.data.email ? u.data.email.split('@')[0] : '')
      if (name) {
        userMap[u.id] = name
        if (u.data.email) userMap[u.data.email] = name
      }
    })

    const formsList: FormOptionMeta[] = []
    const distList: DistributionOptionMeta[] = []

    rawForms.forEach((d) => {
      const title = d.data.title || d.data.name || 'Formulir Evaluasi Pangan'
      formsList.push({
        formId: d.id,
        title: title.replace(/^form_[\w\-]+/g, 'Formulir Evaluasi Pangan'),
        versionNumber: 1.0,
        versionLabel: 'V1.0 Legacy',
      })
    })

    rawV15Forms.forEach((d) => {
      const title = d.data.metadata?.title || d.data.title || d.data.name || 'Formulir Evaluasi Pangan'
      const versionNumber = d.data.activeVersionNumber || 1.5
      formsList.push({
        formId: d.id,
        title: title.replace(/^form_[\w\-]+/g, 'Formulir Evaluasi Pangan'),
        versionNumber,
        versionLabel: `V1.5 (v${versionNumber})`,
      })
    })

    rawGroups.forEach((d) => {
      const title = d.data.title || d.data.name || d.data.code || 'Kelompok Kader'
      distList.push({
        distributionId: d.id,
        code: d.data.code || 'V1-GROUP',
        title: title.replace(/^dist_[\w\-]+/g, 'Kelompok Kader'),
        ownerName: 'Admin System',
        ownerType: 'super_admin',
      })
    })

    rawUsers.forEach((u) => {
      const displayName = u.data.displayName || u.data.name || u.data.email?.split('@')[0] || u.data.email
      if (displayName) {
        distList.push({
          distributionId: `user_${u.id}`,
          code: `USER-${u.id.substring(0, 6)}`,
          title: `Kanal ${displayName}`,
          ownerName: displayName,
          ownerType: u.data.role || 'cadre',
        })
      }
    })

    const processDistDoc = (d: { id: string; data: any }) => {
      const title = d.data.title || d.data.targetGroup || d.data.name || 'Channel Distribusi Kader'
      const code = d.data.code || d.data.distributionCode || d.id
      const rawOwnerName = d.data.ownerName
      const ownerId = d.data.ownerId || d.data.createdBy
      const resolvedOwnerName =
        (ownerId && userMap[ownerId])
          ? userMap[ownerId]
          : (rawOwnerName && !['Penerbit Kode', 'Admin System'].includes(rawOwnerName))
          ? rawOwnerName
          : 'Administrator BPOM'

      const ownerType = d.data.ownerType || 'cadre'
      const formId = d.data.formId

      distList.push({
        distributionId: d.id,
        code,
        title: typeof title === 'string' ? title.replace(/^dist_[\w\-]+/g, 'Channel Distribusi Kader') : 'Channel Distribusi Kader',
        ownerName: resolvedOwnerName,
        ownerType,
        formId,
      })
    }

    rawV15Distributions.forEach(processDistDoc)
    rawDistributions.forEach(processDistDoc)

    return {
      forms: formsList,
      distributions: distList,
    }
  } catch (err) {
    return { forms: [], distributions: [] }
  }
}

/**
 * Retrieves a response document by ID.
 */
export async function getResponseDoc(responseId: string): Promise<ResponseDoc | null> {
  const docObj = await safeGetDoc(RESPONSES_COLLECTION, responseId)
  if (!docObj) return null
  const normalized = normalizeResponseDoc(docObj.data, responseId)
  const [enriched] = await enrichResponsesWithFormScoring([normalized])
  return enriched
}

/**
 * Atomically transitions response status from 'in_progress' to 'submitted'.
 */
export async function submitResponseDoc(
  responseId: string,
  submissionToken: string,
  answers: Record<string, any>,
  resultData?: any
): Promise<ResponseDoc> {
  const currentObj = await safeGetDoc(RESPONSES_COLLECTION, responseId)
  if (!currentObj) {
    throw new Error(`Sesi respon dengan ID "${responseId}" tidak ditemukan.`)
  }

  const current = normalizeResponseDoc(currentObj.data, responseId)

  if (current.submissionToken && current.submissionToken !== submissionToken) {
    throw new Error('Token sesi pengiriman tidak valid atau tidak cocok.')
  }

  if (current.status === 'submitted') {
    throw new Error('Sesi formulir ini sudah pernah dikirimkan sebelumnya. Pengiriman ganda tidak diperbolehkan.')
  }

  const now = new Date().toISOString()
  const updatedData: ResponseDoc = {
    ...current,
    answers,
    status: 'submitted',
    submittedAt: now,
    updatedAt: now,
    result: resultData || undefined,
  }

  await safeSetDoc(RESPONSES_COLLECTION, responseId, updatedData)
  return updatedData
}

/**
 * Lists response documents with role and parameter filtering.
 */
export async function listResponsesDoc(
  options?: ResponseFilterOptions & {
    ownerType?: string
    ownerId?: string
  }
): Promise<ResponseDoc[]> {
  const rawDocs = await safeGetCollectionDocs(RESPONSES_COLLECTION)
  let docs = rawDocs.map((d) => normalizeResponseDoc(d.data, d.id))

  if (options?.distributionId) {
    docs = docs.filter((d) => d.distributionId === options.distributionId)
  }
  if (options?.formId) {
    docs = docs.filter((d) => d.formId === options.formId)
  }
  if (options?.versionId) {
    docs = docs.filter((d) => d.versionId === options.versionId)
  }
  if (options?.status && options.status !== 'all') {
    docs = docs.filter((d) => d.status === options.status)
  }
  if (options?.ownerId) {
    docs = docs.filter((d) => d.ownerId === options.ownerId)
  }

  if (options?.search) {
    const term = options.search.toLowerCase()
    docs = docs.filter(
      (d) =>
        d.responseId?.toLowerCase().includes(term) ||
        d.distributionCode?.toLowerCase().includes(term) ||
        (d.respondent?.name && d.respondent.name.toLowerCase().includes(term)) ||
        (d.respondent?.email && d.respondent.email.toLowerCase().includes(term))
    )
  }

  const enrichedDocs = await enrichResponsesWithFormScoring(docs)

  return enrichedDocs.sort(
    (a, b) => new Date(b.updatedAt || b.submittedAt || 0).getTime() - new Date(a.updatedAt || a.submittedAt || 0).getTime()
  )
}

/**
 * Deletes a single response document by ID from all response collections.
 */
export async function deleteResponseDoc(responseId: string): Promise<void> {
  try {
    await safeDeleteDoc(RESPONSES_COLLECTION, responseId)
  } catch (e) {
    console.warn(`safeDeleteDoc warning for ${RESPONSES_COLLECTION}:`, e)
  }
  try {
    await safeDeleteDoc('v1_5_responses', responseId)
  } catch (e) {
    console.warn('safeDeleteDoc warning for v1_5_responses:', e)
  }
}

/**
 * Bulk deletes multiple response documents by ID.
 */
export async function deleteMultipleResponseDocs(responseIds: string[]): Promise<void> {
  await Promise.all(responseIds.map((id) => deleteResponseDoc(id)))
}
