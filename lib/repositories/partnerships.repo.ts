import { adminFirestore } from '@/lib/infra/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { safeGetDoc, safeGetCollectionDocs } from '@/lib/repositories/safe-firestore'
import type { Partnership } from '@/lib/schemas'

/**
 * partnerships.repo.ts — akses koleksi `partnerships` (first-class entity).
 * Dulu partnership tersimpan sebagai role di `users`; sekarang punya koleksi sendiri.
 * kaderCount di-denormalisasi untuk hindari count() mahal.
 */

const COLLECTION = 'partnerships'

/** Ambil satu partnership by ID (1 read). */
export async function getPartnership(partnershipId: string): Promise<Partnership | null> {
  const doc = await safeGetDoc(COLLECTION, partnershipId)
  if (!doc?.data) return null
  return { partnershipId: doc.id, ...doc.data } as Partnership
}

/** List semua partnership (kecil — 2 dokumen). */
export async function listPartnerships(): Promise<Partnership[]> {
  const docs = await safeGetCollectionDocs(COLLECTION)
  return docs.map((d) => ({ partnershipId: d.id, ...d.data }) as Partnership)
}

/** List partnership by type (terindeks `type`). */
export async function listPartnershipsByType(type: string): Promise<Partnership[]> {
  const snap = await adminFirestore.collection(COLLECTION).where('type', '==', type).get()
  return snap.docs.map((d) => ({ partnershipId: d.id, ...d.data() }) as Partnership)
}

/** Update counter kader (denorm) — dipanggil saat kader ditambah/dihapus. */
export async function updateKaderCount(partnershipId: string, delta: number): Promise<void> {
  const ref = adminFirestore.collection(COLLECTION).doc(partnershipId)
  await ref.set({ kaderCount: FieldValue.increment(delta) }, { merge: true })
}
