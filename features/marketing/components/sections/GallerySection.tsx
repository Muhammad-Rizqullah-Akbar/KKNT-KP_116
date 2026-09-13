'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Icon } from '@/components/ui/Icons'
import { GalleryItem } from './GalleryItem'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface GallerySectionProps {
  galleryData: any[]
}

export function GallerySection({ galleryData }: GallerySectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const ctx = gsap.context(() => {
      // Header Section GSAP Scrub Timeline
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          { opacity: 0.3, y: 35, scale: 0.94, filter: 'blur(6px)' },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            ease: 'power2.out',
            scrollTrigger: {
              trigger: titleRef.current,
              start: 'top 90%',
              end: 'top 60%',
              scrub: 0.4,
            },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="galeri"
      className="relative w-full overflow-hidden bg-[#06060E] py-16 sm:py-24 border-y border-white/[0.06]"
    >
      {/* Background Grid Pattern & Glowing Ambient Spotlights */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none z-0" />
      <div className="absolute top-0 right-10 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none animate-pulse-slow z-0" />
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none animate-pulse-slow z-0"
        style={{ animationDelay: '2.5s' }}
      />
      <div className="absolute inset-0 bg-scanlines pointer-events-none z-10 opacity-20" />

      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER SECTION WITH GSAP SCRUB REVEAL */}
        <div ref={titleRef} className="text-center mb-12 sm:mb-16 space-y-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/40 backdrop-blur-md shadow-xl shadow-amber-500/10">
            <Icon name="camera" className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-mono font-extrabold tracking-widest uppercase text-amber-300">
              GALERI DOKUMENTASI RESMI
            </span>
          </div>

          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Momen <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-400 bg-clip-text text-transparent">Bersejarah</span>
          </h2>

          <p className="text-base sm:text-xl font-medium leading-relaxed text-slate-200 max-w-2xl mx-auto tracking-wide font-sans">
            Setiap frame bercerita tentang perjalanan inovasi, survei lapangan, dan kolaborasi{' '}
            <span className="bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent font-bold">
              Keamanan Pangan & KKN Tematik
            </span>.
          </p>
        </div>

        {/* DIAGONAL PARALLAX MASONRY GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6 mb-16">
          {galleryData.map((item, index) => (
            <GalleryItem key={item.id || index} item={item} index={index} />
          ))}
        </div>

        {/* EXPLORE ALL GALLERY CTA BUTTON */}
        <div className="flex justify-center mt-8">
          <Link href="/gallery">
            <button className="group/btn relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-mono font-extrabold text-xs text-slate-950 bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-xl shadow-amber-500/20 hover:shadow-amber-500/40 transition-all duration-400 hover:-translate-y-1 overflow-hidden">
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
              <span className="relative z-10 flex items-center gap-2 uppercase tracking-wider">
                <Icon name="folderOpen" className="w-4 h-4 text-slate-950" /> Lihat Semua Dokumentasi Galeri
                <Icon
                  name="arrowRight"
                  className="w-4 h-4 text-slate-950 transition-transform duration-300 group-hover/btn:translate-x-1"
                />
              </span>
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}