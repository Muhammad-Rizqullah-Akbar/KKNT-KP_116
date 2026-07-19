'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'

// ============ DATA DUMMY ============
const allArticles = [
  {
    id: 1,
    title: 'Tren Teknologi 2026: AI & Beyond',
    slug: 'tren-teknologi-2026-ai-beyond',
    excerpt: 'Eksplorasi mendalam tentang bagaimana kecerdasan buatan membentuk ulang industri global — dari generative AI hingga edge computing.',
    category: 'Teknologi',
    author: 'Dr. Aria Nugraha',
    date: '12 Juli 2026',
    readTime: 8,
    views: 12500,
    gradient: 'from-emerald-600/30 via-teal-700/20 to-cyan-800/30',
    icon: 'cpu',
    iconColor: 'text-emerald-400',
    tags: ['#AI', '#MachineLearning', '#FutureTech']
  },
  {
    id: 2,
    title: 'Strategi Fundraising Startup',
    slug: 'strategi-fundraising-startup',
    excerpt: 'Panduan lengkap mendapatkan pendanaan dari tahap seed hingga series A.',
    category: 'Bisnis',
    author: 'Maya Pratiwi, MBA',
    date: '5 Juli 2026',
    readTime: 6,
    views: 8200,
    gradient: 'from-rose-600/25 via-pink-700/20 to-orange-800/25',
    icon: 'piggyBank',
    iconColor: 'text-rose-400',
    tags: ['#Fundraising', '#Startup', '#Bisnis']
  },
  {
    id: 3,
    title: 'Membangun Personal Brand',
    slug: 'membangun-personal-brand',
    excerpt: 'Cara efektif membangun reputasi profesional yang kuat di era digital.',
    category: 'Karir',
    author: 'Rian Hermawan',
    date: '28 Juni 2026',
    readTime: 5,
    views: 5600,
    gradient: 'from-amber-600/25 via-yellow-700/20 to-orange-800/25',
    icon: 'badgeCheck',
    iconColor: 'text-amber-400',
    tags: ['#PersonalBrand', '#Karir', '#Profesional']
  },
  {
    id: 4,
    title: 'Data Analytics untuk Bisnis',
    slug: 'data-analytics-untuk-bisnis',
    excerpt: 'Optimalkan keputusan bisnis Anda dengan pendekatan data-driven.',
    category: 'Data',
    author: 'Dr. Sari Dewanti',
    date: '20 Juni 2026',
    readTime: 7,
    views: 6900,
    gradient: 'from-sky-600/25 via-blue-700/20 to-indigo-800/25',
    icon: 'barChart',
    iconColor: 'text-sky-400',
    tags: ['#DataAnalytics', '#Bisnis', '#DataDriven']
  },
  {
    id: 5,
    title: 'AI Ethics: Tantangan dan Solusi',
    slug: 'ai-ethics-tantangan-dan-solusi',
    excerpt: 'Membahas tantangan etika dalam pengembangan AI dan solusi yang dapat diterapkan.',
    category: 'Teknologi',
    author: 'Dr. Budi Santoso',
    date: '15 Juni 2026',
    readTime: 10,
    views: 4300,
    gradient: 'from-violet-600/25 via-purple-700/20 to-indigo-800/25',
    icon: 'shieldCheck',
    iconColor: 'text-violet-400',
    tags: ['#AIEthics', '#Regulasi', '#Teknologi']
  },
  {
    id: 6,
    title: 'Digital Marketing untuk UMKM',
    slug: 'digital-marketing-untuk-umkm',
    excerpt: 'Strategi digital marketing yang efektif untuk meningkatkan penjualan UMKM.',
    category: 'Bisnis',
    author: 'Dewi Lestari, S.E.',
    date: '10 Juni 2026',
    readTime: 6,
    views: 3800,
    gradient: 'from-emerald-600/25 via-teal-700/20 to-cyan-800/25',
    icon: 'trendingUp',
    iconColor: 'text-emerald-400',
    tags: ['#DigitalMarketing', '#UMKM', '#Bisnis']
  },
  {
    id: 7,
    title: 'Cara Menulis CV yang Menarik',
    slug: 'cara-menulis-cv-yang-menarik',
    excerpt: 'Panduan menulis CV yang menarik perhatian recruiter dan meningkatkan peluang kerja.',
    category: 'Karir',
    author: 'Rina Wati, HRD',
    date: '5 Juni 2026',
    readTime: 4,
    views: 9200,
    gradient: 'from-amber-600/25 via-yellow-700/20 to-orange-800/25',
    icon: 'fileText',
    iconColor: 'text-amber-400',
    tags: ['#CV', '#Karir', '#TipsKerja']
  },
  {
    id: 8,
    title: 'Big Data untuk Prediksi Bisnis',
    slug: 'big-data-untuk-prediksi-bisnis',
    excerpt: 'Bagaimana big data dapat digunakan untuk memprediksi tren bisnis di masa depan.',
    category: 'Data',
    author: 'Dr. Andi Wijaya',
    date: '1 Juni 2026',
    readTime: 9,
    views: 3100,
    gradient: 'from-sky-600/25 via-blue-700/20 to-indigo-800/25',
    icon: 'database',
    iconColor: 'text-sky-400',
    tags: ['#BigData', '#Prediksi', '#Bisnis']
  },
  {
    id: 9,
    title: 'Pengenalan Machine Learning',
    slug: 'pengenalan-machine-learning',
    excerpt: 'Dasar-dasar machine learning untuk pemula yang ingin memulai karir di bidang AI.',
    category: 'Teknologi',
    author: 'Dr. Aria Nugraha',
    date: '25 Mei 2026',
    readTime: 12,
    views: 5600,
    gradient: 'from-cyan-600/25 via-teal-700/20 to-emerald-800/25',
    icon: 'cpu',
    iconColor: 'text-cyan-400',
    tags: ['#MachineLearning', '#AI', '#Pemula']
  },
  {
    id: 10,
    title: 'Manajemen Keuangan Startup',
    slug: 'manajemen-keuangan-startup',
    excerpt: 'Tips mengelola keuangan startup agar tetap sehat dan sustainable.',
    category: 'Bisnis',
    author: 'Maya Pratiwi, MBA',
    date: '20 Mei 2026',
    readTime: 7,
    views: 4200,
    gradient: 'from-rose-600/25 via-pink-700/20 to-orange-800/25',
    icon: 'wallet',
    iconColor: 'text-rose-400',
    tags: ['#Keuangan', '#Startup', '#Bisnis']
  },
]

const categories = ['Semua', 'Teknologi', 'Bisnis', 'Karir', 'Data']

const categoryBadgeColors: Record<string, string> = {
  Teknologi: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Bisnis: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  Karir: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Data: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
}

export default function ArticlesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [sortBy, setSortBy] = useState('terbaru')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // ============ FILTER & SORT ============
  const filteredArticles = useMemo(() => {
    let result = allArticles

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(a => 
        a.title.toLowerCase().includes(term) ||
        a.excerpt.toLowerCase().includes(term) ||
        a.author.toLowerCase().includes(term) ||
        a.tags.some(t => t.toLowerCase().includes(term))
      )
    }

    // Filter by category
    if (selectedCategory !== 'Semua') {
      result = result.filter(a => a.category === selectedCategory)
    }

    // Sort
    switch (sortBy) {
      case 'terbaru':
        result.sort((a, b) => {
          const dateA = new Date(a.date.split(' ')[0].replace(/[^0-9]/g, ''))
          const dateB = new Date(b.date.split(' ')[0].replace(/[^0-9]/g, ''))
          return dateB.getTime() - dateA.getTime()
        })
        break
      case 'terpopuler':
        result.sort((a, b) => b.views - a.views)
        break
      case 'terlama':
        result.sort((a, b) => {
          const dateA = new Date(a.date.split(' ')[0].replace(/[^0-9]/g, ''))
          const dateB = new Date(b.date.split(' ')[0].replace(/[^0-9]/g, ''))
          return dateA.getTime() - dateB.getTime()
        })
        break
      default:
        break
    }

    return result
  }, [searchTerm, selectedCategory, sortBy])

  // ============ PAGINATION ============
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage)
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredArticles.slice(start, end)
  }, [filteredArticles, currentPage])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory, sortBy])

  // ============ RENDER FUNCTIONS ============
  const formatViews = (views: number) => {
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views.toString()
  }

  return (
    <div className="min-h-screen bg-[#06060E]">
      {/* ====== NAVBAR ====== */}
      <nav className="sticky top-0 z-50 bg-[#06060E]/80 backdrop-blur-xl border-b border-white/[0.04] px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 transition-transform duration-300 group-hover:scale-105">
              <Icon name="hexagon" className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-white">
              KKNT-KP<span className="text-cyan-400"> UH</span>
            </span>
          </Link>
          <Link href="/" className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1.5">
            <Icon name="arrowLeft" className="w-4 h-4" /> Kembali
          </Link>
        </div>
      </nav>

      {/* ====== HERO ====== */}
      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] mb-4 backdrop-blur-sm">
            <Icon name="bookOpen" className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium tracking-widest uppercase text-emerald-400/90">Knowledge Hub</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Artikel <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">Edukasi</span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Kumpulan artikel edukasi seputar teknologi, bisnis, karir, dan data
          </p>
        </div>

        {/* ====== FILTER & SEARCH ====== */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input
              type="text"
              placeholder="Cari artikel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-400/40 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer"
            >
              <option value="terbaru" className="bg-[#080812]">Terbaru</option>
              <option value="terpopuler" className="bg-[#080812]">Terpopuler</option>
              <option value="terlama" className="bg-[#080812]">Terlama</option>
            </select>
          </div>
        </div>

        {/* ====== RESULTS COUNT ====== */}
        <p className="text-sm text-white/30 mb-6">
          Menampilkan {filteredArticles.length} artikel
          {selectedCategory !== 'Semua' && ` dalam kategori ${selectedCategory}`}
          {searchTerm && ` untuk "${searchTerm}"`}
        </p>

        {/* ====== ARTICLES GRID ====== */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16">
            <Icon name="bookOpen" className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <h3 className="text-white/40 text-lg font-medium">Tidak ada artikel ditemukan</h3>
            <p className="text-white/20 text-sm mt-2">Coba ubah kata kunci atau filter yang digunakan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedArticles.map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.slug}`}
                className="group cursor-pointer relative rounded-2xl bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] hover:border-emerald-500/20 transition-all duration-500 hover:-translate-y-2 hover:bg-white/[0.04] overflow-hidden glass-edge"
              >
                <div className="relative h-48 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${article.gradient}`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon name={article.icon as any} className={`w-16 h-16 ${article.iconColor} opacity-30 group-hover:opacity-50 transition-opacity`} />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />
                  <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-xs font-medium ${categoryBadgeColors[article.category]}`}>
                    {article.category}
                  </div>
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-[10px] text-white/50 flex items-center gap-1">
                    <Icon name="eye" className="w-3 h-3" /> {formatViews(article.views)}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-white/35 mb-3">
                    <Icon name="calendar" className="w-3.5 h-3.5" />
                    <span>{article.date}</span>
                    <span className="text-white/20">•</span>
                    <Icon name="clock" className="w-3.5 h-3.5" />
                    <span>{article.readTime} min</span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white mb-2 group-hover:text-emerald-300 transition-colors duration-300 leading-tight line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-white/45 text-sm leading-relaxed line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center gap-2 mt-4 text-xs text-emerald-400/80 font-medium">
                    <span>Baca selengkapnya</span>
                    {/* ✅ MENGGUNAKAN arrowRight (TIDAK PAKAI arrowUpRight) */}
                    <Icon name="arrowRight" className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ====== PAGINATION ====== */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-white/40 hover:text-white hover:border-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Icon name="chevronLeft" className="w-4 h-4" />
            </button>
            
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
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
                  className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.05] text-sm text-white/40 hover:text-white hover:border-white/10 transition-all"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-white/40 hover:text-white hover:border-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Icon name="chevronRight" className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ====== FOOTER ====== */}
      <footer className="relative w-full max-w-6xl mx-auto mb-6 px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#080812] border border-white/[0.05] p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
                <Icon name="hexagon" className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-sm text-white">KKNT-KP<span className="text-cyan-400"> UH</span></span>
            </div>
            <p className="text-xs text-white/25">© 2026 KKNT-KP UH. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}