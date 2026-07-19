'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Icon } from '@/components/ui/Icons'
import { Topbar } from '@/components/dashboard/Topbar'
import { Button } from '@/components/shared/Button'

type User = {
  uid: string
  email: string
  displayName: string
  role: 'admin' | 'super_admin' | null
  photoURL?: string
  createdAt?: string
  updatedAt?: string
}

export default function UserManagementPage() {
  const { userRole, user } = useAuth()
  
  // ============ ALL HOOKS MUST BE AT TOP LEVEL ============
  // Tidak boleh ada conditional sebelum hooks!
  
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'super_admin'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Form Register State
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerDisplayName, setRegisterDisplayName] = useState('')
  const [registerRole, setRegisterRole] = useState<'admin' | 'super_admin'>('admin')
  const [isRegistering, setIsRegistering] = useState(false)

  // Edit/Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editRole, setEditRole] = useState<'admin' | 'super_admin' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ============ FETCH USERS ============
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

  // ============ AFTER ALL HOOKS, THEN DO CONDITIONAL RETURN ============
  // Hooks sudah dipanggil di atas, sekarang baru boleh conditional return
  
  if (userRole !== 'super_admin') {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar title="Akses Ditolak" subtitle="Halaman ini hanya untuk Super Admin" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Icon name="lock" className="w-16 h-16 text-rose-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">Akses Ditolak</h2>
            <p className="text-white/50 mt-2">Hanya Super Admin yang dapat mengakses halaman ini.</p>
            <Button
              variant="primary"
              className="mt-6"
              onClick={() => window.location.href = '/dashboard/overview'}
            >
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ============ REGISTER USER ============
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsRegistering(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          role: registerRole,
          displayName: registerDisplayName || registerEmail.split('@')[0],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registrasi gagal')
      }

      setSuccessMessage(`✅ User ${registerEmail} berhasil didaftarkan!`)
      setRegisterEmail('')
      setRegisterPassword('')
      setRegisterDisplayName('')
      setRegisterRole('admin')
      
      await fetchUsers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsRegistering(false)
    }
  }

  // ============ DELETE USER ============
  const handleDelete = async (userToDelete: User) => {
    if (userToDelete.uid === user?.uid) {
      setError('Tidak bisa menghapus akun sendiri!')
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

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menghapus user')
      }

      setUsers(prev => prev.filter(u => u.uid !== selectedUser.uid))
      setSuccessMessage(`User ${selectedUser.email} berhasil dihapus`)
      setShowDeleteModal(false)
      setSelectedUser(null)
      
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============ UPDATE ROLE ============
  const handleEdit = (userToEdit: User) => {
    setSelectedUser(userToEdit)
    setEditRole(userToEdit.role)
    setShowEditModal(true)
  }

  const confirmEdit = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: selectedUser.uid,
          role: editRole,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Gagal update role')
      }

      setUsers(prev => prev.map(u => 
        u.uid === selectedUser.uid ? { ...u, role: editRole } : u
      ))
      setSuccessMessage(`Role ${selectedUser.email} berhasil diperbarui`)
      setShowEditModal(false)
      setSelectedUser(null)
      
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============ FILTER & PAGINATION ============
  const filteredUsers = users.filter(u => {
    const matchSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // ============ RENDER HELPERS ============
  const getRoleBadge = (role: string | null) => {
    if (role === 'super_admin') {
      return {
        label: 'Super Admin',
        className: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        icon: 'crown',
      }
    } else if (role === 'admin') {
      return {
        label: 'Admin',
        className: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        icon: 'shieldCheck',
      }
    }
    return {
      label: 'User',
      className: 'text-white/40 bg-white/[0.05] border-white/[0.05]',
      icon: 'user',
    }
  }

  const getInitials = (name: string, email: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    return email.charAt(0).toUpperCase()
  }

  // ============ RENDER ============
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar 
        title="Manajemen User" 
        subtitle="Daftar dan kelola user yang memiliki akses dashboard" 
      />

      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Success / Error Messages */}
          {successMessage && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
              <Icon name="checkCircle" className="w-4 h-4" />
              {successMessage}
            </div>
          )}

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
              <Icon name="alertCircle" className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* ============ FORM REGISTRASI USER ============ */}
          <div className="bg-[#080812] border border-white/[0.05] rounded-2xl p-6 mb-6">
            <h3 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Icon name="userPlus" className="w-5 h-5 text-cyan-400" />
              Tambah User Baru
            </h3>

            <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">
                  Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                  placeholder="user@kkntkp.id"
                />
              </div>

              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">
                  Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">
                  Nama (opsional)
                </label>
                <input
                  type="text"
                  value={registerDisplayName}
                  onChange={(e) => setRegisterDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                  placeholder="Nama user"
                />
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">
                    Role <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={registerRole}
                    onChange={(e) => setRegisterRole(e.target.value as 'admin' | 'super_admin')}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/70 focus:outline-none focus:border-cyan-400/40 transition-all"
                  >
                    <option value="admin" className="bg-[#080812]">Admin</option>
                    <option value="super_admin" className="bg-[#080812]">Super Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-all shadow-lg shadow-cyan-600/25 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                >
                  {isRegistering ? (
                    <Icon name="loader" className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon name="plus" className="w-4 h-4" />
                  )}
                  {isRegistering ? 'Memproses...' : 'Tambah User'}
                </button>
              </div>
            </form>

            <p className="text-[10px] text-white/25 mt-3">
              <span className="text-cyan-400">Admin:</span> Akses ke semua fitur kecuali manajemen user
              <span className="mx-2">•</span>
              <span className="text-amber-400">Super Admin:</span> Akses penuh termasuk manajemen user
            </p>
          </div>

          {/* ============ FILTER ============ */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  type="text"
                  placeholder="Cari user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-400/40 transition-all w-64"
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as 'all' | 'admin' | 'super_admin')}
                className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer"
              >
                <option value="all" className="bg-[#080812]">Semua Role</option>
                <option value="super_admin" className="bg-[#080812]">Super Admin</option>
                <option value="admin" className="bg-[#080812]">Admin</option>
              </select>

              <button
                onClick={fetchUsers}
                className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all"
                title="Refresh"
              >
                <Icon name="refreshCw" className="w-4 h-4 text-white/40" />
              </button>
            </div>

            <div className="text-sm text-white/30">
              Total: {filteredUsers.length} user
            </div>
          </div>

          {/* ============ TABLE ============ */}
          <div className="rounded-2xl bg-[#080812] border border-white/[0.05] overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Icon name="loader" className="w-8 h-8 text-cyan-400 animate-spin" />
                <span className="ml-3 text-white/40">Memuat data...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="users" className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/30">Tidak ada user ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                      <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">User</th>
                      <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Email</th>
                      <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Role</th>
                      <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Bergabung</th>
                      <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((u) => {
                      const roleInfo = getRoleBadge(u.role)
                      const isCurrentUser = u.uid === user?.uid
                      return (
                        <tr key={u.uid} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {getInitials(u.displayName, u.email)}
                              </div>
                              <div>
                                <p className="text-white font-medium">{u.displayName}</p>
                                {isCurrentUser && (
                                  <span className="text-[10px] text-cyan-400">(Anda)</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-white/60">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full border text-xs flex items-center gap-1.5 w-fit ${roleInfo.className}`}>
                              <Icon name={roleInfo.icon as any} className="w-3 h-3" />
                              {roleInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white/40 text-xs">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            }) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEdit(u)}
                                className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors group"
                                title="Edit Role"
                              >
                                <Icon name="pencil" className="w-4 h-4 text-white/40 group-hover:text-cyan-400 transition-colors" />
                              </button>
                              <button
                                onClick={() => handleDelete(u)}
                                disabled={isCurrentUser}
                                className={`p-1.5 rounded-lg transition-colors group ${
                                  isCurrentUser 
                                    ? 'opacity-30 cursor-not-allowed' 
                                    : 'hover:bg-red-500/10'
                                }`}
                                title={isCurrentUser ? 'Tidak bisa hapus sendiri' : 'Hapus User'}
                              >
                                <Icon name="trash" className={`w-4 h-4 ${
                                  isCurrentUser 
                                    ? 'text-white/20' 
                                    : 'text-white/40 group-hover:text-red-400 transition-colors'
                                }`} />
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.05]">
                <p className="text-xs text-white/35">
                  Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredUsers.length)} dari {filteredUsers.length} user
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-white/40 hover:text-white hover:border-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Icon name="chevronLeft" className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) pageNum = i + 1
                    else if (currentPage <= 3) pageNum = i + 1
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                    else pageNum = currentPage - 2 + i
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                          currentPage === pageNum
                            ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                            : 'bg-white/[0.02] border border-white/[0.05] text-white/40 hover:text-white hover:border-white/10'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="text-white/20">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.05] text-xs text-white/40 hover:text-white hover:border-white/10 transition-all"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-white/40 hover:text-white hover:border-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Icon name="chevronRight" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============ EDIT ROLE MODAL ============ */}
      {showEditModal && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => {
            if (!isSubmitting) setShowEditModal(false)
          }}
        >
          <div
            className="relative w-full max-w-md bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-white">
                Edit Role User
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isSubmitting}
                className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center transition-colors disabled:opacity-30"
              >
                <Icon name="x" className="w-5 h-5 text-white/50" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <p className="text-xs text-white/30">User</p>
                <p className="text-white font-medium">{selectedUser.displayName}</p>
                <p className="text-sm text-white/40">{selectedUser.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Role
                </label>
                <select
                  value={editRole || ''}
                  onChange={(e) => setEditRole(e.target.value as 'admin' | 'super_admin' | null)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/70 focus:outline-none focus:border-cyan-400/40 transition-all"
                >
                  <option value="null" className="bg-[#0e0e1a]">User (tanpa akses)</option>
                  <option value="admin" className="bg-[#0e0e1a]">Admin</option>
                  <option value="super_admin" className="bg-[#0e0e1a]">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-white/[0.06]">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 hover:text-white transition-all disabled:opacity-30"
              >
                Batal
              </button>
              <button
                onClick={confirmEdit}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Icon name="loader" className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon name="save" className="w-4 h-4" />
                )}
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ DELETE CONFIRMATION MODAL ============ */}
      {showDeleteModal && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => {
            if (!isSubmitting) setShowDeleteModal(false)
          }}
        >
          <div
            className="relative w-full max-w-md bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Icon name="alertCircle" className="w-8 h-8 text-rose-400" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">
                Hapus User
              </h3>
              <p className="text-sm text-white/50 mb-2">
                Apakah Anda yakin ingin menghapus user ini?
              </p>
              <p className="text-sm text-white/30 font-mono">
                {selectedUser.email}
              </p>
              <p className="text-xs text-rose-400/60 mt-2">
                ⚠️ Tindakan ini tidak dapat dibatalkan!
              </p>
            </div>

            <div className="flex gap-3 justify-center mt-6 pt-4 border-t border-white/[0.06]">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 hover:text-white transition-all disabled:opacity-30"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-medium text-white transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Icon name="loader" className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon name="trash" className="w-4 h-4" />
                )}
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}