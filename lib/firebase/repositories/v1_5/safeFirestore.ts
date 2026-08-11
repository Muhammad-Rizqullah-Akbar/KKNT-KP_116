import 'server-only'

import { adminFirestore } from '@/lib/firebaseAdmin'
import { firestore } from '@/lib/firebaseClient'
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'

/**
 * Helper to prevent Admin SDK network stalls when host clock is out of sync or credentials fail.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 3500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Firestore operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ])
}

/**
 * Robust, resilient Firestore data access layer.
 * Attempts Admin SDK with a fast timeout guard to prevent server hanging.
 */
export async function safeGetCollectionDocs(collectionName: string): Promise<{ id: string; data: any }[]> {
  try {
    const snapshot = await withTimeout(adminFirestore.collection(collectionName).get(), 1500)
    return snapshot.docs.map((d) => ({ id: d.id, data: d.data() }))
  } catch (adminErr: any) {
    console.warn(`[safeFirestore] Admin SDK collection read failed for "${collectionName}", attempting Web Client SDK fallback:`, adminErr?.message || adminErr)
    try {
      const snap = await getDocs(collection(firestore, collectionName))
      return snap.docs.map((d) => ({ id: d.id, data: d.data() }))
    } catch (clientErr: any) {
      console.error(`[safeFirestore] Web Client SDK also failed for "${collectionName}":`, clientErr?.message || clientErr)
      return []
    }
  }
}

export async function safeGetDoc(collectionName: string, docId: string): Promise<{ id: string; data: any } | null> {
  try {
    const docSnap = await withTimeout(adminFirestore.collection(collectionName).doc(docId).get(), 1500)
    if (!docSnap.exists) return null
    return { id: docSnap.id, data: docSnap.data() }
  } catch (adminErr: any) {
    console.warn(`[safeFirestore] Admin SDK getDoc failed for "${collectionName}/${docId}", attempting fallback:`, adminErr?.message || adminErr)
    try {
      const snap = await getDoc(doc(firestore, collectionName, docId))
      if (!snap.exists()) return null
      return { id: snap.id, data: snap.data() }
    } catch (clientErr: any) {
      console.error(`[safeFirestore] Web Client SDK getDoc failed for "${collectionName}/${docId}":`, clientErr?.message || clientErr)
      return null
    }
  }
}

/**
 * Recursively strip undefined properties to prevent Firestore "Cannot use undefined as a Firestore value" errors.
 */
function sanitizeFirestoreData(data: any): any {
  if (data === null || data === undefined) return null
  if (typeof data !== 'object') return data
  if (Array.isArray(data)) return data.map(sanitizeFirestoreData)

  const sanitized: Record<string, any> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      sanitized[key] = sanitizeFirestoreData(value)
    }
  }
  return sanitized
}

export async function safeSetDoc(collectionName: string, docId: string, data: any): Promise<void> {
  const cleanData = sanitizeFirestoreData(data)
  try {
    await withTimeout(adminFirestore.collection(collectionName).doc(docId).set(cleanData, { merge: true }), 1500)
  } catch (adminErr: any) {
    console.warn(`[safeFirestore] Admin SDK setDoc failed for "${collectionName}/${docId}", attempting fallback:`, adminErr?.message || adminErr)
    await setDoc(doc(firestore, collectionName, docId), cleanData, { merge: true })
  }
}

export async function safeDeleteDoc(collectionName: string, docId: string): Promise<void> {
  try {
    await withTimeout(adminFirestore.collection(collectionName).doc(docId).delete(), 1500)
  } catch (adminErr: any) {
    console.warn(`[safeFirestore] Admin SDK deleteDoc failed for "${collectionName}/${docId}", attempting fallback:`, adminErr?.message || adminErr)
    await deleteDoc(doc(firestore, collectionName, docId))
  }
}
