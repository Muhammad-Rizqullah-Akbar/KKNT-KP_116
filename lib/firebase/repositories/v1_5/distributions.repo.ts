import { safeGetDoc, safeGetCollectionDocs, safeSetDoc, safeDeleteDoc } from './safeFirestore'
import type { DistributionDoc } from '@/lib/forms/v1_5/distributionTypes'

const DISTRIBUTIONS_COLLECTION = 'distributions'

/**
 * Creates a new distribution document in Firestore.
 */
export async function createDistributionDoc(docData: DistributionDoc): Promise<DistributionDoc> {
  await safeSetDoc(DISTRIBUTIONS_COLLECTION, docData.distributionId, docData)
  return docData
}

/**
 * Gets a distribution document by distributionId.
 */
export async function getDistributionDoc(distributionId: string): Promise<DistributionDoc | null> {
  const docObj = await safeGetDoc(DISTRIBUTIONS_COLLECTION, distributionId)
  if (!docObj) return null
  return docObj.data as DistributionDoc
}

/**
 * Fast indexed lookup by normalizedCode (uppercase case-insensitive lookup).
 */
export async function getDistributionByCodeDoc(code: string): Promise<DistributionDoc | null> {
  const normalized = code.trim().toUpperCase()
  const docs = await safeGetCollectionDocs(DISTRIBUTIONS_COLLECTION)
  const match = docs.find((d) => (d.data?.normalizedCode || d.data?.code?.toUpperCase()) === normalized)

  if (!match) return null
  return match.data as DistributionDoc
}

/**
 * List distribution documents with optional role and filter parameters.
 */
export async function listDistributionsDoc(options?: {
  ownerType?: string
  ownerId?: string
  status?: string
  formId?: string
  search?: string
}): Promise<DistributionDoc[]> {
  const rawDocs = await safeGetCollectionDocs(DISTRIBUTIONS_COLLECTION)
  let docs = rawDocs.map((d) => d.data as DistributionDoc)

  if (options?.ownerType && options.ownerType !== 'all') {
    docs = docs.filter((d) => d.ownerType === options.ownerType)
  }
  if (options?.ownerId) {
    docs = docs.filter((d) => d.ownerId === options.ownerId)
  }
  if (options?.formId) {
    docs = docs.filter((d) => d.formId === options.formId)
  }
  if (options?.status && options.status !== 'all') {
    docs = docs.filter((d) => d.status === options.status)
  }

  if (options?.search) {
    const term = options.search.toLowerCase()
    docs = docs.filter(
      (d) =>
        d.title?.toLowerCase().includes(term) ||
        d.code?.toLowerCase().includes(term) ||
        d.formId?.toLowerCase().includes(term) ||
        d.ownerName?.toLowerCase().includes(term)
    )
  }

  // Sort by updatedAt descending
  return docs.sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  )
}

/**
 * Update distribution document fields.
 */
export async function updateDistributionDoc(
  distributionId: string,
  data: Partial<DistributionDoc>
): Promise<DistributionDoc> {
  const existing = await safeGetDoc(DISTRIBUTIONS_COLLECTION, distributionId)
  if (!existing) {
    throw new Error(`Distribusi dengan ID "${distributionId}" tidak ditemukan.`)
  }

  const updatedData: DistributionDoc = {
    ...existing.data,
    ...data,
    updatedAt: new Date().toISOString(),
  }
  await safeSetDoc(DISTRIBUTIONS_COLLECTION, distributionId, updatedData)

  return updatedData
}

/**
 * Pause / Resume distribution status.
 */
export async function pauseDistributionDoc(
  distributionId: string,
  sessionUid: string
): Promise<DistributionDoc> {
  const existing = await safeGetDoc(DISTRIBUTIONS_COLLECTION, distributionId)
  if (!existing) {
    throw new Error(`Distribusi dengan ID "${distributionId}" tidak ditemukan.`)
  }

  const current = existing.data as DistributionDoc
  const nextStatus = current.status === 'paused' ? 'active' : 'paused'
  const now = new Date().toISOString()

  const updatedData: DistributionDoc = {
    ...current,
    status: nextStatus,
    updatedAt: now,
    updatedBy: sessionUid,
  }

  await safeSetDoc(DISTRIBUTIONS_COLLECTION, distributionId, updatedData)
  return updatedData
}

/**
 * Archive distribution status.
 */
export async function archiveDistributionDoc(
  distributionId: string,
  sessionUid: string
): Promise<DistributionDoc> {
  const existing = await safeGetDoc(DISTRIBUTIONS_COLLECTION, distributionId)
  if (!existing) {
    throw new Error(`Distribusi dengan ID "${distributionId}" tidak ditemukan.`)
  }

  const current = existing.data as DistributionDoc
  const now = new Date().toISOString()

  const updatedData: DistributionDoc = {
    ...current,
    status: 'archived',
    updatedAt: now,
    updatedBy: sessionUid,
  }

  await safeSetDoc(DISTRIBUTIONS_COLLECTION, distributionId, updatedData)
  return updatedData
}

/**
 * Permanently delete a distribution document from all distribution collections.
 */
export async function deleteDistributionDoc(distributionId: string): Promise<void> {
  try {
    await safeDeleteDoc(DISTRIBUTIONS_COLLECTION, distributionId)
  } catch (e) {
    console.warn(`safeDeleteDoc warning for ${DISTRIBUTIONS_COLLECTION}:`, e)
  }
  try {
    await safeDeleteDoc('v1_5_distributions', distributionId)
  } catch (e) {
    console.warn('safeDeleteDoc warning for v1_5_distributions:', e)
  }
}
