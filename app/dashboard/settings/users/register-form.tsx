'use client'

import { Icon } from '@/components/ui/Icons'
import { ROLE_OPTIONS, type User, type UserRole } from './users-utils'

type RegisterFormProps = {
  registerEmail: string
  registerPassword: string
  registerDisplayName: string
  registerRole: UserRole
  registerOrganization: string
  registerPhone: string
  registerPartnershipId: string
  isRegistering: boolean
  partnershipUsers: User[]
  setRegisterEmail: (v: string) => void
  setRegisterPassword: (v: string) => void
  setRegisterDisplayName: (v: string) => void
  setRegisterRole: (v: UserRole) => void
  setRegisterOrganization: (v: string) => void
  setRegisterPhone: (v: string) => void
  setRegisterPartnershipId: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export default function RegisterForm(props: RegisterFormProps) {
  const {
    registerEmail, registerPassword, registerDisplayName, registerRole,
    registerOrganization, registerPhone, registerPartnershipId,
    isRegistering, partnershipUsers,
    setRegisterEmail, setRegisterPassword, setRegisterDisplayName, setRegisterRole,
    setRegisterOrganization, setRegisterPhone, setRegisterPartnershipId,
    onSubmit,
  } = props

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 shadow-xl">
      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
        <Icon name="userPlus" className="w-5 h-5 text-cyan-400" />
        <span>Tambah User & Pendaftaran Peran Baru</span>
      </h3>

      <form onSubmit={onSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Email Akun <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="pengguna@kkntkp.id"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Password Login <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Nama Lengkap</label>
            <input
              type="text"
              placeholder="Contoh: Dr. Ir. Ahmad Sudirman..."
              value={registerDisplayName}
              onChange={(e) => setRegisterDisplayName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Pilih Peran Sistem <span className="text-rose-400">*</span>
            </label>
            <select
              value={registerRole || 'super_admin'}
              onChange={(e) => setRegisterRole(e.target.value as UserRole)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.id} value={r.id || ''}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Organisasi / Insta / Desa (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: BPOM Sulsel / Desa Sehat Bantaeng..."
              value={registerOrganization}
              onChange={(e) => setRegisterOrganization(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Nomor HP / WhatsApp</label>
            <input
              type="text"
              placeholder="08123456789"
              value={registerPhone}
              onChange={(e) => setRegisterPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5"
            />
          </div>
        </div>

        {registerRole === 'cadre' && (
          <div>
            <label className="block font-semibold text-cyan-300 mb-1.5">
              Tautkan ke Akun Mitra / Partnership Induk (Opsional)
            </label>
            <select
              value={registerPartnershipId}
              onChange={(e) => setRegisterPartnershipId(e.target.value)}
              className="w-full bg-slate-950 border border-cyan-500/40 text-slate-200 rounded-xl px-3 py-2.5"
            >
              <option value="">-- Kader Independen / Tanpa Mitra Induk --</option>
              {partnershipUsers.map((partner) => (
                <option key={partner.uid} value={partner.uid}>
                  Mitra: {partner.displayName} ({partner.organization || partner.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isRegistering}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-bold shadow-lg shadow-cyan-600/25 flex items-center gap-2"
          >
            {isRegistering ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="plus" className="w-4 h-4" />}
            <span>{isRegistering ? 'Memproses Pendaftaran...' : 'Daftarkan Akun User'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
