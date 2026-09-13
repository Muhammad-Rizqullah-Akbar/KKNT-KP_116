'use client'

import { Dispatch, SetStateAction } from 'react'
import { Icon } from '@/components/ui/Icons'
import type { ArticleFormData } from './articles-types'

type BlocksTabProps = {
  formData: ArticleFormData
  setFormData: Dispatch<SetStateAction<ArticleFormData>>
  handleFileUpload: (file: File) => Promise<string>
  openMediaLibrary: (onSelect: (url: string) => void) => void
  addBlock: (type: 'p' | 'h2' | 'quote' | 'list' | 'image') => void
  updateBlockValue: (id: string, value: string) => void
  updateBlockAuthor: (id: string, quoteAuthor: string) => void
  updateBlockImageCaption: (id: string, imageCaption: string) => void
  removeBlock: (id: string) => void
  moveBlock: (id: string, direction: 'up' | 'down') => void
}

export default function ArticlesFormModalBlocksTab({
  formData,
  setFormData,
  handleFileUpload,
  openMediaLibrary,
  addBlock,
  updateBlockValue,
  updateBlockAuthor,
  updateBlockImageCaption,
  removeBlock,
  moveBlock,
}: BlocksTabProps) {
  return (
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
  )
}
