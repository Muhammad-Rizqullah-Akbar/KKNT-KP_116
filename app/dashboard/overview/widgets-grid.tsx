'use client'

import { useState, useMemo } from 'react'
import { SkeletonCard } from '@/components/ui/Skeleton'
import DynamicChart from './dynamic-chart'

type WidgetsGridProps = {
  loading: boolean
  displayedWidgets: any[]
  responses: any[]
  selectedFormId: string
}

const PAGE_SIZE = 6

export default function WidgetsGrid({ loading, displayedWidgets, responses, selectedFormId }: WidgetsGridProps) {
  const [page, setPage] = useState(0)

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (displayedWidgets.length === 0) {
    return (
      <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-12 text-center text-white/40 text-sm">
        Belum ada widget aktif untuk formulir ini.
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(displayedWidgets.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pagedWidgets = useMemo(
    () => displayedWidgets.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [displayedWidgets, safePage]
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pagedWidgets.map((widget) => (
          <div key={widget.id} className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-white truncate max-w-[200px]">
                {widget.config?.title || widget.name}
              </h4>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.05] text-white/50">
                {widget.chartType}
              </span>
            </div>

            <DynamicChart widget={widget} responses={responses} selectedFormId={selectedFormId} />
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 font-mono text-xs">
          <span className="text-white/40">
            Menampilkan {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, displayedWidgets.length)} dari {displayedWidgets.length} widget
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, safePage - 1))}
              disabled={safePage === 0}
              className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/70 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
            >
              Sebelumnya
            </button>
            <span className="text-white/50 font-bold">{safePage + 1} / {totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
              disabled={safePage >= totalPages - 1}
              className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/70 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
