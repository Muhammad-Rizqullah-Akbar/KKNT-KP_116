'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import { safeFetchJson } from '@/lib/shared/safeFetch'
import { useAuth } from '@/context/AuthContext'

type UserItem = {
  uid: string
  email: string
  displayName: string
  role: string
  organization?: string
  phone?: string
  partnershipType?: string
  createdAt?: string
}

export default function UserManagementPage() {
  const { userData } = useAuth()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  // Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'cadre',
    organization: '',
    phone: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await safeFetchJson('/api/v1_5/users')
      if (res.ok && res.data && Array.isArray(res.data.users)) {
        setUsers(res.data.users)
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mendaftarkan pengguna.')
      }

      setSuccessMsg('Pengguna baru berhasil didaftarkan!')
      setRegisterForm({
        email: '',
        password: '',
        displayName: '',
        role: 'cadre',
        organization: '',
        phone: '',
      })
      setTimeout(() => {
        setIsRegisterOpen(false)
        setSuccessMsg('')
      }, 1500)
      fetchUsers()
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.organization?.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="flex flex-col min-h-screen bg-[#06060E] text-white">
      <Topbar
        title="Manajemen Pengguna & Hak Akses"
        subtitle="Kelola akun pengguna, registrasi kader, dan otorisasi role sistem"
      />

      <div className="flex-1 p-6 space-y-6">
        {/* ACTION BAR */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#080812] border border-white/[0.05] p-4 rounded-2xl">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Icon name="search" className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Cari nama, email, atau instansi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-cyan-500/40"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#080812]">Semua Role</option>
              <option value="super_admin" className="bg-[#080812]">Super Admin</option>
              <option value="admin" className="bg-[#080812]">Admin</option>
              <option value="internal_bpom" className="bg-[#080812]">Internal BPOM</option>
              <option value="partnership" className="bg-[#080812]">Mitra / Partnership</option>
              <option value="cadre" className="bg-[#080812]">Kader Lapangan</option>
            </select>
          </div>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-semibold text-white transition-all shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2"
          >
            <Icon name="plus" className="w-4 h-4" />
            <span>Daftarkan Akun Baru</span>
          </button>
        </div>

        {/* USERS TABLE */}
        <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-base text-white">Daftar Pengguna Terdaftar ({filteredUsers.length})</h3>
            <button onClick={fetchUsers} className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-white/50 hover:text-white transition-colors">
              <Icon name="refresh" className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-white/40">Memuat data pengguna...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-white/40">Tidak ada pengguna yang sesuai dengan filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Nama & Email</th>
                    <th className="px-4 py-3">Role Akses</th>
                    <th className="px-4 py-3">Organisasi / Instansi</th>
                    <th className="px-4 py-3">Kontak</th>
                    <th className="px-4 py-3">Terdaftar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{u.displayName || u.email?.split('@')[0]}</div>
                        <div className="text-white/40 font-mono text-[11px]">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                          u.role === 'super_admin' ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' :
                          u.role === 'admin' ? 'bg-violet-500/10 text-violet-300 border-violet-500/30' :
                          u.role === 'internal_bpom' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                          u.role === 'partnership' ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' :
                          'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{u.organization || '-'}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono">{u.phone || '-'}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* REGISTER MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="font-display text-lg font-semibold text-white">Daftarkan Pengguna Baru</h3>
              <button onClick={() => setIsRegisterOpen(false)} className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center">
                <Icon name="x" className="w-5 h-5 text-white/50" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  placeholder="user@instansi.go.id"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={registerForm.displayName}
                    onChange={(e) => setRegisterForm({ ...registerForm, displayName: e.target.value })}
                    placeholder="Nama Pengguna"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Role System *</label>
                  <select
                    value={registerForm.role}
                    onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="cadre" className="bg-[#080812]">Kader Lapangan</option>
                    <option value="partnership" className="bg-[#080812]">Mitra / Partnership</option>
                    {userData?.role === 'super_admin' && (
                      <>
                        <option value="internal_bpom" className="bg-[#080812]">Internal BPOM</option>
                        <option value="admin" className="bg-[#080812]">Admin</option>
                        <option value="super_admin" className="bg-[#080812]">Super Admin</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Organisasi / Instansi</label>
                  <input
                    type="text"
                    value={registerForm.organization}
                    onChange={(e) => setRegisterForm({ ...registerForm, organization: e.target.value })}
                    placeholder="Contoh: UNHAS / BPOM"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    placeholder="0812..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-sm text-white/70"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? 'Mendaftarkan...' : 'Simpan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
