// lib/repositories/forms.responses.repo.ts

import {
  firestore,
} from '@/lib/infra/firebase-client'
import {
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  orderBy,
  doc,
  getDocs,
  limit,
} from 'firebase/firestore'
import type { FormResponse } from './forms.types'

export const submitFormResponse = async (
  formId: string,
  formCode: string,
  formTitle: string,
  answers: Record<string, any>,
  questions?: { id: string; question: string; type?: string; answerType?: string; config?: any; label?: string }[],
  respondentName?: string,
  respondentEmail?: string,
  metadata?: { userAgent?: string; ipAddress?: string }
): Promise<string> => {
  try {
    const responsesRef = collection(firestore, 'responses')

    let formattedAnswers: Record<string, any> = {}

    if (questions && questions.length > 0) {
      questions.forEach(q => {
        const type = q.answerType || q.type || 'short-text'
        const questionText = q.question || q.label || `Pertanyaan ${q.id}`

        if (type === 'indicator-table' || type === 'likert') {
          const indicators = q.config?.indicators || []
          const statements = q.config?.statements || (q as any).options || []

          const tableAnswers: Record<string, string> = {}
          let hasValue = false

          const rows = indicators.length > 0
            ? indicators.map((ind: any) => ind.label || ind)
            : statements

          rows.forEach((row: string, i: number) => {
            const rowKey = `${q.id}-${i}`
            const value = answers[rowKey]
            if (value && value !== '') {
              tableAnswers[row] = value
              hasValue = true
            }
          })

          if (hasValue) {
            formattedAnswers[questionText] = tableAnswers
          }
        }
        else if (type === 'signature') {
          const value = answers[q.id]
          if (value && value !== '' && value !== null) {
            formattedAnswers[questionText] = value
          }
        }
        else if (type === 'multiple-choice') {
          let value = answers[q.id]
          if (Array.isArray(value)) {
            value = value.filter((v: string) => v !== '')
          }
          if (value !== undefined && value !== null && (!Array.isArray(value) || value.length > 0)) {
            formattedAnswers[questionText] = value
          }
        }
        else if (type === 'rating') {
          const value = answers[q.id]
          if (value !== undefined && value !== null && value !== '' && value !== 0) {
            formattedAnswers[questionText] = `${value}/${q.config?.ratingMax || 5}`
          }
        }
        else if (type === 'number') {
          const value = answers[q.id]
          if (value !== undefined && value !== null && value !== '') {
            formattedAnswers[questionText] = Number(value)
          }
        }
        else if (type === 'date') {
          const value = answers[q.id]
          if (value && value !== '') {
            formattedAnswers[questionText] = value
          }
        }
        else if (type === 'file-upload') {
          const value = answers[q.id]
          if (value && value !== '') {
            formattedAnswers[questionText] = value
          }
        }
        else if (type !== 'image') {
          const value = answers[q.id]
          if (value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
            formattedAnswers[questionText] = value
          }
        }
      })
    } else {
      formattedAnswers = answers
    }

    if (Object.keys(formattedAnswers).length === 0) {
      formattedAnswers = answers
    }

    const responseData: Omit<FormResponse, 'id'> = {
      formId,
      formCode,
      formTitle,
      answers: formattedAnswers,
      respondentName: respondentName || '',
      respondentEmail: respondentEmail || '',
      submittedAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
      ...metadata,
    }

    const docRef = await addDoc(responsesRef, responseData)
    return docRef.id
  } catch (error) {
    console.error('Error submitting form response:', error)
    throw error
  }
}

/**
 * CATATAN BIAYA: batas default diturunkan dari 1000 -> 200.
 * Pemanggil yang butuh lebih harus menyebutkan jumlah eksplisit,
 * agar tidak terjadi full-scan diam-diam saat data membesar.
 */
export const getAllResponses = async (limitCount: number = 200): Promise<FormResponse[]> => {
  try {
    const safeLimit = Math.max(1, Math.min(Number(limitCount) || 200, 1000))
    const responsesRef = collection(firestore, 'responses')
    const q = query(responsesRef, orderBy('submittedAt', 'desc'), limit(safeLimit))
    const snapshot = await getDocs(q)
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FormResponse[]

    list.sort((a, b) => {
      const tA = new Date(a.submittedAt || (a as any).createdAt || 0).getTime()
      const tB = new Date(b.submittedAt || (b as any).createdAt || 0).getTime()
      return tB - tA
    })

    return list
  } catch (error) {
    console.error('Error getting all responses:', error)
    throw error
  }
}

export const getResponsesByFormId = async (formId: string): Promise<FormResponse[]> => {
  try {
    const responsesRef = collection(firestore, 'responses')
    const q = query(
      responsesRef,
      where('formId', '==', formId),
      orderBy('submittedAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FormResponse[]
  } catch (error) {
    console.error('Error getting responses by form id:', error)
    throw error
  }
}

export const getResponsesByFormCode = async (formCode: string): Promise<FormResponse[]> => {
  try {
    const responsesRef = collection(firestore, 'responses')
    const q = query(
      responsesRef,
      where('formCode', '==', formCode),
      orderBy('submittedAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FormResponse[]
  } catch (error) {
    console.error('Error getting responses by form code:', error)
    throw error
  }
}

export const getResponsesByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<FormResponse[]> => {
  try {
    const responsesRef = collection(firestore, 'responses')
    const q = query(
      responsesRef,
      where('submittedAt', '>=', startDate.toISOString()),
      where('submittedAt', '<=', endDate.toISOString()),
      orderBy('submittedAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FormResponse[]
  } catch (error) {
    console.error('Error getting responses by date range:', error)
    throw error
  }
}

export const deleteResponse = async (responseId: string): Promise<void> => {
  try {
    const docRef = doc(firestore, 'responses', responseId)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting response:', error)
    throw error
  }
}
