'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Icon } from '@/components/ui/Icons'

interface Article {
  id: string | number
  title: string
  slug: string
  excerpt: string
  category: string
  author: string
  date: string
  readTime: number
  gradient?: string
  icon?: string
  iconColor?: string
  image?: string | null
  featuredImage?: string | null
  views?: number
  embeddedDistributionCode?: string
}

interface ArticleCardProps {
  article: Article
  onClick: (article: Article) => void
  categoryBadgeColors: Record<string, string>
  index?: number
}

const CATEGORY_ACCENTS: Record<string, { badge: string; border: string; glow: string; textGrad: string }> = {
  'Keamanan Pangan': {
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20',
    border: 'border-emerald-500/30 hover:border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:shadow-[0_0_35px_rgba(16,185,129,0.35)]',
    glow: 'from-emerald-500/25 via-teal-500/15 to-transparent',
    textGrad: 'group-hover:from-emerald-300 group-hover:via-teal-200 group-hover:to-cyan-200',
  },
  Teknologi: {
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-500/20',
    border: 'border-cyan-500/30 hover:border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.15)] hover:shadow-[0_0_35px_rgba(6,182,212,0.35)]',
    glow: 'from-cyan-500/25 via-blue-500/15 to-transparent',
    textGrad: 'group-hover:from-cyan-300 group-hover:via-sky-200 group-hover:to-teal-200',
  },
  Regulasi: {
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-purple-500/20',
    border: 'border-purple-500/30 hover:border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.15)] hover:shadow-[0_0_35px_rgba(168,85,247,0.35)]',
    glow: 'from-purple-500/25 via-violet-500/15 to-transparent',
    textGrad: 'group-hover:from-purple-300 group-hover:via-fuchsia-200 group-hover:to-pink-200',
  },
  'Tips & Trik': {
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/20',
    border: 'border-amber-500/30 hover:border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.15)] hover:shadow-[0_0_35px_rgba(245,158,11,0.35)]',
    glow: 'from-amber-500/25 via-orange-500/15 to-transparent',
    textGrad: 'group-hover:from-amber-300 group-hover:via-yellow-200 group-hover:to-orange-200',
  },
  Berita: {
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-500/20',
    border: 'border-rose-500/30 hover:border-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.15)] hover:shadow-[0_0_35px_rgba(244,63,94,0.35)]',
    glow: 'from-rose-500/25 via-pink-500/15 to-transparent',
    textGrad: 'group-hover:from-rose-300 group-hover:via-orange-200 group-hover:to-amber-200',
  },
  Edukasi: {
    badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-teal-500/20',
    border: 'border-teal-500/30 hover:border-teal-400 shadow-[0_0_25px_rgba(20,184,166,0.15)] hover:shadow-[0_0_35px_rgba(20,184,166,0.35)]',
    glow: 'from-teal-500/25 via-cyan-500/15 to-transparent',
    textGrad: 'group-hover:from-teal-300 group-hover:via-emerald-200 group-hover:to-cyan-200',
  },
}

export function ArticleCard({ article, onClick, categoryBadgeColors, index = 0 }: ArticleCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotX, setRotX] = useState(0)
  const [rotY, setRotY] = useState(0)
  const [shinePos, setShinePos] = useState({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const displayImage = article.image || article.featuredImage || null
  const accent = CATEGORY_ACCENTS[article.category] || CATEGORY_ACCENTS['Edukasi']

  useEffect(() => {
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

  const formattedViews = (article.views || 0) >= 1000 ? `${((article.views || 0) / 1000).toFixed(1)}K` : (article.views || 0).toString()

  return (
    <div
      ref={cardRef}
      onClick={() => onClick(article)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.025, 1.025, 1.025)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovered ? 'transform 0.12s ease-out' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
      className={`group cursor-pointer relative rounded-3xl bg-slate-950/85 backdrop-blur-2xl ${accent.border} transition-all duration-500 overflow-hidden flex flex-col justify-between futuristic-scroll-card ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
      }`}
    >
      {/* Holographic Spotlight Shader */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-300 opacity-70"
          style={{
            background: `radial-gradient(550px circle at ${shinePos.x}% ${shinePos.y}%, rgba(56, 189, 248, 0.2), rgba(16, 185, 129, 0.12) 40%, transparent 80%)`,
          }}
        />
      )}

      {/* Cyber Laser Corner Notch Accents */}
      <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-400/60 rounded-tl-xl z-20 pointer-events-none group-hover:border-cyan-300 group-hover:scale-125 transition-all" />
      <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-400/60 rounded-tr-xl z-20 pointer-events-none group-hover:border-cyan-300 group-hover:scale-125 transition-all" />
      <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-400/60 rounded-bl-xl z-20 pointer-events-none group-hover:border-cyan-300 group-hover:scale-125 transition-all" />
      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-400/60 rounded-br-xl z-20 pointer-events-none group-hover:border-cyan-300 group-hover:scale-125 transition-all" />

      <div>
        {/* HERO IMAGE CONTAINER WITH HUD OVERLAY */}
        <div className="relative h-50 w-full overflow-hidden bg-slate-900">
          {displayImage ? (
            <img
              src={displayImage}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${article.gradient || 'from-emerald-700/40 via-teal-800/30 to-slate-900'} flex items-center justify-center relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
              <Icon
                name={(article.icon as any) || 'fileText'}
                className={`w-16 h-16 ${article.iconColor || 'text-emerald-400'} opacity-40 group-hover:opacity-80 group-hover:scale-110 transition-all duration-500`}
              />
            </div>
          )}

          {/* Gradient Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

          {/* Top Bar Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-slate-950/90 backdrop-blur-md border border-slate-700 text-slate-200 shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              HUB-0{index + 1}
            </span>

            <span className={`px-3 py-1 rounded-full backdrop-blur-md border text-xs font-extrabold font-mono tracking-wide shadow-md ${accent.badge}`}>
              {article.category}
            </span>
          </div>

          {/* Bottom Bar Metrics */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10 text-[11px] font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-700 text-slate-200 font-bold flex items-center gap-1">
              <Icon name="eye" className="w-3.5 h-3.5 text-cyan-400" />
              {formattedViews} Views
            </span>

            <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-700 text-slate-200 font-bold flex items-center gap-1">
              <Icon name="clock" className="w-3.5 h-3.5 text-emerald-400" />
              ~{article.readTime || 5} min
            </span>
          </div>
        </div>

        {/* BODY CONTENT - BRIGHT HIGH CONTRAST TYPOGRAPHY */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Icon name="calendar" className="w-3.5 h-3.5 text-emerald-400" />
              {article.date}
            </span>
            <span className="text-cyan-300 truncate max-w-[140px] font-mono">By {article.author || 'KKPD'}</span>
          </div>

          <h3 className={`font-display text-base font-extrabold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r ${accent.textGrad} transition-all duration-300 leading-snug line-clamp-2`}>
            {article.title}
          </h3>

          {/* Crystal Clear Excerpt */}
          <p className="text-slate-300 text-xs leading-relaxed line-clamp-2 font-sans font-medium">
            {article.excerpt}
          </p>
        </div>
      </div>

      {/* FOOTER ACTION BAR */}
      <div className="px-5 py-3.5 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between group-hover:bg-emerald-950/40 transition-colors mt-2">
        <span className="text-[11px] font-mono font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          Buka Materi
        </span>

        <div className="flex items-center gap-1.5 text-xs font-extrabold font-mono text-cyan-300 group-hover:text-cyan-200 group-hover:translate-x-1 transition-transform">
          <span>BACA MATERI</span>
          <Icon name="arrowUpRight" className="w-4 h-4 text-cyan-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </div>
  )
}