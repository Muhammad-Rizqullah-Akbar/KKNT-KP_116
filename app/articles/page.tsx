'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '@/components/ui/Icons'

// Import Firestore Repository & Types
import { 
  getArticles, 
  type ArticleData 
} from '@/lib/firebase/repositories/articles.repo'

// ============ KONSTANTA KATEGORI & LOGO ============
const LOGO_SRC = '/logo.png'

const categories = ['Semua', 'Teknologi', 'Bisnis', 'Karir', 'Data']

const categoryBadgeColors: Record<string, string> = {
  Teknologi: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Bisnis: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  Karir: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Data: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
}

const categoryIcons: Record<string, string> = {
  Teknologi: 'cpu',
  Bisnis: 'piggyBank',
  Karir: 'badgeCheck',
  Data: 'barChart',
}

const categoryGradients: Record<string, string> = {
  Teknologi: 'from-emerald-600/30 via-teal-700/20 to-cyan-800/30',
  Bisnis: 'from-rose-600/25 via-pink-700/20 to-orange-800/25',
  Karir: 'from-amber-600/25 via-yellow-700/20 to-orange-800/25',
  Data: 'from-sky-600/25 via-blue-700/20 to-indigo-800/25',
}

export default function ArticlesPage() {
  // State Data Database
  const [articles, setArticles] = useState<ArticleData[]>([])
  const [loading, setLoading] = useState(true)

  // State Filter, Search & Pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [sortBy, setSortBy] = useState('terbaru')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // ============ 1. FETCH ARTIKEL FIRESTORE ============
  useEffect(() => {
    const fetchPublishedArticles = async () => {
      setLoading(true)
      try {
        const rawArticles = await getArticles()
        // Filter hanya artikel berstatus Published
        const published = rawArticles.filter(a => a.status === 'Published')
        setArticles(published)
      } catch (error) {
        console.error('Gagal mengambil daftar artikel dari Firestore:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPublishedArticles()
  }, [])

  // ============ 2. FILTER & SORT ALGORITHM ============
  const filteredArticles = useMemo(() => {
    let result = [...articles]

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(a => 
        a.title.toLowerCase().includes(term) ||
        a.excerpt.toLowerCase().includes(term) ||
        a.author.toLowerCase().includes(term) ||
        (a.tags && a.tags.some(t => t.toLowerCase().includes(term)))
      )
    }

    // Category filter
    if (selectedCategory !== 'Semua') {
      result = result.filter(a => a.category === selectedCategory)
    }

    // Sort algorithm
    result.sort((a, b) => {
      if (sortBy === 'terbaru') {
        const dateA = new Date(a.date || a.createdAt || 0).getTime()
        const dateB = new Date(b.date || b.createdAt || 0).getTime()
        return dateB - dateA
      }
      if (sortBy === 'terpopuler') {
        return (b.views || 0) - (a.views || 0)
      }
      if (sortBy === 'terlama') {
        const dateA = new Date(a.date || a.createdAt || 0).getTime()
        const dateB = new Date(b.date || b.createdAt || 0).getTime()
        return dateA - dateB
      }
      return 0
    })

    return result
  }, [articles, searchTerm, selectedCategory, sortBy])

  // Reset page ke 1 setiap kali filter berubah
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory, sortBy])

  // ============ 3. PAGINATION CALCULATION ============
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage)
  
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredArticles.slice(start, start + itemsPerPage)
  }, [filteredArticles, currentPage, itemsPerPage])

  // Formatting View Counter & Date
  const formatViews = (views: number) => views >= 1000 ? `${(views / 1000).toFixed(1)}K` : (views || 0).toString()
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-[#06060E] text-white">
      {/* ====== NAVBAR ====== */}
      <nav className="sticky top-0 z-50 bg-[#06060E]/80 backdrop-blur-xl border-b border-white/[0.04] px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
              <Image
                src={LOGO_SRC}
                alt="Logo KKNT-KP UH"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-white">
              KKNT-KP<span className="text-cyan-400"> UH</span>
            </span>
          </Link>
          <Link href="/" className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1.5">
            <Icon name="arrowLeft" className="w-4 h-4" /> Beranda
          </Link>
        </div>
      </nav>

      {/* ====== HERO BANNER ====== */}
      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] mb-4 backdrop-blur-sm shadow-inner">
            <Icon name="bookOpen" className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold tracking-widest uppercase text-emerald-400/90">Knowledge & News Hub</span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-white mb-4">
            Pusat Informasi & <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Edukasi</span>
          </h1>
          <p className="text-white/50 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Eksplorasi wawasan, panduan praktis, serta dokumentasi kegiatan Keamanan Pangan & KKN Tematik secara transparan.
          </p>
        </div>

        {/* ====== SEARCH & FILTER CONTROL BAR ====== */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8 bg-[#080812] border border-white/[0.06] p-3 rounded-2xl shadow-xl">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Cari judul, tag, atau penulis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-md'
                      : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/70 focus:outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
            >
              <option value="terbaru" className="bg-[#080812]">Terbaru</option>
              <option value="terpopuler" className="bg-[#080812]">Terpopuler</option>
              <option value="terlama" className="bg-[#080812]">Terlama</option>
            </select>
          </div>
        </div>

        {/* ====== RESULTS SUMMARY ====== */}
        <div className="flex items-center justify-between mb-6 px-1">
          <p className="text-xs text-white/40">
            Menampilkan <span className="text-cyan-400 font-semibold">{filteredArticles.length}</span> artikel
            {selectedCategory !== 'Semua' && ` dalam kategori "${selectedCategory}"`}
            {searchTerm && ` pencarian "${searchTerm}"`}
          </p>
        </div>

        {/* ====== ARTICLES GRID ====== */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse p-4 space-y-4">
                <div className="w-full h-40 bg-white/5 rounded-xl" />
                <div className="h-4 w-1/3 bg-white/5 rounded" />
                <div className="h-6 w-3/4 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-[#080812] border border-white/[0.05]">
            <Icon name="bookOpen" className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <h3 className="text-white/60 text-lg font-semibold">Tidak ada artikel ditemukan</h3>
            <p className="text-white/30 text-sm mt-1 max-w-sm mx-auto">
              Coba gunakan kata kunci pencarian yang berbeda atau reset filter kategori.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedArticles.map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.slug}`}
                className="group cursor-pointer relative rounded-2xl bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] hover:border-cyan-500/30 transition-all duration-500 hover:-translate-y-2 hover:bg-white/[0.04] overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Hero Image / Featured Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-[#080812]">
                    {article.featuredImage ? (
                      <img 
                        src={article.featuredImage} 
                        alt={article.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${categoryGradients[article.category] || 'from-emerald-700/40 to-cyan-800/40'} flex items-center justify-center`}>
                        <Icon name={(categoryIcons[article.category] as any) || 'fileText'} className="w-16 h-16 text-white/20 group-hover:text-white/40 transition-colors" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-[#06060E] via-transparent to-transparent opacity-80" />
                    
                    {/* Badge Category */}
                    <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full backdrop-blur-md border text-xs font-medium ${categoryBadgeColors[article.category] || 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>
                      {article.category}
                    </div>

                    {/* Views Count */}
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[10px] text-white/70 flex items-center gap-1">
                      <Icon name="eye" className="w-3 h-3 text-cyan-400" /> {formatViews(article.views || 0)}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <span className="flex items-center gap-1"><Icon name="calendar" className="w-3.5 h-3.5" /> {formatDate(article.date)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Icon name="clock" className="w-3.5 h-3.5" /> {article.readTime || 5} min</span>
                    </div>

                    <h3 className="font-display text-lg font-bold text-white group-hover:text-cyan-300 transition-colors duration-300 leading-snug line-clamp-2">
                      {article.title}
                    </h3>

                    <p className="text-white/45 text-xs sm:text-sm leading-relaxed line-clamp-2">
                      {article.excerpt}
                    </p>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-white/[0.04] mt-2">
                  <span className="text-xs text-white/30 truncate max-w-[150px]">
                    {article.author}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-cyan-400 font-medium group-hover:translate-x-1 transition-transform">
                    <span>Baca</span>
                    <Icon name="arrowRight" className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ====== ESTETIK & RESPONSIF PAGINATION ====== */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12 pt-6 border-t border-white/[0.06]">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/60 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Icon name="chevronLeft" className="w-4 h-4" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all ${
                    currentPage === pageNum
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/10 scale-105'
                      : 'bg-white/[0.02] border border-white/[0.05] text-white/40 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/60 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <span className="hidden sm:inline">Selanjutnya</span>
              <Icon name="chevronRight" className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ====== FOOTER ====== */}
      <footer className="relative w-full max-w-6xl mx-auto mb-6 px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#080812] border border-white/[0.05] p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
              <Image src={LOGO_SRC} alt="Logo" width={32} height={32} className="object-contain" />
            </div>
            <span className="font-display font-bold text-sm text-white">
              KKNT-KP<span className="text-cyan-400"> UH</span>
            </span>
          </div>
          <p className="text-xs text-white/30">© 2026 KKNT-KP UH. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}