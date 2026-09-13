'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { getArticles } from '@/lib/repositories/articles.repo'
import { getArticleCategories } from '@/lib/repositories/article-categories.repo'
import { getForms } from '@/lib/repositories/forms.repo'
import { storage } from '@/lib/infra/firebase-client'
import { uploadOptimizedArticleImage } from '@/lib/infra/storage'
import { ref, getDownloadURL, listAll } from 'firebase/storage'
import { queryKeys } from '@/lib/query-keys'
import { TOAST_DURATION_LONG_MS } from '@/lib/constants'
import { useToast } from '@/lib/hooks/use-toast'
import type { Article, MediaItem, DetectedMarker, ArticleFormData, AvailableForm } from './articles-types'

const EMPTY_FORM_DATA: ArticleFormData = {
  title: '',
  category: 'Teknologi',
  author: '',
  authorBio: '',
  status: 'Draft',
  readTime: 5,
  featuredImage: '',
  excerpt: '',
  tags: '',
  embeddedDistributionCode: '',
  pretestCode: '',
  posttestCode: '',
  gallery: [],
  blocks: [],
}

// Server-state, derived data, filter/stats, media library, dan seluruh UI state.
export function useArticlesData() {
  const { user, userData } = useAuth()

  const articlesQuery = useQuery({
    queryKey: queryKeys.dashboard.articles(user?.uid, userData?.role),
    queryFn: async () => {
      const [data, catData, formsList] = await Promise.all([
        getArticles(),
        getArticleCategories().catch(() => []),
        getForms().catch(() => []),
      ])
      return { data, catData, formsList }
    },
  })

  const [extraCategories, setExtraCategories] = useState<string[]>([])
  const [applyingImages, setApplyingImages] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('Semua Kategori')
  const [filterStatus, setFilterStatus] = useState('Semua Status')
  const [currentPage, setCurrentPage] = useState(1)

  // Modal & UI States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [articleToDeleteId, setArticleToDeleteId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const { visible: showSuccess, message: successMessage, show: showToast } = useToast()
  const [uploadingImage, setUploadingImage] = useState(false)

  // Hamburger Popover TOC Dropdown State
  const [isTocPopoverOpen, setIsTocPopoverOpen] = useState(false)

  // Media Library States
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false)
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [onSelectMediaCallback, setOnSelectMediaCallback] = useState<((url: string) => void) | null>(null)

  // Smart Upload & Text Parser Modal State
  const [isSmartUploadOpen, setIsSmartUploadOpen] = useState(false)
  const [isJsonImportOpen, setIsJsonImportOpen] = useState(false)
  const [isJsonTutorialOpen, setIsJsonTutorialOpen] = useState(false)
  const [isImageMatcherOpen, setIsImageMatcherOpen] = useState(false)
  const [detectedMarkers, setDetectedMarkers] = useState<DetectedMarker[]>([])
  const [rawJsonText, setRawJsonText] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [attachedLocalFiles, setAttachedLocalFiles] = useState<File[]>([])

  // Device Switcher State
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [modalTab, setModalTab] = useState<'info' | 'blocks' | 'gallery'>('info')

  const itemsPerPage = 10

  const [formData, setFormData] = useState<ArticleFormData>(EMPTY_FORM_DATA)

  // Dynamic Categories State From Firestore Database
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  // Bulk Delete States
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)

  // ============ DERIVED DATA FROM QUERY ============
  const articlesData = useMemo(() => {
    if (!articlesQuery.data) return null
    const { data, catData, formsList } = articlesQuery.data

    const fetchedForms = formsList.map((form) => ({
      id: form.id || '',
      code: form.code || form.id || '',
      title: form.title || 'Form Kuesioner',
    }))
    const fetchedCatNames = catData.map((category) => category.name).filter(Boolean)
    const articleCatNames = data.map((article) => article.category).filter(Boolean)
    const mergedCategories = Array.from(new Set([...fetchedCatNames, ...articleCatNames, ...extraCategories, 'Keamanan Pangan', 'Edukasi']))

    let formattedData = data.map((article) => ({
      id: article.id,
      authorUid: article.authorUid || article.authorId || article.createdBy || '',
      title: article.title || '',
      slug: article.slug || '',
      author: article.author || '',
      authorBio: article.authorBio || '',
      category: article.category || (mergedCategories[0] || 'Keamanan Pangan'),
      status: article.status || 'Draft',
      views: article.views || 0,
      date: article.date || article.createdAt || new Date().toISOString(),
      readTime: article.readTime || 5,
      excerpt: article.excerpt || '',
      content: article.content || '',
      featuredImage: article.featuredImage || '',
      tags: Array.isArray(article.tags) ? article.tags : [],
      gallery: Array.isArray(article.gallery) ? article.gallery : [],
      embeddedDistributionCode: article.embeddedDistributionCode || '',
      pretestCode: article.pretestCode || '',
      posttestCode: article.posttestCode || article.embeddedDistributionCode || '',
    }))

    // Strictly filter to author's own articles if user has cadre role
    if (userData?.role === 'cadre') {
      const userUid = user?.uid
      const userEmail = (user?.email || '').toLowerCase().trim()
      const userDisplayName = (userData?.displayName || '').toLowerCase().trim()

      formattedData = formattedData.filter((article) => {
        if (article.authorUid && userUid && article.authorUid === userUid) return true
        const authLower = String(article.author || '').toLowerCase().trim()
        if (userEmail && authLower === userEmail) return true
        if (userDisplayName && userDisplayName.length > 2 && authLower === userDisplayName) return true
        return false
      })
    }

    return { articles: formattedData as Article[], availableForms: fetchedForms as AvailableForm[], dbCategories: mergedCategories }
  }, [articlesQuery.data, userData, user, extraCategories])

  const articles = articlesData?.articles ?? []
  const availableForms = articlesData?.availableForms ?? []
  const dbCategories = articlesData?.dbCategories ?? ['Keamanan Pangan', 'Edukasi', 'Regulasi', 'Tips & Trik']
  const loading = articlesQuery.isLoading

  // MEDIA STORAGE HELPERS
  const fetchMediaLibrary = async () => {
    setLoadingMedia(true)
    try {
      const storageRef = ref(storage, 'articles/')
      const res = await listAll(storageRef)
      const items: MediaItem[] = await Promise.all(
        res.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef)
          return { name: itemRef.name, url }
        })
      )
      setMediaList(items)
    } catch (error) {
      console.error('Gagal memuat galeri media:', error)
    } finally {
      setLoadingMedia(false)
    }
  }

  const openMediaLibrary = (onSelect: (url: string) => void) => {
    setOnSelectMediaCallback(() => onSelect)
    fetchMediaLibrary()
    setIsMediaLibraryOpen(true)
  }

  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      setUploadingImage(true)
      const res = await uploadOptimizedArticleImage(file, 'articles')
      fetchMediaLibrary()
      showToast(`⚡ Gambar terkompresi otomatis (${res.savedPercent}% hemat storage)!`, TOAST_DURATION_LONG_MS)
      return res.url
    } catch (error) {
      console.error('Gagal mengunggah file:', error)
      alert('Gagal mengunggah gambar.')
      throw error
    } finally {
      setUploadingImage(false)
    }
  }

  // FILTER & STATS
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          article.author.toLowerCase().includes(searchTerm.toLowerCase())
      const matchCategory = filterCategory === 'Semua Kategori' || article.category === filterCategory
      const matchStatus = filterStatus === 'Semua Status' || article.status === filterStatus
      return matchSearch && matchCategory && matchStatus
    })
  }, [articles, searchTerm, filterCategory, filterStatus])

  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredArticles.slice(start, start + itemsPerPage)
  }, [filteredArticles, currentPage])

  useEffect(() => { setCurrentPage(1) }, [searchTerm, filterCategory, filterStatus])

  const stats = useMemo(() => {
    const total = articles.length
    const published = articles.filter(article => article.status === 'Published').length
    const draft = articles.filter(article => article.status === 'Draft').length
    const views = articles.reduce((acc, article) => acc + (article.views || 0), 0)
    const categories = new Set(articles.map(article => article.category)).size
    return { total, published, draft, views, categories }
  }, [articles])

  return {
    user,
    userData,
    showToast,
    showSuccess,
    successMessage,
    loading,
    articles,
    availableForms,
    dbCategories,
    stats,
    filteredArticles,
    paginatedArticles,
    // Filters & pagination
    searchTerm, setSearchTerm,
    filterCategory, setFilterCategory,
    filterStatus, setFilterStatus,
    currentPage, setCurrentPage,
    // Modal & UI state
    isModalOpen, setIsModalOpen,
    isPreviewOpen, setIsPreviewOpen,
    isDeleteModalOpen, setIsDeleteModalOpen,
    selectedArticle, setSelectedArticle,
    articleToDeleteId, setArticleToDeleteId,
    isEditing, setIsEditing,
    uploadingImage, setUploadingImage,
    isTocPopoverOpen, setIsTocPopoverOpen,
    isMediaLibraryOpen, setIsMediaLibraryOpen,
    mediaList, loadingMedia,
    onSelectMediaCallback,
    isSmartUploadOpen, setIsSmartUploadOpen,
    isJsonImportOpen, setIsJsonImportOpen,
    isJsonTutorialOpen, setIsJsonTutorialOpen,
    isImageMatcherOpen, setIsImageMatcherOpen,
    detectedMarkers, setDetectedMarkers,
    rawJsonText, setRawJsonText,
    jsonError, setJsonError,
    attachedLocalFiles, setAttachedLocalFiles,
    previewDevice, setPreviewDevice,
    modalTab, setModalTab,
    formData, setFormData,
    extraCategories, setExtraCategories,
    applyingImages, setApplyingImages,
    isAddCategoryOpen, setIsAddCategoryOpen,
    newCatName, setNewCatName,
    // Bulk delete state
    selectedArticleIds, setSelectedArticleIds,
    isBulkDeleting, setIsBulkDeleting,
    isBulkDeleteModalOpen, setIsBulkDeleteModalOpen,
    // Media handlers
    fetchMediaLibrary,
    openMediaLibrary,
    handleFileUpload,
  }
}

export type ArticlesData = ReturnType<typeof useArticlesData>
