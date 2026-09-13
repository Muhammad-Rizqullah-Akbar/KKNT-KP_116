'use client'

import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import { Icon } from '@/components/ui/Icons'
import { SmartUploadArticleModal } from '@/features/dashboard/components/modals/SmartUploadArticleModal'
import { formatViews, statusOptions } from './articles-types'
import { useArticlesPage } from './use-articles-page'
import ArticlesFormModal from './articles-form-modal'
import ArticlesImageMatcher from './articles-image-matcher'
import ArticlesTable from './articles-table'
import ArticlesPreviewModal from './articles-preview-modal'
import ArticlesMediaLibrary from './articles-media-library'

// ============ KOMPONEN UTAMA ============
export default function ArticlesAdminPage() {
  const c = useArticlesPage()

  return (
    <div className="flex flex-col min-h-screen bg-[#06060E] text-white">
      <style>{`
        .article-content blockquote { border-left: 3px solid rgba(6, 182, 212, 0.5); padding-left: 1.5rem; margin: 1.5rem 0; font-style: italic; color: rgba(255, 255, 255, 0.7); }
        .article-content blockquote cite { display: block; font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); margin-top: 0.5rem; font-style: normal; }
        .article-content ul { list-style: none; padding: 0; margin: 1rem 0; }
        .article-content ul li { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.5rem 0; color: rgba(255, 255, 255, 0.6); }
        .article-content ul li:before { content: "✓"; color: #10b981; font-weight: bold; flex-shrink: 0; }
        .article-content h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 600; color: white; margin-top: 1.5rem; margin-bottom: 0.75rem; }
        .article-content p { color: rgba(255, 255, 255, 0.6); line-height: 1.8; margin-bottom: 1rem; }
        .editable-focus:hover { outline: 1px dashed rgba(6, 182, 212, 0.5); border-radius: 8px; cursor: text; }
        .editable-focus:focus { outline: 2px solid #06b6d4; border-radius: 8px; background: rgba(6, 182, 212, 0.05); }
      `}</style>

      <Topbar title="Manajemen Materi Edukasi" subtitle="Kelola artikel edukasi dengan Live Editor, Order Control, & Floating Hamburger TOC" />

      <div className="flex-1 p-6 space-y-6">
        {c.showSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 animate-slideUp">
            <Icon name="checkCircle" className="w-5 h-5 text-emerald-400" />
            <p className="text-sm text-white">{c.successMessage}</p>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <span className="text-xs text-white/40 uppercase tracking-wider">Total Artikel</span>
            <p className="text-3xl font-bold font-display mt-2">{c.stats.total}</p>
          </div>
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <span className="text-xs text-white/40 uppercase tracking-wider">Published</span>
            <p className="text-3xl font-bold font-display mt-2 text-emerald-400">{c.stats.published}</p>
          </div>
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <span className="text-xs text-white/40 uppercase tracking-wider">Draft</span>
            <p className="text-3xl font-bold font-display mt-2 text-amber-400">{c.stats.draft}</p>
          </div>
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5">
            <span className="text-xs text-white/40 uppercase tracking-wider">Total Views</span>
            <p className="text-3xl font-bold font-display mt-2 text-sky-400">{formatViews(c.stats.views)}</p>
          </div>
          <div className="rounded-2xl bg-[#080812] border border-cyan-500/20 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-cyan-400 uppercase tracking-wider font-semibold">Optimasi Storage</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-2xl font-bold font-display mt-2 text-emerald-400">Aktif & Hemat</p>
            <p className="text-[10px] text-white/40 mt-1">Auto-kompresi gambar ~80-95% cost</p>
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Cari artikel..."
              value={c.searchTerm}
              onChange={(e) => c.setSearchTerm(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none w-64"
            />
            <select value={c.filterCategory} onChange={(e) => c.setFilterCategory(e.target.value)} className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none cursor-pointer">
              <option value="Semua Kategori" className="bg-[#080812]">Semua Kategori</option>
              {c.dbCategories.map(cat => <option key={cat} value={cat} className="bg-[#080812]">{cat}</option>)}
            </select>
            <select value={c.filterStatus} onChange={(e) => c.setFilterStatus(e.target.value)} className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none">
              {statusOptions.map(opt => <option key={opt} value={opt} className="bg-[#080812]">{opt}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => c.setIsSmartUploadOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-950/40 hover:bg-slate-800"
              title="Unggah draf materi dari teks atau file (.txt, .md, .json) secara otomatis rapi"
            >
              <Icon name="upload" className="w-4 h-4 text-cyan-400" />
              <span>Unggah / Draf Instan</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
                Pintar
              </span>
            </button>

            <button onClick={c.handleCreate} className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all font-mono">
              <Icon name="plus" className="w-4 h-4" /> Buat Artikel Baru
            </button>
          </div>
        </div>

        {/* BULK ACTION BAR */}
        {c.selectedArticleIds.length > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border border-rose-500/40 flex items-center justify-between gap-4 font-mono shadow-xl animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center font-bold text-xs">
                {c.selectedArticleIds.length}
              </span>
              <div>
                <span className="font-bold text-sm text-slate-100">{c.selectedArticleIds.length} Artikel Dipilih</span>
                <p className="text-xs text-slate-400">Pilihan massal untuk menghapus beberapa artikel sekaligus dari database.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => c.setIsBulkDeleteModalOpen(true)}
                disabled={c.isBulkDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Icon name="trash" className="w-4 h-4" />
                <span>Hapus Massal ({c.selectedArticleIds.length})</span>
              </button>

              <button
                type="button"
                onClick={() => c.setSelectedArticleIds([])}
                className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 font-bold text-xs transition-colors"
              >
                Batal Pilihan
              </button>
            </div>
          </div>
        )}

        {/* TABEL DATA */}
        <ArticlesTable
          loading={c.loading}
          paginatedArticles={c.paginatedArticles}
          selectedArticleIds={c.selectedArticleIds}
          toggleSelectArticle={c.toggleSelectArticle}
          toggleSelectAllCurrentPage={c.toggleSelectAllCurrentPage}
          handleEdit={c.handleEdit}
          handleExportArticleJson={c.handleExportArticleJson}
          handleDelete={c.handleDelete}
          openPreviewFromTable={c.openPreviewFromTable}
        />
      </div>

      {/* ============ MODAL BULK DELETE CONFIRMATION ============ */}
      {c.isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e0e1a] border border-rose-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-xs font-mono animate-slideUp">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold shrink-0">
                <Icon name="trash" className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100 font-sans">Konfirmasi Hapus Massal</h3>
                <p className="text-[11px] text-slate-400">Penghapusan {c.selectedArticleIds.length} artikel terpilih.</p>
              </div>
            </div>

            <p className="text-slate-300 font-sans text-xs leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong className="text-rose-400 font-bold">{c.selectedArticleIds.length} artikel</strong> yang dipilih secara permanen dari Firestore database?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={c.isBulkDeleting}
                onClick={() => c.setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={c.isBulkDeleting}
                onClick={c.confirmBulkDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30 disabled:opacity-50 cursor-pointer"
              >
                {c.isBulkDeleting ? <Icon name="spinner" className="w-4 h-4 animate-spin text-white" /> : <Icon name="trash" className="w-4 h-4" />}
                <span>{c.isBulkDeleting ? 'Menghapus Massal...' : 'Ya, Hapus Massal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL FORM EDIT (RICH 3-TAB BUILDER) ============ */}
      <ArticlesFormModal
        isOpen={c.isModalOpen}
        isEditing={c.isEditing}
        formData={c.formData}
        setFormData={c.setFormData}
        selectedArticle={c.selectedArticle}
        setSelectedArticle={c.setSelectedArticle}
        modalTab={c.modalTab}
        setModalTab={c.setModalTab}
        isSavingArticle={c.isSavingArticle}
        handleSave={c.handleSave}
        handleAttemptCloseModal={c.handleAttemptCloseModal}
        isConfirmCloseOpen={c.isConfirmCloseOpen}
        setIsConfirmCloseOpen={c.setIsConfirmCloseOpen}
        handleConfirmCloseSaveDraft={c.handleConfirmCloseSaveDraft}
        handleConfirmCloseDiscardDraft={c.handleConfirmCloseDiscardDraft}
        uploadingImage={c.uploadingImage}
        handleFileUpload={c.handleFileUpload}
        openMediaLibrary={c.openMediaLibrary}
        dbCategories={c.dbCategories}
        availableForms={c.availableForms}
        isAddCategoryOpen={c.isAddCategoryOpen}
        setIsAddCategoryOpen={c.setIsAddCategoryOpen}
        newCatName={c.newCatName}
        setNewCatName={c.setNewCatName}
        handleCreateNewCategory={c.handleCreateNewCategory}
        addBlock={c.addBlock}
        updateBlockValue={c.updateBlockValue}
        updateBlockAuthor={c.updateBlockAuthor}
        updateBlockImageCaption={c.updateBlockImageCaption}
        removeBlock={c.removeBlock}
        moveBlock={c.moveBlock}
        updateGalleryUrl={c.updateGalleryUrl}
        updateGalleryCaption={c.updateGalleryCaption}
        removeGalleryImage={c.removeGalleryImage}
        addGallerySlot={c.addGallerySlot}
        setIsPreviewOpen={c.setIsPreviewOpen}
      />

      {/* ============ 🔥 LIVE EDITOR PREVIEW MODAL DENGAN HAMBURGER POPOVER TOC ============ */}
      {c.isPreviewOpen && (
        <ArticlesPreviewModal
          formData={c.formData}
          setFormData={c.setFormData}
          previewDevice={c.previewDevice}
          setPreviewDevice={c.setPreviewDevice}
          isTocPopoverOpen={c.isTocPopoverOpen}
          setIsTocPopoverOpen={c.setIsTocPopoverOpen}
          previewHeadings={c.previewHeadings}
          scrollToHeadingBlock={c.scrollToHeadingBlock}
          isSavingArticle={c.isSavingArticle}
          handleSave={c.handleSave}
          setIsPreviewOpen={c.setIsPreviewOpen}
          setIsModalOpen={c.setIsModalOpen}
          openMediaLibrary={c.openMediaLibrary}
          moveBlock={c.moveBlock}
          removeBlock={c.removeBlock}
          updateBlockValue={c.updateBlockValue}
          updateBlockAuthor={c.updateBlockAuthor}
          updateBlockImageCaption={c.updateBlockImageCaption}
          addGallerySlot={c.addGallerySlot}
          removeGalleryImage={c.removeGalleryImage}
          updateGalleryUrl={c.updateGalleryUrl}
          updateGalleryCaption={c.updateGalleryCaption}
        />
      )}

      {/* ============ MODAL RESOURCE PICKER ============ */}
      <ArticlesMediaLibrary
        isOpen={c.isMediaLibraryOpen}
        setIsMediaLibraryOpen={c.setIsMediaLibraryOpen}
        mediaList={c.mediaList}
        loadingMedia={c.loadingMedia}
        uploadingImage={c.uploadingImage}
        onSelectMediaCallback={c.onSelectMediaCallback}
        handleFileUpload={c.handleFileUpload}
      />

      {/* ============ DELETE MODAL ============ */}
      {c.isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => c.setIsDeleteModalOpen(false)}>
          <div className="relative w-full max-w-md bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Icon name="alertCircle" className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white mb-2">Hapus Artikel</h3>
            <p className="text-sm text-white/50 mb-6">Tindakan ini akan menghapus artikel dari Firestore secara permanen.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => c.setIsDeleteModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-white/[0.03] text-sm text-white/70">Batal</button>
              <button onClick={c.confirmDelete} className="px-5 py-2.5 rounded-xl bg-rose-600 text-sm font-medium text-white">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ 🖼️ SMART IMAGE MARKER MATCHER STEP MODAL ============ */}
      <ArticlesImageMatcher
        isOpen={c.isImageMatcherOpen}
        detectedMarkers={c.detectedMarkers}
        setDetectedMarkers={c.setDetectedMarkers}
        handleApplyMatchedImages={c.handleApplyMatchedImages}
        setIsImageMatcherOpen={c.setIsImageMatcherOpen}
        setIsPreviewOpen={c.setIsPreviewOpen}
      />

      {/* ============ 📥 SMART UPLOAD & PARSER MODAL ============ */}
      <SmartUploadArticleModal
        isOpen={c.isSmartUploadOpen}
        onClose={() => c.setIsSmartUploadOpen(false)}
        onApplyArticle={c.handleApplyImportedArticle}
        currentUserName={c.userData?.displayName || c.user?.email || 'Penulis KKPD-KP'}
      />
    </div>
  )
}
