// components/home/HeroSection.tsx
'use client'

import Image from 'next/image'
import { Icon } from '@/components/ui/Icons'
import { WordReveal } from '@/components/ui/WordReveal'

interface HeroSectionProps {
  onOpenCodeModal: () => void
  heroData?: {
    badgeText?: string
    titlePrefix?: string
    titleGradient?: string
    titleSuffix?: string
    description?: string
    bgImageUrl?: string
    statParticipants?: string
    statVillages?: string
    statPartnerLabel?: string
  }
}

export function HeroSection({ onOpenCodeModal, heroData }: HeroSectionProps) {
  // Prioritas: Gunakan URL dari Firestore jika ada, jika belum ada pakai local baseline '/background.jpg'
  const bgImageSrc = heroData?.bgImageUrl || '/background.jpg'

  return (
    <header
      id="hero"
      className="relative w-full min-h-screen flex items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* ============ FULL-BLEED BACKGROUND (PRESERVED 100%) ============ */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src={bgImageSrc}
          alt="Hero Background Desa Pangan Aman"
          fill
          priority
          sizes="100vw"
          unoptimized={bgImageSrc.startsWith('http')}
          className="object-cover object-center opacity-85 scale-100 transition-all duration-700"
        />

        {/* Layer 1: Dark Dimmer */}
        <div className="absolute inset-0 bg-[#06060E]/55" />

        {/* Layer 2: Soft Radial Fade In di Tengah */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-4xl h-[70%] bg-[#06060E]/70 rounded-full blur-[90px] pointer-events-none" />

        {/* Layer 3: Soft Gradient Top & Bottom */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#06060E]/80 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#06060E] to-transparent pointer-events-none" />
      </div>

      {/* ============ KONTEN HERO MODERN ============ */}
      <div className="relative z-20 w-full max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Cyber HUD Badge Kemitraan */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/80 border border-cyan-500/40 mb-6 shadow-xl shadow-cyan-500/10 backdrop-blur-md animate-section-fade-in"
          style={{ animationDelay: '0.1s' }}
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono font-extrabold tracking-widest uppercase text-cyan-300 drop-shadow">
            {heroData?.badgeText || 'Universitas Hasanuddin x BPOM RI'}
          </span>
        </div>

        {/* Judul Utama — Modern Typography */}
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.08] mb-6 text-white max-w-4xl">
          <span className="block drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
            <WordReveal
              text={heroData?.titlePrefix || 'Mencetak Kader'}
              wordClassName="text-white font-extrabold"
              baseDelay={0.3}
              stagger={0.08}
            />
          </span>
          <span className="block">
            <WordReveal
              text={heroData?.titleGradient || 'Keamanan Pangan'}
              wordClassName="bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent font-black drop-shadow-[0_0_40px_rgba(6,182,212,0.7)]"
              baseDelay={0.55}
              stagger={0.08}
            />
          </span>
          <span className="block text-2xl sm:text-4xl md:text-5xl font-extrabold mt-2 text-slate-100 drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
            <WordReveal
              text={heroData?.titleSuffix || 'Wilayah Indonesia'}
              wordClassName="text-slate-100"
              baseDelay={0.8}
              stagger={0.08}
            />
          </span>
        </h1>

        {/* Deskripsi Singkat — High-Contrast Modern Subtitle */}
        <div className="text-base sm:text-xl text-slate-100 max-w-2xl mx-auto mb-10 font-sans font-medium leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] px-2">
          <WordReveal
            text={heroData?.description || 'Ekosistem terpadu yang menciptakan masyarakat sadar akan keamanan pangan melalui kolaborasi mahasiswa, teknologi, dan mitra strategis.'}
            baseDelay={1.1}
            stagger={0.035}
          />
        </div>

        {/* Tombol Utama — Modern Futuristic CTA */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto animate-section-fade-in"
          style={{ animationDelay: '1.8s' }}
        >
          <button
            onClick={onOpenCodeModal}
            className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-9 py-4 rounded-2xl font-mono font-extrabold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-500/45 transition-all duration-300 hover:-translate-y-1 active:scale-98 cursor-pointer overflow-hidden border border-cyan-300/60"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            <Icon name="key" className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 group-hover:rotate-12 transition-transform duration-300" />
            <span className="relative z-10 tracking-widest uppercase">BUKA FORMULIR KUESIONER</span>
            <Icon name="arrowRight" className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>

        {/* Metrik Indikator — Futuristic Glassmorphic Pods */}
        <div className="mt-12 sm:mt-16 grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-xl mx-auto">
          <div
            className="flex flex-col items-center p-3.5 sm:p-4 rounded-2xl bg-slate-950/75 border border-slate-800/80 backdrop-blur-xl shadow-xl hover:border-cyan-500/40 transition-all group animate-section-fade-in"
            style={{ animationDelay: '2.1s' }}
          >
            <span className="text-[9px] sm:text-[10px] font-mono text-cyan-400/80 uppercase font-bold tracking-widest mb-1">
              [CADRES]
            </span>
            <p className="text-2xl sm:text-4xl font-black font-display text-cyan-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)] group-hover:scale-105 transition-transform">
              {heroData?.statParticipants || '70+'}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-300 font-bold mt-1">Mahasiswa / Kader</p>
          </div>

          <div
            className="flex flex-col items-center p-3.5 sm:p-4 rounded-2xl bg-slate-950/75 border border-slate-800/80 backdrop-blur-xl shadow-xl hover:border-emerald-500/40 transition-all group animate-section-fade-in"
            style={{ animationDelay: '2.3s' }}
          >
            <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400/80 uppercase font-bold tracking-widest mb-1">
              [VILLAGES]
            </span>
            <p className="text-2xl sm:text-4xl font-black font-display text-emerald-300 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)] group-hover:scale-105 transition-transform">
              {heroData?.statVillages || '10'}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-300 font-bold mt-1">Desa Binaan</p>
          </div>

          <div
            className="flex flex-col items-center p-3.5 sm:p-4 rounded-2xl bg-slate-950/75 border border-slate-800/80 backdrop-blur-xl shadow-xl hover:border-amber-500/40 transition-all group animate-section-fade-in"
            style={{ animationDelay: '2.5s' }}
          >
            <span className="text-[9px] sm:text-[10px] font-mono text-amber-400/80 uppercase font-bold tracking-widest mb-1">
              [PARTNER]
            </span>
            <p className="text-2xl sm:text-4xl font-black font-display text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)] group-hover:scale-105 transition-transform">
              {heroData?.statPartnerLabel || 'BPOM'}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-300 font-bold mt-1">Mitra Resmi</p>
          </div>
        </div>
      </div>
    </header>
  )
}