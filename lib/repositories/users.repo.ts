import 'server-only'

import { adminAuth, adminFirestore } from '@/lib/infra/firebase-admin'
import { safeGetDoc, safeGetCollectionDocs } from '@/lib/repositories/safe-firestore'
import type { User, UserRole } from '@/lib/schemas'

/**
 * users.repo.ts — akses koleksi `users` (1 koleksi = 1 repo, SERVER-ONLY).
 * CRUD user via Admin SDK (Firestore profile + Firebase Auth record).
 */

const USERS_COLLECTION = 'users'

/** Ambil satu user profile by UID (1 read). */
export async function getUserByUid(uid: string): Promise<User | null> {
  const doc = await safeGetDoc(USERS_COLLECTION, uid)
  if (!doc?.data) return null
  return { uid: doc.id, ...doc.data } as User
}

/** List user by role (terindeks `role`). */
export async function getUsersByRole(role: UserRole): Promise<User[]> {
  const snap = await adminFirestore.collection(USERS_COLLECTION).where('role', '==', role).get()
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as User)
}

/** List kader milik partnership (terindeks `partnershipId`). */
export async function getUsersByPartnership(partnershipId: string): Promise<User[]> {
  const snap = await adminFirestore
    .collection(USERS_COLLECTION)
    .where('partnershipId', '==', partnershipId)
    .get()
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as User)
}

/** List semua user (hanya super_admin; kecil). */
export async function getAllUsers(): Promise<User[]> {
  const docs = await safeGetCollectionDocs(USERS_COLLECTION)
  return docs.map((d) => ({ uid: d.id, ...d.data }) as User)
}

/** Update role user (Firestore profile + Auth custom claim). */
export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await adminFirestore.collection(USERS_COLLECTION).doc(uid).set(
    { role, updatedAt: new Date().toISOString() },
    { merge: true }
  )
  // Sinkron custom claim agar session cookie berikutnya mencerminkan role baru.
  await adminAuth.setCustomUserClaims(uid, { role })
}

/** Hapus user (Auth record + Firestore profile). */
export async function deleteUser(uid: string): Promise<void> {
  try {
    await adminAuth.deleteUser(uid)
  } catch (err) {
    console.warn(`adminAuth deleteUser (${uid}) failed/bypassed:`, err)
  }
  await adminFirestore.collection(USERS_COLLECTION).doc(uid).delete()
}
