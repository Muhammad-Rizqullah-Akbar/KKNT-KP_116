'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'

type CadreUser = {
  uid: string
  email: string
  displayName: string
  role: string
  organization?: string
  phone?: string
  partnershipId?: string
  partnershipName?: string
  createdAt?: string
}

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

  // Filters
  const [searchTerm, setSearchTerm] = useState('')

  // Create Cadre Form Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [cadreEmail, setCadreEmail] = useState('')
  const [cadrePassword, setCadrePassword] = useState('')
  const [cadreName, setCadreName] = useState('')
  const [cadrePhone, setCadrePhone] = useState('')
  const [cadreVillage, setCadreVillage] = useState('')
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
      const res = await fetch('/api/auth/users?partnershipOnly=true')
      const data = await res.json()

      if (data.success && Array.isArray(data.users)) {
        // Filter strictly cadres owned by this partnership UID (or all cadres for admin)
        const myCadres = data.users.filter(
          (u: CadreUser) =>
            u.role === 'cadre' &&
            (userData?.role === 'super_admin' ||
              userData?.role === 'admin' ||
              u.partnershipId === user?.uid)
        )
        setCadres(myCadres)
      } else {
        setError(data.message || 'Gagal memuat daftar kader mitra.')
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
          organization: cadreVillage || userData?.displayName || 'Kader Mitra',
          phone: cadrePhone,
          partnershipId: user?.uid,
          partnershipName: userData?.displayName || user?.email,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mendaftarkan kader baru.')
      }

      showToast(`Kader "${cadreName || cadreEmail}" berhasil didaftarkan di bawah kemitraan Anda!`)
      setIsCreateModalOpen(false)
      setCadreEmail('')
      setCadrePassword('')
      setCadreName('')
      setCadrePhone('')
      setCadreVillage('')
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

  // Filtered Cadres List
  const filteredCadres = useMemo(() => {
    return cadres.filter((c) => {
      const term = searchTerm.toLowerCase()
      return (
        (c.displayName || '').toLowerCase().includes(term) ||
        (c.email || '').toLowerCase().includes(term) ||
        (c.organization || '').toLowerCase().includes(term) ||
        (c.phone || '').toLowerCase().includes(term)
      )
    })
  }, [cadres, searchTerm])

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

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 sm:flex-initial">
            <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari kader / nama / desa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-full sm:w-72"
            />
          </div>

          <span className="text-xs font-mono text-slate-400">
            {filteredCadres.length} kader ditemukan
          </span>
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
              <p className="text-sm font-bold text-slate-300">Belum Ada Kader Terdaftar</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Klik "+ Mendaftarkan Kader Baru" untuk membuatkan akun bagi kader lapangan Anda.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
              >
                <Icon name="userPlus" className="w-4 h-4" />
                <span>Daftarkan Kader Pertama</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="px-4 py-3.5">Nama & Profil Kader</th>
                    <th className="px-4 py-3.5">Email Login</th>
                    <th className="px-4 py-3.5">Desa / Wilayah Tugas</th>
                    <th className="px-4 py-3.5">No. HP / WA</th>
                    <th className="px-4 py-3.5">Tanggal Terdaftar</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredCadres.map((c) => (
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

                      <td className="px-4 py-3.5 font-mono text-slate-300">{c.email}</td>
                      <td className="px-4 py-3.5 text-slate-200">{c.organization || 'Kader Lapangan'}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-400">{c.phone || '-'}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-400 text-[11px]">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('id-ID') : '-'}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteCadre(c.uid, c.displayName || c.email)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
                          title="Hapus Kader Ini"
                        >
                          <Icon name="trash" className="w-4 h-4 text-rose-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
                  <label className="block font-semibold text-slate-300 mb-1.5">Unit / Sekolah / Komunitas / Desa</label>
                  <input
                    type="text"
                    placeholder="Contoh: SMA Negeri 1 Bantaeng / Komunitas Pangan..."
                    value={cadreVillage}
                    onChange={(e) => setCadreVillage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={cadrePhone}
                    onChange={(e) => setCadrePhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5"
                  />
                </div>
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

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-3">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
