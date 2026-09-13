'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '@/components/ui/Icons'
import type { HeadingItem } from './article-utils'

interface ArticleNavbarProps {
  progress: number
  parsedHeadings: HeadingItem[]
  activeHeading: string
  isTocPopoverOpen: boolean
  contentLoaded: boolean
  onToggleTocPopover: () => void
  onCloseTocPopover: () => void
  onScrollToHeading: (id: string) => void
}

export function ArticleNavbar({
  progress,
  parsedHeadings,
  activeHeading,
  isTocPopoverOpen,
  contentLoaded,
  onToggleTocPopover,
  onCloseTocPopover,
  onScrollToHeading,
}: ArticleNavbarProps) {
  return (
    <nav className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 py-4 bg-[#06060E]/80 backdrop-blur-xl border-b border-white/[0.04]">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 bg-white/[0.04] border border-white/10 p-1 shadow-lg shadow-cyan-500/20">
            <Image
              src="/logo.png"
              alt="Logo KKNT-KP UH"
              width={32}
              height={32}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white">
            KKNT-KP<span className="text-cyan-400"> UH</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {/* HAMBURGER POPOVER TOC */}
          <div className="relative">
            <button
              type="button"
              onClick={onToggleTocPopover}
              className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-cyan-400 flex items-center gap-1.5 hover:bg-cyan-500/10"
            >
              <Icon name="menu" className="w-4 h-4" />
              <span className="hidden sm:inline">Daftar Isi</span>
            </button>

            {isTocPopoverOpen && (
              <div className="absolute right-0 top-12 w-72 bg-[#0e0e1a] border border-white/10 rounded-2xl shadow-2xl p-4 z-[100] animate-slideUp">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">Navigasi Artikel</span>
                  <button type="button" onClick={onCloseTocPopover} className="p-1 text-white/40 hover:text-white">
                    <Icon name="x" className="w-3.5 h-3.5" />
                  </button>
                </div>
                {parsedHeadings.length === 0 ? (
                  <p className="text-xs text-white/30 italic py-2">
                    {contentLoaded ? 'Tidak ada sub-judul di artikel ini.' : 'Konten artikel belum dimuat.'}
                  </p>
                ) : (
                  <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                    {parsedHeadings.map((heading, index) => (
                      <button
                        type="button"
                        key={`${heading.id}-${index}`}
                        onClick={() => onScrollToHeading(heading.id)}
                        className={`w-full text-left text-xs p-2 rounded-lg transition-all truncate ${
                            activeHeading === heading.id ? 'bg-cyan-500/20 text-cyan-400 font-medium' : 'text-white/70 hover:bg-white/5'
                          }`}
                      >
                          {index + 1}. {heading.text}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Link href="/" className="text-sm text-white/50 hover:text-white flex items-center gap-1.5">
            <Icon name="arrowLeft" className="w-4 h-4" /> Kembali
          </Link>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/[0.04]">
        <div id="progress-bar" className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${progress}%` }} />
      </div>
    </nav>
  )
}
