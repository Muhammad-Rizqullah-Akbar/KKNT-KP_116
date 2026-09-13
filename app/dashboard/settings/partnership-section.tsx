'use client'

import { Icon } from '@/components/ui/Icons'
import type { PartnershipData } from './settings-utils'

type PartnershipSectionProps = {
  partnershipForm: PartnershipData
  setPartnershipForm: React.Dispatch<React.SetStateAction<PartnershipData>>
  saving: boolean
  onSave: () => void
}

export default function PartnershipSection({ partnershipForm, setPartnershipForm, saving, onSave }: PartnershipSectionProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25 flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="save" className="w-4 h-4" />}
          Simpan Partnership
        </button>
      </div>

      {/* KKN UH Card */}
      <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2 border-b border-white/[0.05] pb-3">
          <Icon name="rocket" className="w-5 h-5 text-cyan-400" />
          Program Kuliah Kerja Nyata (KKN-UH)
        </h3>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Judul Program</label>
          <input
            type="text"
            value={partnershipForm.kkn.title}
            onChange={(e) => setPartnershipForm({
              ...partnershipForm,
              kkn: { ...partnershipForm.kkn, title: e.target.value }
            })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Deskripsi Ringkas</label>
          <textarea
            value={partnershipForm.kkn.description}
            onChange={(e) => setPartnershipForm({
              ...partnershipForm,
              kkn: { ...partnershipForm.kkn, description: e.target.value }
            })}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Peserta Aktif</label>
            <input
              type="number"
              value={partnershipForm.kkn.participants}
              onChange={(e) => setPartnershipForm({
                ...partnershipForm,
                kkn: { ...partnershipForm.kkn, participants: parseInt(e.target.value) || 0 }
              })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Desa Binaan</label>
            <input
              type="number"
              value={partnershipForm.kkn.villages}
              onChange={(e) => setPartnershipForm({
                ...partnershipForm,
                kkn: { ...partnershipForm.kkn, villages: parseInt(e.target.value) || 0 }
              })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider block mb-2">Program Highlights</label>
          {partnershipForm.kkn.highlights.map((highlight, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={highlight}
                onChange={(e) => {
                  const newHighlights = [...partnershipForm.kkn.highlights]
                  newHighlights[index] = e.target.value
                  setPartnershipForm({
                    ...partnershipForm,
                    kkn: { ...partnershipForm.kkn, highlights: newHighlights }
                  })
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const newHighlights = partnershipForm.kkn.highlights.filter((_, i) => i !== index)
                  setPartnershipForm({
                    ...partnershipForm,
                    kkn: { ...partnershipForm.kkn, highlights: newHighlights }
                  })
                }}
                className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                <Icon name="trash" className="w-4 h-4 text-white/30 hover:text-red-400" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              setPartnershipForm({
                ...partnershipForm,
                kkn: {
                  ...partnershipForm.kkn,
                  highlights: [...partnershipForm.kkn.highlights, '']
                }
              })
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 mt-1"
          >
            <Icon name="plus" className="w-3 h-3" /> Tambah Highlight
          </button>
        </div>
      </div>

      {/* Card BPOM */}
      <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2 border-b border-white/[0.05] pb-3">
          <Icon name="gem" className="w-5 h-5 text-violet-400" />
          Mitra Strategis BPOM RI
        </h3>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Judul Instansi</label>
          <input
            type="text"
            value={partnershipForm.bpom.title}
            onChange={(e) => setPartnershipForm({
              ...partnershipForm,
              bpom: { ...partnershipForm.bpom, title: e.target.value }
            })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Deskripsi Kolaborasi</label>
          <textarea
            value={partnershipForm.bpom.description}
            onChange={(e) => setPartnershipForm({
              ...partnershipForm,
              bpom: { ...partnershipForm.bpom, description: e.target.value }
            })}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider block mb-2">Fitur & Fasilitas Kolaborasi</label>
          {partnershipForm.bpom.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={feature}
                onChange={(e) => {
                  const newFeatures = [...partnershipForm.bpom.features]
                  newFeatures[index] = e.target.value
                  setPartnershipForm({
                    ...partnershipForm,
                    bpom: { ...partnershipForm.bpom, features: newFeatures }
                  })
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const newFeatures = partnershipForm.bpom.features.filter((_, i) => i !== index)
                  setPartnershipForm({
                    ...partnershipForm,
                    bpom: { ...partnershipForm.bpom, features: newFeatures }
                  })
                }}
                className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                <Icon name="trash" className="w-4 h-4 text-white/30 hover:text-red-400" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              setPartnershipForm({
                ...partnershipForm,
                bpom: {
                  ...partnershipForm.bpom,
                  features: [...partnershipForm.bpom.features, '']
                }
              })
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 mt-1"
          >
            <Icon name="plus" className="w-3 h-3" /> Tambah Fitur
          </button>
        </div>
      </div>
    </div>
  )
}
