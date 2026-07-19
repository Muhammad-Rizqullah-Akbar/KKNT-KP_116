'use client'

import { useState, useEffect, useRef, use } from 'react'
import { notFound, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'

// ============ DATA DUMMY ============
const articlesData: Record<string, any> = {
  'tren-teknologi-2026-ai-beyond': {
    id: 1,
    title: 'Tren Teknologi 2026: AI & Beyond',
    slug: 'tren-teknologi-2026-ai-beyond',
    excerpt: 'Eksplorasi mendalam tentang bagaimana kecerdasan buatan membentuk ulang industri global — dari generative AI hingga edge computing.',
    category: 'Teknologi',
    author: 'Dr. Aria Nugraha',
    authorBio: 'Chief Technology Officer di Aether Global Labs dengan pengalaman 15+ tahun di bidang AI dan machine learning. Alumni MIT dan Stanford.',
    date: '2026-07-12',
    readTime: 8,
    views: 12500,
    featuredImage: '',
    content: `
      <p>Kecerdasan buatan generatif (<span class="text-white font-medium">Generative AI</span>) telah menjadi katalis utama transformasi digital di tahun 2026.</p>
      <h2 id="section-1">1. Revolusi AI Generatif</h2>
      <p>Kecerdasan buatan generatif telah menjadi katalis utama transformasi digital di tahun 2026.</p>
      <h2 id="section-2">2. Edge AI & IoT</h2>
      <p>Edge AI memungkinkan perangkat seperti smartphone dan sensor industri untuk menjalankan model AI secara lokal.</p>
    `,
    tags: ['#AI', '#MachineLearning', '#FutureTech'],
    gallery: [
      { id: 'g1', caption: 'Keynote AI Summit 2026', gradient: 'from-cyan-700/50 to-emerald-800/50' },
      { id: 'g2', caption: 'Workshop Edge AI', gradient: 'from-violet-700/50 to-purple-800/50' },
    ]
  },
  'strategi-fundraising-startup': {
    id: 2,
    title: 'Strategi Fundraising Startup',
    slug: 'strategi-fundraising-startup',
    excerpt: 'Panduan lengkap mendapatkan pendanaan dari tahap seed hingga series A.',
    category: 'Bisnis',
    author: 'Maya Pratiwi, MBA',
    authorBio: 'Praktisi bisnis dan startup dengan pengalaman 10+ tahun.',
    date: '2026-07-05',
    readTime: 6,
    views: 8200,
    featuredImage: '',
    content: '<h2 id="section-1">Pendahuluan</h2><p>Panduan lengkap mendapatkan pendanaan dari tahap seed hingga series A.</p>',
    tags: ['#Fundraising', '#Startup', '#Bisnis'],
    gallery: []
  },
  'membangun-personal-brand': {
    id: 3,
    title: 'Membangun Personal Brand',
    slug: 'membangun-personal-brand',
    excerpt: 'Cara efektif membangun reputasi profesional yang kuat di era digital.',
    category: 'Karir',
    author: 'Rian Hermawan',
    authorBio: 'Personal Branding Expert dan Public Speaker.',
    date: '2026-06-28',
    readTime: 5,
    views: 5600,
    featuredImage: '',
    content: '<h2 id="section-1">Pendahuluan</h2><p>Cara efektif membangun reputasi profesional yang kuat di era digital.</p>',
    tags: ['#PersonalBrand', '#Karir', '#Profesional'],
    gallery: []
  },
  'data-analytics-untuk-bisnis': {
    id: 4,
    title: 'Data Analytics untuk Bisnis',
    slug: 'data-analytics-untuk-bisnis',
    excerpt: 'Optimalkan keputusan bisnis Anda dengan pendekatan data-driven.',
    category: 'Data',
    author: 'Dr. Sari Dewanti',
    authorBio: 'Data Scientist dengan pengalaman 12+ tahun.',
    date: '2026-06-20',
    readTime: 7,
    views: 6900,
    featuredImage: '',
    content: '<h2 id="section-1">Pendahuluan</h2><p>Optimalkan keputusan bisnis Anda dengan pendekatan data-driven.</p>',
    tags: ['#DataAnalytics', '#Bisnis', '#DataDriven'],
    gallery: []
  }
}

const relatedArticles = [
  { title: 'Strategi Fundraising Startup', category: 'Bisnis', date: '5 Juli 2026', readTime: 6 },
  { title: 'Membangun Personal Brand', category: 'Karir', date: '28 Juni 2026', readTime: 5 },
  { title: 'Data Analytics untuk Bisnis', category: 'Data', date: '20 Juni 2026', readTime: 7 },
]

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

const categoryIcons: Record<string, string> = {
  Teknologi: 'cpu',
  Bisnis: 'piggyBank',
  Karir: 'badgeCheck',
  Data: 'barChart',
}

// ============ CLIENT COMPONENT ============
export default function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  
  const router = useRouter()
  const article = articlesData[slug]

  const [progress, setProgress] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<{ id: string; caption: string; gradient: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeHeading, setActiveHeading] = useState<string>('')
  const contentRef = useRef<HTMLDivElement>(null)

  if (!article) {
    notFound()
  }

  // ============ EXTRACT HEADINGS ============
  const extractHeadings = () => {
    if (!contentRef.current) return []
    const headingElements = contentRef.current.querySelectorAll('h2')
    return Array.from(headingElements).map((el, index) => ({
      id: el.id || `section-${index + 1}`,
      text: el.textContent || `Section ${index + 1}`
    }))
  }

  // ============ PROGRESS BAR ============
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = (scrollTop / docHeight) * 100
      setProgress(Math.min(scrollPercent, 100))
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ============ SCROLL SPY ============
  useEffect(() => {
    const headings = extractHeadings()
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveHeading(entry.target.id)
        }
      })
    }, { threshold: 0.3 })

    headings.forEach(h => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

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
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ============ SHARE ============
  const handleShareTwitter = () => {
    const text = encodeURIComponent(`${article.title}`)
    const url = encodeURIComponent(window.location.href)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
  }

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(window.location.href)
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank')
  }

  // ============ NEWSLETTER SUBMIT ============
  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement
    const email = emailInput?.value || ''
    
    if (!email || !email.includes('@')) {
      alert('Masukkan email yang valid!')
      return
    }
    
    alert('Terima kasih telah berlangganan!')
    emailInput.value = ''
  }

  // ============ FORMAT DATE ============
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // ============ FORMAT VIEWS ============
  const formatViews = (views: number) => {
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views.toString()
  }

  const headings = extractHeadings()

  return (
    <div className="min-h-screen bg-[#06060E] text-white">
      {/* ====== STYLES ====== */}
      <style>{`
        #progress-bar { transition: width 0.1s linear; }
        .article-content blockquote { border-left: 3px solid rgba(6, 182, 212, 0.5); padding-left: 1.5rem; margin: 1.5rem 0; font-style: italic; color: rgba(255, 255, 255, 0.7); }
        .article-content blockquote cite { display: block; font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); margin-top: 0.5rem; font-style: normal; }
        .article-content ul { list-style: none; padding: 0; margin: 1rem 0; }
        .article-content ul li { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.5rem 0; color: rgba(255, 255, 255, 0.6); }
        .article-content ul li:before { content: "✓"; color: #10b981; font-weight: bold; flex-shrink: 0; }
        .article-content h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 600; color: white; margin-top: 1.5rem; margin-bottom: 0.75rem; }
        .article-content p { color: rgba(255, 255, 255, 0.6); line-height: 1.8; margin-bottom: 1rem; }
        .article-content .text-white { color: white !important; }
        .article-content .font-medium { font-weight: 500 !important; }
        .article-content .text-cyan-400 { color: #34d399 !important; }
        #lightbox { opacity: 0; transition: opacity 0.3s ease; }
        #lightbox.active { opacity: 1; }
        #lightbox-img { transition: transform 0.3s ease; }
      `}</style>

      {/* ====== NAVBAR ====== */}
      <nav className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 py-4 bg-[#06060E]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 transition-transform duration-300 group-hover:scale-105">
              <Icon name="hexagon" className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-white">
              KKNT-KP<span className="text-cyan-400"> UH</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/articles" className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1.5">
              <Icon name="arrowLeft" className="w-4 h-4" /> Kembali
            </Link>
            <button className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 hover:text-white hover:border-cyan-400/20 transition-all flex items-center gap-2">
              <Icon name="share2" className="w-4 h-4" /> Bagikan
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/[0.04]">
          <div id="progress-bar" className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${progress}%` }} />
        </div>
      </nav>

      {/* ====== HERO HEADER ====== */}
      <header className="relative w-full max-w-6xl mx-auto mt-6 sm:mt-10 px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#080812] bg-grid-pattern">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-30" />

          <div className="relative z-10">
            <div className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden rounded-t-3xl">
              <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradients[article.category]} flex items-center justify-center`}>
                <Icon name={categoryIcons[article.category] as any} className="w-20 h-20 sm:w-24 sm:h-24 text-white/20 mb-4 animate-float" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#080812] via-[#080812]/40 to-transparent" />
              <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-xs font-medium ${categoryColors[article.category]}`}>
                  <Icon name={categoryIcons[article.category] as any} className="w-3.5 h-3.5" /> {article.category}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-xs font-medium text-cyan-400">
                  <Icon name="trendingUp" className="w-3.5 h-3.5" /> Trending
                </span>
              </div>
            </div>

            <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-16 lg:py-12 -mt-12 relative z-20">
              <div className="flex items-center gap-2 text-xs text-white/35 mb-4">
                <Link href="/" className="hover:text-white/60 transition-colors">Beranda</Link>
                <Icon name="chevronRight" className="w-3 h-3" />
                <Link href="/articles" className="hover:text-white/60 transition-colors">Edukasi</Link>
                <Icon name="chevronRight" className="w-3 h-3" />
                <span className={article.category === 'Teknologi' ? 'text-emerald-400/80' : 
                  article.category === 'Bisnis' ? 'text-rose-400/80' :
                  article.category === 'Karir' ? 'text-amber-400/80' : 'text-sky-400/80'}>
                  {article.category}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-xs text-white/40 flex items-center gap-1"><Icon name="calendar" className="w-3.5 h-3.5" /> {formatDate(article.date)}</span>
                <span className="text-xs text-white/25">•</span>
                <span className="text-xs text-white/40 flex items-center gap-1"><Icon name="clock" className="w-3.5 h-3.5" /> {article.readTime} menit baca</span>
                <span className="text-xs text-white/25">•</span>
                <span className="text-xs text-white/40 flex items-center gap-1"><Icon name="eye" className="w-3.5 h-3.5" /> {formatViews(article.views)} views</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] mb-4 max-w-4xl">{article.title}</h1>
              <p className="text-lg sm:text-xl text-white/50 max-w-3xl leading-relaxed mb-6">{article.excerpt}</p>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20">
                    {article.author.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{article.author}</p>
                    <p className="text-xs text-white/40">{article.authorBio}</p>
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
          {/* ====== SIDEBAR KIRI: TOC ====== */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-28 space-y-6">
              <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
                <h4 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                  <Icon name="list" className="w-4 h-4 text-cyan-400" /> Daftar Isi
                </h4>
                {headings.length === 0 ? (
                  <p className="text-sm text-white/30">Tidak ada daftar isi</p>
                ) : (
                  <nav className="space-y-2">
                    {headings.map((heading, index) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className={`block text-sm transition-colors py-1.5 border-l-2 pl-3 ${
                          activeHeading === heading.id
                            ? 'text-cyan-400 border-cyan-400'
                            : 'text-white/45 hover:text-cyan-400 border-transparent hover:border-cyan-400'
                        }`}
                      >
                        {index + 1}. {heading.text}
                      </a>
                    ))}
                  </nav>
                )}
              </div>

              {/* Share */}
              <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
                <h4 className="text-sm font-semibold text-white/80 mb-4">Bagikan</h4>
                <div className="flex gap-3">
                  <button 
                    onClick={handleShareTwitter}
                    className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-cyan-500/10 hover:border-cyan-400/20 transition-all"
                  >
                    {/* Ganti 'twitter' dengan 'share2' atau icon yang tersedia */}
                    <Icon name="share2" className="w-4 h-4 text-white/60" />
                  </button>
                  <button 
                    onClick={handleShareLinkedIn}
                    className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-cyan-500/10 hover:border-cyan-400/20 transition-all"
                  >
                    {/* Ganti 'linkedin' dengan 'users' atau icon yang tersedia */}
                    <Icon name="users" className="w-4 h-4 text-white/60" />
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

          {/* ====== CONTENT ====== */}
          <article className="lg:col-span-6 article-content text-white/60 leading-relaxed space-y-8 text-base sm:text-lg">
            <div ref={contentRef} dangerouslySetInnerHTML={{ __html: article.content }} />

            <div className="flex flex-wrap gap-2 pt-8 border-t border-white/[0.06]">
              {article.tags.map((tag: string) => (
                <span key={tag} className="px-3 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/15 text-xs text-emerald-400">{tag}</span>
              ))}
            </div>

            <div className="mt-10 p-6 rounded-2xl bg-[#080812] border border-white/[0.06] flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                {article.author.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div>
                <h4 className="text-white font-semibold text-lg">{article.author}</h4>
                <p className="text-white/50 text-sm mt-1">{article.authorBio}</p>
              </div>
            </div>

            {article.gallery && article.gallery.length > 0 && (
              <div className="mt-10">
                <h3 className="font-display text-2xl font-semibold text-white mb-4">Galeri Dokumentasi</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {article.gallery.map((img: any) => (
                    <div
                      key={img.id}
                      onClick={() => openLightbox(img)}
                      className="cursor-pointer group relative rounded-xl overflow-hidden aspect-square border border-white/[0.05] hover:border-cyan-400/30 transition-all duration-300"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${img.gradient} flex items-center justify-center`}>
                        <Icon name="image" className="w-10 h-10 text-white/20 group-hover:text-white/50 transition-colors" />
                      </div>
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-[10px] text-cyan-300 truncate max-w-[80%]">{img.caption}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/30 text-center mt-3">Klik gambar untuk memperbesar • Foto: Aether Global Documentation Team</p>
              </div>
            )}
          </article>

          {/* ====== SIDEBAR KANAN ====== */}
          <aside className="lg:col-span-3">
            <div className="sticky top-28 space-y-6">
              <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
                <h4 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                  <Icon name="bookOpen" className="w-4 h-4 text-emerald-400" /> Artikel Terkait
                </h4>
                {relatedArticles.map((ra, index) => (
                  <a key={index} href="#" className="block group p-3 rounded-xl hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/[0.05]">
                    <p className={`text-xs ${ra.category === 'Bisnis' ? 'text-rose-400' : ra.category === 'Karir' ? 'text-amber-400' : 'text-sky-400'} mb-1`}>{ra.category}</p>
                    <h5 className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">{ra.title}</h5>
                    <p className="text-xs text-white/35 mt-1">{ra.date} • {ra.readTime} min</p>
                  </a>
                ))}
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-cyan-600/20 to-emerald-600/20 border border-cyan-500/10 p-6">
                <Icon name="mail" className="w-8 h-8 text-cyan-400 mb-3" />
                <h4 className="text-white font-semibold mb-2">Dapatkan Update</h4>
                <p className="text-white/50 text-sm mb-4">Langganan newsletter untuk artikel terbaru.</p>
                <form className="space-y-3" onSubmit={handleNewsletterSubmit}>
                  <input type="email" placeholder="email@anda.com" className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-400/40 transition-all" />
                  <button type="submit" className="w-full px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all">
                    <Icon name="send" className="w-4 h-4" /> Berlangganan
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ====== FOOTER ====== */}
      <footer className="relative w-full max-w-6xl mx-auto mt-16 mb-6 px-4 sm:px-6 lg:px-8">
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

      {/* ====== LIGHTBOX ====== */}
      {isLightboxOpen && lightboxImage && (
        <div
          id="lightbox"
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 ${isLightboxOpen ? 'active' : ''}`}
          onClick={closeLightbox}
        >
          <button onClick={closeLightbox} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10">
            <Icon name="x" className="w-5 h-5 text-white" />
          </button>
          <div className="max-w-4xl w-full max-h-[85vh] rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div id="lightbox-img" className={`w-full h-80 sm:h-96 bg-gradient-to-br ${lightboxImage.gradient} flex items-center justify-center`}>
              <Icon name="image" className="w-16 h-16 text-white/30" />
            </div>
            <div className="bg-[#0e0e1a] p-4 flex justify-between items-center">
              <p className="text-sm text-white/70">{lightboxImage.caption}</p>
              <button className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs text-white/70 hover:text-white transition-colors flex items-center gap-1">
                <Icon name="download" className="w-4 h-4" /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}