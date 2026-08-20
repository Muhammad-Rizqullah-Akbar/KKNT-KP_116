'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/shared/safeFetch'
import { getArticles, type ArticleData } from '@/lib/firebase/repositories/articles.repo'
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
  { id: 'Sekolah', label: 'Sekolah / Kampus' },
  { id: 'Kelurahan / Desa', label: 'Kelurahan / Kantor Desa' },
  { id: 'Pasar', label: 'Pasar Tradisional / Modern' },
  { id: 'Puskesmas / Posyandu', label: 'Puskesmas / Posyandu' },
  { id: 'Komunitas / Ormas', label: 'Komunitas / Ormas / PKK' },
  { id: 'Instansi Pemerintah', label: 'Instansi Pemerintah / BPOM' },
  { id: 'Lainnya', label: 'Lainnya' },
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
  const [articles, setArticles] = useState<ArticleData[]>([])
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

  // Update tab in URL (For Super Admin / Admin)
  const handleTabChange = (tab: 'mitra' | 'cadres' | 'activities') => {
    setActiveTab(tab)
    setCurrentPage(1)
    router.replace(`/dashboard/partnership?tab=${tab}`, { scroll: false })
  }

  // Fetch Users, Distributions, Responses, & Articles
  const fetchUsersData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [usersRes, distRes, respRes, articlesData] = await Promise.all([
        safeFetchJson('/api/auth/users'),
        safeFetchJson('/api/v1_5/distributions'),
        safeFetchJson('/api/v1_5/responses'),
        getArticles().catch(() => []),
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
      if (Array.isArray(articlesData)) {
        setArticles(articlesData)
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
    const cadreUser = allUsers.find((u) => u.uid === cadreUid)
    const cadreEmail = (cadreUser?.email || '').toLowerCase().trim()
    const cadreDisplayName = (cadreUser?.displayName || '').toLowerCase().trim()

    // 1. Distributions & Survey Responses
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

    // 2. CMS Articles authored by this cadre
    const cadreArticles = articles.filter((a) => {
      if (a.authorId && a.authorId === cadreUid) return true
      if (a.createdBy && a.createdBy === cadreUid) return true

      const authorLower = (a.author || '').toLowerCase().trim()
      if (cadreEmail && authorLower === cadreEmail) return true
      if (cadreDisplayName && cadreDisplayName.length > 2 && authorLower === cadreDisplayName) return true

      return false
    })

    const articleCount = cadreArticles.length
    const articleViews = cadreArticles.reduce((acc, a) => acc + (a.views || 0), 0)

    return {
      distCount: cadreDists.length,
      respCount: cadreResponses.length,
      articleCount,
      articleViews,
      hasWrittenArticle: articleCount > 0,
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
    let totalArticles = 0
    let totalArticleViews = 0
    let allScores: number[] = []

    // Articles authored directly by Mitra
    const mitraEmail = (mitra.email || '').toLowerCase().trim()
    const mitraDisplayName = (mitra.displayName || mitra.organization || '').toLowerCase().trim()
    const directMitraArticles = articles.filter((a) => {
      if (a.authorId === mitra.uid || a.createdBy === mitra.uid) return true
      const authorLower = (a.author || '').toLowerCase().trim()
      if (mitraEmail && authorLower === mitraEmail) return true
      if (mitraDisplayName && mitraDisplayName.length > 2 && authorLower === mitraDisplayName) return true
      return false
    })

    totalArticles += directMitraArticles.length
    totalArticleViews += directMitraArticles.reduce((acc, a) => acc + (a.views || 0), 0)

    linkedCadres.forEach((cadre) => {
      const prog = getCadreProgressSummary(cadre.uid)
      totalDists += prog.distCount
      totalResponses += prog.respCount
      totalArticles += prog.articleCount
      totalArticleViews += prog.articleViews

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
      totalArticles,
      totalArticleViews,
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

  // Filtered Mitra (for Admin View)
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

  // Filtered Cadres (Mitra role strictly sees only cadres owned by their partnership)
  const filteredCadres = useMemo(() => {
    const myOrg = (userData?.organization || userData?.displayName || '').toLowerCase().trim()

    return allUsers.filter((u) => {
      if (u.role !== 'cadre') return false

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

  // Cadres Grouped & Separated BY MITRA for Super Admin / Admin / BPOM
  const cadresByMitraGroup = useMemo(() => {
    const attachedCadresMap = new Map<string, UserProfile[]>()
    const unattachedCadres: UserProfile[] = []

    partnersList.forEach((m) => {
      attachedCadresMap.set(m.uid, [])
    })

    filteredCadres.forEach((cadre) => {
      let matchedMitraUid: string | null = null

      if (cadre.partnershipId && attachedCadresMap.has(cadre.partnershipId)) {
        matchedMitraUid = cadre.partnershipId
      } else {
        const cOrg = (cadre.organization || cadre.partnershipName || '').toLowerCase().trim()
        if (cOrg) {
          const found = partnersList.find((m) => {
            const mOrg = (m.organization || m.displayName || '').toLowerCase().trim()
            return mOrg && mOrg === cOrg
          })
          if (found) matchedMitraUid = found.uid
        }
      }

      if (matchedMitraUid && attachedCadresMap.has(matchedMitraUid)) {
        attachedCadresMap.get(matchedMitraUid)!.push(cadre)
      } else {
        unattachedCadres.push(cadre)
      }
    })

    return {
      mitraGroups: partnersList.map((mitra) => ({
        mitra,
        cadres: attachedCadresMap.get(mitra.uid) || [],
      })),
      unattachedCadres,
    }
  }, [filteredCadres, partnersList])

  // Pagination Math
  const activeListLength = activeTab === 'mitra' ? filteredMitra.length : filteredCadres.length
  const totalPages = Math.ceil(activeListLength / pageSize) || 1
  const paginatedMitra = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredMitra.slice(start, start + pageSize)
  }, [filteredMitra, currentPage, pageSize])

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
          displayName: mitraName || mitraEmail.split('@')[0],
          organization: mitraName,
          partnershipType: mitraType,
          phone: mitraPhone,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal mendaftarkan Mitra Instansi.')

      showToast(`Mitra "${mitraName || mitraEmail}" berhasil didaftarkan!`)
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
    try {
      const targetOrg = cadreContextMitra
        ? cadreContextMitra.organization || cadreContextMitra.displayName
        : cadreOrganization || 'Independen'

      const targetPartnershipId = cadreContextMitra ? cadreContextMitra.uid : undefined

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

  // Specific Mitra Object & Progress Summary for Mitra Login
  const currentMitraObj = useMemo(() => {
    if (!isPartnershipRole) return null
    return partnersList[0] || ({
      uid: user?.uid || '',
      email: user?.email || '',
      displayName: userData?.displayName || 'Akun Mitra Saya',
      role: 'partnership',
      organization: (userData as any)?.organization || userData?.displayName,
      partnershipType: (userData as any)?.partnershipType || 'Sekolah',
      phone: (userData as any)?.phone || '-',
    } as UserProfile)
  }, [isPartnershipRole, partnersList, user, userData])

  const currentMitraSummary = useMemo(() => {
    if (!currentMitraObj) return null
    return getMitraProgressSummary(currentMitraObj)
  }, [currentMitraObj, allUsers, distributions, responses, articles])

  const topbarTitle = isPartnershipRole
    ? `Dashboard Kemitraan: ${userData?.organization || userData?.displayName || 'Akun Mitra Saya'}`
    : 'Domain Kemitraan Operasional & Pengawasan'

  const topbarSubtitle = isPartnershipRole
    ? `Profil Instansi, Data Kader Binaan, & Rekapitulasi Aktivitas Lapangan ${userData?.organization || ''}`
    : 'Pengelolaan Master Data Mitra, Pembagian Kader Lapangan, & Monitoring Aktivitas'

  return (
    <div className="min-h-screen bg-[#080812] text-slate-100 font-sans flex flex-col">
      <Topbar title={topbarTitle} subtitle={topbarSubtitle} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-200 text-xs font-bold font-mono shadow-2xl flex items-center gap-2 animate-bounce">
          <Icon name="checkCircle" className="w-4 h-4 text-cyan-400" />
          {toastMessage}
        </div>
      )}

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* ========================================================================= */}
        {/* CASE 1: MITRA ROLE LOGIN -> UNIFIED SINGLE-PAGE LAYOUT (NO TABS)          */}
        {/* ========================================================================= */}
        {isPartnershipRole ? (
          <div className="space-y-6">
            {/* SECTION 1: PROFIL & METRIK INSTANSI MITRA */}
            <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/60 to-slate-900 border border-purple-500/30 p-6 shadow-2xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-purple-500 to-emerald-500 p-1 shrink-0 shadow-xl">
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-xl font-extrabold text-white">
                      {userData?.displayName?.charAt(0) || user?.email?.charAt(0) || 'M'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-extrabold text-slate-100">
                        {userData?.organization || userData?.displayName || 'Instansi Mitra BPOM'}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-extrabold">
                        {userData?.partnershipType || 'Sekolah'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        PARTNER OPERATIONAL HUB
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-mono">
                      Email Login: {user?.email} • Kontak HP/WA: <span className="text-cyan-300 font-bold">{(userData as any)?.phone || '-'}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => openCreateCadreModal()}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all self-start md:self-auto"
                >
                  <Icon name="userPlus" className="w-4 h-4" />
                  <span>+ Daftarkan Kader Baru</span>
                </button>
              </div>

              {/* 4 HIGH-VALUE METRIC PODS FOR MITRA */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Kader Binaan Aktif</span>
                    <Icon name="users" className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-slate-100">{filteredCadres.length}</p>
                  <span className="text-[10px] text-purple-300 font-mono">Kader Terdaftar</span>
                </div>

                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Kode Distribusi Aktif</span>
                    <Icon name="send" className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-cyan-300">{currentMitraSummary?.totalDists || 0}</p>
                  <span className="text-[10px] text-cyan-400 font-mono">Instrumen Kuesioner</span>
                </div>

                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Respon Survei Terkumpul</span>
                    <Icon name="checkCircle" className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-purple-300">{currentMitraSummary?.totalResponses || 0}</p>
                  <span className="text-[10px] text-slate-500 font-mono">Hasil Responden</span>
                </div>

                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Artikel & Views</span>
                    <Icon name="bookOpen" className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-emerald-300">{currentMitraSummary?.totalArticles || 0}</p>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Icon name="eye" className="w-3 h-3 text-emerald-400" />
                    {currentMitraSummary?.totalArticleViews || 0} Total Views
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 2: DAFTAR & DATA KADER LAPANGAN BINAAN */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                    <Icon name="users" className="w-4 h-4 text-cyan-400" />
                    <span>Daftar Kader Lapangan Binaan Instansi ({filteredCadres.length} Orang)</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Kader resmi yang terikat di bawah manajemen {userData?.organization || userData?.displayName}.
                  </p>
                </div>

                <button
                  onClick={() => openCreateCadreModal()}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center gap-1.5"
                >
                  <Icon name="userPlus" className="w-3.5 h-3.5 text-cyan-400" />
                  <span>+ Tambah Kader</span>
                </button>
              </div>

              {filteredCadres.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-mono text-xs bg-slate-950/60 rounded-2xl border border-slate-800 p-8 space-y-2">
                  <Icon name="users" className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="font-bold text-slate-300">Belum Ada Kader Terdaftar Untuk Instansi Ini</p>
                  <p className="text-[11px] text-slate-500">Klik "+ Tambah Kader" untuk mendaftarkan kader binaan pertama Anda.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-xs font-mono text-left">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="p-3.5 border-b border-slate-800">Nama Kader Lapangan</th>
                        <th className="p-3.5 border-b border-slate-800">Email Login</th>
                        <th className="p-3.5 border-b border-slate-800">No. HP / WA</th>
                        <th className="p-3.5 border-b border-slate-800 text-right">Aksi Inspeksi Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredCadres.map((cadre) => (
                        <tr key={cadre.uid} className="hover:bg-slate-900/60 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-100">{cadre.displayName}</div>
                            <div className="text-[10px] text-purple-300 font-mono">ID: {cadre.uid.substring(0, 8)}</div>
                          </td>
                          <td className="p-3.5 text-slate-300">{cadre.email}</td>
                          <td className="p-3.5 text-slate-400">{cadre.phone || '-'}</td>
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

            {/* SECTION 3: BREAKDOWN AKTIVITAS & CAPAIAN LAPANGAN KADER */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <Icon name="trendingUp" className="w-4 h-4 text-cyan-400" />
                  <span>Breakdown Aktivitas & Capaian Lapangan Per-Kader Binaan</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Rincian penulisan artikel edukasi CMS, total views pembaca, jumlah kode instrumen, dan respon survei.
                </p>
              </div>

              {filteredCadres.length === 0 ? (
                <div className="p-6 text-center text-slate-500 font-mono text-xs bg-slate-950 rounded-xl border border-slate-800">
                  Belum ada data kader untuk menampilkan breakdown aktivitas.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-xs font-mono text-left">
                    <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-3.5 border-b border-slate-800">Nama Kader Lapangan</th>
                        <th className="p-3.5 border-b border-slate-800">Email Login</th>
                        <th className="p-3.5 border-b border-slate-800">Status Artikel CMS</th>
                        <th className="p-3.5 border-b border-slate-800">Views Artikel</th>
                        <th className="p-3.5 border-b border-slate-800">Kode Dibuat</th>
                        <th className="p-3.5 border-b border-slate-800">Respon Terjaring</th>
                        <th className="p-3.5 border-b border-slate-800 text-right">Detail Inspeksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredCadres.map((cadre) => {
                        const prog = getCadreProgressSummary(cadre.uid)
                        return (
                          <tr key={cadre.uid} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-3.5 font-bold text-slate-100">{cadre.displayName}</td>
                            <td className="p-3.5 text-slate-400">{cadre.email}</td>
                            <td className="p-3.5">
                              {prog.hasWrittenArticle ? (
                                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] flex items-center gap-1 w-fit">
                                  <Icon name="fileText" className="w-3 h-3 text-emerald-400" />
                                  {prog.articleCount} Artikel Diterbitkan
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-500 border border-slate-800 text-[10px] flex items-center gap-1 w-fit">
                                  <Icon name="xCircle" className="w-3 h-3 text-slate-500" />
                                  Belum Buat Artikel
                                </span>
                              )}
                            </td>
                            <td className="p-3.5">
                              {prog.articleViews > 0 ? (
                                <span className="font-bold text-cyan-300 font-mono flex items-center gap-1">
                                  <Icon name="eye" className="w-3.5 h-3.5 text-cyan-400" />
                                  {prog.articleViews} Views
                                </span>
                              ) : (
                                <span className="text-slate-500 font-mono">0 Views</span>
                              )}
                            </td>
                            <td className="p-3.5 text-cyan-400 font-bold">{prog.distCount} Kode</td>
                            <td className="p-3.5 text-purple-300 font-bold">{prog.respCount} Respon</td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => setSelectedCadreForInspect(cadre)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700"
                              >
                                Inspeksi
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
          </div>
        ) : (
          /* ========================================================================= */
          /* CASE 2: SUPER ADMIN / ADMIN / BPOM LOGIN -> MULTI-TAB VIEW                */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* DOMAIN HEADER & NAVIGATION TABS FOR ADMIN */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/[0.06] backdrop-blur-md">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold font-display text-white tracking-wide">Domain Kemitraan</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    GLOBAL OPERATIONAL HUB
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Kelola ekosistem operasional: Mitra Instansi, Kader Lapangan Terikat (Dipisahkan per-Mitra), & Aktivitas.
                </p>
              </div>

              {/* TAB BUTTONS FOR ADMIN */}
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
                  Mitra ({partnersList.length})
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
                  Tab Kader Dipisah Per-Mitra ({filteredCadres.length})
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

                  {activeTab === 'cadres' && (
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

                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                  {activeTab === 'mitra' && (
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
                                <span className="text-slate-500">Kontak HP/WA:</span>
                                <span className="text-slate-200 font-bold">{mitra.phone || '-'}</span>
                              </p>
                              <p className="flex justify-between">
                                <span className="text-slate-500">Kader Binaan:</span>
                                <span className="text-cyan-400 font-bold">{linkedCadres.length} Orang</span>
                              </p>
                            </div>
                          </div>

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

            {/* TAB 2: CADRES VIEW - GROUPED BY MITRA FOR SUPER ADMIN / ADMIN / BPOM */}
            {activeTab === 'cadres' && (
              <div className="space-y-6">
                {isLoading ? (
                  <SkeletonTable rows={6} cols={5} />
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Icon name="shieldCheck" className="w-5 h-5 text-cyan-400 shrink-0" />
                        <div>
                          <p className="font-bold text-sm text-cyan-200">Tampilan Pengawasan: Kader Dipisah Berdasarkan Mitra</p>
                          <p className="text-cyan-400/80 mt-0.5">
                            Daftar kader di bawah ini secara eksplisit dipisahkan per-mitra instansi induk untuk memudahkan supervisi.
                          </p>
                        </div>
                      </div>
                    </div>

                    {cadresByMitraGroup.mitraGroups.map(({ mitra, cadres }) => (
                      <div key={mitra.uid} className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                              <Icon name="building" className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-base text-slate-100">{mitra.displayName}</h3>
                                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                                  {mitra.partnershipType || 'Instansi'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 font-mono">
                                Email: {mitra.email} • HP/WA: <span className="text-cyan-300 font-bold">{mitra.phone || '-'}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-start sm:self-auto">
                            <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-cyan-300">
                              {cadres.length} Kader Binaan
                            </span>

                            <button
                              onClick={() => openCreateCadreModal(mitra)}
                              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-mono font-bold text-xs transition-colors flex items-center gap-1"
                            >
                              <Icon name="userPlus" className="w-3.5 h-3.5 text-cyan-400" />
                              + Kader Mitra Ini
                            </button>
                          </div>
                        </div>

                        {cadres.length === 0 ? (
                          <div className="p-6 text-center text-slate-500 font-mono text-xs bg-slate-950/60 rounded-2xl border border-slate-800/80">
                            Belum ada Kader Lapangan terdaftar di bawah {mitra.displayName}.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                            <table className="w-full text-xs font-mono text-left">
                              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                                <tr>
                                  <th className="p-3 border-b border-slate-800">Nama Kader</th>
                                  <th className="p-3 border-b border-slate-800">Email Login</th>
                                  <th className="p-3 border-b border-slate-800">No. HP / WA</th>
                                  <th className="p-3 border-b border-slate-800 text-right">Aksi Inspeksi Progress</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60">
                                {cadres.map((c) => (
                                  <tr key={c.uid} className="hover:bg-slate-900/60 transition-colors">
                                    <td className="p-3">
                                      <div className="font-bold text-slate-100">{c.displayName}</div>
                                      <div className="text-[10px] text-purple-300 font-mono">ID: {c.uid.substring(0, 8)}</div>
                                    </td>
                                    <td className="p-3 text-slate-300">{c.email}</td>
                                    <td className="p-3 text-slate-400">{c.phone || '-'}</td>
                                    <td className="p-3 text-right">
                                      <button
                                        onClick={() => setSelectedCadreForInspect(c)}
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
                    ))}

                    {cadresByMitraGroup.unattachedCadres.length > 0 && (
                      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <div className="flex items-center gap-2">
                            <Icon name="user" className="w-4 h-4 text-slate-300" />
                            <span className="text-base font-bold text-slate-200">Kader Lapangan Independen / Tanpa Mitra Induk</span>
                            <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold">
                              {cadresByMitraGroup.unattachedCadres.length} Kader
                            </span>
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                          <table className="w-full text-xs font-mono text-left">
                            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                              <tr>
                                <th className="p-3 border-b border-slate-800">Nama Kader</th>
                                <th className="p-3 border-b border-slate-800">Email Login</th>
                                <th className="p-3 border-b border-slate-800">No. HP / WA</th>
                                <th className="p-3 border-b border-slate-800 text-right">Aksi Inspeksi Progress</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {cadresByMitraGroup.unattachedCadres.map((c) => (
                                <tr key={c.uid} className="hover:bg-slate-900/60 transition-colors">
                                  <td className="p-3">
                                    <div className="font-bold text-slate-100">{c.displayName}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">ID: {c.uid.substring(0, 8)}</div>
                                  </td>
                                  <td className="p-3 text-slate-300">{c.email}</td>
                                  <td className="p-3 text-slate-400">{c.phone || '-'}</td>
                                  <td className="p-3 text-right">
                                    <button
                                      onClick={() => setSelectedCadreForInspect(c)}
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
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: AKTIVITAS OPERASIONAL LAPANGAN */}
            {activeTab === 'activities' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <Icon name="trendingUp" className="w-4 h-4 text-cyan-400" />
                      Breakdown Aktivitas Operasional Lapangan (Edukasi CMS, Views, & Survei)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Rincian aktivitas lapangan terstruktur hierarkis untuk setiap Mitra Instansi dan Kader Lapangan, termasuk status penulisan artikel edukasi & total views.
                    </p>
                  </div>
                </div>

                {isLoading ? (
                  <SkeletonTable rows={6} cols={5} />
                ) : partnersList.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 font-mono text-xs bg-slate-900/40 rounded-2xl border border-slate-800 p-8">
                    Belum ada data aktivitas kemitraan ditemukan.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {partnersList.map((mitra) => {
                      const summary = getMitraProgressSummary(mitra)
                      const linkedCadres = getCadresForMitra(mitra)

                      return (
                        <div key={mitra.uid} className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-base text-slate-100">{mitra.displayName}</h4>
                                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                  {mitra.partnershipType || 'Instansi'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 font-mono">
                                PIC / Email: {mitra.email} • HP/WA: {mitra.phone || '-'}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                                <span className="text-[10px] text-slate-500 block font-mono">Kader Binaan</span>
                                <span className="text-sm font-bold font-mono text-slate-100">{summary.cadreCount} Orang</span>
                              </div>
                              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                                <span className="text-[10px] text-slate-500 block font-mono">Artikel Edukasi</span>
                                <span className="text-sm font-bold font-mono text-emerald-400">{summary.totalArticles} Artikel</span>
                              </div>
                              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                                <span className="text-[10px] text-slate-500 block font-mono">Total Pembaca Views</span>
                                <span className="text-sm font-bold font-mono text-emerald-300 flex items-center justify-center gap-1">
                                  <Icon name="eye" className="w-3.5 h-3.5 text-emerald-400" />
                                  {summary.totalArticleViews}
                                </span>
                              </div>
                              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                                <span className="text-[10px] text-slate-500 block font-mono">Total Kode Active</span>
                                <span className="text-sm font-bold font-mono text-cyan-400">{summary.totalDists} Kode</span>
                              </div>
                              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                                <span className="text-[10px] text-slate-500 block font-mono">Respon Terkumpul</span>
                                <span className="text-sm font-bold font-mono text-purple-300">{summary.totalResponses}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h5 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Icon name="users" className="w-3.5 h-3.5 text-cyan-400" />
                              Detail Aktivitas Per-Kader Binaan ({linkedCadres.length})
                            </h5>

                            {linkedCadres.length === 0 ? (
                              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-500 font-mono text-center">
                                Belum ada kader terdaftar di bawah mitra ini.
                              </div>
                            ) : (
                              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                                <table className="w-full text-xs font-mono text-left">
                                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                                    <tr>
                                      <th className="p-3 border-b border-slate-800">Nama Kader Lapangan</th>
                                      <th className="p-3 border-b border-slate-800">Email Login</th>
                                      <th className="p-3 border-b border-slate-800">Status Artikel CMS</th>
                                      <th className="p-3 border-b border-slate-800">Views Artikel</th>
                                      <th className="p-3 border-b border-slate-800">Kode Dibuat</th>
                                      <th className="p-3 border-b border-slate-800">Respon Terjaring</th>
                                      <th className="p-3 border-b border-slate-800 text-right">Detail Inspeksi</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/60">
                                    {linkedCadres.map((cadre) => {
                                      const prog = getCadreProgressSummary(cadre.uid)
                                      return (
                                        <tr key={cadre.uid} className="hover:bg-slate-900/50 transition-colors">
                                          <td className="p-3 font-bold text-slate-100">{cadre.displayName}</td>
                                          <td className="p-3 text-slate-400">{cadre.email}</td>
                                          <td className="p-3">
                                            {prog.hasWrittenArticle ? (
                                              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] flex items-center gap-1 w-fit">
                                                <Icon name="fileText" className="w-3 h-3 text-emerald-400" />
                                                {prog.articleCount} Artikel Diterbitkan
                                              </span>
                                            ) : (
                                              <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-500 border border-slate-800 text-[10px] flex items-center gap-1 w-fit">
                                                <Icon name="xCircle" className="w-3 h-3 text-slate-500" />
                                                Belum Buat Artikel
                                              </span>
                                            )}
                                          </td>
                                          <td className="p-3">
                                            {prog.articleViews > 0 ? (
                                              <span className="font-bold text-cyan-300 font-mono flex items-center gap-1">
                                                <Icon name="eye" className="w-3.5 h-3.5 text-cyan-400" />
                                                {prog.articleViews} Views
                                              </span>
                                            ) : (
                                              <span className="text-slate-500 font-mono">0 Views</span>
                                            )}
                                          </td>
                                          <td className="p-3 text-cyan-400 font-bold">{prog.distCount} Kode</td>
                                          <td className="p-3 text-purple-300 font-bold">{prog.respCount} Respon</td>
                                          <td className="p-3 text-right">
                                            <button
                                              onClick={() => setSelectedCadreForInspect(cadre)}
                                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700"
                                            >
                                              Inspeksi
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
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODAL: DETAIL MITRA & LIST KADER BINAAN (FOR ADMIN) */}
        {selectedMitraDetail && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Icon name="building" className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-100">{selectedMitraDetail.displayName}</h3>
                    <p className="text-xs text-slate-400 font-mono">{selectedMitraDetail.email} • {selectedMitraDetail.partnershipType}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMitraDetail(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <Icon name="x" className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    Daftar Kader Lapangan Terkait ({getCadresForMitra(selectedMitraDetail).length})
                  </h4>
                  <button
                    onClick={() => {
                      const m = selectedMitraDetail
                      setSelectedMitraDetail(null)
                      openCreateCadreModal(m)
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold"
                  >
                    + Tambah Kader Untuk Mitra Ini
                  </button>
                </div>

                {getCadresForMitra(selectedMitraDetail).length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-mono text-xs bg-slate-950 rounded-xl border border-slate-800">
                    Belum ada kader terdaftar untuk mitra instansi ini.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/80 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden text-xs font-mono">
                    {getCadresForMitra(selectedMitraDetail).map((cadre) => (
                      <div key={cadre.uid} className="p-3 flex items-center justify-between hover:bg-slate-900/50">
                        <div>
                          <p className="font-bold text-slate-100">{cadre.displayName}</p>
                          <p className="text-[11px] text-slate-400">{cadre.email} • HP: {cadre.phone || '-'}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedMitraDetail(null)
                            setSelectedCadreForInspect(cadre)
                          }}
                          className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[11px]"
                        >
                          Inspeksi
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => setSelectedMitraDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: INSPEKSI PROGRESS KADER */}
        {selectedCadreForInspect && (
          <ProfileProgressModal
            isOpen={!!selectedCadreForInspect}
            onClose={() => setSelectedCadreForInspect(null)}
            userOverride={{
              uid: selectedCadreForInspect.uid,
              email: selectedCadreForInspect.email,
              displayName: selectedCadreForInspect.displayName,
              role: selectedCadreForInspect.role,
              organization: selectedCadreForInspect.organization,
              partnershipType: selectedCadreForInspect.partnershipType,
              phone: selectedCadreForInspect.phone,
            }}
          />
        )}

        {/* MODAL: DAFTAR MITRA BARU (SUPER ADMIN / ADMIN ONLY) */}
        {isCreateMitraOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fadeIn text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <Icon name="building" className="w-5 h-5 text-cyan-400" />
                  Pendaftaran Akun Mitra Instansi Baru
                </h3>
                <button onClick={() => setIsCreateMitraOpen(false)} className="text-slate-400 hover:text-white">
                  <Icon name="x" className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateMitra} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nama Instansi / Mitra <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Puskesmas Bantaeng / SD Negeri 01..."
                    value={mitraName}
                    onChange={(e) => setMitraName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Jenis Instansi Kemitraan</label>
                  <select
                    value={mitraType}
                    onChange={(e) => setMitraType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2"
                  >
                    {PARTNERSHIP_TYPES.filter((t) => t.id !== 'all').map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Login Mitra <span className="text-rose-400">*</span></label>
                  <input
                    type="email"
                    required
                    placeholder="mitra@instansi.id"
                    value={mitraEmail}
                    onChange={(e) => setMitraEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Password Login <span className="text-rose-400">*</span></label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={mitraPassword}
                    onChange={(e) => setMitraPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">No. HP / WhatsApp PIC</label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={mitraPhone}
                    onChange={(e) => setMitraPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateMitraOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingMitra}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-bold flex items-center gap-1.5"
                  >
                    {isSubmittingMitra ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="plus" className="w-4 h-4" />}
                    <span>{isSubmittingMitra ? 'Mendaftarkan...' : 'Daftarkan Mitra'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: DAFTAR KADER BARU */}
        {isCreateCadreOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fadeIn text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <Icon name="userPlus" className="w-5 h-5 text-cyan-400" />
                  Pendaftaran Kader Lapangan Baru
                </h3>
                <button onClick={() => setIsCreateCadreOpen(false)} className="text-slate-400 hover:text-white">
                  <Icon name="x" className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCadre} className="space-y-3">
                {cadreContextMitra ? (
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200">
                    <p className="font-bold text-[11px]">Mitra Induk Terkait:</p>
                    <p className="text-sm font-extrabold text-white mt-0.5">{cadreContextMitra.displayName}</p>
                    <p className="text-[10px] font-mono text-purple-300">{cadreContextMitra.partnershipType} • {cadreContextMitra.email}</p>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Pilih Mitra Instansi Induk</label>
                    <select
                      value={cadreOrganization}
                      onChange={(e) => {
                        setCadreOrganization(e.target.value)
                        const found = partnersList.find((m) => m.displayName === e.target.value || m.organization === e.target.value)
                        if (found) setCadreContextMitra(found)
                      }}
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2"
                    >
                      <option value="">-- Kader Independen / Tanpa Mitra Induk --</option>
                      {partnersList.map((m) => (
                        <option key={m.uid} value={m.organization || m.displayName}>
                          {m.displayName} ({m.partnershipType})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nama Lengkap Kader <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ani Suryani, S.Pd..."
                    value={cadreName}
                    onChange={(e) => setCadreName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Login Kader <span className="text-rose-400">*</span></label>
                  <input
                    type="email"
                    required
                    placeholder="kader@instansi.id"
                    value={cadreEmail}
                    onChange={(e) => setCadreEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Password Login <span className="text-rose-400">*</span></label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={cadrePassword}
                    onChange={(e) => setCadrePassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">No. HP / WhatsApp Kader</label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={cadrePhone}
                    onChange={(e) => setCadrePhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateCadreOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCadre}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-bold flex items-center gap-1.5"
                  >
                    {isSubmittingCadre ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="userPlus" className="w-4 h-4" />}
                    <span>{isSubmittingCadre ? 'Mendaftarkan...' : 'Daftarkan Kader'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
