'use client'

interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPrev: () => void
  onNext: () => void
}

export default function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPrev,
  onNext,
}: PaginationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
      <div>
        Menampilkan <span className="font-bold text-slate-200">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-bold text-slate-200">{Math.min(currentPage * pageSize, totalItems)}</span> dari <span className="font-bold text-slate-200">{totalItems}</span> distribusi
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 font-bold"
        >
          ← Prev
        </button>

        <span className="font-mono text-cyan-400 font-bold px-2">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 font-bold"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
