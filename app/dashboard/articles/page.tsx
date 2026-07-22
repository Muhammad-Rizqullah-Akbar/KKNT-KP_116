'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import { 
  getArticles, 
  createArticle, 
  updateArticle, 
  deleteArticle, 
  type ArticleData 
} from '@/lib/firebase/repositories/articles.repo'
import { storage } from '@/lib/firebaseClient'
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage'

// ============ TIPE DATA & KONSTANTA ============
type GalleryImage = { id: string; url?: string; caption: string; gradient: string }
type ContentBlock = { 
  id: string; 
  type: 'p' | 'h2' | 'quote' | 'list' | 'image'; 
  value: string; 
  quoteAuthor?: string; 
  imageUrl?: string; 
  imageCaption?: string 
}

type Article = {
  id?: string
  title: string
  slug: string
  author: string
  authorBio: string
  category: string
  status: 'Draft' | 'Published'
  views: number
  date: string
  readTime: number
  excerpt: string
  content: string 
  featuredImage: string
  tags: string[]
  gallery: GalleryImage[]
}

type MediaItem = { name: string; url: string }

const categoryColors: Record<string, string> = {
  Teknologi: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Bisnis: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  Karir: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Data: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
}

const categoryGradients: Record<string, string> = {
  Teknologi: 'from-emerald-700/40 to-cyan-800/40',
  Bisnis: 'from-rose-700/40 to-pink-800/40',
  Karir: 'from-amber-700/40 to-orange-800/40',
  Data: 'from-sky-700/40 to-blue-800/40',
}

const statusColors: Record<string, string> = {
  Published: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Draft: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
}

const categoryOptions = ['Semua Kategori', 'Teknologi', 'Bisnis', 'Karir', 'Data']
const statusOptions = ['Semua Status', 'Published', 'Draft']

const galleryGradients = [
  'from-cyan-700/50 to-emerald-800/50',
  'from-violet-700/50 to-purple-800/50',
  'from-amber-700/50 to-orange-800/50',
  'from-rose-700/50 to-pink-800/50',
]

// ============ KOMPONEN UTAMA ============
export default function ArticlesAdminPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
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
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  // Hamburger Popover TOC Dropdown State
  const [isTocPopoverOpen, setIsTocPopoverOpen] = useState(false)

  // Media Library States
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false)
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [onSelectMediaCallback, setOnSelectMediaCallback] = useState<((url: string) => void) | null>(null)

  // Device Switcher State
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  const itemsPerPage = 10

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Teknologi',
    author: '',
    authorBio: '',
    status: 'Draft' as 'Draft' | 'Published',
    readTime: 5,
    featuredImage: '',
    excerpt: '',
    tags: '',
    gallery: [] as GalleryImage[],
    blocks: [] as ContentBlock[],
  })

  // FETCH DATA
  const fetchArticlesData = async () => {
    setLoading(true)
    try {
      const data = await getArticles()
      const formattedData = data.map((doc: any) => ({
        id: doc.id,
        title: doc.title || '',
        slug: doc.slug || '',
        author: doc.author || '',
        authorBio: doc.authorBio || '',
        category: doc.category || 'Teknologi',
        status: doc.status || 'Draft',
        views: doc.views || 0,
        date: doc.date || doc.createdAt || new Date().toISOString(),
        readTime: doc.readTime || 5,
        excerpt: doc.excerpt || '',
        content: doc.content || '',
        featuredImage: doc.featuredImage || '',
        tags: Array.isArray(doc.tags) ? doc.tags : [],
        gallery: Array.isArray(doc.gallery) ? doc.gallery : [],
      }))
      setArticles(formattedData)
    } catch (error) {
      console.error('Gagal mengambil data artikel:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchArticlesData() }, [])

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
      const storageRef = ref(storage, `articles/${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      fetchMediaLibrary()
      return downloadURL
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
        const text = child.firstChild?.textContent?.replace(/^["']|["']$/g, '') || ''
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
      if (block.type === 'quote') return `<blockquote>"${block.value}"<cite class="block text-xs text-white/40 mt-2 not-italic">— ${block.quoteAuthor || 'Anonim'}</cite></blockquote>`
      if (block.type === 'list') return `<ul><li>${block.value}</li></ul>`
      if (block.type === 'image') return `<figure class="my-6"><img src="${block.imageUrl}" alt="${block.imageCaption || 'Media'}" class="w-full rounded-2xl border border-white/[0.08]" />${block.imageCaption ? `<figcaption class="text-center text-xs text-white/40 mt-2 italic">${block.imageCaption}</figcaption>` : ''}</figure>`
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
    const published = articles.filter(a => a.status === 'Published').length
    const draft = articles.filter(a => a.status === 'Draft').length
    const views = articles.reduce((acc, a) => acc + (a.views || 0), 0)
    const categories = new Set(articles.map(a => a.category)).size
    return { total, published, draft, views, categories }
  }, [articles])

  // CRUD HANDLERS
  const handleCreate = () => {
    setIsEditing(false)
    setSelectedArticle(null)
    setFormData({
      title: 'Judul Artikel Baru', category: 'Teknologi', author: 'Dr. Aria Nugraha', authorBio: 'Chief Technology Officer di Aether Global Labs', status: 'Draft',
      readTime: 5, featuredImage: '', excerpt: 'Tuliskan ringkasan singkat artikel di sini...', tags: '#AI, #Teknologi', gallery: [],
      blocks: [
        { id: 'b1', type: 'h2', value: '1. Pendahuluan' },
        { id: 'b2', type: 'p', value: 'Tulis paragraf pertama artikel Anda secara langsung di sini...' }
      ]
    })
    setIsModalOpen(true)
  }

  const handleEdit = (article: Article) => {
    setIsEditing(true)
    setSelectedArticle(article)
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
      gallery: article.gallery || [],
      blocks: htmlToBlocks(article.content),
    })
    setIsModalOpen(true)
  }

  const handleSave = async (statusOverride?: 'Draft' | 'Published') => {
    if (!formData.title.trim()) { alert('Judul artikel harus diisi!'); return }
    if (!formData.category) { alert('Kategori harus dipilih!'); return }

    const finalStatus = statusOverride || formData.status
    const compiledContent = compileBlocksToHtml(formData.blocks)

    try {
      const payload = {
        title: formData.title,
        slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: formData.category,
        author: formData.author,
        authorBio: formData.authorBio,
        status: finalStatus,
        readTime: formData.readTime,
        featuredImage: formData.featuredImage,
        excerpt: formData.excerpt,
        content: compiledContent,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        gallery: formData.gallery,
        date: new Date().toISOString().split('T')[0],
      }

      if (isEditing && selectedArticle && selectedArticle.id) {
        await updateArticle(selectedArticle.id, payload as Partial<ArticleData>)
        setSuccessMessage('Artikel berhasil diperbarui!')
      } else {
        await createArticle({ ...payload, views: 0 } as ArticleData)
        setSuccessMessage('Artikel baru berhasil dibuat!')
      }

      setIsModalOpen(false)
      setIsPreviewOpen(false)
      setShowSuccess(true)
      fetchArticlesData()
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Gagal menyimpan:', error)
      alert('Gagal menyimpan ke database')
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
        setSuccessMessage('Artikel berhasil dihapus!')
        setShowSuccess(true)
        fetchArticlesData()
        setTimeout(() => setShowSuccess(false), 3000)
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
    setFormData(prev => ({ ...prev, blocks: prev.blocks.map(b => b.id === id ? { ...b, value } : b) }))
  }

  const updateBlockAuthor = (id: string, quoteAuthor: string) => {
    setFormData(prev => ({ ...prev, blocks: prev.blocks.map(b => b.id === id ? { ...b, quoteAuthor } : b) }))
  }

  const updateBlockImageCaption = (id: string, imageCaption: string) => {
    setFormData(prev => ({ ...prev, blocks: prev.blocks.map(b => b.id === id ? { ...b, imageCaption } : b) }))
  }

  const removeBlock = (id: string) => {
    if (formData.blocks.length === 1) return
    setFormData(prev => ({ ...prev, blocks: prev.blocks.filter(b => b.id !== id) }))
  }

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = formData.blocks.findIndex(b => b.id === id)
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === formData.blocks.length - 1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const newBlocks = [...formData.blocks]
    const [moved] = newBlocks.splice(index, 1)
    newBlocks.splice(newIndex, 0, moved)
    setFormData(prev => ({ ...prev, blocks: newBlocks }))
  }

  // 🔥 DEKLARASI FUNGSI KUNCI YANG SEBELUMNYA MISSING
  const updateGalleryUrl = (id: string, url: string) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.map(g => g.id === id ? { ...g, url } : g)
    }))
  }

  const updateGalleryCaption = (id: string, caption: string) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.map(g => g.id === id ? { ...g, caption } : g)
    }))
  }

  const removeGalleryImage = (id: string) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter(g => g.id !== id)
    }))
  }

  const addGallerySlot = () => {
    const newId = `g${Date.now()}`
    setFormData(prev => ({
      ...prev,
      gallery: [...prev.gallery, { id: newId, url: '', caption: `Dokumentasi ${prev.gallery.length + 1}`, gradient: galleryGradients[prev.gallery.length % galleryGradients.length] }]
    }))
  }

  const formatViews = (views: number) => views >= 1000 ? `${(views / 1000).toFixed(1)}K` : views.toString()
  const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

  const previewHeadings = useMemo(() => {
    return formData.blocks.filter(b => b.type === 'h2' && b.value.trim() !== '').map((b, i) => ({
      blockId: b.id,
      id: `section-${i + 1}`,
      text: b.value
    }))
  }, [formData.blocks])

  const scrollToHeadingBlock = (blockId: string) => {
    setIsTocPopoverOpen(false)
    const el = document.getElementById(`block-${blockId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
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
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <span className="text-xs text-white/40 uppercase tracking-wider">Kategori</span>
            <p className="text-3xl font-bold font-display mt-2 text-violet-400">{stats.categories}</p>
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
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none">
              {categoryOptions.map(opt => <option key={opt} value={opt} className="bg-[#080812]">{opt}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none">
              {statusOptions.map(opt => <option key={opt} value={opt} className="bg-[#080812]">{opt}</option>)}
            </select>
          </div>
          <button onClick={handleCreate} className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white shadow-lg flex items-center gap-2">
            <Icon name="plus" className="w-4 h-4" /> Buat Artikel Baru
          </button>
        </div>

        {/* TABEL DATA */}
        <div className="rounded-2xl bg-[#080812] border border-white/[0.05] overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-white/40">Memuat data dari database...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                  <th className="text-left px-6 py-4 text-xs text-white/35 uppercase tracking-wider font-medium">Judul Artikel</th>
                  <th className="text-left px-6 py-4 text-xs text-white/35 uppercase tracking-wider font-medium">Kategori</th>
                  <th className="text-left px-6 py-4 text-xs text-white/35 uppercase tracking-wider font-medium">Status</th>
                  <th className="text-left px-6 py-4 text-xs text-white/35 uppercase tracking-wider font-medium">Views</th>
                  <th className="text-left px-6 py-4 text-xs text-white/35 uppercase tracking-wider font-medium">Tanggal</th>
                  <th className="text-left px-6 py-4 text-xs text-white/35 uppercase tracking-wider font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedArticles.map((article) => (
                  <tr key={article.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium truncate w-64">{article.title}</p>
                      <p className="text-xs text-white/35">{article.author}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full border text-xs ${categoryColors[article.category] || 'text-white'}`}>
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full border text-xs ${statusColors[article.status]}`}>
                        {article.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/60">{formatViews(article.views)}</td>
                    <td className="px-6 py-4 text-white/40 text-xs">{formatDate(article.date)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(article)} className="p-2 rounded-lg hover:bg-white/[0.05]" title="Edit Form">
                          <Icon name="pencil" className="w-4 h-4 text-white/50 hover:text-cyan-400" />
                        </button>
                        <button onClick={() => { setSelectedArticle(article); setFormData({ title: article.title, category: article.category, author: article.author, authorBio: article.authorBio, status: article.status, readTime: article.readTime, featuredImage: article.featuredImage, excerpt: article.excerpt, tags: article.tags ? article.tags.join(', ') : '', gallery: article.gallery || [], blocks: htmlToBlocks(article.content) }); setIsPreviewOpen(true); document.body.style.overflow = 'hidden'; }} className="p-2 rounded-lg hover:bg-white/[0.05]" title="Live Editor Preview">
                          <Icon name="eye" className="w-4 h-4 text-white/50 hover:text-sky-400" />
                        </button>
                        <button onClick={() => handleDelete(article.id!)} className="p-2 rounded-lg hover:bg-red-500/10" title="Hapus">
                          <Icon name="trash" className="w-4 h-4 text-white/50 hover:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ============ MODAL FORM EDIT ============ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 px-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }} onClick={() => setIsModalOpen(false)}>
          <div className="relative w-full max-w-4xl bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl animate-slideUp my-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="font-display text-lg font-semibold text-white">{isEditing ? 'Edit Artikel' : 'Buat Artikel Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center">
                <Icon name="x" className="w-5 h-5 text-white/50" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Judul Artikel</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white focus:outline-none" placeholder="Masukkan judul..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Kategori</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/70 focus:outline-none cursor-pointer">
                    <option value="Teknologi" className="bg-[#0e0e1a]">Teknologi</option>
                    <option value="Bisnis" className="bg-[#0e0e1a]">Bisnis</option>
                    <option value="Karir" className="bg-[#0e0e1a]">Karir</option>
                    <option value="Data" className="bg-[#0e0e1a]">Data</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Penulis</label>
                  <input type="text" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white focus:outline-none" placeholder="Nama penulis..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as 'Draft'|'Published'})} className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/70 focus:outline-none cursor-pointer">
                    <option value="Draft" className="bg-[#0e0e1a]">Draft</option>
                    <option value="Published" className="bg-[#0e0e1a]">Published</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Waktu Baca (menit)</label>
                  <input type="number" value={formData.readTime} onChange={e => setFormData({...formData, readTime: parseInt(e.target.value) || 0})} className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white focus:outline-none" />
                </div>
              </div>

              {/* UPLOAD FEATURED IMAGE */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 uppercase tracking-wider">Foto Utama / Featured Image</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="text" 
                    value={formData.featuredImage} 
                    onChange={e => setFormData({...formData, featuredImage: e.target.value})} 
                    placeholder="https://... atau klik upload file" 
                    className="flex-1 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white focus:outline-none text-sm" 
                  />
                  <label className="px-4 py-3 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 text-sm font-medium cursor-pointer hover:bg-cyan-600/30 transition-all flex items-center gap-2 shrink-0">
                    <Icon name="image" className="w-4 h-4" />
                    {uploadingImage ? 'Mengunggah...' : 'Upload Foto'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const url = await handleFileUpload(file)
                          if (url) setFormData(prev => ({ ...prev, featuredImage: url }))
                        }
                      }} 
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-white/50 uppercase tracking-wider">Subtitle / Ringkasan Singkat</label>
                <textarea value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} rows={2} placeholder="Tulis ringkasan..." className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white focus:outline-none resize-none" />
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm text-white/50 hover:bg-white/[0.03]">Batal</button>
              <div className="flex gap-3">
                <button onClick={() => { handleSave('Draft') }} className="px-5 py-2.5 rounded-xl bg-white/[0.03] text-sm text-white/70 hover:text-white flex items-center gap-2"><Icon name="save" className="w-4 h-4" /> Simpan Draft</button>
                <button onClick={() => { handleSave('Published') }} className="px-5 py-2.5 rounded-xl bg-cyan-600 text-sm font-medium text-white flex items-center gap-2"><Icon name="send" className="w-4 h-4" /> Publish</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                        <Icon name="x" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {previewHeadings.length === 0 ? (
                      <p className="text-xs text-white/30 italic py-2">Belum ada Sub-Judul (H2). Tambahkan di toolbar atas.</p>
                    ) : (
                      <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                        {previewHeadings.map((h, i) => (
                          <button
                            key={h.id}
                            onClick={() => scrollToHeadingBlock(h.blockId)}
                            className="w-full text-left text-xs text-white/70 hover:text-cyan-400 hover:bg-cyan-500/10 p-2 rounded-lg transition-all truncate"
                          >
                            {i + 1}. {h.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Device Viewport Switcher */}
              <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
                <button onClick={() => setPreviewDevice('desktop')} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${previewDevice === 'desktop' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/50'}`}>Desktop</button>
                <button onClick={() => setPreviewDevice('tablet')} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${previewDevice === 'tablet' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/50'}`}>Tablet</button>
                <button onClick={() => setPreviewDevice('mobile')} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${previewDevice === 'mobile' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/50'}`}>Mobile</button>
              </div>

              {/* Quick Add Elements */}
              <div className="hidden md:flex items-center gap-1 border-l border-white/10 pl-3">
                <button onClick={() => addBlock('p')} className="px-2 py-1 rounded bg-white/[0.05] text-[11px] text-white hover:bg-white/10">+ Paragraf</button>
                <button onClick={() => addBlock('h2')} className="px-2 py-1 rounded bg-cyan-500/10 text-[11px] text-cyan-400 hover:bg-cyan-500/20">+ Sub-Judul</button>
                <button onClick={() => addBlock('quote')} className="px-2 py-1 rounded bg-violet-500/10 text-[11px] text-violet-400 hover:bg-violet-500/20">+ Quote</button>
                <button onClick={() => addBlock('image')} className="px-2 py-1 rounded bg-amber-500/10 text-[11px] text-amber-400 hover:bg-amber-500/20">+ Infografis</button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => handleSave()} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white flex items-center gap-1.5 shadow-lg">
                <Icon name="send" className="w-3.5 h-3.5" /> Simpan & Publish
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
                                <button onClick={() => openMediaLibrary((url) => setFormData(prev => ({ ...prev, blocks: prev.blocks.map(b => b.id === block.id ? { ...b, imageUrl: url } : b) })))} className="px-3 py-1.5 bg-cyan-600/30 text-cyan-300 text-xs rounded-lg">Pilih Foto</button>
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
          <div className="relative w-full max-w-3xl bg-[#0e0e1a] border border-white/10 rounded-2xl p-6 space-y-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Icon name="image" className="w-5 h-5 text-cyan-400" /> Pilih dari Storage / Media Resource
              </h3>
              <button onClick={() => setIsMediaLibraryOpen(false)} className="p-1 rounded hover:bg-white/10 text-white/50">
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
              {loadingMedia ? (
                <div className="py-12 text-center text-white/40">Memuat berkas dari Storage...</div>
              ) : mediaList.length === 0 ? (
                <div className="py-12 text-center text-white/30">Belum ada berkas tersimpan. Unggah dari form.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {mediaList.map((item, index) => (
                    <div 
                      key={index} 
                      onClick={() => {
                        if (onSelectMediaCallback) onSelectMediaCallback(item.url)
                        setIsMediaLibraryOpen(false)
                      }}
                      className="group cursor-pointer aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-cyan-400 transition-all bg-[#06060E] relative"
                    >
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs bg-cyan-600 text-white px-2 py-1 rounded shadow">Pilih</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-between items-center">
              <span className="text-xs text-white/40">Total: {mediaList.length} file</span>
              <button onClick={() => setIsMediaLibraryOpen(false)} className="px-4 py-2 rounded-xl bg-white/5 text-xs text-white/70 hover:text-white">Batal</button>
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
    </div>
  )
}