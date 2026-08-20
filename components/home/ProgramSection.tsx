'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Icon } from '@/components/ui/Icons'
import { AppleWordReveal } from '@/components/ui/AppleWordReveal'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface ProgramSectionProps {
  data: {
    kkn: {
      title: string
      description: string
      participants: number
      villages: number
      highlights: string[]
    }
    bpom: {
      title: string
      description: string
      features: string[]
    }
  }
}

export function ProgramSection({ data }: ProgramSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const kknRef = useRef<HTMLDivElement>(null)
  const bpomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const ctx = gsap.context(() => {
      // 1. Header Section Animation with End-to-End Scrub
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
              start: 'top 95%',
              end: 'top 50%',
              scrub: 0.4,
            },
          }
        )
      }

      // 2. KKN Left Chat Bubble GSAP Scrub Timeline (100% REVEALED BY TOP 38%)
      if (kknRef.current) {
        const kknCard = kknRef.current
        const kknHeader = kknCard.querySelectorAll('.reveal-header')
        const kknWords = kknCard.querySelectorAll('.word-reveal-token')
        const kknStats = kknCard.querySelectorAll('.reveal-stat')
        const kknHighlights = kknCard.querySelectorAll('.reveal-highlight')

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: kknCard,
            start: 'top 92%',
            end: 'top 38%', // Completed early so it is 100% revealed at user's screenshot position
            scrub: 0.4,
          },
        })

        const isMobileScreen = window.innerWidth < 768

        // Card Entry
        tl.fromTo(
          kknCard,
          { opacity: 0.3, x: isMobileScreen ? 0 : -75, y: isMobileScreen ? 25 : 0, scale: 0.88, filter: 'blur(10px)' },
          { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)', ease: 'power2.out', duration: 1 }
        )

        // Icon & Flagship Badge Pop-up
        if (kknHeader.length > 0) {
          tl.fromTo(
            kknHeader,
            { opacity: 0.3, y: 15, scale: 0.8 },
            { opacity: 1, y: 0, scale: 1, ease: 'back.out(1.7)', duration: 0.4, stagger: 0.08 },
            '-=0.75'
          )
        }

        // Title & Description Word Reveal (Bold & Lit-up Light Up)
        if (kknWords.length > 0) {
          tl.fromTo(
            kknWords,
            {
              opacity: 0.35,
              filter: 'blur(1px)',
              y: 1,
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.35)',
              textShadow: 'none',
            },
            {
              opacity: 1,
              filter: 'blur(0px)',
              y: 0,
              fontWeight: (i, el) => el.getAttribute('data-variant') === 'cyan' ? 700 : 600,
              color: (i, el) => el.getAttribute('data-variant') === 'cyan' ? '#a5f3fc' : 'rgba(255, 255, 255, 0.95)',
              textShadow: (i, el) => el.getAttribute('data-variant') === 'cyan' ? '0 0 18px rgba(6, 182, 212, 0.9)' : '0 0 12px rgba(255, 255, 255, 0.4)',
              stagger: 0.02,
              duration: 0.45,
            },
            '-=0.55'
          )
        }

        // Stat Cards Bold Slide Up
        if (kknStats.length > 0) {
          tl.fromTo(
            kknStats,
            { opacity: 0.3, y: 18, scale: 0.94, filter: 'blur(1px)' },
            { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', stagger: 0.08, duration: 0.35, ease: 'power2.out' },
            '-=0.35'
          )
        }

        // Highlights List Bold Slide Up
        if (kknHighlights.length > 0) {
          tl.fromTo(
            kknHighlights,
            { opacity: 0.3, y: 10, x: -6, filter: 'blur(1px)' },
            { opacity: 1, y: 0, x: 0, filter: 'blur(0px)', stagger: 0.06, duration: 0.35, ease: 'power2.out' },
            '-=0.25'
          )
        }
      }

      // 3. BPOM Right Chat Bubble GSAP Scrub Timeline (100% REVEALED BY TOP 38%)
      if (bpomRef.current) {
        const bpomCard = bpomRef.current
        const bpomHeader = bpomCard.querySelectorAll('.reveal-header')
        const bpomWords = bpomCard.querySelectorAll('.word-reveal-token')
        const bpomFeatures = bpomCard.querySelectorAll('.reveal-feature')

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: bpomCard,
            start: 'top 92%',
            end: 'top 38%', // Completed early so it is 100% revealed at user's screenshot position
            scrub: 0.4,
          },
        })

        const isMobileScreen = window.innerWidth < 768

        // Card Entry
        tl.fromTo(
          bpomCard,
          { opacity: 0.3, x: isMobileScreen ? 0 : 75, y: isMobileScreen ? 25 : 0, scale: 0.88, filter: 'blur(10px)' },
          { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)', ease: 'power2.out', duration: 1 }
        )

        // Icon Box Pop-up
        if (bpomHeader.length > 0) {
          tl.fromTo(
            bpomHeader,
            { opacity: 0.3, y: 15, scale: 0.8 },
            { opacity: 1, y: 0, scale: 1, ease: 'back.out(1.7)', duration: 0.4 },
            '-=0.75'
          )
        }

        // Title & Description Word Reveal (Bold & Lit-up Light Up)
        if (bpomWords.length > 0) {
          tl.fromTo(
            bpomWords,
            {
              opacity: 0.35,
              filter: 'blur(1px)',
              y: 1,
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.35)',
              textShadow: 'none',
            },
            {
              opacity: 1,
              filter: 'blur(0px)',
              y: 0,
              fontWeight: (i, el) => el.getAttribute('data-variant') === 'violet' ? 700 : 600,
              color: (i, el) => el.getAttribute('data-variant') === 'violet' ? '#ddd6fe' : 'rgba(255, 255, 255, 0.95)',
              textShadow: (i, el) => el.getAttribute('data-variant') === 'violet' ? '0 0 18px rgba(139, 92, 246, 0.9)' : '0 0 12px rgba(168, 85, 247, 0.4)',
              stagger: 0.02,
              duration: 0.45,
            },
            '-=0.55'
          )
        }

        // Feature Boxes Bold Slide Up
        if (bpomFeatures.length > 0) {
          tl.fromTo(
            bpomFeatures,
            { opacity: 0.3, y: 18, scale: 0.94, filter: 'blur(1px)' },
            { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', stagger: 0.08, duration: 0.35, ease: 'power2.out' },
            '-=0.35'
          )
        }
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="program"
      className="relative w-full max-w-5xl mx-auto scroll-mt-24 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16"
    >
      {/* Ambient background glows — subtle, no container card */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[140px] pointer-events-none animate-pulse-slow" />
      <div
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-violet-500/6 rounded-full blur-[140px] pointer-events-none animate-pulse-slow"
        style={{ animationDelay: '2s' }}
      />

      {/* Section Header */}
      <div
        ref={titleRef}
        className="text-center mb-14 lg:mb-20 opacity-30"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] mb-5 backdrop-blur-sm">
          <span className="text-xs font-medium tracking-widest uppercase text-cyan-400/90">
            Universitas Hasanuddin x Badan Pengawas Obat dan Makanan
          </span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-4">
          Program <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">&</span> Partnership
        </h2>
        <p className="text-base sm:text-lg text-white/50 max-w-2xl mx-auto leading-relaxed font-light">
          Membangun desa Pangan Aman dengan kolaborasi yang efektif
        </p>
      </div>

      {/* Chat Bubble Cards — stacked vertically */}
      <div className="relative flex flex-col gap-10 sm:gap-14 lg:gap-16">

        {/* ─── KKN Bubble (aligned LEFT) ─── */}
        <div
          ref={kknRef}
          className="self-start w-full sm:w-[88%] lg:w-[82%] opacity-30"
        >
          <div className="group relative chat-tail-left">
            <div className="relative rounded-2xl rounded-bl-sm bg-white/[0.03] backdrop-blur-xl p-6 sm:p-8 lg:p-10 transition-all duration-500 hover:bg-white/[0.05] hover:-translate-y-1 border border-white/[0.06] hover:border-cyan-500/25 shadow-[0_4px_40px_rgba(0,0,0,0.3)]">
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 rounded-2xl rounded-bl-sm bg-gradient-to-br from-cyan-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative z-10">
                {/* Header row */}
                <div className="flex items-start justify-between mb-6">
                  <div className="reveal-header w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 border border-cyan-400/20 flex items-center justify-center shadow-lg shadow-cyan-500/10 opacity-30">
                    <Icon name="rocket" className="w-7 h-7 text-cyan-400" />
                  </div>
                  <span className="reveal-header inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-cyan-400 opacity-30">
                    <Icon name="zap" className="w-3 h-3" /> Flagship
                  </span>
                </div>

                {/* Title & description with Apple-style word reveal */}
                <h3 className="font-display text-2xl sm:text-3xl font-semibold mb-3">
                  <AppleWordReveal
                    text={data.kkn.title}
                    variant="cyan"
                  />
                </h3>
                <div className="mb-8 text-sm sm:text-base font-light leading-relaxed">
                  <AppleWordReveal
                    text={data.kkn.description}
                    variant="white"
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="reveal-stat p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-cyan-500/15 transition-colors duration-300 opacity-30">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="users" className="w-4 h-4 text-cyan-400" />
                      <span className="text-2xl font-bold text-white font-display">{data.kkn.participants}</span>
                    </div>
                    <p className="text-xs text-white/40 uppercase">Peserta Aktif</p>
                  </div>
                  <div className="reveal-stat p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-teal-500/15 transition-colors duration-300 opacity-30">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="globe" className="w-4 h-4 text-teal-400" />
                      <span className="text-2xl font-bold text-white font-display">{data.kkn.villages}</span>
                    </div>
                    <p className="text-xs text-white/40 uppercase">Desa/Wilayah</p>
                  </div>
                </div>

                {/* Highlights */}
                <div className="space-y-3 border-t border-white/[0.05] pt-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35 font-medium mb-3">Program Highlights</p>
                  {data.kkn.highlights.map((highlight, index) => (
                    <div key={index} className="reveal-highlight flex items-center gap-3 text-sm text-white/60 opacity-30">
                      <Icon name="sparkles" className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <AppleWordReveal
                        text={highlight}
                        variant="white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── BPOM Bubble (aligned RIGHT) ─── */}
        <div
          ref={bpomRef}
          className="self-end w-full sm:w-[88%] lg:w-[82%] opacity-30"
        >
          <div className="group relative chat-tail-right">
            <div className="relative rounded-2xl rounded-br-sm bg-white/[0.03] backdrop-blur-xl p-6 sm:p-8 lg:p-10 transition-all duration-500 hover:bg-white/[0.05] hover:-translate-y-1 border border-white/[0.06] hover:border-violet-500/25 shadow-[0_4px_40px_rgba(0,0,0,0.3)]">
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 rounded-2xl rounded-br-sm bg-gradient-to-br from-violet-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative z-10">
                {/* Header row */}
                <div className="flex items-start justify-between mb-6">
                  <div className="reveal-header w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-400/20 flex items-center justify-center shadow-lg shadow-violet-500/10 opacity-30">
                    <Icon name="gem" className="w-7 h-7 text-violet-400" />
                  </div>
                </div>

                {/* Title & description with Apple-style word reveal */}
                <h3 className="font-display text-2xl sm:text-3xl font-semibold mb-3">
                  <AppleWordReveal
                    text={data.bpom.title}
                    variant="violet"
                  />
                </h3>
                <div className="mb-8 text-sm sm:text-base font-light leading-relaxed">
                  <AppleWordReveal
                    text={data.bpom.description}
                    variant="white"
                  />
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {data.bpom.features.map((feature, index) => (
                    <div key={index} className="reveal-feature flex items-start gap-4 p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.04] hover:border-violet-500/15 transition-colors duration-300 opacity-30">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon name="check" className="w-4 h-4 text-violet-400" />
                      </div>
                      <div className="text-white/85 text-sm font-medium">
                        <AppleWordReveal
                          text={feature}
                          variant="white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}