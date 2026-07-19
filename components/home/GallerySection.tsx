'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'
import { GalleryItem } from './GalleryItem'

interface GallerySectionProps {
  galleryData: any[]
}

export function GallerySection({ galleryData }: GallerySectionProps) {
  return (
    <section id="galeri" className="relative w-full max-w-6xl mx-auto overflow-hidden rounded-3xl bg-[#080812] bg-grid-pattern mb-8 sm:mb-12 scroll-mt-24 px-4 sm:px-6 lg:px-8">
      <div className="absolute -top-20 right-10 w-[350px] h-[350px] bg-amber-500/6 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-10 left-0 w-[350px] h-[350px] bg-indigo-500/8 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2.5s' }} />
      <div className="absolute inset-0 bg-scanlines pointer-events-none z-10 opacity-40" />

      <div className="relative z-20 py-10 sm:py-14 lg:py-16">
        <div className="text-center mb-12 lg:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] mb-5 backdrop-blur-sm">
            <Icon name="camera" className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium tracking-widest uppercase text-amber-400/90">Galeri Dokumentasi</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-4">
            Momen <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-amber-400 bg-clip-text text-transparent">Bersejarah</span>
          </h2>
          <p className="text-base sm:text-lg text-white/50 max-w-2xl mx-auto leading-relaxed font-light">
            Setiap frame bercerita tentang perjalanan inovasi dan kolaborasi yang menginspirasi.
          </p>
        </div>

        <div className="diagonal-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5 mb-12">
          {galleryData.map((item, index) => (
            <GalleryItem key={item.id} item={item} index={index} />
          ))}
        </div>

        <div className="flex justify-center">
          <Link href="/gallery">
            <button className="group/btn relative inline-flex items-center justify-center gap-3 px-10 py-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:via-orange-500 hover:to-amber-500 shadow-lg shadow-amber-600/25 hover:shadow-amber-500/40 transition-all duration-400 hover:-translate-y-0.5 overflow-hidden">
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
              <span className="relative z-10 flex items-center gap-2">
                <Icon name="folderOpen" className="w-5 h-5" /> Lihat Semua Dokumentasi
                <Icon name="arrowRight" className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </span>
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}