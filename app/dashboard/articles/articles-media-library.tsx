'use client'

import { Dispatch, SetStateAction } from 'react'
import { Icon } from '@/components/ui/Icons'
import type { MediaItem } from './articles-types'

type ArticlesMediaLibraryProps = {
  isOpen: boolean
  setIsMediaLibraryOpen: Dispatch<SetStateAction<boolean>>
  mediaList: MediaItem[]
  loadingMedia: boolean
  uploadingImage: boolean
  onSelectMediaCallback: ((url: string) => void) | null
  handleFileUpload: (file: File) => Promise<string>
}

export default function ArticlesMediaLibrary({
  isOpen,
  setIsMediaLibraryOpen,
  mediaList,
  loadingMedia,
  uploadingImage,
  onSelectMediaCallback,
  handleFileUpload,
}: ArticlesMediaLibraryProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setIsMediaLibraryOpen(false)}>
      <div className="relative w-full max-w-3xl bg-[#0e0e1a] border border-white/10 rounded-2xl p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Icon name="image" className="w-5 h-5 text-cyan-400" /> Galeri Storage & Media Upload
          </h3>

          <div className="flex items-center gap-2">
            <label className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-600/30 transition-all">
              <Icon name="uploadCloud" className="w-4 h-4" />
              <span>{uploadingImage ? 'Mengunggah & Kompresi...' : '+ Upload Gambar Baru'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingImage}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const url = await handleFileUpload(file)
                    if (url && onSelectMediaCallback) {
                      onSelectMediaCallback(url)
                      setIsMediaLibraryOpen(false)
                    }
                  }
                }}
              />
            </label>

            <button onClick={() => setIsMediaLibraryOpen(false)} className="p-1 rounded-lg hover:bg-white/10 text-white/50">
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
          {loadingMedia ? (
            <div className="py-16 text-center text-white/40 flex items-center justify-center gap-2 text-xs">
              <Icon name="loader" className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Memuat berkas dari Storage...</span>
            </div>
          ) : mediaList.length === 0 ? (
            <div className="py-16 text-center text-white/30 space-y-2">
              <Icon name="image" className="w-10 h-10 text-white/10 mx-auto" />
              <p className="text-sm font-semibold">Belum Ada Gambar di Storage</p>
              <p className="text-xs text-white/40">Klik "+ Upload Gambar Baru" di atas untuk menambahkan berkas terkompresi pertama Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {mediaList.map((item, index) => (
                <div
                  key={index}
                  onClick={() => {
                    if (onSelectMediaCallback) onSelectMediaCallback(item.url)
                    setIsMediaLibraryOpen(false)
                  }}
                  className="group cursor-pointer aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-cyan-400 transition-all bg-[#06060E] relative shadow-md"
                >
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2">
                    <span className="text-[11px] font-bold bg-cyan-600 text-white px-3 py-1 rounded-lg shadow-lg w-full text-center">Pilih Gambar Ini</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs">
          <span className="text-white/40">{mediaList.length} berkas tersimpan di Storage (Auto-Compressed)</span>
          <button onClick={() => setIsMediaLibraryOpen(false)} className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:text-white">Batal</button>
        </div>
      </div>
    </div>
  )
}
