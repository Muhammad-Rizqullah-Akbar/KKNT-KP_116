'use client'

import { Icon } from '@/components/ui/Icons'
import type { FormsListController } from './use-forms-list'

// Modal konfirmasi hapus single & bulk delete.
export default function FormsListDeleteModals({ f }: { f: FormsListController }) {
  return (
    <>
      {/* SINGLE DELETE CONFIRMATION MODAL */}
      {f.formToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => f.setFormToDelete(null)}
        >
          <div
            className="bg-[#0e0e1a] border border-rose-500/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-slideUp font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Icon name="trash" className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100">Konfirmasi Hapus Formulir</h3>
                <p className="text-xs text-rose-400/80">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p className="leading-relaxed">
                Apakah Anda yakin ingin menghapus formulir berikut secara permanen dari database?
              </p>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 font-mono">
                <div className="font-bold text-slate-100 text-sm font-sans">{f.formToDelete.metadata?.title || 'Formulir Tanpa Judul'}</div>
                <div className="text-slate-400 text-[11px]">ID: {f.formToDelete.formId}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => f.setFormToDelete(null)}
                disabled={f.isDeletingForm}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={f.isDeletingForm}
                onClick={f.handleConfirmDeleteSingle}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                {f.isDeletingForm ? <Icon name="spinner" className="w-4 h-4 animate-spin text-white" /> : <Icon name="trash" className="w-4 h-4" />}
                <span>{f.isDeletingForm ? 'Menghapus...' : 'Ya, Hapus Permanen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {f.isBulkDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => f.setIsBulkDeleteModalOpen(false)}
        >
          <div
            className="bg-[#0e0e1a] border border-rose-500/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-slideUp font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Icon name="trash" className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100">Konfirmasi Hapus Massal</h3>
                <p className="text-xs text-rose-400/80">Penghapusan {f.selectedFormIds.length} formulir terpilih</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.03] p-3.5 rounded-2xl border border-white/[0.06]">
              Anda akan menghapus <strong className="text-rose-400">{f.selectedFormIds.length} formulir</strong> yang dicentang secara permanen dari Firestore. Seluruh konfigurasi formulir tersebut akan dibuang.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => f.setIsBulkDeleteModalOpen(false)}
                disabled={f.isDeletingForm}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={f.isDeletingForm}
                onClick={f.handleConfirmBulkDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                {f.isDeletingForm ? <Icon name="spinner" className="w-4 h-4 animate-spin text-white" /> : <Icon name="trash" className="w-4 h-4" />}
                <span>{f.isDeletingForm ? 'Menghapus Massal...' : 'Ya, Hapus Massal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
