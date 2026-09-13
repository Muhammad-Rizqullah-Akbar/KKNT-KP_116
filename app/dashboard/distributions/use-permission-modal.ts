'use client'

import { useState } from 'react'
import { safeFetchJson } from '@/lib/infra/safe-fetch'
import type { FormAggregateDoc } from '@/lib/repositories/form-versions.repo'
import type { VersionItem } from './types'

interface PermissionToast {
  show: (msg: string) => void
}

interface UsePermissionModalParams {
  publishedForms: FormAggregateDoc[]
  toast: PermissionToast
  loadData: () => void
}

export function usePermissionModal({ publishedForms, toast, loadData }: UsePermissionModalParams) {
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false)
  const [permissionFormId, setPermissionFormId] = useState('')
  const [permissionAllowCadre, setPermissionAllowCadre] = useState(true)
  const [permissionVersions, setPermissionVersions] = useState<VersionItem[]>([])
  const [permissionActiveVersionId, setPermissionActiveVersionId] = useState('')
  const [isSavingPermission, setIsSavingPermission] = useState(false)
  const [isLoadingPermissionVersions, setIsLoadingPermissionVersions] = useState(false)

  const loadPermissionFormDetails = async (formId: string) => {
    if (!formId) return
    setIsLoadingPermissionVersions(true)
    try {
      const [formRes, verRes] = await Promise.all([
        safeFetchJson(`/api/forms/${formId}`),
        safeFetchJson(`/api/forms/${formId}/versions`),
      ])

      if (formRes.ok && formRes.data && formRes.data.form) {
        const formDetail = formRes.data.form
        setPermissionAllowCadre(formDetail.allowCadreDistribution !== false)
        setPermissionActiveVersionId(formDetail.activeVersionId || '')
      }

      if (verRes.ok && verRes.data && Array.isArray(verRes.data.versions)) {
        setPermissionVersions(verRes.data.versions)
      } else {
        setPermissionVersions([])
      }
    } catch (err) {
      toast.show('Gagal memuat detail versi formulir.')
    } finally {
      setIsLoadingPermissionVersions(false)
    }
  }

  const openPermissionModal = async (formIdToSelect?: string) => {
    setIsPermissionModalOpen(true)
    const targetId = formIdToSelect || (publishedForms.length > 0 ? publishedForms[0].formId : '')
    setPermissionFormId(targetId)
    if (targetId) {
      await loadPermissionFormDetails(targetId)
    }
  }

  const handleSavePermission = async () => {
    if (!permissionFormId) return
    setIsSavingPermission(true)
    try {
      const res = await safeFetchJson(`/api/forms/${permissionFormId}/permission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowCadreDistribution: permissionAllowCadre,
          activeVersionId: permissionActiveVersionId,
        }),
      })

      if (res.ok && res.data?.success) {
        toast.show('Izin & versi aktif distribusi berhasil diperbarui!')
        setIsPermissionModalOpen(false)
        loadData()
      } else {
        toast.show(res.error || 'Gagal memperbarui izin & versi.')
      }
    } catch (err) {
      toast.show('Gagal menyimpan ke server.')
    } finally {
      setIsSavingPermission(false)
    }
  }

  return {
    isPermissionModalOpen,
    setIsPermissionModalOpen,
    permissionFormId,
    setPermissionFormId,
    permissionAllowCadre,
    setPermissionAllowCadre,
    permissionVersions,
    permissionActiveVersionId,
    setPermissionActiveVersionId,
    isSavingPermission,
    isLoadingPermissionVersions,
    openPermissionModal,
    loadPermissionFormDetails,
    handleSavePermission,
  }
}
