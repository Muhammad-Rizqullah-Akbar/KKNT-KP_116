'use client'

import { FlexibleQuestion } from './../shared/ElementTypes'

interface InfoTabProps {
  formTitle: string
  elements: FlexibleQuestion[]
}

export function InfoTab({ formTitle, elements }: InfoTabProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
        <h4 className="text-sm font-medium text-white mb-2">Informasi Formulir</h4>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider block mb-1">
              Judul Formulir
            </label>
            <input
              type="text"
              value={formTitle}
              disabled
              className="w-full px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/60 cursor-not-allowed"
            />
            <p className="text-xs text-white/30 mt-1">Ubah judul di toolbar utama</p>
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider block mb-1">
              Jumlah Pertanyaan
            </label>
            <p className="text-white/80 font-medium">{elements.length} pertanyaan</p>
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider block mb-1">
              Tipe Pertanyaan
            </label>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const types = elements.reduce((acc, el) => {
                  const type = el.answerType || 'unknown'
                  acc[type] = (acc[type] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
                
                return Object.entries(types).map(([type, count]) => (
                  <span key={type} className="px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05] text-xs text-white/50">
                    {type}: {count}
                  </span>
                ))
              })()}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
        <h4 className="text-sm font-medium text-cyan-400 mb-2">💡 Tips</h4>
        <ul className="text-xs text-white/50 space-y-1">
          <li>• Atur validasi jawaban di tab "Validasi"</li>
          <li>• Bagi form menjadi tahapan di tab "Tahapan"</li>
          <li>• Atur sistem penilaian di tab "Penilaian"</li>
        </ul>
      </div>
    </div>
  )
}
