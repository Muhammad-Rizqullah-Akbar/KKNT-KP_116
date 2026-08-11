'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/shared/safeFetch'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import { MitraProgressModal } from '@/components/dashboard/MitraProgressModal'

type UserProfile = {
  uid: string
  email: string
  displayName: string
  role: string
  organization?: string
  partnershipType?: string
  phone?: string
  partnershipId?: string
  partnershipName?: string
  createdAt?: string
}

const PARTNERSHIP_TYPES = [
  { id: 'all', label: 'Semua Jenis Instansi / Mitra' },
  { id: 'Sekolah', label: '🏫 Sekolah / Kampus' },
  { id: 'Kelurahan / Desa', label: '🏛️ Kelurahan / Kantor Desa' },
  { id: 'Pasar', label: '🏪 Pasar Tradisional / Modern' },
  { id: 'Puskesmas / Posyandu', label: '🏥 Puskesmas / Posyandu' },
  { id: 'Komunitas / Ormas', label: '👥 Komunitas / Ormas / PKK' },
  { id: 'Instansi Pemerintah', label: '🏢 Instansi Pemerintah / BPOM' },
  { id: 'Lainnya', label: '📌 Lainnya' },
]

export default function PartnershipListPage() {
  const { user, userData } = useAuth()
  const isSuperAdminOrAdmin = userData?.role === 'super_admin' || userData?.role === 'admin'

  const [allUsers, setAllUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Cost Control & Pagination
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Create Mitra Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [mitraEmail, setMitraEmail] = useState('')
  const [mitraPassword, setMitraPassword] = useState('')
  const [mitraName, setMitraName] = useState('')
  const [mitraType, setMitraType] = useState('Sekolah')
  const [mitraPhone, setMitraPhone] = useState('')
  const [mitraPIC, setMitraPIC] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Detail Modal State (View Mitra's Cadres)
  const [selectedMitra, setSelectedMitra] = useState<UserProfile | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Fetch Users & Build Partnerships
  const fetchUsersData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { ok, data, error: fetchErr } = await safeFetchJson('/api/auth/users')

      if (ok && data && Array.isArray(data.users)) {
        setAllUsers(data.users)
        setLastFetchedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      } else {
        setError(fetchErr || 'Gagal memuat data kemitraan.')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan koneksi server.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsersData()
  }, [])

  // Filter Partnership Accounts & Organizations
  const partnersList = useMemo(() => {
    // Collect accounts with role='partnership' as well as distinct organizations with cadres
    const mitraMap = new Map<string, UserProfile>()

    // 1. Add explicit partnership role users
    allUsers
      .filter((u) => u.role === 'partnership')
      .forEach((u) => {
        mitraMap.set(u.uid, u)
      })

    // 2. Add implicit organizations from cadres
    allUsers
      .filter((u) => u.role === 'cadre' && u.organization)
      .forEach((c) => {
        const orgKey = 'org_' + (c.partnershipId || c.organization)
        if (!mitraMap.has(orgKey) && !mitraMap.has(c.partnershipId || '')) {
          mitraMap.set(orgKey, {
            uid: orgKey,
            email: c.email || 'mitra@kkntkp.id',
            displayName: c.partnershipName || c.organization || 'Mitra Instansi',
            role: 'partnership',
            organization: c.organization,
            partnershipType: c.partnershipType || 'Sekolah',
            phone: c.phone || '-',
            createdAt: c.createdAt,
          })
        }
      })

    return Array.from(mitraMap.values())
  }, [allUsers])

  // Count Cadres per Mitra
  const getCadreCountForMitra = (mitra: UserProfile) => {
    return allUsers.filter(
      (u) =>
        u.role === 'cadre' &&
        (u.partnershipId === mitra.uid ||
          (u.organization && u.organization.toLowerCase() === (mitra.organization || mitra.displayName || '').toLowerCase()))
    ).length
  }

  // Get Cadres List for Selected Mitra
  const cadresForSelectedMitra = useMemo(() => {
    if (!selectedMitra) return []
    return allUsers.filter(
      (u) =>
        u.role === 'cadre' &&
        (u.partnershipId === selectedMitra.uid ||
          (u.organization && u.organization.toLowerCase() === (selectedMitra.organization || selectedMitra.displayName || '').toLowerCase()))
    )
  }, [allUsers, selectedMitra])

  // Client-Side Flexible Filter
  const filteredPartners = useMemo(() => {
    return partnersList.filter((m) => {
      // 1. Instansi Type Filter
      if (typeFilter !== 'all' && (m.partnershipType || 'Sekolah').toLowerCase() !== typeFilter.toLowerCase()) {
        return false
      }

      // 2. Search Filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim()
        const matchName = (m.displayName || '').toLowerCase().includes(term)
        const matchOrg = (m.organization || '').toLowerCase().includes(term)
        const matchEmail = (m.email || '').toLowerCase().includes(term)
        const matchPhone = (m.phone || '').toLowerCase().includes(term)
        if (!matchName && !matchOrg && !matchEmail && !matchPhone) return false
      }

      return true
    })
  }, [partnersList, typeFilter, searchTerm])

  // Paginated Subset
  const paginatedPartners = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredPartners.slice(start, start + pageSize)
  }, [filteredPartners, currentPage, pageSize])

  const totalPages = Math.ceil(filteredPartners.length / pageSize) || 1

  // Handle Create Mitra Account
  const handleCreateMitra = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: mitraEmail,
          password: mitraPassword,
          role: 'partnership',
          displayName: mitraName || mitraEmail.split('@')[0],
          organization: mitraName,
          partnershipType: mitraType,
          phone: mitraPhone,
          partnershipName: mitraName,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mendaftarkan instansi mitra baru.')
      }

      showToast(`Akun Mitra "${mitraName || mitraEmail}" (${mitraType}) berhasil didaftarkan!`)
      setIsCreateModalOpen(false)
      setMitraEmail('')
      setMitraPassword('')
      setMitraName('')
      setMitraPhone('')
      setMitraPIC('')
      fetchUsersData()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#070913] text-slate-100 font-sans">
      <Topbar
        title="Manajemen Mitra & Instansi Partnership V1.5"
        subtitle="Kelola profil lembaga mitra (Sekolah, Kelurahan, Pasar, Puskesmas, Komunitas) dan pantau kader di bawah naungannya"
      />

      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Banner Header */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/50 to-slate-900 border border-purple-500/30 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-extrabold flex items-center gap-1">
                <Icon name="briefcase" className="w-3.5 h-3.5 text-purple-400" />
                <span>Portal Resmi Kemitraan BPOM</span>
              </span>
              <span className="text-slate-400 text-xs">• Akun Manajemen Instansi</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-100">Manajemen Instansi & Mitra Terdaftar</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mendaftarkan dan memantau seluruh kelembagaan mitra BPOM (Sekolah/Kampus, Kelurahan/Kantor Desa, Pasar, Puskesmas, dan Komunitas) beserta rekap kader aktif.
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto flex-wrap">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Icon name="userPlus" className="w-4 h-4" />
              <span>+ Daftarkan Instansi Mitra Baru</span>
            </button>

            <Link
              href="/dashboard/partnership/cadres"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Icon name="users" className="w-4 h-4 text-cyan-400" />
              <span>Buka Kelola Kader Lapangan &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Mitra Terdaftar</span>
              <Icon name="briefcase" className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-100 mt-2">{partnersList.length}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Mitra Sekolah & Kampus</span>
              <Icon name="award" className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-cyan-300 mt-2">
              {partnersList.filter((m) => (m.partnershipType || '').toLowerCase().includes('sekolah')).length}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Mitra Desa / Kelurahan</span>
              <Icon name="mapPin" className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-300 mt-2">
              {partnersList.filter((m) => (m.partnershipType || '').toLowerCase().includes('kelurahan')).length}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Kader Lapangan</span>
              <Icon name="users" className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-amber-300 mt-2">
              {allUsers.filter((u) => u.role === 'cadre').length}
            </p>
          </div>
        </div>

        {/* Search Bar & Instansi Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari nama instansi / email / HP..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-full sm:w-72"
              />
            </div>

            {/* Instansi Type Dropdown Filter */}
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
              <span>Jenis Instansi:</span>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="bg-transparent text-purple-300 font-bold focus:outline-none cursor-pointer"
              >
                {PARTNERSHIP_TYPES.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
              <span>Tampil:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
              >
                <option value={10} className="bg-slate-900 text-slate-200">10 mitra</option>
                <option value={25} className="bg-slate-900 text-slate-200">25 mitra</option>
                <option value={50} className="bg-slate-900 text-slate-200">50 mitra</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            {lastFetchedAt && (
              <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Client Cache: {lastFetchedAt}</span>
              </div>
            )}

            <button
              onClick={fetchUsersData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Segarkan Data Mitra dari Firestore"
            >
              <Icon name="refresh" className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>
          </div>
        </div>

        {/* Mitra Table */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-3">
              <Icon name="loader" className="w-5 h-5 text-purple-400 animate-spin" />
              <span>Memuat daftar instansi mitra...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-rose-300 space-y-2">
              <p className="font-semibold">{error}</p>
              <button onClick={fetchUsersData} className="px-4 py-2 rounded-xl bg-rose-950 border border-rose-500/40 text-rose-200">
                Coba Muat Ulang
              </button>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center py-20 text-slate-500 space-y-3">
              <Icon name="briefcase" className="w-12 h-12 mx-auto text-slate-700" />
              <p className="text-sm font-bold text-slate-300">Belum Ada Instansi Mitra Cocok</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Coba ubah kata kunci atau jenis instansi/mitra.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
              >
                <Icon name="userPlus" className="w-4 h-4" />
                <span>Daftarkan Instansi Mitra Baru</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="px-4 py-3.5">Nama Instansi Mitra</th>
                    <th className="px-4 py-3.5">Jenis Instansi</th>
                    <th className="px-4 py-3.5">Email Kontak / Login</th>
                    <th className="px-4 py-3.5">Kader Lapangan</th>
                    <th className="px-4 py-3.5">No. HP / WA</th>
                    <th className="px-4 py-3.5">Tanggal Didaftarkan</th>
                    <th className="px-4 py-3.5 text-right">Detail & Kader</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {paginatedPartners.map((m) => {
                    const cadreCount = getCadreCountForMitra(m)

                    return (
                      <tr key={m.uid} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-extrabold text-white shrink-0 shadow-md">
                              {m.displayName?.charAt(0) || 'M'}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-100 text-sm">{m.displayName || m.organization || 'Instansi Mitra'}</p>
                              <span className="text-[10px] text-purple-400 font-mono">ID: {m.uid.substring(0, 10)}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-1 rounded-md bg-purple-950/60 text-purple-300 border border-purple-500/30 text-[11px] font-semibold">
                            {m.partnershipType || 'Sekolah'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-slate-300">{m.email}</td>

                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold font-mono">
                            {cadreCount} Kader Active
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-slate-400">{m.phone || '-'}</td>

                        <td className="px-4 py-3.5 font-mono text-slate-400 text-[11px]">
                          {m.createdAt ? new Date(m.createdAt).toLocaleDateString('id-ID') : '-'}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedMitra(m)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors ml-auto"
                          >
                            <Icon name="eye" className="w-3.5 h-3.5 text-purple-400" />
                            <span>Lihat Detail Kader ({cadreCount})</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {filteredPartners.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <div>
              Menampilkan <span className="font-bold text-slate-200">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-bold text-slate-200">{Math.min(currentPage * pageSize, filteredPartners.length)}</span> dari <span className="font-bold text-slate-200">{filteredPartners.length}</span> instansi mitra
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                &larr; Sebelumnya
              </button>

              <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-semibold text-slate-200">
                Halaman {currentPage} dari {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Selanjutnya &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Daftarkan Instansi Mitra Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Icon name="briefcase" className="w-5 h-5 text-purple-400" />
                <span>Daftarkan Instansi / Lembaga Mitra Baru</span>
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMitra} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Nama Instansi / Sekolah / Kelurahan / Pasar <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SMA Negeri 1 Palu / Kelurahan Tondo"
                  value={mitraName}
                  onChange={(e) => setMitraName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Jenis Kemitraan <span className="text-rose-400">*</span>
                </label>
                <select
                  value={mitraType}
                  onChange={(e) => setMitraType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-400 cursor-pointer"
                >
                  <option value="Sekolah">🏫 Sekolah / Kampus</option>
                  <option value="Kelurahan / Desa">🏛️ Kelurahan / Kantor Desa</option>
                  <option value="Pasar">🏪 Pasar Tradisional / Modern</option>
                  <option value="Puskesmas / Posyandu">🏥 Puskesmas / Posyandu</option>
                  <option value="Komunitas / Ormas">👥 Komunitas / Ormas / PKK</option>
                  <option value="Instansi Pemerintah">🏢 Instansi Pemerintah / BPOM</option>
                  <option value="Lainnya">📌 Lainnya</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Email Akun Mitra <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="mitra@sekolah.sch.id"
                    value={mitraEmail}
                    onChange={(e) => setMitraEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={mitraPassword}
                    onChange={(e) => setMitraPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">No. Telepon / WhatsApp Penanggung Jawab</label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={mitraPhone}
                  onChange={(e) => setMitraPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-600/20 flex items-center gap-1.5"
                >
                  {isSubmitting ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="check" className="w-4 h-4" />}
                  <span>Daftarkan Instansi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Inspeksi Analytics Progress Mitra untuk Super Admin */}
      {selectedMitra && (
        <MitraProgressModal
          mitra={selectedMitra}
          isOpen={Boolean(selectedMitra)}
          onClose={() => setSelectedMitra(null)}
        />
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-3">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
