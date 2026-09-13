'use client'

import { SkeletonCard } from '@/components/ui/Skeleton'
import DynamicChart from './dynamic-chart'

type WidgetsGridProps = {
  loading: boolean
  displayedWidgets: any[]
  responses: any[]
  selectedFormId: string
}

export default function WidgetsGrid({ loading, displayedWidgets, responses, selectedFormId }: WidgetsGridProps) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayedWidgets.map((widget) => (
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
  )
}
