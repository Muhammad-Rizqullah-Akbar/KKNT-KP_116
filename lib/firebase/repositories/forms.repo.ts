// lib/firebase/repositories/forms.repo.ts

import { 
  firestore,
} from '@/lib/firebaseClient'
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
  orderBy,
  type DocumentData,
} from 'firebase/firestore'

// ============ TYPES ============

// ===== NEW: Validation Type =====
export interface FormValidation {
  mode: 'all_required' | 'all_required_except' | 'free'
  exceptions: string[]
  allowOverride: boolean
}

// ===== NEW: Stage Type =====
export interface FormStage {
  id: string
  name: string
  order: number
  questionIds: string[]
}

// ===== NEW: Scoring Override Type =====
export interface ScoringOverride {
  points: number
  defaultPoints: number
  reason?: string
}

// ===== NEW: Scoring Type =====
export interface FormScoring {
  totalPoints: number
  mode: 'auto' | 'hybrid' | 'manual'
  distribution: Record<string, number>
  overrides: Record<string, ScoringOverride>
  allowOverride: boolean
  autoBalance: boolean
  lastBalancedAt?: string
}

export interface FormQuestion {
  id: string
  type: 'binary' | 'single-choice' | 'multiple-choice' | 'image' | 'likert' | 'text' | 'textarea' | 'indicator-table' | 'signature' | 'rating' | 'date' | 'number' | 'file-upload' | 'short-text' | 'long-text' | 'dropdown'
  label?: string
  question: string
  description?: string
  options?: string[]
  required?: boolean
  imageUrl?: string
  rowIndex?: number
  order?: number
  answerType?: string
  media?: {
    type: string
    url?: string
    caption?: string
  }
  config?: Record<string, any>
  isIdentifier?: boolean
  identifierType?: string
  scoring?: {
    scheme: string
    weight: number
  }
  statements?: string[]
  scale?: number
  indicators?: { id: string; label: string; weight?: number }[]
  indicatorScales?: { value: number; label: string }[]
  indicatorTitle?: string
  showTotalScore?: boolean
  showWeightedScore?: boolean
  ratingMax?: number
  signatureWidth?: number
  signatureHeight?: number
  signaturePenColor?: string
  signatureBgColor?: string
  signatureLabel?: string
  placeholder?: string
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  step?: number
  fileTypes?: string[]
  maxFileSize?: number
  dateFormat?: string
  // ===== NEW FIELDS =====
  stageId?: string | null
  overridePoints?: number | null
}

export interface FormData {
  id?: string
  title: string
  code: string
  description?: string
  target?: string
  category?: string
  status: 'draft' | 'published' | 'archived'
  groupId?: string | null
  groupCode?: string | null
  questions: FormQuestion[]
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  filledCount?: number
  
  // ===== NEW FIELDS =====
  validation?: FormValidation
  stages?: FormStage[]
  scoring?: FormScoring
}

export interface FormGroup {
  id: string
  code: string
  title: string
  description: string
  target: string
  color: string
  formCount: number
  createdAt?: string
  updatedAt?: string
  createdBy?: string
}

export interface FormResponse {
  id?: string
  formId: string
  formCode: string
  formTitle: string
  answers: Record<string, any>
  respondentName?: string
  respondentEmail?: string
  submittedAt?: string
  createdAt?: any
  userAgent?: string
  ipAddress?: string
}

export interface DashboardStats {
  totalForms: number
  activeForms: number
  totalResponses: number
  averageScore: number
  totalGroups: number
}

// ============ HELPERS ============

const generateId = () => Math.random().toString(36).substring(2, 9)

const serializeQuestion = (q: any): any => {
  const config = q.config || {}
  
  return {
    id: q.id || generateId(),
    question: q.question || '',
    description: q.description || '',
    required: q.required || false,
    order: q.order ?? 0,
    media: {
      type: q.media?.type || 'none',
      url: q.media?.url || '',
      caption: q.media?.caption || '',
    },
    answerType: q.answerType || 'short-text',
    config: {
      options: config.options || [],
      correctAnswer: config.correctAnswer || '',
      placeholder: config.placeholder || '',
      minLength: config.minLength || 0,
      maxLength: config.maxLength || 200,
      min: config.min ?? 0,
      max: config.max ?? 100,
      step: config.step ?? 1,
      indicators: config.indicators || [],
      indicatorScales: config.indicatorScales || [],
      indicatorColumns: config.indicatorColumns || 5,
      showTotalScore: config.showTotalScore || false,
      showWeightedScore: config.showWeightedScore || false,
      indicatorTitle: config.indicatorTitle || 'Pertanyaan',
      ratingMin: config.ratingMin || 1,
      ratingMax: config.ratingMax || 5,
      dateFormat: config.dateFormat || 'DD/MM/YYYY',
      fileTypes: config.fileTypes || ['image/*', 'application/pdf'],
      maxFileSize: config.maxFileSize || 5,
      signatureWidth: config.signatureWidth || 400,
      signatureHeight: config.signatureHeight || 200,
      signaturePenColor: config.signaturePenColor || '#000000',
      signatureBgColor: config.signatureBgColor || '#ffffff',
      signatureLabel: config.signatureLabel || 'Tanda Tangan',
    },
    isIdentifier: q.isIdentifier || false,
    identifierType: q.identifierType || 'none',
    scoring: {
      scheme: q.scoring?.scheme || 'none',
      weight: q.scoring?.weight || 1,
    },
    // ===== NEW FIELDS =====
    stageId: q.stageId || null,
    overridePoints: q.overridePoints || null,
  }
}

const deserializeQuestion = (q: any): any => {
  const config = q.config || {}
  const answerType = q.answerType || q.type || 'short-text'
  
  return {
    id: q.id || generateId(),
    question: q.question || q.label || '',
    description: q.description || '',
    required: q.required || false,
    order: q.order ?? q.rowIndex ?? 0,
    media: {
      type: q.media?.type || 'none',
      url: q.media?.url || q.imageUrl || '',
      caption: q.media?.caption || '',
    },
    answerType: answerType,
    config: {
      options: config.options || q.options || [],
      correctAnswer: config.correctAnswer || '',
      placeholder: config.placeholder || '',
      minLength: config.minLength || 0,
      maxLength: config.maxLength || 200,
      min: config.min ?? 0,
      max: config.max ?? 100,
      step: config.step ?? 1,
      indicators: config.indicators || [],
      indicatorScales: config.indicatorScales || [],
      indicatorColumns: config.indicatorColumns || 5,
      showTotalScore: config.showTotalScore || false,
      showWeightedScore: config.showWeightedScore || false,
      indicatorTitle: config.indicatorTitle || 'Pertanyaan',
      ratingMin: config.ratingMin || 1,
      ratingMax: config.ratingMax || 5,
      dateFormat: config.dateFormat || 'DD/MM/YYYY',
      fileTypes: config.fileTypes || ['image/*', 'application/pdf'],
      maxFileSize: config.maxFileSize || 5,
      signatureWidth: config.signatureWidth || 400,
      signatureHeight: config.signatureHeight || 200,
      signaturePenColor: config.signaturePenColor || '#000000',
      signatureBgColor: config.signatureBgColor || '#ffffff',
      signatureLabel: config.signatureLabel || 'Tanda Tangan',
      statements: config.statements || q.statements || [],
      scale: config.scale || q.scale || 5,
    },
    isIdentifier: q.isIdentifier || false,
    identifierType: q.identifierType || 'none',
    scoring: {
      scheme: q.scoring?.scheme || 'none',
      weight: q.scoring?.weight || 1,
    },
    // ===== NEW FIELDS =====
    stageId: q.stageId || null,
    overridePoints: q.overridePoints || null,
  }
}

const cleanFormData = (data: any): any => {
  const clean: any = {}
  
  clean.title = data.title || ''
  clean.code = data.code || ''
  clean.status = data.status || 'draft'
  
  if (data.questions) {
    clean.questions = data.questions.map((q: any) => serializeQuestion(q))
  } else {
    clean.questions = []
  }
  
  clean.description = data.description || ''
  clean.target = data.target || ''
  clean.category = data.category || ''
  clean.groupId = data.groupId || null
  clean.groupCode = data.groupCode || null
  clean.createdBy = data.createdBy || ''
  clean.filledCount = data.filledCount || 0
  
  // ===== NEW FIELDS =====
  if (data.validation) {
    clean.validation = data.validation
  }
  if (data.stages) {
    clean.stages = data.stages
  }
  if (data.scoring) {
    clean.scoring = data.scoring
  }
  
  return clean
}

const deserializeFormData = (doc: any): FormData => {
  const data = doc.data ? doc.data() : doc
  const docId = doc.id || data.id
  
  return {
    id: docId,
    title: data.title || '',
    code: data.code || '',
    description: data.description || '',
    target: data.target || '',
    category: data.category || '',
    status: data.status || 'draft',
    groupId: data.groupId || null,
    groupCode: data.groupCode || null,
    questions: (data.questions || []).map((q: any) => deserializeQuestion(q)),
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || '',
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || '',
    createdBy: data.createdBy || '',
    filledCount: data.filledCount || 0,
    // ===== NEW FIELDS =====
    validation: data.validation || { mode: 'all_required', exceptions: [], allowOverride: true },
    stages: data.stages || [{ id: 'default', name: 'Semua Pertanyaan', order: 0, questionIds: [] }],
    scoring: data.scoring || { totalPoints: 100, mode: 'auto', distribution: {}, overrides: {}, allowOverride: true, autoBalance: true },
  }
}

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

// ============ FORM GROUP CRUD ============

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

// ============ RESPONSES CRUD ============

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
        
        // ========== INDIKATOR TABLE / LIKERT ==========
        if (type === 'indicator-table' || type === 'likert') {
          const indicators = q.config?.indicators || []
          const statements = q.config?.statements || q.options || []
          
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
        // ========== SIGNATURE ==========
        else if (type === 'signature') {
          const value = answers[q.id]
          if (value && value !== '' && value !== null) {
            formattedAnswers[questionText] = value
          }
        }
        // ========== MULTIPLE CHOICE ==========
        else if (type === 'multiple-choice') {
          let value = answers[q.id]
          if (Array.isArray(value)) {
            value = value.filter((v: string) => v !== '')
          }
          if (value !== undefined && value !== null && (!Array.isArray(value) || value.length > 0)) {
            formattedAnswers[questionText] = value
          }
        }
        // ========== RATING ==========
        else if (type === 'rating') {
          const value = answers[q.id]
          if (value !== undefined && value !== null && value !== '' && value !== 0) {
            formattedAnswers[questionText] = `${value}/${q.config?.ratingMax || 5}`
          }
        }
        // ========== NUMBER ==========
        else if (type === 'number') {
          const value = answers[q.id]
          if (value !== undefined && value !== null && value !== '') {
            formattedAnswers[questionText] = Number(value)
          }
        }
        // ========== DATE ==========
        else if (type === 'date') {
          const value = answers[q.id]
          if (value && value !== '') {
            formattedAnswers[questionText] = value
          }
        }
        // ========== FILE UPLOAD ==========
        else if (type === 'file-upload') {
          const value = answers[q.id]
          if (value && value !== '') {
            formattedAnswers[questionText] = value
          }
        }
        // ========== LAINNYA (single-choice, dropdown, short-text, long-text, binary) ==========
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

export const getAllResponses = async (): Promise<FormResponse[]> => {
  try {
    const responsesRef = collection(firestore, 'responses')
    const q = query(responsesRef, orderBy('submittedAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FormResponse[]
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