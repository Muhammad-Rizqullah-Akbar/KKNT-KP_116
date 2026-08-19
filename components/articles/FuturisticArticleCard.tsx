'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'
import type { ArticleData } from '@/lib/firebase/repositories/articles.repo'

interface FuturisticArticleCardProps {
  article: ArticleData
  index: number
}

const CATEGORY_STYLES: Record<string, { badge: string; glow: string; border: string; icon: string }> = {
  'Keamanan Pangan': {
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    glow: 'from-emerald-500/20 to-teal-500/10',
    border: 'group-hover:border-emerald-500/50',
    icon: 'shieldCheck',
  },
  Teknologi: {
    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    glow: 'from-cyan-500/20 to-blue-500/10',
    border: 'group-hover:border-cyan-500/50',
    icon: 'cpu',
  },
  Regulasi: {
    badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    glow: 'from-purple-500/20 to-indigo-500/10',
    border: 'group-hover:border-purple-500/50',
    icon: 'fileText',
  },
  'Tips & Trik': {
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    glow: 'from-amber-500/20 to-orange-500/10',
    border: 'group-hover:border-amber-500/50',
    icon: 'sparkles',
  },
  Berita: {
    badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    glow: 'from-rose-500/20 to-pink-500/10',
    border: 'group-hover:border-rose-500/50',
    icon: 'bell',
  },
  Edukasi: {
    badge: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
    glow: 'from-sky-500/20 to-teal-500/10',
    border: 'group-hover:border-sky-500/50',
    icon: 'bookOpen',
  },
}

export function FuturisticArticleCard({ article, index }: FuturisticArticleCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  // 3D Mouse Tilt State
  const [rotX, setRotX] = useState(0)
  const [rotY, setRotY] = useState(0)
  const [shinePos, setShinePos] = useState({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)

  // IntersectionObserver Fallback for non-CSS scroll timeline browsers
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // If browser lacks CSS scroll-timeline support, fall back smoothly with IntersectionObserver
    if (!CSS.supports || !CSS.supports('(animation-timeline: view()) and (animation-range: entry)')) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsVisible(entry.isIntersecting)
        },
        { threshold: 0.15 }
      )
      if (cardRef.current) observer.observe(cardRef.current)
      return () => observer.disconnect()
    } else {
      setIsVisible(true)
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = ((y - centerY) / centerY) * -8
    const rotateY = ((x - centerX) / centerX) * 8

    setRotX(rotateX)
    setRotY(rotateY)
    setShinePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    })
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setRotX(0)
    setRotY(0)
  }

  const categoryStyle = CATEGORY_STYLES[article.category] || CATEGORY_STYLES['Edukasi']
  const formattedViews = article.views >= 1000 ? `${(article.views / 1000).toFixed(1)}K` : (article.views || 0).toString()
  const formattedDate = article.date
    ? new Date(article.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Terbaru'

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovered ? 'transform 0.15s ease-out' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
      className={`group relative rounded-3xl bg-slate-950/70 border border-slate-800/80 ${categoryStyle.border} shadow-2xl transition-all duration-500 overflow-hidden flex flex-col justify-between futuristic-scroll-card ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'
      }`}
    >
      {/* Dynamic Holographic Foil Overlay */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-300 opacity-60"
          style={{
            background: `radial-gradient(600px circle at ${shinePos.x}% ${shinePos.y}%, rgba(56, 189, 248, 0.15), rgba(168, 85, 247, 0.1) 40%, transparent 80%)`,
          }}
        />
      )}

      {/* Cyber Corner Laser Notch Accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-xl z-20 pointer-events-none group-hover:border-cyan-400 group-hover:scale-110 transition-all" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-500/40 rounded-tr-xl z-20 pointer-events-none group-hover:border-cyan-400 group-hover:scale-110 transition-all" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-500/40 rounded-bl-xl z-20 pointer-events-none group-hover:border-cyan-400 group-hover:scale-110 transition-all" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-500/40 rounded-br-xl z-20 pointer-events-none group-hover:border-cyan-400 group-hover:scale-110 transition-all" />

      <Link href={`/articles/${article.slug}`} className="block flex-1 flex flex-col justify-between">
        <div>
          {/* IMAGE BANNER CONTAINER WITH HUD SCANNER OVERLAY */}
          <div className="relative h-52 w-full overflow-hidden bg-slate-900">
            {article.featuredImage ? (
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${categoryStyle.glow} flex items-center justify-center relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                <Icon
                  name={categoryStyle.icon as any}
                  className="w-16 h-16 text-cyan-400/30 group-hover:text-cyan-300/60 group-hover:scale-110 transition-all duration-500"
                />
              </div>
            )}

            {/* Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* Top Bar Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                ART-0{index + 1}
              </span>

              <span
                className={`px-3 py-1 rounded-full backdrop-blur-md border text-xs font-bold font-mono tracking-wide ${categoryStyle.badge}`}
              >
                {article.category}
              </span>
            </div>

            {/* Bottom Bar: Distribution Code & Views Counter */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10 text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-400 flex items-center gap-1">
                  <Icon name="eye" className="w-3 h-3 text-cyan-400" />
                  {formattedViews}
                </span>

                <span className="px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-400 flex items-center gap-1">
                  <Icon name="clock" className="w-3 h-3 text-emerald-400" />
                  ~{article.readTime || 5} min
                </span>
              </div>

              {article.embeddedDistributionCode && (
                <span className="px-2 py-0.5 rounded bg-purple-950/80 backdrop-blur-md border border-purple-500/40 text-purple-300 font-bold flex items-center gap-1 shadow-lg">
                  <Icon name="sparkles" className="w-3 h-3 text-purple-400" />
                  {article.embeddedDistributionCode}
                </span>
              )}
            </div>
          </div>

          {/* BODY CONTENT */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Icon name="calendar" className="w-3.5 h-3.5 text-cyan-400" />
                {formattedDate}
              </span>
              <span className="text-slate-400 truncate max-w-[140px]">By {article.author}</span>
            </div>

            <h3 className="font-display text-base sm:text-lg font-extrabold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-300 group-hover:via-emerald-300 group-hover:to-teal-200 transition-all duration-300 leading-snug line-clamp-2">
              {article.title}
            </h3>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-2">
              {article.excerpt}
            </p>

            {/* Tags Pills */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {article.tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800/80 text-[10px] font-mono text-cyan-400/80 group-hover:text-cyan-300 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER ACTION BUTTON */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-t border-slate-800/60 flex items-center justify-between group-hover:bg-cyan-950/20 transition-colors">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Akses Materi
          </span>

          <div className="flex items-center gap-1.5 text-xs font-extrabold font-mono text-cyan-400 group-hover:translate-x-1 transition-transform">
            <span>BACA ARTIKEL</span>
            <Icon name="arrowRight" className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
          </div>
        </div>
      </Link>
    </div>
  )
}
