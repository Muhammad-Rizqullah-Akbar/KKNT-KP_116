'use client'

import Link from 'next/link'
import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import { Icon } from '@/components/ui/Icons'
import { SkeletonCard } from '@/components/ui/Skeleton'
import FormsLifecycleFilter from './forms-lifecycle-filter'
import FormsCard from './forms-card'
import FormsListRow from './forms-list-row'
import FormsListModals from './forms-list-modals'
import FormsListDeleteModals from './forms-list-delete-modals'
import { useFormsList } from './use-forms-list'

export default function V15FormsDashboardPage() {
  const f = useFormsList()

  return (
    <div className="flex flex-col min-h-screen bg-[#06060E] text-slate-100 font-sans" onClick={() => f.setActiveMenuFormId(null)}>
      <Topbar title="Form Lifecycle Control Center" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* HEADER AREA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
              <span>Formulir</span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                V1.5 Lifecycle
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Kelola assessment, publikasi versi snapshot, dan distribusi kuesioner.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Link
              href="/dashboard/forms/new"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all shrink-0"
            >
              <Icon name="sparkles" className="w-4 h-4 text-purple-200" />
              <span>Buka Form Builder V1.5 Terbaru</span>
            </Link>

            <Link
              href="/dashboard/form-builder"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition-all shrink-0"
            >
              <Icon name="filePlus" className="w-4 h-4 text-cyan-400" />
              <span>Builder Legacy V1.0</span>
            </Link>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                f.setIsCreateModalOpen(true)
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
            >
              <Icon name="plus" className="w-4 h-4" />
              <span>+ Buat Formulir</span>
            </button>
          </div>
        </div>

        {/* LIFECYCLE NAVIGATION TABS & FILTERS */}
        <FormsLifecycleFilter
          lifecycleTab={f.lifecycleTab}
          tabCounts={f.tabCounts}
          searchTerm={f.searchTerm}
          categories={f.categories}
          categoryFilter={f.categoryFilter}
          sortBy={f.sortBy}
          viewMode={f.viewMode}
          selectedFormIds={f.selectedFormIds}
          filteredFormsCount={f.filteredForms.length}
          onTabChange={(tab) => {
            f.setLifecycleTab(tab)
            f.setCurrentPage(1)
          }}
          onSearchChange={(value) => {
            f.setSearchTerm(value)
            f.setCurrentPage(1)
          }}
          onCategoryChange={(value) => {
            f.setCategoryFilter(value)
            f.setCurrentPage(1)
          }}
          onSortChange={(value) => f.setSortBy(value)}
          onViewModeChange={(mode) => f.setViewMode(mode)}
          onSelectAll={() => f.handleSelectAllToggle(f.filteredForms)}
          onBulkDelete={() => f.setIsBulkDeleteModalOpen(true)}
        />

        {/* ERROR STATE */}
        {f.error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="alertTriangle" className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{f.error}</span>
            </div>
            <button
              type="button"
              onClick={f.fetchForms}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold rounded-lg transition-all"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {f.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : f.filteredForms.length === 0 ? (
          /* EMPTY STATE */
          <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4 max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto">
              <Icon name="fileText" className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200">
                {f.searchTerm || f.categoryFilter !== 'all' || f.lifecycleTab !== 'all'
                  ? 'Tidak ada formulir yang sesuai.'
                  : 'Belum ada formulir'}
              </h3>
              <p className="text-xs text-slate-400">
                {f.searchTerm || f.categoryFilter !== 'all' || f.lifecycleTab !== 'all'
                  ? 'Coba ubah kata kunci pencarian atau filter tab Anda.'
                  : 'Mulai buat assessment kuesioner pertama Anda.'}
              </p>
            </div>
            {!f.searchTerm && f.categoryFilter === 'all' && f.lifecycleTab === 'all' && (
              <button
                type="button"
                onClick={() => f.setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
              >
                <Icon name="plus" className="w-4 h-4" />
                <span>+ Buat Formulir</span>
              </button>
            )}
          </div>
        ) : (
          /* FORM ITEM CONTAINER: GRID VIEW VS COMPACT LIST VIEW */
          <div className={f.viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {f.paginatedForms.map((form) => {
              const isMenuOpen = f.activeMenuFormId === form.formId

              if (f.viewMode === 'grid') {
                /* AESTHETIC GRID CARD VIEW */
                return (
                  <FormsCard
                    key={form.formId}
                    form={form}
                    selected={f.selectedFormIds.includes(form.formId)}
                    onToggleSelect={f.handleSelectFormToggle}
                    menuOpen={isMenuOpen}
                    onMenuToggle={() => f.setActiveMenuFormId(isMenuOpen ? null : form.formId)}
                    onMenuClose={() => f.setActiveMenuFormId(null)}
                    isGlobalRole={f.isGlobalRole}
                    duplicatingFormId={f.duplicatingFormId}
                    onRestore={f.handleRestoreForm}
                    onPreview={f.setPreviewFormDoc}
                    onDistribution={f.setDistributionModalForm}
                    onEditVersion={f.setEditConfirmForm}
                    onEditTitle={f.handleOpenEditTitleModal}
                    onHistory={f.setSelectedHistoryFormId}
                    onResponses={f.handleResponses}
                    onDuplicate={f.handleDuplicateForm}
                    onArchive={f.handleArchiveForm}
                    onDelete={f.setFormToDelete}
                  />
                )
              }

              /* COMPACT ROW LIST VIEW */
              return (
                <FormsListRow
                  key={form.formId}
                  form={form}
                  menuOpen={isMenuOpen}
                  onMenuToggle={() => f.setActiveMenuFormId(isMenuOpen ? null : form.formId)}
                  onMenuClose={() => f.setActiveMenuFormId(null)}
                  duplicatingFormId={f.duplicatingFormId}
                  onRestore={f.handleRestoreForm}
                  onPreview={f.setPreviewFormDoc}
                  onDistribution={f.setDistributionModalForm}
                  onEditVersion={f.setEditConfirmForm}
                  onEditTitle={f.handleOpenEditTitleModal}
                  onHistory={f.setSelectedHistoryFormId}
                  onResponses={f.handleResponses}
                  onDuplicate={f.handleDuplicateForm}
                  onArchive={f.handleArchiveForm}
                  onDelete={f.setFormToDelete}
                />
              )
            })}
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {f.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
            <span className="text-xs text-slate-400">
              Halaman {f.currentPage} dari {f.totalPages} ({f.filteredForms.length} Total Formulir)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => f.setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={f.currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-950 disabled:text-slate-600 text-xs text-slate-300 font-semibold border border-slate-800 transition-all cursor-pointer"
              >
                ← Prev
              </button>

              <button
                type="button"
                onClick={() => f.setCurrentPage((p) => Math.min(f.totalPages, p + 1))}
                disabled={f.currentPage === f.totalPages}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-950 disabled:text-slate-600 text-xs text-slate-300 font-semibold border border-slate-800 transition-all cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </main>

      <FormsListModals f={f} />
      <FormsListDeleteModals f={f} />

      {/* TOAST NOTIFICATION */}
      {f.toastVisible && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-2xl flex items-center gap-2">
          <Icon name="checkCircle" className="w-4 h-4 text-emerald-400" />
          <span>{f.toastMessage}</span>
        </div>
      )}
    </div>
  )
}
