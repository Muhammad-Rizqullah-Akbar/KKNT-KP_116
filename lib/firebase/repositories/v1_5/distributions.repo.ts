import 'server-only'

import { adminFirestore } from '@/lib/firebaseAdmin'
import type { DistributionDoc } from '@/lib/forms/v1_5/distributionTypes'

const DISTRIBUTIONS_COLLECTION = 'distributions'

/**
 * Creates a new distribution document in Firestore.
 */
export async function createDistributionDoc(docData: DistributionDoc): Promise<DistributionDoc> {
  const docRef = adminFirestore.collection(DISTRIBUTIONS_COLLECTION).doc(docData.distributionId)
  await docRef.set(docData)
  return docData
}

/**
 * Gets a distribution document by distributionId.
 */
export async function getDistributionDoc(distributionId: string): Promise<DistributionDoc | null> {
  const docSnap = await adminFirestore.collection(DISTRIBUTIONS_COLLECTION).doc(distributionId).get()
  if (!docSnap.exists) return null
  return docSnap.data() as DistributionDoc
}

/**
 * Fast indexed lookup by normalizedCode (uppercase case-insensitive lookup).
 */
export async function getDistributionByCodeDoc(code: string): Promise<DistributionDoc | null> {
  const normalized = code.trim().toUpperCase()
  const snapshot = await adminFirestore
    .collection(DISTRIBUTIONS_COLLECTION)
    .where('normalizedCode', '==', normalized)
    .limit(1)
    .get()

  if (snapshot.empty) return null
  return snapshot.docs[0].data() as DistributionDoc
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
  let query: FirebaseAdmin.Firestore.Query = adminFirestore.collection(DISTRIBUTIONS_COLLECTION)

  if (options?.ownerType && options.ownerType !== 'all') {
    query = query.where('ownerType', '==', options.ownerType)
  }
  if (options?.ownerId) {
    query = query.where('ownerId', '==', options.ownerId)
  }
  if (options?.formId) {
    query = query.where('formId', '==', options.formId)
  }
  if (options?.status && options.status !== 'all') {
    query = query.where('status', '==', options.status)
  }

  const snapshot = await query.get()
  let docs = snapshot.docs.map((d) => d.data() as DistributionDoc)

  if (options?.search) {
    const term = options.search.toLowerCase()
    docs = docs.filter(
      (d) =>
        d.title.toLowerCase().includes(term) ||
        d.code.toLowerCase().includes(term) ||
        d.formId.toLowerCase().includes(term) ||
        d.ownerName.toLowerCase().includes(term)
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
  const docRef = adminFirestore.collection(DISTRIBUTIONS_COLLECTION).doc(distributionId)
  const snap = await docRef.get()
  if (!snap.exists) {
    throw new Error(`Distribusi dengan ID "${distributionId}" tidak ditemukan.`)
  }

  const updatedData = {
    ...data,
    updatedAt: new Date().toISOString(),
  }
  await docRef.update(updatedData)

  const newSnap = await docRef.get()
  return newSnap.data() as DistributionDoc
}

/**
 * Pause / Resume distribution status.
 */
export async function pauseDistributionDoc(
  distributionId: string,
  sessionUid: string
): Promise<DistributionDoc> {
  const docRef = adminFirestore.collection(DISTRIBUTIONS_COLLECTION).doc(distributionId)
  const snap = await docRef.get()
  if (!snap.exists) {
    throw new Error(`Distribusi dengan ID "${distributionId}" tidak ditemukan.`)
  }

  const current = snap.data() as DistributionDoc
  const nextStatus = current.status === 'paused' ? 'active' : 'paused'
  const now = new Date().toISOString()

  await docRef.update({
    status: nextStatus,
    updatedAt: now,
    updatedBy: sessionUid,
  })

  return { ...current, status: nextStatus, updatedAt: now, updatedBy: sessionUid }
}

/**
 * Archive distribution status.
 */
export async function archiveDistributionDoc(
  distributionId: string,
  sessionUid: string
): Promise<DistributionDoc> {
  const docRef = adminFirestore.collection(DISTRIBUTIONS_COLLECTION).doc(distributionId)
  const snap = await docRef.get()
  if (!snap.exists) {
    throw new Error(`Distribusi dengan ID "${distributionId}" tidak ditemukan.`)
  }

  const current = snap.data() as DistributionDoc
  const now = new Date().toISOString()

  await docRef.update({
    status: 'archived',
    updatedAt: now,
    updatedBy: sessionUid,
  })

  return { ...current, status: 'archived', updatedAt: now, updatedBy: sessionUid }
}
