'use client'

import { Dispatch, SetStateAction } from 'react'
import { Icon } from '@/components/ui/Icons'
import type { ArticleFormData } from './articles-types'

type InfoTabProps = {
  formData: ArticleFormData
  setFormData: Dispatch<SetStateAction<ArticleFormData>>
  uploadingImage: boolean
  handleFileUpload: (file: File) => Promise<string>
  openMediaLibrary: (onSelect: (url: string) => void) => void
  dbCategories: string[]
  isAddCategoryOpen: boolean
  setIsAddCategoryOpen: Dispatch<SetStateAction<boolean>>
  newCatName: string
  setNewCatName: Dispatch<SetStateAction<string>>
  handleCreateNewCategory: () => void
}

export default function ArticlesFormModalInfoTab({
  formData,
  setFormData,
  uploadingImage,
  handleFileUpload,
  openMediaLibrary,
  dbCategories,
  isAddCategoryOpen,
  setIsAddCategoryOpen,
  newCatName,
  setNewCatName,
  handleCreateNewCategory,
}: InfoTabProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="space-y-2">
        <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Judul Artikel <span className="text-rose-400">*</span></label>
        <input
          type="text"
          value={formData.title}
          onChange={e => setFormData({...formData, title: e.target.value})}
          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-cyan-400 text-sm font-semibold"
          placeholder="Masukkan judul artikel edukasi..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Subtitle / Ringkasan Excerpt</label>
        <textarea
          value={formData.excerpt}
          onChange={e => setFormData({...formData, excerpt: e.target.value})}
          rows={2}
          placeholder="Tulis ringkasan singkat artikel yang akan tampil pada kartu publik..."
          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-cyan-400 text-xs leading-relaxed resize-none"
        />
      </div>

      {/* FEATURED IMAGE UPLOADER */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
        <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
          <span>Foto Utama / Banner Artikel</span>
          <span className="text-[10px] text-white/40 font-normal">Resolusi tinggi terkompresi otomatis</span>
        </label>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={formData.featuredImage}
            onChange={e => setFormData({...formData, featuredImage: e.target.value})}
            placeholder="URL foto / klik tombol upload di kanan..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-cyan-400"
          />

          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Upload Button */}
            <label className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-md">
              <Icon name="uploadCloud" className="w-4 h-4" />
              <span>{uploadingImage ? 'Mengunggah...' : 'Upload Baru'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingImage}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const url = await handleFileUpload(file)
                    if (url) setFormData(prev => ({ ...prev, featuredImage: url }))
                  }
                }}
              />
            </label>

            {/* Select from Storage */}
            <button
              type="button"
              onClick={() => openMediaLibrary((url) => setFormData(prev => ({ ...prev, featuredImage: url })))}
              className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-semibold text-white/80 transition-all flex items-center gap-1.5"
            >
              <Icon name="image" className="w-4 h-4 text-cyan-400" />
              <span>Pilih dari Storage</span>
            </button>
          </div>
        </div>

        {/* Banner Preview */}
        {formData.featuredImage && (
          <div className="relative h-40 w-full rounded-xl overflow-hidden border border-white/10 bg-slate-950 mt-2">
            <img src={formData.featuredImage} alt="Banner Preview" className="w-full h-full object-cover" />
            <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-cyan-300 font-mono">Preview Banner Utama</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-white/70 uppercase tracking-wider block">Kategori</label>
            <button
              type="button"
              onClick={() => setIsAddCategoryOpen(!isAddCategoryOpen)}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold font-mono flex items-center gap-1"
            >
              <Icon name="plus" className="w-3 h-3" />
              <span>+ Kategori Baru</span>
            </button>
          </div>

          {isAddCategoryOpen && (
            <div className="flex items-center gap-1.5 mb-2 animate-fadeIn">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nama Kategori Baru..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-200 text-xs focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={handleCreateNewCategory}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <Icon name="x" className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white/80 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {dbCategories.map((catName) => (
              <option key={catName} value={catName} className="bg-[#0e0e1a]">
                {catName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-white/70 uppercase tracking-wider block mb-1.5">Status Publikasi</label>
          <select
            value={formData.status}
            onChange={e => setFormData({...formData, status: e.target.value as 'Draft'|'Published'})}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white/80 focus:outline-none focus:border-cyan-400"
          >
            <option value="Draft" className="bg-[#0e0e1a]">Draft (Belum Publik)</option>
            <option value="Published" className="bg-[#0e0e1a]">Published (Tampil Publik)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-white/70 uppercase tracking-wider block mb-1.5">Waktu Baca (Menit)</label>
          <input
            type="number"
            value={formData.readTime}
            onChange={e => setFormData({...formData, readTime: parseInt(e.target.value) || 1})}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-white/70 uppercase tracking-wider block mb-1.5">Nama Penulis</label>
          <input
            type="text"
            value={formData.author}
            onChange={e => setFormData({...formData, author: e.target.value})}
            placeholder="Contoh: Dr. Ir. Ahmad Sudirman..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-white/70 uppercase tracking-wider block mb-1.5">Tags (Pisahkan Koma)</label>
          <input
            type="text"
            value={formData.tags}
            onChange={e => setFormData({...formData, tags: e.target.value})}
            placeholder="Contoh: #FoodSafety, #BPOM, #KKN"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}
