'use client'

import { Icon } from '@/components/ui/Icons'

interface TopbarProps {
  title: string
  subtitle?: string
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#06060E]/80 backdrop-blur-xl border-b border-white/[0.04] px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="font-display text-lg font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-white/40">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-white/[0.05] transition-colors">
          <Icon name="bell" className="w-5 h-5 text-white/50" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
        </button>
        <button className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors">
          <Icon name="helpCircle" className="w-5 h-5 text-white/50" />
        </button>
      </div>
    </header>
  )
}