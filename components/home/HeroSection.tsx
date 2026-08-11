// components/home/HeroSection.tsx
'use client'

import Image from 'next/image'
import { Icon } from '@/components/ui/Icons'

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
      className="relative w-full min-h-screen flex items-center justify-center pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* ============ FULL-BLEED BACKGROUND ============ */}
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
        <div className="absolute inset-0 bg-[#06060E]/50" />

        {/* Layer 2: Soft Radial Fade In di Tengah */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-4xl h-[70%] bg-[#06060E]/70 rounded-full blur-[90px] pointer-events-none" />
        
        {/* Layer 3: Soft Gradient Top & Bottom */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#06060E]/80 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#06060E] to-transparent pointer-events-none" />
      </div>

      {/* ============ KONTEN HERO ============ */}
      <div className="relative z-20 w-full max-w-4xl mx-auto flex flex-col items-center text-center">
        
        {/* Badge Kemitraan Menyatu */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#06060E]/70 border border-white/20 mb-6 shadow-lg backdrop-blur-xs">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-cyan-300 drop-shadow">
            {heroData?.badgeText || 'Universitas Hasanuddin x BPOM RI'}
          </span>
        </div>

        {/* Judul Utama */}
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] mb-6 text-white">
          <span className="block text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]">
            {heroData?.titlePrefix || 'Mencetak Kader'}
          </span>
          <span className="block bg-gradient-to-r from-cyan-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(6,182,212,0.6)]">
            {heroData?.titleGradient || 'Keamanan Pangan'}
          </span>
          <span className="block text-white/95 text-2xl sm:text-4xl md:text-5xl font-bold mt-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]">
            {heroData?.titleSuffix || 'Wilayah Indonesia'}
          </span>
        </h1>

        {/* Deskripsi Singkat */}
        <p className="text-sm sm:text-lg md:text-xl text-white/95 max-w-2xl mx-auto mb-10 font-normal leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] px-2">
          {heroData?.description ||
            'Ekosistem terpadu yang menciptakan masyarakat sadar akan keamanan pangan melalui kolaborasi mahasiswa, teknologi, dan mitra strategis.'}
        </p>

        {/* Tombol Utama */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <button
            onClick={onOpenCodeModal}
            className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 sm:py-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-500 hover:from-cyan-400 hover:to-teal-400 shadow-[0_4px_25px_rgba(0,0,0,0.6)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] transition-all duration-300 hover:-translate-y-0.5 active:scale-98 cursor-pointer overflow-hidden border border-cyan-300/40"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            <Icon name="key" className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-100 group-hover:rotate-12 transition-transform duration-300" />
            <span className="relative z-10 tracking-wider font-display uppercase">BUKA FORMULIR</span>
            <Icon name="arrowRight" className="w-4 h-4 text-cyan-100 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>

        {/* Metrik Indikator */}
        <div className="mt-12 sm:mt-16 pt-6 border-t border-white/20 grid grid-cols-3 gap-4 sm:gap-12 w-full max-w-lg mx-auto text-center">
          <div className="flex flex-col items-center">
            <p className="text-2xl sm:text-4xl font-black font-display text-cyan-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              {heroData?.statParticipants || '70+'}
            </p>
            <p className="text-[10px] sm:text-xs text-white/90 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">Mahasiswa / Kader</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-2xl sm:text-4xl font-black font-display text-emerald-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              {heroData?.statVillages || '10'}
            </p>
            <p className="text-[10px] sm:text-xs text-white/90 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">Desa Binaan</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-2xl sm:text-4xl font-black font-display text-blue-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              {heroData?.statPartnerLabel || 'BPOM'}
            </p>
            <p className="text-[10px] sm:text-xs text-white/90 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">Mitra Resmi</p>
          </div>
        </div>

      </div>
    </header>
  )
}