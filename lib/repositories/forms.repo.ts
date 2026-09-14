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
    return snapshot.docs.map((doc) => deserializeFormData(doc))
  } catch (error) {
    console.error('Error getting forms:', error)
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

