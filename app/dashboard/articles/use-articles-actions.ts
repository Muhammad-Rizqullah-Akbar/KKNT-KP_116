'use client'

import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  createArticle,
  updateArticle,
  deleteArticle,
  type ArticleData
} from '@/lib/repositories/articles.repo'
import { createArticleCategory } from '@/lib/repositories/article-categories.repo'
import { storage } from '@/lib/infra/firebase-client'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { exportArticleToJson } from '@/lib/domain/articles/smart-article-parser'
import { queryKeys } from '@/lib/query-keys'
import { useArticleDraft } from './use-article-draft'
import { htmlToBlocks, compileBlocksToHtml } from './articles-utils'
import { parseJsonToFormData } from './articles-import'
import { type Article } from './articles-types'
import type { ArticlesData } from './use-articles-data'

// CRUD, import/export, dan draft guard.
export function useArticlesActions(data: ArticlesData) {
  const {
    user, userData, showToast,
    formData, setFormData,
    selectedArticle, setSelectedArticle,
    isModalOpen, setIsModalOpen,
    isEditing, setIsEditing,
    detectedMarkers, setDetectedMarkers,
    attachedLocalFiles, setAttachedLocalFiles,
    extraCategories, setExtraCategories,
    isAddCategoryOpen, setIsAddCategoryOpen,
    newCatName, setNewCatName,
    setIsPreviewOpen, setIsImageMatcherOpen, setIsJsonImportOpen,
    setIsDeleteModalOpen, setArticleToDeleteId,
    setApplyingImages,
    selectedArticleIds, setSelectedArticleIds,
    isBulkDeleting, setIsBulkDeleting, setIsBulkDeleteModalOpen,
  } = data

  const queryClient = useQueryClient()

  const [isSavingArticle, setIsSavingArticle] = useState(false)
  const savingRef = useRef(false)

  // Auto-Save Draft & Accidental Close Guard State
  const {
    isConfirmCloseOpen,
    setIsConfirmCloseOpen,
    handleAttemptCloseModal,
    handleConfirmCloseSaveDraft,
    handleConfirmCloseDiscardDraft,
    clearDraft,
    restoreDraft,
  } = useArticleDraft({
    formData,
    isModalOpen,
    setIsModalOpen,
    isEditing,
    selectedArticle,
    showToast,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.articles(user?.uid, userData?.role) })

  const toggleSelectArticle = (id: string) => {
    setSelectedArticleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAllCurrentPage = (currentList: Article[]) => {
    const validIds = currentList.map((article) => article.id).filter((id): id is string => Boolean(id))
    const allSelected = validIds.every((id) => selectedArticleIds.includes(id))

    if (allSelected) {
      setSelectedArticleIds((prev) => prev.filter((id) => !validIds.includes(id)))
    } else {
      setSelectedArticleIds((prev) => Array.from(new Set([...prev, ...validIds])))
    }
  }

  const confirmBulkDelete = async () => {
    if (selectedArticleIds.length === 0 || isBulkDeleting) return
    setIsBulkDeleting(true)
    try {
      await Promise.all(selectedArticleIds.map((id) => deleteArticle(id)))
      showToast(`${selectedArticleIds.length} artikel berhasil dihapus secara massal!`)
      setSelectedArticleIds([])
      setIsBulkDeleteModalOpen(false)
      invalidate()
    } catch (err: any) {
      console.error('Gagal menghapus secara massal:', err)
      alert('Gagal menghapus beberapa artikel.')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleCreateNewCategory = async () => {
    const trimmed = newCatName.trim()
    if (!trimmed) return
    try {
      const created = await createArticleCategory(trimmed)
      setExtraCategories((prev) => Array.from(new Set([...prev, created.name])))
      setFormData((prev) => ({ ...prev, category: created.name }))
      setNewCatName('')
      setIsAddCategoryOpen(false)
    } catch (err: any) {
      alert(err.message || 'Gagal membuat kategori baru')
    }
  }

  const handleImportJson = async (jsonString: string, attachedImages?: File[]) => {
    data.setJsonError(null)
    try {
      const result = await parseJsonToFormData(jsonString, attachedImages, {
        storage,
        attachedLocalFiles,
        userDisplayName: userData?.displayName,
        userEmail: user?.email,
      })

      setFormData({
        title: result.title,
        category: result.category,
        author: result.author,
        authorBio: result.authorBio,
        status: result.status,
        readTime: result.readTime,
        featuredImage: result.featuredImage,
        excerpt: result.excerpt,
        tags: result.tags,
        embeddedDistributionCode: result.embeddedDistributionCode,
        pretestCode: result.pretestCode,
        posttestCode: result.posttestCode,
        gallery: result.gallery,
        blocks: result.blocks,
      })

      setIsEditing(false)
      setSelectedArticle(null)
      setAttachedLocalFiles([])
      setIsJsonImportOpen(false)

      if (result.detectedMarkers.length > 0) {
        setDetectedMarkers(result.detectedMarkers)
        setIsImageMatcherOpen(true)
      } else {
        setIsPreviewOpen(true)
      }
    } catch (err: any) {
      data.setJsonError(err.message || 'Sintaks JSON tidak valid. Periksa format titik koma dan tanda kutip.')
    }
  }

  const handleApplyImportedArticle = (payload: any, uploadedUrls?: string[]) => {
    setFormData({
      title: payload.title || '',
      category: payload.category || 'Keamanan Pangan',
      author: payload.author || userData?.displayName || 'Penulis KKPD-KP',
      authorBio: payload.authorBio || 'Kader Edukator Keamanan Pangan',
      status: payload.status || 'Draft',
      readTime: payload.readTime || 5,
      featuredImage: payload.featuredImage || '',
      excerpt: payload.excerpt || '',
      tags: payload.tags || '',
      embeddedDistributionCode: (payload.embeddedDistributionCode || '').trim().toUpperCase(),
      pretestCode: (payload.pretestCode || '').trim().toUpperCase(),
      posttestCode: (payload.posttestCode || payload.embeddedDistributionCode || '').trim().toUpperCase(),
      gallery: payload.gallery || [],
      blocks: payload.blocks || [],
    })

    setIsEditing(false)
    setSelectedArticle(null)
    setIsPreviewOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const handleExportArticleJson = (article: Article) => {
    try {
      const jsonStr = exportArticleToJson({
        ...article,
        blocks: htmlToBlocks(article.content),
      })
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${(article.slug || 'artikel_edukasi').replace(/[^a-z0-9]/gi, '_')}.json`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert('Gagal mengekspor artikel: ' + err.message)
    }
  }

  const handleApplyMatchedImages = async () => {
    setApplyingImages(true)
    try {
      let updatedFeatured = formData.featuredImage
      let updatedBlocks = [...formData.blocks]
      let updatedGallery = [...formData.gallery]

      for (const marker of detectedMarkers) {
        let finalUrl = marker.uploadedUrl || ''

        if (marker.file) {
          try {
            const storageRef = ref(storage, `articles/${Date.now()}_${marker.file.name}`)
            const snapshot = await uploadBytes(storageRef, marker.file)
            finalUrl = await getDownloadURL(snapshot.ref)
          } catch (e) {
            console.warn('Failed to upload marker file:', e)
          }
        }

        if (finalUrl) {
          if (marker.targetType === 'featured') {
            updatedFeatured = finalUrl
          } else if (marker.targetType === 'block' && marker.blockId) {
            updatedBlocks = updatedBlocks.map((block) => (block.id === marker.blockId ? { ...block, imageUrl: finalUrl } : block))
          } else if (marker.targetType === 'gallery' && marker.galleryId) {
            updatedGallery = updatedGallery.map((image) => (image.id === marker.galleryId ? { ...image, url: finalUrl } : image))
          }
        }
      }

      setFormData((prev) => ({
        ...prev,
        featuredImage: updatedFeatured,
        blocks: updatedBlocks,
        gallery: updatedGallery,
      }))

      setIsImageMatcherOpen(false)
      setIsPreviewOpen(true)
    } catch (err) {
      console.error('Error applying matched images:', err)
    } finally {
      setApplyingImages(false)
    }
  }

  const handleCreate = () => {
    setIsEditing(false)
    setSelectedArticle(null)

    const restored = restoreDraft(false)
    if (restored) {
      setFormData(restored)
      setIsModalOpen(true)
      showToast('Draft artikel sementara sebelumnya berhasil dipulihkan!')
      return
    }

    setFormData({
      title: 'Judul Artikel Edukasi Baru', category: 'Teknologi', author: userData?.displayName || user?.email || 'Kader Edukator', authorBio: userData?.organization || 'Kader Edukator BPOM', status: 'Draft',
      readTime: 5, featuredImage: '', excerpt: 'Tuliskan ringkasan singkat artikel edukasi di sini...', tags: '#Pangan, #Edukasi', embeddedDistributionCode: '', pretestCode: '', posttestCode: '', gallery: [],
      blocks: [
        { id: 'b1', type: 'h2', value: '1. Pendahuluan Keamanan Pangan' },
        { id: 'b2', type: 'p', value: 'Tulis paragraf awal artikel edukasi Anda secara langsung di sini...' }
      ]
    })
    setIsModalOpen(true)
  }

  const handleEdit = (article: Article) => {
    setIsEditing(true)
    setSelectedArticle(article)

    const restored = restoreDraft(true, article.id)
    if (restored) {
      setFormData(restored)
      setIsModalOpen(true)
      showToast('Draft editan artikel sementara berhasil dipulihkan!')
      return
    }

    setFormData({
      title: article.title,
      category: article.category,
      author: article.author,
      authorBio: article.authorBio || '',
      status: article.status,
      readTime: article.readTime || 5,
      featuredImage: article.featuredImage || '',
      excerpt: article.excerpt || '',
      tags: article.tags ? article.tags.join(', ') : '',
      embeddedDistributionCode: article.embeddedDistributionCode || '',
      pretestCode: article.pretestCode || '',
      posttestCode: article.posttestCode || article.embeddedDistributionCode || '',
      gallery: article.gallery || [],
      blocks: htmlToBlocks(article.content),
    })
    setIsModalOpen(true)
  }

  const handleSave = async (statusOverride?: 'Draft' | 'Published') => {
    if (savingRef.current || isSavingArticle) return
    if (!formData.title.trim()) { alert('Judul artikel harus diisi!'); return }
    if (!formData.category) { alert('Kategori harus dipilih!'); return }

    savingRef.current = true
    setIsSavingArticle(true)

    const finalStatus = statusOverride || formData.status
    const compiledContent = compileBlocksToHtml(formData.blocks)

    try {
      const payload = {
        title: formData.title,
        slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: formData.category,
        author: formData.author || userData?.displayName || user?.email || 'Penulis KKPD-KP',
        authorBio: formData.authorBio || userData?.organization || 'BPOM / Cadre Edukator',
        authorUid: user?.uid || '',
        authorRole: userData?.role || 'public',
        authorOrganization: userData?.organization || (userData as any)?.partnershipName || '',
        status: finalStatus,
        readTime: formData.readTime,
        featuredImage: formData.featuredImage,
        excerpt: formData.excerpt,
        content: compiledContent,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        embeddedDistributionCode: formData.posttestCode?.trim() || formData.embeddedDistributionCode?.trim() || '',
        pretestCode: formData.pretestCode?.trim() || '',
        posttestCode: formData.posttestCode?.trim() || formData.embeddedDistributionCode?.trim() || '',
        gallery: formData.gallery,
        date: new Date().toISOString().split('T')[0],
      }

      if (isEditing && selectedArticle && selectedArticle.id) {
        await updateArticle(selectedArticle.id, payload as Partial<ArticleData>)
        showToast('Artikel berhasil diperbarui!')
      } else {
        await createArticle({ ...payload, views: 0 } as ArticleData)
        showToast('Artikel baru berhasil dibuat!')
      }

      clearDraft()
      setIsModalOpen(false)
      setIsPreviewOpen(false)
      invalidate()
    } catch (error) {
      console.error('Gagal menyimpan:', error)
      alert('Gagal menyimpan ke database')
    } finally {
      savingRef.current = false
      setIsSavingArticle(false)
    }
  }

  const handleDelete = (id: string) => {
    setArticleToDeleteId(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    const articleToDeleteId = data.articleToDeleteId
    if (articleToDeleteId) {
      try {
        await deleteArticle(articleToDeleteId)
        showToast('Artikel berhasil dihapus!')
        invalidate()
      } catch (error) {
        console.error('Gagal menghapus:', error)
      }
    }
    setIsDeleteModalOpen(false)
    setArticleToDeleteId(null)
  }

  return {
    isSavingArticle,
    isConfirmCloseOpen,
    setIsConfirmCloseOpen,
    handleAttemptCloseModal,
    handleConfirmCloseSaveDraft,
    handleConfirmCloseDiscardDraft,
    toggleSelectArticle,
    toggleSelectAllCurrentPage,
    confirmBulkDelete,
    handleCreateNewCategory,
    handleImportJson,
    handleApplyImportedArticle,
    handleExportArticleJson,
    handleApplyMatchedImages,
    handleCreate,
    handleEdit,
    handleSave,
    handleDelete,
    confirmDelete,
  }
}

export type ArticlesActions = ReturnType<typeof useArticlesActions>
