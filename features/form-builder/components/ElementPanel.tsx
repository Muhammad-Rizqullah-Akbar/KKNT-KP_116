'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icons'
import { clsx } from 'clsx'

export interface FormElement {
  id: string
  type: 'binary' | 'single-choice' | 'multiple-choice' | 'image' | 'likert' | 'text' | 'textarea'
  label: string
  icon: string
  category: 'Pilihan' | 'Skala' | 'Media' | 'Input'
  description: string
}

const elements: FormElement[] = [
  {
    id: 'binary',
    type: 'binary',
    label: 'Ya / Tidak',
    icon: 'toggleLeft',
    category: 'Pilihan',
    description: 'Pertanyaan dengan jawaban biner (Ya/Tidak)'
  },
  {
    id: 'single-choice',
    type: 'single-choice',
    label: 'Pilihan Ganda (Single)',
    icon: 'list',
    category: 'Pilihan',
    description: 'Satu pilihan dari beberapa opsi'
  },
  {
    id: 'multiple-choice',
    type: 'multiple-choice',
    label: 'Pilihan Ganda (Multiple)',
    icon: 'checkSquare',
    category: 'Pilihan',
    description: 'Beberapa pilihan dari beberapa opsi'
  },
  {
    id: 'likert',
    type: 'likert',
    label: 'Skala Likert',
    icon: 'table',
    category: 'Skala',
    description: 'Skala STS, TS, CS, S, SS'
  },
  {
    id: 'image',
    type: 'image',
    label: 'Pertanyaan dengan Gambar',
    icon: 'image',
    category: 'Media',
    description: 'Pertanyaan yang disertai gambar'
  },
  {
    id: 'text',
    type: 'text',
    label: 'Teks Pendek',
    icon: 'type',
    category: 'Input',
    description: 'Input teks satu baris'
  },
  {
    id: 'textarea',
    type: 'textarea',
    label: 'Teks Panjang',
    icon: 'alignLeft',
    category: 'Input',
    description: 'Input teks multi-baris'
  },
]

interface ElementPanelProps {
  onAddElement: (element: FormElement) => void
  onDragStart?: (element: FormElement) => void
}

export function ElementPanel({ onAddElement, onDragStart }: ElementPanelProps) {
  const [hoveredElement, setHoveredElement] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const categories = ['Pilihan', 'Skala', 'Media', 'Input']
  
  const filteredElements = elements.filter(el =>
    el.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    el.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const groupedElements = categories.map(category => ({
    category,
    elements: filteredElements.filter(el => el.category === category)
  })).filter(group => group.elements.length > 0)

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="relative mb-4">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <input
          type="text"
          placeholder="Cari elemen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-400/40 transition-all"
        />
      </div>

      {/* Elements */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
        {groupedElements.map((group) => (
          <div key={group.category}>
            <p className="text-xs text-white/25 uppercase tracking-wider px-1 mb-2">
              {group.category}
            </p>
            <div className="space-y-1.5">
              {group.elements.map((element) => (
                <div
                  key={element.id}
                  className={clsx(
                    'relative group flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer',
                    'bg-white/[0.02] border border-white/[0.05]',
                    'hover:bg-white/[0.05] hover:border-cyan-500/20',
                    hoveredElement === element.id && 'bg-white/[0.05] border-cyan-500/20'
                  )}
                  onMouseEnter={() => setHoveredElement(element.id)}
                  onMouseLeave={() => setHoveredElement(null)}
                  draggable
                  onDragStart={() => onDragStart?.(element)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <Icon name={element.icon as any} className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white/80">{element.label}</p>
                      {hoveredElement === element.id && (
                        <p className="text-xs text-white/30 mt-0.5">{element.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onAddElement(element)}
                    className={clsx(
                      'p-1.5 rounded-lg transition-all',
                      'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30',
                      'opacity-0 group-hover:opacity-100'
                    )}
                    title="Tambah elemen"
                  >
                    <Icon name="plus" className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredElements.length === 0 && (
          <div className="text-center py-8">
            <Icon name="search" className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/30">Tidak ada elemen yang ditemukan</p>
          </div>
        )}
      </div>
    </div>
  )
}