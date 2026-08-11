import { safeGetDoc, safeGetCollectionDocs, safeSetDoc } from './safeFirestore'
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

  await safeSetDoc(FORM_ACCESS_COLLECTION, accessId, accessData)
  return accessData
}

/**
 * Revokes form access.
 */
export async function revokeFormAccessDoc(accessId: string): Promise<void> {
  const existing = await safeGetDoc(FORM_ACCESS_COLLECTION, accessId)
  if (existing) {
    const updated = {
      ...existing.data,
      status: 'revoked',
      updatedAt: new Date().toISOString(),
    }
    await safeSetDoc(FORM_ACCESS_COLLECTION, accessId, updated)
  }
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
  const docObj = await safeGetDoc(FORM_ACCESS_COLLECTION, accessId)

  if (!docObj) return false
  const data = docObj.data as FormAccessDoc
  return data.status === 'active' && data.permissions?.includes('distribute')
}

/**
 * List all form access grants for a specific form or subject.
 */
export async function listFormAccessDoc(options?: {
  formId?: string
  subjectId?: string
}): Promise<FormAccessDoc[]> {
  const rawDocs = await safeGetCollectionDocs(FORM_ACCESS_COLLECTION)
  let docs = rawDocs.map((d) => d.data as FormAccessDoc).filter((d) => d.status === 'active')

  if (options?.formId) {
    docs = docs.filter((d) => d.formId === options.formId)
  }
  if (options?.subjectId) {
    docs = docs.filter((d) => d.subjectId === options.subjectId)
  }

  return docs
}
