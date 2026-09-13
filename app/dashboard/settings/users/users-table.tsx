'use client'

import { Icon } from '@/components/ui/Icons'
import { getRoleBadge, getInitials, ROLE_OPTIONS, type User } from './users-utils'

type UsersTableProps = {
  users: User[]
  filteredUsers: User[]
  paginatedUsers: User[]
  loading: boolean
  currentUserUid?: string
  searchTerm: string
  filterRole: string
  selectedUids: string[]
  isAllPaginatedSelected: boolean
  currentPage: number
  totalPages: number
  setSearchTerm: (v: string) => void
  setFilterRole: (v: string) => void
  setShowBulkDeleteModal: (v: boolean) => void
  toggleSelectAll: () => void
  toggleSelectUser: (uid: string) => void
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  setCurrentPage: (fn: (p: number) => number) => void
}

export default function UsersTable(props: UsersTableProps) {
  const {
    users, filteredUsers, paginatedUsers, loading, currentUserUid,
    searchTerm, filterRole, selectedUids, isAllPaginatedSelected,
    currentPage, totalPages,
    setSearchTerm, setFilterRole, setShowBulkDeleteModal,
    toggleSelectAll, toggleSelectUser, onEdit, onDelete, setCurrentPage,
  } = props

  return (
    <>
      {/* Filter, Search Bar, & BULK DELETE Action Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari email / nama / instansi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">Semua Peran ({users.length})</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.id} value={r.id || ''}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          {/* BULK DELETE BUTTON */}
          {selectedUids.length > 0 && (
            <button
              type="button"
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all animate-pulse"
            >
              <Icon name="trash" className="w-4 h-4 text-white" />
              <span>Hapus Masal ({selectedUids.length}) Akun Terpilih</span>
            </button>
          )}

          <span className="text-xs text-slate-400 font-mono">
            Total: {filteredUsers.length} akun terdaftar
          </span>
        </div>
      </div>

      {/* Users Table with Hierarchical Grouping */}
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
                  <th className="px-4 py-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllPaginatedSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400 w-4 h-4 cursor-pointer"
                      title="Pilih Semua Akun di Halaman Ini"
                    />
                  </th>
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
                  const isSelf = u.uid === currentUserUid
                  const isSelected = selectedUids.includes(u.uid)

                  return (
                    <tr
                      key={u.uid}
                      className={`transition-colors ${
                        u.isChildOfMitra
                          ? 'bg-purple-950/10 hover:bg-purple-950/20'
                          : isSelected
                          ? 'bg-rose-950/20 hover:bg-rose-950/30'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          disabled={isSelf}
                          checked={isSelected}
                          onChange={() => toggleSelectUser(u.uid)}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400 w-4 h-4 cursor-pointer disabled:opacity-30"
                        />
                      </td>

                      <td className="px-4 py-3.5">
                        <div className={`flex items-center gap-3 ${u.isChildOfMitra ? 'pl-6' : ''}`}>
                          {u.isChildOfMitra && (
                            <Icon name="cornerDownRight" className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          )}
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-xs font-extrabold text-white shrink-0">
                            {getInitials(u.displayName, u.email)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-100 text-sm">
                                {u.displayName || 'Tanpa Nama'}
                              </p>
                              {isSelf && <span className="text-[10px] text-cyan-400 font-bold">(Akun Anda)</span>}
                            </div>
                            {u.isChildOfMitra && (
                              <p className="text-[10px] font-mono text-purple-300 font-medium">
                                Kader milik: <span className="font-bold">{u.parentMitraName}</span>
                              </p>
                            )}
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
                            onClick={() => onEdit(u)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                            title="Edit Role & Profil"
                          >
                            <Icon name="pencil" className="w-4 h-4 text-cyan-400" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDelete(u)}
                            disabled={isSelf}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 disabled:opacity-30 transition-colors"
                            title="Hapus Akun User"
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
            <span>
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-slate-200"
              >
                Sebelumnya
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-slate-200"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
