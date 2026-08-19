'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import { 
  getLandingPageSettings, 
  updateLandingPageSettings,
  type LandingPageSettings 
} from '@/lib/firebase/repositories/settings.repo'
import { uploadSettingsImage, uploadGalleryImage, uploadOptimizedArticleImage } from '@/lib/firebase/storage'

// ============ DATA DEFAULT / FALLBACK ============
const defaultHeroData = {
  badgeText: 'Universitas Hasanuddin x BPOM RI',
  titlePrefix: 'Mencetak Kader',
  titleGradient: 'Keamanan Pangan',
  titleSuffix: 'Wilayah Indonesia',
  description: 'Ekosistem terpadu yang menciptakan masyarakat sadar akan keamanan pangan melalui kolaborasi mahasiswa, teknologi, dan mitra strategis.',
  bgImageUrl: '/background.jpg',
  statParticipants: '70+',
  statVillages: '10',
  statPartnerLabel: 'BPOM',
}

const defaultPartnershipData = {
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

const defaultGalleryData = [
  { id: 1, title: 'Sosialisasi Keamanan Pangan', location: 'Desa Bontoatu', category: 'Sosialisasi', gradient: 'from-amber-700/40 via-orange-800/30 to-rose-900/40', imageUrl: '' },
  { id: 2, title: 'Edukasi UMKM Olahan Pangan', location: 'Makassar', category: 'Workshop', gradient: 'from-violet-700/40 via-purple-800/30 to-indigo-900/40', imageUrl: '' },
]

const gradientOptions = [
  'from-amber-700/40 via-orange-800/30 to-rose-900/40',
  'from-violet-700/40 via-purple-800/30 to-indigo-900/40',
  'from-cyan-700/40 via-teal-800/30 to-emerald-900/40',
  'from-rose-700/40 via-pink-800/30 to-fuchsia-900/40',
  'from-lime-700/40 via-green-800/30 to-teal-900/40',
  'from-sky-700/40 via-blue-800/30 to-cyan-900/40',
  'from-fuchsia-700/40 via-purple-800/30 to-violet-900/40',
  'from-orange-700/40 via-amber-800/30 to-yellow-900/40',
]

type GalleryItem = {
  id: number
  title: string
  location: string
  category: string
  gradient: string
  imageUrl?: string
}

export default function SettingsPage() {
  const { userRole, userData, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading) {
      const effectiveRole = userRole || userData?.role
      if (effectiveRole === 'partnership') {
        router.replace('/dashboard/partnership')
      } else if (effectiveRole === 'cadre') {
        router.replace('/dashboard/monitoring')
      }
    }
  }, [authLoading, userRole, userData, router])

  // ============ STATE UTAMA ============
  const [activeTab, setActiveTab] = useState<'hero' | 'partnership' | 'gallery'>('hero')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // 1. Hero State
  const [heroForm, setHeroForm] = useState(defaultHeroData)
  const [uploadingHeroBg, setUploadingHeroBg] = useState(false)
  const heroFileInputRef = useRef<HTMLInputElement>(null)

  // 2. Partnership State
  const [partnershipForm, setPartnershipForm] = useState(defaultPartnershipData)

  // 3. Gallery State
  const [gallery, setGallery] = useState<GalleryItem[]>(defaultGalleryData)
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false)
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null)
  const [galleryForm, setGalleryForm] = useState<Partial<GalleryItem>>({})
  const [uploadingGalleryImg, setUploadingGalleryImg] = useState(false)
  const galleryFileInputRef = useRef<HTMLInputElement>(null)
  const [isDeleteGalleryModalOpen, setIsDeleteGalleryModalOpen] = useState(false)
  const [galleryToDelete, setGalleryToDelete] = useState<number | null>(null)

  // ============ FETCH DATA DARI FIRESTORE ============
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      try {
        const settings = await getLandingPageSettings()
        if (settings) {
          if (settings.hero) {
            setHeroForm({ ...defaultHeroData, ...settings.hero })
          }
          if (settings.partnership) {
            setPartnershipForm({
              kkn: { ...defaultPartnershipData.kkn, ...settings.partnership.kkn },
              bpom: { ...defaultPartnershipData.bpom, ...settings.partnership.bpom },
            })
          }
          if (settings.gallery && settings.gallery.length > 0) {
            setGallery(settings.gallery as GalleryItem[])
          }
        }
      } catch (error) {
        console.error('Gagal memuat pengaturan dari Firestore:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  // ============ HANDLER HERO SECTION ============
  const handleHeroSave = async () => {
    setSaving(true)
    try {
      await updateLandingPageSettings({ hero: heroForm })
      setSuccessMessage('Hero Section berhasil diperbarui!')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error: any) {
      alert('Gagal menyimpan Hero Section: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleHeroBgUpload = async (file: File) => {
    setUploadingHeroBg(true)
    try {
      const res = await uploadOptimizedArticleImage(file, 'settings')
      setHeroForm(prev => ({ ...prev, bgImageUrl: res.url }))
      setSuccessMessage(`Foto background Hero terkompresi (${res.savedPercent}% hemat storage)!`)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error: any) {
      alert('Gagal mengunggah foto background: ' + error.message)
    } finally {
      setUploadingHeroBg(false)
    }
  }

  // ============ HANDLER PARTNERSHIP SECTION ============
  const handlePartnershipSave = async () => {
    setSaving(true)
    try {
      await updateLandingPageSettings({ partnership: partnershipForm })
      setSuccessMessage('Data Partnership & KKN berhasil diperbarui di database!')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error: any) {
      alert('Gagal menyimpan Partnership: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  // ============ HANDLER GALLERY SECTION ============
  const handleGalleryAdd = () => {
    setEditingGalleryItem(null)
    setGalleryForm({
      title: '',
      location: 'Desa Bontoatu, Makassar',
      category: 'Sosialisasi',
      gradient: gradientOptions[0],
      imageUrl: '',
    })
    setIsGalleryModalOpen(true)
  }

  const handleGalleryEdit = (item: GalleryItem) => {
    setEditingGalleryItem(item)
    setGalleryForm({ ...item })
    setIsGalleryModalOpen(true)
  }

  const handleGalleryImageUpload = async (file: File) => {
    setUploadingGalleryImg(true)
    try {
      const res = await uploadOptimizedArticleImage(file, 'gallery')
      setGalleryForm(prev => ({ ...prev, imageUrl: res.url }))
      setSuccessMessage(`Foto galeri terkompresi (${res.savedPercent}% hemat storage)!`)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error: any) {
      alert('Gagal mengunggah foto galeri: ' + error.message)
    } finally {
      setUploadingGalleryImg(false)
    }
  }

  const handleGallerySave = async () => {
    if (!galleryForm.title || !galleryForm.location || !galleryForm.category) {
      alert('Judul, Lokasi, dan Kategori wajib diisi!')
      return
    }

    let updatedGallery: GalleryItem[] = []
    if (editingGalleryItem) {
      updatedGallery = gallery.map(item =>
        item.id === editingGalleryItem.id
          ? { ...item, ...(galleryForm as GalleryItem) }
          : item
      )
    } else {
      const newItem: GalleryItem = {
        id: Math.max(0, ...gallery.map(g => g.id)) + 1,
        title: galleryForm.title || '',
        location: galleryForm.location || '',
        category: galleryForm.category || '',
        gradient: galleryForm.gradient || gradientOptions[0],
        imageUrl: galleryForm.imageUrl || '',
      }
      updatedGallery = [...gallery, newItem]
    }

    setSaving(true)
    try {
      await updateLandingPageSettings({ gallery: updatedGallery })
      setGallery(updatedGallery)
      setIsGalleryModalOpen(false)
      setSuccessMessage('Galeri berhasil diperbarui di database!')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error: any) {
      alert('Gagal menyimpan Galeri: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleGalleryDelete = (id: number) => {
    setGalleryToDelete(id)
    setIsDeleteGalleryModalOpen(true)
  }

  const confirmGalleryDelete = async () => {
    if (galleryToDelete === null) return
    const updatedGallery = gallery.filter(item => item.id !== galleryToDelete)

    setSaving(true)
    try {
      await updateLandingPageSettings({ gallery: updatedGallery })
      setGallery(updatedGallery)
      setSuccessMessage('Item galeri berhasil dihapus!')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error: any) {
      alert('Gagal menghapus Galeri: ' + error.message)
    } finally {
      setIsDeleteGalleryModalOpen(false)
      setGalleryToDelete(null)
      setSaving(false)
    }
  }

  // ============ RENDER UI ============
  return (
    <div className="flex flex-col min-h-screen bg-[#06060E]">
      <Topbar
        title="Pengaturan Konten Website"
        subtitle="Kelola konten publik (Hero, Partnership, & Galeri Dokumentasi)"
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Toast Notifikasi */}
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

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-white/[0.06] pb-4 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('hero')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'hero'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Icon name="sparkles" className="w-4 h-4" />
            Hero Section
          </button>
          <button
            onClick={() => setActiveTab('partnership')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'partnership'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Icon name="link2" className="w-4 h-4" />
            Partnership & KKN
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'gallery'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Icon name="image" className="w-4 h-4" />
            Galeri Dokumentasi
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-white/40">
            <Icon name="loader" className="w-8 h-8 text-cyan-400 animate-spin mr-3" />
            <span>Memuat pengaturan dari database...</span>
          </div>
        ) : (
          <>
            {/* ============================================================ */}
            {/* TAB 1: HERO SECTION                                          */}
            {/* ============================================================ */}
            {activeTab === 'hero' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
                        <Icon name="sparkles" className="w-5 h-5 text-cyan-400" />
                        Pengaturan Hero Section
                      </h3>
                      <p className="text-xs text-white/40 mt-1">Ubah judul, deskripsi, dan gambar latar utama</p>
                    </div>
                    <button
                      onClick={handleHeroSave}
                      disabled={saving}
                      className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25 flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="save" className="w-4 h-4" />}
                      Simpan Hero
                    </button>
                  </div>

                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Teks Badge Kemitraan (Atas Judul)</label>
                    <input
                      type="text"
                      value={heroForm.badgeText || ''}
                      onChange={(e) => setHeroForm({ ...heroForm, badgeText: e.target.value })}
                      placeholder="Contoh: Universitas Hasanuddin x BPOM RI"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Prefix Judul</label>
                      <input
                        type="text"
                        value={heroForm.titlePrefix}
                        onChange={(e) => setHeroForm({ ...heroForm, titlePrefix: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Judul Utama (Gradient)</label>
                      <input
                        type="text"
                        value={heroForm.titleGradient}
                        onChange={(e) => setHeroForm({ ...heroForm, titleGradient: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Suffix Judul</label>
                      <input
                        type="text"
                        value={heroForm.titleSuffix}
                        onChange={(e) => setHeroForm({ ...heroForm, titleSuffix: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Deskripsi Singkat Hero</label>
                    <textarea
                      value={heroForm.description}
                      onChange={(e) => setHeroForm({ ...heroForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none resize-none"
                    />
                  </div>

                  {/* Metrik Statistik Hero */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/[0.05]">
                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Metrik 1 (Jumlah Kader/Mahasiswa)</label>
                      <input
                        type="text"
                        value={heroForm.statParticipants || '70+'}
                        onChange={(e) => setHeroForm({ ...heroForm, statParticipants: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-cyan-300 font-bold text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Metrik 2 (Jumlah Desa Binaan)</label>
                      <input
                        type="text"
                        value={heroForm.statVillages || '10'}
                        onChange={(e) => setHeroForm({ ...heroForm, statVillages: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-emerald-300 font-bold text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Metrik 3 (Label Mitra Utama)</label>
                      <input
                        type="text"
                        value={heroForm.statPartnerLabel || 'BPOM'}
                        onChange={(e) => setHeroForm({ ...heroForm, statPartnerLabel: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-blue-300 font-bold text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.05]">
                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-2">Foto Background Hero</label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="relative w-full sm:w-48 h-28 rounded-xl overflow-hidden border border-white/10 bg-black/40 shrink-0">
                        <img
                          src={heroForm.bgImageUrl || '/background.jpg'}
                          alt="Background Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = '/background.jpg' }}
                        />
                      </div>
                      <div className="space-y-2 flex-1 w-full">
                        <input
                          ref={heroFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleHeroBgUpload(file)
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={heroForm.bgImageUrl}
                            onChange={(e) => setHeroForm({ ...heroForm, bgImageUrl: e.target.value })}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-xs focus:outline-none"
                            placeholder="URL Gambar"
                          />
                          <button
                            type="button"
                            disabled={uploadingHeroBg}
                            onClick={() => heroFileInputRef.current?.click()}
                            className="px-4 py-2.5 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 text-xs font-medium hover:bg-cyan-600/30 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                          >
                            {uploadingHeroBg ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="upload" className="w-4 h-4" />}
                            <span>{uploadingHeroBg ? 'Mengunggah...' : 'Upload Foto'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 2: PARTNERSHIP & KKN                                     */}
            {/* ============================================================ */}
            {activeTab === 'partnership' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-end">
                  <button
                    onClick={handlePartnershipSave}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25 flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="save" className="w-4 h-4" />}
                    Simpan Partnership
                  </button>
                </div>

                {/* KKN UH Card */}
                <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6 space-y-4">
                  <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2 border-b border-white/[0.05] pb-3">
                    <Icon name="rocket" className="w-5 h-5 text-cyan-400" />
                    Program Kuliah Kerja Nyata (KKN-UH)
                  </h3>

                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Judul Program</label>
                    <input
                      type="text"
                      value={partnershipForm.kkn.title}
                      onChange={(e) => setPartnershipForm({
                        ...partnershipForm,
                        kkn: { ...partnershipForm.kkn, title: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Deskripsi Ringkas</label>
                    <textarea
                      value={partnershipForm.kkn.description}
                      onChange={(e) => setPartnershipForm({
                        ...partnershipForm,
                        kkn: { ...partnershipForm.kkn, description: e.target.value }
                      })}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Peserta Aktif</label>
                      <input
                        type="number"
                        value={partnershipForm.kkn.participants}
                        onChange={(e) => setPartnershipForm({
                          ...partnershipForm,
                          kkn: { ...partnershipForm.kkn, participants: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Desa Binaan</label>
                      <input
                        type="number"
                        value={partnershipForm.kkn.villages}
                        onChange={(e) => setPartnershipForm({
                          ...partnershipForm,
                          kkn: { ...partnershipForm.kkn, villages: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-2">Program Highlights</label>
                    {partnershipForm.kkn.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={highlight}
                          onChange={(e) => {
                            const newHighlights = [...partnershipForm.kkn.highlights]
                            newHighlights[index] = e.target.value
                            setPartnershipForm({
                              ...partnershipForm,
                              kkn: { ...partnershipForm.kkn, highlights: newHighlights }
                            })
                          }}
                          className="flex-1 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newHighlights = partnershipForm.kkn.highlights.filter((_, i) => i !== index)
                            setPartnershipForm({
                              ...partnershipForm,
                              kkn: { ...partnershipForm.kkn, highlights: newHighlights }
                            })
                          }}
                          className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          <Icon name="trash" className="w-4 h-4 text-white/30 hover:text-red-400" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setPartnershipForm({
                          ...partnershipForm,
                          kkn: {
                            ...partnershipForm.kkn,
                            highlights: [...partnershipForm.kkn.highlights, '']
                          }
                        })
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 mt-1"
                    >
                      <Icon name="plus" className="w-3 h-3" /> Tambah Highlight
                    </button>
                  </div>
                </div>

                {/* Card BPOM */}
                <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6 space-y-4">
                  <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2 border-b border-white/[0.05] pb-3">
                    <Icon name="gem" className="w-5 h-5 text-violet-400" />
                    Mitra Strategis BPOM RI
                  </h3>

                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Judul Instansi</label>
                    <input
                      type="text"
                      value={partnershipForm.bpom.title}
                      onChange={(e) => setPartnershipForm({
                        ...partnershipForm,
                        bpom: { ...partnershipForm.bpom, title: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Deskripsi Kolaborasi</label>
                    <textarea
                      value={partnershipForm.bpom.description}
                      onChange={(e) => setPartnershipForm({
                        ...partnershipForm,
                        bpom: { ...partnershipForm.bpom, description: e.target.value }
                      })}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-2">Fitur & Fasilitas Kolaborasi</label>
                    {partnershipForm.bpom.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => {
                            const newFeatures = [...partnershipForm.bpom.features]
                            newFeatures[index] = e.target.value
                            setPartnershipForm({
                              ...partnershipForm,
                              bpom: { ...partnershipForm.bpom, features: newFeatures }
                            })
                          }}
                          className="flex-1 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newFeatures = partnershipForm.bpom.features.filter((_, i) => i !== index)
                            setPartnershipForm({
                              ...partnershipForm,
                              bpom: { ...partnershipForm.bpom, features: newFeatures }
                            })
                          }}
                          className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          <Icon name="trash" className="w-4 h-4 text-white/30 hover:text-red-400" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setPartnershipForm({
                          ...partnershipForm,
                          bpom: {
                            ...partnershipForm.bpom,
                            features: [...partnershipForm.bpom.features, '']
                          }
                        })
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 mt-1"
                    >
                      <Icon name="plus" className="w-3 h-3" /> Tambah Fitur
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 3: GALERI DOKUMENTASI                                    */}
            {/* ============================================================ */}
            {activeTab === 'gallery' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-white/40">Total {gallery.length} item dokumentasi di halaman publik</p>
                  <button
                    onClick={handleGalleryAdd}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25"
                  >
                    <Icon name="plus" className="w-4 h-4" /> Tambah Galeri
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {gallery.map((item) => (
                    <div key={item.id} className="group relative rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.05] hover:border-cyan-500/20 transition-all">
                      <div className={`aspect-[4/3] bg-gradient-to-br ${item.gradient} flex items-center justify-center relative`}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <Icon name="image" className="w-12 h-12 text-white/20 group-hover:text-white/40 transition-colors" />
                        )}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-xs font-medium text-amber-300">
                          {item.category}
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-display font-semibold text-white text-base group-hover:text-cyan-300 transition-colors truncate">
                          {item.title}
                        </h4>
                        <p className="text-white/40 text-xs mt-1 flex items-center gap-1 truncate">
                          <Icon name="mapPin" className="w-3 h-3 shrink-0" /> {item.location}
                        </p>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleGalleryEdit(item)}
                          className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 transition-colors"
                        >
                          <Icon name="pencil" className="w-3.5 h-3.5 text-white" />
                        </button>
                        <button
                          onClick={() => handleGalleryDelete(item.id)}
                          className="p-1.5 rounded-lg bg-black/60 hover:bg-red-500/60 transition-colors"
                        >
                          <Icon name="trash" className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL TAMBAH / EDIT GALERI (LENGKAP DENGAN UPLOAD FOTO)      */}
      {/* ============================================================ */}
      {isGalleryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsGalleryModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="font-display text-lg font-semibold text-white">
                {editingGalleryItem ? 'Edit Dokumentasi' : 'Tambah Dokumentasi Baru'}
              </h3>
              <button
                onClick={() => setIsGalleryModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center transition-colors"
              >
                <Icon name="x" className="w-5 h-5 text-white/50" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Judul Acara / Kegiatan</label>
                <input
                  type="text"
                  value={galleryForm.title || ''}
                  onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                  placeholder="Contoh: Penyuluhan Pangan Desa Bontoatu"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Lokasi</label>
                  <input
                    type="text"
                    value={galleryForm.location || ''}
                    onChange={(e) => setGalleryForm({ ...galleryForm, location: e.target.value })}
                    placeholder="Contoh: Desa Bontoatu, Makassar"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Kategori</label>
                  <input
                    type="text"
                    value={galleryForm.category || ''}
                    onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                    placeholder="Contoh: Sosialisasi, Workshop"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Upload Foto Asli / Pilihan Gradient Fallback */}
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Foto Kegiatan Asli</label>
                <input
                  ref={galleryFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleGalleryImageUpload(file)
                  }}
                />
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={galleryForm.imageUrl || ''}
                    onChange={(e) => setGalleryForm({ ...galleryForm, imageUrl: e.target.value })}
                    placeholder="URL foto atau klik upload"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={uploadingGalleryImg}
                    onClick={() => galleryFileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 text-xs font-medium hover:bg-cyan-600/30 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    {uploadingGalleryImg ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="upload" className="w-4 h-4" />}
                    <span>{uploadingGalleryImg ? 'Uploading...' : 'Upload Foto'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider block mb-2">Aksen Warna (Fallback tanpa foto)</label>
                <div className="grid grid-cols-4 gap-2">
                  {gradientOptions.map((gradient, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setGalleryForm({ ...galleryForm, gradient })}
                      className={`h-10 rounded-xl border-2 transition-all ${
                        galleryForm.gradient === gradient ? 'border-cyan-400 scale-105' : 'border-transparent hover:border-white/20'
                      }`}
                      style={{ background: `linear-gradient(to bottom right, ${gradient.replace(/from-|via-|to-/g, '')})` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-white/[0.06]">
              <button
                onClick={() => setIsGalleryModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 hover:text-white"
              >
                Batal
              </button>
              <button
                onClick={handleGallerySave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white shadow-lg shadow-cyan-600/25 flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="save" className="w-4 h-4" />}
                {editingGalleryItem ? 'Perbarui' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DELETE CONFIRMATION                                    */}
      {/* ============================================================ */}
      {isDeleteGalleryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsDeleteGalleryModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Icon name="alertCircle" className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white mb-2">Hapus Dokumentasi</h3>
            <p className="text-sm text-white/50 mb-6">
              Apakah Anda yakin ingin menghapus item galeri ini dari landing page?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsDeleteGalleryModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 hover:text-white"
              >
                Batal
              </button>
              <button
                onClick={confirmGalleryDelete}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-medium text-white transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="trash" className="w-4 h-4" />}
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}