'use client'

import {
  createForm,
  updateForm,
  type FormData,
} from '@/lib/repositories/forms.repo'
import type {
  FlexibleQuestion,
  FormStage,
  FormValidation,
  FormScoring,
} from '@/features/form-builder/components/shared/ElementTypes'
import { generateFormCode } from './form-builder-utils'

type SaveFormParams = {
  formTitle: string
  elements: FlexibleQuestion[]
  formId: string | null
  userUid: string
  generatedCode: string
  validation: FormValidation
  stages: FormStage[]
  scoring: FormScoring
  setIsSaving: (v: boolean) => void
  setFormId: (v: string | null) => void
  setGeneratedCode: (v: string) => void
  showToast: (msg: string) => void
}

export async function saveForm(params: SaveFormParams): Promise<void> {
  const {
    formTitle, elements, formId, userUid, generatedCode, validation, stages, scoring,
    setIsSaving, setFormId, setGeneratedCode, showToast,
  } = params

  if (!formTitle.trim()) {
    alert('Judul formulir harus diisi!')
    return
  }
  if (elements.length === 0) {
    alert('Minimal harus ada 1 pertanyaan!')
    return
  }

  setIsSaving(true)

  try {
    const formCode = formId ? (generatedCode || generateFormCode()) : generateFormCode()

    const cleanElements = elements.map(el => ({
      id: el.id,
      question: el.question,
      description: el.description || '',
      required: el.required,
      order: el.order,
      media: el.media,
      answerType: el.answerType,
      config: el.config,
      isIdentifier: el.isIdentifier,
      identifierType: el.identifierType,
      scoring: el.scoring,
      stageId: el.stageId || null,
      overridePoints: el.overridePoints || null,
    }))

    const formData: Omit<FormData, 'id' | 'createdAt' | 'updatedAt'> = {
      title: formTitle,
      code: formCode,
      description: '',
      target: '',
      category: '',
      status: 'draft',
      questions: cleanElements as any,
      createdBy: userUid,
      filledCount: 0,
      validation: validation,
      stages: stages,
      scoring: scoring,
    }

    let result
    if (formId) {
      await updateForm(formId, formData)
      result = { id: formId }
    } else {
      result = await createForm(formData)
      setFormId(result.id || null)

      const url = new URL(window.location.href)
      url.searchParams.set('id', result.id || '')
      window.history.replaceState({}, '', url.toString())
    }

    setGeneratedCode(formCode)
    showToast(formId ? 'Formulir berhasil diperbarui!' : 'Formulir berhasil dibuat!')
  } catch (error: any) {
    console.error('Save error:', error)
    alert(error.message || 'Gagal menyimpan formulir')
  } finally {
    setIsSaving(false)
  }
}
