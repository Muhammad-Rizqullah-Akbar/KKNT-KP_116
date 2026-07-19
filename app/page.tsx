'use client'

import { useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/home/HeroSection'
import { ProgramSection } from '@/components/home/ProgramSection'
import { EdukasiSection } from '@/components/home/EdukasiSection'
import { GallerySection } from '@/components/home/GallerySection'
import { ArticleModal } from '@/components/home/ArticleModal'
import { CodeModal } from '@/components/home/CodeModal'
import { Icon } from '@/components/ui/Icons'

// ============ DATA ============
const partnershipData = {
  kkn: {
    title: 'Program Kuliah Kerja Nyata Tematik Keamanan Pangan Universitas Hasanuddin',
    description: 'Program Akselerator Terbaik Universitas Hasanuddin untuk Meningkatkan Wawasan dan Pengalaman Bekerja serta meningkatkan kualitas kinerja Mahasiswa',
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
    description: 'BPOM Berkolaborasi dengan kampus-kampus pada program Kuliah Kerja Nyata dalam rangka Membangun Desa yang Sadar akan Keamanan Pangan',
    features: [
      'Mentorship 1-on-1 dengan Mentor dari BPOM',
      'Akses Modul Pembelajaran tentang Keamanan Pangan dan lainnya',
      'Sertifikat dari BPOM'
    ]
  }
}

const articlesData = [
  {
    id: 1,
    title: 'Tren Teknologi 2026: AI & Beyond',
    slug: 'tren-teknologi-2026-ai-beyond',
    excerpt: 'Eksplorasi mendalam tentang bagaimana kecerdasan buatan membentuk ulang industri global — dari generative AI hingga edge computing.',
    category: 'Teknologi',
    author: 'Dr. Aria Nugraha',
    authorBio: 'Chief Technology Officer di Aether Global Labs dengan pengalaman 15+ tahun di bidang AI dan machine learning. Alumni MIT dan Stanford.',
    date: '12 Juli 2026',
    readTime: 8,
    views: 12500,
    image: null,
    gradient: 'from-emerald-600/30 via-teal-700/20 to-cyan-800/30',
    icon: 'cpu',
    iconColor: 'text-emerald-400',
    content: `
      <p>Kecerdasan buatan generatif telah menjadi katalis utama transformasi digital di tahun 2026. Teknologi ini tidak lagi sekadar menghasilkan teks atau gambar — kini AI mampu menciptakan video, musik, kode program kompleks, dan bahkan desain produk secara otonom.</p>
      <h2>1. Revolusi AI Generatif: Dari Teks ke Realitas</h2>
      <p>Kecerdasan buatan generatif telah menjadi katalis utama transformasi digital di tahun 2026.</p>
      <blockquote>"Edge AI adalah masa depan komputasi cerdas. Dengan memproses data di perangkat lokal, kita mengurangi latensi hingga 90%."</blockquote>
      <h2>2. Edge AI & Internet of Things (IoT)</h2>
      <p>Salah satu tren paling signifikan adalah pergeseran pemrosesan AI dari cloud ke edge devices.</p>
    `,
    tags: ['#AI', '#MachineLearning', '#FutureTech']
  },
  {
    id: 2,
    title: 'Strategi Fundraising Startup',
    slug: 'strategi-fundraising-startup',
    excerpt: 'Panduan lengkap mendapatkan pendanaan dari tahap seed hingga series A.',
    category: 'Bisnis',
    author: 'Maya Pratiwi, MBA',
    authorBio: 'Praktisi bisnis dan startup dengan pengalaman 10+ tahun di industri keuangan dan pendanaan.',
    date: '5 Juli 2026',
    readTime: 6,
    views: 8200,
    image: null,
    gradient: 'from-rose-600/25 via-pink-700/20 to-orange-800/25',
    icon: 'piggyBank',
    iconColor: 'text-rose-400',
    content: '<p>Panduan lengkap mendapatkan pendanaan dari tahap seed hingga series A.</p>',
    tags: ['#Fundraising', '#Startup', '#Bisnis']
  },
  {
    id: 3,
    title: 'Membangun Personal Brand',
    slug: 'membangun-personal-brand',
    excerpt: 'Cara efektif membangun reputasi profesional yang kuat di era digital.',
    category: 'Karir',
    author: 'Rian Hermawan',
    authorBio: 'Personal Branding Expert dan Public Speaker dengan pengalaman membangun brand untuk 100+ profesional.',
    date: '28 Juni 2026',
    readTime: 5,
    views: 5600,
    image: null,
    gradient: 'from-amber-600/25 via-yellow-700/20 to-orange-800/25',
    icon: 'badgeCheck',
    iconColor: 'text-amber-400',
    content: '<p>Cara efektif membangun reputasi profesional yang kuat di era digital.</p>',
    tags: ['#PersonalBrand', '#Karir', '#Profesional']
  },
  {
    id: 4,
    title: 'Data Analytics untuk Bisnis',
    slug: 'data-analytics-untuk-bisnis',
    excerpt: 'Optimalkan keputusan bisnis Anda dengan pendekatan data-driven.',
    category: 'Data',
    author: 'Dr. Sari Dewanti',
    authorBio: 'Data Scientist dengan pengalaman 12+ tahun di bidang analitik data dan business intelligence.',
    date: '20 Juni 2026',
    readTime: 7,
    views: 6900,
    image: null,
    gradient: 'from-sky-600/25 via-blue-700/20 to-indigo-800/25',
    icon: 'barChart',
    iconColor: 'text-sky-400',
    content: '<p>Optimalkan keputusan bisnis Anda dengan pendekatan data-driven.</p>',
    tags: ['#DataAnalytics', '#Bisnis', '#DataDriven']
  }
]

const galleryData = [
  { id: 1, title: 'Keynote: Masa Depan AI', location: 'Jakarta Convention Center', category: 'Summit 2026', gradient: 'from-amber-700/40 via-orange-800/30 to-rose-900/40' },
  { id: 2, title: 'UI/UX Masterclass', location: 'Bandung Creative Hub', category: 'Workshop', gradient: 'from-violet-700/40 via-purple-800/30 to-indigo-900/40' },
  { id: 3, title: 'Tech Expo 2026', location: 'Surabaya Grand Hall', category: 'Pameran', gradient: 'from-cyan-700/40 via-teal-800/30 to-emerald-900/40' },
  { id: 4, title: 'Innovation Award Night', location: 'Bali Nusa Dua', category: 'Award', gradient: 'from-rose-700/40 via-pink-800/30 to-fuchsia-900/40' },
  { id: 5, title: '48-Hour Code Sprint', location: 'Yogyakarta Digital Valley', category: 'Hackathon', gradient: 'from-lime-700/40 via-green-800/30 to-teal-900/40' },
  { id: 6, title: 'Startup Founder Meetup', location: 'Semarang Creative Space', category: 'Meetup', gradient: 'from-sky-700/40 via-blue-800/30 to-cyan-900/40' },
  { id: 7, title: 'Women in Tech Talks', location: 'Medan Innovation Center', category: 'Talkshow', gradient: 'from-fuchsia-700/40 via-purple-800/30 to-violet-900/40' },
  { id: 8, title: 'Grand Closing Gala', location: 'Makassar Waterfront', category: 'Closing', gradient: 'from-orange-700/40 via-amber-800/30 to-yellow-900/40' },
]

const categoryBadgeColors: Record<string, string> = {
  Teknologi: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Bisnis: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  Karir: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Data: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
}

export default function HomePage() {
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

  // ============ HANDLE CODE SUBMIT ============
  const handleCodeSubmit = async (code: string) => {
    setIsLoading(true)
    setCodeError(null)

    try {
      const response = await fetch(`/api/public/check-code?code=${encodeURIComponent(code)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Kode tidak valid')
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

  // ============ ARTICLE MODAL ============
  const openArticleModal = (article: any) => {
    setSelectedArticle(article)
    setIsArticleModalOpen(true)
  }

  const closeArticleModal = () => {
    setIsArticleModalOpen(false)
    setTimeout(() => setSelectedArticle(null), 300)
  }

  return (
    <div className="min-h-screen bg-[#06060E]">
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slideUp ${
          toastType === 'success' 
            ? 'bg-emerald-500/20 border border-emerald-500/30' 
            : 'bg-rose-500/20 border border-rose-500/30'
        }`}>
          <Icon name={toastType === 'success' ? 'checkCircle' : 'alertCircle'} 
            className={`w-5 h-5 ${toastType === 'success' ? 'text-emerald-400' : 'text-rose-400'}`} />
          <p className="text-sm text-white">{toastMessage}</p>
        </div>
      )}

      <Navbar transparent={true} />

      <HeroSection onOpenCodeModal={() => setIsCodeModalOpen(true)} />

      <ProgramSection data={partnershipData} />

      <EdukasiSection
        articles={articlesData}
        categoryBadgeColors={categoryBadgeColors}
        onOpenArticleModal={openArticleModal}
      />

      <GallerySection galleryData={galleryData} />

      <Footer />

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

      <ArticleModal
        article={selectedArticle}
        isOpen={isArticleModalOpen}
        onClose={closeArticleModal}
        categoryBadgeColors={categoryBadgeColors}
      />
    </div>
  )
}