'use client'

import type { BuilderQuestion } from '@/lib/domain/forms/builder-state'
import { Icon } from '@/components/ui/Icons'

interface QuestionMediaEditorProps {
  question: BuilderQuestion
  onUpdate: (update: Omit<Partial<BuilderQuestion>, 'questionId'>) => void
}

export function QuestionMediaEditor({ question, onUpdate }: QuestionMediaEditorProps) {
  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success && data.url) {
        onUpdate({
          imageUrl: data.url,
          mediaUrl: data.url,
          presentation: {
            ...question.presentation,
            media: { ...question.presentation?.media, type: 'image', url: data.url },
          },
        })
      } else {
        readFileAsBase64(file)
      }
    } catch (err) {
      readFileAsBase64(file)
    }
  }

  const readFileAsBase64 = (file: File) => {
    const reader = new FileReader()
    reader.onload = (evt) => {
      if (evt.target?.result) {
        const base64 = String(evt.target.result)
        onUpdate({
          imageUrl: base64,
          mediaUrl: base64,
          presentation: {
            ...question.presentation,
            media: { ...question.presentation?.media, type: 'image', url: base64 },
          },
        })
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
          <Icon name="image" className="w-4 h-4 text-cyan-400" />
          Lampiran Gambar Pertanyaan
        </span>
        <button
          type="button"
          onClick={() =>
            onUpdate({
              presentation: {
                ...question.presentation,
                media:
                  question.presentation.media?.type === 'image'
                    ? { type: 'none' }
                    : { type: 'image', url: '', caption: '' },
              },
            })
          }
          className="text-xs text-cyan-400 hover:underline font-medium"
        >
          {question.presentation.media?.type === 'image' ? 'Hapus Lampiran' : 'Tambah Lampiran'}
        </button>
      </div>

      {question.presentation.media?.type === 'image' && (
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Upload Gambar dari Komputer</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  handleFileUpload(file)
                }}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/20 file:text-cyan-300"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">URL Gambar (atau Paste Link)</label>
              <input
                type="url"
                value={question.presentation.media.url || ''}
                onChange={(e) =>
                  onUpdate({
                    presentation: {
                      ...question.presentation,
                      media: { ...question.presentation.media, type: 'image', url: e.target.value },
                    },
                  })
                }
                placeholder="https://example.com/image.jpg"
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Caption / Keterangan Gambar</label>
            <input
              type="text"
              value={question.presentation.media.caption || ''}
              onChange={(e) =>
                onUpdate({
                  presentation: {
                    ...question.presentation,
                    media: { ...question.presentation.media, type: 'image', caption: e.target.value },
                  },
                })
              }
              placeholder="Contoh: Foto fasilitas sanitasi sarana kantin"
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {question.presentation.media.url && (
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-3">
              <img
                src={question.presentation.media.url}
                alt={question.presentation.media.caption || 'Preview'}
                className="w-16 h-16 object-cover rounded-md border border-slate-700 shrink-0"
              />
              <span className="text-[11px] text-emerald-400 font-medium">✓ Gambar Terlampir & Siap Ditampilkan</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
