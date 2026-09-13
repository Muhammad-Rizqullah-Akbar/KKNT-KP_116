'use client'

import { Dispatch, SetStateAction } from 'react'
import { Icon } from '@/components/ui/Icons'
import { categoryGradients, type ArticleFormData } from './articles-types'

type PreviewHeading = { blockId: string; id: string; text: string }

type ArticlesPreviewModalProps = {
  formData: ArticleFormData
  setFormData: Dispatch<SetStateAction<ArticleFormData>>
  previewDevice: 'desktop' | 'tablet' | 'mobile'
  setPreviewDevice: Dispatch<SetStateAction<'desktop' | 'tablet' | 'mobile'>>
  isTocPopoverOpen: boolean
  setIsTocPopoverOpen: Dispatch<SetStateAction<boolean>>
  previewHeadings: PreviewHeading[]
  scrollToHeadingBlock: (blockId: string) => void
  isSavingArticle: boolean
  handleSave: () => void
  setIsPreviewOpen: Dispatch<SetStateAction<boolean>>
  setIsModalOpen: Dispatch<SetStateAction<boolean>>
  openMediaLibrary: (onSelect: (url: string) => void) => void
  moveBlock: (id: string, direction: 'up' | 'down') => void
  removeBlock: (id: string) => void
  updateBlockValue: (id: string, value: string) => void
  updateBlockAuthor: (id: string, quoteAuthor: string) => void
  updateBlockImageCaption: (id: string, imageCaption: string) => void
  addGallerySlot: () => void
  removeGalleryImage: (id: string) => void
  updateGalleryUrl: (id: string, url: string) => void
  updateGalleryCaption: (id: string, caption: string) => void
}

export default function ArticlesPreviewModal({
  formData,
  setFormData,
  previewDevice,
  setPreviewDevice,
  isTocPopoverOpen,
  setIsTocPopoverOpen,
  previewHeadings,
  scrollToHeadingBlock,
  isSavingArticle,
  handleSave,
  setIsPreviewOpen,
  setIsModalOpen,
  openMediaLibrary,
  moveBlock,
  removeBlock,
  updateBlockValue,
  updateBlockAuthor,
  updateBlockImageCaption,
  addGallerySlot,
  removeGalleryImage,
  updateGalleryUrl,
  updateGalleryCaption,
}: ArticlesPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#06060E] overflow-hidden">
      {/* CONTROL BAR STICKY HEADER */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#080812] border-b border-white/[0.08] shrink-0 z-50">
        <div className="flex items-center gap-3 flex-wrap relative">

          {/* 🔥 TOMBOL HAMBURGER POPOVER TOC DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setIsTocPopoverOpen(!isTocPopoverOpen)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold flex items-center gap-2 hover:bg-cyan-500/20 transition-all"
              title="Daftar Isi Sub-Judul"
            >
              <Icon name="menu" className="w-4 h-4" />
              <span>Daftar Isi ({previewHeadings.length})</span>
            </button>

            {/* 🔥 TOOLTIP / POPOVER MODAL FLOATING TOC */}
            {isTocPopoverOpen && (
              <div className="absolute top-10 left-0 w-72 bg-[#0e0e1a] border border-white/10 rounded-2xl shadow-2xl p-4 z-[120] animate-slideUp">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">Navigasi Sub-Judul</span>
                  <button onClick={() => setIsTocPopoverOpen(false)} className="p-1 text-white/40 hover:text-white">
                    <Icon name="x" className="w-4 h-4" />
                  </button>
                </div>

                {previewHeadings.length === 0 ? (
                  <p className="text-xs text-white/40 py-2">Belum ada H2 Sub-Judul pada artikel ini.</p>
                ) : (
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {previewHeadings.map((heading, i) => (
                      <button
                        key={heading.blockId}
                        onClick={() => scrollToHeadingBlock(heading.blockId)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-white/70 hover:text-cyan-300 hover:bg-cyan-500/10 truncate font-mono block"
                      >
                        {i + 1}. {heading.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DEVICE SWITCHER BUTTONS */}
          <div className="flex items-center gap-1 bg-white/[0.05] p-1 rounded-xl">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                previewDevice === 'desktop' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/50 hover:text-white'
              }`}
            >
              <Icon name="monitor" className="w-3.5 h-3.5" /> Desktop
            </button>
            <button
              onClick={() => setPreviewDevice('tablet')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                previewDevice === 'tablet' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/50 hover:text-white'
              }`}
            >
              <Icon name="tablet" className="w-3.5 h-3.5" /> Tablet
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                previewDevice === 'mobile' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/50 hover:text-white'
              }`}
            >
              <Icon name="smartphone" className="w-3.5 h-3.5" /> Mobile
            </button>
          </div>

          {/* KODE DISTRIBUSI DISTRIBUTOR */}
          <div className="flex items-center gap-2 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1 rounded-xl">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Sematkan Kode:</span>
            <input
              type="text"
              value={formData.embeddedDistributionCode}
              onChange={(e) => setFormData({ ...formData, embeddedDistributionCode: e.target.value.toUpperCase() })}
              placeholder="Kode (mis: KKPDQ6M)"
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-cyan-500/30 text-cyan-300 text-xs font-mono focus:outline-none focus:border-cyan-400 w-36"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setIsPreviewOpen(false); setIsModalOpen(true); }}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Buka Form Standard"
          >
            <Icon name="pencil" className="w-3.5 h-3.5 text-cyan-400" />
            <span>Form Edit</span>
          </button>

          <button
            type="button"
            disabled={isSavingArticle}
            onClick={() => handleSave()}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white flex items-center gap-1.5 shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {isSavingArticle ? <Icon name="spinner" className="w-3.5 h-3.5 animate-spin text-white" /> : <Icon name="send" className="w-3.5 h-3.5" />}
            <span>{isSavingArticle ? 'Menyimpan...' : 'Simpan & Publish'}</span>
          </button>
          <button onClick={() => { setIsPreviewOpen(false); document.body.style.overflow = ''; }} className="p-2 rounded-xl bg-white/[0.05] text-white">
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CANVAS AREA FULL SCROLLABLE */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-black/50 custom-scrollbar">
        <div className={`transition-all duration-300 bg-[#06060E] border border-white/[0.08] shadow-2xl ${
          previewDevice === 'mobile' ? 'w-full max-w-sm my-auto min-h-[700px] border-8 border-neutral-800 rounded-[40px]' :
          previewDevice === 'tablet' ? 'w-full max-w-2xl my-auto min-h-[750px] rounded-3xl' :
          'w-full max-w-4xl rounded-3xl'
        }`}>

          <div className="min-h-full text-white pb-20 p-6 sm:p-12">
            {/* HERO HEADER */}
            <header className="relative w-full max-w-3xl mx-auto space-y-4">
              <div className="relative w-full h-56 sm:h-80 overflow-hidden rounded-2xl group/featured">
                <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradients[formData.category] || 'from-gray-700/40 to-gray-800/40'} flex items-center justify-center`}>
                  {formData.featuredImage ? (
                    <img src={formData.featuredImage} alt={formData.title} className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="image" className="w-16 h-16 text-white/20" />
                  )}
                </div>

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/featured:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => openMediaLibrary((url) => setFormData(prev => ({ ...prev, featuredImage: url })))}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 text-xs text-white font-medium"
                  >
                    Pilih dari Storage
                  </button>
                </div>
              </div>

              <h1
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => setFormData({ ...formData, title: e.currentTarget.innerText })}
                className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white editable-focus p-1"
              >
                {formData.title}
              </h1>

              <p
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => setFormData({ ...formData, excerpt: e.currentTarget.innerText })}
                className="text-base sm:text-lg text-white/50 leading-relaxed editable-focus p-1"
              >
                {formData.excerpt}
              </p>

              <div className="flex items-center gap-3 pt-2 border-b border-white/10 pb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                  {(formData.author || 'A').split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <p contentEditable suppressContentEditableWarning onBlur={(e) => setFormData({ ...formData, author: e.currentTarget.innerText })} className="text-sm font-semibold text-white editable-focus">
                    {formData.author || 'Nama Penulis'}
                  </p>
                  <p contentEditable suppressContentEditableWarning onBlur={(e) => setFormData({ ...formData, authorBio: e.currentTarget.innerText })} className="text-xs text-white/40 editable-focus">
                    {formData.authorBio || 'Bio singkat penulis...'}
                  </p>
                </div>
              </div>
            </header>

            {/* MAIN CONTENT ARTICLE BLOCKS */}
            <main className="relative w-full max-w-3xl mx-auto mt-8">
              <article className="article-content text-white/60 leading-relaxed space-y-6 text-base">
                {formData.blocks.map((block, index) => (
                  <div id={`block-${block.id}`} key={block.id} className="relative group/block border border-transparent hover:border-cyan-500/20 rounded-xl p-2 transition-all">

                    {/* ACTION BAR FLOATING REORDER */}
                    <div className="absolute -top-3 right-2 opacity-0 group-hover/block:opacity-100 bg-[#080812] border border-white/10 rounded-lg p-1 flex items-center gap-1 shadow-xl z-20 transition-opacity">
                      <button onClick={() => moveBlock(block.id, 'up')} disabled={index === 0} className="p-1 hover:bg-white/10 text-white/70 disabled:opacity-20" title="Geser Ke Atas">
                        <Icon name="arrowUp" className="w-3 h-3" />
                      </button>
                      <button onClick={() => moveBlock(block.id, 'down')} disabled={index === formData.blocks.length - 1} className="p-1 hover:bg-white/10 text-white/70 disabled:opacity-20" title="Geser Ke Bawah">
                        <Icon name="arrowDown" className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeBlock(block.id)} className="p-1 hover:bg-red-500/20 text-red-400" title="Hapus Blok">
                        <Icon name="trash" className="w-3 h-3" />
                      </button>
                    </div>

                    {block.type === 'h2' ? (
                      <h2 contentEditable suppressContentEditableWarning onBlur={(e) => updateBlockValue(block.id, e.currentTarget.innerText)} className="editable-focus p-1">
                        {block.value || 'Sub-Judul Baru...'}
                      </h2>
                    ) : block.type === 'quote' ? (
                      <blockquote className="my-4">
                        <p contentEditable suppressContentEditableWarning onBlur={(e) => updateBlockValue(block.id, e.currentTarget.innerText)} className="editable-focus p-1 inline-block">
                          {block.value || 'Isi kutipan...'}
                        </p>
                        <cite contentEditable suppressContentEditableWarning onBlur={(e) => updateBlockAuthor(block.id, e.currentTarget.innerText)} className="block text-xs text-white/40 mt-1 not-italic editable-focus p-1">
                          — {block.quoteAuthor || 'Nama Pengutip'}
                        </cite>
                      </blockquote>
                    ) : block.type === 'image' ? (
                      <figure className="my-4 relative">
                        {block.imageUrl ? (
                          <img src={block.imageUrl} alt="Media" className="w-full rounded-2xl border border-white/[0.08]" />
                        ) : (
                          <div className="w-full h-40 bg-white/[0.02] border border-dashed border-white/20 rounded-2xl flex items-center justify-center">
                            <button onClick={() => openMediaLibrary((url) => setFormData(prev => ({ ...prev, blocks: prev.blocks.map(item => item.id === block.id ? { ...item, imageUrl: url } : item) })))} className="px-3 py-1.5 bg-cyan-600/30 text-cyan-300 text-xs rounded-lg">Pilih Foto</button>
                          </div>
                        )}
                        <figcaption contentEditable suppressContentEditableWarning onBlur={(e) => updateBlockImageCaption(block.id, e.currentTarget.innerText)} className="text-center text-xs text-white/40 mt-2 italic editable-focus p-1">
                          {block.imageCaption || 'Keterangan gambar/infografis...'}
                        </figcaption>
                      </figure>
                    ) : (
                      <p contentEditable suppressContentEditableWarning onBlur={(e) => updateBlockValue(block.id, e.currentTarget.innerText)} className="editable-focus p-1">
                        {block.value || 'Tulis isi paragraf di sini...'}
                      </p>
                    )}
                  </div>
                ))}

                {/* EMBEDDED KUESIONER / FORM CTA BANNER LIVE PREVIEW */}
                {formData.embeddedDistributionCode && (
                  <div className="my-8 p-6 rounded-3xl bg-gradient-to-br from-cyan-950/80 via-slate-900 to-purple-950/80 border-2 border-cyan-500/40 shadow-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0">
                        <Icon name="fileText" className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-white">Formulir & Kuesioner Evaluasi Resmi</h4>
                        <p className="text-xs text-cyan-300 font-mono">Kode Akses Distribusi: <strong>{formData.embeddedDistributionCode}</strong></p>
                      </div>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Bantu kami mengumpulkan data evaluasi pangan secara langsung dengan mengklik tombol di bawah ini untuk mengisi kuesioner resmi.
                    </p>
                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/25">
                      <span>Isi Kuesioner Sekarang (Pratinjau Tautan Aktif)</span>
                      <Icon name="arrowRight" className="w-4 h-4 text-slate-950" />
                    </div>
                  </div>
                )}

                {/* GALERI DOKUMENTASI */}
                <div className="mt-10 pt-6 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-xl font-semibold text-white">Galeri Dokumentasi</h3>
                    <button onClick={addGallerySlot} className="px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs hover:bg-cyan-500/20">+ Tambah Foto</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {formData.gallery.map(img => (
                      <div key={img.id} className="rounded-xl overflow-hidden border border-white/[0.05] bg-[#080812] group/gal relative">
                        <button
                          onClick={() => removeGalleryImage(img.id)}
                          className="absolute top-2 right-2 z-10 p-1 bg-red-500/80 text-white rounded hover:bg-red-600 opacity-0 group-hover/gal:opacity-100 transition-opacity"
                        >
                          <Icon name="trash" className="w-3 h-3" />
                        </button>
                        <div
                          onClick={() => openMediaLibrary((url) => updateGalleryUrl(img.id, url))}
                          className="cursor-pointer aspect-video w-full bg-white/[0.02] relative flex items-center justify-center group-hover/gal:opacity-90"
                        >
                          {img.url ? (
                            <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center text-xs text-white/40">Klik Pilih Gambar</div>
                          )}
                        </div>
                        <div className="p-2">
                          <input
                            type="text"
                            value={img.caption}
                            onChange={e => updateGalleryCaption(img.id, e.target.value)}
                            placeholder="Keterangan..."
                            className="w-full bg-transparent text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </main>
          </div>

        </div>
      </div>
    </div>
  )
}
