import 'server-only'

import { adminFirestore } from '@/lib/firebaseAdmin'
import type { ResponseDoc, ResponseFilterOptions } from '@/lib/forms/v1_5/responseTypes'

const RESPONSES_COLLECTION = 'responses'

/**
 * Creates a new response document in Firestore.
 */
export async function createResponseDoc(docData: ResponseDoc): Promise<ResponseDoc> {
  const docRef = adminFirestore.collection(RESPONSES_COLLECTION).doc(docData.responseId)
  await docRef.set(docData)
  return docData
}

/**
 * Retrieves a response document by ID.
 */
export async function getResponseDoc(responseId: string): Promise<ResponseDoc | null> {
  const docSnap = await adminFirestore.collection(RESPONSES_COLLECTION).doc(responseId).get()
  if (!docSnap.exists) return null
  return docSnap.data() as ResponseDoc
}

/**
 * Atomically transitions response status from 'in_progress' to 'submitted'.
 * Ensures single-submission / double-submission lock protection.
 */
export async function submitResponseDoc(
  responseId: string,
  submissionToken: string,
  answers: Record<string, any>,
  resultData?: any
): Promise<ResponseDoc> {
  const docRef = adminFirestore.collection(RESPONSES_COLLECTION).doc(responseId)

  return await adminFirestore.runTransaction(async (transaction) => {
    const snap = await transaction.get(docRef)
    if (!snap.exists) {
      throw new Error(`Sesi respon dengan ID "${responseId}" tidak ditemukan.`)
    }

    const current = snap.data() as ResponseDoc

    if (current.submissionToken !== submissionToken) {
      throw new Error('Token sesi pengiriman tidak valid atau tidak cocok.')
    }

    if (current.status === 'submitted') {
      throw new Error('Sesi formulir ini sudah pernah dikirimkan sebelumnya. Pengiriman ganda tidak diperbolehkan.')
    }

    if (current.status !== 'in_progress') {
      throw new Error(`Sesi formulir tidak dalam status aktif untuk pengiriman (Status: ${current.status}).`)
    }

    const now = new Date().toISOString()
    const updatedData: Partial<ResponseDoc> = {
      answers,
      status: 'submitted',
      submittedAt: now,
      updatedAt: now,
      result: resultData || undefined,
    }

    transaction.update(docRef, updatedData)

    return {
      ...current,
      ...updatedData,
      status: 'submitted',
      submittedAt: now,
      updatedAt: now,
    }
  })
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
  let query: FirebaseAdmin.Firestore.Query = adminFirestore.collection(RESPONSES_COLLECTION)

  if (options?.distributionId) {
    query = query.where('distributionId', '==', options.distributionId)
  }
  if (options?.formId) {
    query = query.where('formId', '==', options.formId)
  }
  if (options?.versionId) {
    query = query.where('versionId', '==', options.versionId)
  }
  if (options?.status && options.status !== 'all') {
    query = query.where('status', '==', options.status)
  }
  if (options?.ownerId) {
    query = query.where('ownerId', '==', options.ownerId)
  }

  const snapshot = await query.get()
  let docs = snapshot.docs.map((d) => d.data() as ResponseDoc)

  if (options?.search) {
    const term = options.search.toLowerCase()
    docs = docs.filter(
      (d) =>
        d.responseId.toLowerCase().includes(term) ||
        d.distributionCode.toLowerCase().includes(term) ||
        (d.respondent?.name && d.respondent.name.toLowerCase().includes(term)) ||
        (d.respondent?.email && d.respondent.email.toLowerCase().includes(term))
    )
  }

  // Sort by updatedAt descending
  return docs.sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  )
}
