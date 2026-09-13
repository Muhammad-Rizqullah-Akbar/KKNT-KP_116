'use client'

import { useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icons'
import { uploadOptimizedArticleImage } from '@/lib/infra/storage'
import { useToast } from '@/lib/hooks'
import { gradientOptions, type GalleryItem } from './settings-utils'

type GalleryModalProps = {
  editingItem: GalleryItem | null
  galleryForm: Partial<GalleryItem>
  setGalleryForm: React.Dispatch<React.SetStateAction<Partial<GalleryItem>>>
  saving: boolean
  onSave: () => void
  onClose: () => void
}

export default function GalleryModal({ editingItem, galleryForm, setGalleryForm, saving, onSave, onClose }: GalleryModalProps) {
  const [uploadingGalleryImg, setUploadingGalleryImg] = useState(false)
  const galleryFileInputRef = useRef<HTMLInputElement>(null)
  const { show } = useToast()

  const handleGalleryImageUpload = async (file: File) => {
    setUploadingGalleryImg(true)
    try {
      const res = await uploadOptimizedArticleImage(file, 'gallery')
      setGalleryForm(prev => ({ ...prev, imageUrl: res.url }))
      show(`Foto galeri terkompresi (${res.savedPercent}% hemat storage)!`)
    } catch (error: any) {
      alert('Gagal mengunggah foto galeri: ' + error.message)
    } finally {
      setUploadingGalleryImg(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h3 className="font-display text-lg font-semibold text-white">
            {editingItem ? 'Edit Dokumentasi' : 'Tambah Dokumentasi Baru'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center transition-colors"
          >
            <Icon name="x" className="w-5 h-5 text-white/50" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Judul Acara / Kegiatan</label>
            <input
              type="text"
              value={galleryForm.title || ''}
              onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
              placeholder="Contoh: Penyuluhan Pangan Desa Bontoatu"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Lokasi</label>
              <input
                type="text"
                value={galleryForm.location || ''}
                onChange={(e) => setGalleryForm({ ...galleryForm, location: e.target.value })}
                placeholder="Contoh: Desa Bontoatu, Makassar"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Kategori</label>
              <input
                type="text"
                value={galleryForm.category || ''}
                onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                placeholder="Contoh: Sosialisasi, Workshop"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Upload Foto Asli / Pilihan Gradient Fallback */}
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Foto Kegiatan Asli</label>
            <input
              ref={galleryFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleGalleryImageUpload(file)
              }}
            />
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={galleryForm.imageUrl || ''}
                onChange={(e) => setGalleryForm({ ...galleryForm, imageUrl: e.target.value })}
                placeholder="URL foto atau klik upload"
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-xs focus:outline-none"
              />
              <button
                type="button"
                disabled={uploadingGalleryImg}
                onClick={() => galleryFileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 text-xs font-medium hover:bg-cyan-600/30 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                {uploadingGalleryImg ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="upload" className="w-4 h-4" />}
                <span>{uploadingGalleryImg ? 'Uploading...' : 'Upload Foto'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider block mb-2">Aksen Warna (Fallback tanpa foto)</label>
            <div className="grid grid-cols-4 gap-2">
              {gradientOptions.map((gradient, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setGalleryForm({ ...galleryForm, gradient })}
                  className={`h-10 rounded-xl border-2 transition-all ${
                    galleryForm.gradient === gradient ? 'border-cyan-400 scale-105' : 'border-transparent hover:border-white/20'
                  }`}
                  style={{ background: `linear-gradient(to bottom right, ${gradient.replace(/from-|via-|to-/g, '')})` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 hover:text-white"
          >
            Batal
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white shadow-lg shadow-cyan-600/25 flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="save" className="w-4 h-4" />}
            {editingItem ? 'Perbarui' : 'Tambah'}
          </button>
        </div>
      </div>
    </div>
  )
}
