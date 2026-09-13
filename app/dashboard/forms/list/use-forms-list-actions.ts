'use client'

import { useQueryClient } from '@tanstack/react-query'
import { safeFetchJson } from '@/lib/infra/safe-fetch'
import type { FormAggregateDoc } from '@/lib/repositories/form-versions.repo'
import type { FormsListData } from './use-forms-list-data'

// Seluruh action handlers (CRUD, permission, version) untuk daftar formulir.
export function useFormsListActions(data: FormsListData) {
  const {
    router, fetchForms, showToast,
    editingTitleForm, setEditingTitleForm,
    editTitleInput, editDescriptionInput, editCategoryInput, editTargetInput,
    setIsUpdatingTitle, setIsTogglingCadrePerm, setIsCreatingNewVersion,
    selectedFormIds, setSelectedFormIds,
    formToDelete, setFormToDelete,
    isBulkDeleteModalOpen, setIsBulkDeleteModalOpen,
    setIsDeletingForm,
    distributionModalForm, setDistributionModalForm,
    editConfirmForm, setEditConfirmForm,
    newTitle, newDescription, newCategory, newTarget, newKind,
    setIsCreateModalOpen, setIsCreating,
    duplicatingFormId, setDuplicatingFormId,
    activeMenuFormId, setActiveMenuFormId,
  } = data

  const queryClient = useQueryClient()

  const handleOpenEditTitleModal = (form: FormAggregateDoc) => {
    setEditingTitleForm(form)
    data.setEditTitleInput(form.metadata?.title || '')
    data.setEditDescriptionInput(form.metadata?.description || '')
    data.setEditCategoryInput(form.metadata?.category || 'Umum')
    data.setEditTargetInput(form.metadata?.target || 'Umum')
    setActiveMenuFormId(null)
  }

  const handleSaveTitleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTitleForm || !editTitleInput.trim()) return
    setIsUpdatingTitle(true)
    try {
      const res = await safeFetchJson(`/api/forms/${editingTitleForm.formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            title: editTitleInput.trim(),
            description: editDescriptionInput.trim(),
            category: editCategoryInput.trim(),
            target: editTargetInput.trim(),
          },
        }),
      })

      if (res.ok && res.data?.success) {
        showToast('Nama formulir berhasil diperbarui tanpa mengubah versi!')
        setEditingTitleForm(null)
        fetchForms()
      } else {
        showToast(res.error || 'Gagal memperbarui nama formulir.')
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    } finally {
      setIsUpdatingTitle(false)
    }
  }

  const handleSelectFormToggle = (formId: string) => {
    setSelectedFormIds((prev) =>
      prev.includes(formId) ? prev.filter((id) => id !== formId) : [...prev, formId]
    )
  }

  const handleSelectAllToggle = (availableForms: FormAggregateDoc[]) => {
    const allIds = availableForms.map((form) => form.formId)
    if (selectedFormIds.length === allIds.length && allIds.length > 0) {
      setSelectedFormIds([])
    } else {
      setSelectedFormIds(allIds)
    }
  }

  const handleConfirmDeleteSingle = async () => {
    if (!formToDelete) return
    setIsDeletingForm(true)
    try {
      const res = await safeFetchJson(`/api/forms/${formToDelete.formId}`, {
        method: 'DELETE',
      })
      if (res.ok && res.data?.success) {
        showToast(`Formulir "${formToDelete.metadata?.title || formToDelete.formId}" berhasil dihapus secara permanen.`)
        setSelectedFormIds((prev) => prev.filter((id) => id !== formToDelete.formId))
        setFormToDelete(null)
        fetchForms()
      } else {
        showToast(res.error || 'Gagal menghapus formulir.')
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    } finally {
      setIsDeletingForm(false)
    }
  }

  const handleConfirmBulkDelete = async () => {
    if (selectedFormIds.length === 0) return
    setIsDeletingForm(true)
    try {
      const deletePromises = selectedFormIds.map((id) =>
        safeFetchJson(`/api/forms/${id}`, { method: 'DELETE' })
      )
      await Promise.all(deletePromises)
      showToast(`${selectedFormIds.length} formulir terpilih berhasil dihapus secara massal!`)
      setSelectedFormIds([])
      setIsBulkDeleteModalOpen(false)
      fetchForms()
    } catch (err: any) {
      showToast(`Error menghapus massal: ${err.message}`)
    } finally {
      setIsDeletingForm(false)
    }
  }

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    setIsCreating(true)
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            title: newTitle.trim(),
            description: newDescription.trim() || 'Tuliskan deskripsi dan petunjuk pengisian formulir di sini...',
            category: newCategory,
            target: newTarget,
            kind: newKind,
            status: 'draft',
          },
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal membuat formulir baru.')
      }

      showToast('Formulir V1.5 baru berhasil dibuat!')
      setIsCreateModalOpen(false)
      data.setNewTitle('')
      data.setNewDescription('')
      router.push(`/dashboard/forms/${data.form.formId}/builder`)
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleCadrePerm = async (form: FormAggregateDoc) => {
    const currentVal = form.allowCadreDistribution !== false
    const newVal = !currentVal
    setIsTogglingCadrePerm(true)
    try {
      const res = await safeFetchJson(`/api/forms/${form.formId}/permission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowCadreDistribution: newVal }),
      })

      if (res.ok && res.data?.success) {
        showToast(`Izin distribusi kader & mitra untuk "${form.metadata?.title || form.formId}" diubah menjadi: ${newVal ? 'DIIZINKAN' : 'DIBATASI'}`)
        queryClient.setQueryData<FormAggregateDoc[]>(['forms', 'list'], (prev) =>
          (prev ?? []).map((item) =>
            item.formId === form.formId
              ? { ...item, allowCadreDistribution: newVal, metadata: { ...item.metadata, allowCadreDistribution: newVal } }
              : item
          )
        )
        if (distributionModalForm?.formId === form.formId) {
          setDistributionModalForm({
            ...distributionModalForm,
            allowCadreDistribution: newVal,
            metadata: { ...distributionModalForm.metadata, allowCadreDistribution: newVal },
          })
        }
      } else {
        showToast(res.error || 'Gagal mengubah izin distribusi.')
      }
    } catch (err) {
      showToast('Gagal mengubah izin distribusi.')
    } finally {
      setIsTogglingCadrePerm(false)
    }
  }

  const confirmAndEditNewVersion = async () => {
    if (!editConfirmForm) return
    const formId = editConfirmForm.formId
    setIsCreatingNewVersion(true)
    try {
      const res = await safeFetchJson(`/api/forms/${formId}/new-version`, { method: 'POST' })
      if (res.ok && res.data?.success) {
        showToast(`Draft versi baru (${res.data.form?.activeVersionNumber || 2}.0) berhasil dibuat! Membuka Form Builder...`)
        setEditConfirmForm(null)
        router.push(`/dashboard/forms/${formId}/builder`)
      } else {
        showToast(res.error || 'Gagal membuat versi draft baru.')
      }
    } catch (err: any) {
      showToast('Gagal terhubung ke server.')
    } finally {
      setIsCreatingNewVersion(false)
    }
  }

  const handleDuplicateForm = async (formId: string) => {
    setDuplicatingFormId(formId)
    setActiveMenuFormId(null)
    try {
      const res = await fetch(`/api/forms/${formId}/duplicate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menduplikat formulir.')
      }
      showToast(`Formulir "${data.form.metadata?.title || 'Baru'}" berhasil diduplikat!`)
      fetchForms()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    } finally {
      setDuplicatingFormId(null)
    }
  }

  const handleArchiveForm = async (formId: string) => {
    setActiveMenuFormId(null)
    if (!confirm(`Apakah Anda yakin ingin mengarsipkan formulir "${formId}"?`)) return

    try {
      const res = await fetch(`/api/forms/${formId}/archive`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal mengarsipkan formulir.')

      showToast('Formulir berhasil diarsipkan.')
      fetchForms()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    }
  }

  const handleRestoreForm = async (formId: string) => {
    setActiveMenuFormId(null)
    try {
      const res = await fetch(`/api/forms/${formId}/restore`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal memulihkan formulir.')

      showToast('Formulir berhasil dipulihkan ke workflow aktif.')
      fetchForms()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    }
  }

  const handleResponses = (formId: string) => {
    router.push(`/dashboard/responses?formId=${formId}`)
  }

  return {
    handleOpenEditTitleModal,
    handleSaveTitleSubmit,
    handleSelectFormToggle,
    handleSelectAllToggle,
    handleConfirmDeleteSingle,
    handleConfirmBulkDelete,
    handleCreateForm,
    handleToggleCadrePerm,
    confirmAndEditNewVersion,
    handleDuplicateForm,
    handleArchiveForm,
    handleRestoreForm,
    handleResponses,
  }
}

export type FormsListActions = ReturnType<typeof useFormsListActions>
