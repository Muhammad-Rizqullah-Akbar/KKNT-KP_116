'use client'

import { Icon } from '@/components/ui/Icons'
import { PARTNERSHIP_TYPES } from './types'
import type { UserProfile } from './types'

// ============ MODAL: DETAIL MITRA & LIST KADER BINAAN (FOR ADMIN) ============

type MitraDetailModalProps = {
  mitra: UserProfile
  linkedCadres: UserProfile[]
  onClose: () => void
  onAddCadre: (mitra: UserProfile) => void
  onInspectCadre: (cadre: UserProfile) => void
}

export function MitraDetailModal({ mitra, linkedCadres, onClose, onAddCadre, onInspectCadre }: MitraDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Icon name="building" className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">{mitra.displayName}</h3>
              <p className="text-xs text-slate-400 font-mono">{mitra.email} • {mitra.partnershipType}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Daftar Kader Lapangan Terkait ({linkedCadres.length})
            </h4>
            <button
              onClick={() => {
                const m = mitra
                onClose()
                onAddCadre(m)
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold"
            >
              + Tambah Kader Untuk Mitra Ini
            </button>
          </div>

          {linkedCadres.length === 0 ? (
            <div className="p-6 text-center text-slate-500 font-mono text-xs bg-slate-950 rounded-xl border border-slate-800">
              Belum ada kader terdaftar untuk mitra instansi ini.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden text-xs font-mono">
              {linkedCadres.map((cadre) => (
                <div key={cadre.uid} className="p-3 flex items-center justify-between hover:bg-slate-900/50">
                  <div>
                    <p className="font-bold text-slate-100">{cadre.displayName}</p>
                    <p className="text-[11px] text-slate-400">{cadre.email} • HP: {cadre.phone || '-'}</p>
                  </div>
                  <button
                    onClick={() => {
                      onClose()
                      onInspectCadre(cadre)
                    }}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[11px]"
                  >
                    Inspeksi
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ MODAL: DAFTAR MITRA BARU (SUPER ADMIN / ADMIN ONLY) ============

type CreateMitraModalProps = {
  open: boolean
  isSubmitting: boolean
  mitraName: string
  mitraType: string
  mitraEmail: string
  mitraPassword: string
  mitraPhone: string
  onClose: () => void
  onNameChange: (v: string) => void
  onTypeChange: (v: string) => void
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onPhoneChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export function CreateMitraModal({
  open,
  isSubmitting,
  mitraName,
  mitraType,
  mitraEmail,
  mitraPassword,
  mitraPhone,
  onClose,
  onNameChange,
  onTypeChange,
  onEmailChange,
  onPasswordChange,
  onPhoneChange,
  onSubmit,
}: CreateMitraModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fadeIn text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <Icon name="building" className="w-5 h-5 text-cyan-400" />
            Pendaftaran Akun Mitra Instansi Baru
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Nama Instansi / Mitra <span className="text-rose-400">*</span></label>
            <input
              type="text"
              required
              placeholder="Contoh: Puskesmas Bantaeng / SD Negeri 01..."
              value={mitraName}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Jenis Instansi Kemitraan</label>
            <select
              value={mitraType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2"
            >
              {PARTNERSHIP_TYPES.filter((t) => t.id !== 'all').map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Email Login Mitra <span className="text-rose-400">*</span></label>
            <input
              type="email"
              required
              placeholder="mitra@instansi.id"
              value={mitraEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Password Login <span className="text-rose-400">*</span></label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              value={mitraPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">No. HP / WhatsApp PIC</label>
            <input
              type="text"
              placeholder="08123456789"
              value={mitraPhone}
              onChange={(e) => onPhoneChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-bold flex items-center gap-1.5"
            >
              {isSubmitting ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="plus" className="w-4 h-4" />}
              <span>{isSubmitting ? 'Mendaftarkan...' : 'Daftarkan Mitra'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============ MODAL: DAFTAR KADER BARU ============

type CreateCadreModalProps = {
  open: boolean
  isSubmitting: boolean
  contextMitra: UserProfile | null
  partnersList: UserProfile[]
  cadreOrganization: string
  cadreEmail: string
  cadrePassword: string
  cadreName: string
  cadrePhone: string
  onClose: () => void
  onOrganizationChange: (v: string) => void
  onOrganizationSelect: (v: string) => void
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onNameChange: (v: string) => void
  onPhoneChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export function CreateCadreModal({
  open,
  isSubmitting,
  contextMitra,
  partnersList,
  cadreOrganization,
  cadreEmail,
  cadrePassword,
  cadreName,
  cadrePhone,
  onClose,
  onOrganizationSelect,
  onEmailChange,
  onPasswordChange,
  onNameChange,
  onPhoneChange,
  onSubmit,
}: CreateCadreModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fadeIn text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <Icon name="userPlus" className="w-5 h-5 text-cyan-400" />
            Pendaftaran Kader Lapangan Baru
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {contextMitra ? (
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200">
              <p className="font-bold text-[11px]">Mitra Induk Terkait:</p>
              <p className="text-sm font-extrabold text-white mt-0.5">{contextMitra.displayName}</p>
              <p className="text-[10px] font-mono text-purple-300">{contextMitra.partnershipType} • {contextMitra.email}</p>
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Pilih Mitra Instansi Induk</label>
              <select
                value={cadreOrganization}
                onChange={(e) => onOrganizationSelect(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2"
              >
                <option value="">-- Kader Independen / Tanpa Mitra Induk --</option>
                {partnersList.map((m) => (
                  <option key={m.uid} value={m.organization || m.displayName}>
                    {m.displayName} ({m.partnershipType})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Nama Lengkap Kader <span className="text-rose-400">*</span></label>
            <input
              type="text"
              required
              placeholder="Contoh: Ani Suryani, S.Pd..."
              value={cadreName}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Email Login Kader <span className="text-rose-400">*</span></label>
            <input
              type="email"
              required
              placeholder="kader@instansi.id"
              value={cadreEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Password Login <span className="text-rose-400">*</span></label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              value={cadrePassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">No. HP / WhatsApp Kader</label>
            <input
              type="text"
              placeholder="08123456789"
              value={cadrePhone}
              onChange={(e) => onPhoneChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-bold flex items-center gap-1.5"
            >
              {isSubmitting ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="userPlus" className="w-4 h-4" />}
              <span>{isSubmitting ? 'Mendaftarkan...' : 'Daftarkan Kader'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
