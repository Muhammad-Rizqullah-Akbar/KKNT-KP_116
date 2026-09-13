'use client'

import { useState, useRef } from 'react'
import { Icon } from '@/components/ui/Icons'
import { uploadOptimizedArticleImage } from '@/lib/infra/storage'
import { useToast } from '@/lib/hooks'
import type { HeroData } from './settings-utils'

type HeroSectionProps = {
  heroForm: HeroData
  setHeroForm: React.Dispatch<React.SetStateAction<HeroData>>
  saving: boolean
  onSave: () => void
}

export default function HeroSection({ heroForm, setHeroForm, saving, onSave }: HeroSectionProps) {
  const [uploadingHeroBg, setUploadingHeroBg] = useState(false)
  const heroFileInputRef = useRef<HTMLInputElement>(null)
  const { show } = useToast()

  const handleHeroBgUpload = async (file: File) => {
    setUploadingHeroBg(true)
    try {
      const res = await uploadOptimizedArticleImage(file, 'settings')
      setHeroForm(prev => ({ ...prev, bgImageUrl: res.url }))
      show(`Foto background Hero terkompresi (${res.savedPercent}% hemat storage)!`)
    } catch (error: any) {
      alert('Gagal mengunggah foto background: ' + error.message)
    } finally {
      setUploadingHeroBg(false)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
              <Icon name="sparkles" className="w-5 h-5 text-cyan-400" />
              Pengaturan Hero Section
            </h3>
            <p className="text-xs text-white/40 mt-1">Ubah judul, deskripsi, dan gambar latar utama</p>
          </div>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25 flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="save" className="w-4 h-4" />}
            Simpan Hero
          </button>
        </div>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Teks Badge Kemitraan (Atas Judul)</label>
          <input
            type="text"
            value={heroForm.badgeText || ''}
            onChange={(e) => setHeroForm({ ...heroForm, badgeText: e.target.value })}
            placeholder="Contoh: Universitas Hasanuddin x BPOM RI"
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Prefix Judul</label>
            <input
              type="text"
              value={heroForm.titlePrefix}
              onChange={(e) => setHeroForm({ ...heroForm, titlePrefix: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Judul Utama (Gradient)</label>
            <input
              type="text"
              value={heroForm.titleGradient}
              onChange={(e) => setHeroForm({ ...heroForm, titleGradient: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Suffix Judul</label>
            <input
              type="text"
              value={heroForm.titleSuffix}
              onChange={(e) => setHeroForm({ ...heroForm, titleSuffix: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Deskripsi Singkat Hero</label>
          <textarea
            value={heroForm.description}
            onChange={(e) => setHeroForm({ ...heroForm, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none resize-none"
          />
        </div>

        {/* Metrik Statistik Hero */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/[0.05]">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Metrik 1 (Jumlah Kader/Mahasiswa)</label>
            <input
              type="text"
              value={heroForm.statParticipants || '70+'}
              onChange={(e) => setHeroForm({ ...heroForm, statParticipants: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-cyan-300 font-bold text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Metrik 2 (Jumlah Desa Binaan)</label>
            <input
              type="text"
              value={heroForm.statVillages || '10'}
              onChange={(e) => setHeroForm({ ...heroForm, statVillages: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-emerald-300 font-bold text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Metrik 3 (Label Mitra Utama)</label>
            <input
              type="text"
              value={heroForm.statPartnerLabel || 'BPOM'}
              onChange={(e) => setHeroForm({ ...heroForm, statPartnerLabel: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-blue-300 font-bold text-sm focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-white/[0.05]">
          <label className="text-xs text-white/50 uppercase tracking-wider block mb-2">Foto Background Hero</label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-48 h-28 rounded-xl overflow-hidden border border-white/10 bg-black/40 shrink-0">
              <img
                src={heroForm.bgImageUrl || '/background.jpg'}
                alt="Background Preview"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = '/background.jpg' }}
              />
            </div>
            <div className="space-y-2 flex-1 w-full">
              <input
                ref={heroFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleHeroBgUpload(file)
                }}
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={heroForm.bgImageUrl}
                  onChange={(e) => setHeroForm({ ...heroForm, bgImageUrl: e.target.value })}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-xs focus:outline-none"
                  placeholder="URL Gambar"
                />
                <button
                  type="button"
                  disabled={uploadingHeroBg}
                  onClick={() => heroFileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 text-xs font-medium hover:bg-cyan-600/30 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {uploadingHeroBg ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="upload" className="w-4 h-4" />}
                  <span>{uploadingHeroBg ? 'Mengunggah...' : 'Upload Foto'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
