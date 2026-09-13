'use client'

import { Icon } from '@/components/ui/Icons'
import type { ArticleFormData } from './articles-types'

type GalleryTabProps = {
  formData: ArticleFormData
  handleFileUpload: (file: File) => Promise<string>
  openMediaLibrary: (onSelect: (url: string) => void) => void
  addGallerySlot: () => void
  updateGalleryUrl: (id: string, url: string) => void
  updateGalleryCaption: (id: string, caption: string) => void
  removeGalleryImage: (id: string) => void
}

export default function ArticlesFormModalGalleryTab({
  formData,
  handleFileUpload,
  openMediaLibrary,
  addGallerySlot,
  updateGalleryUrl,
  updateGalleryCaption,
  removeGalleryImage,
}: GalleryTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div>
          <h4 className="text-sm font-bold text-white">Galeri Foto Dokumentasi</h4>
          <p className="text-xs text-white/40">Kumpulan foto pendukung kegiatan atau survei lapangan</p>
        </div>
        <button type="button" onClick={addGallerySlot} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-md">
          <Icon name="plus" className="w-4 h-4" />
          <span>Tambah Foto Galeri</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {formData.gallery.map(img => (
          <div key={img.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 relative group">
            <button
              type="button"
              onClick={() => removeGalleryImage(img.id)}
              className="absolute top-3 right-3 z-10 p-1.5 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Icon name="trash" className="w-3.5 h-3.5" />
            </button>

            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-white/10 flex items-center justify-center">
              {img.url ? (
                <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-xs text-white/40">Belum Ada Foto</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={img.url || ''}
                onChange={e => updateGalleryUrl(img.id, e.target.value)}
                placeholder="URL foto..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white"
              />

              <label className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-[11px] font-bold text-white cursor-pointer shrink-0">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const url = await handleFileUpload(file)
                      if (url) updateGalleryUrl(img.id, url)
                    }
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => openMediaLibrary((url) => updateGalleryUrl(img.id, url))}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-semibold text-white/80 shrink-0"
              >
                Storage
              </button>
            </div>

            <input
              type="text"
              value={img.caption}
              onChange={e => updateGalleryCaption(img.id, e.target.value)}
              placeholder="Keterangan foto..."
              className="w-full bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-lg text-xs text-white"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
