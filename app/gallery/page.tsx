'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '@/components/ui/Icons'
import { getLandingPageSettings } from '@/lib/firebase/repositories/settings.repo'

const LOGO_SRC = '/logo.png'

interface GalleryItem {
  id: string
  title: string
  caption: string
  url: string
  category: string
  author: string
  articleSlug?: string
  date?: string
  isCmsConfigured?: boolean
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeLightbox, setActiveLightbox] = useState<GalleryItem | null>(null)

  useEffect(() => {
    const fetchGalleryData = async () => {
      setLoading(true)
      try {
        const extracted: GalleryItem[] = []

        // Load Official CMS Setting Gallery items configured via /dashboard/settings
        const settings = await getLandingPageSettings()
        if (settings && settings.gallery && settings.gallery.length > 0) {
          settings.gallery.forEach((g: any, idx: number) => {
            if (g.imageUrl || g.title) {
              extracted.push({
                id: `cms_setting_${g.id || idx}`,
                title: g.title || 'Dokumentasi Lapangan BPOM',
                caption: g.location || g.title || 'Dokumentasi Kegiatan Lapangan & Higiene Pangan',
                url: g.imageUrl || 'https://images.unsplash.com/photo-1576867757603-05b134ebc379?auto=format&fit=crop&w=1200&q=80',
                category: g.category || 'Dokumentasi Lapangan',
                author: 'Tim Pendamping BPOM',
              })
            }
          })
        }

        // Fallback default sample images if no gallery items exist yet
        if (extracted.length === 0) {
          extracted.push(
            {
              id: 'def_1',
              title: 'Pendampingan Sanitasi Pangan IRTP oleh Kader Lapangan',
              caption: 'Kader pendamping BPOM melakukan inspeksi kebersihan dan higiene sanitasi sarana produksi pangan.',
              url: 'https://images.unsplash.com/photo-1576867757603-05b134ebc379?auto=format&fit=crop&w=1200&q=80',
              category: 'Pendampingan Lapangan',
              author: 'Kader Edukator BPOM',
              isCmsConfigured: true
            },
            {
              id: 'def_2',
              title: 'Sosialisasi Lima Kunci Keamanan Pangan Usaha Kuliner',
              caption: 'Penyuluhan berkala kepada pelaku usaha mengenai pengelolaan suhu dan kebersihan peralatan.',
              url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
              category: 'Edukasi BPOM',
              author: 'Tim Mitra Kampus UH',
              isCmsConfigured: true
            }
          )
        }

        setItems(extracted)
      } catch (err) {
        console.error('Failed to load integrated gallery items:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchGalleryData()
  }, [])

  const categories = useMemo(() => {
    return ['Semua', ...Array.from(new Set(items.map(i => i.category)))]
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory
      const matchSearch = !searchTerm.trim() || 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author.toLowerCase().includes(searchTerm.toLowerCase())
      return matchCat && matchSearch
    })
  }, [items, selectedCategory, searchTerm])

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

          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-white/70 hover:text-white transition-colors flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <Icon name="arrowLeft" className="w-4 h-4" /> Beranda
            </Link>
          </div>
        </div>
      </nav>

      {/* ====== HERO BANNER ====== */}
      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] mb-4 backdrop-blur-sm shadow-inner">
            <Icon name="image" className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold tracking-widest uppercase text-amber-400/90">Dokumentasi Lapangan & Visual Edukasi</span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-white mb-4">
            Galeri Dokumentasi <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-amber-400 bg-clip-text text-transparent">Kegiatan</span>
          </h1>
          <p className="text-white/50 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Kumpulan dokumentasi foto kegiatan pendampingan kader, infografis keamanan pangan, serta momen edukasi masyarakat terintegrasi.
          </p>
        </div>

        {/* ====== SEARCH & FILTER CONTROL BAR ====== */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8 bg-[#080812] border border-white/[0.06] p-3 rounded-2xl shadow-xl">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Cari dokumentasi foto, judul, atau kader..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-md font-bold'
                    : 'text-white/40 hover:text-white/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ====== GALLERY GRID ====== */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-72 rounded-3xl bg-white/[0.02] border border-white/[0.05] animate-pulse p-4 space-y-4">
                <div className="w-full h-44 bg-white/5 rounded-2xl" />
                <div className="h-4 w-1/3 bg-white/5 rounded" />
                <div className="h-5 w-3/4 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-[#080812] border border-white/[0.05]">
            <Icon name="image" className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <h3 className="text-white/60 text-lg font-semibold">Tidak ada foto dokumentasi ditemukan</h3>
            <p className="text-white/30 text-sm mt-1 max-w-sm mx-auto">
              Coba gunakan kata kunci pencarian yang berbeda atau pilih kategori lain.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveLightbox(item)}
                className="group cursor-pointer relative rounded-3xl bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] hover:border-amber-500/40 transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col justify-between shadow-xl"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06060E] via-transparent to-transparent opacity-85" />
                  
                  {/* Category Pill */}
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-500/30 text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                    {item.category}
                  </div>

                  {/* Expand Lightbox Icon */}
                  <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icon name="maximize" className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-5 space-y-1.5">
                  <h3 className="font-display text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                    {item.caption}
                  </p>
                </div>

                <div className="px-5 pb-4 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-white/40">
                  <span className="truncate max-w-[160px] font-mono">👤 {item.author}</span>
                  <span className="text-amber-400 font-bold group-hover:underline flex items-center gap-1">
                    Pratinjau Foto →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ====== 🖼️ LIGHTBOX MODAL ====== */}
      {activeLightbox && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl" onClick={() => setActiveLightbox(null)}>
          <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase font-mono">
                  {activeLightbox.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">Penulis: {activeLightbox.author}</span>
              </div>

              <button onClick={() => setActiveLightbox(null)} className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white transition-colors">
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>

            <div className="relative max-h-[60vh] w-full overflow-hidden rounded-2xl bg-black flex items-center justify-center">
              <img src={activeLightbox.url} alt={activeLightbox.title} className="max-h-[60vh] w-auto object-contain rounded-xl" />
            </div>

            <div className="space-y-1.5 pt-2">
              <h3 className="text-lg font-bold text-amber-300 font-display">{activeLightbox.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{activeLightbox.caption}</p>
            </div>
          </div>
        </div>
      )}

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