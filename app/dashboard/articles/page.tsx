'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import { Button } from '@/components/shared/Button'

// ============ DATA DUMMY ============
const initialArticles = [
  {
    id: 1,
    title: 'Tren Teknologi 2026: AI & Beyond',
    slug: 'tren-teknologi-2026-ai-beyond',
    author: 'Dr. Aria Nugraha',
    authorBio: 'Chief Technology Officer di Aether Global Labs dengan pengalaman 15+ tahun di bidang AI dan machine learning. Alumni MIT dan Stanford, Aria telah mempublikasikan 50+ paper penelitian dan memimpin tim inovasi di berbagai perusahaan Fortune 500.',
    category: 'Teknologi',
    status: 'Published',
    views: 12500,
    date: '2026-07-12',
    readTime: 8,
    excerpt: 'Eksplorasi mendalam tentang bagaimana kecerdasan buatan membentuk ulang industri global — dari generative AI hingga edge computing.',
    content: `
      <p>Kecerdasan buatan generatif (<span class="text-white font-medium">Generative AI</span>) telah menjadi katalis utama transformasi digital di tahun 2026. Teknologi ini tidak lagi sekadar menghasilkan teks atau gambar — kini AI mampu menciptakan video, musik, kode program kompleks, dan bahkan desain produk secara otonom.</p>
      
      <h2>1. Revolusi AI Generatif: Dari Teks ke Realitas</h2>
      <p>Kecerdasan buatan generatif telah menjadi katalis utama transformasi digital di tahun 2026. Teknologi ini tidak lagi sekadar menghasilkan teks atau gambar — kini AI mampu menciptakan video, musik, kode program kompleks, dan bahkan desain produk secara otonom.</p>
      
      <blockquote>
        "Edge AI adalah masa depan komputasi cerdas. Dengan memproses data di perangkat lokal, kita mengurangi latensi hingga 90% dan meningkatkan privasi pengguna secara signifikan."
        <cite class="block text-xs text-white/40 mt-2 not-italic">— Dr. Aria Nugraha, CTO Aether Global Labs</cite>
      </blockquote>
      
      <h2>2. Edge AI & Internet of Things (IoT)</h2>
      <p>Salah satu tren paling signifikan adalah pergeseran pemrosesan AI dari cloud ke <span class="text-white font-medium">edge devices</span>. Edge AI memungkinkan perangkat seperti smartphone, kamera pintar, dan sensor industri untuk menjalankan model AI secara lokal tanpa koneksi internet.</p>
    `,
    featuredImage: '',
    tags: ['#AI', '#MachineLearning', '#FutureTech', '#EdgeAI', '#AIEthics'],
    gallery: [
      { id: 'g1', caption: 'Keynote AI Summit 2026 — Jakarta Convention Center', gradient: 'from-cyan-700/50 to-emerald-800/50' },
      { id: 'g2', caption: 'Workshop Edge AI — Bandung Creative Hub', gradient: 'from-violet-700/50 to-purple-800/50' },
      { id: 'g3', caption: 'Panel Diskusi AI Ethics — Surabaya Grand Hall', gradient: 'from-amber-700/50 to-orange-800/50' },
    ]
  },
  {
    id: 2,
    title: 'Strategi Fundraising Startup',
    slug: 'strategi-fundraising-startup',
    author: 'Maya Pratiwi, MBA',
    authorBio: 'Praktisi bisnis dan startup dengan pengalaman 10+ tahun di industri keuangan dan pendanaan.',
    category: 'Bisnis',
    status: 'Draft',
    views: 0,
    date: '2026-07-05',
    readTime: 6,
    excerpt: 'Panduan lengkap mendapatkan pendanaan dari tahap seed hingga series A.',
    content: '<p>Panduan lengkap mendapatkan pendanaan dari tahap seed hingga series A.</p>',
    featuredImage: '',
    tags: ['#Fundraising', '#Startup', '#Bisnis'],
    gallery: []
  },
  {
    id: 3,
    title: 'Membangun Personal Brand',
    slug: 'membangun-personal-brand',
    author: 'Rian Hermawan',
    authorBio: 'Personal Branding Expert dan Public Speaker dengan pengalaman membangun brand untuk 100+ profesional.',
    category: 'Karir',
    status: 'Published',
    views: 8200,
    date: '2026-06-28',
    readTime: 5,
    excerpt: 'Cara efektif membangun reputasi profesional yang kuat di era digital.',
    content: '<p>Cara efektif membangun reputasi profesional yang kuat di era digital.</p>',
    featuredImage: '',
    tags: ['#PersonalBrand', '#Karir', '#Profesional'],
    gallery: []
  },
  {
    id: 4,
    title: 'Data Analytics untuk Bisnis',
    slug: 'data-analytics-untuk-bisnis',
    author: 'Dr. Sari Dewanti',
    authorBio: 'Data Scientist dengan pengalaman 12+ tahun di bidang analitik data dan business intelligence.',
    category: 'Data',
    status: 'Published',
    views: 6900,
    date: '2026-06-20',
    readTime: 7,
    excerpt: 'Optimalkan keputusan bisnis Anda dengan pendekatan data-driven.',
    content: '<p>Optimalkan keputusan bisnis Anda dengan pendekatan data-driven.</p>',
    featuredImage: '',
    tags: ['#DataAnalytics', '#Bisnis', '#DataDriven'],
    gallery: []
  },
]

type Article = typeof initialArticles[0]

const categoryColors: Record<string, string> = {
  Teknologi: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Bisnis: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  Karir: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Data: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
}

const categoryIcons: Record<string, string> = {
  Teknologi: 'cpu',
  Bisnis: 'piggyBank',
  Karir: 'badgeCheck',
  Data: 'barChart',
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

const relatedArticles = [
  { title: 'Strategi Fundraising Startup', category: 'Bisnis', date: '5 Juli 2026', readTime: 6 },
  { title: 'Membangun Personal Brand', category: 'Karir', date: '28 Juni 2026', readTime: 5 },
  { title: 'Data Analytics untuk Bisnis', category: 'Data', date: '20 Juni 2026', readTime: 7 },
]

const relatedCategoryColors: Record<string, string> = {
  Bisnis: 'text-rose-400',
  Karir: 'text-amber-400',
  Data: 'text-sky-400',
}

// ============ COMPONENT ============
export default function ArticlesPage() {
  // State
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('Semua Kategori')
  const [filterStatus, setFilterStatus] = useState('Semua Status')
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [articleToDelete, setArticleToDelete] = useState<number | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<{ id: string; caption: string; gradient: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeHeading, setActiveHeading] = useState<string>('')

  const itemsPerPage = 10

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    author: '',
    authorBio: '',
    status: 'Draft' as 'Draft' | 'Published',
    readTime: 8,
    featuredImage: '',
    excerpt: '',
    content: '',
    tags: '',
    gallery: [] as { id: string; caption: string; gradient: string }[],
  })

  // ============ FILTER & PAGINATION ============
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          article.author.toLowerCase().includes(searchTerm.toLowerCase())
      const matchCategory = filterCategory === 'Semua Kategori' || article.category === filterCategory
      const matchStatus = filterStatus === 'Semua Status' || article.status === filterStatus
      return matchSearch && matchCategory && matchStatus
    })
  }, [articles, searchTerm, filterCategory, filterStatus])

  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage)
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredArticles.slice(start, end)
  }, [filteredArticles, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterCategory, filterStatus])

  // Stats
  const stats = useMemo(() => {
    const total = articles.length
    const published = articles.filter(a => a.status === 'Published').length
    const draft = articles.filter(a => a.status === 'Draft').length
    const views = articles.reduce((acc, a) => acc + a.views, 0)
    const categories = new Set(articles.map(a => a.category)).size
    return { total, published, draft, views, categories }
  }, [articles])

  // ============ CRUD OPERATIONS ============
  const handleCreate = () => {
    setIsEditing(false)
    setFormData({
      title: '',
      category: '',
      author: '',
      authorBio: '',
      status: 'Draft',
      readTime: 8,
      featuredImage: '',
      excerpt: '',
      content: '',
      tags: '',
      gallery: [],
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
      status: article.status as 'Draft' | 'Published',
      readTime: article.readTime,
      featuredImage: article.featuredImage || '',
      excerpt: article.excerpt,
      content: article.content,
      tags: article.tags.join(', '),
      gallery: article.gallery || [],
    })
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (!formData.title.trim()) { alert('Judul artikel harus diisi!'); return }
    if (!formData.category) { alert('Kategori harus dipilih!'); return }
    if (!formData.author.trim()) { alert('Nama penulis harus diisi!'); return }
    if (!formData.content.trim()) { alert('Konten artikel harus diisi!'); return }

    if (isEditing && selectedArticle) {
      setArticles(prev => prev.map(a => 
        a.id === selectedArticle.id 
          ? {
              ...a,
              title: formData.title,
              category: formData.category,
              author: formData.author,
              authorBio: formData.authorBio,
              status: formData.status,
              readTime: formData.readTime,
              featuredImage: formData.featuredImage,
              excerpt: formData.excerpt,
              content: formData.content,
              tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
              gallery: formData.gallery,
            }
          : a
      ))
      setSuccessMessage('Artikel berhasil diperbarui!')
    } else {
      const newArticle: Article = {
        id: Math.max(...articles.map(a => a.id)) + 1,
        title: formData.title,
        slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        author: formData.author,
        authorBio: formData.authorBio,
        category: formData.category,
        status: formData.status,
        views: 0,
        date: new Date().toISOString().split('T')[0],
        readTime: formData.readTime,
        excerpt: formData.excerpt,
        content: formData.content,
        featuredImage: formData.featuredImage,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        gallery: formData.gallery,
      }
      setArticles(prev => [newArticle, ...prev])
      setSuccessMessage('Artikel berhasil dibuat!')
    }

    setIsModalOpen(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleDelete = (id: number) => {
    setArticleToDelete(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (articleToDelete) {
      setArticles(prev => prev.filter(a => a.id !== articleToDelete))
      setSuccessMessage('Artikel berhasil dihapus!')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }
    setIsDeleteModalOpen(false)
    setArticleToDelete(null)
  }

  // ============ PREVIEW ============
  const handlePreview = (article: Article) => {
    setSelectedArticle(article)
    setIsPreviewOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closePreview = () => {
    setIsPreviewOpen(false)
    document.body.style.overflow = ''
  }

  // ============ LIGHTBOX ============
  const openLightbox = (image: { id: string; caption: string; gradient: string }) => {
    setLightboxImage(image)
    setIsLightboxOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
    document.body.style.overflow = ''
  }

  // ============ COPY LINK ============
  const handleCopyLink = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ============ GALLERY MANAGEMENT ============
  const galleryGradients = [
    'from-cyan-700/50 to-emerald-800/50',
    'from-violet-700/50 to-purple-800/50',
    'from-amber-700/50 to-orange-800/50',
    'from-rose-700/50 to-pink-800/50',
    'from-lime-700/50 to-green-800/50',
    'from-sky-700/50 to-blue-800/50',
  ]

  const addGalleryImage = () => {
    const newId = `g${Date.now()}`
    setFormData(prev => ({
      ...prev,
      gallery: [
        ...prev.gallery,
        {
          id: newId,
          caption: `Foto ${prev.gallery.length + 1}`,
          gradient: galleryGradients[prev.gallery.length % galleryGradients.length],
        }
      ]
    }))
  }

  const removeGalleryImage = (id: string) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter(g => g.id !== id)
    }))
  }

  const updateGalleryCaption = (id: string, caption: string) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.map(g => g.id === id ? { ...g, caption } : g)
    }))
  }

  const moveGalleryImage = (id: string, direction: 'up' | 'down') => {
    const index = formData.gallery.findIndex(g => g.id === id)
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === formData.gallery.length - 1) return
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    const newGallery = [...formData.gallery]
    const [moved] = newGallery.splice(index, 1)
    newGallery.splice(newIndex, 0, moved)
    setFormData(prev => ({ ...prev, gallery: newGallery }))
  }

  // ============ RENDER FUNCTIONS ============
  const formatViews = (views: number) => {
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views.toString()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const extractHeadings = (content: string) => {
    const headingRegex = /<h2>(.*?)<\/h2>/g
    const matches = []
    let match
    while ((match = headingRegex.exec(content)) !== null) {
      matches.push(match[1])
    }
    return matches
  }

  // ============ RENDER ============
  return (
    <div className="flex flex-col min-h-screen">
      <style>{`
        .editor-area:empty:before {
          content: attr(data-placeholder);
          color: rgba(255, 255, 255, 0.25);
          pointer-events: none;
        }
        .editor-area:focus {
          outline: none;
        }
        .article-preview blockquote {
          border-left: 3px solid rgba(6, 182, 212, 0.5);
          padding-left: 1.5rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: rgba(255, 255, 255, 0.7);
        }
        .article-preview blockquote cite {
          display: block;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 0.5rem;
          font-style: normal;
        }
        .article-preview ul {
          list-style: none;
          padding: 0;
          margin: 1rem 0;
        }
        .article-preview ul li {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.5rem 0;
          color: rgba(255, 255, 255, 0.6);
        }
        .article-preview ul li:before {
          content: "✓";
          color: #10b981;
          font-weight: bold;
          flex-shrink: 0;
        }
        .article-preview h2 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: white;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .article-preview p {
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.8;
          margin-bottom: 1rem;
        }
        .article-preview .text-white {
          color: white !important;
        }
        .article-preview .font-medium {
          font-weight: 500 !important;
        }
        .article-preview .text-emerald-400 {
          color: #34d399 !important;
        }
      `}</style>

      <Topbar 
        title="Manajemen Materi Edukasi" 
        subtitle="Kelola artikel edukasi" 
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Success Notification */}
        {showSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 animate-slideUp">
            <Icon name="checkCircle" className="w-5 h-5 text-emerald-400" />
            <p className="text-sm text-white">{successMessage}</p>
            <button 
              onClick={() => setShowSuccess(false)}
              className="ml-auto p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              <Icon name="x" className="w-4 h-4 text-white/50" />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 uppercase tracking-wider">Total Artikel</span>
              <Icon name="fileText" className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-3xl font-bold font-display">{stats.total}</p>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <Icon name="trendingUp" className="w-3 h-3" /> +12% bulan ini
            </p>
          </div>
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 uppercase tracking-wider">Published</span>
              <Icon name="checkCircle" className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold font-display">{stats.published}</p>
            <p className="text-xs text-white/35 mt-1">Dari {stats.total} total</p>
          </div>
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 uppercase tracking-wider">Draft</span>
              <Icon name="edit" className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-bold font-display">{stats.draft}</p>
            <p className="text-xs text-white/35 mt-1">Menunggu review</p>
          </div>
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 uppercase tracking-wider">Total Views</span>
              <Icon name="eye" className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-3xl font-bold font-display">{stats.views >= 1000 ? `${(stats.views / 1000).toFixed(1)}K` : stats.views}</p>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <Icon name="trendingUp" className="w-3 h-3" /> +24% bulan ini
            </p>
          </div>
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 uppercase tracking-wider">Kategori</span>
              <Icon name="tag" className="w-4 h-4 text-violet-400" />
            </div>
            <p className="text-3xl font-bold font-display">{stats.categories}</p>
            <p className="text-xs text-white/35 mt-1">Teknologi, Bisnis, dll</p>
          </div>
        </div>

        {/* Filter & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                type="text"
                placeholder="Cari artikel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-400/40 transition-all w-64"
              />
            </div>
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer"
            >
              {categoryOptions.map(opt => (
                <option key={opt} value={opt} className="bg-[#080812]">{opt}</option>
              ))}
            </select>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer"
            >
              {statusOptions.map(opt => (
                <option key={opt} value={opt} className="bg-[#080812]">{opt}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25"
          >
            <Icon name="plus" className="w-4 h-4" /> Buat Artikel Baru
          </button>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-[#080812] border border-white/[0.05] overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
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
                {paginatedArticles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-white/30">
                      <Icon name="fileText" className="w-8 h-8 mx-auto mb-2 text-white/10" />
                      <p>Artikel tidak ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  paginatedArticles.map((article) => {
                    const IconComponent = categoryIcons[article.category] || 'fileText'
                    return (
                      <tr key={article.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categoryGradients[article.category] || 'from-gray-700/40 to-gray-800/40'} flex items-center justify-center flex-shrink-0`}>
                              <Icon name={IconComponent as any} className={`w-5 h-5 ${
                                article.category === 'Teknologi' ? 'text-emerald-400' :
                                article.category === 'Bisnis' ? 'text-rose-400' :
                                article.category === 'Karir' ? 'text-amber-400' :
                                'text-sky-400'
                              }`} />
                            </div>
                            <div>
                              <p className="text-white font-medium leading-tight">{article.title}</p>
                              <p className="text-xs text-white/35 mt-0.5">{article.author}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full border text-xs ${categoryColors[article.category]}`}>
                            {article.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full border text-xs flex items-center gap-1.5 w-fit ${statusColors[article.status]}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${article.status === 'Published' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                            {article.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/60">{article.status === 'Published' ? formatViews(article.views) : '—'}</td>
                        <td className="px-6 py-4 text-white/40 text-xs">{formatDate(article.date)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEdit(article)}
                              className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors group"
                              title="Edit"
                            >
                              <Icon name="pencil" className="w-4 h-4 text-white/50 group-hover:text-cyan-400 transition-colors" />
                            </button>
                            <button 
                              onClick={() => handlePreview(article)}
                              className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors group"
                              title="Preview"
                            >
                              <Icon name="eye" className="w-4 h-4 text-white/50 group-hover:text-sky-400 transition-colors" />
                            </button>
                            <button 
                              onClick={() => handleDelete(article.id)}
                              className="p-2 rounded-lg hover:bg-red-500/10 transition-colors group"
                              title="Hapus"
                            >
                              <Icon name="trash" className="w-4 h-4 text-white/50 group-hover:text-red-400 transition-colors" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredArticles.length > itemsPerPage && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.05]">
              <p className="text-xs text-white/35">
                Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-
                {Math.min(currentPage * itemsPerPage, filteredArticles.length)} dari {filteredArticles.length} artikel
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-white/40 hover:text-white hover:border-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Icon name="chevronLeft" className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) pageNum = i + 1
                  else if (currentPage <= 3) pageNum = i + 1
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                  else pageNum = currentPage - 2 + i
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                          : 'bg-white/[0.02] border border-white/[0.05] text-white/40 hover:text-white hover:border-white/10'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-white/20">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.05] text-xs text-white/40 hover:text-white hover:border-white/10 transition-all"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-white/40 hover:text-white hover:border-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Icon name="chevronRight" className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============ CREATE/EDIT MODAL ============ */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 px-4 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="font-display text-lg font-semibold">
                {isEditing ? 'Edit Artikel' : 'Buat Artikel Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center transition-colors"
              >
                <Icon name="x" className="w-5 h-5 text-white/50" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Row 1: Judul + Kategori */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Judul Artikel</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Masukkan judul artikel..."
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/70 focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer"
                  >
                    <option value="" className="bg-[#0e0e1a]">Pilih Kategori</option>
                    <option value="Teknologi" className="bg-[#0e0e1a]">Teknologi</option>
                    <option value="Bisnis" className="bg-[#0e0e1a]">Bisnis</option>
                    <option value="Karir" className="bg-[#0e0e1a]">Karir</option>
                    <option value="Data" className="bg-[#0e0e1a]">Data</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Penulis + Status + Waktu Baca */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Penulis</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Nama penulis..."
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Draft' | 'Published' })}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/70 focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer"
                  >
                    <option value="Draft" className="bg-[#0e0e1a]">Draft</option>
                    <option value="Published" className="bg-[#0e0e1a]">Published</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Waktu Baca (menit)</label>
                  <input
                    type="number"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: parseInt(e.target.value) || 0 })}
                    placeholder="8"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                  />
                </div>
              </div>

              {/* Row 3: Featured Image */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 uppercase tracking-wider">URL Gambar Utama</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={formData.featuredImage}
                    onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                  />
                  <button className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/50 hover:text-white hover:border-cyan-400/20 transition-all">
                    Upload
                  </button>
                </div>
                <div className="w-full h-40 rounded-xl bg-gradient-to-br from-cyan-700/30 to-emerald-800/30 border border-white/[0.05] flex items-center justify-center mt-2 overflow-hidden">
                  {formData.featuredImage ? (
                    <img src={formData.featuredImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="image" className="w-10 h-10 text-white/20" />
                  )}
                </div>
              </div>

              {/* Row 4: Subtitle */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 uppercase tracking-wider">Subtitle / Ringkasan</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={2}
                  placeholder="Tulis ringkasan artikel..."
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all resize-none"
                />
              </div>

              {/* Row 5: Author Bio */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 uppercase tracking-wider">Bio Penulis</label>
                <textarea
                  value={formData.authorBio}
                  onChange={(e) => setFormData({ ...formData, authorBio: e.target.value })}
                  rows={2}
                  placeholder="Tulis bio singkat penulis..."
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all resize-none"
                />
              </div>

              {/* Row 6: Content */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 uppercase tracking-wider">Konten Artikel</label>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                  <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.05] bg-white/[0.01] flex-wrap">
                    <button className="p-1.5 rounded hover:bg-white/[0.05] transition-colors">
                      <Icon name="bold" className="w-4 h-4 text-white/40" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-white/[0.05] transition-colors">
                      <Icon name="italic" className="w-4 h-4 text-white/40" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-white/[0.05] transition-colors">
                      <Icon name="underline" className="w-4 h-4 text-white/40" />
                    </button>
                    <span className="w-px h-5 bg-white/[0.08] mx-1" />
                    <button className="p-1.5 rounded hover:bg-white/[0.05] transition-colors">
                      <Icon name="list" className="w-4 h-4 text-white/40" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-white/[0.05] transition-colors">
                      <Icon name="listOrdered" className="w-4 h-4 text-white/40" />
                    </button>
                    <span className="w-px h-5 bg-white/[0.08] mx-1" />
                    <button className="p-1.5 rounded hover:bg-white/[0.05] transition-colors">
                      <Icon name="link" className="w-4 h-4 text-white/40" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-white/[0.05] transition-colors">
                      <Icon name="image" className="w-4 h-4 text-white/40" />
                    </button>
                  </div>
                  <div
                    className="editor-area p-4 min-h-[250px] text-white/70 text-sm leading-relaxed focus:outline-none"
                    contentEditable
                    data-placeholder="Tulis konten artikel di sini... (gunakan <h2> untuk heading, <blockquote> untuk kutipan, <ul> untuk list)"
                    dangerouslySetInnerHTML={{ __html: formData.content }}
                    onInput={(e) => setFormData({ ...formData, content: e.currentTarget.innerHTML })}
                  />
                </div>
                <p className="text-xs text-white/20">Gunakan &lt;h2&gt; untuk heading, &lt;blockquote&gt; untuk kutipan, &lt;ul&gt; untuk list</p>
              </div>

              {/* Row 7: Tags */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 uppercase tracking-wider">Tags (pisahkan dengan koma)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="#AI, #MachineLearning, #FutureTech"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                />
              </div>

              {/* Gallery Management */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Galeri Gambar</label>
                  <button
                    onClick={addGalleryImage}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                  >
                    <Icon name="plus" className="w-3 h-3" /> Tambah Gambar
                  </button>
                </div>
                {formData.gallery.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center text-white/30 text-sm">
                    Belum ada gambar di galeri. Klik "Tambah Gambar" untuk menambahkan.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {formData.gallery.map((img, index) => (
                      <div key={img.id} className="group relative rounded-xl overflow-hidden border border-white/[0.05]">
                        <div className={`aspect-square bg-gradient-to-br ${img.gradient} flex items-center justify-center`}>
                          <Icon name="image" className="w-8 h-8 text-white/30 group-hover:text-white/50 transition-colors" />
                        </div>
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <input
                            type="text"
                            value={img.caption}
                            onChange={(e) => updateGalleryCaption(img.id, e.target.value)}
                            placeholder="Caption..."
                            className="w-full px-2 py-1 text-xs bg-black/60 border border-white/10 rounded text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/40 transition-all"
                          />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => moveGalleryImage(img.id, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded bg-black/60 hover:bg-black/80 transition-colors disabled:opacity-30"
                          >
                            <Icon name="arrowUp" className="w-3 h-3 text-white" />
                          </button>
                          <button
                            onClick={() => moveGalleryImage(img.id, 'down')}
                            disabled={index === formData.gallery.length - 1}
                            className="p-1 rounded bg-black/60 hover:bg-black/80 transition-colors disabled:opacity-30"
                          >
                            <Icon name="arrowDown" className="w-3 h-3 text-white" />
                          </button>
                          <button
                            onClick={() => removeGalleryImage(img.id)}
                            className="p-1 rounded bg-black/60 hover:bg-red-500/60 transition-colors"
                          >
                            <Icon name="trash" className="w-3 h-3 text-white" />
                          </button>
                        </div>
                        <div className="absolute bottom-2 right-2 text-[10px] text-white/30 bg-black/40 px-1.5 py-0.5 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.03] transition-all"
              >
                Batal
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setFormData({ ...formData, status: 'Draft' })
                    handleSave()
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 hover:text-white transition-all flex items-center gap-2"
                >
                  <Icon name="save" className="w-4 h-4" /> Simpan Draft
                </button>
                <button
                  onClick={() => {
                    setFormData({ ...formData, status: 'Published' })
                    handleSave()
                  }}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25 flex items-center gap-2"
                >
                  <Icon name="send" className="w-4 h-4" /> Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ FULL PREVIEW MODAL (Seperti detail-edu.html) ============ */}
      {isPreviewOpen && selectedArticle && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}
        >
          {/* Preview Content - Like detail-edu.html */}
          <div className="relative min-h-screen bg-[#06060E]">
            {/* Close Button */}
            <button
              onClick={closePreview}
              className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors backdrop-blur-sm border border-white/10"
            >
              <Icon name="x" className="w-5 h-5 text-white" />
            </button>

            {/* Preview Label */}
            <div className="fixed top-4 left-4 z-50 px-4 py-2 rounded-full bg-cyan-500/20 backdrop-blur-sm border border-cyan-500/20 text-xs text-cyan-400 font-medium">
              <Icon name="eye" className="w-3.5 h-3.5 inline mr-2" />
              Preview Artikel
            </div>

            {/* ====== NAVBAR ====== */}
            <nav className="sticky top-0 z-40 w-full px-4 sm:px-6 lg:px-8 py-4 bg-[#06060E]/80 backdrop-blur-xl border-b border-white/[0.04]">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Icon name="hexagon" className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-display font-bold text-lg tracking-tight text-white">
                    Aether<span className="text-cyan-400">Global</span>
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={closePreview}
                    className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Icon name="arrowLeft" className="w-4 h-4" /> Kembali
                  </button>
                  <button className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 hover:text-white hover:border-cyan-400/20 transition-all flex items-center gap-2">
                    <Icon name="share2" className="w-4 h-4" /> Bagikan
                  </button>
                </div>
              </div>
            </nav>

            {/* ====== HERO HEADER ====== */}
            <header className="relative w-full max-w-6xl mx-auto mt-6 sm:mt-10 px-4 sm:px-6 lg:px-8">
              <div className="relative overflow-hidden rounded-3xl bg-[#080812] bg-grid-pattern">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-30"></div>

                <div className="relative z-10">
                  {/* Featured Image */}
                  <div className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden rounded-t-3xl">
                    <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradients[selectedArticle.category] || 'from-gray-700/40 to-gray-800/40'} flex items-center justify-center`}>
                      {selectedArticle.featuredImage ? (
                        <img src={selectedArticle.featuredImage} alt={selectedArticle.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <Icon name="image" className="w-20 h-20 sm:w-24 sm:h-24 text-white/20 mb-4 animate-float" />
                          <p className="text-white/20 text-sm font-mono">[ Featured Image: {selectedArticle.title} ]</p>
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080812] via-[#080812]/40 to-transparent"></div>

                    {/* Labels */}
                    <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-xs font-medium ${
                        selectedArticle.category === 'Teknologi' ? 'text-emerald-400' :
                        selectedArticle.category === 'Bisnis' ? 'text-rose-400' :
                        selectedArticle.category === 'Karir' ? 'text-amber-400' :
                        'text-sky-400'
                      }`}>
                        <Icon name={categoryIcons[selectedArticle.category] as any} className="w-3.5 h-3.5" />
                        {selectedArticle.category}
                      </span>
                      {selectedArticle.status === 'Published' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-xs font-medium text-cyan-400">
                          <Icon name="trendingUp" className="w-3.5 h-3.5" /> Trending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-16 lg:py-12 -mt-12 relative z-20">
                    <div className="flex items-center gap-2 text-xs text-white/35 mb-4">
                      <span className="hover:text-white/60 transition-colors">Beranda</span>
                      <Icon name="chevronRight" className="w-3 h-3" />
                      <span className="hover:text-white/60 transition-colors">Edukasi</span>
                      <Icon name="chevronRight" className="w-3 h-3" />
                      <span className={`${
                        selectedArticle.category === 'Teknologi' ? 'text-emerald-400/80' :
                        selectedArticle.category === 'Bisnis' ? 'text-rose-400/80' :
                        selectedArticle.category === 'Karir' ? 'text-amber-400/80' :
                        'text-sky-400/80'
                      }`}>{selectedArticle.category}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="text-xs text-white/40 flex items-center gap-1">
                        <Icon name="calendar" className="w-3.5 h-3.5" /> {formatDate(selectedArticle.date)}
                      </span>
                      <span className="text-xs text-white/25">•</span>
                      <span className="text-xs text-white/40 flex items-center gap-1">
                        <Icon name="clock" className="w-3.5 h-3.5" /> {selectedArticle.readTime} menit baca
                      </span>
                      <span className="text-xs text-white/25">•</span>
                      <span className="text-xs text-white/40 flex items-center gap-1">
                        <Icon name="eye" className="w-3.5 h-3.5" /> {formatViews(selectedArticle.views)} views
                      </span>
                    </div>

                    <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] mb-4 max-w-4xl">
                      {selectedArticle.title}
                    </h1>

                    <p className="text-lg sm:text-xl text-white/50 max-w-3xl leading-relaxed mb-6">
                      {selectedArticle.excerpt}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20">
                          {selectedArticle.author.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{selectedArticle.author}</p>
                          <p className="text-xs text-white/40">{selectedArticle.authorBio || 'Penulis'}</p>
                        </div>
                      </div>
                      <span className="text-xs text-white/25 italic">Foto: Aether Visual Labs / AI Generated</span>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* ====== MAIN CONTENT ====== */}
            <main className="relative w-full max-w-6xl mx-auto mt-8 sm:mt-10 px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                {/* Sidebar Kiri - TOC */}
                <aside className="hidden lg:block lg:col-span-3">
                  <div className="sticky top-28 space-y-6">
                    <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
                      <h4 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                        <Icon name="list" className="w-4 h-4 text-cyan-400" /> Daftar Isi
                      </h4>
                      {extractHeadings(selectedArticle.content).length === 0 ? (
                        <p className="text-sm text-white/30">Tidak ada daftar isi</p>
                      ) : (
                        <nav className="space-y-2">
                          {extractHeadings(selectedArticle.content).map((heading: string, index: number) => (
                            <a
                              key={index}
                              href={`#section-${index + 1}`}
                              className="block text-sm text-white/45 hover:text-cyan-400 transition-colors py-1.5 border-l-2 border-transparent hover:border-cyan-400 pl-3"
                            >
                              {index + 1}. {heading}
                            </a>
                          ))}
                        </nav>
                      )}
                    </div>

                    <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
                      <h4 className="text-sm font-semibold text-white/80 mb-4">Bagikan</h4>
                      <div className="flex gap-3">
                        <button className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-cyan-500/10 hover:border-cyan-400/20 transition-all">
                          <Icon name="twitter" className="w-4 h-4 text-white/60" />
                        </button>
                        <button className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-cyan-500/10 hover:border-cyan-400/20 transition-all">
                          <Icon name="linkedin" className="w-4 h-4 text-white/60" />
                        </button>
                        <button
                          onClick={handleCopyLink}
                          className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-cyan-500/10 hover:border-cyan-400/20 transition-all relative"
                        >
                          <Icon name="link" className="w-4 h-4 text-white/60" />
                          {copied && (
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black/80 text-white text-[10px] whitespace-nowrap">
                              Link disalin!
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* Konten Utama */}
                <article className="lg:col-span-6 article-preview text-white/60 leading-relaxed space-y-8 text-base sm:text-lg">
                  <div dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 pt-8 border-t border-white/[0.06]">
                    {selectedArticle.tags.map((tag: string) => (
                      <span key={tag} className="px-3 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/15 text-xs text-emerald-400">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Author Bio */}
                  <div className="mt-10 p-6 rounded-2xl bg-[#080812] border border-white/[0.06] flex flex-col sm:flex-row gap-5 items-start">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                      {selectedArticle.author.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-lg">{selectedArticle.author}</h4>
                      <p className="text-white/50 text-sm mt-1">{selectedArticle.authorBio || 'Penulis artikel ini.'}</p>
                    </div>
                  </div>
                </article>

                {/* Sidebar Kanan - Related Articles & Newsletter */}
                <aside className="lg:col-span-3">
                  <div className="sticky top-28 space-y-6">
                    <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
                      <h4 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                        <Icon name="bookOpen" className="w-4 h-4 text-emerald-400" /> Artikel Terkait
                      </h4>
                      {relatedArticles.map((article, index) => (
                        <a
                          key={index}
                          href="#"
                          className="block group p-3 rounded-xl hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/[0.05]"
                        >
                          <p className={`text-xs ${relatedCategoryColors[article.category] || 'text-white/40'} mb-1`}>
                            {article.category}
                          </p>
                          <h5 className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                            {article.title}
                          </h5>
                          <p className="text-xs text-white/35 mt-1">{article.date} • {article.readTime} min</p>
                        </a>
                      ))}
                    </div>

                    <div className={`rounded-2xl bg-gradient-to-br ${
                      selectedArticle.category === 'Teknologi' ? 'from-cyan-600/20 to-emerald-600/20' :
                      selectedArticle.category === 'Bisnis' ? 'from-rose-600/20 to-amber-600/20' :
                      selectedArticle.category === 'Karir' ? 'from-amber-600/20 to-orange-600/20' :
                      'from-sky-600/20 to-blue-600/20'
                    } border border-cyan-500/10 p-6`}>
                      <Icon name="mail" className="w-8 h-8 text-cyan-400 mb-3" />
                      <h4 className="text-white font-semibold mb-2">Dapatkan Update</h4>
                      <p className="text-white/50 text-sm mb-4">Langganan newsletter untuk artikel terbaru.</p>
                      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                        <input
                          type="email"
                          placeholder="email@anda.com"
                          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-400/40"
                        />
                        <button
                          type="submit"
                          className="w-full px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all"
                        >
                          <Icon name="send" className="w-4 h-4" /> Berlangganan
                        </button>
                      </form>
                    </div>
                  </div>
                </aside>
              </div>
            </main>

            {/* Footer */}
            <footer className="relative w-full max-w-6xl mx-auto mt-16 mb-6 px-4 sm:px-6 lg:px-8">
              <div className="rounded-3xl bg-[#080812] border border-white/[0.05] p-8 sm:p-10">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
                      <Icon name="hexagon" className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-display font-bold text-sm text-white">Aether<span className="text-cyan-400">Global</span></span>
                  </div>
                  <p className="text-xs text-white/25">© 2024 Aether Global. All rights reserved.</p>
                </div>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* ============ DELETE MODAL ============ */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Icon name="alertCircle" className="w-8 h-8 text-rose-400" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">Hapus Artikel</h3>
              <p className="text-sm text-white/50 mb-6">
                Apakah Anda yakin ingin menghapus artikel ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 hover:text-white transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-medium text-white transition-all"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}