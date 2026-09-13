'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/infra/safe-fetch'
import { Icon } from '@/components/ui/Icons'
import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/lib/hooks'
import { filterAndSortUsers, type User, type UserRole } from './users-utils'
import RegisterForm from './register-form'
import UsersTable from './users-table'
import DeleteUserModal from './delete-user-modal'
import BulkDeleteModal from './bulk-delete-modal'
import EditUserModal from './edit-user-modal'

export default function UserManagementPage() {
  const { userRole, user, userData, loading: authLoading } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!authLoading) {
      const effectiveRole = userRole || userData?.role
      if (effectiveRole !== 'super_admin') {
        if (effectiveRole === 'partnership') {
          router.replace('/dashboard/partnership')
        } else if (effectiveRole === 'cadre') {
          router.replace('/dashboard/monitoring')
        } else {
          router.replace('/dashboard/overview')
        }
      }
    }
  }, [authLoading, userRole, userData, router])

  const {
    data: users = [],
    isLoading: loading,
    error: usersError,
    refetch,
  } = useQuery<User[]>({
    queryKey: queryKeys.users.list,
    queryFn: async () => {
      const { ok, data, error: fetchErr } = await safeFetchJson<{ users?: User[] }>('/api/auth/users')
      if (!ok || !data) {
        throw new Error(fetchErr || 'Gagal mengambil data user')
      }
      return data.users || []
    },
  })

  const [error, setError] = useState<string | null>(null)
  const { visible, message, show } = useToast()

  // Surface fetch errors (from useQuery) alongside mutation errors
  const displayError = error ?? (usersError ? (usersError as Error).message : null)

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Checkbox Selection for Bulk Actions
  const [selectedUids, setSelectedUids] = useState<string[]>([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)

  // Register State
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerDisplayName, setRegisterDisplayName] = useState('')
  const [registerRole, setRegisterRole] = useState<UserRole>('super_admin')
  const [registerOrganization, setRegisterOrganization] = useState('')
  const [registerPhone, setRegisterPhone] = useState('')
  const [registerPartnershipId, setRegisterPartnershipId] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  // Edit / Delete Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editRole, setEditRole] = useState<UserRole>('super_admin')
  const [editOrganization, setEditOrganization] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filtered Partnership list for Cadre assignment
  const partnershipUsers = useMemo(() => {
    return users.filter((account) => account.role === 'partnership')
  }, [users])

  // Hierarchically Sorted Users List
  const filteredUsers = useMemo(() => {
    return filterAndSortUsers(users, searchTerm, filterRole)
  }, [users, searchTerm, filterRole])

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  }, [filteredUsers, currentPage])

  // Bulk Selection Handlers
  const isAllPaginatedSelected = useMemo(() => {
    const selectable = paginatedUsers.filter((u) => u.uid !== user?.uid)
    if (selectable.length === 0) return false
    return selectable.every((u) => selectedUids.includes(u.uid))
  }, [paginatedUsers, selectedUids, user])

  const toggleSelectAll = () => {
    const selectableUids = paginatedUsers.filter((u) => u.uid !== user?.uid).map((u) => u.uid)
    if (isAllPaginatedSelected) {
      setSelectedUids((prev) => prev.filter((id) => !selectableUids.includes(id)))
    } else {
      setSelectedUids((prev) => Array.from(new Set([...prev, ...selectableUids])))
    }
  }

  const toggleSelectUser = (uid: string) => {
    if (uid === user?.uid) return
    setSelectedUids((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    )
  }

  // Single Delete Handler
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

      queryClient.setQueryData<User[]>(['users'], (prev = []) =>
        prev.filter((u) => u.uid !== selectedUser.uid)
      )
      setSelectedUids((prev) => prev.filter((id) => id !== selectedUser.uid))
      show(`✅ Akun ${selectedUser.email} berhasil dihapus.`)
      setShowDeleteModal(false)
      setSelectedUser(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Bulk Delete Handler
  const confirmBulkDelete = async () => {
    if (selectedUids.length === 0) return
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uids: selectedUids }),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghapus daftar user terpilih.')
      }

      queryClient.setQueryData<User[]>(['users'], (prev = []) =>
        prev.filter((u) => !selectedUids.includes(u.uid))
      )
      show(`✅ Berhasil menghapus ${data.deletedCount || selectedUids.length} akun pengguna terpilih.`)
      setSelectedUids([])
      setShowBulkDeleteModal(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Register New User Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsRegistering(true)
    setError(null)

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

      show(`✅ Akun ${registerEmail} (${registerRole}) berhasil didaftarkan!`)
      setRegisterEmail('')
      setRegisterPassword('')
      setRegisterDisplayName('')
      setRegisterOrganization('')
      setRegisterPhone('')
      setRegisterPartnershipId('')
      setRegisterRole('super_admin')

      queryClient.invalidateQueries({ queryKey: queryKeys.users.list })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsRegistering(false)
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

      queryClient.setQueryData<User[]>(['users'], (prev = []) =>
        prev.map((u) =>
          u.uid === selectedUser.uid
            ? { ...u, role: editRole, organization: editOrganization, phone: editPhone }
            : u
        )
      )
      show(`✅ Akun ${selectedUser.email} berhasil diperbarui.`)
      setShowEditModal(false)
      setSelectedUser(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#06060E] text-slate-100">
      <Topbar
        title="Manajemen Pengguna & Hak Akses"
        subtitle="Urutan Hierarki: Super Admin → Admin → BPOM → Mitra → (Kader Mitra). Lengkap dengan Hapus Masal."
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Banner Informasional Superadmin */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icon name="crown" className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-sm text-amber-200">Mode Otoritas Hierarki (Super Admin)</p>
              <p className="text-amber-400/80 mt-0.5">
                Urutan daftar otomatis disusun berurutan: <span className="text-white font-mono font-bold">Super Admin → Admin → BPOM → Mitra → (Kader milik Mitra)</span>.
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold flex items-center gap-1.5 transition-all text-xs shrink-0"
          >
            <Icon name="refreshCw" className="w-3.5 h-3.5 text-amber-300" />
            <span>Segarkan</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {displayError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3 animate-fadeIn">
            <Icon name="alertCircle" className="w-5 h-5 shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        {visible && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3 animate-fadeIn">
            <Icon name="checkCircle" className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{message}</span>
          </div>
        )}

        {/* Registration Form */}
        <RegisterForm
          registerEmail={registerEmail}
          registerPassword={registerPassword}
          registerDisplayName={registerDisplayName}
          registerRole={registerRole}
          registerOrganization={registerOrganization}
          registerPhone={registerPhone}
          registerPartnershipId={registerPartnershipId}
          isRegistering={isRegistering}
          partnershipUsers={partnershipUsers}
          setRegisterEmail={setRegisterEmail}
          setRegisterPassword={setRegisterPassword}
          setRegisterDisplayName={setRegisterDisplayName}
          setRegisterRole={setRegisterRole}
          setRegisterOrganization={setRegisterOrganization}
          setRegisterPhone={setRegisterPhone}
          setRegisterPartnershipId={setRegisterPartnershipId}
          onSubmit={handleRegister}
        />

        {/* Filter + Table */}
        <UsersTable
          users={users}
          filteredUsers={filteredUsers}
          paginatedUsers={paginatedUsers}
          loading={loading}
          currentUserUid={user?.uid}
          searchTerm={searchTerm}
          filterRole={filterRole}
          selectedUids={selectedUids}
          isAllPaginatedSelected={isAllPaginatedSelected}
          currentPage={currentPage}
          totalPages={totalPages}
          setSearchTerm={setSearchTerm}
          setFilterRole={setFilterRole}
          setShowBulkDeleteModal={setShowBulkDeleteModal}
          toggleSelectAll={toggleSelectAll}
          toggleSelectUser={toggleSelectUser}
          onEdit={handleEdit}
          onDelete={handleDelete}
          setCurrentPage={setCurrentPage}
        />
      </div>

      {/* SINGLE DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedUser && (
        <DeleteUserModal
          selectedUser={selectedUser}
          isSubmitting={isSubmitting}
          onCancel={() => {
            setShowDeleteModal(false)
            setSelectedUser(null)
          }}
          onConfirm={confirmDelete}
        />
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {showBulkDeleteModal && selectedUids.length > 0 && (
        <BulkDeleteModal
          selectedCount={selectedUids.length}
          isSubmitting={isSubmitting}
          onCancel={() => setShowBulkDeleteModal(false)}
          onConfirm={confirmBulkDelete}
        />
      )}

      {/* EDIT ROLE MODAL */}
      {showEditModal && selectedUser && (
        <EditUserModal
          selectedUser={selectedUser}
          editRole={editRole}
          editOrganization={editOrganization}
          editPhone={editPhone}
          isSubmitting={isSubmitting}
          setEditRole={setEditRole}
          setEditOrganization={setEditOrganization}
          setEditPhone={setEditPhone}
          onCancel={() => {
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          onConfirm={confirmEdit}
        />
      )}
    </div>
  )
}
