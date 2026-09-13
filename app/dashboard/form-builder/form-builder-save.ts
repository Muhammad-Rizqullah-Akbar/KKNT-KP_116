'use client'

import {
  createForm,
  updateForm,
  createFormGroup,
  type FormData,
  type FormGroup,
} from '@/lib/repositories/forms.repo'
import type {
  FlexibleQuestion,
  FormStage,
  FormValidation,
  FormScoring,
} from '@/features/form-builder/components/shared/ElementTypes'
import { generateFormCode } from './form-builder-utils'
import type { NewGroupData } from './use-form-builder'

type SaveFormParams = {
  formTitle: string
  elements: FlexibleQuestion[]
  selectedGroup: string
  isNewGroup: boolean
  newGroupData: NewGroupData
  groups: FormGroup[]
  formId: string | null
  userUid: string
  generatedCode: string
  validation: FormValidation
  stages: FormStage[]
  scoring: FormScoring
  setIsSaving: (v: boolean) => void
  setFormId: (v: string | null) => void
  setGroups: (v: FormGroup[]) => void
  setSelectedGroup: (v: string) => void
  setIsNewGroup: (v: boolean) => void
  resetGroupForm: () => void
  setGeneratedCode: (v: string) => void
  showToast: (msg: string) => void
}

export async function saveForm(params: SaveFormParams): Promise<void> {
  const {
    formTitle, elements, selectedGroup, isNewGroup, newGroupData, groups,
    formId, userUid, generatedCode, validation, stages, scoring,
    setIsSaving, setFormId, setGroups, setSelectedGroup, setIsNewGroup,
    resetGroupForm, setGeneratedCode, showToast,
  } = params

  if (!formTitle.trim()) {
    alert('Judul formulir harus diisi!')
    return
  }
  if (elements.length === 0) {
    alert('Minimal harus ada 1 pertanyaan!')
    return
  }
  if (isNewGroup) {
    if (!newGroupData.title.trim()) {
      alert('Nama group harus diisi!')
      return
    }
    if (!newGroupData.target.trim()) {
      alert('Target group harus diisi!')
      return
    }
  }

  setIsSaving(true)

  try {
    let groupId = selectedGroup
    let groupCode: string | null = null

    if (isNewGroup && selectedGroup === 'new') {
      const newGroup = await createFormGroup({
        code: `${newGroupData.title.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`,
        title: newGroupData.title,
        description: newGroupData.description || `${newGroupData.title} - Group`,
        target: newGroupData.target,
        color: newGroupData.color,
        formCount: 1,
        createdBy: userUid,
      })
      groupId = newGroup.id
      groupCode = newGroup.code
      setGroups([...groups, newGroup])
      setSelectedGroup(newGroup.id || '')
      setIsNewGroup(false)
      resetGroupForm()
    } else if (selectedGroup) {
      const group = groups.find(group => group.id === selectedGroup)
      groupCode = group?.code || null
    }

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
      target: newGroupData.target || '',
      category: '',
      status: 'draft',
      questions: cleanElements as any,
      groupId: groupId || null,
      groupCode: groupCode,
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
