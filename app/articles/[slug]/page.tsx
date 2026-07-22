'use client'

import { useState, useEffect, useLayoutEffect, useRef, use, useCallback } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'

// Import Repositori Firestore & Firebase Auth
import { 
  getArticles, 
  updateArticle, 
  type ArticleData 
} from '@/lib/firebase/repositories/articles.repo'
import { auth, storage } from '@/lib/firebaseClient'
import { onAuthStateChanged } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

// ============ KONSTANTA KATEGORI ============
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

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

type HeadingItem = {
  id: string
  text: string
}

// ============ CLIENT COMPONENT ============
export default function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  // State User & Admin Check
  const [isAdmin, setIsAdmin] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // State Data Artikel
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [editedArticle, setEditedArticle] = useState<ArticleData | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<ArticleData[]>([])
  const [loading, setLoading] = useState(true)

  // State Interaktif Page & Lightbox
  const [progress, setProgress] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<{ id: string; url?: string; caption: string; gradient?: string } | null>(null)
  const [activeHeading, setActiveHeading] = useState<string>('')
  const [isTocPopoverOpen, setIsTocPopoverOpen] = useState(false)
  const [parsedHeadings, setParsedHeadings] = useState<HeadingItem[]>([])

  const contentRef = useRef<HTMLDivElement>(null)

  // ============ 1. CEK STATUS AUTHENTICATION ADMIN ============
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
        setIsEditMode(false)
      }
    })
    return () => unsubscribe()
  }, [])

  // ============ 2. FETCH DATA ARTIKEL ============
  useEffect(() => {
    const fetchArticleDetail = async () => {
      setLoading(true)
      try {
        const allArticles = await getArticles()
        const targetArticle = allArticles.find(a => a.slug === slug)
        
        if (targetArticle) {
          setArticle(targetArticle)
          setEditedArticle(targetArticle)

          // Rekomendasi Terkait Dinamis
          const otherArticles = allArticles.filter(a => a.slug !== slug && a.status === 'Published')
          const sameCategoryArticles = otherArticles.filter(a => a.category === targetArticle.category)
          let selectedRelated = shuffleArray(sameCategoryArticles)

          if (selectedRelated.length < 3) {
            const diffCat = otherArticles.filter(a => a.category !== targetArticle.category)
            selectedRelated = [...selectedRelated, ...shuffleArray(diffCat).slice(0, 3 - selectedRelated.length)]
          } else {
            selectedRelated = selectedRelated.slice(0, 3)
          }

          setRelatedArticles(selectedRelated)
        } else {
          setArticle(null)
        }
      } catch (error) {
        console.error('Gagal mengambil detail artikel:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchArticleDetail()
  }, [slug])

  // ============ 3. AKURASI VIEWS METRIC (IP API + 5 DETIK DELAY + LOCALSTORAGE) ============
  useEffect(() => {
    if (!article || !article.id) return

    const articleId = article.id
    const storageKey = `viewed_article_${articleId}`
    const lastViewed = localStorage.getItem(storageKey)
    const now = Date.now()
    const COOLDOWN_24H = 24 * 60 * 60 * 1000

    if (lastViewed && now - parseInt(lastViewed, 10) < COOLDOWN_24H) {
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/articles/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId })
        })

        if (res.ok) {
          localStorage.setItem(storageKey, now.toString())
          setEditedArticle(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : prev)
        }
      } catch (err) {
        console.error('Gagal mencatat views:', err)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [article?.id])

  // ============ 4. EXTRACT HEADINGS & PASANG ID UNIK UNTUK SMOOTH SCROLL ============
  const extractHeadings = useCallback(() => {
    if (!contentRef.current) return

    // Reset dulu agar tidak duplikat
    const headingElements = contentRef.current.querySelectorAll('h2')
    const items: HeadingItem[] = []

    headingElements.forEach((el, index) => {
      const generatedId = `heading-section-${index + 1}`
      el.id = generatedId
      items.push({
        id: generatedId,
        text: el.textContent || `Bagian ${index + 1}`
      })
    })

    setParsedHeadings(items)
  }, [])

  // FIX: Gunakan useLayoutEffect (bukan setTimeout) agar ID heading dijamin
  // sudah terpasang ke DOM SEBELUM user sempat mengklik tombol TOC.
  // Sebelumnya delay 50ms bisa "kalah cepat" dari klik pertama user,
  // sehingga document.getElementById(id) mengembalikan null dan tombol
  // terlihat seperti tidak berfungsi.
  useLayoutEffect(() => {
    extractHeadings()
  }, [editedArticle?.content, extractHeadings])

  // ============ 5. OBSERVER UNTUK MENENTUKAN HEADING AKTIF SAAT SCROLL ============
  useEffect(() => {
    if (!contentRef.current || parsedHeadings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id)
          }
        })
      },
      { rootMargin: '-110px 0px -70% 0px', threshold: 0.1 }
    )

    const elements = contentRef.current.querySelectorAll('h2')
    elements.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [parsedHeadings, editedArticle?.content])

  // ============ 6. HANDLER SMOOTH SCROLL ============
  // FIX: Hitung offset navbar sticky secara manual dengan window.scrollTo
  // alih-alih hanya mengandalkan scrollIntoView + CSS scroll-margin-top,
  // karena scroll-margin-top tidak selalu konsisten di semua browser
  // (terutama Safari/webview mobile), sehingga posisi scroll suka meleset
  // atau terlihat seperti tidak merespons klik.
  const handleScrollToHeading = (id: string) => {
    setIsTocPopoverOpen(false)

    // Beri sedikit jeda 1 frame agar popover sempat menutup dulu
    // sebelum kita hitung posisi elemen (menghindari salah hitung offset
    // akibat layout shift saat popover hilang).
    requestAnimationFrame(() => {
      const element = document.getElementById(id)
      if (!element) return

      const NAV_OFFSET = 110 // tinggi navbar sticky + sedikit jarak aman
      const top = element.getBoundingClientRect().top + window.scrollY - NAV_OFFSET

      window.scrollTo({ top, behavior: 'smooth' })
      setActiveHeading(id)
    })
  }

  // ============ 7. LIGHTBOX HANDLERS ============
  const openLightbox = (image: { id: string; url?: string; caption: string; gradient?: string }) => {
    setLightboxImage(image)
    setIsLightboxOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
    document.body.style.overflow = ''
  }

  // ============ SCROLL PROGRESS OBSERVER ============
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

  // ============ SAVE INLINE CHANGES ============
  const handleSaveInline = async () => {
    if (!editedArticle || !editedArticle.id) return
    setIsSaving(true)

    try {
      const updatedContent = contentRef.current ? contentRef.current.innerHTML : editedArticle.content

      const payload = {
        ...editedArticle,
        content: updatedContent
      }

      await updateArticle(editedArticle.id, payload)
      setArticle(payload)
      setIsEditMode(false)
      alert('Perubahan artikel berhasil disimpan secara langsung!')
    } catch (error) {
      console.error('Gagal menyimpan perubahan:', error)
      alert('Gagal menyimpan perubahan ke database.')
    } finally {
      setIsSaving(false)
    }
  }

  // ============ UPLOAD FEATURED IMAGE INLINE ============
  const handleFeaturedImageUpload = async (file: File) => {
    try {
      const storageRef = ref(storage, `articles/${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      const url = await getDownloadURL(snapshot.ref)
      setEditedArticle(prev => prev ? { ...prev, featuredImage: url } : prev)
    } catch (err) {
      console.error('Gagal upload banner:', err)
      alert('Gagal mengunggah foto utama')
    }
  }

  const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
  const formatViews = (views: number) => views >= 1000 ? `${(views / 1000).toFixed(1)}K` : (views || 0).toString()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060E] text-white flex items-center justify-center">
        <p className="text-sm text-white/40 animate-pulse">Memuat materi edukasi...</p>
      </div>
    )
  }

  if (!article || !editedArticle) {
    notFound()
  }

  const uniqueTags = Array.from(new Set(editedArticle.tags || []))

  return (
    <div className="min-h-screen bg-[#06060E] text-white pb-24">
      <style>{`
        #progress-bar { transition: width 0.1s linear; }
        .article-content blockquote { border-left: 3px solid rgba(6, 182, 212, 0.5); padding-left: 1.5rem; margin: 1.5rem 0; font-style: italic; color: rgba(255, 255, 255, 0.7); }
        .article-content blockquote cite { display: block; font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); margin-top: 0.5rem; font-style: normal; }
        .article-content ul { list-style: none; padding: 0; margin: 1rem 0; }
        .article-content ul li { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.5rem 0; color: rgba(255, 255, 255, 0.6); }
        .article-content ul li:before { content: "✓"; color: #10b981; font-weight: bold; flex-shrink: 0; }
        .article-content h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 600; color: white; margin-top: 2rem; margin-bottom: 0.75rem; scroll-margin-top: 110px; }
        .article-content p { color: rgba(255, 255, 255, 0.6); line-height: 1.8; margin-bottom: 1rem; }
        .editable-active { outline: 2px dashed #06b6d4; border-radius: 8px; padding: 4px; cursor: text; }
        .editable-active:focus { outline: 2px solid #06b6d4; background: rgba(6, 182, 212, 0.05); }
      `}</style>

      {/* ====== FLOATING ADMIN ACTION BAR ====== */}
      {isAdmin && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] bg-[#0e0e1a]/90 backdrop-blur-md border border-cyan-500/30 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-slideUp">
          <div className="flex items-center gap-2 border-r border-white/10 pr-4">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-semibold text-cyan-300">Admin Mode</span>
          </div>

          {!isEditMode ? (
            <button 
              type="button"
              onClick={() => setIsEditMode(true)}
              className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white flex items-center gap-1.5 transition-all"
            >
              <Icon name="pencil" className="w-3.5 h-3.5" /> Edit Halaman Ini
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={handleSaveInline}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white flex items-center gap-1.5 transition-all"
              >
                <Icon name="save" className="w-3.5 h-3.5" /> {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
              <button 
                type="button"
                onClick={() => { setEditedArticle(article); setIsEditMode(false); }}
                className="px-3 py-1.5 rounded-xl bg-white/10 text-xs text-white/70 hover:text-white"
              >
                Batal
              </button>
            </div>
          )}

          <Link 
            href="/dashboard/articles"
            className="text-xs text-white/50 hover:text-white border-l border-white/10 pl-4 flex items-center gap-1"
          >
            Dashboard <Icon name="chevronRight" className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* ====== NAVBAR UTAMA ====== */}
      <nav className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 py-4 bg-[#06060E]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Icon name="hexagon" className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-white">
              KKNT-KP<span className="text-cyan-400"> UH</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {/* HAMBURGER POPOVER TOC */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setIsTocPopoverOpen(!isTocPopoverOpen)}
                className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-cyan-400 flex items-center gap-1.5 hover:bg-cyan-500/10"
              >
                <Icon name="menu" className="w-4 h-4" />
                <span className="hidden sm:inline">Daftar Isi</span>
              </button>

              {isTocPopoverOpen && (
                <div className="absolute right-0 top-12 w-72 bg-[#0e0e1a] border border-white/10 rounded-2xl shadow-2xl p-4 z-[100] animate-slideUp">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">Navigasi Artikel</span>
                    <button type="button" onClick={() => setIsTocPopoverOpen(false)} className="p-1 text-white/40 hover:text-white">
                      <Icon name="x" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {parsedHeadings.length === 0 ? (
                    <p className="text-xs text-white/30 italic py-2">
                      {editedArticle.content ? 'Tidak ada sub-judul di artikel ini.' : 'Konten artikel belum dimuat.'}
                    </p>
                  ) : (
                    <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                      {parsedHeadings.map((h, i) => (
                        <button
                          type="button"
                          key={`${h.id}-${i}`}
                          onClick={() => handleScrollToHeading(h.id)}
                          className={`w-full text-left text-xs p-2 rounded-lg transition-all truncate ${
                            activeHeading === h.id ? 'bg-cyan-500/20 text-cyan-400 font-medium' : 'text-white/70 hover:bg-white/5'
                          }`}
                        >
                          {i + 1}. {h.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link href="/" className="text-sm text-white/50 hover:text-white flex items-center gap-1.5">
              <Icon name="arrowLeft" className="w-4 h-4" /> Kembali
            </Link>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/[0.04]">
          <div id="progress-bar" className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${progress}%` }} />
        </div>
      </nav>

      {/* ====== HERO HEADER ====== */}
      <header className="relative w-full max-w-6xl mx-auto mt-6 sm:mt-10 px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#080812]">
          <div className="relative z-10">
            {/* HERO FEATURED IMAGE / BANNER */}
            <div className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden rounded-t-3xl group/banner">
              <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradients[editedArticle.category] || categoryGradients['Teknologi']} flex items-center justify-center`}>
                {editedArticle.featuredImage ? (
                  <img src={editedArticle.featuredImage} alt={editedArticle.title} className="w-full h-full object-cover" />
                ) : (
                  <Icon name={categoryIcons[editedArticle.category] as any || 'cpu'} className="w-20 h-20 text-white/20 animate-float" />
                )}
              </div>

              {/* OPSI GANTI BANNER JIKA EDIT MODE AKTIF */}
              {isEditMode && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <label className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs text-white font-medium cursor-pointer flex items-center gap-2 shadow-xl">
                    <Icon name="image" className="w-4 h-4" /> Ganti Banner Utama
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFeaturedImageUpload(file)
                      }} 
                    />
                  </label>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-[#080812] via-[#080812]/40 to-transparent pointer-events-none" />
              <div className="absolute top-4 left-4 z-20 flex gap-2">
                <span className={`px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-xs font-medium ${categoryColors[editedArticle.category]}`}>
                  {editedArticle.category}
                </span>
              </div>
            </div>

            <div className="px-6 py-8 sm:px-10 lg:px-16 lg:py-12 -mt-12 relative z-20">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-xs text-white/40 flex items-center gap-1"><Icon name="calendar" className="w-3.5 h-3.5" /> {formatDate(editedArticle.date)}</span>
                <span className="text-xs text-white/25">•</span>
                <span className="text-xs text-white/40 flex items-center gap-1"><Icon name="clock" className="w-3.5 h-3.5" /> {editedArticle.readTime} menit baca</span>
                <span className="text-xs text-white/25">•</span>
                <span className="text-xs text-white/40 flex items-center gap-1"><Icon name="eye" className="w-3.5 h-3.5" /> {formatViews(editedArticle.views)} views</span>
              </div>

              {/* LIVE EDITABLE TITLE */}
              <h1 
                contentEditable={isEditMode}
                suppressContentEditableWarning
                onBlur={(e) => setEditedArticle({ ...editedArticle, title: e.currentTarget.innerText })}
                className={`font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] mb-4 text-white ${isEditMode ? 'editable-active' : ''}`}
              >
                {editedArticle.title}
              </h1>

              {/* LIVE EDITABLE EXCERPT */}
              <p 
                contentEditable={isEditMode}
                suppressContentEditableWarning
                onBlur={(e) => setEditedArticle({ ...editedArticle, excerpt: e.currentTarget.innerText })}
                className={`text-base sm:text-xl text-white/50 max-w-3xl leading-relaxed mb-6 ${isEditMode ? 'editable-active' : ''}`}
              >
                {editedArticle.excerpt}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                    {(editedArticle.author || 'A').split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <p 
                      contentEditable={isEditMode} 
                      suppressContentEditableWarning 
                      onBlur={(e) => setEditedArticle({ ...editedArticle, author: e.currentTarget.innerText })} 
                      className={`text-sm font-semibold text-white ${isEditMode ? 'editable-active' : ''}`}
                    >
                      {editedArticle.author}
                    </p>
                    <p 
                      contentEditable={isEditMode} 
                      suppressContentEditableWarning 
                      onBlur={(e) => setEditedArticle({ ...editedArticle, authorBio: e.currentTarget.innerText })} 
                      className={`text-xs text-white/40 ${isEditMode ? 'editable-active' : ''}`}
                    >
                      {editedArticle.authorBio || 'Penulis Edukasi'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ====== MAIN CONTENT & SIDEBAR ====== */}
      <main className="relative w-full max-w-6xl mx-auto mt-8 sm:mt-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* DESKTOP TOC (SMOOTH SCROLLABLE) */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-28 space-y-6">
              <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
                <h4 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                  <Icon name="list" className="w-4 h-4 text-cyan-400" /> Daftar Isi
                </h4>
                {parsedHeadings.length === 0 ? (
                  <p className="text-sm text-white/30">
                    {editedArticle.content ? 'Tidak ada sub-judul di artikel ini.' : 'Memuat daftar isi...'}
                  </p>
                ) : (
                  <nav className="space-y-2">
                    {parsedHeadings.map((h, i) => (
                      <button
                        type="button"
                        key={`${h.id}-${i}`}
                        onClick={() => handleScrollToHeading(h.id)}
                        className={`block w-full text-left text-sm py-1.5 border-l-2 pl-3 transition-colors ${
                          activeHeading === h.id ? 'text-cyan-400 border-cyan-400 font-medium' : 'text-white/45 hover:text-cyan-400 border-transparent'
                        }`}
                      >
                        {i + 1}. {h.text}
                      </button>
                    ))}
                  </nav>
                )}
              </div>
            </div>
          </aside>

          {/* KONTEN UTAMA ARTIKEL (EDITABLE ON PAGE) */}
          <article className="lg:col-span-6 article-content text-white/60 leading-relaxed space-y-8 text-base sm:text-lg">
            <div 
              ref={contentRef} 
              contentEditable={isEditMode}
              suppressContentEditableWarning
              className={isEditMode ? 'editable-active' : ''}
              dangerouslySetInnerHTML={{ __html: editedArticle.content }} 
            />

            {/* TAGS */}
            {uniqueTags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-8 border-t border-white/[0.06]">
                {uniqueTags.map((tag: string, idx: number) => (
                  <span key={`${tag}-${idx}`} className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            )}

            {/* GALERI DOKUMENTASI */}
            {editedArticle.gallery && editedArticle.gallery.length > 0 && (
              <div className="mt-10">
                <h3 className="font-display text-2xl font-semibold text-white mb-4">Galeri Dokumentasi</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {editedArticle.gallery.map((img: any, idx: number) => (
                    <div
                      key={img.id || idx}
                      onClick={() => openLightbox(img)}
                      className="cursor-pointer group relative rounded-xl overflow-hidden aspect-square border border-white/[0.05] bg-[#080812]"
                    >
                      {img.url ? (
                        <img src={img.url} alt={img.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${img.gradient || 'from-cyan-700/50 to-emerald-800/50'} flex items-center justify-center`}>
                          <Icon name="image" className="w-8 h-8 text-white/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded bg-black/60 text-[10px] text-white truncate">{img.caption}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* SIDEBAR REKOMENDASI TERKAIT */}
          <aside className="lg:col-span-3">
            <div className="sticky top-28 space-y-6">
              <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
                <h4 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                  <Icon name="bookOpen" className="w-4 h-4 text-emerald-400" /> Artikel Terkait
                </h4>
                {relatedArticles.length === 0 ? (
                  <p className="text-xs text-white/30">Belum ada artikel terkait</p>
                ) : (
                  relatedArticles.map((ra) => (
                    <Link key={ra.id} href={`/articles/${ra.slug}`} className="block group p-3 rounded-xl hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/[0.05]">
                      <p className={`text-xs ${categoryColors[ra.category]?.split(' ')[0] || 'text-cyan-400'} mb-1`}>{ra.category}</p>
                      <h5 className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">{ra.title}</h5>
                      <p className="text-xs text-white/35 mt-1">{formatDate(ra.date)} • {ra.readTime} min</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </aside>

        </div>
      </main>

      {/* ====== LIGHTBOX MODAL ====== */}
      {isLightboxOpen && lightboxImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={closeLightbox}>
          <button onClick={closeLightbox} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <Icon name="x" className="w-5 h-5 text-white" />
          </button>
          <div className="max-w-4xl w-full rounded-2xl overflow-hidden bg-[#0e0e1a]" onClick={e => e.stopPropagation()}>
            <div className="w-full h-80 sm:h-96 flex items-center justify-center bg-black">
              {lightboxImage.url ? (
                <img src={lightboxImage.url} alt={lightboxImage.caption} className="w-full h-full object-contain" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${lightboxImage.gradient || 'from-cyan-700/50 to-emerald-800/50'} flex items-center justify-center`}>
                  <Icon name="image" className="w-16 h-16 text-white/30" />
                </div>
              )}
            </div>
            <div className="p-4 flex justify-between items-center border-t border-white/10">
              <p className="text-sm text-white/80">{lightboxImage.caption}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}