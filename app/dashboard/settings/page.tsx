'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import { Button } from '@/components/shared/Button'

// ============ DATA DUMMY ============
// Data Partnership (Section 2 dari example.html)
const initialPartnership = {
  // KKN-UH
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
  // BPOM
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

// Data Galeri Dokumentasi (Section 4 dari example.html)
const initialGallery = [
  { id: 1, title: 'Keynote: Masa Depan AI', location: 'Jakarta Convention Center', category: 'Summit 2026', gradient: 'from-amber-700/40 via-orange-800/30 to-rose-900/40' },
  { id: 2, title: 'UI/UX Masterclass', location: 'Bandung Creative Hub', category: 'Workshop', gradient: 'from-violet-700/40 via-purple-800/30 to-indigo-900/40' },
  { id: 3, title: 'Tech Expo 2026', location: 'Surabaya Grand Hall', category: 'Pameran', gradient: 'from-cyan-700/40 via-teal-800/30 to-emerald-900/40' },
  { id: 4, title: 'Innovation Award Night', location: 'Bali Nusa Dua', category: 'Award', gradient: 'from-rose-700/40 via-pink-800/30 to-fuchsia-900/40' },
  { id: 5, title: '48-Hour Code Sprint', location: 'Yogyakarta Digital Valley', category: 'Hackathon', gradient: 'from-lime-700/40 via-green-800/30 to-teal-900/40' },
  { id: 6, title: 'Startup Founder Meetup', location: 'Semarang Creative Space', category: 'Meetup', gradient: 'from-sky-700/40 via-blue-800/30 to-cyan-900/40' },
  { id: 7, title: 'Women in Tech Talks', location: 'Medan Innovation Center', category: 'Talkshow', gradient: 'from-fuchsia-700/40 via-purple-800/30 to-violet-900/40' },
  { id: 8, title: 'Grand Closing Gala', location: 'Makassar Waterfront', category: 'Closing', gradient: 'from-orange-700/40 via-amber-800/30 to-yellow-900/40' },
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
  'from-emerald-700/40 via-teal-800/30 to-cyan-900/40',
  'from-rose-700/40 via-pink-800/30 to-rose-900/40',
]

type GalleryItem = typeof initialGallery[0]

export default function SettingsPage() {
  // ============ STATE ============
  const [activeTab, setActiveTab] = useState<'partnership' | 'gallery' | 'articles'>('partnership')
  
  // Partnership state
  const [partnership, setPartnership] = useState(initialPartnership)
  const [isPartnershipEditing, setIsPartnershipEditing] = useState(false)
  const [partnershipForm, setPartnershipForm] = useState(initialPartnership)
  
  // Gallery state
  const [gallery, setGallery] = useState(initialGallery)
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false)
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null)
  const [galleryForm, setGalleryForm] = useState<Partial<GalleryItem>>({})
  const [isDeleteGalleryModalOpen, setIsDeleteGalleryModalOpen] = useState(false)
  const [galleryToDelete, setGalleryToDelete] = useState<number | null>(null)
  
  // Articles state (dari dashboard/articles)
  const [articles, setArticles] = useState([
    { id: 1, title: 'Tren Teknologi 2026: AI & Beyond', category: 'Teknologi', status: 'Published' },
    { id: 2, title: 'Strategi Fundraising Startup', category: 'Bisnis', status: 'Draft' },
    { id: 3, title: 'Membangun Personal Brand', category: 'Karir', status: 'Published' },
    { id: 4, title: 'Data Analytics untuk Bisnis', category: 'Data', status: 'Published' },
  ])
  
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // ============ PARTNERSHIP HANDLERS ============
  const handlePartnershipEdit = () => {
    setPartnershipForm(partnership)
    setIsPartnershipEditing(true)
  }

  const handlePartnershipSave = () => {
    setPartnership(partnershipForm)
    setIsPartnershipEditing(false)
    setSuccessMessage('Data partnership berhasil diperbarui!')
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handlePartnershipCancel = () => {
    setPartnershipForm(partnership)
    setIsPartnershipEditing(false)
  }

  // ============ GALLERY HANDLERS ============
  const handleGalleryAdd = () => {
    setEditingGalleryItem(null)
    setGalleryForm({
      title: '',
      location: '',
      category: '',
      gradient: gradientOptions[0],
    })
    setIsGalleryModalOpen(true)
  }

  const handleGalleryEdit = (item: GalleryItem) => {
    setEditingGalleryItem(item)
    setGalleryForm({ ...item })
    setIsGalleryModalOpen(true)
  }

  const handleGallerySave = () => {
    if (!galleryForm.title || !galleryForm.location || !galleryForm.category) {
      alert('Semua field harus diisi!')
      return
    }

    if (editingGalleryItem) {
      // Update
      setGallery(prev => prev.map(item => 
        item.id === editingGalleryItem.id 
          ? { ...item, ...galleryForm as GalleryItem }
          : item
      ))
      setSuccessMessage('Galeri berhasil diperbarui!')
    } else {
      // Create
      const newItem: GalleryItem = {
        id: Math.max(...gallery.map(g => g.id)) + 1,
        title: galleryForm.title || '',
        location: galleryForm.location || '',
        category: galleryForm.category || '',
        gradient: galleryForm.gradient || gradientOptions[0],
      }
      setGallery(prev => [...prev, newItem])
      setSuccessMessage('Galeri berhasil ditambahkan!')
    }

    setIsGalleryModalOpen(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleGalleryDelete = (id: number) => {
    setGalleryToDelete(id)
    setIsDeleteGalleryModalOpen(true)
  }

  const confirmGalleryDelete = () => {
    if (galleryToDelete) {
      setGallery(prev => prev.filter(item => item.id !== galleryToDelete))
      setSuccessMessage('Galeri berhasil dihapus!')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }
    setIsDeleteGalleryModalOpen(false)
    setGalleryToDelete(null)
  }

  // ============ RENDER ============
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar 
        title="Pengaturan Konten" 
        subtitle="Kelola konten website (Partnership, Galeri, & Artikel)" 
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

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/[0.06] pb-4">
          <button
            onClick={() => setActiveTab('partnership')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'partnership'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Icon name="link2" className="w-4 h-4 inline mr-2" />
            Partnership
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'gallery'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Icon name="image" className="w-4 h-4 inline mr-2" />
            Galeri Dokumentasi
          </button>
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'articles'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Icon name="bookOpen" className="w-4 h-4 inline mr-2" />
            Artikel Edukasi
          </button>
        </div>

        {/* ============ TAB 1: PARTNERSHIP ============ */}
        {activeTab === 'partnership' && (
          <div className="space-y-6">
            {/* KKN-UH Card */}
            <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
                  <Icon name="rocket" className="w-5 h-5 text-cyan-400" />
                  Program KKN-UH
                </h3>
                {!isPartnershipEditing && (
                  <button
                    onClick={handlePartnershipEdit}
                    className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                  >
                    <Icon name="pencil" className="w-4 h-4 text-white/50 hover:text-cyan-400" />
                  </button>
                )}
              </div>

              {isPartnershipEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Judul</label>
                    <input
                      type="text"
                      value={partnershipForm.kkn.title}
                      onChange={(e) => setPartnershipForm({
                        ...partnershipForm,
                        kkn: { ...partnershipForm.kkn, title: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Deskripsi</label>
                    <textarea
                      value={partnershipForm.kkn.description}
                      onChange={(e) => setPartnershipForm({
                        ...partnershipForm,
                        kkn: { ...partnershipForm.kkn, description: e.target.value }
                      })}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all resize-none"
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
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Desa/Wilayah</label>
                      <input
                        type="number"
                        value={partnershipForm.kkn.villages}
                        onChange={(e) => setPartnershipForm({
                          ...partnershipForm,
                          kkn: { ...partnershipForm.kkn, villages: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Program Highlights</label>
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
                          className="flex-1 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                        />
                        <button
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
                      onClick={() => {
                        setPartnershipForm({
                          ...partnershipForm,
                          kkn: { 
                            ...partnershipForm.kkn, 
                            highlights: [...partnershipForm.kkn.highlights, ''] 
                          }
                        })
                      }}
                      className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                    >
                      <Icon name="plus" className="w-3 h-3" /> Tambah Highlight
                    </button>
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
                    <button
                      onClick={handlePartnershipCancel}
                      className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 hover:text-white transition-all"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handlePartnershipSave}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25 flex items-center gap-2"
                    >
                      <Icon name="save" className="w-4 h-4" /> Simpan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xl font-semibold text-white">{partnership.kkn.title}</h4>
                  <p className="text-white/55 text-sm leading-relaxed">{partnership.kkn.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <div className="flex items-center gap-2">
                        <Icon name="users" className="w-4 h-4 text-cyan-400" />
                        <span className="text-2xl font-bold text-white font-display">{partnership.kkn.participants}</span>
                      </div>
                      <p className="text-xs text-white/40 uppercase">Peserta Aktif</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <div className="flex items-center gap-2">
                        <Icon name="globe" className="w-4 h-4 text-teal-400" />
                        <span className="text-2xl font-bold text-white font-display">{partnership.kkn.villages}</span>
                      </div>
                      <p className="text-xs text-white/40 uppercase">Desa/Wilayah</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/35 font-medium">Program Highlights</p>
                    {partnership.kkn.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm text-white/60">
                        <Icon name="sparkles" className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* BPOM Card */}
            <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
                  <Icon name="gem" className="w-5 h-5 text-violet-400" />
                  Badan Pengawas Obat dan Makanan (BPOM)
                </h3>
                {!isPartnershipEditing && (
                  <button
                    onClick={handlePartnershipEdit}
                    className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                  >
                    <Icon name="pencil" className="w-4 h-4 text-white/50 hover:text-cyan-400" />
                  </button>
                )}
              </div>

              {isPartnershipEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Judul</label>
                    <input
                      type="text"
                      value={partnershipForm.bpom.title}
                      onChange={(e) => setPartnershipForm({
                        ...partnershipForm,
                        bpom: { ...partnershipForm.bpom, title: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Deskripsi</label>
                    <textarea
                      value={partnershipForm.bpom.description}
                      onChange={(e) => setPartnershipForm({
                        ...partnershipForm,
                        bpom: { ...partnershipForm.bpom, description: e.target.value }
                      })}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Fitur</label>
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
                          className="flex-1 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                        />
                        <button
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
                      onClick={() => {
                        setPartnershipForm({
                          ...partnershipForm,
                          bpom: { 
                            ...partnershipForm.bpom, 
                            features: [...partnershipForm.bpom.features, ''] 
                          }
                        })
                      }}
                      className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                    >
                      <Icon name="plus" className="w-3 h-3" /> Tambah Fitur
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xl font-semibold text-white">{partnership.bpom.title}</h4>
                  <p className="text-white/55 text-sm leading-relaxed">{partnership.bpom.description}</p>
                  <div className="space-y-3">
                    {partnership.bpom.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-4 p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon name="check" className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                          <p className="text-white/85 text-sm font-medium">{feature}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ TAB 2: GALERI DOKUMENTASI ============ */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-white/40">{gallery.length} item galeri</p>
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
                    <Icon name="image" className="w-12 h-12 text-white/20 group-hover:text-white/40 transition-colors" />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-xs font-medium text-amber-300">
                      {item.category}
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-display font-semibold text-white text-base group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-white/40 text-xs mt-1 flex items-center gap-1">
                      <Icon name="mapPin" className="w-3 h-3" /> {item.location}
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

        {/* ============ TAB 3: ARTIKEL EDUKASI ============ */}
        {activeTab === 'articles' && (
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] overflow-hidden">
            <div className="p-4 border-b border-white/[0.05]">
              <p className="text-sm text-white/40">
                Data artikel diambil dari halaman <span className="text-cyan-400">Materi Edukasi</span>. 
                Kelola artikel di menu tersebut.
              </p>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                    <th className="text-left px-6 py-4 text-xs text-white/35 uppercase tracking-wider font-medium">Judul</th>
                    <th className="text-left px-6 py-4 text-xs text-white/35 uppercase tracking-wider font-medium">Kategori</th>
                    <th className="text-left px-6 py-4 text-xs text-white/35 uppercase tracking-wider font-medium">Status</th>
                    <th className="text-left px-6 py-4 text-xs text-white/35 uppercase tracking-wider font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <tr key={article.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-white/80">{article.title}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full border text-xs ${
                          article.category === 'Teknologi' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                          article.category === 'Bisnis' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                          article.category === 'Karir' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                          'text-sky-400 bg-sky-500/10 border-sky-500/20'
                        }`}>
                          {article.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full border text-xs flex items-center gap-1.5 w-fit ${
                          article.status === 'Published'
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${article.status === 'Published' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          {article.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => window.location.href = '/dashboard/articles'}
                          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          Kelola di sini →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ============ GALLERY MODAL ============ */}
      {isGalleryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setIsGalleryModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-white">
                {editingGalleryItem ? 'Edit Galeri' : 'Tambah Galeri'}
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
                <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Judul</label>
                <input
                  type="text"
                  value={galleryForm.title || ''}
                  onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                  placeholder="Masukkan judul..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Lokasi</label>
                <input
                  type="text"
                  value={galleryForm.location || ''}
                  onChange={(e) => setGalleryForm({ ...galleryForm, location: e.target.value })}
                  placeholder="Masukkan lokasi..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Kategori</label>
                <input
                  type="text"
                  value={galleryForm.category || ''}
                  onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                  placeholder="Contoh: Summit 2026, Workshop, dll"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Skema Warna</label>
                <div className="grid grid-cols-5 gap-2">
                  {gradientOptions.slice(0, 10).map((gradient, index) => (
                    <button
                      key={index}
                      onClick={() => setGalleryForm({ ...galleryForm, gradient })}
                      className={`w-full aspect-square rounded-lg border-2 transition-all ${
                        galleryForm.gradient === gradient
                          ? 'border-cyan-400'
                          : 'border-transparent hover:border-white/20'
                      }`}
                      style={{ background: `linear-gradient(to bottom right, ${gradient.replace(/\/\d+\)/g, ')')})` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-white/[0.06]">
              <button
                onClick={() => setIsGalleryModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 hover:text-white transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleGallerySave}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25"
              >
                {editingGalleryItem ? 'Perbarui' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ GALLERY DELETE CONFIRMATION ============ */}
      {isDeleteGalleryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setIsDeleteGalleryModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Icon name="alertCircle" className="w-8 h-8 text-rose-400" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">Hapus Galeri</h3>
              <p className="text-sm text-white/50 mb-6">
                Apakah Anda yakin ingin menghapus item galeri ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setIsDeleteGalleryModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 hover:text-white transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={confirmGalleryDelete}
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