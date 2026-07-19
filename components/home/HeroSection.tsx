'use client'

import { Icon } from '@/components/ui/Icons'

interface HeroSectionProps {
  onOpenCodeModal: () => void
}

export function HeroSection({ onOpenCodeModal }: HeroSectionProps) {
  return (
    <header id="hero" className="relative w-full max-w-6xl mx-auto mt-4 sm:mt-8 lg:mt-12 mb-8 sm:mb-12 px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-[#080812] bg-grid-pattern min-h-[85vh] flex items-center">
        {/* Orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Scanlines */}
        <div className="absolute inset-0 bg-scanlines pointer-events-none z-10 opacity-30" />
        
        {/* Grid */}
        <div className="absolute inset-0 z-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Rotating Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/[0.03] rounded-full pointer-events-none animate-spin-slow z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-cyan-400/10 rounded-full pointer-events-none animate-spin-slow z-0" style={{ animationDirection: 'reverse', animationDuration: '25s' }} />

        {/* Floating Icons */}
        <div className="absolute top-20 right-10 lg:right-20 z-20 animate-drift">
          <Icon name="hexagon" className="w-10 h-10 text-cyan-400/30" />
        </div>
        <div className="absolute bottom-32 left-10 lg:left-20 z-20 animate-drift" style={{ animationDelay: '2s', animationDuration: '10s' }}>
          <Icon name="box" className="w-12 h-12 text-violet-400/25" />
        </div>
        <div className="absolute top-1/4 right-[15%] w-24 h-24 border border-cyan-400/10 hexagon rotate-12 opacity-30 animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-[10%] w-20 h-20 border border-violet-400/10 hexagon -rotate-6 opacity-40 animate-pulse-slow" style={{ animationDelay: '3s' }} />

        {/* Hero Content */}
        <div className="relative z-20 w-full px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] mb-6 backdrop-blur-sm">
            <span className="text-xs font-medium tracking-widest uppercase text-cyan-400/90">
              Universitas Hasanuddin x Badan Pengawas Obat dan Makanan
            </span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-6 max-w-4xl">
            <span className="block text-white">Membangun</span>
            <span className="block bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Desa Pangan Aman
            </span>
            <span className="block text-white/90">Wilayah Indonesia</span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-white/50 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            Ekosistem yang menciptakan masyarakat yang sadar keamanan pangan dengan Kolaborasi para{' '}
            <span className="text-cyan-400 font-medium">Mahasiswa</span>,{' '}
            <span className="text-violet-400 font-medium">teknologi</span>, dan{' '}
            <span className="text-amber-400 font-medium">mitra strategis</span>.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <button
              onClick={onOpenCodeModal}
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 shadow-lg shadow-cyan-600/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              <span className="relative z-10 flex items-center gap-2">
                <Icon name="key" className="w-5 h-5" /> Akses Formulir
              </span>
            </button>
          </div>

          <div className="animate-bounce mt-4">
            <Icon name="chevronDown" className="w-6 h-6 text-white/30" />
          </div>
        </div>
      </div>
    </header>
  )
}