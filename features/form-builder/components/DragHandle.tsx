// components/form-builder/DragHandle.tsx

'use client'

import { Icon } from '@/components/ui/Icons'

export function DragHandle() {
  return (
    <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
      <Icon name="gripVertical" className="w-4 h-4 text-white/20 hover:text-white/40" />
    </div>
  )
}