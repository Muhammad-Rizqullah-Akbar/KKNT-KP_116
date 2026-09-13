// lib/firebase/repositories/forms.repo.ts

import {
  firestore,
} from '@/lib/infra/firebase-client'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import type {
  FormData,
  FormGroup,
} from './forms.types'
import {
  cleanFormData,
  deserializeFormData,
  deserializeQuestion,
} from './forms.serialize'

export type {
  FormValidation,
  FormStage,
  ScoringOverride,
  FormScoring,
  FormQuestion,
  FormData,
  FormGroup,
  FormResponse,
  DashboardStats,
} from './forms.types'

export {
  submitFormResponse,
  getAllResponses,
  getResponsesByFormId,
  getResponsesByFormCode,
  getResponsesByDateRange,
  deleteResponse,
} from './forms.responses.repo'

// ============ FORM CRUD ============

export const getForms = async (): Promise<FormData[]> => {
  try {
    const formsRef = collection(firestore, 'forms')
    const snapshot = await getDocs(formsRef)
    const legacyForms = snapshot.docs.map((doc) => deserializeFormData(doc))

    try {
      const v15Ref = collection(firestore, 'v1_5_forms')
      const v15Snap = await getDocs(v15Ref)
      v15Snap.docs.forEach((docSnap) => {
        if (!legacyForms.some((f) => f.id === docSnap.id)) {
          legacyForms.push(deserializeFormData(docSnap))
        }
      })
    } catch {
      // Gracefully ignore if v1_5_forms collection does not exist
    }

    return legacyForms
  } catch (error) {
    console.error('Error getting forms:', error)
    throw error
  }
}

export const getFormsByGroup = async (groupId: string): Promise<FormData[]> => {
  try {
    const formsRef = collection(firestore, 'forms')
    const q = query(formsRef, where('groupId', '==', groupId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => deserializeFormData(doc))
  } catch (error) {
    console.error('Error getting forms by group:', error)
    throw error
  }
}

export const getFormById = async (formId: string): Promise<FormData | null> => {
  try {
    const docRef = doc(firestore, 'forms', formId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return deserializeFormData(docSnap)
    }
    const v15Ref = doc(firestore, 'v1_5_forms', formId)
    const v15Snap = await getDoc(v15Ref)
    if (v15Snap.exists()) {
      return deserializeFormData(v15Snap)
    }
    return null
  } catch (error) {
    console.error('Error getting form by id:', error)
    throw error
  }
}

export const getFormByCode = async (code: string): Promise<FormData | null> => {
  try {
    const formsRef = collection(firestore, 'forms')
    const q = query(formsRef, where('code', '==', code))
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      return deserializeFormData(snapshot.docs[0])
    }
    const v15Ref = collection(firestore, 'v1_5_forms')
    const q15 = query(v15Ref, where('code', '==', code))
    const snap15 = await getDocs(q15)
    if (!snap15.empty) {
      return deserializeFormData(snap15.docs[0])
    }
    return null
  } catch (error) {
    console.error('Error getting form by code:', error)
    throw error
  }
}

export const getPublishedFormByCode = async (code: string): Promise<FormData | null> => {
  try {
    const formsRef = collection(firestore, 'forms')
    const q = query(
      formsRef,
      where('code', '==', code),
      where('status', '==', 'published')
    )
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      return deserializeFormData(snapshot.docs[0])
    }
    const v15Ref = collection(firestore, 'v1_5_forms')
    const q15 = query(
      v15Ref,
      where('code', '==', code),
      where('status', '==', 'published')
    )
    const snap15 = await getDocs(q15)
    if (!snap15.empty) {
      return deserializeFormData(snap15.docs[0])
    }
    return null
  } catch (error) {
    console.error('Error getting published form by code:', error)
    throw error
  }
}

export const createForm = async (
  formData: Omit<FormData, 'id' | 'createdAt' | 'updatedAt'>
): Promise<FormData> => {
  try {
    const formsRef = collection(firestore, 'forms')
    const cleanData = cleanFormData(formData)
    cleanData.createdAt = serverTimestamp()
    cleanData.updatedAt = serverTimestamp()

    const docRef = await addDoc(formsRef, cleanData)

    return {
      id: docRef.id,
      ...formData,
      questions: cleanData.questions.map((q: any) => deserializeQuestion(q)),
    }
  } catch (error) {
    console.error('Error creating form:', error)
    throw error
  }
}

export const updateForm = async (
  formId: string,
  formData: Partial<FormData>
): Promise<void> => {
  try {
    const docRef = doc(firestore, 'forms', formId)
    const cleanData = cleanFormData(formData)
    cleanData.updatedAt = serverTimestamp()
    delete cleanData.createdAt

    await updateDoc(docRef, cleanData)
  } catch (error) {
    console.error('Error updating form:', error)
    throw error
  }
}

export const deleteForm = async (formId: string): Promise<void> => {
  try {
    const docRef = doc(firestore, 'forms', formId)
    await deleteDoc(docRef)
    try {
      const v15Ref = doc(firestore, 'v1_5_forms', formId)
      await deleteDoc(v15Ref)
    } catch (_) {}
  } catch (error) {
    console.error('Error deleting form:', error)
    throw error
  }
}

export const updateFormStatus = async (
  formId: string,
  status: 'draft' | 'published' | 'archived'
): Promise<void> => {
  try {
    const docRef = doc(firestore, 'forms', formId)
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error updating form status:', error)
    throw error
  }
}

export const incrementFilledCount = async (formId: string): Promise<void> => {
  try {
    const docRef = doc(firestore, 'forms', formId)
    await updateDoc(docRef, {
      filledCount: increment(1),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error incrementing filled count:', error)
    throw error
  }
}

// ============ FORM GROUP CRUD ============

/**
 * @deprecated formGroups akan dihapus pada migrasi data (M3) — target struktur
 * tidak lagi memakai pengelompokan form terpisah (forms jadi self-contained).
 * Jangan pakai untuk fitur baru. Fungsi dipertahankan sementara agar dashboard lama tetap jalan.
 */
export const getFormGroups = async (): Promise<FormGroup[]> => {
  try {
    const groupsRef = collection(firestore, 'formGroups')
    const snapshot = await getDocs(groupsRef)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FormGroup[]
  } catch (error) {
    console.error('Error getting form groups:', error)
    throw error
  }
}

export const getFormGroupById = async (groupId: string): Promise<FormGroup | null> => {
  try {
    const docRef = doc(firestore, 'formGroups', groupId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FormGroup
    }
    return null
  } catch (error) {
    console.error('Error getting form group:', error)
    throw error
  }
}

export const getFormGroupByCode = async (code: string): Promise<FormGroup | null> => {
  try {
    const groupsRef = collection(firestore, 'formGroups')
    const q = query(groupsRef, where('code', '==', code))
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as FormGroup
    }
    return null
  } catch (error) {
    console.error('Error getting form group by code:', error)
    throw error
  }
}

export const createFormGroup = async (
  groupData: Omit<FormGroup, 'id' | 'createdAt' | 'updatedAt'>
): Promise<FormGroup> => {
  try {
    const groupsRef = collection(firestore, 'formGroups')

    const cleanData: any = {
      code: groupData.code || '',
      title: groupData.title || '',
      description: groupData.description || '',
      target: groupData.target || '',
      color: groupData.color || 'cyan',
      formCount: groupData.formCount || 0,
      createdBy: groupData.createdBy || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(groupsRef, cleanData)
    return { id: docRef.id, ...groupData }
  } catch (error) {
    console.error('Error creating form group:', error)
    throw error
  }
}

export const updateFormGroup = async (
  groupId: string,
  groupData: Partial<FormGroup>
): Promise<void> => {
  try {
    const docRef = doc(firestore, 'formGroups', groupId)
    const cleanData: any = { ...groupData, updatedAt: serverTimestamp() }
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) delete cleanData[key]
    })
    await updateDoc(docRef, cleanData)
  } catch (error) {
    console.error('Error updating form group:', error)
    throw error
  }
}

export const deleteFormGroup = async (groupId: string): Promise<void> => {
  try {
    const formsInGroup = await getFormsByGroup(groupId)
    for (const form of formsInGroup) {
      if (form.id) await deleteForm(form.id)
    }
    const docRef = doc(firestore, 'formGroups', groupId)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting form group:', error)
    throw error
  }
}
