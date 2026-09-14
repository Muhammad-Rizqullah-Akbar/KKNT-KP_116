'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import { Icon } from '@/components/ui/Icons'
import {
  getLandingPageSettings,
  updateLandingPageSettings,
} from '@/lib/repositories/settings.repo'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/lib/hooks'
import {
  defaultHeroData,
  defaultPartnershipData,
  defaultGalleryData,
  gradientOptions,
  type GalleryItem,
  type HeroData,
  type PartnershipData,
} from './settings-utils'
import HeroSection from './hero-section'
import PartnershipSection from './partnership-section'
import GallerySection from './gallery-section'
import GalleryModal from './gallery-modal'
import DeleteGalleryModal from './delete-gallery-modal'
import { CostMonitoringSection } from './cost-monitoring-section'

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
  const [activeTab, setActiveTab] = useState<'hero' | 'partnership' | 'gallery' | 'cost'>('hero')
  const [saving, setSaving] = useState(false)
  const { visible, message, show, hide } = useToast()

  // 1. Hero State
  const [heroForm, setHeroForm] = useState<HeroData>(defaultHeroData)

  // 2. Partnership State
  const [partnershipForm, setPartnershipForm] = useState<PartnershipData>(defaultPartnershipData)

  // 3. Gallery State
  const [gallery, setGallery] = useState<GalleryItem[]>(defaultGalleryData)
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false)
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null)
  const [galleryForm, setGalleryForm] = useState<Partial<GalleryItem>>({})
  const [isDeleteGalleryModalOpen, setIsDeleteGalleryModalOpen] = useState(false)
  const [galleryToDelete, setGalleryToDelete] = useState<number | null>(null)

  // ============ FETCH DATA DARI FIRESTORE ============
  const { isLoading: loading } = useQuery({
    queryKey: queryKeys.settings.landing,
    queryFn: async () => {
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
      return settings
    },
  })

  // ============ HANDLER HERO SECTION ============
  const handleHeroSave = async () => {
    setSaving(true)
    try {
      await updateLandingPageSettings({ hero: heroForm })
      show('Hero Section berhasil diperbarui!')
    } catch (error: any) {
      alert('Gagal menyimpan Hero Section: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  // ============ HANDLER PARTNERSHIP SECTION ============
  const handlePartnershipSave = async () => {
    setSaving(true)
    try {
      await updateLandingPageSettings({ partnership: partnershipForm })
      show('Data Partnership & KKN berhasil diperbarui di database!')
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
        id: Math.max(0, ...gallery.map((galleryItem) => galleryItem.id)) + 1,
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
      show('Galeri berhasil diperbarui di database!')
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
      show('Item galeri berhasil dihapus!')
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
        {visible && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 animate-slideUp">
            <Icon name="checkCircle" className="w-5 h-5 text-emerald-400" />
            <p className="text-sm text-white">{message}</p>
            <button
              onClick={hide}
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
          <button
            onClick={() => setActiveTab('cost')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'cost'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Icon name="trendingUp" className="w-4 h-4" />
            Monitoring Biaya
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-white/40">
            <Icon name="loader" className="w-8 h-8 text-cyan-400 animate-spin mr-3" />
            <span>Memuat pengaturan dari database...</span>
          </div>
        ) : (
          <>
            {/* TAB 1: HERO SECTION */}
            {activeTab === 'hero' && (
              <HeroSection
                heroForm={heroForm}
                setHeroForm={setHeroForm}
                saving={saving}
                onSave={handleHeroSave}
              />
            )}

            {/* TAB 2: PARTNERSHIP & KKN */}
            {activeTab === 'partnership' && (
              <PartnershipSection
                partnershipForm={partnershipForm}
                setPartnershipForm={setPartnershipForm}
                saving={saving}
                onSave={handlePartnershipSave}
              />
            )}

            {/* TAB 3: GALERI DOKUMENTASI */}
            {activeTab === 'gallery' && (
              <GallerySection
                gallery={gallery}
                onAdd={handleGalleryAdd}
                onEdit={handleGalleryEdit}
                onDelete={handleGalleryDelete}
              />
            )}

            {/* TAB 4: MONITORING BIAYA (OBSERVABILITY) */}
            {activeTab === 'cost' && <CostMonitoringSection />}
          </>
        )}
      </div>

      {/* MODAL TAMBAH / EDIT GALERI */}
      {isGalleryModalOpen && (
        <GalleryModal
          editingItem={editingGalleryItem}
          galleryForm={galleryForm}
          setGalleryForm={setGalleryForm}
          saving={saving}
          onSave={handleGallerySave}
          onClose={() => setIsGalleryModalOpen(false)}
        />
      )}

      {/* MODAL DELETE CONFIRMATION */}
      {isDeleteGalleryModalOpen && (
        <DeleteGalleryModal
          saving={saving}
          onCancel={() => setIsDeleteGalleryModalOpen(false)}
          onConfirm={confirmGalleryDelete}
        />
      )}
    </div>
  )
}
