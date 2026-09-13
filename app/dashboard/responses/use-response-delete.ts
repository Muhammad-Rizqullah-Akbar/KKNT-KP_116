'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { safeFetchJson } from '@/lib/infra/safe-fetch'
import type { ResponseDoc } from '@/lib/domain/responses/response-types'

export function useResponseDelete() {
  const queryClient = useQueryClient()

  const [selectedResponse, setSelectedResponse] = useState<ResponseDoc | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedResponseIds, setSelectedResponseIds] = useState<string[]>([])
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const handleDeleteResponse = async () => {
    if (!selectedResponse?.responseId) return
    setIsDeleting(true)
    try {
      const res = await safeFetchJson(`/api/responses?id=${selectedResponse.responseId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(res.error || 'Gagal menghapus tanggapan.')

      queryClient.setQueryData(['dashboard', 'responses'], (old: any) => {
        if (!old) return old
        return { ...old, responses: old.responses.filter((r: ResponseDoc) => r.responseId !== selectedResponse.responseId) }
      })
      setSelectedResponseIds((prev) => prev.filter((id) => id !== selectedResponse.responseId))
      setIsDeleteModalOpen(false)
      setSelectedResponse(null)
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDeleteResponses = async () => {
    if (selectedResponseIds.length === 0) return
    setIsBulkDeleting(true)
    try {
      const res = await safeFetchJson('/api/responses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedResponseIds }),
      })
      if (!res.ok) throw new Error(res.error || 'Gagal menghapus tanggapan terpilih.')

      queryClient.setQueryData(['dashboard', 'responses'], (old: any) => {
        if (!old) return old
        return { ...old, responses: old.responses.filter((r: ResponseDoc) => !selectedResponseIds.includes(r.responseId)) }
      })
      setSelectedResponseIds([])
      setIsBulkDeleteModalOpen(false)
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleSelectResponseToggle = (id: string) => {
    setSelectedResponseIds((prev) =>
      prev.includes(id) ? prev.filter((respId) => respId !== id) : [...prev, id]
    )
  }

  return {
    selectedResponse,
    setSelectedResponse,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeleting,
    selectedResponseIds,
    isBulkDeleteModalOpen,
    setIsBulkDeleteModalOpen,
    isBulkDeleting,
    handleDeleteResponse,
    handleBulkDeleteResponses,
    handleSelectResponseToggle,
  }
}
