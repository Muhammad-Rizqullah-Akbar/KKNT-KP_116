'use client'

import { useEffect, useState } from 'react'
import type { Article, ArticleFormData } from './articles-types'

const DRAFT_STORAGE_KEY = 'cms_article_temp_draft'

type UseArticleDraftArgs = {
  formData: ArticleFormData
  isModalOpen: boolean
  setIsModalOpen: (open: boolean) => void
  isEditing: boolean
  selectedArticle: Article | null
  showToast: (msg: string, duration?: number) => void
}

/**
 * useArticleDraft — Auto-save draft artikel ke localStorage, guard tutup modal
 * yang belum tersimpan, serta pemulihan (restore) draft saat create/edit.
 */
export function useArticleDraft({
  formData,
  isModalOpen,
  setIsModalOpen,
  isEditing,
  selectedArticle,
  showToast,
}: UseArticleDraftArgs) {
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false)

  // Real-time Auto-Save Draft Persistence to localStorage
  useEffect(() => {
    if (isModalOpen && (formData.title || formData.excerpt || formData.blocks.length > 0)) {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            formData,
            isEditing,
            selectedArticleId: selectedArticle?.id || null,
            savedAt: new Date().toISOString(),
          })
        )
      } catch (err) {
        console.warn('[CMS Draft] Failed to auto-save draft:', err)
      }
    }
  }, [formData, isModalOpen, isEditing, selectedArticle])

  const hasUnsavedContent = () =>
    Boolean(
      formData.title.trim() !== '' ||
        formData.excerpt.trim() !== '' ||
        formData.blocks.length > 0 ||
        formData.featuredImage !== ''
    )

  const handleAttemptCloseModal = () => {
    if (hasUnsavedContent()) {
      setIsConfirmCloseOpen(true)
    } else {
      setIsModalOpen(false)
      setIsConfirmCloseOpen(false)
    }
  }

  const handleConfirmCloseSaveDraft = () => {
    setIsConfirmCloseOpen(false)
    setIsModalOpen(false)
    showToast('Draft artikel sementara Anda aman tersimpan di browser!')
  }

  const handleConfirmCloseDiscardDraft = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    }
    setIsConfirmCloseOpen(false)
    setIsModalOpen(false)
  }

  const clearDraft = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    }
  }

  const restoreDraft = (expectedIsEditing: boolean, articleId?: string): ArticleFormData | null => {
    if (typeof window === 'undefined') return null
    const savedRaw = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!savedRaw) return null
    try {
      const parsed = JSON.parse(savedRaw)
      if (parsed && parsed.formData && parsed.isEditing === expectedIsEditing) {
        if (expectedIsEditing && parsed.selectedArticleId !== articleId) return null
        return parsed.formData as ArticleFormData
      }
    } catch (e) {
      console.warn('[CMS Draft] Error parsing draft:', e)
    }
    return null
  }

  return {
    isConfirmCloseOpen,
    setIsConfirmCloseOpen,
    handleAttemptCloseModal,
    handleConfirmCloseSaveDraft,
    handleConfirmCloseDiscardDraft,
    clearDraft,
    restoreDraft,
  }
}
