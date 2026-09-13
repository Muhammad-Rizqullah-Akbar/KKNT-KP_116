'use client'

import { Dispatch, SetStateAction } from 'react'
import { Icon } from '@/components/ui/Icons'
import type { Article, ArticleFormData, AvailableForm } from './articles-types'

type ArticlesFormModalProps = {
  isOpen: boolean
  isEditing: boolean
  formData: ArticleFormData
  setFormData: Dispatch<SetStateAction<ArticleFormData>>
  selectedArticle: Article | null
  setSelectedArticle: Dispatch<SetStateAction<Article | null>>
  modalTab: 'info' | 'blocks' | 'gallery'
  setModalTab: Dispatch<SetStateAction<'info' | 'blocks' | 'gallery'>>
  isSavingArticle: boolean
  handleSave: (statusOverride?: 'Draft' | 'Published') => void
  handleAttemptCloseModal: () => void
  isConfirmCloseOpen: boolean
  setIsConfirmCloseOpen: Dispatch<SetStateAction<boolean>>
  handleConfirmCloseSaveDraft: () => void
  handleConfirmCloseDiscardDraft: () => void
  uploadingImage: boolean
  handleFileUpload: (file: File) => Promise<string>
  openMediaLibrary: (onSelect: (url: string) => void) => void
  dbCategories: string[]
  availableForms: AvailableForm[]
  isAddCategoryOpen: boolean
  setIsAddCategoryOpen: Dispatch<SetStateAction<boolean>>
  newCatName: string
  setNewCatName: Dispatch<SetStateAction<string>>
  handleCreateNewCategory: () => void
  addBlock: (type: 'p' | 'h2' | 'quote' | 'list' | 'image') => void
  updateBlockValue: (id: string, value: string) => void
  updateBlockAuthor: (id: string, quoteAuthor: string) => void
  updateBlockImageCaption: (id: string, imageCaption: string) => void
  removeBlock: (id: string) => void
  moveBlock: (id: string, direction: 'up' | 'down') => void
  updateGalleryUrl: (id: string, url: string) => void
  updateGalleryCaption: (id: string, caption: string) => void
  removeGalleryImage: (id: string) => void
  addGallerySlot: () => void
  setIsPreviewOpen: Dispatch<SetStateAction<boolean>>
}

export default function ArticlesFormModal({
  isOpen,
  isEditing,
  formData,
  setFormData,
  selectedArticle,
  setSelectedArticle,
  modalTab,
  setModalTab,
  isSavingArticle,
  handleSave,
  handleAttemptCloseModal,
  isConfirmCloseOpen,
  setIsConfirmCloseOpen,
  handleConfirmCloseSaveDraft,
  handleConfirmCloseDiscardDraft,
  uploadingImage,
  handleFileUpload,
  openMediaLibrary,
  dbCategories,
  availableForms,
  isAddCategoryOpen,
  setIsAddCategoryOpen,
  newCatName,
  setNewCatName,
  handleCreateNewCategory,
  addBlock,
  updateBlockValue,
  updateBlockAuthor,
  updateBlockImageCaption,
  removeBlock,
  moveBlock,
  updateGalleryUrl,
  updateGalleryCaption,
  removeGalleryImage,
  addGallerySlot,
  setIsPreviewOpen,
}: ArticlesFormModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }} onClick={handleAttemptCloseModal}>
      <div className="relative w-full max-w-4xl bg-[#0e0e1a] border border-white/[0.1] rounded-3xl shadow-2xl animate-slideUp my-auto overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Modal Header & Title */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Icon name="pencil" className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">
                {isEditing ? `Edit: ${formData.title || 'Artikel'}` : 'Buat Artikel Edukasi Baru'}
              </h3>
              <p className="text-xs text-white/40">Sistem manajemen konten terintegrasi dengan Auto-Save Draft & Live Preview</p>
            </div>
          </div>

          <button onClick={handleAttemptCloseModal} className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors">
            <Icon name="x" className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-slate-950/40 border-b border-white/[0.06]">
          <button
            type="button"
            onClick={() => setModalTab('info')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
              modalTab === 'info'
                ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                : 'border-transparent text-white/50 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Icon name="fileText" className="w-4 h-4" />
            <span>1. Info Utama & Banner</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('blocks')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
              modalTab === 'blocks'
                ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                : 'border-transparent text-white/50 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Icon name="layout" className="w-4 h-4" />
            <span>2. Blok Konten ({formData.blocks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('gallery')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
              modalTab === 'gallery'
                ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                : 'border-transparent text-white/50 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Icon name="image" className="w-4 h-4" />
            <span>3. Galeri Dokumentasi ({formData.gallery.length})</span>
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">

          {/* TAB 1: INFO UTAMA & BANNER */}
          {modalTab === 'info' && (
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
          )}

          {/* TAB 2: EDITOR BLOK KONTEN */}
          {modalTab === 'blocks' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Quick Add Block Toolbar */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-white/[0.08] flex items-center gap-2 flex-wrap justify-between">
                <span className="text-xs font-bold text-cyan-300">Tambah Elemen Konten:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button type="button" onClick={() => addBlock('p')} className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs text-white font-medium flex items-center gap-1">
                    + Paragraf
                  </button>
                  <button type="button" onClick={() => addBlock('h2')} className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-xs text-cyan-300 font-bold flex items-center gap-1">
                    + Sub-Judul H2
                  </button>
                  <button type="button" onClick={() => addBlock('quote')} className="px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-xs text-violet-300 font-medium flex items-center gap-1">
                    + Kutipan Quote
                  </button>
                  <button type="button" onClick={() => addBlock('image')} className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-xs text-amber-300 font-bold flex items-center gap-1">
                    + Gambar Infografis
                  </button>
                  <button type="button" onClick={() => addBlock('list')} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-xs text-emerald-300 font-medium flex items-center gap-1">
                    + List Poin
                  </button>
                </div>
              </div>

              {/* List of Blocks */}
              <div className="space-y-3">
                {formData.blocks.map((block, idx) => (
                  <div key={block.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 relative group">
                    <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                      <span className="text-xs font-bold font-mono text-cyan-400 uppercase">
                        #{idx + 1} Blok: {block.type.toUpperCase()}
                      </span>

                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => moveBlock(block.id, 'up')} disabled={idx === 0} className="p-1 text-white/40 hover:text-white disabled:opacity-20">
                          <Icon name="chevronUp" className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => moveBlock(block.id, 'down')} disabled={idx === formData.blocks.length - 1} className="p-1 text-white/40 hover:text-white disabled:opacity-20">
                          <Icon name="chevronDown" className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => removeBlock(block.id)} className="p-1 text-rose-400/60 hover:text-rose-400">
                          <Icon name="trash" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Render Block Type Edit Input */}
                    {block.type === 'h2' ? (
                      <input
                        type="text"
                        value={block.value}
                        onChange={e => updateBlockValue(block.id, e.target.value)}
                        placeholder="Judul bagian (H2)..."
                        className="w-full px-3.5 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 font-bold text-sm focus:outline-none"
                      />
                    ) : block.type === 'quote' ? (
                      <div className="space-y-2">
                        <textarea
                          value={block.value}
                          onChange={e => updateBlockValue(block.id, e.target.value)}
                          placeholder="Kutipan/quote penting..."
                          rows={2}
                          className="w-full px-3.5 py-2 rounded-xl bg-violet-950/30 border border-violet-500/30 text-violet-200 text-xs italic focus:outline-none"
                        />
                        <input
                          type="text"
                          value={block.quoteAuthor || ''}
                          onChange={e => updateBlockAuthor(block.id, e.target.value)}
                          placeholder="Nama sumber quote..."
                          className="w-full px-3.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/70"
                        />
                      </div>
                    ) : block.type === 'image' ? (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="text"
                            value={block.imageUrl || ''}
                            onChange={e => {
                              const val = e.target.value
                              setFormData(prev => ({
                                ...prev,
                                blocks: prev.blocks.map(item => item.id === block.id ? { ...item, imageUrl: val } : item)
                              }))
                            }}
                            placeholder="URL gambar..."
                            className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white"
                          />

                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white cursor-pointer flex items-center gap-1">
                              <Icon name="uploadCloud" className="w-3.5 h-3.5" />
                              <span>Upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    const url = await handleFileUpload(file)
                                    if (url) {
                                      setFormData(prev => ({
                                        ...prev,
                                        blocks: prev.blocks.map(item => item.id === block.id ? { ...item, imageUrl: url } : item)
                                      }))
                                    }
                                  }
                                }}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => openMediaLibrary((url) => {
                                setFormData(prev => ({
                                  ...prev,
                                  blocks: prev.blocks.map(item => item.id === block.id ? { ...item, imageUrl: url } : item)
                                }))
                              })}
                              className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white/80"
                            >
                              Pilih Storage
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={block.imageCaption || ''}
                          onChange={e => updateBlockImageCaption(block.id, e.target.value)}
                          placeholder="Keterangan gambar/figcaption..."
                          className="w-full px-3.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/70 italic"
                        />

                        {block.imageUrl && (
                          <img src={block.imageUrl} alt="Block Image Preview" className="h-32 rounded-xl object-cover border border-white/10" />
                        )}
                      </div>
                    ) : (
                      <textarea
                        value={block.value}
                        onChange={e => updateBlockValue(block.id, e.target.value)}
                        placeholder="Isi paragraf..."
                        rows={3}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/90 leading-relaxed focus:outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: GALERI DOKUMENTASI */}
          {modalTab === 'gallery' && (
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
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08] bg-slate-950/80">
          <button onClick={handleAttemptCloseModal} className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white/50 hover:bg-white/[0.05] transition-colors">
            Batal
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedArticle(selectedArticle)
                setIsPreviewOpen(true)
              }}
              className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-bold text-cyan-300 flex items-center gap-1.5"
            >
              <Icon name="eye" className="w-4 h-4" /> Live Editor Preview
            </button>
            <button
              type="button"
              disabled={isSavingArticle}
              onClick={() => handleSave('Draft')}
              className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-white/80 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSavingArticle ? <Icon name="spinner" className="w-4 h-4 animate-spin text-cyan-400" /> : <Icon name="save" className="w-4 h-4" />}
              <span>{isSavingArticle ? 'Menyimpan...' : 'Simpan Draft'}</span>
            </button>

            <button
              type="button"
              disabled={isSavingArticle}
              onClick={() => handleSave('Published')}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSavingArticle ? <Icon name="spinner" className="w-4 h-4 animate-spin text-white" /> : <Icon name="send" className="w-4 h-4" />}
              <span>{isSavingArticle ? 'Mempublikasikan...' : 'Publish Sekarang'}</span>
            </button>
          </div>

          {/* ============ CONFIRMATION MODAL BEFORE CLOSING EDIT CARD ============ */}
          {isConfirmCloseOpen && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-md bg-[#0e0e1a] border border-amber-500/30 rounded-3xl p-6 space-y-5 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Icon name="bookOpen" className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Draft Artikel Tersimpan Otomatis</h4>
                    <p className="text-xs text-white/40 mt-0.5">Perubahan Anda aman dan tidak akan hilang.</p>
                  </div>
                </div>

                <p className="text-xs text-white/70 leading-relaxed bg-white/[0.03] p-3.5 rounded-2xl border border-white/[0.06]">
                  Seluruh ketikan & perubahan artikel telah tersimpan secara otomatis di memori browser (draft sementara). Pilih opsi di bawah:
                </p>

                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleConfirmCloseSaveDraft}
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                  >
                    Simpan Draft & Tutup Editor
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsConfirmCloseOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/80 font-semibold text-xs border border-white/[0.08] transition-all cursor-pointer"
                  >
                    Batal (Tetap Lanjutkan Mengedit)
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmCloseDiscardDraft}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs border border-rose-500/30 transition-all text-center cursor-pointer"
                  >
                    Hapus Draft & Keluar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 font-mono text-xs">
            <label className="text-xs text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Icon name="key" className="w-3.5 h-3.5 text-cyan-400" />
              Sematkan Kuesioner Evaluasi (Pretest & Posttest)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* PRETEST SELECTOR & INPUT */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-cyan-300 block">Form Kuesioner Pretest (Atas Artikel):</span>
                {availableForms.length > 0 && (
                  <select
                    value={availableForms.find((form) => form.code === formData.pretestCode || form.id === formData.pretestCode)?.code || ''}
                    onChange={(e) => {
                      if (e.target.value) setFormData({ ...formData, pretestCode: e.target.value.toUpperCase() })
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-cyan-300 text-xs focus:outline-none mb-1 cursor-pointer font-sans"
                  >
                    <option value="">-- Pilih Form Kuesioner Database --</option>
                    {availableForms.map((form) => (
                      <option key={`pre_${form.id}`} value={form.code} className="bg-[#0e0e1a]">
                        {form.title} ({form.code})
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  value={formData.pretestCode}
                  onChange={(e) => setFormData({ ...formData, pretestCode: e.target.value.toUpperCase() })}
                  placeholder="Kode / ID Form Pretest (mis: KKPD7X9 atau PRE-01)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-cyan-500/30 text-cyan-300 font-mono focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              {/* POSTTEST SELECTOR & INPUT */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-purple-300 block">Form Kuesioner Posttest (Bawah Artikel):</span>
                {availableForms.length > 0 && (
                  <select
                    value={availableForms.find((form) => form.code === formData.posttestCode || form.id === formData.posttestCode)?.code || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const val = e.target.value.toUpperCase()
                        setFormData({ ...formData, posttestCode: val, embeddedDistributionCode: val })
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-purple-500/30 text-purple-300 text-xs focus:outline-none mb-1 cursor-pointer font-sans"
                  >
                    <option value="">-- Pilih Form Kuesioner Database --</option>
                    {availableForms.map((form) => (
                      <option key={`post_${form.id}`} value={form.code} className="bg-[#0e0e1a]">
                        {form.title} ({form.code})
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  value={formData.posttestCode}
                  onChange={(e) => setFormData({ ...formData, posttestCode: e.target.value.toUpperCase(), embeddedDistributionCode: e.target.value.toUpperCase() })}
                  placeholder="Kode / ID Form Posttest (mis: KKPD8Y2 atau POST-01)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-purple-500/30 text-purple-300 font-mono focus:outline-none focus:border-purple-400 text-xs"
                />
              </div>
            </div>
            <p className="text-[10px] text-white/40 font-sans">
              Pilih formulir kuesioner resmi dari database Firestore atau ketik kode kuesioner secara manual.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
