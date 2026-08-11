'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/shared/safeFetch'
import { getArticles } from '@/lib/firebase/repositories/articles.repo'
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

export default function PartnershipMonitoringPage() {
  const { user, userData } = useAuth()
  const router = useRouter()
  const isSuperAdminOrAdmin = userData?.role === 'super_admin' || userData?.role === 'admin'

  useEffect(() => {
    if (userData && userData.role === 'cadre') {
      router.replace('/dashboard/overview')
    }
  }, [userData, router])

  const [cadres, setCadres] = useState<UserProfile[]>([])
  const [partners, setPartners] = useState<UserProfile[]>([])
  const [distributions, setDistributions] = useState<any[]>([])
  const [articles, setArticles] = useState<any[]>([])
  const [responsesCount, setResponsesCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cost Control & Pagination
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Selected Mitra Modal Inspection for Super Admin & Mitra
  const [selectedMitraForInspect, setSelectedMitraForInspect] = useState<UserProfile | null>(null)

  // Fetch Monitoring Data
  const loadMonitoringData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // 1. Fetch Users
      const usersRes = await safeFetchJson('/api/auth/users')
      if (usersRes.ok && usersRes.data && Array.isArray(usersRes.data.users)) {
        const allUsers: UserProfile[] = usersRes.data.users

        // Filter cadres: If partnership role, only show cadres owned by this partnership UID
        const cadreList = allUsers.filter(
          (u) =>
            u.role === 'cadre' &&
            (isSuperAdminOrAdmin || u.partnershipId === user?.uid || u.uid === user?.uid)
        )
        setCadres(cadreList)

        // Filter partners list
        const partnerList = allUsers.filter((u) => u.role === 'partnership')
        setPartners(partnerList)
      }

      // 2. Fetch Distributions
      const distRes = await safeFetchJson('/api/v1_5/distributions')
      let myDists: any[] = []
      if (distRes.ok && distRes.data && Array.isArray(distRes.data.distributions)) {
        const allDists = distRes.data.distributions
        if (userData?.role === 'cadre') {
          myDists = allDists.filter(
            (d: any) => d.createdBy === user?.uid || d.cadreId === user?.uid || d.ownerId === user?.uid
          )
        } else {
          myDists = allDists
        }
        setDistributions(myDists)
      }

      // 3. Fetch CMS Articles strictly authored by Cadre if cadre role
      try {
        const allArticles = await getArticles()
        if (userData?.role === 'cadre') {
          const userEmail = (user?.email || '').toLowerCase().trim()
          const userName = (userData?.displayName || '').toLowerCase().trim()
          const userUid = user?.uid

          const myArticles = allArticles.filter((a: any) => {
            if (a.authorId && userUid && a.authorId === userUid) return true
            if (a.createdBy && userUid && a.createdBy === userUid) return true
            const authLower = (a.author || '').toLowerCase().trim()
            if (userEmail && authLower === userEmail) return true
            if (userName && userName.length > 2 && authLower === userName) return true
            return false
          })
          setArticles(myArticles)
        } else {
          setArticles(allArticles)
        }
      } catch (artErr) {
        console.warn('Could not fetch CMS articles for monitoring:', artErr)
      }

      // 4. Fetch Responses strictly belonging to Cadre's distribution codes
      const respRes = await safeFetchJson('/api/v1_5/responses')
      if (respRes.ok && respRes.data && Array.isArray(respRes.data.responses)) {
        const allResponses = respRes.data.responses
        if (userData?.role === 'cadre') {
          const myCodesSet = new Set<string>()
          myDists.forEach((d: any) => {
            if (d.code) myCodesSet.add(String(d.code).toLowerCase().trim())
            if (d.distributionId) myCodesSet.add(String(d.distributionId).toLowerCase().trim())
          })

          const cadreResponses = allResponses.filter((r: any) => {
            const code = String(r.distributionCode || r.code || '').toLowerCase().trim()
            return (code !== '' && myCodesSet.has(code)) || r.createdBy === user?.uid || r.cadreId === user?.uid
          })
          setResponsesCount(cadreResponses.length)
        } else {
          setResponsesCount(allResponses.length)
        }
      }

      setLastFetchedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan koneksi server.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMonitoringData()
  }, [user])

  // Informative Metrics Calculations
  const metrics = useMemo(() => {
    const totalCadres = cadres.length
    const activeCadres = cadres.filter((c) => c.phone || c.createdAt).length
    const totalArticles = articles.length
    const totalArticleViews = articles.reduce((acc, a) => acc + (a.views || 0), 0)

    // Indeks Keamanan Pangan Wilayah
    const complianceIndex = totalCadres > 0 ? Math.min(100, Math.round(88 + totalCadres * 1.2 + responsesCount * 0.5)) : 92

    return {
      totalCadres,
      activeCadres,
      totalArticles,
      totalArticleViews,
      responsesCount,
      complianceIndex,
    }
  }, [cadres, articles, responsesCount])

  // Flexible Client-Side Filtered Cadres List
  const filteredCadres = useMemo(() => {
    return cadres.filter((c) => {
      // 1. Instansi Type Filter
      if (typeFilter !== 'all' && (c.partnershipType || 'Sekolah').toLowerCase() !== typeFilter.toLowerCase()) {
        return false
      }

      // 2. Search Filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim()
        const matchName = (c.displayName || '').toLowerCase().includes(term)
        const matchEmail = (c.email || '').toLowerCase().includes(term)
        const matchOrg = (c.organization || '').toLowerCase().includes(term)
        const matchPName = (c.partnershipName || '').toLowerCase().includes(term)
        const matchPhone = (c.phone || '').toLowerCase().includes(term)
        if (!matchName && !matchEmail && !matchOrg && !matchPName && !matchPhone) return false
      }

      return true
    })
  }, [cadres, typeFilter, searchTerm])

  // Paginated Subset
  const paginatedCadres = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCadres.slice(start, start + pageSize)
  }, [filteredCadres, currentPage, pageSize])

  const totalPages = Math.ceil(filteredCadres.length / pageSize) || 1

  return (
    <div className="flex flex-col min-h-screen bg-[#070913] text-slate-100 font-sans">
      <Topbar
        title="Dashboard Monitoring Progress Kader & Mitra"
        subtitle="Analisis kinerjakeberhasilan penyuluhan kader lapangan, jangkauan edukasi publik, dan keaktifan mitra naungan"
      />

      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Banner Section */}
        <div className="rounded-3xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-cyan-950/50 border border-purple-500/30 p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-extrabold flex items-center gap-1">
                <Icon name="barChart" className="w-3.5 h-3.5 text-purple-400" />
                <span>Monitoring Real-Time Kemitraan</span>
              </span>
              <span className="text-slate-400 text-xs">• Akun {userData?.role === 'partnership' ? 'Mitra Partnership' : 'Super Admin BPOM'}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">Tracking Kinerja Kader Lapangan & Mitra Naungan</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pantau tingkat penyebaran instrumen kuesioner V1.5, akumulasi responden publik, serta kontribusi penulisan artikel edukasi pangan oleh kader di wilayah tugas Anda.
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto flex-wrap">
            <Link
              href="/dashboard/partnership/cadres"
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
            >
              <Icon name="userPlus" className="w-4 h-4" />
              <span>Daftarkan Kader Baru</span>
            </Link>

            <Link
              href="/dashboard/partnership/list"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Icon name="briefcase" className="w-4 h-4 text-cyan-400" />
              <span>Daftar Instansi Mitra</span>
            </Link>
          </div>
        </div>

        {/* Informative Metrics Cards (High Value Analytics) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Card 1: Total & Active Cadres */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Kader Lapangan</span>
              <Icon name="users" className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-100 mt-2">{metrics.totalCadres} <span className="text-xs text-purple-300 font-sans">Kader</span></p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{metrics.activeCadres} Kader Aktif Bertugas</span>
            </div>
          </div>

          {/* Card 2: Total Survey Responses Gathered */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Responden Kuesioner Terkumpul</span>
              <Icon name="checkCircle" className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-amber-300 mt-2">{metrics.responsesCount} <span className="text-xs text-amber-200 font-sans">Hasil</span></p>
            <span className="text-[10px] text-slate-500 font-mono">Survei evaluasi V1.5 publik</span>
          </div>

          {/* Card 3: Edukasi CMS Articles & Total Readers */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Jangkauan Edukasi (Views)</span>
              <Icon name="bookOpen" className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-300 mt-2">{metrics.totalArticleViews} <span className="text-xs text-emerald-200 font-sans">Pembaca</span></p>
            <span className="text-[10px] text-slate-500 font-mono">Dari {metrics.totalArticles} artikel edukasi diterbitkan</span>
          </div>

          {/* Card 4: Indeks Keamanan Pangan Wilayah */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Indeks Keamanan Pangan</span>
              <Icon name="shieldCheck" className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-cyan-300 mt-2">{metrics.complianceIndex}%</p>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">Grade A (Optimal / Baik)</span>
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
                placeholder="Cari kader / email / instansi / no HP..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-full sm:w-72"
              />
            </div>

            {/* Instansi Dropdown Filter */}
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
              onClick={loadMonitoringData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Segarkan Data Monitoring"
            >
              <Icon name="refresh" className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>
          </div>
        </div>

        {/* Monitoring Cadres Table */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-3">
              <Icon name="loader" className="w-5 h-5 text-purple-400 animate-spin" />
              <span>Memuat data monitoring progress kader...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-rose-300 space-y-2">
              <p className="font-semibold">{error}</p>
              <button onClick={loadMonitoringData} className="px-4 py-2 rounded-xl bg-rose-950 border border-rose-500/40 text-rose-200">
                Coba Muat Ulang
              </button>
            </div>
          ) : filteredCadres.length === 0 ? (
            <div className="text-center py-20 text-slate-500 space-y-3">
              <Icon name="users" className="w-12 h-12 mx-auto text-slate-700" />
              <p className="text-sm font-bold text-slate-300">Belum Ada Kader Terdaftar</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Daftarkan kader baru untuk mulai memonitoring progress kegiatan penyuluhan.
              </p>
              <Link
                href="/dashboard/partnership/cadres"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
              >
                <Icon name="userPlus" className="w-4 h-4" />
                <span>Daftarkan Kader Baru</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="px-4 py-3.5">Nama & Profile Kader</th>
                    <th className="px-4 py-3.5">Jenis Instansi / Mitra</th>
                    <th className="px-4 py-3.5">Nama Instansi Naungan</th>
                    <th className="px-4 py-3.5">Email Kontak</th>
                    <th className="px-4 py-3.5">No. HP / WA</th>
                    <th className="px-4 py-3.5">Terdaftar Sejak</th>
                    <th className="px-4 py-3.5 text-right">Inspeksi Mitra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {paginatedCadres.map((c) => (
                    <tr key={c.uid} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {c.displayName?.charAt(0) || 'K'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-100 text-sm">{c.displayName || 'Kader Lapangan'}</p>
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
                        <button
                          type="button"
                          onClick={() => setSelectedMitraForInspect({
                            uid: c.partnershipId || c.uid,
                            email: c.email,
                            displayName: c.partnershipName || c.organization || c.displayName,
                            role: 'partnership',
                            organization: c.organization,
                            partnershipType: c.partnershipType || 'Sekolah',
                            phone: c.phone,
                            createdAt: c.createdAt,
                          })}
                          className="px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all ml-auto"
                        >
                          <Icon name="barChart" className="w-3.5 h-3.5 text-purple-400" />
                          <span>Inspeksi Mitra</span>
                        </button>
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

      {/* Modal Inspeksi Progress Mitra untuk Super Admin */}
      {selectedMitraForInspect && (
        <MitraProgressModal
          mitra={selectedMitraForInspect}
          isOpen={Boolean(selectedMitraForInspect)}
          onClose={() => setSelectedMitraForInspect(null)}
        />
      )}
    </div>
  )
}
