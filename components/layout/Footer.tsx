"use client"

import React, { useState } from "react"
import { Icon } from "@/components/ui/Icons"

export function Footer() {
  const [copied, setCopied] = useState(false)
  const email = "kknkpbisappu.bontoatu@gmail.com"

  // Fungsi Salin Email ke Clipboard
  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error("Gagal menyalin email:", err)
    }
  }

  // Fungsi Smooth Scroll ke Atas
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <footer className="relative bg-slate-900 text-slate-200 pt-16 pb-8 border-t border-slate-800 overflow-hidden">
      {/* Decorative Gradient Glow Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800/80">
          
          {/* Section 1: Brand & Identity */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                Sekisah Bontoatu
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Situs resmi KKN Tematik / Posko Desa Bontoatu. Mendokumentasikan program kerja, cerita, dan pemberdayaan masyarakat.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                KKN Tematik Desa Bontoatu
              </span>
            </div>
          </div>

          {/* Section 2: Interactive Social Links */}
          <div className="md:col-span-4 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-100">
              Media Sosial & Kontak
            </h3>
            
            <div className="flex flex-col gap-3">
              {/* Instagram */}
              <a
                href="https://instagram.com/sekisah.bontoatu"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-pink-500/50 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 group-hover:scale-110 transition-transform">
                    <Icon name="instagram" className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Instagram</p>
                    <p className="text-sm font-medium text-slate-200 group-hover:text-pink-300 transition-colors">
                      @sekisah.bontoatu
                    </p>
                  </div>
                </div>
                <Icon name="externalLink" className="w-4 h-4 text-slate-500 group-hover:text-pink-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </a>

              {/* TikTok */}
              <a
                href="https://tiktok.com/@sekisah.bontoatu"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                    <Icon name="tiktok" className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">TikTok</p>
                    <p className="text-sm font-medium text-slate-200 group-hover:text-cyan-300 transition-colors">
                      @sekisah.bontoatu
                    </p>
                  </div>
                </div>
                <Icon name="externalLink" className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </a>
            </div>
          </div>

          {/* Section 3: Interactive Email Box */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-100">
              Kirim Pesan / Email
            </h3>
            
            <p className="text-xs text-slate-400">
              Ada pertanyaan atau ajakan kolaborasi? Hubungi kami langsung via email.
            </p>

            <div className="space-y-2">
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors group"
              >
                <Icon name="mail" className="w-4 h-4" />
                <span className="truncate">{email}</span>
              </a>

              {/* Button Salin Email */}
              <button
                onClick={handleCopyEmail}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-all active:scale-95"
              >
                {copied ? (
                  <>
                    <Icon name="check" className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Icon name="copy" className="w-3.5 h-3.5 text-slate-400" />
                    <span>Salin Alamat Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Bottom Bar (Copyright & Back to Top) */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="flex items-center gap-1 text-center sm:text-left">
            © {new Date().getFullYear()} Sekisah Bontoatu. Dibuat oleh @Muhammad Rizqullah Akbar Adlan ~ KKN GEL-116.
          </p>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all duration-200 group"
            aria-label="Kembali ke atas"
          >
            <span>Kembali ke atas</span>
            <Icon name="arrowUp" className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  )
}