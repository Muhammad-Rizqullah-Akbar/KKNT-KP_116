'use client'

import { Icon } from '@/components/ui/Icons'
import { colorOptions } from './form-builder-utils'

type NewGroupData = {
  title: string
  description: string
  target: string
  color: string
}

type GroupModalProps = {
  newGroupData: NewGroupData
  setNewGroupData: React.Dispatch<React.SetStateAction<NewGroupData>>
  onClose: () => void
  onConfirm: () => void
}

export default function GroupModal({ newGroupData, setNewGroupData, onClose, onConfirm }: GroupModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
            <Icon name="folder" className="w-5 h-5 text-cyan-400" /> Buat Group Baru
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/[0.05] transition-colors">
            <Icon name="x" className="w-5 h-5 text-white/50" />
          </button>
        </div>
        <p className="text-sm text-white/40 mb-6">Buat group untuk mengelompokkan beberapa formulir terkait.</p>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Nama Group <span className="text-rose-400">*</span></label>
            <input
              type="text"
              value={newGroupData.title}
              onChange={(e) => setNewGroupData({ ...newGroupData, title: e.target.value })}
              placeholder="Contoh: Program KKN Tematik 2026"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Target Pengguna <span className="text-rose-400">*</span></label>
            <input
              type="text"
              value={newGroupData.target}
              onChange={(e) => setNewGroupData({ ...newGroupData, target: e.target.value })}
              placeholder="Contoh: Mahasiswa KKN, Dosen, Umum"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Deskripsi</label>
            <textarea
              value={newGroupData.description}
              onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })}
              placeholder="Deskripsi singkat tentang group ini..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider block mb-2">Warna Group</label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setNewGroupData({ ...newGroupData, color: color.id })}
                  className={`w-10 h-10 rounded-xl transition-all ${
                    newGroupData.color === color.id
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0e0e1a] scale-110'
                      : 'hover:scale-105'
                  }`}
                >
                  <div className={`w-full h-full rounded-xl ${color.class}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/60 hover:bg-white/[0.06] transition-all"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-400 text-white font-medium hover:opacity-90 transition-all"
          >
            Buat Group
          </button>
        </div>
      </div>
    </div>
  )
}
