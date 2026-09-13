'use client'

import { useState } from 'react'
import { safeFetchJson } from '@/lib/infra/safe-fetch'
import type { DistributionDoc } from '@/lib/domain/distributions/distribution-types'
import type { DeleteTarget } from './types'

interface SelectionToast {
  show: (msg: string) => void
}

interface UseDistributionSelectionParams {
  filteredDistributions: DistributionDoc[]
  toast: SelectionToast
  loadData: () => void
}

export function useDistributionSelection({ filteredDistributions, toast, loadData }: UseDistributionSelectionParams) {
  const [selectedDistIds, setSelectedDistIds] = useState<string[]>([])
  const [deleteTargetDoc, setDeleteTargetDoc] = useState<DeleteTarget | null>(null)
  const [isExecutingDelete, setIsExecutingDelete] = useState(false)

  const toggleSelectDist = (distId: string) => {
    setSelectedDistIds((prev) =>
      prev.includes(distId) ? prev.filter((id) => id !== distId) : [...prev, distId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedDistIds.length === filteredDistributions.length) {
      setSelectedDistIds([])
    } else {
      setSelectedDistIds(filteredDistributions.map((distribution) => distribution.distributionId))
    }
  }

  const handleDeleteClick = (distId: string, code: string, title: string) => {
    setDeleteTargetDoc({ id: distId, code, title })
  }

  const handleBulkDeleteClick = () => {
    if (selectedDistIds.length === 0) return
    setDeleteTargetDoc({
      id: 'bulk',
      code: `${selectedDistIds.length} Kode Distribusi`,
      title: `${selectedDistIds.length} item yang dipilih`,
    })
  }

  const confirmDeleteDistribution = async () => {
    if (!deleteTargetDoc) return
    setIsExecutingDelete(true)
    try {
      if (deleteTargetDoc.id === 'bulk') {
        const idsToDelete = [...selectedDistIds]
        await Promise.all(
          idsToDelete.map((id) =>
            safeFetchJson(`/api/distributions/${id}`, { method: 'DELETE' })
          )
        )
        toast.show(`${idsToDelete.length} kode distribusi berhasil dihapus secara masal!`)
        setSelectedDistIds([])
      } else {
        const res = await safeFetchJson(`/api/distributions/${deleteTargetDoc.id}`, {
          method: 'DELETE',
        })
        if (res.ok && res.data) {
          toast.show(`Kode distribusi "${deleteTargetDoc.code}" berhasil dihapus.`)
          setSelectedDistIds((prev) => prev.filter((id) => id !== deleteTargetDoc.id))
        } else {
          toast.show(res.error || 'Gagal menghapus kode distribusi.')
        }
      }
      setDeleteTargetDoc(null)
      loadData()
    } catch (err: any) {
      toast.show(`Error: ${err.message}`)
    } finally {
      setIsExecutingDelete(false)
    }
  }

  return {
    selectedDistIds,
    setSelectedDistIds,
    deleteTargetDoc,
    setDeleteTargetDoc,
    isExecutingDelete,
    toggleSelectDist,
    toggleSelectAll,
    handleDeleteClick,
    handleBulkDeleteClick,
    confirmDeleteDistribution,
  }
}
