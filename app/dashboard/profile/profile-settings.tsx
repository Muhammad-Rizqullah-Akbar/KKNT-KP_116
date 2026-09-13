'use client'

import { Icon } from '@/components/ui/Icons'

type ProfileSettingsProps = {
  editDisplayName: string
  editOrganization: string
  editPartnershipType: string
  editPhone: string
  isSaving: boolean
  setEditDisplayName: (v: string) => void
  setEditOrganization: (v: string) => void
  setEditPartnershipType: (v: string) => void
  setEditPhone: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export default function ProfileSettings(props: ProfileSettingsProps) {
  const {
    editDisplayName, editOrganization, editPartnershipType, editPhone, isSaving,
    setEditDisplayName, setEditOrganization, setEditPartnershipType, setEditPhone, onSubmit,
  } = props

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 max-w-2xl">
      <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-800">
        <Icon name="settings" className="w-5 h-5 text-purple-400" />
        <span>Pengaturan Profil & Instansi</span>
      </h3>

      <form onSubmit={onSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-300 mb-1.5">Nama Lengkap / Nama Tampilan</label>
          <input
            type="text"
            required
            value={editDisplayName}
            onChange={(e) => setEditDisplayName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Jenis Instansi / Kemitraan</label>
            <select
              value={editPartnershipType}
              onChange={(e) => setEditPartnershipType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-400 cursor-pointer"
            >
              <option value="Sekolah">Sekolah / Kampus</option>
              <option value="Kelurahan / Desa">Kelurahan / Kantor Desa</option>
              <option value="Pasar">Pasar Tradisional / Modern</option>
              <option value="Puskesmas / Posyandu">Puskesmas / Posyandu</option>
              <option value="Komunitas / Ormas">Komunitas / Ormas / PKK</option>
              <option value="Instansi Pemerintah">Instansi Pemerintah / BPOM</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Nama Instansi / Lembaga</label>
            <input
              type="text"
              value={editOrganization}
              onChange={(e) => setEditOrganization(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-300 mb-1.5">No. HP / WhatsApp</label>
          <input
            type="text"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-400"
          />
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-600/20 flex items-center gap-2 transition-all"
          >
            {isSaving ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="check" className="w-4 h-4" />}
            <span>Simpan Perubahan Profil</span>
          </button>
        </div>
      </form>
    </div>
  )
}
