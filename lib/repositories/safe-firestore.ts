import 'server-only'

import { adminFirestore } from '@/lib/infra/firebase-admin'
import { firestore } from '@/lib/infra/firebase-client'
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

/**
 * Query terfilter + berbatas. HANYA memakai equality `where` + `limit`
 * (tanpa `orderBy` pada field berbeda), sehingga cukup memakai index
 * single-field otomatis Firestore dan TIDAK membutuhkan composite index.
 *
 * Ini jalur HEMAT untuk list: membaca sejumlah `limit` dokumen saja,
 * bukan seluruh koleksi.
 */
export async function safeQueryDocs(
  collectionName: string,
  filters: Array<{ field: string; value: any }> = [],
  limitCount = 25,
): Promise<{ id: string; data: any }[]> {
  const safeLimit = Math.max(1, Math.min(Number(limitCount) || 25, 100))
  try {
    let q: any = adminFirestore.collection(collectionName)
    for (const f of filters) {
      if (f && f.field) q = q.where(f.field, '==', f.value)
    }
    q = q.limit(safeLimit)
    const snapshot: any = await withTimeout(q.get() as Promise<any>, 3000)
    return snapshot.docs.map((d: any) => ({ id: d.id, data: d.data() }))
  } catch (adminErr: any) {
    console.warn(`[safeFirestore] filtered read failed for "${collectionName}":`, adminErr?.message || adminErr)
    try {
      const { query, collection: col, where, limit: lim, getDocs: gd } = await import('firebase/firestore')
      const refs: any[] = []
      for (const f of filters) {
        if (f && f.field) refs.push(where(f.field, '==', f.value))
      }
      const snap = await gd(query(col(firestore, collectionName), ...refs, lim(safeLimit)))
      return snap.docs.map((d: any) => ({ id: d.id, data: d.data() }))
    } catch (clientErr: any) {
      console.error(`[safeFirestore] filtered fallback failed for "${collectionName}":`, clientErr?.message || clientErr)
      return []
    }
  }
}

/**
 * Hitung jumlah dokumen tanpa membaca dokumennya (count aggregation).
 * Biaya: 1 read per 1000 dokumen yang dihitung (jauh lebih murah dari full scan).
 */
export async function safeCountDocs(
  collectionName: string,
  filters: Array<{ field: string; value: any }> = [],
): Promise<number> {
  try {
    let q: any = adminFirestore.collection(collectionName)
    for (const f of filters) {
      if (f && f.field) q = q.where(f.field, '==', f.value)
    }
    const snap: any = await withTimeout(q.count().get() as Promise<any>, 3000)
    return Number(snap.data().count) || 0
  } catch (err: any) {
    console.warn(`[safeFirestore] count failed for "${collectionName}":`, err?.message || err)
    return 0
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

import { recursivelyOffloadBase64Media } from '@/lib/infra/media-offloader'

export async function safeSetDoc(collectionName: string, docId: string, data: any): Promise<void> {
  let cleanData = sanitizeFirestoreData(data)

  // Guard against Firestore 1MB (1,048,576 bytes) document size limit
  try {
    const payloadSize = Buffer.byteLength(JSON.stringify(cleanData))
    if (payloadSize > 800000) {
      console.warn(`[safeFirestore] Document "${collectionName}/${docId}" payload size (${payloadSize} bytes) is near 1MB limit. Offloading media...`)
      cleanData = await recursivelyOffloadBase64Media(cleanData, docId)
    }
  } catch (e) {
    // ignore byte size check errors
  }

  try {
    await withTimeout(adminFirestore.collection(collectionName).doc(docId).set(cleanData, { merge: true }), 2500)
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
