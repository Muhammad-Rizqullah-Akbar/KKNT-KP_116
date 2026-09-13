'use client'

import { Dispatch, SetStateAction } from 'react'
import { Icon } from '@/components/ui/Icons'
import type { Article, ArticleFormData, AvailableForm } from './articles-types'
import ArticlesFormModalInfoTab from './articles-form-modal-info-tab'
import ArticlesFormModalBlocksTab from './articles-form-modal-blocks-tab'
import ArticlesFormModalGalleryTab from './articles-form-modal-gallery-tab'

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
          {modalTab === 'info' && (
            <ArticlesFormModalInfoTab
              formData={formData}
              setFormData={setFormData}
              uploadingImage={uploadingImage}
              handleFileUpload={handleFileUpload}
              openMediaLibrary={openMediaLibrary}
              dbCategories={dbCategories}
              isAddCategoryOpen={isAddCategoryOpen}
              setIsAddCategoryOpen={setIsAddCategoryOpen}
              newCatName={newCatName}
              setNewCatName={setNewCatName}
              handleCreateNewCategory={handleCreateNewCategory}
            />
          )}

          {modalTab === 'blocks' && (
            <ArticlesFormModalBlocksTab
              formData={formData}
              setFormData={setFormData}
              handleFileUpload={handleFileUpload}
              openMediaLibrary={openMediaLibrary}
              addBlock={addBlock}
              updateBlockValue={updateBlockValue}
              updateBlockAuthor={updateBlockAuthor}
              updateBlockImageCaption={updateBlockImageCaption}
              removeBlock={removeBlock}
              moveBlock={moveBlock}
            />
          )}

          {modalTab === 'gallery' && (
            <ArticlesFormModalGalleryTab
              formData={formData}
              handleFileUpload={handleFileUpload}
              openMediaLibrary={openMediaLibrary}
              addGallerySlot={addGallerySlot}
              updateGalleryUrl={updateGalleryUrl}
              updateGalleryCaption={updateGalleryCaption}
              removeGalleryImage={removeGalleryImage}
            />
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
