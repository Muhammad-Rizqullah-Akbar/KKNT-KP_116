'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'

interface GalleryItemProps {
  item: {
    id: number
    title: string
    location: string
    category: string
    gradient: string
  }
  index: number
}

export function GalleryItem({ item, index }: GalleryItemProps) {
  let offsetClass = ''
  if (index % 4 === 1) offsetClass = 'lg:translate-y-10'
  else if (index % 4 === 2) offsetClass = 'lg:translate-y-20'
  else if (index % 4 === 3) offsetClass = 'lg:translate-y-30'
  
  const mobileOffset = index % 2 === 1 ? 'sm:translate-y-8' : ''
  
  return (
    <div
      className={`gallery-item relative group rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.05] hover:border-amber-500/20 transition-all duration-500 hover:-translate-y-2 shadow-lg ${offsetClass} ${mobileOffset}`}
    >
      <Link href={`/gallery/${item.id}`}>
        <div className={`aspect-[4/3] bg-gradient-to-br ${item.gradient} flex items-center justify-center relative`}>
          <Icon name="image" className="w-12 h-12 text-white/20 group-hover:text-white/40 transition-colors" />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-xs font-medium text-amber-300">
            {item.category}
          </div>
        </div>
        <div className="p-4">
          <h4 className="font-display font-semibold text-white text-base group-hover:text-amber-300 transition-colors">
            {item.title}
          </h4>
          <p className="text-white/40 text-xs mt-1 flex items-center gap-1">
            <Icon name="mapPin" className="w-3 h-3" /> {item.location}
          </p>
        </div>
      </Link>
    </div>
  )
}