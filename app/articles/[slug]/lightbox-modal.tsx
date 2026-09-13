'use client'

import { Icon } from '@/components/ui/Icons'
import type { LightboxImage } from './article-utils'

interface LightboxModalProps {
  image: LightboxImage
  onClose: () => void
}

export function LightboxModal({ image, onClose }: LightboxModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
        <Icon name="x" className="w-5 h-5 text-white" />
      </button>
      <div className="max-w-4xl w-full rounded-2xl overflow-hidden bg-[#0e0e1a]" onClick={e => e.stopPropagation()}>
        <div className="w-full h-80 sm:h-96 flex items-center justify-center bg-black">
          {image.url ? (
            <img src={image.url} alt={image.caption} className="w-full h-full object-contain" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${image.gradient || 'from-cyan-700/50 to-emerald-800/50'} flex items-center justify-center`}>
              <Icon name="image" className="w-16 h-16 text-white/30" />
            </div>
          )}
        </div>
        <div className="p-4 flex justify-between items-center border-t border-white/10">
          <p className="text-sm text-white/80">{image.caption}</p>
        </div>
      </div>
    </div>
  )
}
