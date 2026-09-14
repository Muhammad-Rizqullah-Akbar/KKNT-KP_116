'use client'

import { useState, useEffect, useLayoutEffect, useRef, use, useCallback } from 'react'
import { notFound } from 'next/navigation'

// Import Repositori Firestore & Firebase Auth
import {
  getArticles,
  updateArticle,
  type ArticleData
} from '@/lib/repositories/articles.repo'
import { auth, storage } from '@/lib/infra/firebase-client'
import { uploadOptimizedArticleImage } from '@/lib/infra/storage'
import { onAuthStateChanged } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { VIEW_COOLDOWN_MS } from '@/lib/constants'

import { shuffleArray, type HeadingItem, type LightboxImage, formatDate, formatViews } from './article-utils'
import { ArticleNavbar } from './article-navbar'
import { ArticleHero } from './article-hero'
import { AdminBar } from './admin-bar'
import { ArticleMainContent } from './article-main-content'
import { LightboxModal } from './lightbox-modal'

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
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(null)
  const [activeHeading, setActiveHeading] = useState<string>('')
  const [isTocPopoverOpen, setIsTocPopoverOpen] = useState(false)
  const [parsedHeadings, setParsedHeadings] = useState<HeadingItem[]>([])

  // State validasi akses form (server-side): pretest & posttest tersedia/tidak
  const [pretestAvailability, setPretestAvailability] = useState<{ available: boolean; reason: string } | null>(null)
  const [posttestAvailability, setPosttestAvailability] = useState<{ available: boolean; reason: string } | null>(null)

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

  // ============ 2b. VALIDASI AKSES FORM (SERVER-SIDE) ============
  // Saat artikel dibuka, cek pretest/posttest form: masih dibuka/tidak, ada/tidak.
  // Ini dilakukan DI SERVER via API, bukan menebak di client.
  useEffect(() => {
    if (!article) return
    const codes = {
      pretest: article.pretestCode || (article as any).pretestFormId,
      posttest: article.posttestCode || article.embeddedDistributionCode,
    }

    const check = async (type: 'pretest' | 'posttest', code?: string) => {
      if (!code) {
        if (type === 'pretest') setPretestAvailability(null)
        else setPosttestAvailability(null)
        return
      }
      try {
        const res = await fetch(`/api/public/check-availability?code=${encodeURIComponent(code)}`)
        const data = await res.json()
        const result = { available: Boolean(data.available), reason: data.reason || 'error' }
        if (type === 'pretest') setPretestAvailability(result)
        else setPosttestAvailability(result)
      } catch {
        if (type === 'pretest') setPretestAvailability({ available: false, reason: 'error' })
        else setPosttestAvailability({ available: false, reason: 'error' })
      }
    }

    check('pretest', codes.pretest)
    check('posttest', codes.posttest)
  }, [article])

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
    }, VIEW_COOLDOWN_MS)

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
  const handleScrollToHeading = (id: string) => {
    setIsTocPopoverOpen(false)
    extractHeadings()

    requestAnimationFrame(() => {
      let element = document.getElementById(id)
      if (!element && contentRef.current) {
        const headings = contentRef.current.querySelectorAll('h2')
        const idx = parseInt(id.replace('heading-section-', ''), 10) - 1
        if (headings && headings[idx]) {
          element = headings[idx] as HTMLElement
          element.id = id
        }
      }
      if (!element) return

      const NAV_OFFSET = 110
      const top = element.getBoundingClientRect().top + window.scrollY - NAV_OFFSET

      window.scrollTo({ top, behavior: 'smooth' })
      setActiveHeading(id)
    })
  }

  // ============ 7. LIGHTBOX HANDLERS ============
  const openLightbox = (image: LightboxImage) => {
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
      const res = await uploadOptimizedArticleImage(file, 'articles')
      setEditedArticle(prev => prev ? { ...prev, featuredImage: res.url } : prev)
      alert(`⚡ Banner terkompresi otomatis (${res.savedPercent}% hemat storage)!`)
    } catch (err) {
      console.error('Gagal upload banner:', err)
      alert('Gagal mengunggah foto utama')
    }
  }

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

  const updateEditedArticle = (patch: Partial<ArticleData>) => {
    setEditedArticle(prev => prev ? { ...prev, ...patch } : prev)
  }

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
        <AdminBar
          isEditMode={isEditMode}
          isSaving={isSaving}
          onEnterEditMode={() => setIsEditMode(true)}
          onSave={handleSaveInline}
          onCancel={() => { setEditedArticle(article); setIsEditMode(false); }}
        />
      )}

      {/* ====== NAVBAR UTAMA ====== */}
      <ArticleNavbar
        progress={progress}
        parsedHeadings={parsedHeadings}
        activeHeading={activeHeading}
        isTocPopoverOpen={isTocPopoverOpen}
        contentLoaded={!!editedArticle.content}
        onToggleTocPopover={() => setIsTocPopoverOpen(!isTocPopoverOpen)}
        onCloseTocPopover={() => setIsTocPopoverOpen(false)}
        onScrollToHeading={handleScrollToHeading}
      />

      {/* ====== HERO HEADER ====== */}
      <ArticleHero
        article={editedArticle}
        isEditMode={isEditMode}
        onUpdate={updateEditedArticle}
        onFeaturedImageUpload={handleFeaturedImageUpload}
      />

      {/* ====== MAIN CONTENT & SIDEBAR ====== */}
      <ArticleMainContent
        article={editedArticle}
        relatedArticles={relatedArticles}
        isEditMode={isEditMode}
        contentRef={contentRef}
        uniqueTags={uniqueTags}
        parsedHeadings={parsedHeadings}
        activeHeading={activeHeading}
        onScrollToHeading={handleScrollToHeading}
        onOpenLightbox={openLightbox}
        pretestAvailability={pretestAvailability}
        posttestAvailability={posttestAvailability}
      />

      {/* ====== LIGHTBOX MODAL ====== */}
      {isLightboxOpen && lightboxImage && (
        <LightboxModal image={lightboxImage} onClose={closeLightbox} />
      )}
    </div>
  )
}
