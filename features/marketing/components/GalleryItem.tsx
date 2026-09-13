'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'

interface GalleryItemProps {
  item: {
    id: number
    title: string
    location: string
    category: string
    gradient: string
    imageUrl?: string
  }
  index: number
}

export function GalleryItem({ item, index }: GalleryItemProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotX, setRotX] = useState(0)
  const [rotY, setRotY] = useState(0)
  const [shinePos, setShinePos] = useState({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Staggered parallax offset for masonry feel
  let offsetClass = ''
  if (index % 4 === 1) offsetClass = 'lg:translate-y-8'
  else if (index % 4 === 2) offsetClass = 'lg:translate-y-16'
  else if (index % 4 === 3) offsetClass = 'lg:translate-y-24'

  // Scroll entry reveal fallback
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

  // 3D Mouse Tilt with Holographic Spotlight
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

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.03, 1.03, 1.03)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovered ? 'transform 0.15s ease-out' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
      className={`group relative rounded-3xl bg-slate-950/85 backdrop-blur-2xl border border-amber-500/30 hover:border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.15)] hover:shadow-[0_0_35px_rgba(245,158,11,0.35)] transition-all duration-500 overflow-hidden flex flex-col justify-between futuristic-scroll-card ${offsetClass} ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
      }`}
    >
      {/* Dynamic Holographic Foil Spotlight */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-300 opacity-60"
          style={{
            background: `radial-gradient(500px circle at ${shinePos.x}% ${shinePos.y}%, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1) 40%, transparent 80%)`,
          }}
        />
      )}

      {/* Cyber Corner Laser Notch Accents */}
      <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-400/60 rounded-tl-xl z-20 pointer-events-none group-hover:border-amber-300 group-hover:scale-125 transition-all" />
      <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-400/60 rounded-tr-xl z-20 pointer-events-none group-hover:border-amber-300 group-hover:scale-125 transition-all" />
      <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-400/60 rounded-bl-xl z-20 pointer-events-none group-hover:border-amber-300 group-hover:scale-125 transition-all" />
      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-400/60 rounded-br-xl z-20 pointer-events-none group-hover:border-amber-300 group-hover:scale-125 transition-all" />

      <Link href={`/gallery`} className="block flex-1 flex flex-col justify-between">
        <div>
          {/* IMAGE CONTAINER WITH GRADIENT SCRIM */}
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${item.gradient} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                <Icon name="image" className="w-14 h-14 text-amber-400/40 group-hover:text-amber-300 group-hover:scale-110 transition-all duration-500" />
              </div>
            )}

            {/* Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

            {/* Top Bar Status Chips */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-slate-950/90 backdrop-blur-md border border-slate-700 text-slate-200 shadow-md">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                FRAME-0{index + 1}
              </span>

              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-extrabold font-mono tracking-wide shadow-md backdrop-blur-md">
                {item.category}
              </span>
            </div>
          </div>

          {/* BODY CONTENT - BRIGHT HIGH CONTRAST TYPOGRAPHY */}
          <div className="p-5 space-y-2">
            <h3 className="font-display text-base font-extrabold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-amber-300 group-hover:via-orange-200 group-hover:to-yellow-300 transition-all duration-300 leading-snug line-clamp-1">
              {item.title}
            </h3>

            <p className="text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <Icon name="mapPin" className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{item.location}</span>
            </p>
          </div>
        </div>

        {/* FOOTER ACTION BAR */}
        <div className="px-5 py-3 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between group-hover:bg-amber-950/30 transition-colors mt-2">
          <span className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            DOKUMENTASI
          </span>

          <div className="flex items-center gap-1 text-xs font-extrabold font-mono text-amber-400 group-hover:translate-x-1 transition-transform">
            <span>LIHAT</span>
            <Icon name="arrowUpRight" className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </Link>
    </div>
  )
}