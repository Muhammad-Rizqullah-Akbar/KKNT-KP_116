import 'server-only'

import { adminFirestore } from '@/lib/firebaseAdmin'
import type { FormAccessDoc } from '@/lib/forms/v1_5/distributionTypes'

const FORM_ACCESS_COLLECTION = 'formAccess'

/**
 * Grants form access to a Cadre or Partnership subject.
 */
export async function grantFormAccessDoc(
  formId: string,
  subjectType: 'cadre' | 'partnership',
  subjectId: string,
  subjectName: string,
  sessionUid: string
): Promise<FormAccessDoc> {
  const accessId = `access_${formId}_${subjectType}_${subjectId}`
  const docRef = adminFirestore.collection(FORM_ACCESS_COLLECTION).doc(accessId)

  const now = new Date().toISOString()
  const accessData: FormAccessDoc = {
    accessId,
    formId,
    subjectType,
    subjectId,
    subjectName,
    permissions: ['distribute'],
    status: 'active',
    createdBy: sessionUid,
    createdAt: now,
    updatedAt: now,
  }

  await docRef.set(accessData)
  return accessData
}

/**
 * Revokes form access.
 */
export async function revokeFormAccessDoc(accessId: string): Promise<void> {
  const docRef = adminFirestore.collection(FORM_ACCESS_COLLECTION).doc(accessId)
  await docRef.update({
    status: 'revoked',
    updatedAt: new Date().toISOString(),
  })
}

/**
 * Checks if a Cadre or Partnership subject is authorized to distribute a specific form.
 */
export async function checkFormAccessDoc(
  formId: string,
  subjectType: 'cadre' | 'partnership',
  subjectId: string
): Promise<boolean> {
  const accessId = `access_${formId}_${subjectType}_${subjectId}`
  const docSnap = await adminFirestore.collection(FORM_ACCESS_COLLECTION).doc(accessId).get()

  if (!docSnap.exists) return false
  const data = docSnap.data() as FormAccessDoc
  return data.status === 'active' && data.permissions.includes('distribute')
}

/**
 * List all form access grants for a specific form or subject.
 */
export async function listFormAccessDoc(options?: {
  formId?: string
  subjectId?: string
}): Promise<FormAccessDoc[]> {
  let query: FirebaseAdmin.Firestore.Query = adminFirestore.collection(FORM_ACCESS_COLLECTION)

  if (options?.formId) {
    query = query.where('formId', '==', options.formId)
  }
  if (options?.subjectId) {
    query = query.where('subjectId', '==', options.subjectId)
  }

  const snapshot = await query.get()
  return snapshot.docs
    .map((d) => d.data() as FormAccessDoc)
    .filter((d) => d.status === 'active')
}
