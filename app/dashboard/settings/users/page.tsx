'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Icon, type IconName } from '@/components/ui/Icons'
import { Topbar } from '@/components/dashboard/Topbar'
import { Button } from '@/components/shared/Button'

type UserRole = 'super_admin' | 'admin' | 'internal_bpom' | 'cadre' | 'partnership' | null

type User = {
  uid: string
  email: string
  displayName: string
  role: UserRole
  organization?: string
  phone?: string
  partnershipId?: string
  partnershipName?: string
  photoURL?: string
  createdAt?: string
  updatedAt?: string
}

const ROLE_OPTIONS: { id: UserRole; label: string; icon: IconName; colorClass: string; desc: string }[] = [
  {
    id: 'super_admin',
    label: 'Super Admin',
    icon: 'crown',
    colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    desc: 'Akses penuh tanpa batas seluruh fitur, manajemen user, dan pengaturan sistem.',
  },
  {
    id: 'admin',
    label: 'Admin Systems',
    icon: 'shieldCheck',
    colorClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    desc: 'Akses membuat kuesioner V1.5, Form Builder, distribusi kode, dan rekap nasional.',
  },
  {
    id: 'internal_bpom',
    label: 'Internal BPOM',
    icon: 'award',
    colorClass: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    desc: 'Evaluator & Pengawas Resmi BPOM untuk verifikasi instrumen & laporan evaluasi.',
  },
  {
    id: 'partnership',
    label: 'Mitra / Partnership',
    icon: 'briefcase',
    colorClass: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    desc: 'Akun Organisasi/Instansi Mitra yang dapat mengelola kelompok Kader miliknya sendiri.',
  },
  {
    id: 'cadre',
    label: 'Kader Lapangan / Komunitas',
    icon: 'users',
    colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    desc: 'Kader Lapangan (Sekolah, Komunitas, Pasar, atau Desa) untuk eksekusi kuesioner publik.',
  },
]

export default function UserManagementPage() {
  const { userRole, user, userData } = useAuth()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Register State
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerDisplayName, setRegisterDisplayName] = useState('')
  const [registerRole, setRegisterRole] = useState<UserRole>('admin')
  const [registerOrganization, setRegisterOrganization] = useState('')
  const [registerPhone, setRegisterPhone] = useState('')
  const [registerPartnershipId, setRegisterPartnershipId] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  // Edit / Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editRole, setEditRole] = useState<UserRole>(null)
  const [editOrganization, setEditOrganization] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch All Users
  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/users')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengambil data user')
      }

      setUsers(data.users || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filtered Partnership list for Cadre assignment
  const partnershipUsers = useMemo(() => {
    return users.filter((u) => u.role === 'partnership')
  }, [users])

  // Registered Roles stats
  const roleStats = useMemo(() => {
    return {
      total: users.length,
      superAdmin: users.filter((u) => u.role === 'super_admin').length,
      admin: users.filter((u) => u.role === 'admin').length,
      internalBpom: users.filter((u) => u.role === 'internal_bpom').length,
      partnership: users.filter((u) => u.role === 'partnership').length,
      cadre: users.filter((u) => u.role === 'cadre').length,
    }
  }, [users])

  // Register New User Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsRegistering(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          role: registerRole,
          displayName: registerDisplayName || registerEmail.split('@')[0],
          organization: registerOrganization,
          phone: registerPhone,
          partnershipId: registerRole === 'cadre' ? registerPartnershipId : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Registrasi user baru gagal.')
      }

      setSuccessMessage(`✅ Akun ${registerEmail} (${registerRole}) berhasil didaftarkan!`)
      setRegisterEmail('')
      setRegisterPassword('')
      setRegisterDisplayName('')
      setRegisterOrganization('')
      setRegisterPhone('')
      setRegisterPartnershipId('')
      setRegisterRole('admin')

      await fetchUsers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsRegistering(false)
    }
  }

  // Delete User Handler
  const handleDelete = async (userToDelete: User) => {
    if (userToDelete.uid === user?.uid) {
      setError('Tidak dapat menghapus akun sendiri!')
      return
    }
    setSelectedUser(userToDelete)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!selectedUser) return
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/auth/users?uid=${selectedUser.uid}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghapus user.')
      }

      setUsers((prev) => prev.filter((u) => u.uid !== selectedUser.uid))
      setSuccessMessage(`Akun ${selectedUser.email} berhasil dihapus.`)
      setShowDeleteModal(false)
      setSelectedUser(null)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit Role Handler
  const handleEdit = (userToEdit: User) => {
    setSelectedUser(userToEdit)
    setEditRole(userToEdit.role)
    setEditOrganization(userToEdit.organization || '')
    setEditPhone(userToEdit.phone || '')
    setShowEditModal(true)
  }

  const confirmEdit = async () => {
    if (!selectedUser) return
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: selectedUser.uid,
          role: editRole,
          organization: editOrganization,
          phone: editPhone,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal memperbarui role.')
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.uid === selectedUser.uid
            ? { ...u, role: editRole, organization: editOrganization, phone: editPhone }
            : u
        )
      )
      setSuccessMessage(`Akun ${selectedUser.email} berhasil diperbarui.`)
      setShowEditModal(false)
      setSelectedUser(null)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const term = searchTerm.toLowerCase()
      const matchSearch =
        (u.email || '').toLowerCase().includes(term) ||
        (u.displayName || '').toLowerCase().includes(term) ||
        (u.organization || '').toLowerCase().includes(term)

      const matchRole = filterRole === 'all' || u.role === filterRole
      return matchSearch && matchRole
    })
  }, [users, searchTerm, filterRole])

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  }, [filteredUsers, currentPage])

  // Helper Badge Render
  const getRoleBadge = (role: UserRole) => {
    const found = ROLE_OPTIONS.find((r) => r.id === role)
    if (found) {
      return {
        label: found.label,
        className: found.colorClass,
        icon: found.icon,
      }
    }
    return {
      label: 'Kader Desa',
      className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      icon: 'users' as IconName,
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    return (email || 'U').charAt(0).toUpperCase()
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#070913] text-slate-100 font-sans">
      <Topbar
        title="Manajemen Pengguna & Peran (Super Admin)"
        subtitle="Registrasi dan kelola akun Super Admin, Admin, Internal BPOM, Akun Mitra Partnership, dan Kader Desa"
      />

      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Messages */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <Icon name="checkCircle" className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <Icon name="alertCircle" className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Role Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 text-center">
            <p className="text-xl font-bold font-mono text-cyan-400">{roleStats.total}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Total Terdaftar</p>
          </div>
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 text-center">
            <p className="text-xl font-bold font-mono text-amber-400">{roleStats.superAdmin}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Super Admin</p>
          </div>
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 text-center">
            <p className="text-xl font-bold font-mono text-blue-400">{roleStats.internalBpom}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Internal BPOM</p>
          </div>
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 text-center">
            <p className="text-xl font-bold font-mono text-purple-400">{roleStats.partnership}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Mitra Partnership</p>
          </div>
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 text-center">
            <p className="text-xl font-bold font-mono text-emerald-400">{roleStats.cadre}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Kader Desa</p>
          </div>
        </div>

        {/* Registration Form */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Icon name="userPlus" className="w-5 h-5 text-cyan-400" />
            <span>Tambah User & Pendaftaran Peran Baru</span>
          </h3>

          <form onSubmit={handleRegister} className="space-y-4 text-xs">
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
                  value={registerRole || 'admin'}
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

            {/* Sub-Option for Cadre: Assign to Parent Partnership Account */}
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
                  {partnershipUsers.map((p) => (
                    <option key={p.uid} value={p.uid}>
                      Mitra: {p.displayName} ({p.organization || p.email})
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

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:flex-initial">
              <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari email / nama / instansi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
              />
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">Semua Peran ({users.length})</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.id} value={r.id || ''}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Total: {filteredUsers.length} akun terdaftar
          </span>
        </div>

        {/* Users Table */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-3">
              <Icon name="loader" className="w-5 h-5 text-cyan-400 animate-spin" />
              <span>Memuat daftar akun pengguna...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 text-slate-500 space-y-2">
              <Icon name="users" className="w-12 h-12 mx-auto text-slate-700" />
              <p className="text-sm font-bold text-slate-300">Tidak Ada Akun Ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="px-4 py-3.5">Nama & Profil</th>
                    <th className="px-4 py-3.5">Email</th>
                    <th className="px-4 py-3.5">Peran (Role)</th>
                    <th className="px-4 py-3.5">Instansi / Organisasi</th>
                    <th className="px-4 py-3.5">HP / WA</th>
                    <th className="px-4 py-3.5 text-right">Aksi Superadmin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {paginatedUsers.map((u) => {
                    const badge = getRoleBadge(u.role)
                    const isSelf = u.uid === user?.uid

                    return (
                      <tr key={u.uid} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-xs font-extrabold text-white shrink-0">
                              {getInitials(u.displayName, u.email)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-100 text-sm">
                                {u.displayName || 'Tanpa Nama'}
                              </p>
                              {isSelf && <span className="text-[10px] text-cyan-400 font-bold">(Akun Anda)</span>}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-slate-300">{u.email}</td>

                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1.5 w-fit ${badge.className}`}>
                            <Icon name={badge.icon} className="w-3.5 h-3.5" />
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-300">
                          {u.organization || '-'}
                        </td>

                        <td className="px-4 py-3.5 font-mono text-slate-400">
                          {u.phone || '-'}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(u)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                              title="Edit Role & Profil"
                            >
                              <Icon name="pencil" className="w-4 h-4 text-cyan-400" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(u)}
                              disabled={isSelf}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 disabled:opacity-30 transition-colors"
                              title="Hapus Akun"
                            >
                              <Icon name="trash" className="w-4 h-4 text-rose-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Role Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Edit Peran & Profil User</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-slate-400 font-medium">{selectedUser.displayName}</p>
                <p className="text-cyan-400 font-mono mt-0.5">{selectedUser.email}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Peran (Role)</label>
                <select
                  value={editRole || 'cadre'}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
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
                <label className="block font-semibold text-slate-300 mb-1">Instansi / Organisasi</label>
                <input
                  type="text"
                  value={editOrganization}
                  onChange={(e) => setEditOrganization(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nomor Telepon / WA</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs">
                Batal
              </button>
              <button onClick={confirmEdit} disabled={isSubmitting} className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5">
                {isSubmitting ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="save" className="w-4 h-4" />}
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <Icon name="alertCircle" className="w-12 h-12 text-rose-400 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-slate-100">Hapus Akun Pengguna</h3>
              <p className="text-xs text-slate-400 mt-1">Hapus akun {selectedUser.email} secara permanen?</p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">
                Batal
              </button>
              <button onClick={confirmDelete} disabled={isSubmitting} className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}