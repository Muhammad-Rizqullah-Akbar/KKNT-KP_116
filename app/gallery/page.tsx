'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'

const galleryData = [
  { id: 1, title: 'Keynote: Masa Depan AI', location: 'Jakarta Convention Center', category: 'Summit 2026', gradient: 'from-amber-700/40 via-orange-800/30 to-rose-900/40' },
  { id: 2, title: 'UI/UX Masterclass', location: 'Bandung Creative Hub', category: 'Workshop', gradient: 'from-violet-700/40 via-purple-800/30 to-indigo-900/40' },
  { id: 3, title: 'Tech Expo 2026', location: 'Surabaya Grand Hall', category: 'Pameran', gradient: 'from-cyan-700/40 via-teal-800/30 to-emerald-900/40' },
  { id: 4, title: 'Innovation Award Night', location: 'Bali Nusa Dua', category: 'Award', gradient: 'from-rose-700/40 via-pink-800/30 to-fuchsia-900/40' },
  { id: 5, title: '48-Hour Code Sprint', location: 'Yogyakarta Digital Valley', category: 'Hackathon', gradient: 'from-lime-700/40 via-green-800/30 to-teal-900/40' },
  { id: 6, title: 'Startup Founder Meetup', location: 'Semarang Creative Space', category: 'Meetup', gradient: 'from-sky-700/40 via-blue-800/30 to-cyan-900/40' },
  { id: 7, title: 'Women in Tech Talks', location: 'Medan Innovation Center', category: 'Talkshow', gradient: 'from-fuchsia-700/40 via-purple-800/30 to-violet-900/40' },
  { id: 8, title: 'Grand Closing Gala', location: 'Makassar Waterfront', category: 'Closing', gradient: 'from-orange-700/40 via-amber-800/30 to-yellow-900/40' },
  { id: 9, title: 'AI Summit 2026', location: 'Jakarta Convention Center', category: 'Summit', gradient: 'from-cyan-700/40 via-blue-800/30 to-indigo-900/40' },
  { id: 10, title: 'Design Thinking Workshop', location: 'Bandung Creative Hub', category: 'Workshop', gradient: 'from-rose-700/40 via-pink-800/30 to-rose-900/40' },
  { id: 11, title: 'Startup Pitch Night', location: 'Surabaya Grand Hall', category: 'Pitch', gradient: 'from-emerald-700/40 via-teal-800/30 to-cyan-900/40' },
  { id: 12, title: 'Tech Awards 2026', location: 'Bali Nusa Dua', category: 'Award', gradient: 'from-amber-700/40 via-yellow-800/30 to-orange-900/40' },
]

export default function GalleryPage() {
  const [filterCategory, setFilterCategory] = useState('Semua')

  const categories = ['Semua', ...new Set(galleryData.map(item => item.category))]
  
  const filteredData = filterCategory === 'Semua' 
    ? galleryData 
    : galleryData.filter(item => item.category === filterCategory)

  return (
    <div className="min-h-screen bg-[#06060E]">
      {/* Navbar */}
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Galeri <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-amber-400 bg-clip-text text-transparent">Dokumentasi</span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Kumpulan dokumentasi kegiatan dan acara yang telah diselenggarakan
          </p>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterCategory === cat
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                  : 'bg-white/[0.03] text-white/50 hover:text-white/80 border border-white/[0.05]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredData.map((item, index) => {
            // Diagonal offset
            let offsetClass = ''
            if (index % 4 === 1) offsetClass = 'lg:translate-y-10'
            else if (index % 4 === 2) offsetClass = 'lg:translate-y-20'
            else if (index % 4 === 3) offsetClass = 'lg:translate-y-30'
            
            const mobileOffset = index % 2 === 1 ? 'sm:translate-y-8' : ''
            
            return (
              <div
                key={item.id}
                className={`group relative rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.05] hover:border-amber-500/20 transition-all duration-500 hover:-translate-y-2 shadow-lg ${offsetClass} ${mobileOffset}`}
              >
                <div className={`aspect-[4/3] bg-gradient-to-br ${item.gradient} flex items-center justify-center relative`}>
                  <Icon name="image" className="w-12 h-12 text-white/20 group-hover:text-white/40 transition-colors" />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-xs font-medium text-amber-300">
                    {item.category}
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-display font-semibold text-white text-base group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-white/40 text-xs mt-1 flex items-center gap-1">
                    <Icon name="mapPin" className="w-3 h-3" /> {item.location}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}