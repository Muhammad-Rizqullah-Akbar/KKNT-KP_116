// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/home/HeroSection'
import { ProgramSection } from '@/components/home/ProgramSection'
import { EdukasiSection } from '@/components/home/EdukasiSection'
import { GallerySection } from '@/components/home/GallerySection'
import { ArticleModal } from '@/components/home/ArticleModal'
import { CodeModal } from '@/components/home/CodeModal'
import { Icon } from '@/components/ui/Icons'
import { safeFetchJson } from '@/lib/shared/safeFetch'

// Import Repositori Firestore
import {
  getArticles,
  incrementArticleViews,
  type ArticleData
} from '@/lib/firebase/repositories/articles.repo'

import {
  getLandingPageSettings
} from '@/lib/firebase/repositories/settings.repo'

// ============ DATA FALLBACK (DEFAULT) ============
const defaultPartnershipData = {
  kkn: {
    title: 'Program Kuliah Kerja Nyata Tematik Keamanan Pangan Universitas Hasanuddin',
    description:
      'Program Akselerator Terbaik Universitas Hasanuddin untuk Meningkatkan Wawasan dan Pengalaman Bekerja serta meningkatkan kualitas kinerja Mahasiswa',
    participants: 70,
    villages: 10,
    highlights: [
      'Bimbingan rencana program kerja',
      'Mentorship 1-on-1 dengan Dosen Pendamping',
      'Upgrading dengan Pembekalan Umum'
    ]
  },
  bpom: {
    title: 'Badan Pengawas Obat dan Makanan',
    description:
      'BPOM Berkolaborasi dengan kampus-kampus pada program Kuliah Kerja Nyata dalam rangka Mencetak Kader Keamanan Pangan Keamanan Pangan',
    features: [
      'Mentorship 1-on-1 dengan Mentor dari BPOM',
      'Akses Modul Pembelajaran tentang Keamanan Pangan dan lainnya',
      'Sertifikat dari BPOM'
    ]
  }
}

const defaultGalleryData = [
  {
    id: 1,
    title: 'Keynote: Masa Depan AI',
    location: 'Jakarta Convention Center',
    category: 'Summit 2026',
    gradient: 'from-amber-700/40 via-orange-800/30 to-rose-900/40'
  },
  {
    id: 2,
    title: 'UI/UX Masterclass',
    location: 'Bandung Creative Hub',
    category: 'Workshop',
    gradient: 'from-violet-700/40 via-purple-800/30 to-indigo-900/40'
  },
  {
    id: 3,
    title: 'Tech Expo 2026',
    location: 'Surabaya Grand Hall',
    category: 'Pameran',
    gradient: 'from-cyan-700/40 via-teal-800/30 to-emerald-900/40'
  },
  {
    id: 4,
    title: 'Innovation Award Night',
    location: 'Bali Nusa Dua',
    category: 'Award',
    gradient: 'from-rose-700/40 via-pink-800/30 to-fuchsia-900/40'
  },
  {
    id: 5,
    title: '48-Hour Code Sprint',
    location: 'Yogyakarta Digital Valley',
    category: 'Hackathon',
    gradient: 'from-lime-700/40 via-green-800/30 to-teal-900/40'
  },
  {
    id: 6,
    title: 'Startup Founder Meetup',
    location: 'Semarang Creative Space',
    category: 'Meetup',
    gradient: 'from-sky-700/40 via-blue-800/30 to-cyan-900/40'
  },
  {
    id: 7,
    title: 'Women in Tech Talks',
    location: 'Medan Innovation Center',
    category: 'Talkshow',
    gradient: 'from-fuchsia-700/40 via-purple-800/30 to-violet-900/40'
  },
  {
    id: 8,
    title: 'Grand Closing Gala',
    location: 'Makassar Waterfront',
    category: 'Closing',
    gradient: 'from-orange-700/40 via-amber-800/30 to-yellow-900/40'
  }
]

const categoryBadgeColors: Record<string, string> = {
  Teknologi: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Bisnis: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  Karir: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Data: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
}

const categoryIcons: Record<string, string> = {
  Teknologi: 'cpu',
  Bisnis: 'piggyBank',
  Karir: 'badgeCheck',
  Data: 'barChart'
}

const categoryGradients: Record<string, string> = {
  Teknologi: 'from-emerald-600/30 via-teal-700/20 to-cyan-800/30',
  Bisnis: 'from-rose-600/25 via-pink-700/20 to-orange-800/25',
  Karir: 'from-amber-600/25 via-yellow-700/20 to-orange-800/25',
  Data: 'from-sky-600/25 via-blue-700/20 to-indigo-800/25'
}

import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider'

export default function HomePage() {
  // ... rest of page code

  // ✅ PENTING: Inisialisasi state partnershipData dan heroData dari CMS Firestore
  const [heroData, setHeroData] = useState<any>(null)
  const [partnershipData, setPartnershipData] = useState<any>(defaultPartnershipData)
  const [galleryData, setGalleryData] = useState<any[]>(defaultGalleryData)

  // State Data Artikel dari Database
  const [articles, setArticles] = useState<any[]>([])
  const [isArticlesLoading, setIsArticlesLoading] = useState(true)

  // State Modals & Toast
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<any>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [isLoading, setIsLoading] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  // ============ 1. FETCH LANDING PAGE SETTINGS (CMS FIRESTORE) ============
  useEffect(() => {
    const fetchCmsSettings = async () => {
      try {
        const settings = await getLandingPageSettings()
        if (settings) {
          if (settings.hero) setHeroData(settings.hero)
          if (settings.partnership) setPartnershipData(settings.partnership)
          if (settings.gallery && settings.gallery.length > 0) setGalleryData(settings.gallery)
        }
      } catch (error) {
        console.error('Gagal memuat pengaturan CMS landing page:', error)
      }
    }

    fetchCmsSettings()
  }, [])

const defaultSampleArticles = [
  {
    id: 'sample-1',
    title: 'Panduan Higiene & Sanitasi Keamanan Pangan bagi Pelaku Usaha Kuliner',
    slug: 'panduan-higiene-sanitasi-keamanan-pangan',
    excerpt: 'Panduan komprehensif penerapan standar kesehatan lingkungan, higienitas pengolah makanan, dan sanitasi alat pengolahan pangan.',
    category: 'Keamanan Pangan',
    author: 'Tim Kader BPOM',
    date: '2026-08-20',
    readTime: 5,
    views: 1240,
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80',
    tags: ['KeamananPangan', 'BPOM', 'Higiene'],
  },
  {
    id: 'sample-2',
    title: 'Regulasi Komposisi dan Label Bahan Tambahan Pangan (BTP) Terbaru',
    slug: 'regulasi-komposisi-label-btp-terbaru',
    excerpt: 'Penjelasan Peraturan BPOM mengenai batas maksimum penggunaan bahan tambahan pangan dan pencantuman informasi nilai gizi.',
    category: 'Regulasi',
    author: 'Humas BPOM',
    date: '2026-08-19',
    readTime: 7,
    views: 890,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
    tags: ['Regulasi', 'BTP', 'LabelPangan'],
  },
  {
    id: 'sample-3',
    title: '5 Langkah Pencegahan Kontaminasi Silang di Dapur Usaha UMKM',
    slug: '5-langkah-pencegahan-kontaminasi-silang-umkm',
    excerpt: 'Tips praktis memisahkan bahan mentah dan matang serta teknik pembersihan peralatan masaknya.',
    category: 'Tips & Trik',
    author: 'Kader KKN Tematik',
    date: '2026-08-18',
    readTime: 4,
    views: 2150,
    image: 'https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=800&q=80',
    tags: ['UMKM', 'KontaminasiSilang', 'DapurSehat'],
  },
]

  // ============ 2. FETCH ARTIKEL DARI FIRESTORE ============
  useEffect(() => {
    const fetchPublishedArticles = async () => {
      setIsArticlesLoading(true)
      try {
        const rawArticles = await getArticles()

        const published = rawArticles
          .filter((a: ArticleData) => a.status === 'Published')
          .map((a: ArticleData) => ({
            id: a.id,
            title: a.title,
            slug: a.slug,
            excerpt: a.excerpt,
            category: a.category || 'Keamanan Pangan',
            author: a.author,
            authorBio: a.authorBio,
            date: a.date,
            readTime: a.readTime || 5,
            views: a.views || 0,
            image: a.featuredImage || null,
            gradient: categoryGradients[a.category] || categoryGradients['Keamanan Pangan'],
            icon: categoryIcons[a.category] || 'cpu',
            iconColor:
              a.category === 'Keamanan Pangan'
                ? 'text-emerald-400'
                : a.category === 'Regulasi'
                ? 'text-purple-400'
                : a.category === 'Tips & Trik'
                ? 'text-amber-400'
                : 'text-cyan-400',
            content: a.content,
            tags: a.tags ? a.tags.map((t) => (t.startsWith('#') ? t : `#${t}`)) : [],
            gallery: a.gallery || []
          }))

        if (published.length > 0) {
          setArticles(published)
        } else {
          setArticles(defaultSampleArticles)
        }
      } catch (error) {
        console.error('Gagal memuat artikel:', error)
        setArticles(defaultSampleArticles)
      } finally {
        setIsArticlesLoading(false)
      }
    }

    fetchPublishedArticles()
  }, [])

  // ============ 3. HANDLE CODE SUBMIT ============
  const handleCodeSubmit = async (code: string) => {
    setIsLoading(true)
    setCodeError(null)

    try {
      const { ok, data, error } = await safeFetchJson(`/api/public/check-code?code=${encodeURIComponent(code)}`)

      if (!ok || !data) {
        throw new Error(error || 'Kode akses tidak valid.')
      }

      localStorage.setItem('aether_access_code', code)
      window.location.href = '/form'
    } catch (error: any) {
      setCodeError(error.message || 'Kode akses tidak valid. Silakan coba lagi.')
      showToastMessage(error.message || 'Kode akses tidak valid', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // ============ 4. ARTICLE MODAL & VIEWS COUNTER ============
  const openArticleModal = async (article: any) => {
    setSelectedArticle(article)
    setIsArticleModalOpen(true)

    if (article.id) {
      try {
        await incrementArticleViews(article.id)
        setArticles((prev) =>
          prev.map((a) => (a.id === article.id ? { ...a, views: (a.views || 0) + 1 } : a))
        )
      } catch (err) {
        console.error('Gagal menambah views:', err)
      }
    }
  }

  const closeArticleModal = () => {
    setIsArticleModalOpen(false)
    setTimeout(() => setSelectedArticle(null), 300)
  }

  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-[#06060E]">
        {/* Toast Notification */}
        {showToast && (
          <div
            className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slideUp ${
              toastType === 'success'
                ? 'bg-emerald-500/20 border border-emerald-500/30'
                : 'bg-rose-500/20 border border-rose-500/30'
            }`}
          >
            <Icon
              name={toastType === 'success' ? 'checkCircle' : 'alertCircle'}
              className={`w-5 h-5 ${toastType === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}
            />
            <p className="text-sm text-white">{toastMessage}</p>
          </div>
        )}

        {/* Navbar */}
        <Navbar transparent={true} onOpenCodeModal={() => setIsCodeModalOpen(true)} />

        {/* Hero Section */}
        <HeroSection heroData={heroData} onOpenCodeModal={() => setIsCodeModalOpen(true)} />

        {/* Breathing space — gives room for scroll reveal animations */}
        <div className="h-20 sm:h-28 lg:h-36" aria-hidden="true" />

        {/* Program Section (Sudah aman & menggunakan state partnershipData) */}
        <ProgramSection data={partnershipData} />

        {/* Edukasi Section */}
        <EdukasiSection
          articles={articles}
          isLoading={isArticlesLoading}
          categoryBadgeColors={categoryBadgeColors}
          onOpenArticleModal={openArticleModal}
        />

        {/* Gallery Section */}
        <GallerySection galleryData={galleryData} />

        {/* Footer */}
        <Footer />

        {/* Code Modal */}
        <CodeModal
          isOpen={isCodeModalOpen}
          onClose={() => {
            setIsCodeModalOpen(false)
            setCodeError(null)
          }}
          onSubmit={handleCodeSubmit}
          isLoading={isLoading}
          error={codeError}
        />

        {/* Article Modal */}
        <ArticleModal
          article={selectedArticle}
          isOpen={isArticleModalOpen}
          onClose={closeArticleModal}
          categoryBadgeColors={categoryBadgeColors}
        />
      </div>
    </SmoothScrollProvider>
  )
}