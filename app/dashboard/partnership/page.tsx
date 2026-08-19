'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/shared/safeFetch'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import { ProfileProgressModal } from '@/components/dashboard/ProfileProgressModal'
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton'

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

export default function PartnershipDomainPage() {
  const { user, userData } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialTab = (searchParams.get('tab') as 'mitra' | 'cadres' | 'activities') || 'mitra'
  const [activeTab, setActiveTab] = useState<'mitra' | 'cadres' | 'activities'>(initialTab)

  const isSuperAdminOrAdmin = userData?.role === 'super_admin' || userData?.role === 'admin' || userData?.role === 'internal_bpom'
  const isPartnershipRole = userData?.role === 'partnership'

  const [allUsers, setAllUsers] = useState<UserProfile[]>([])
  const [distributions, setDistributions] = useState<any[]>([])
  const [responses, setResponses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedMitraFilter, setSelectedMitraFilter] = useState<string>('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize = 10

  // Modals State
  const [selectedMitraDetail, setSelectedMitraDetail] = useState<UserProfile | null>(null)
  const [selectedCadreForInspect, setSelectedCadreForInspect] = useState<UserProfile | null>(null)

  // Create Mitra Form
  const [isCreateMitraOpen, setIsCreateMitraOpen] = useState(false)
  const [mitraEmail, setMitraEmail] = useState('')
  const [mitraPassword, setMitraPassword] = useState('')
  const [mitraName, setMitraName] = useState('')
  const [mitraType, setMitraType] = useState('Sekolah')
  const [mitraPhone, setMitraPhone] = useState('')
  const [isSubmittingMitra, setIsSubmittingMitra] = useState(false)

  // Create Cadre Form (Contextual or Global)
  const [isCreateCadreOpen, setIsCreateCadreOpen] = useState(false)
  const [cadreContextMitra, setCadreContextMitra] = useState<UserProfile | null>(null)
  const [cadreEmail, setCadreEmail] = useState('')
  const [cadrePassword, setCadrePassword] = useState('')
  const [cadreName, setCadreName] = useState('')
  const [cadrePhone, setCadrePhone] = useState('')
  const [cadreOrganization, setCadreOrganization] = useState('')
  const [cadrePartnershipType, setCadrePartnershipType] = useState('Sekolah')
  const [isSubmittingCadre, setIsSubmittingCadre] = useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Update tab in URL
  const handleTabChange = (tab: 'mitra' | 'cadres' | 'activities') => {
    setActiveTab(tab)
    setCurrentPage(1)
    router.replace(`/dashboard/partnership?tab=${tab}`, { scroll: false })
  }

  // Fetch Users, Distributions, & Responses for Real-Time Progress Summary
  const fetchUsersData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [usersRes, distRes, respRes] = await Promise.all([
        safeFetchJson('/api/auth/users'),
        safeFetchJson('/api/v1_5/distributions'),
        safeFetchJson('/api/v1_5/responses'),
      ])

      if (usersRes.ok && usersRes.data && Array.isArray(usersRes.data.users)) {
        setAllUsers(usersRes.data.users)
      }
      if (distRes.ok && distRes.data && Array.isArray(distRes.data.distributions)) {
        setDistributions(distRes.data.distributions)
      }
      if (respRes.ok && respRes.data && Array.isArray(respRes.data.responses)) {
        setResponses(respRes.data.responses)
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

  // Helper: Get Cadre Progress Summary
  const getCadreProgressSummary = (cadreUid: string) => {
    const cadreDists = distributions.filter(
      (d) => d.createdBy === cadreUid || d.cadreId === cadreUid
    )
    const distCodesSet = new Set<string>()
    cadreDists.forEach((d) => {
      if (d.code) distCodesSet.add(String(d.code).toLowerCase().trim())
      if (d.distributionCode) distCodesSet.add(String(d.distributionCode).toLowerCase().trim())
    })

    const cadreResponses = responses.filter((r) => {
      const code = String(r.distributionCode || '').toLowerCase().trim()
      return (code !== '' && distCodesSet.has(code)) || r.createdBy === cadreUid || r.cadreId === cadreUid
    })

    const scores = cadreResponses
      .map((r) => r.result?.percentage)
      .filter((s): s is number => typeof s === 'number')

    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const passCount = cadreResponses.filter((r) => r.result?.percentage && r.result.percentage >= 75).length
    const passRate = cadreResponses.length > 0 ? Math.round((passCount / cadreResponses.length) * 100) : 0

    return {
      distCount: cadreDists.length,
      respCount: cadreResponses.length,
      avgScore,
      passCount,
      passRate,
    }
  }

  // Helper: Get Mitra Progress Summary
  const getMitraProgressSummary = (mitra: UserProfile) => {
    const linkedCadres = allUsers.filter(
      (u) =>
        u.role === 'cadre' &&
        (u.partnershipId === mitra.uid ||
          (u.organization && u.organization.toLowerCase() === (mitra.organization || mitra.displayName || '').toLowerCase()))
    )

    let totalDists = 0
    let totalResponses = 0
    let allScores: number[] = []

    linkedCadres.forEach((cadre) => {
      const prog = getCadreProgressSummary(cadre.uid)
      totalDists += prog.distCount
      totalResponses += prog.respCount

      const cadreResponses = responses.filter((r) => r.createdBy === cadre.uid || r.cadreId === cadre.uid)
      cadreResponses.forEach((r) => {
        if (typeof r.result?.percentage === 'number') allScores.push(r.result.percentage)
      })
    })

    const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0
    const passCount = allScores.filter((s) => s >= 75).length
    const passRate = allScores.length > 0 ? Math.round((passCount / allScores.length) * 100) : 0

    return {
      cadreCount: linkedCadres.length,
      totalDists,
      totalResponses,
      avgScore,
      passRate,
    }
  }

  // Filter Mitra list (If role is partnership, ONLY return the current logged-in mitra)
  const partnersList = useMemo(() => {
    if (isPartnershipRole) {
      const me = allUsers.find((u) => u.uid === user?.uid) || (userData ? {
        uid: user?.uid || '',
        email: user?.email || '',
        displayName: userData.displayName || 'Akun Mitra Saya',
        role: 'partnership',
        organization: (userData as any).organization || userData.displayName,
        partnershipType: (userData as any).partnershipType || 'Sekolah',
        phone: (userData as any).phone || '-',
      } : null)

      return me ? [me] : []
    }

    const mitraMap = new Map<string, UserProfile>()

    // 1. Explicit partnership role users
    allUsers
      .filter((u) => u.role === 'partnership')
      .forEach((u) => {
        mitraMap.set(u.uid, u)
      })

    // 2. Implicit organizations from cadres
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
  }, [allUsers, isPartnershipRole, user, userData])

  // Get Cadres for a specific Mitra
  const getCadresForMitra = (mitra: UserProfile) => {
    return allUsers.filter(
      (u) =>
        u.role === 'cadre' &&
        (u.partnershipId === mitra.uid ||
          (u.organization && u.organization.toLowerCase() === (mitra.organization || mitra.displayName || '').toLowerCase()))
    )
  }

  // Filtered Mitra
  const filteredMitra = useMemo(() => {
    return partnersList.filter((m) => {
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        m.displayName.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        (m.organization || '').toLowerCase().includes(term) ||
        (m.phone || '').toLowerCase().includes(term)

      const matchesType = typeFilter === 'all' || m.partnershipType === typeFilter
      return matchesSearch && matchesType
    })
  }, [partnersList, searchTerm, typeFilter])

  // Filtered Cadres (Mitra can ONLY see cadres linked to their own partnership)
  const filteredCadres = useMemo(() => {
    const myOrg = (userData?.organization || userData?.displayName || '').toLowerCase().trim()

    return allUsers.filter((u) => {
      if (u.role !== 'cadre') return false

      // Partnership role strictly sees only cadres owned by their partnership
      if (isPartnershipRole) {
        const isMatchId = u.partnershipId === user?.uid
        const isMatchOrg = myOrg && u.organization && u.organization.toLowerCase().trim() === myOrg
        const isMatchPartName = myOrg && u.partnershipName && u.partnershipName.toLowerCase().trim() === myOrg
        if (!isMatchId && !isMatchOrg && !isMatchPartName) return false
      } else if (!isSuperAdminOrAdmin && u.partnershipId !== user?.uid && u.uid !== user?.uid) {
        return false
      }

      const term = searchTerm.toLowerCase()
      const matchesSearch =
        u.displayName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.organization || '').toLowerCase().includes(term) ||
        (u.phone || '').toLowerCase().includes(term)

      const matchesType = typeFilter === 'all' || u.partnershipType === typeFilter
      const matchesMitra =
        selectedMitraFilter === 'all' ||
        u.partnershipId === selectedMitraFilter ||
        (u.organization && u.organization.toLowerCase() === selectedMitraFilter.toLowerCase())

      return matchesSearch && matchesType && matchesMitra
    })
  }, [allUsers, searchTerm, typeFilter, selectedMitraFilter, isSuperAdminOrAdmin, isPartnershipRole, user, userData])

  // Pagination Math
  const activeListLength = activeTab === 'mitra' ? filteredMitra.length : filteredCadres.length
  const totalPages = Math.ceil(activeListLength / pageSize) || 1
  const paginatedMitra = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredMitra.slice(start, start + pageSize)
  }, [filteredMitra, currentPage, pageSize])

  const paginatedCadres = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCadres.slice(start, start + pageSize)
  }, [filteredCadres, currentPage, pageSize])

  // Open Create Cadre Modal within Mitra Context
  const openCreateCadreModal = (mitra?: UserProfile) => {
    if (isPartnershipRole) {
      const myMitra = partnersList[0] || (userData ? {
        uid: user?.uid || '',
        email: user?.email || '',
        displayName: userData.displayName || 'Mitra Saya',
        role: 'partnership',
        organization: (userData as any).organization || userData.displayName,
        partnershipType: (userData as any).partnershipType || 'Sekolah',
      } : null)
      setCadreContextMitra(myMitra)
      setCadreOrganization((userData as any)?.organization || userData?.displayName || '')
      setCadrePartnershipType((userData as any)?.partnershipType || 'Sekolah')
    } else if (mitra) {
      setCadreContextMitra(mitra)
      setCadreOrganization(mitra.organization || mitra.displayName)
      setCadrePartnershipType(mitra.partnershipType || 'Sekolah')
    } else {
      setCadreContextMitra(null)
      setCadreOrganization('')
      setCadrePartnershipType('Sekolah')
    }
    setIsCreateCadreOpen(true)
  }

  // Create Mitra Handler
  const handleCreateMitra = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingMitra(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: mitraEmail,
          password: mitraPassword,
          role: 'partnership',
          displayName: mitraName,
          organization: mitraName,
          partnershipType: mitraType,
          phone: mitraPhone,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal mendaftarkan Mitra.')

      showToast(`Mitra "${mitraName}" berhasil didaftarkan!`)
      setIsCreateMitraOpen(false)
      setMitraEmail('')
      setMitraPassword('')
      setMitraName('')
      setMitraPhone('')
      fetchUsersData()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    } finally {
      setIsSubmittingMitra(false)
    }
  }

  // Create Cadre Handler
  const handleCreateCadre = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingCadre(true)
    setError(null)

    const targetPartnershipId = cadreContextMitra ? cadreContextMitra.uid : user?.uid
    const targetOrg = cadreOrganization || cadreContextMitra?.displayName || 'Kader Lapangan'

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cadreEmail,
          password: cadrePassword,
          role: 'cadre',
          displayName: cadreName || cadreEmail.split('@')[0],
          organization: targetOrg,
          partnershipType: cadrePartnershipType,
          phone: cadrePhone,
          partnershipId: targetPartnershipId,
          partnershipName: targetOrg,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal mendaftarkan Kader.')

      showToast(`Kader "${cadreName || cadreEmail}" berhasil didaftarkan di bawah Mitra ${targetOrg}!`)
      setIsCreateCadreOpen(false)
      setCadreEmail('')
      setCadrePassword('')
      setCadreName('')
      setCadrePhone('')
      setCadreOrganization('')
      fetchUsersData()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    } finally {
      setIsSubmittingCadre(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080812] text-slate-100 font-sans flex flex-col">
      <Topbar title="Domain Kemitraan Operasional" subtitle="Pengelolaan Master Data Mitra, Kader Lapangan, & Aktivitas" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-200 text-xs font-bold font-mono shadow-2xl flex items-center gap-2 animate-bounce">
          <Icon name="checkCircle" className="w-4 h-4 text-cyan-400" />
          {toastMessage}
        </div>
      )}

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* DOMAIN HEADER & NAVIGATION TABS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/[0.06] backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-display text-white tracking-wide">Domain Kemitraan</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                OPERATIONAL HUB
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Kelola ekosistem operasional: Mitra Instansi, Kader Lapangan Terkait, & Aktivitas.
            </p>
          </div>

          {/* TAB BUTTONS */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => handleTabChange('mitra')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                activeTab === 'mitra'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon name="building" className="w-3.5 h-3.5" />
              {isPartnershipRole ? 'Profil Mitra Saya' : `Mitra (${partnersList.length})`}
            </button>

            <button
              onClick={() => handleTabChange('cadres')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                activeTab === 'cadres'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon name="users" className="w-3.5 h-3.5" />
              {isPartnershipRole ? `Kader Saya (${filteredCadres.length})` : `Kader (${allUsers.filter((u) => u.role === 'cadre').length})`}
            </button>

            <button
              onClick={() => handleTabChange('activities')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                activeTab === 'activities'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon name="trendingUp" className="w-3.5 h-3.5" />
              Aktivitas Lapangan
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        {activeTab !== 'activities' && (
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/40 p-3.5 rounded-xl border border-slate-800">
            <div className="flex flex-1 items-center gap-3 w-full">
              {/* Search Box */}
              <div className="relative flex-1">
                <Icon name="search" className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={activeTab === 'mitra' ? 'Cari nama mitra, email, PIC...' : 'Cari nama kader, email, instansi...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none focus:border-cyan-500/50"
              >
                {PARTNERSHIP_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>

              {/* Cadre Tab Extra Filter: Filter by Mitra (Admin only) */}
              {activeTab === 'cadres' && !isPartnershipRole && (
                <select
                  value={selectedMitraFilter}
                  onChange={(e) => setSelectedMitraFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="all">Semua Mitra Terkait</option>
                  {partnersList.map((m) => (
                    <option key={m.uid} value={m.uid}>
                      {m.displayName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              {isSuperAdminOrAdmin && activeTab === 'mitra' && (
                <button
                  onClick={() => setIsCreateMitraOpen(true)}
                  className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/10"
                >
                  <Icon name="plus" className="w-4 h-4" />
                  Tambah Mitra Baru
                </button>
              )}

              {activeTab === 'cadres' && (
                <button
                  onClick={() => openCreateCadreModal()}
                  className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/10"
                >
                  <Icon name="userPlus" className="w-4 h-4" />
                  Tambah Kader Baru
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: MITRA LIST & CONTEXTUAL CADRES */}
        {activeTab === 'mitra' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filteredMitra.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-mono text-xs bg-slate-900/40 rounded-2xl border border-slate-800 p-8 space-y-2">
                <Icon name="building" className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-bold text-slate-300">Tidak ada Mitra ditemukan</p>
                <p className="text-[11px] text-slate-500">Coba ubah kata kunci pencarian atau filter jenis instansi.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedMitra.map((mitra) => {
                  const linkedCadres = getCadresForMitra(mitra)
                  return (
                    <div
                      key={mitra.uid}
                      className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-4 flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            {mitra.partnershipType || 'Instansi'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {linkedCadres.length} Kader Terkait
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-base text-slate-100 group-hover:text-cyan-300 transition-colors">
                            {mitra.displayName}
                          </h3>
                          <p className="text-xs text-slate-400 font-mono truncate">{mitra.email}</p>
                        </div>

                        <div className="text-xs text-slate-400 space-y-1 font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                          <p className="flex justify-between">
                            <span className="text-slate-500">Kontak:</span>
                            <span className="text-slate-200 font-bold">{mitra.phone || '-'}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-slate-500">Kader Lapangan:</span>
                            <span className="text-cyan-400 font-bold">{linkedCadres.length} Orang</span>
                          </p>
                        </div>
                      </div>

                      {/* CARD ACTIONS */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedMitraDetail(mitra)}
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Icon name="eye" className="w-3.5 h-3.5 text-cyan-400" />
                          Detail & Kader
                        </button>

                        <button
                          onClick={() => openCreateCadreModal(mitra)}
                          className="py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold text-xs transition-colors flex items-center justify-center gap-1"
                          title="Tambah Kader langsung untuk Mitra ini"
                        >
                          <Icon name="userPlus" className="w-3.5 h-3.5" />
                          +Kader
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GLOBAL CADRE VIEW */}
        {activeTab === 'cadres' && (
          <div className="space-y-4">
            {isLoading ? (
              <SkeletonTable rows={6} cols={5} />
            ) : filteredCadres.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-mono text-xs bg-slate-900/40 rounded-2xl border border-slate-800 p-8 space-y-2">
                <Icon name="users" className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-bold text-slate-300">Tidak ada Kader Lapangan ditemukan</p>
                <p className="text-[11px] text-slate-500">Coba ubah kata kunci pencarian atau filter mitra.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
                <table className="w-full text-xs font-mono text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-3.5 border-b border-slate-800">Kader Lapangan</th>
                      <th className="p-3.5 border-b border-slate-800">Mitra Instansi Terkait</th>
                      <th className="p-3.5 border-b border-slate-800">Jenis Instansi</th>
                      <th className="p-3.5 border-b border-slate-800">Kontak</th>
                      <th className="p-3.5 border-b border-slate-800 text-right">Aksi & Profil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {paginatedCadres.map((cadre) => (
                      <tr key={cadre.uid} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-100">{cadre.displayName}</div>
                          <div className="text-[11px] text-slate-400">{cadre.email}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-cyan-300">{cadre.organization || cadre.partnershipName || 'Mandiri'}</span>
                        </td>
                        <td className="p-3.5 text-slate-400">
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px]">
                            {cadre.partnershipType || 'Sekolah'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300">{cadre.phone || '-'}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedCadreForInspect(cadre)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold text-[11px] transition-colors"
                          >
                            Inspeksi Progress
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AKTIVITAS OPERASIONAL LAPANGAN (BREAKDOWN PER-MITRA & PER-KADER) */}
        {activeTab === 'activities' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Icon name="trendingUp" className="w-4 h-4 text-cyan-400" />
                  Breakdown Aktivitas Operasional Lapangan (Per-Mitra & Per-Kader)
                </h3>
                <p className="text-xs text-slate-400">
                  Rincian aktivitas lapangan terstruktur hierarkis untuk setiap Mitra Instansi dan Kader Lapangan yang terikat.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : partnersList.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-mono text-xs bg-slate-900/40 rounded-2xl border border-slate-800 p-8 space-y-2">
                <Icon name="building" className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-bold text-slate-300">Belum ada Mitra Instansi Terdaftar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {partnersList.map((mitra) => {
                  const linkedCadres = getCadresForMitra(mitra)
                  const mitraSummary = getMitraProgressSummary(mitra)
                  return (
                    <div
                      key={mitra.uid}
                      className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-md"
                    >
                      {/* MITRA HEADER SUMMARY */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              {mitra.partnershipType || 'Sekolah'}
                            </span>
                            <h3 className="text-base font-bold text-slate-100">{mitra.displayName}</h3>
                          </div>
                          <p className="text-xs text-slate-400 font-mono">
                            Email: {mitra.email} • Kontak: {mitra.phone || '-'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
                          <button
                            onClick={() => openCreateCadreModal(mitra)}
                            className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold transition-colors shrink-0"
                          >
                            + Tambah Kader
                          </button>
                        </div>
                      </div>

                      {/* MITRA EFFECTIVE PROGRESS SUMMARY GRID */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs">
                        <div className="space-y-0.5">
                          <span className="text-slate-500 text-[10px] uppercase font-bold">Kader Terikat</span>
                          <p className="text-sm font-bold text-cyan-300">{mitraSummary.cadreCount} Orang</p>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-slate-500 text-[10px] uppercase font-bold">Kode Distribusi</span>
                          <p className="text-sm font-bold text-purple-300">{mitraSummary.totalDists} Kode</p>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-slate-500 text-[10px] uppercase font-bold">Respon Dikumpulkan</span>
                          <p className="text-sm font-bold text-violet-300">{mitraSummary.totalResponses} Tanggapan</p>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-slate-500 text-[10px] uppercase font-bold">Rata-Rata Nilai</span>
                          <p className="text-sm font-bold text-emerald-400">
                            {mitraSummary.avgScore}% <span className="text-[10px] font-normal text-slate-400">({mitraSummary.passRate}% MS)</span>
                          </p>
                        </div>
                      </div>

                      {/* CADRES UNDER THIS MITRA BREAKDOWN */}
                      <div className="space-y-3 pt-1">
                        <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                          <span>Rincian Progress Kader Terikat ({linkedCadres.length})</span>
                          <span className="text-[10px] font-normal text-slate-500">Kinerja Evaluasi Lapangan</span>
                        </h4>

                        {linkedCadres.length === 0 ? (
                          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-500 font-mono">
                            Belum ada kader terdaftar di bawah Mitra ini.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {linkedCadres.map((cadre) => {
                              const cadreProg = getCadreProgressSummary(cadre.uid)
                              return (
                                <div
                                  key={cadre.uid}
                                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between space-y-3 font-mono text-xs hover:border-cyan-500/40 transition-colors"
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-slate-100 text-sm truncate">{cadre.displayName}</span>
                                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold shrink-0">
                                        ✓ Kader Aktif
                                      </span>
                                    </div>
                                    <p className="text-slate-400 text-[11px] truncate">{cadre.email}</p>

                                    {/* CADRE SUMMARY METRIC CHIPS */}
                                    <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[10px]">
                                      <div>
                                        <span className="text-slate-500 block">Kode:</span>
                                        <span className="font-bold text-purple-300">{cadreProg.distCount}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block">Respon:</span>
                                        <span className="font-bold text-cyan-300">{cadreProg.respCount}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block">Rata2 Skor:</span>
                                        <span className="font-bold text-emerald-400">{cadreProg.avgScore}%</span>
                                      </div>
                                    </div>

                                    {/* CADRE PASS RATE PROGRESS BAR */}
                                    <div className="space-y-1 pt-1">
                                      <div className="flex justify-between text-[10px] text-slate-400">
                                        <span>Tingkat Memenuhi Syarat (Pass Rate):</span>
                                        <span className="font-bold text-amber-300">{cadreProg.passRate}%</span>
                                      </div>
                                      <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                                        <div
                                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                                          style={{ width: `${Math.min(100, cadreProg.passRate)}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                                    <span className="text-slate-400 text-[10px]">Inspeksi Detail:</span>
                                    <button
                                      onClick={() => setSelectedCadreForInspect(cadre)}
                                      className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold text-[11px] transition-colors"
                                    >
                                      Inspeksi Progress →
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* DETAIL MITRA MODAL (WITH LINKED CADRES & CONTEXTUAL ADD CADRE) */}
        {selectedMitraDetail && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl my-8">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    Detail Mitra Operasional
                  </span>
                  <h3 className="text-lg font-bold text-slate-100">{selectedMitraDetail.displayName}</h3>
                </div>
                <button
                  onClick={() => setSelectedMitraDetail(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Icon name="x" className="w-5 h-5" />
                </button>
              </div>

              {/* OVERVIEW METRICS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Tipe:</span>
                  <span className="font-bold text-cyan-300">{selectedMitraDetail.partnershipType || 'Sekolah'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Email:</span>
                  <span className="font-bold text-slate-200 truncate block">{selectedMitraDetail.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Kontak:</span>
                  <span className="font-bold text-slate-200">{selectedMitraDetail.phone || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Kader:</span>
                  <span className="font-bold text-emerald-400">{getCadresForMitra(selectedMitraDetail).length} Orang</span>
                </div>
              </div>

              {/* LINKED CADRES LIST */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                    Daftar Kader Terikat ({getCadresForMitra(selectedMitraDetail).length})
                  </h4>

                  <button
                    onClick={() => {
                      const m = selectedMitraDetail
                      setSelectedMitraDetail(null)
                      openCreateCadreModal(m)
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition-colors flex items-center gap-1"
                  >
                    <Icon name="userPlus" className="w-3.5 h-3.5" />
                    + Tambah Kader untuk {selectedMitraDetail.displayName}
                  </button>
                </div>

                {getCadresForMitra(selectedMitraDetail).length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500 font-mono">
                    Belum ada kader terdaftar di bawah mitra ini.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {getCadresForMitra(selectedMitraDetail).map((c) => (
                      <div
                        key={c.uid}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <p className="font-bold text-slate-200">{c.displayName}</p>
                          <p className="text-[11px] text-slate-500">{c.email} • {c.phone || 'No Phone'}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedMitraDetail(null)
                            setSelectedCadreForInspect(c)
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold"
                        >
                          Inspeksi
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* INSPECTION PROGRESS MODAL */}
        {selectedCadreForInspect && (
          <ProfileProgressModal
            isOpen={Boolean(selectedCadreForInspect)}
            onClose={() => setSelectedCadreForInspect(null)}
            userOverride={{
              uid: selectedCadreForInspect.uid,
              displayName: selectedCadreForInspect.displayName,
              email: selectedCadreForInspect.email,
              role: selectedCadreForInspect.role,
              organization: selectedCadreForInspect.organization,
              partnershipType: selectedCadreForInspect.partnershipType,
            }}
          />
        )}

        {/* CREATE MITRA MODAL */}
        {isCreateMitraOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <form
              onSubmit={handleCreateMitra}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm font-mono text-cyan-400 uppercase tracking-wider">
                  Tambah Mitra / Instansi Baru
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateMitraOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <Icon name="x" className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <label className="block text-slate-400 mb-1">Nama Instansi / Mitra:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SMA Negeri 1 Makassar"
                    value={mitraName}
                    onChange={(e) => setMitraName(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Jenis Instansi:</label>
                  <select
                    value={mitraType}
                    onChange={(e) => setMitraType(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {PARTNERSHIP_TYPES.filter((t) => t.id !== 'all').map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Email Login Mitra:</label>
                  <input
                    type="email"
                    required
                    placeholder="mitra@sekolah.sch.id"
                    value={mitraEmail}
                    onChange={(e) => setMitraEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Password Login:</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={mitraPassword}
                    onChange={(e) => setMitraPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">No. WhatsApp / Telepon:</label>
                  <input
                    type="text"
                    placeholder="081234567890"
                    value={mitraPhone}
                    onChange={(e) => setMitraPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateMitraOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMitra}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmittingMitra ? 'Menyimpan...' : 'Simpan Mitra'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CREATE CADRE MODAL (CONTEXTUAL OR GLOBAL) */}
        {isCreateCadreOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <form
              onSubmit={handleCreateCadre}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    {cadreContextMitra ? `Mitra: ${cadreContextMitra.displayName}` : 'Registrasi Kader Lapangan'}
                  </span>
                  <h3 className="font-bold text-sm text-slate-100">Tambah Kader Lapangan Baru</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateCadreOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <Icon name="x" className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs font-mono">
                {cadreContextMitra ? (
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-bold">
                    Kader ini otomatis terhubung ke Mitra: {cadreContextMitra.displayName}
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-400 mb-1">Nama Instansi / Mitra Terkait:</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: SMA Negeri 1 Makassar"
                      value={cadreOrganization}
                      onChange={(e) => setCadreOrganization(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 mb-1">Nama Lengkap Kader:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ahmad Rizky"
                    value={cadreName}
                    onChange={(e) => setCadreName(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Email Login Kader:</label>
                  <input
                    type="email"
                    required
                    placeholder="kader@mitra.com"
                    value={cadreEmail}
                    onChange={(e) => setCadreEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Password Login:</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={cadrePassword}
                    onChange={(e) => setCadrePassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">No. WhatsApp Kader:</label>
                  <input
                    type="text"
                    placeholder="081234567890"
                    value={cadrePhone}
                    onChange={(e) => setCadrePhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateCadreOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCadre}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmittingCadre ? 'Mendaftarkan...' : 'Simpan Kader'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
