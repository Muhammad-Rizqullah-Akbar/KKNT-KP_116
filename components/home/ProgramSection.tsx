'use client'

import { Icon } from '@/components/ui/Icons'

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
  return (
    <section id="program" className="relative w-full max-w-6xl mx-auto overflow-hidden rounded-3xl bg-[#080812] bg-grid-pattern mb-8 sm:mb-12 scroll-mt-24 px-4 sm:px-6 lg:px-8">
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-cyan-500/12 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/6 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-scanlines pointer-events-none z-10 opacity-40" />

      <div className="relative z-20 py-10 sm:py-14 lg:py-16">
        <div className="text-center mb-12 lg:mb-16">
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

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0">
          {/* KKN Card */}
          <div className="relative group lg:pr-5 xl:pr-8">
            <div className="relative h-full rounded-2xl bg-white/[0.02] backdrop-blur-2xl glass-edge p-6 sm:p-8 lg:p-10 transition-all duration-500 hover:bg-white/[0.04] hover:-translate-y-1 border border-white/[0.05] hover:border-cyan-500/20">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 border border-cyan-400/20 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                    <Icon name="rocket" className="w-7 h-7 text-cyan-400" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-cyan-400">
                    <Icon name="zap" className="w-3 h-3" /> Flagship
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold text-white mb-3">
                  {data.kkn.title}
                </h3>
                <p className="text-white/55 leading-relaxed mb-8 text-sm sm:text-base font-light">
                  {data.kkn.description}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-cyan-500/15 transition-colors duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="users" className="w-4 h-4 text-cyan-400" />
                      <span className="text-2xl font-bold text-white font-display">{data.kkn.participants}</span>
                    </div>
                    <p className="text-xs text-white/40 uppercase">Peserta Aktif</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-teal-500/15 transition-colors duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="globe" className="w-4 h-4 text-teal-400" />
                      <span className="text-2xl font-bold text-white font-display">{data.kkn.villages}</span>
                    </div>
                    <p className="text-xs text-white/40 uppercase">Desa/Wilayah</p>
                  </div>
                </div>
                <div className="space-y-3 border-t border-white/[0.05] pt-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35 font-medium mb-3">Program Highlights</p>
                  {data.kkn.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm text-white/60">
                      <Icon name="sparkles" className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* BPOM Card */}
          <div className="relative group lg:pl-5 xl:pl-8">
            <div className="relative h-full rounded-2xl bg-white/[0.02] backdrop-blur-2xl glass-edge-accent p-6 sm:p-8 lg:p-10 transition-all duration-500 hover:bg-white/[0.04] hover:-translate-y-1 border border-white/[0.05] hover:border-violet-500/20">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-400/20 flex items-center justify-center shadow-lg shadow-violet-500/10">
                    <Icon name="gem" className="w-7 h-7 text-violet-400" />
                  </div>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold text-white mb-3">
                  {data.bpom.title}
                </h3>
                <p className="text-white/55 leading-relaxed mb-8 text-sm sm:text-base font-light">
                  {data.bpom.description}
                </p>
                <div className="space-y-4 mb-8">
                  {data.bpom.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4 p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.04] hover:border-violet-500/15 transition-colors duration-300">
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
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}