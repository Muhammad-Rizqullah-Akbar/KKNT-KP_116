'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/shared/safeFetch'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import { ProfileProgressModal } from '@/components/dashboard/ProfileProgressModal'

type CadreUser = {
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

export default function PartnershipCadresPage() {
  const { user, userData } = useAuth()
  const isPartnershipOrAdmin =
    userData?.role === 'partnership' ||
    userData?.role === 'super_admin' ||
    userData?.role === 'admin'

  const [cadres, setCadres] = useState<CadreUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Cost Control & Pagination States
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Inspection Analytics Modal State
  const [selectedCadreForProfile, setSelectedCadreForProfile] = useState<CadreUser | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [cadreEmail, setCadreEmail] = useState('')
  const [cadrePassword, setCadrePassword] = useState('')
  const [cadreName, setCadreName] = useState('')
  const [cadrePhone, setCadrePhone] = useState('')
  const [cadrePartnershipType, setCadrePartnershipType] = useState('Sekolah')
  const [cadreOrganization, setCadreOrganization] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Fetch Cadres for this Partnership
  const fetchPartnershipCadres = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { ok, data, error: fetchErr } = await safeFetchJson('/api/auth/users?partnershipOnly=true')

      if (ok && data && Array.isArray(data.users)) {
        // Filter strictly cadres owned by this partnership UID (or all cadres for admin)
        const myCadres = data.users.filter(
          (u: CadreUser) =>
            u.role === 'cadre' &&
            (userData?.role === 'super_admin' ||
              userData?.role === 'admin' ||
              u.partnershipId === user?.uid ||
              u.uid === user?.uid)
        )
        setCadres(myCadres)
        setLastFetchedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      } else {
        setError(fetchErr || 'Gagal memuat daftar kader kemitraan.')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan koneksi server.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPartnershipCadres()
  }, [user])

  // Register New Cadre under this Partnership
  const handleCreateCadre = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cadreEmail,
          password: cadrePassword,
          role: 'cadre',
          displayName: cadreName || cadreEmail.split('@')[0],
          organization: cadreOrganization || userData?.displayName || 'Kader Mitra',
          partnershipType: cadrePartnershipType,
          phone: cadrePhone,
          partnershipId: user?.uid,
          partnershipName: cadreOrganization || userData?.displayName || user?.email,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mendaftarkan kader baru.')
      }

      showToast(`Kader "${cadreName || cadreEmail}" berhasil didaftarkan di bawah instansi ${cadreOrganization || cadrePartnershipType}!`)
      setIsCreateModalOpen(false)
      setCadreEmail('')
      setCadrePassword('')
      setCadreName('')
      setCadrePhone('')
      setCadreOrganization('')
      fetchPartnershipCadres()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Cadre
  const handleDeleteCadre = async (cadreId: string, name: string) => {
    if (!confirm(`Hapus kader "${name}" dari jaringan kemitraan Anda?`)) return

    try {
      const res = await fetch(`/api/auth/users?uid=${cadreId}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghapus kader.')
      }

      showToast(`Kader "${name}" berhasil dihapus.`)
      fetchPartnershipCadres()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    }
  }

  // Flexible Filtered Cadres List by Search & Instansi Type (Client Memory Read Protection)
  const filteredCadres = useMemo(() => {
    return cadres.filter((c) => {
      // 1. Instansi Type Filter
      if (typeFilter !== 'all' && (c.partnershipType || 'Sekolah').toLowerCase() !== typeFilter.toLowerCase()) {
        return false
      }

      // 2. Search Term Filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim()
        const matchesName = (c.displayName || '').toLowerCase().includes(term)
        const matchesEmail = (c.email || '').toLowerCase().includes(term)
        const matchesOrg = (c.organization || '').toLowerCase().includes(term)
        const matchesPName = (c.partnershipName || '').toLowerCase().includes(term)
        const matchesPhone = (c.phone || '').toLowerCase().includes(term)
        if (!matchesName && !matchesEmail && !matchesOrg && !matchesPName && !matchesPhone) {
          return false
        }
      }

      return true
    })
  }, [cadres, typeFilter, searchTerm])

  // Subsets for Pagination
  const paginatedCadres = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCadres.slice(start, start + pageSize)
  }, [filteredCadres, currentPage, pageSize])

  const totalPages = Math.ceil(filteredCadres.length / pageSize) || 1

  return (
    <div className="flex flex-col min-h-screen bg-[#070913] text-slate-100 font-sans">
      <Topbar
        title="Portal Manajemen Kader Mitra / Partnership"
        subtitle="Kelola jaringan kader lapangan yang terdaftar di bawah akun kemitraan Anda"
      />

      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Banner Section */}
        <div className="rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-cyan-950/40 border border-purple-500/30 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-extrabold">
                Mitra Terdaftar ({userData?.displayName || 'Partnership'})
              </span>
              <span className="text-slate-400 text-xs">• Akun Manajemen Cadre Independent</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">Jaringan Kader Lapangan Mitra</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sebagai Akun Mitra / Partnership, Anda memiliki hak akses penuh untuk mendaftarkan, 
              memantau, dan mengelola kader lapangan yang berada di bawah naungan organisasi Anda.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
          >
            <Icon name="userPlus" className="w-4 h-4" />
            <span>+ Mendaftarkan Kader Baru</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Kader Terdaftar</span>
              <Icon name="users" className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-100 mt-2">{cadres.length}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Status Kemitraan</span>
              <Icon name="checkCircle" className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-emerald-300 mt-2">Aktif / Terverifikasi BPOM</p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Wilayah Operasional</span>
              <Icon name="mapPin" className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-sm font-bold text-cyan-300 mt-2">{userData?.organization || 'Seluruh Desa BPOM'}</p>
          </div>
        </div>

        {/* Search Bar & Flexible Instansi Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari kader / email / instansi / no HP..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-full sm:w-72"
              />
            </div>

            {/* Instansi Type Filter Dropdown */}
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
                <option value={10} className="bg-slate-900 text-slate-200">10 kader</option>
                <option value={25} className="bg-slate-900 text-slate-200">25 kader</option>
                <option value={50} className="bg-slate-900 text-slate-200">50 kader</option>
                <option value={100} className="bg-slate-900 text-slate-200">100 kader</option>
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
              onClick={fetchPartnershipCadres}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Segarkan Data Kader dari Firestore"
            >
              <Icon name="refresh" className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>
          </div>
        </div>

        {/* Cadres Table */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-3">
              <Icon name="loader" className="w-5 h-5 text-purple-400 animate-spin" />
              <span>Memuat daftar kader milik Anda...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-rose-300 space-y-2">
              <p className="font-semibold">{error}</p>
              <button onClick={fetchPartnershipCadres} className="px-4 py-2 rounded-xl bg-rose-950 border border-rose-500/40 text-rose-200">
                Coba Muat Ulang
              </button>
            </div>
          ) : filteredCadres.length === 0 ? (
            <div className="text-center py-20 text-slate-500 space-y-3">
              <Icon name="users" className="w-12 h-12 mx-auto text-slate-700" />
              <p className="text-sm font-bold text-slate-300">Tidak Ada Kader Cocok Dengan Filter</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Coba ubah filter pencarian atau jenis instansi/mitra.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
              >
                <Icon name="userPlus" className="w-4 h-4" />
                <span>Daftarkan Kader Baru</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="px-4 py-3.5">Nama & Profil Kader</th>
                    <th className="px-4 py-3.5">Jenis Instansi / Mitra</th>
                    <th className="px-4 py-3.5">Nama Instansi / Sekolah / Desa</th>
                    <th className="px-4 py-3.5">Email Login</th>
                    <th className="px-4 py-3.5">No. HP / WA</th>
                    <th className="px-4 py-3.5">Tanggal Terdaftar</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {paginatedCadres.map((c) => (
                    <tr key={c.uid} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {c.displayName?.charAt(0) || c.email?.charAt(0) || 'K'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-100 text-sm">{c.displayName || 'Kader Mitra'}</p>
                            <span className="text-[10px] text-purple-300 font-mono">ID: {c.uid.substring(0, 8)}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-md bg-purple-950/60 text-purple-300 border border-purple-500/30 text-[11px] font-semibold">
                          {c.partnershipType || 'Sekolah'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-200 font-bold">
                        {c.organization || c.partnershipName || 'Instansi Mitra'}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-300">{c.email}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-400">{c.phone || '-'}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-400 text-[11px]">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('id-ID') : '-'}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCadreForProfile(c)}
                            className="px-2.5 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
                            title="Inspeksi Analytics & Progress Responden Kader Ini"
                          >
                            <Icon name="barChart" className="w-3.5 h-3.5 text-purple-400" />
                            <span>Analytics Progress</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCadre(c.uid, c.displayName || c.email)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
                            title="Hapus Kader Ini"
                          >
                            <Icon name="trash" className="w-4 h-4 text-rose-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Footer Controls */}
        {filteredCadres.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <div>
              Menampilkan <span className="font-bold text-slate-200">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-bold text-slate-200">{Math.min(currentPage * pageSize, filteredCadres.length)}</span> dari <span className="font-bold text-slate-200">{filteredCadres.length}</span> kader (Total {cadres.length} ter-cache)
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

      {/* Modal: Register Cadre */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Icon name="userPlus" className="w-5 h-5 text-purple-400" />
                <span>Daftarkan Kader Baru (Mitra Partnership)</span>
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCadre} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Email Akun Kader <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="kader@mitrapolis.id"
                  value={cadreEmail}
                  onChange={(e) => setCadreEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-400"
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
                  value={cadrePassword}
                  onChange={(e) => setCadrePassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Nama Lengkap Kader</label>
                <input
                  type="text"
                  placeholder="Contoh: Siti Nurhaliza..."
                  value={cadreName}
                  onChange={(e) => setCadreName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Jenis Instansi / Mitra <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={cadrePartnershipType}
                    onChange={(e) => setCadrePartnershipType(e.target.value)}
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

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Nama Instansi / Sekolah / Desa <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SMA Negeri 1 / Kelurahan Tondo"
                    value={cadreOrganization}
                    onChange={(e) => setCadreOrganization(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">No. HP / WhatsApp</label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={cadrePhone}
                  onChange={(e) => setCadrePhone(e.target.value)}
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
                  <span>Daftarkan Kader Lapangan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Inspeksi Analytics & Progress Cadre */}
      {selectedCadreForProfile && (
        <ProfileProgressModal
          isOpen={Boolean(selectedCadreForProfile)}
          onClose={() => setSelectedCadreForProfile(null)}
          userOverride={selectedCadreForProfile}
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
