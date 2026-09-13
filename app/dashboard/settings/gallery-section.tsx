'use client'

import { Icon } from '@/components/ui/Icons'
import type { GalleryItem } from './settings-utils'

type GallerySectionProps = {
  gallery: GalleryItem[]
  onAdd: () => void
  onEdit: (item: GalleryItem) => void
  onDelete: (id: number) => void
}

export default function GallerySection({ gallery, onAdd, onEdit, onDelete }: GallerySectionProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <p className="text-sm text-white/40">Total {gallery.length} item dokumentasi di halaman publik</p>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25"
        >
          <Icon name="plus" className="w-4 h-4" /> Tambah Galeri
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {gallery.map((item) => (
          <div key={item.id} className="group relative rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.05] hover:border-cyan-500/20 transition-all">
            <div className={`aspect-[4/3] bg-gradient-to-br ${item.gradient} flex items-center justify-center relative`}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <Icon name="image" className="w-12 h-12 text-white/20 group-hover:text-white/40 transition-colors" />
              )}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-xs font-medium text-amber-300">
                {item.category}
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-display font-semibold text-white text-base group-hover:text-cyan-300 transition-colors truncate">
                {item.title}
              </h4>
              <p className="text-white/40 text-xs mt-1 flex items-center gap-1 truncate">
                <Icon name="mapPin" className="w-3 h-3 shrink-0" /> {item.location}
              </p>
            </div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(item)}
                className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 transition-colors"
              >
                <Icon name="pencil" className="w-3.5 h-3.5 text-white" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="p-1.5 rounded-lg bg-black/60 hover:bg-red-500/60 transition-colors"
              >
                <Icon name="trash" className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
