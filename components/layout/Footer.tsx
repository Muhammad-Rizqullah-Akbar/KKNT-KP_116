'use client'

import { Icon } from '@/components/ui/Icons'

export function Footer() {
  return (
    <footer className="relative w-full max-w-6xl mx-auto mt-6 mb-4 px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-[#080812] bg-grid-pattern border border-white/[0.05] p-8 sm:p-10 lg:p-12">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-amber-500 opacity-80" />
        <div className="absolute inset-0 bg-scanlines opacity-30 pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Icon name="hexagon" className="w-6 h-6 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">KKNT-KP<span className="text-cyan-400"> UH</span></span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              Program Kuliah Kerja Nyata Tematik Keamanan Pangan Universitas Hasanuddin bekerjasama dengan BPOM.
            </p>
            <div className="flex gap-3 pt-2">
              <a href="#" className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-cyan-500/10 hover:border-cyan-400/20 transition-all">
                <Icon name="facebook" className="w-4 h-4 text-white/60" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-violet-500/10 hover:border-violet-400/20 transition-all">
                <Icon name="instagram" className="w-4 h-4 text-white/60" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-amber-500/10 hover:border-amber-400/20 transition-all">
                <Icon name="youtube" className="w-4 h-4 text-white/60" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-white/80 mb-4">Program</h4>
              <ul className="space-y-2.5">
                <li><a href="#program" className="text-sm text-white/45 hover:text-cyan-400 transition-colors">KKN Tematik</a></li>
                <li><a href="#" className="text-sm text-white/45 hover:text-cyan-400 transition-colors">Keamanan Pangan</a></li>
                <li><a href="#" className="text-sm text-white/45 hover:text-cyan-400 transition-colors">Desa Binaan</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white/80 mb-4">Tentang</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-white/45 hover:text-violet-400 transition-colors">BPOM</a></li>
                <li><a href="#" className="text-sm text-white/45 hover:text-violet-400 transition-colors">Universitas Hasanuddin</a></li>
                <li><a href="#" className="text-sm text-white/45 hover:text-violet-400 transition-colors">Kontak</a></li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white/80">Dapatkan Update</h4>
            <p className="text-white/40 text-sm">Langganan informasi terbaru seputar program KKN Tematik.</p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="email@anda.com"
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-400/40 transition-all"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-colors flex items-center gap-1"
              >
                <Icon name="send" className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="relative z-10 mt-10 pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/25">© 2026 KKNT-KP UH. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-white/25">
            <a href="#" className="hover:text-white/50 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/50 transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  )
}