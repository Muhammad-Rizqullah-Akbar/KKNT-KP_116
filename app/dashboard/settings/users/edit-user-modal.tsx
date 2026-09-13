'use client'

import { Icon } from '@/components/ui/Icons'
import { ROLE_OPTIONS, type User, type UserRole } from './users-utils'

type EditUserModalProps = {
  selectedUser: User | null
  editRole: UserRole
  editOrganization: string
  editPhone: string
  isSubmitting: boolean
  setEditRole: (v: UserRole) => void
  setEditOrganization: (v: string) => void
  setEditPhone: (v: string) => void
  onCancel: () => void
  onConfirm: () => void
}

export default function EditUserModal(props: EditUserModalProps) {
  const {
    selectedUser, editRole, editOrganization, editPhone, isSubmitting,
    setEditRole, setEditOrganization, setEditPhone, onCancel, onConfirm,
  } = props

  if (!selectedUser) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fadeIn text-xs">
        <h4 className="font-bold text-base text-slate-100">Edit Profil & Peran User</h4>

        <div className="space-y-3">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Email</label>
            <input
              type="text"
              disabled
              value={selectedUser.email}
              className="w-full bg-slate-950 border border-slate-800 text-slate-400 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Role / Peran Sistem</label>
            <select
              value={editRole || 'super_admin'}
              onChange={(e) => setEditRole(e.target.value as UserRole)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.id} value={r.id || ''}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Organisasi / Instansi</label>
            <input
              type="text"
              value={editOrganization}
              onChange={(e) => setEditOrganization(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Nomor HP</label>
            <input
              type="text"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-bold flex items-center gap-2"
          >
            {isSubmitting ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="check" className="w-4 h-4" />}
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>
    </div>
  )
}
