'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import { Icon } from '@/components/ui/Icons'
import { useAuth } from '@/context/AuthContext'
import {
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  type ArticleData
} from '@/lib/repositories/articles.repo'
import { getArticleCategories, createArticleCategory } from '@/lib/repositories/article-categories.repo'
import { getForms } from '@/lib/repositories/forms.repo'
import { storage } from '@/lib/infra/firebase-client'
import { uploadOptimizedArticleImage } from '@/lib/infra/storage'
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage'
import { SmartUploadArticleModal } from '@/features/dashboard/components/modals/SmartUploadArticleModal'
import { exportArticleToJson } from '@/lib/domain/articles/smart-article-parser'
import { queryKeys } from '@/lib/query-keys'
import { TOAST_DURATION_LONG_MS } from '@/lib/constants'
import { useToast } from '@/lib/hooks/use-toast'
import { useArticleDraft } from './use-article-draft'
import ArticlesFormModal from './articles-form-modal'
import ArticlesImageMatcher from './articles-image-matcher'
import ArticlesTable from './articles-table'
import {
  categoryGradients,
  galleryGradients,
  statusOptions,
  formatViews,
  type GalleryImage,
  type ContentBlock,
  type Article,
  type MediaItem,
  type DetectedMarker,
  type ArticleFormData,
  type AvailableForm,
} from './articles-types'

// ============ KOMPONEN UTAMA ============
export default function ArticlesAdminPage() {
  const { user, userData } = useAuth()
  const queryClient = useQueryClient()

  // ============ SERVER-STATE (TanStack Query) ============
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

  // Form State
  const [formData, setFormData] = useState<ArticleFormData>({
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
  })

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

  // Debounce & Request Submission Guards
  const [isSavingArticle, setIsSavingArticle] = useState(false)
  const savingRef = useRef(false)

  // Bulk Delete States
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)

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
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.articles(user?.uid, userData?.role) })
    } catch (err: any) {
      console.error('Gagal menghapus secara massal:', err)
      alert('Gagal menghapus beberapa artikel.')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  // Dynamic Categories State From Firestore Database
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')

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

  // PARSE & COMPILE BLOCKS
  const htmlToBlocks = (html: string): ContentBlock[] => {
    if (!html) return [{ id: 'b1', type: 'p', value: '' }]
    const blocks: ContentBlock[] = []
    const div = document.createElement('div')
    div.innerHTML = html
    
    Array.from(div.children).forEach((child, index) => {
      if (child.tagName === 'H2') {
        blocks.push({ id: `b-${index}`, type: 'h2', value: child.textContent || '' })
      } else if (child.tagName === 'BLOCKQUOTE') {
        const text = child.firstChild?.textContent?.replace(/^[\"']|[\"']$/g, '') || ''
        const cite = child.querySelector('cite')?.textContent?.replace('— ', '') || ''
        blocks.push({ id: `b-${index}`, type: 'quote', value: text, quoteAuthor: cite })
      } else if (child.tagName === 'UL') {
        Array.from(child.children).forEach((li, liIdx) => {
          blocks.push({ id: `b-${index}-${liIdx}`, type: 'list', value: li.textContent || '' })
        })
      } else if (child.tagName === 'FIGURE' || child.tagName === 'IMG') {
        const img = child.tagName === 'FIGURE' ? child.querySelector('img') : child
        const caption = child.querySelector('figcaption')?.textContent || ''
        blocks.push({ id: `b-${index}`, type: 'image', value: '', imageUrl: img?.getAttribute('src') || '', imageCaption: caption })
      } else {
        blocks.push({ id: `b-${index}`, type: 'p', value: child.textContent || '' })
      }
    })

    return blocks.length > 0 ? blocks : [{ id: 'b1', type: 'p', value: html.replace(/<[^>]*>?/gm, '') }]
  }

  const compileBlocksToHtml = (blocks: ContentBlock[]): string => {
    return blocks.map(block => {
      if (block.type === 'h2') return `<h2>${block.value}</h2>`
      if (block.type === 'quote') return `<blockquote>\"${block.value}\"<cite class=\"block text-xs text-white/40 mt-2 not-italic\">— ${block.quoteAuthor || 'Anonim'}</cite></blockquote>`
      if (block.type === 'list') return `<ul><li>${block.value}</li></ul>`
      if (block.type === 'image') return `<figure class=\"my-6\"><img src=\"${block.imageUrl}\" alt=\"${block.imageCaption || 'Media'}\" class=\"w-full rounded-2xl border border-white/[0.08]\" />${block.imageCaption ? `<figcaption class=\"text-center text-xs text-white/40 mt-2 italic\">${block.imageCaption}</figcaption>` : ''}</figure>`
      return `<p>${block.value}</p>`
    }).join('\n')
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

  const sampleJsonTemplate = useMemo(() => ({
    title: 'Edukasi Keamanan Pangan & Tata Cara Evaluasi Mandiri',
    category: 'Teknologi',
    author: 'Dr. Ahmad Hidayat',
    authorBio: 'Kader Utama BPOM Pendamping Lapangan',
    readTime: 5,
    excerpt: 'Panduan praktis bagi masyarakat dan kader dalam menjaga kebersihan serta higiene sanitasi pangan.',
    tags: '#KeamananPangan, #EdukasiBPOM, #KaderSehat',
    embeddedDistributionCode: 'KKPDR48',
    featuredImage: 'https://images.unsplash.com/photo-1576867757603-05b134ebc379?auto=format&fit=crop&w=1200&q=80',
    blocks: [
      {
        id: 'b1',
        type: 'h2',
        value: '1. Pentingnya Keamanan Pangan di Lingkungan Masyarakat'
      },
      {
        id: 'b2',
        type: 'p',
        value: 'Pangan yang aman merupakan fondasi utama dalam menjaga kesehatan masyarakat. Penanganan yang buruk dapat memicu terjadinya penyakit akibat kontaminasi bakteri.'
      },
      {
        id: 'b3',
        type: 'quote',
        value: 'Mencegah kontaminasi pangan jauh lebih efisien daripada mengobati dampak penyakit yang ditimbulkannya.',
        quoteAuthor: 'Panduan Keamanan Pangan BPOM'
      },
      {
        id: 'b4',
        type: 'h2',
        value: '2. Lima Kunci Keamanan Pangan yang Wajib Diterapkan'
      },
      {
        id: 'b5',
        type: 'p',
        value: '1) Jagalah kebersihan. 2) Pisahkan bahan mentah dan matang. 3) Masaklah dengan benar. 4) Jaga pangan pada suhu aman. 5) Gunakan air dan bahan baku yang aman.'
      }
    ],
    gallery: [
      {
        id: 'g1',
        caption: 'Kegiatan Pendampingan Kader di Lapangan',
        url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'
      }
    ]
  }), [])

  const autoUploadBase64ToStorage = async (urlStr: string, namePrefix: string): Promise<string> => {
    if (!urlStr || !urlStr.startsWith('data:image')) return urlStr
    try {
      const storageRef = ref(storage, `articles/${Date.now()}_${namePrefix}.png`)
      const res = await fetch(urlStr)
      const blob = await res.blob()
      const snapshot = await uploadBytes(storageRef, blob)
      return await getDownloadURL(snapshot.ref)
    } catch (err) {
      console.warn('Auto upload base64 failed:', err)
      return urlStr
    }
  }

  const handleImportJson = async (jsonString: string, attachedImages?: File[]) => {
    setJsonError(null)
    try {
      const parsed = JSON.parse(jsonString)
      if (!parsed.title || typeof parsed.title !== 'string') {
        throw new Error('Properti \"title\" wajib ada dan berupa string.')
      }

      // Process batch local image files if uploaded alongside JSON
      const uploadedAttachedUrls: string[] = []
      const filesToProcess = attachedImages || attachedLocalFiles
      if (filesToProcess && filesToProcess.length > 0) {
        for (let i = 0; i < filesToProcess.length; i++) {
          const file = filesToProcess[i]
          try {
            const storageRef = ref(storage, `articles/${Date.now()}_${file.name}`)
            const snapshot = await uploadBytes(storageRef, file)
            const downloadUrl = await getDownloadURL(snapshot.ref)
            uploadedAttachedUrls.push(downloadUrl)
          } catch (e) {
            console.warn('Batch image upload failed:', e)
          }
        }
      }

      let featuredImage = parsed.featuredImage || ''
      if (featuredImage.startsWith('data:image')) {
        featuredImage = await autoUploadBase64ToStorage(featuredImage, 'featured')
      } else if (!featuredImage && uploadedAttachedUrls.length > 0) {
        featuredImage = uploadedAttachedUrls.shift() || ''
      }

      const blocks: ContentBlock[] = []
      if (Array.isArray(parsed.blocks)) {
        for (let idx = 0; idx < parsed.blocks.length; idx++) {
          const block = parsed.blocks[idx]
          let imageUrl = block.imageUrl || ''
          if (imageUrl.startsWith('data:image')) {
            imageUrl = await autoUploadBase64ToStorage(imageUrl, `block_${idx}`)
          }
          blocks.push({
            id: block.id || `b_${Date.now()}_${idx}`,
            type: ['p', 'h2', 'quote', 'list', 'image'].includes(block.type) ? block.type : 'p',
            value: block.value || '',
            quoteAuthor: block.quoteAuthor || '',
            imageUrl,
            imageCaption: block.imageCaption || '',
          })
        }
      } else {
        blocks.push(
          { id: 'b1', type: 'h2', value: '1. Pendahuluan' },
          { id: 'b2', type: 'p', value: parsed.content || 'Isi artikel...' }
        )
      }

      const gallery: GalleryImage[] = []
      if (Array.isArray(parsed.gallery)) {
        for (let idx = 0; idx < parsed.gallery.length; idx++) {
          const image = parsed.gallery[idx]
          let url = image.url || ''
          if (url.startsWith('data:image')) {
            url = await autoUploadBase64ToStorage(url, `gallery_${idx}`)
          }
          gallery.push({
            id: image.id || `g_${Date.now()}_${idx}`,
            url,
            caption: image.caption || 'Foto dokumentasi',
            gradient: galleryGradients[idx % galleryGradients.length],
          })
        }
      }

      // Attach any remaining uploaded batch images to gallery slots
      if (uploadedAttachedUrls.length > 0) {
        uploadedAttachedUrls.forEach((imgUrl, idx) => {
          if (!featuredImage) {
            featuredImage = imgUrl
          } else {
            gallery.push({
              id: `g_batch_${Date.now()}_${idx}`,
              url: imgUrl,
              caption: `Dokumentasi Foto ${gallery.length + 1}`,
              gradient: galleryGradients[gallery.length % galleryGradients.length],
            })
          }
        })
      }

      // Scan for MARK:xxx tags in JSON
      const foundMarkers: DetectedMarker[] = []

      if (featuredImage && (featuredImage.startsWith('MARK:') || featuredImage === 'MARK')) {
        foundMarkers.push({
          key: featuredImage,
          label: `Foto Utama Banner (${featuredImage})`,
          targetType: 'featured',
        })
      }

      blocks.forEach((block, idx) => {
        if (block.imageUrl && (block.imageUrl.startsWith('MARK:') || block.imageUrl === 'MARK')) {
          foundMarkers.push({
            key: block.imageUrl,
            label: `Gambar/Infografis Blok #${idx + 1} (${block.imageCaption || block.imageUrl})`,
            targetType: 'block',
            blockId: block.id,
          })
        }
      })

      gallery.forEach((image, idx) => {
        if (image.url && (image.url.startsWith('MARK:') || image.url === 'MARK')) {
          foundMarkers.push({
            key: image.url,
            label: `Foto Galeri Dokumentasi #${idx + 1} (${image.caption || image.url})`,
            targetType: 'gallery',
            galleryId: image.id,
          })
        }
      })

      setFormData({
        title: parsed.title,
        category: parsed.category || 'Teknologi',
        author: parsed.author || userData?.displayName || user?.email || 'Penulis KKPD-KP',
        authorBio: parsed.authorBio || 'BPOM / Cadre Edukator',
        status: parsed.status === 'Published' ? 'Published' : 'Draft',
        readTime: Number(parsed.readTime) || 5,
        featuredImage,
        excerpt: parsed.excerpt || '',
        tags: Array.isArray(parsed.tags) ? parsed.tags.join(', ') : parsed.tags || '',
        embeddedDistributionCode: (parsed.embeddedDistributionCode || '').trim().toUpperCase(),
        pretestCode: (parsed.pretestCode || '').trim().toUpperCase(),
        posttestCode: (parsed.posttestCode || parsed.embeddedDistributionCode || '').trim().toUpperCase(),
        gallery,
        blocks,
      })

      setIsEditing(false)
      setSelectedArticle(null)
      setAttachedLocalFiles([])
      setIsJsonImportOpen(false)

      if (foundMarkers.length > 0) {
        setDetectedMarkers(foundMarkers)
        setIsImageMatcherOpen(true)
      } else {
        setIsPreviewOpen(true)
      }
    } catch (err: any) {
      setJsonError(err.message || 'Sintaks JSON tidak valid. Periksa format titik koma dan tanda kutip.')
    }
  }

  // Handle applied article from Smart Upload & Text Parser Modal
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

  // Handle Export Article to JSON File
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

  const downloadJsonTemplate = () => {
    const blob = new Blob([JSON.stringify(sampleJsonTemplate, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'template_artikel_edukasi.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  // CRUD HANDLERS
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
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.articles(user?.uid, userData?.role) })
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
    if (articleToDeleteId) {
      try {
        await deleteArticle(articleToDeleteId)
        showToast('Artikel berhasil dihapus!')
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.articles(user?.uid, userData?.role) })
      } catch (error) {
        console.error('Gagal menghapus:', error)
      }
    }
    setIsDeleteModalOpen(false)
    setArticleToDeleteId(null)
  }

  // REORDER & BLOCK MANAGEMENT
  const addBlock = (type: 'p' | 'h2' | 'quote' | 'list' | 'image') => {
    setFormData(prev => ({
      ...prev,
      blocks: [...prev.blocks, { id: `b-${Date.now()}`, type, value: '', quoteAuthor: '', imageUrl: '', imageCaption: '' }]
    }))
  }

  const updateBlockValue = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, blocks: prev.blocks.map(block => block.id === id ? { ...block, value } : block) }))
  }

  const updateBlockAuthor = (id: string, quoteAuthor: string) => {
    setFormData(prev => ({ ...prev, blocks: prev.blocks.map(block => block.id === id ? { ...block, quoteAuthor } : block) }))
  }

  const updateBlockImageCaption = (id: string, imageCaption: string) => {
    setFormData(prev => ({ ...prev, blocks: prev.blocks.map(block => block.id === id ? { ...block, imageCaption } : block) }))
  }

  const removeBlock = (id: string) => {
    if (formData.blocks.length === 1) return
    setFormData(prev => ({ ...prev, blocks: prev.blocks.filter(block => block.id !== id) }))
  }

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = formData.blocks.findIndex(block => block.id === id)
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === formData.blocks.length - 1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const newBlocks = [...formData.blocks]
    const [moved] = newBlocks.splice(index, 1)
    newBlocks.splice(newIndex, 0, moved)
    setFormData(prev => ({ ...prev, blocks: newBlocks }))
  }

  const updateGalleryUrl = (id: string, url: string) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.map(image => image.id === id ? { ...image, url } : image)
    }))
  }

  const updateGalleryCaption = (id: string, caption: string) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.map(image => image.id === id ? { ...image, caption } : image)
    }))
  }

  const removeGalleryImage = (id: string) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter(image => image.id !== id)
    }))
  }

  const addGallerySlot = () => {
    const newId = `g${Date.now()}`
    setFormData(prev => ({
      ...prev,
      gallery: [...prev.gallery, { id: newId, url: '', caption: `Dokumentasi ${prev.gallery.length + 1}`, gradient: galleryGradients[prev.gallery.length % galleryGradients.length] }]
    }))
  }

  const previewHeadings = useMemo(() => {
    return formData.blocks.filter(block => block.type === 'h2' && block.value.trim() !== '').map((block, i) => ({
      blockId: block.id,
      id: `section-${i + 1}`,
      text: block.value
    }))
  }, [formData.blocks])

  const scrollToHeadingBlock = (blockId: string) => {
    setIsTocPopoverOpen(false)
    const el = document.getElementById(`block-${blockId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Preview opened directly from the table action button
  const openPreviewFromTable = (article: Article) => {
    setSelectedArticle(article)
    setFormData({
      title: article.title,
      category: article.category,
      author: article.author,
      authorBio: article.authorBio,
      status: article.status,
      readTime: article.readTime,
      featuredImage: article.featuredImage,
      excerpt: article.excerpt,
      tags: article.tags ? article.tags.join(', ') : '',
      embeddedDistributionCode: article.embeddedDistributionCode || '',
      pretestCode: article.pretestCode || '',
      posttestCode: article.posttestCode || article.embeddedDistributionCode || '',
      gallery: article.gallery || [],
      blocks: htmlToBlocks(article.content),
    })
    setIsPreviewOpen(true)
    document.body.style.overflow = 'hidden'
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#06060E] text-white">
      <style>{`
        .article-content blockquote { border-left: 3px solid rgba(6, 182, 212, 0.5); padding-left: 1.5rem; margin: 1.5rem 0; font-style: italic; color: rgba(255, 255, 255, 0.7); }
        .article-content blockquote cite { display: block; font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); margin-top: 0.5rem; font-style: normal; }
        .article-content ul { list-style: none; padding: 0; margin: 1rem 0; }
        .article-content ul li { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.5rem 0; color: rgba(255, 255, 255, 0.6); }
        .article-content ul li:before { content: "✓"; color: #10b981; font-weight: bold; flex-shrink: 0; }
        .article-content h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 600; color: white; margin-top: 1.5rem; margin-bottom: 0.75rem; }
        .article-content p { color: rgba(255, 255, 255, 0.6); line-height: 1.8; margin-bottom: 1rem; }
        .editable-focus:hover { outline: 1px dashed rgba(6, 182, 212, 0.5); border-radius: 8px; cursor: text; }
        .editable-focus:focus { outline: 2px solid #06b6d4; border-radius: 8px; background: rgba(6, 182, 212, 0.05); }
      `}</style>

      <Topbar title="Manajemen Materi Edukasi" subtitle="Kelola artikel edukasi dengan Live Editor, Order Control, & Floating Hamburger TOC" />

      <div className="flex-1 p-6 space-y-6">
        {showSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 animate-slideUp">
            <Icon name="checkCircle" className="w-5 h-5 text-emerald-400" />
            <p className="text-sm text-white">{successMessage}</p>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <span className="text-xs text-white/40 uppercase tracking-wider">Total Artikel</span>
            <p className="text-3xl font-bold font-display mt-2">{stats.total}</p>
          </div>
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <span className="text-xs text-white/40 uppercase tracking-wider">Published</span>
            <p className="text-3xl font-bold font-display mt-2 text-emerald-400">{stats.published}</p>
          </div>
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <span className="text-xs text-white/40 uppercase tracking-wider">Draft</span>
            <p className="text-3xl font-bold font-display mt-2 text-amber-400">{stats.draft}</p>
          </div>
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <span className="text-xs text-white/40 uppercase tracking-wider">Total Views</span>
            <p className="text-3xl font-bold font-display mt-2 text-sky-400">{formatViews(stats.views)}</p>
          </div>
          <div className="rounded-2xl bg-[#080812] border border-cyan-500/20 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-cyan-400 uppercase tracking-wider font-semibold">Optimasi Storage</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-2xl font-bold font-display mt-2 text-emerald-400">Aktif & Hemat</p>
            <p className="text-[10px] text-white/40 mt-1">Auto-kompresi gambar ~80-95% cost</p>
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Cari artikel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none w-64"
            />
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none cursor-pointer">
              <option value="Semua Kategori" className="bg-[#080812]">Semua Kategori</option>
              {dbCategories.map(cat => <option key={cat} value={cat} className="bg-[#080812]">{cat}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none">
              {statusOptions.map(opt => <option key={opt} value={opt} className="bg-[#080812]">{opt}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsSmartUploadOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-950/40 hover:bg-slate-800"
              title="Unggah draf materi dari teks atau file (.txt, .md, .json) secara otomatis rapi"
            >
              <Icon name="upload" className="w-4 h-4 text-cyan-400" />
              <span>Unggah / Draf Instan</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
                Pintar
              </span>
            </button>

            <button onClick={handleCreate} className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all font-mono">
              <Icon name="plus" className="w-4 h-4" /> Buat Artikel Baru
            </button>
          </div>
        </div>

        {/* BULK ACTION BAR */}
        {selectedArticleIds.length > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border border-rose-500/40 flex items-center justify-between gap-4 font-mono shadow-xl animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center font-bold text-xs">
                {selectedArticleIds.length}
              </span>
              <div>
                <span className="font-bold text-sm text-slate-100">{selectedArticleIds.length} Artikel Dipilih</span>
                <p className="text-xs text-slate-400">Pilihan massal untuk menghapus beberapa artikel sekaligus dari database.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                disabled={isBulkDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Icon name="trash" className="w-4 h-4" />
                <span>Hapus Massal ({selectedArticleIds.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedArticleIds([])}
                className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 font-bold text-xs transition-colors"
              >
                Batal Pilihan
              </button>
            </div>
          </div>
        )}

        {/* TABEL DATA */}
        <ArticlesTable
          loading={loading}
          paginatedArticles={paginatedArticles}
          selectedArticleIds={selectedArticleIds}
          toggleSelectArticle={toggleSelectArticle}
          toggleSelectAllCurrentPage={toggleSelectAllCurrentPage}
          handleEdit={handleEdit}
          handleExportArticleJson={handleExportArticleJson}
          handleDelete={handleDelete}
          openPreviewFromTable={openPreviewFromTable}
        />
      </div>

      {/* ============ MODAL BULK DELETE CONFIRMATION ============ */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e0e1a] border border-rose-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-xs font-mono animate-slideUp">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold shrink-0">
                <Icon name="trash" className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100 font-sans">Konfirmasi Hapus Massal</h3>
                <p className="text-[11px] text-slate-400">Penghapusan {selectedArticleIds.length} artikel terpilih.</p>
              </div>
            </div>

            <p className="text-slate-300 font-sans text-xs leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong className="text-rose-400 font-bold">{selectedArticleIds.length} artikel</strong> yang dipilih secara permanen dari Firestore database?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={confirmBulkDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 disabled:opacity-50 cursor-pointer"
              >
                {isBulkDeleting ? <Icon name="spinner" className="w-4 h-4 animate-spin text-white" /> : <Icon name="trash" className="w-4 h-4" />}
                <span>{isBulkDeleting ? 'Menghapus Massal...' : 'Ya, Hapus Massal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL FORM EDIT (RICH 3-TAB BUILDER) ============ */}
      <ArticlesFormModal
        isOpen={isModalOpen}
        isEditing={isEditing}
        formData={formData}
        setFormData={setFormData}
        selectedArticle={selectedArticle}
        setSelectedArticle={setSelectedArticle}
        modalTab={modalTab}
        setModalTab={setModalTab}
        isSavingArticle={isSavingArticle}
        handleSave={handleSave}
        handleAttemptCloseModal={handleAttemptCloseModal}
        isConfirmCloseOpen={isConfirmCloseOpen}
        setIsConfirmCloseOpen={setIsConfirmCloseOpen}
        handleConfirmCloseSaveDraft={handleConfirmCloseSaveDraft}
        handleConfirmCloseDiscardDraft={handleConfirmCloseDiscardDraft}
        uploadingImage={uploadingImage}
        handleFileUpload={handleFileUpload}
        openMediaLibrary={openMediaLibrary}
        dbCategories={dbCategories}
        availableForms={availableForms}
        isAddCategoryOpen={isAddCategoryOpen}
        setIsAddCategoryOpen={setIsAddCategoryOpen}
        newCatName={newCatName}
        setNewCatName={setNewCatName}
        handleCreateNewCategory={handleCreateNewCategory}
        addBlock={addBlock}
        updateBlockValue={updateBlockValue}
        updateBlockAuthor={updateBlockAuthor}
        updateBlockImageCaption={updateBlockImageCaption}
        removeBlock={removeBlock}
        moveBlock={moveBlock}
        updateGalleryUrl={updateGalleryUrl}
        updateGalleryCaption={updateGalleryCaption}
        removeGalleryImage={removeGalleryImage}
        addGallerySlot={addGallerySlot}
        setIsPreviewOpen={setIsPreviewOpen}
      />

      {/* ============ 🔥 LIVE EDITOR PREVIEW MODAL DENGAN HAMBURGER POPOVER TOC ============ */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#06060E] overflow-hidden">
          {/* CONTROL BAR STICKY HEADER */}
          <div className="flex items-center justify-between px-6 py-3 bg-[#080812] border-b border-white/[0.08] shrink-0 z-50">
            <div className="flex items-center gap-3 flex-wrap relative">
              
              {/* 🔥 TOMBOL HAMBURGER POPOVER TOC DROPDOWN */}
              <div className="relative">
                <button 
                  onClick={() => setIsTocPopoverOpen(!isTocPopoverOpen)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold flex items-center gap-2 hover:bg-cyan-500/20 transition-all"
                  title="Daftar Isi Sub-Judul"
                >
                  <Icon name="menu" className="w-4 h-4" /> 
                  <span>Daftar Isi ({previewHeadings.length})</span>
                </button>

                {/* 🔥 TOOLTIP / POPOVER MODAL FLOATING TOC */}
                {isTocPopoverOpen && (
                  <div className="absolute top-10 left-0 w-72 bg-[#0e0e1a] border border-white/10 rounded-2xl shadow-2xl p-4 z-[120] animate-slideUp">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                      <span className="text-xs font-semibold text-white uppercase tracking-wider">Navigasi Sub-Judul</span>
                      <button onClick={() => setIsTocPopoverOpen(false)} className="p-1 text-white/40 hover:text-white">
                        <Icon name="x" className="w-4 h-4" />
                      </button>
                    </div>

                    {previewHeadings.length === 0 ? (
                      <p className="text-xs text-white/40 py-2">Belum ada H2 Sub-Judul pada artikel ini.</p>
                    ) : (
                      <div className="space-y-1 max-h-60 overflow-y-auto">
                        {previewHeadings.map((heading, i) => (
                          <button
                            key={heading.blockId}
                            onClick={() => scrollToHeadingBlock(heading.blockId)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-white/70 hover:text-cyan-300 hover:bg-cyan-500/10 truncate font-mono block"
                          >
                            {i + 1}. {heading.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* DEVICE SWITCHER BUTTONS */}
              <div className="flex items-center gap-1 bg-white/[0.05] p-1 rounded-xl">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                    previewDevice === 'desktop' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/50 hover:text-white'
                  }`}
                >
                  <Icon name="monitor" className="w-3.5 h-3.5" /> Desktop
                </button>
                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                    previewDevice === 'tablet' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/50 hover:text-white'
                  }`}
                >
                  <Icon name="tablet" className="w-3.5 h-3.5" /> Tablet
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                    previewDevice === 'mobile' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/50 hover:text-white'
                  }`}
                >
                  <Icon name="smartphone" className="w-3.5 h-3.5" /> Mobile
                </button>
              </div>

              {/* KODE DISTRIBUSI DISTRIBUTOR */}
              <div className="flex items-center gap-2 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1 rounded-xl">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Sematkan Kode:</span>
                <input
                  type="text"
                  value={formData.embeddedDistributionCode}
                  onChange={(e) => setFormData({ ...formData, embeddedDistributionCode: e.target.value.toUpperCase() })}
                  placeholder="Kode (mis: KKPDQ6M)"
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-cyan-500/30 text-cyan-300 text-xs font-mono focus:outline-none focus:border-cyan-400 w-36"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setIsPreviewOpen(false); setIsModalOpen(true); }}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Buka Form Standard"
              >
                <Icon name="pencil" className="w-3.5 h-3.5 text-cyan-400" />
                <span>Form Edit</span>
              </button>

              <button
                type="button"
                disabled={isSavingArticle}
                onClick={() => handleSave()}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white flex items-center gap-1.5 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {isSavingArticle ? <Icon name="spinner" className="w-3.5 h-3.5 animate-spin text-white" /> : <Icon name="send" className="w-3.5 h-3.5" />}
                <span>{isSavingArticle ? 'Menyimpan...' : 'Simpan & Publish'}</span>
              </button>
              <button onClick={() => { setIsPreviewOpen(false); document.body.style.overflow = ''; }} className="p-2 rounded-xl bg-white/[0.05] text-white">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CANVAS AREA FULL SCROLLABLE */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-black/50 custom-scrollbar">
            <div className={`transition-all duration-300 bg-[#06060E] border border-white/[0.08] shadow-2xl ${
              previewDevice === 'mobile' ? 'w-full max-w-sm my-auto min-h-[700px] border-8 border-neutral-800 rounded-[40px]' :
              previewDevice === 'tablet' ? 'w-full max-w-2xl my-auto min-h-[750px] rounded-3xl' :
              'w-full max-w-4xl rounded-3xl'
            }`}>
              
              <div className="min-h-full text-white pb-20 p-6 sm:p-12">
                {/* HERO HEADER */}
                <header className="relative w-full max-w-3xl mx-auto space-y-4">
                  <div className="relative w-full h-56 sm:h-80 overflow-hidden rounded-2xl group/featured">
                    <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradients[formData.category] || 'from-gray-700/40 to-gray-800/40'} flex items-center justify-center`}>
                      {formData.featuredImage ? (
                        <img src={formData.featuredImage} alt={formData.title} className="w-full h-full object-cover" />
                      ) : (
                        <Icon name="image" className="w-16 h-16 text-white/20" />
                      )}
                    </div>

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/featured:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button 
                        onClick={() => openMediaLibrary((url) => setFormData(prev => ({ ...prev, featuredImage: url })))} 
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 text-xs text-white font-medium"
                      >
                        Pilih dari Storage
                      </button>
                    </div>
                  </div>

                  <h1 
                    contentEditable 
                    suppressContentEditableWarning 
                    onBlur={(e) => setFormData({ ...formData, title: e.currentTarget.innerText })}
                    className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white editable-focus p-1"
                  >
                    {formData.title}
                  </h1>

                  <p 
                    contentEditable 
                    suppressContentEditableWarning 
                    onBlur={(e) => setFormData({ ...formData, excerpt: e.currentTarget.innerText })}
                    className="text-base sm:text-lg text-white/50 leading-relaxed editable-focus p-1"
                  >
                    {formData.excerpt}
                  </p>

                  <div className="flex items-center gap-3 pt-2 border-b border-white/10 pb-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                      {(formData.author || 'A').split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <p contentEditable suppressContentEditableWarning onBlur={(e) => setFormData({ ...formData, author: e.currentTarget.innerText })} className="text-sm font-semibold text-white editable-focus">
                        {formData.author || 'Nama Penulis'}
                      </p>
                      <p contentEditable suppressContentEditableWarning onBlur={(e) => setFormData({ ...formData, authorBio: e.currentTarget.innerText })} className="text-xs text-white/40 editable-focus">
                        {formData.authorBio || 'Bio singkat penulis...'}
                      </p>
                    </div>
                  </div>
                </header>

                {/* MAIN CONTENT ARTICLE BLOCKS */}
                <main className="relative w-full max-w-3xl mx-auto mt-8">
                  <article className="article-content text-white/60 leading-relaxed space-y-6 text-base">
                    {formData.blocks.map((block, index) => (
                      <div id={`block-${block.id}`} key={block.id} className="relative group/block border border-transparent hover:border-cyan-500/20 rounded-xl p-2 transition-all">
                        
                        {/* ACTION BAR FLOATING REORDER */}
                        <div className="absolute -top-3 right-2 opacity-0 group-hover/block:opacity-100 bg-[#080812] border border-white/10 rounded-lg p-1 flex items-center gap-1 shadow-xl z-20 transition-opacity">
                          <button onClick={() => moveBlock(block.id, 'up')} disabled={index === 0} className="p-1 hover:bg-white/10 text-white/70 disabled:opacity-20" title="Geser Ke Atas">
                            <Icon name="arrowUp" className="w-3 h-3" />
                          </button>
                          <button onClick={() => moveBlock(block.id, 'down')} disabled={index === formData.blocks.length - 1} className="p-1 hover:bg-white/10 text-white/70 disabled:opacity-20" title="Geser Ke Bawah">
                            <Icon name="arrowDown" className="w-3 h-3" />
                          </button>
                          <button onClick={() => removeBlock(block.id)} className="p-1 hover:bg-red-500/20 text-red-400" title="Hapus Blok">
                            <Icon name="trash" className="w-3 h-3" />
                          </button>
                        </div>

                        {block.type === 'h2' ? (
                          <h2 contentEditable suppressContentEditableWarning onBlur={(e) => updateBlockValue(block.id, e.currentTarget.innerText)} className="editable-focus p-1">
                            {block.value || 'Sub-Judul Baru...'}
                          </h2>
                        ) : block.type === 'quote' ? (
                          <blockquote className="my-4">
                            <p contentEditable suppressContentEditableWarning onBlur={(e) => updateBlockValue(block.id, e.currentTarget.innerText)} className="editable-focus p-1 inline-block">
                              {block.value || 'Isi kutipan...'}
                            </p>
                            <cite contentEditable suppressContentEditableWarning onBlur={(e) => updateBlockAuthor(block.id, e.currentTarget.innerText)} className="block text-xs text-white/40 mt-1 not-italic editable-focus p-1">
                              — {block.quoteAuthor || 'Nama Pengutip'}
                            </cite>
                          </blockquote>
                        ) : block.type === 'image' ? (
                          <figure className="my-4 relative">
                            {block.imageUrl ? (
                              <img src={block.imageUrl} alt="Media" className="w-full rounded-2xl border border-white/[0.08]" />
                            ) : (
                              <div className="w-full h-40 bg-white/[0.02] border border-dashed border-white/20 rounded-2xl flex items-center justify-center">
                                <button onClick={() => openMediaLibrary((url) => setFormData(prev => ({ ...prev, blocks: prev.blocks.map(item => item.id === block.id ? { ...item, imageUrl: url } : item) })))} className="px-3 py-1.5 bg-cyan-600/30 text-cyan-300 text-xs rounded-lg">Pilih Foto</button>
                              </div>
                            )}
                            <figcaption contentEditable suppressContentEditableWarning onBlur={(e) => updateBlockImageCaption(block.id, e.currentTarget.innerText)} className="text-center text-xs text-white/40 mt-2 italic editable-focus p-1">
                              {block.imageCaption || 'Keterangan gambar/infografis...'}
                            </figcaption>
                          </figure>
                        ) : (
                          <p contentEditable suppressContentEditableWarning onBlur={(e) => updateBlockValue(block.id, e.currentTarget.innerText)} className="editable-focus p-1">
                            {block.value || 'Tulis isi paragraf di sini...'}
                          </p>
                        )}
                      </div>
                    ))}

                    {/* EMBEDDED KUESIONER / FORM CTA BANNER LIVE PREVIEW */}
                    {formData.embeddedDistributionCode && (
                      <div className="my-8 p-6 rounded-3xl bg-gradient-to-br from-cyan-950/80 via-slate-900 to-purple-950/80 border-2 border-cyan-500/40 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0">
                            <Icon name="fileText" className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div>
                            <h4 className="text-base font-extrabold text-white">Formulir & Kuesioner Evaluasi Resmi</h4>
                            <p className="text-xs text-cyan-300 font-mono">Kode Akses Distribusi: <strong>{formData.embeddedDistributionCode}</strong></p>
                          </div>
                        </div>
                        <p className="text-xs text-white/70 leading-relaxed">
                          Bantu kami mengumpulkan data evaluasi pangan secara langsung dengan mengklik tombol di bawah ini untuk mengisi kuesioner resmi.
                        </p>
                        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/25">
                          <span>Isi Kuesioner Sekarang (Pratinjau Tautan Aktif)</span>
                          <Icon name="arrowRight" className="w-4 h-4 text-slate-950" />
                        </div>
                      </div>
                    )}

                    {/* GALERI DOKUMENTASI */}
                    <div className="mt-10 pt-6 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-display text-xl font-semibold text-white">Galeri Dokumentasi</h3>
                        <button onClick={addGallerySlot} className="px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs hover:bg-cyan-500/20">+ Tambah Foto</button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {formData.gallery.map(img => (
                          <div key={img.id} className="rounded-xl overflow-hidden border border-white/[0.05] bg-[#080812] group/gal relative">
                            <button 
                              onClick={() => removeGalleryImage(img.id)}
                              className="absolute top-2 right-2 z-10 p-1 bg-red-500/80 text-white rounded hover:bg-red-600 opacity-0 group-hover/gal:opacity-100 transition-opacity"
                            >
                              <Icon name="trash" className="w-3 h-3" />
                            </button>
                            <div 
                              onClick={() => openMediaLibrary((url) => updateGalleryUrl(img.id, url))}
                              className="cursor-pointer aspect-video w-full bg-white/[0.02] relative flex items-center justify-center group-hover/gal:opacity-90"
                            >
                              {img.url ? (
                                <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-center text-xs text-white/40">Klik Pilih Gambar</div>
                              )}
                            </div>
                            <div className="p-2">
                              <input 
                                type="text" 
                                value={img.caption} 
                                onChange={e => updateGalleryCaption(img.id, e.target.value)} 
                                placeholder="Keterangan..." 
                                className="w-full bg-transparent text-xs text-white focus:outline-none" 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                </main>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL RESOURCE PICKER ============ */}
      {isMediaLibraryOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setIsMediaLibraryOpen(false)}>
          <div className="relative w-full max-w-3xl bg-[#0e0e1a] border border-white/10 rounded-2xl p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Icon name="image" className="w-5 h-5 text-cyan-400" /> Galeri Storage & Media Upload
              </h3>

              <div className="flex items-center gap-2">
                <label className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-600/30 transition-all">
                  <Icon name="uploadCloud" className="w-4 h-4" />
                  <span>{uploadingImage ? 'Mengunggah & Kompresi...' : '+ Upload Gambar Baru'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const url = await handleFileUpload(file)
                        if (url && onSelectMediaCallback) {
                          onSelectMediaCallback(url)
                          setIsMediaLibraryOpen(false)
                        }
                      }
                    }}
                  />
                </label>

                <button onClick={() => setIsMediaLibraryOpen(false)} className="p-1 rounded-lg hover:bg-white/10 text-white/50">
                  <Icon name="x" className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
              {loadingMedia ? (
                <div className="py-16 text-center text-white/40 flex items-center justify-center gap-2 text-xs">
                  <Icon name="loader" className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Memuat berkas dari Storage...</span>
                </div>
              ) : mediaList.length === 0 ? (
                <div className="py-16 text-center text-white/30 space-y-2">
                  <Icon name="image" className="w-10 h-10 text-white/10 mx-auto" />
                  <p className="text-sm font-semibold">Belum Ada Gambar di Storage</p>
                  <p className="text-xs text-white/40">Klik "+ Upload Gambar Baru" di atas untuk menambahkan berkas terkompresi pertama Anda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {mediaList.map((item, index) => (
                    <div 
                      key={index} 
                      onClick={() => {
                        if (onSelectMediaCallback) onSelectMediaCallback(item.url)
                        setIsMediaLibraryOpen(false)
                      }}
                      className="group cursor-pointer aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-cyan-400 transition-all bg-[#06060E] relative shadow-md"
                    >
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2">
                        <span className="text-[11px] font-bold bg-cyan-600 text-white px-3 py-1 rounded-lg shadow-lg w-full text-center">Pilih Gambar Ini</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs">
              <span className="text-white/40">{mediaList.length} berkas tersimpan di Storage (Auto-Compressed)</span>
              <button onClick={() => setIsMediaLibraryOpen(false)} className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ DELETE MODAL ============ */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="relative w-full max-w-md bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Icon name="alertCircle" className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white mb-2">Hapus Artikel</h3>
            <p className="text-sm text-white/50 mb-6">Tindakan ini akan menghapus artikel dari Firestore secara permanen.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-white/[0.03] text-sm text-white/70">Batal</button>
              <button onClick={confirmDelete} className="px-5 py-2.5 rounded-xl bg-rose-600 text-sm font-medium text-white">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ 🖼️ SMART IMAGE MARKER MATCHER STEP MODAL ============ */}
      <ArticlesImageMatcher
        isOpen={isImageMatcherOpen}
        detectedMarkers={detectedMarkers}
        setDetectedMarkers={setDetectedMarkers}
        handleApplyMatchedImages={handleApplyMatchedImages}
        setIsImageMatcherOpen={setIsImageMatcherOpen}
        setIsPreviewOpen={setIsPreviewOpen}
      />

      {/* ============ 📥 SMART UPLOAD & PARSER MODAL ============ */}
      <SmartUploadArticleModal
        isOpen={isSmartUploadOpen}
        onClose={() => setIsSmartUploadOpen(false)}
        onApplyArticle={handleApplyImportedArticle}
        currentUserName={userData?.displayName || user?.email || 'Penulis KKPD-KP'}
      />
    </div>
  )
}
