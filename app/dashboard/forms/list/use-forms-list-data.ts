'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/infra/safe-fetch'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/lib/hooks/use-toast'
import type { FormAggregateDoc } from '@/lib/repositories/form-versions.repo'
import {
  deriveCategories,
  computeTabCounts,
  filterForms,
  type LifecycleTab,
  type ViewMode,
  type SortBy,
} from './forms-utils'

// Server-state (query) + seluruh UI state + derived data untuk halaman daftar formulir.
export function useFormsListData() {
  const router = useRouter()
  const { userRole } = useAuth()
  const isGlobalRole = ['super_admin'].includes(userRole || '')

  const formsQuery = useQuery<FormAggregateDoc[]>({
    queryKey: queryKeys.forms.list,
    queryFn: async () => {
      const [formsRes, distRes, respRes] = await Promise.all([
        safeFetchJson('/api/forms'),
        safeFetchJson('/api/distributions'),
        safeFetchJson('/api/responses'),
      ])

      if (!(formsRes.ok && formsRes.data && Array.isArray(formsRes.data.forms))) {
        throw new Error(formsRes.error || 'Gagal memuat daftar formulir.')
      }

      const allDists: any[] = distRes.ok && distRes.data && Array.isArray(distRes.data.distributions) ? distRes.data.distributions : []
      const allResps: any[] = respRes.ok && respRes.data && Array.isArray(respRes.data.responses) ? respRes.data.responses : []

      const distCodeToFormIdMap = new Map<string, string>()
      allDists.forEach((distribution: any) => {
        const targetFormId = distribution.formId || distribution.form?.formId
        if (targetFormId) {
          if (distribution.code) distCodeToFormIdMap.set(String(distribution.code).toLowerCase().trim(), targetFormId)
          if (distribution.distributionCode) distCodeToFormIdMap.set(String(distribution.distributionCode).toLowerCase().trim(), targetFormId)
          if (distribution.distributionId) distCodeToFormIdMap.set(String(distribution.distributionId).toLowerCase().trim(), targetFormId)
        }
      })

      return formsRes.data.forms
        .filter((form: any) => Boolean(form?.formId) && (Boolean(form?.activeVersionId) || Boolean(form?.aspects) || Boolean(form?.metadata)))
        .map((form: any) => {
          const formIdStr = String(form.formId || form.id || '').trim()

          const activeDistributionCount = allDists.filter(
            (distribution: any) => String(distribution.formId || distribution.form?.formId || '').trim() === formIdStr
          ).length

          const responseCount = allResps.filter((response: any) => {
            const responseFormId = String(response.formId || response.metadata?.formId || '').trim()
            if (responseFormId && responseFormId === formIdStr) return true

            const code = String(response.distributionCode || response.code || response.metadata?.distributionCode || '').toLowerCase().trim()
            if (code && distCodeToFormIdMap.has(code)) {
              return distCodeToFormIdMap.get(code) === formIdStr
            }
            return false
          }).length

          return {
            ...form,
            activeDistributionCount,
            responseCount,
          }
        })
    },
  })

  const forms = formsQuery.data ?? []
  const isLoading = formsQuery.isLoading
  const error = formsQuery.error ? (formsQuery.error as Error).message : null

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [lifecycleTab, setLifecycleTab] = useState<LifecycleTab>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<SortBy>('updated')

  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize = 10

  const [activeMenuFormId, setActiveMenuFormId] = useState<string | null>(null)

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategory, setNewCategory] = useState('Kuesioner Evaluasi')
  const [newTarget, setNewTarget] = useState('Komunitas & Cadre Pangan')
  const [newKind, setNewKind] = useState<'official' | 'user-created'>('official')
  const [isCreating, setIsCreating] = useState(false)
  const [duplicatingFormId, setDuplicatingFormId] = useState<string | null>(null)

  const [selectedHistoryFormId, setSelectedHistoryFormId] = useState<string | null>(null)
  const [previewFormDoc, setPreviewFormDoc] = useState<FormAggregateDoc | null>(null)

  const [distributionModalForm, setDistributionModalForm] = useState<FormAggregateDoc | null>(null)
  const [editConfirmForm, setEditConfirmForm] = useState<FormAggregateDoc | null>(null)

  const [editingTitleForm, setEditingTitleForm] = useState<FormAggregateDoc | null>(null)
  const [editTitleInput, setEditTitleInput] = useState('')
  const [editDescriptionInput, setEditDescriptionInput] = useState('')
  const [editCategoryInput, setEditCategoryInput] = useState('')
  const [editTargetInput, setEditTargetInput] = useState('')
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false)

  const [isTogglingCadrePerm, setIsTogglingCadrePerm] = useState(false)
  const [isCreatingNewVersion, setIsCreatingNewVersion] = useState(false)

  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([])
  const [formToDelete, setFormToDelete] = useState<FormAggregateDoc | null>(null)
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [isDeletingForm, setIsDeletingForm] = useState(false)

  const { visible: toastVisible, message: toastMessage, show: showToast } = useToast(3500)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 250)
    return () => clearTimeout(handler)
  }, [searchTerm])

  const fetchForms = () => formsQuery.refetch()

  const categories = useMemo(() => deriveCategories(forms), [forms])
  const tabCounts = useMemo(() => computeTabCounts(forms), [forms])

  const filteredForms = useMemo(
    () => filterForms(forms, { lifecycleTab, categoryFilter, debouncedSearch, sortBy }),
    [forms, lifecycleTab, categoryFilter, debouncedSearch, sortBy]
  )

  const paginatedForms = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredForms.slice(start, start + pageSize)
  }, [filteredForms, currentPage, pageSize])

  const totalPages = Math.ceil(filteredForms.length / pageSize) || 1

  return {
    router,
    isGlobalRole,
    forms,
    isLoading,
    error,
    fetchForms,
    viewMode, setViewMode,
    lifecycleTab, setLifecycleTab,
    searchTerm, setSearchTerm,
    debouncedSearch,
    categoryFilter, setCategoryFilter,
    sortBy, setSortBy,
    currentPage, setCurrentPage,
    pageSize,
    activeMenuFormId, setActiveMenuFormId,
    isCreateModalOpen, setIsCreateModalOpen,
    newTitle, setNewTitle,
    newDescription, setNewDescription,
    newCategory, setNewCategory,
    newTarget, setNewTarget,
    newKind, setNewKind,
    isCreating, setIsCreating,
    duplicatingFormId, setDuplicatingFormId,
    selectedHistoryFormId, setSelectedHistoryFormId,
    previewFormDoc, setPreviewFormDoc,
    distributionModalForm, setDistributionModalForm,
    editConfirmForm, setEditConfirmForm,
    editingTitleForm, setEditingTitleForm,
    editTitleInput, setEditTitleInput,
    editDescriptionInput, setEditDescriptionInput,
    editCategoryInput, setEditCategoryInput,
    editTargetInput, setEditTargetInput,
    isUpdatingTitle, setIsUpdatingTitle,
    isTogglingCadrePerm, setIsTogglingCadrePerm,
    isCreatingNewVersion, setIsCreatingNewVersion,
    selectedFormIds, setSelectedFormIds,
    formToDelete, setFormToDelete,
    isBulkDeleteModalOpen, setIsBulkDeleteModalOpen,
    isDeletingForm, setIsDeletingForm,
    toastVisible, toastMessage,
    showToast,
    categories,
    tabCounts,
    filteredForms,
    paginatedForms,
    totalPages,
  }
}

export type FormsListData = ReturnType<typeof useFormsListData>
