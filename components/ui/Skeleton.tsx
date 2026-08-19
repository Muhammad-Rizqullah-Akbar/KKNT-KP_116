'use client'

import React from 'react'
import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-xl bg-slate-800/60 border border-slate-700/30',
        className
      )}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24 rounded-lg" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
      </div>

      <div className="p-3 bg-slate-950/80 rounded-xl space-y-2">
        <Skeleton className="h-3.5 w-full rounded" />
        <Skeleton className="h-3.5 w-2/3 rounded" />
      </div>

      <div className="pt-2 border-t border-slate-800 flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 w-20 rounded-xl" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
      {/* Table Header Skeleton */}
      <div className="flex items-center gap-4 pb-3 border-b border-slate-800">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 rounded-md" />
        ))}
      </div>

      {/* Table Rows Skeleton */}
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center gap-4 py-2.5 border-b border-slate-800/50">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <Skeleton key={cIdx} className="h-4 flex-1 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonOverview() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 animate-pulse">
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-3 w-32 rounded" />
        </div>
      ))}
    </div>
  )
}
