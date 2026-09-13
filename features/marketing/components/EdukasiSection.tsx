'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Icon } from '@/components/ui/Icons'
import { ArticleCard } from './ArticleCard'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface EdukasiSectionProps {
  articles: any[]
  isLoading?: boolean
  categoryBadgeColors: Record<string, string>
  onOpenArticleModal: (article: any) => void
}

export function EdukasiSection({
  articles,
  isLoading,
  categoryBadgeColors,
  onOpenArticleModal,
}: EdukasiSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const frontLineRef = useRef<SVGPathElement>(null)
  const backLineRef = useRef<SVGPathElement>(null)
  const circleBadgeRef = useRef<SVGCircleElement>(null)
  const checkmarkPathRef = useRef<SVGPathElement>(null)
  const vortexTargetRef = useRef<SVGGElement>(null)

  const [isMobile, setIsMobile] = useState(false)

  // On Mobile: clean 5 unique articles. On Desktop: 8 cards for horizontal pin scroll track.
  const displayArticles = isMobile
    ? articles.slice(0, 5)
    : articles.length >= 6
    ? articles
    : [...articles, ...articles, ...articles].slice(0, 8)

  useEffect(() => {
    const handleCheckMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleCheckMobile()
    window.addEventListener('resize', handleCheckMobile)
    return () => window.removeEventListener('resize', handleCheckMobile)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Mobile mode: show checkmark statically
    if (isMobile) {
      if (circleBadgeRef.current && checkmarkPathRef.current) {
        gsap.set(circleBadgeRef.current, { opacity: 1, scale: 1 })
        gsap.set(checkmarkPathRef.current, { opacity: 1, strokeDashoffset: 0 })
      }
      return
    }

    // Desktop mode: GSAP Horizontal Pinning & Travelling Neon Pulse Laser Stream
    const ctx = gsap.context(() => {
      // 1. Header Scrub Animation
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          { opacity: 0.4, y: 30, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
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

      // 2. Horizontal Card Track Shift + Travelling Laser Pulse Stream Scrub
      if (trackRef.current && sectionRef.current) {
        const getScrollWidth = () => {
          if (!trackRef.current) return 1200
          return trackRef.current.scrollWidth - window.innerWidth + 200
        }

        const mainTl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            start: 'top top',
            end: () => `+=${getScrollWidth() + 600}`,
            invalidateOnRefresh: true,
          },
        })

        // Cards Slide Horizontally Right -> Left
        mainTl.to(
          trackRef.current,
          {
            x: () => -getScrollWidth(),
            ease: 'none',
          },
          0
        )

        // 3. Travelling Laser Pulse Line (Garis lewat mengalir saat di-scroll)
        if (
          frontLineRef.current &&
          backLineRef.current &&
          circleBadgeRef.current &&
          checkmarkPathRef.current &&
          vortexTargetRef.current
        ) {
          const pathLen = frontLineRef.current.getTotalLength() || 4400
          const pulseWidth = 320 // Visible length of the laser beam pulse passing through
          const checkLen = checkmarkPathRef.current.getTotalLength() || 200

          // Configure strokeDasharray for a travelling beam pulse ("garis lewat aja")
          gsap.set([frontLineRef.current, backLineRef.current], {
            strokeDasharray: `${pulseWidth} ${pathLen}`,
            strokeDashoffset: pathLen + pulseWidth,
            opacity: 1,
          })

          gsap.set(vortexTargetRef.current, {
            rotation: 0,
            transformOrigin: '24px 24px',
          })

          gsap.set(circleBadgeRef.current, {
            opacity: 0,
            scale: 0,
            transformOrigin: 'center center',
          })

          gsap.set(checkmarkPathRef.current, {
            strokeDasharray: checkLen,
            strokeDashoffset: checkLen,
            opacity: 0,
          })

          // Step A: Laser pulse travels smoothly along track as cards slide ("garis lewat aja")
          mainTl.to(
            [frontLineRef.current, backLineRef.current],
            {
              strokeDashoffset: pulseWidth,
              ease: 'none',
              duration: 0.8,
            },
            0
          )

          // Step B: Travelling pulse arrives at target circle & rotates in a vortex (78% to 88%)
          mainTl.to(
            vortexTargetRef.current,
            {
              rotation: 360,
              duration: 0.12,
              ease: 'power2.inOut',
            },
            0.78
          )

          // Step C: Circle badge pops into view as pulse enters target
          mainTl.to(
            circleBadgeRef.current,
            {
              opacity: 1,
              scale: 1,
              duration: 0.1,
              ease: 'back.out(1.8)',
            },
            0.8
          )

          // Step D: Checkmark (✓) draws inside circle and pulse suctions inside (88% to 100%)
          mainTl.to(
            checkmarkPathRef.current,
            {
              strokeDashoffset: 0,
              opacity: 1,
              duration: 0.15,
              ease: 'power2.out',
            },
            0.85
          )

          // Final suction compound of laser pulse into checkmark
          mainTl.to(
            [frontLineRef.current, backLineRef.current],
            {
              opacity: 0,
              duration: 0.15,
              ease: 'power2.in',
            },
            0.88
          )
        }
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [isMobile, displayArticles.length])

  // Arrow Controls
  const handleScrollLeft = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const handleScrollRight = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  return (
    <section
      ref={sectionRef}
      id="edukasi"
      className={`relative w-full overflow-hidden bg-[#06060E] border-y border-white/[0.06] flex flex-col justify-between ${
        isMobile ? 'py-10 min-h-auto' : 'py-16 sm:py-20 min-h-screen'
      }`}
    >
      {/* Ambient Background Spotlights */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none z-0" />
      <div className="absolute top-0 right-0 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-emerald-500/12 rounded-full blur-[120px] sm:blur-[170px] pointer-events-none animate-pulse-slow z-0" />
      <div
        className="absolute bottom-0 left-0 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-cyan-500/10 rounded-full blur-[120px] sm:blur-[170px] pointer-events-none animate-pulse-slow z-0"
        style={{ animationDelay: '3s' }}
      />
      <div className="absolute inset-0 bg-scanlines pointer-events-none z-10 opacity-20" />

      <div className="relative z-20 w-full flex-1 flex flex-col justify-between">
        {/* HEADER SECTION */}
        <div ref={titleRef} className="text-center px-4 sm:px-6 mb-6 sm:mb-8 max-w-5xl mx-auto space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 backdrop-blur-md shadow-xl shadow-emerald-500/10">
            <Icon name="bookOpen" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-mono font-extrabold tracking-widest uppercase text-emerald-300">
              KNOWLEDGE & NEWS HUB
            </span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Pusat Edukasi <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">&</span> Wawasan
          </h2>

          <p className="text-sm sm:text-xl font-medium leading-relaxed text-slate-200 max-w-3xl mx-auto tracking-wide font-sans px-2">
            Eksplorasi wawasan, panduan praktis, serta{' '}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent font-bold">
              dokumentasi kegiatan Keamanan Pangan & KKN Tematik
            </span>{' '}
            secara transparan dan interaktif.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 px-3.5 py-1.5 rounded-full border border-cyan-500/40 shadow-md">
              <Icon name="arrowRight" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 animate-bounce-x" />
              <span>GESER UNTUK MENJELAJAHI MATERI (GARIS NEON LEWAT & TERHISAP KE CEKLIS ✓)</span>
            </div>

            {/* Arrow Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleScrollLeft}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                title="Geser Kiri"
              >
                <Icon name="chevronLeft" className="w-4 h-4" />
              </button>
              <button
                onClick={handleScrollRight}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                title="Geser Kanan"
              >
                <Icon name="chevronRight" className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* CAROUSEL TRACK & OVERFLOW WRAPPER */}
        <div className="relative w-full overflow-hidden px-4 sm:px-8">
          {/* ============ BACK TRAVELLING LASER PULSE LAYER (DESKTOP ONLY: hidden md:block) ============ */}
          <svg
            className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
            viewBox="0 0 3800 600"
            fill="none"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="backLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" opacity="0.6" />
                <stop offset="50%" stopColor="#14b8a6" opacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" opacity="0.8" />
              </linearGradient>
            </defs>

            <path
              ref={backLineRef}
              d="M 20 480 Q 200 550, 400 480 T 800 480 T 1200 480 T 1600 480 T 2000 480 T 2400 480 T 2800 480 T 3200 480 C 3450 480, 3600 350, 3674 75"
              stroke="url(#backLineGrad)"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>

          {/* ============ FRONT TRAVELLING LASER PULSE LAYER (DESKTOP ONLY: hidden md:block) ============ */}
          <svg
            className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible"
            viewBox="0 0 3800 600"
            fill="none"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="frontLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="40%" stopColor="#14b8a6" />
                <stop offset="80%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <filter id="frontNeonGlow" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Front Travelling Laser Pulse Beam ("Garis lewat aja") */}
            <path
              ref={frontLineRef}
              d="M 20 80 Q 200 10, 400 80 T 800 80 T 1200 80 T 1600 80 T 2000 80 T 2400 80 T 2800 80 T 3200 80 C 3480 80, 3620 35, 3650 55 C 3690 35, 3710 75, 3680 95 C 3650 105, 3630 65, 3674 75"
              stroke="url(#frontLineGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#frontNeonGlow)"
            />
          </svg>

          {/* HORIZONTAL CAROUSEL TRACK */}
          <div
            ref={trackRef}
            className={`relative z-10 flex items-stretch gap-4 sm:gap-6 lg:gap-8 transition-transform ease-out duration-100 py-4 sm:py-8 ${
              isMobile
                ? 'overflow-x-auto snap-x snap-mandatory scrollbar-none touch-pan-x px-2'
                : 'overflow-x-auto lg:overflow-x-visible custom-scrollbar touch-pan-x'
            }`}
          >
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-[82vw] max-w-[300px] sm:max-w-[360px] h-88 rounded-3xl bg-slate-950/80 border border-slate-800 animate-pulse p-4 space-y-4 shrink-0 snap-center"
                >
                  <div className="w-full h-44 bg-slate-900 rounded-2xl" />
                  <div className="h-4 w-1/3 bg-slate-900 rounded" />
                </div>
              ))
            ) : (
              <>
                {displayArticles.map((article, idx) => (
                  <div
                    key={`${article.id}-${idx}`}
                    className={`w-[82vw] max-w-[320px] sm:max-w-[360px] shrink-0 snap-center relative pointer-events-auto cursor-pointer ${
                      idx % 2 === 0 ? 'z-20' : 'z-5'
                    }`}
                  >
                    <ArticleCard
                      article={article}
                      onClick={onOpenArticleModal}
                      categoryBadgeColors={categoryBadgeColors}
                      index={idx}
                    />
                  </div>
                ))}

                {/* FINAL EXPLORE CTA CARD */}
                <div className="w-[85vw] max-w-[340px] sm:max-w-[440px] shrink-0 snap-center flex items-center pr-4 sm:pr-8 z-20 pointer-events-auto">
                  <div className="w-full p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 border-2 border-cyan-500/60 shadow-[0_0_55px_rgba(6,182,212,0.3)] flex flex-col justify-between space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-36 sm:w-44 h-36 sm:h-44 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-36 sm:w-44 h-36 sm:h-44 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="space-y-4 relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-lg">
                          <Icon name="sparkles" className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-300 animate-pulse" />
                        </div>

                        {/* VORTEX NEON CHECKMARK TARGET INSIDE CARD HEADER */}
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <svg className="w-12 h-12 overflow-visible" viewBox="0 0 48 48">
                            <g ref={vortexTargetRef}>
                              <circle
                                ref={circleBadgeRef}
                                cx="24"
                                cy="24"
                                r="20"
                                fill="#06060E"
                                stroke="url(#frontLineGrad)"
                                strokeWidth="3"
                                filter="url(#frontNeonGlow)"
                                className={isMobile ? 'opacity-100 scale-100' : ''}
                              />
                              <path
                                ref={checkmarkPathRef}
                                d="M 13 24 L 21 32 L 35 17"
                                stroke="url(#frontLineGrad)"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                filter="url(#frontNeonGlow)"
                                className={isMobile ? 'opacity-100' : ''}
                              />
                            </g>
                          </svg>
                        </div>
                      </div>

                      <h3 className="text-xl sm:text-3xl font-extrabold text-white leading-snug">
                        Ingin Menjelajahi Lebih Banyak Materi?
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans font-medium">
                        Temukan seluruh katalog artikel edukasi, panduan higiene sanitasi, regulasi BPOM, serta hasil survei lapangan secara lengkap.
                      </p>
                    </div>

                    <Link href="/articles" className="block pt-2 relative z-10">
                      <button className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-extrabold text-xs font-mono shadow-2xl shadow-cyan-500/30 flex items-center justify-center gap-2 transition-all group-hover:scale-102">
                        <span>EXPLORE SELURUH EDUKASI & WAWASAN</span>
                        <Icon name="arrowRight" className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* BOTTOM DIRECT LINK */}
        <div className="text-center pt-4 px-4">
          <Link href="/articles">
            <span className="text-xs font-mono font-bold text-cyan-300 hover:text-cyan-200 underline cursor-pointer">
              Atau klik di sini untuk langsung melihat daftar halaman edukasi →
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}