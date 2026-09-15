'use client'

import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/infra/safe-fetch'
import { getArticles, type ArticleData } from '@/lib/repositories/articles.repo'
import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import { Icon } from '@/components/ui/Icons'
import { ProfileProgressModal } from '@/features/dashboard/components/modals/ProfileProgressModal'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/lib/hooks'
import { getCadreProgressSummary, getMitraProgressSummary } from './helpers'
import type { UserProfile, CadresByMitraGroup } from './types'
import MitraView from './mitra-view'
import AdminView from './admin-view'
import { MitraDetailModal, CreateMitraModal, CreateCadreModal } from './modals'
import { useCreateMitra } from './use-create-mitra'
import { useCreateCadre } from './use-create-cadre'

export default function PartnershipDomainPage() {
  const { user, userData } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialTab = (searchParams.get('tab') as 'mitra' | 'cadres' | 'activities') || 'mitra'
  const [activeTab, setActiveTab] = useState<'mitra' | 'cadres' | 'activities'>(initialTab)

  const isSuperAdminOrAdmin = userData?.role === 'super_admin'
  const isPartnershipRole = userData?.role === 'partnership'

  const queryClient = useQueryClient()

  const {
    data: {
      allUsers = [],
      distributions = [],
      responses = [],
      articles = [],
    } = {},
    isLoading,
  } = useQuery<{
    allUsers: UserProfile[]
    distributions: any[]
    responses: any[]
    articles: ArticleData[]
  }>({
    queryKey: queryKeys.partnership.data,
    queryFn: async () => {
      const [usersRes, distRes, respRes, articlesData] = await Promise.all([
        safeFetchJson('/api/auth/users'),
        safeFetchJson('/api/distributions'),
        safeFetchJson('/api/responses'),
        getArticles().catch(() => []),
      ])

      return {
        allUsers: usersRes.ok && usersRes.data && Array.isArray(usersRes.data.users) ? usersRes.data.users : [],
        distributions: distRes.ok && distRes.data && Array.isArray(distRes.data.distributions) ? distRes.data.distributions : [],
        responses: respRes.ok && respRes.data && Array.isArray(respRes.data.responses) ? respRes.data.responses : [],
        articles: Array.isArray(articlesData) ? articlesData : [],
      }
    },
  })

  const invalidatePartnershipData = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.partnership.data })

  const { visible, message, show } = useToast()

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

  // Create Mitra form state + handler (extracted hook)
  const createMitra = useCreateMitra({ invalidatePartnershipData, show })
  const {
    isCreateMitraOpen,
    setIsCreateMitraOpen,
    mitraEmail,
    setMitraEmail,
    mitraPassword,
    setMitraPassword,
    mitraName,
    setMitraName,
    mitraType,
    setMitraType,
    mitraPhone,
    setMitraPhone,
    isSubmittingMitra,
    handleCreateMitra,
  } = createMitra

  // Update tab in URL (For Super Admin / Admin)
  const handleTabChange = (tab: 'mitra' | 'cadres' | 'activities') => {
    setActiveTab(tab)
    setCurrentPage(1)
    router.replace(`/dashboard/partnership?tab=${tab}`, { scroll: false })
  }

  // Helper: Get Cadre Progress Summary
  const getCadreProgress = (cadreUid: string) =>
    getCadreProgressSummary(cadreUid, allUsers, distributions, responses, articles)

  // Filter Mitra list (If role is partnership, ONLY return the current logged-in mitra)
  const partnersList = useMemo(() => {
    if (isPartnershipRole) {
      const me = allUsers.find((account) => account.uid === user?.uid) || (userData ? {
        uid: user?.uid || '',
        email: user?.email || '',
        displayName: userData.displayName || 'Akun Mitra Saya',
        role: 'partnership',
        organization: userData.organization || userData.displayName,
        partnershipType: userData.partnershipType || 'Sekolah',
        phone: userData.phone || '-',
      } : null)

      return me ? [me] : []
    }

    const mitraMap = new Map<string, UserProfile>()

    // 1. Explicit partnership role users
    allUsers
      .filter((account) => account.role === 'partnership')
      .forEach((account) => {
        mitraMap.set(account.uid, account)
      })

    // 2. Implicit organizations from cadres
    allUsers
      .filter((account) => account.role === 'cadre' && account.organization)
      .forEach((cadre) => {
        const orgKey = 'org_' + (cadre.partnershipId || cadre.organization)
        if (!mitraMap.has(orgKey) && !mitraMap.has(cadre.partnershipId || '')) {
          mitraMap.set(orgKey, {
            uid: orgKey,
            email: cadre.email || 'mitra@kkntkp.id',
            displayName: cadre.partnershipName || cadre.organization || 'Mitra Instansi',
            role: 'partnership',
            organization: cadre.organization,
            partnershipType: cadre.partnershipType || 'Sekolah',
            phone: cadre.phone || '-',
            createdAt: cadre.createdAt,
          })
        }
      })

    return Array.from(mitraMap.values())
  }, [allUsers, isPartnershipRole, user, userData])

  // Create Cadre form state + handler (extracted hook)
  const createCadre = useCreateCadre({
    isPartnershipRole,
    partnersList,
    user,
    userData,
    invalidatePartnershipData,
    show,
  })
  const {
    isCreateCadreOpen,
    setIsCreateCadreOpen,
    cadreContextMitra,
    setCadreContextMitra,
    cadreEmail,
    setCadreEmail,
    cadrePassword,
    setCadrePassword,
    cadreName,
    setCadreName,
    cadrePhone,
    setCadrePhone,
    cadreOrganization,
    setCadreOrganization,
    cadrePartnershipType,
    isSubmittingCadre,
    openCreateCadreModal,
    handleCreateCadre,
  } = createCadre

  // Get Cadres for a specific Mitra
  const getCadresForMitra = (mitra: UserProfile) => {
    return allUsers.filter(
      (account) =>
        account.role === 'cadre' &&
        (account.partnershipId === mitra.uid ||
          (account.organization && account.organization.toLowerCase() === (mitra.organization || mitra.displayName || '').toLowerCase()))
    )
  }

  // Filtered Mitra (for Admin View)
  const filteredMitra = useMemo(() => {
    return partnersList.filter((mitra) => {
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        mitra.displayName.toLowerCase().includes(term) ||
        mitra.email.toLowerCase().includes(term) ||
        (mitra.organization || '').toLowerCase().includes(term) ||
        (mitra.phone || '').toLowerCase().includes(term)

      const matchesType = typeFilter === 'all' || mitra.partnershipType === typeFilter
      return matchesSearch && matchesType
    })
  }, [partnersList, searchTerm, typeFilter])

  // Filtered Cadres (Mitra role strictly sees only cadres owned by their partnership)
  const filteredCadres = useMemo(() => {
    const myOrg = (userData?.organization || userData?.displayName || '').toLowerCase().trim()

    return allUsers.filter((account) => {
      if (account.role !== 'cadre') return false

      if (isPartnershipRole) {
        const isMatchId = account.partnershipId === user?.uid
        const isMatchOrg = myOrg && account.organization && account.organization.toLowerCase().trim() === myOrg
        const isMatchPartName = myOrg && account.partnershipName && account.partnershipName.toLowerCase().trim() === myOrg
        if (!isMatchId && !isMatchOrg && !isMatchPartName) return false
      } else if (!isSuperAdminOrAdmin && account.partnershipId !== user?.uid && account.uid !== user?.uid) {
        return false
      }

      const term = searchTerm.toLowerCase()
      const matchesSearch =
        account.displayName.toLowerCase().includes(term) ||
        account.email.toLowerCase().includes(term) ||
        (account.organization || '').toLowerCase().includes(term) ||
        (account.phone || '').toLowerCase().includes(term)

      const matchesType = typeFilter === 'all' || account.partnershipType === typeFilter
      const matchesMitra =
        selectedMitraFilter === 'all' ||
        account.partnershipId === selectedMitraFilter ||
        (account.organization && account.organization.toLowerCase() === selectedMitraFilter.toLowerCase())

      return matchesSearch && matchesType && matchesMitra
    })
  }, [allUsers, searchTerm, typeFilter, selectedMitraFilter, isSuperAdminOrAdmin, isPartnershipRole, user, userData])

  // Cadres Grouped & Separated BY MITRA for Super Admin / Admin / BPOM
  const cadresByMitraGroup = useMemo<CadresByMitraGroup>(() => {
    const attachedCadresMap = new Map<string, UserProfile[]>()
    const unattachedCadres: UserProfile[] = []

    partnersList.forEach((mitra) => {
      attachedCadresMap.set(mitra.uid, [])
    })

    filteredCadres.forEach((cadre) => {
      let matchedMitraUid: string | null = null

      if (cadre.partnershipId && attachedCadresMap.has(cadre.partnershipId)) {
        matchedMitraUid = cadre.partnershipId
      } else {
        const cOrg = (cadre.organization || cadre.partnershipName || '').toLowerCase().trim()
        if (cOrg) {
          const found = partnersList.find((mitra) => {
            const mOrg = (mitra.organization || mitra.displayName || '').toLowerCase().trim()
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

  // Specific Mitra Object & Progress Summary for Mitra Login
  const currentMitraObj = useMemo(() => {
    if (!isPartnershipRole) return null
    return partnersList[0] || ({
      uid: user?.uid || '',
      email: user?.email || '',
      displayName: userData?.displayName || 'Akun Mitra Saya',
      role: 'partnership',
      organization: userData?.organization || userData?.displayName,
      partnershipType: userData?.partnershipType || 'Sekolah',
      phone: userData?.phone || '-',
    } as UserProfile)
  }, [isPartnershipRole, partnersList, user, userData])

  const currentMitraSummary = useMemo(() => {
    if (!currentMitraObj) return null
    return getMitraProgressSummary(currentMitraObj, allUsers, distributions, responses, articles)
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
      {visible && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-200 text-xs font-bold font-mono shadow-2xl flex items-center gap-2 animate-bounce">
          <Icon name="checkCircle" className="w-4 h-4 text-cyan-400" />
          {message}
        </div>
      )}

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* ========================================================================= */}
        {/* CASE 1: MITRA ROLE LOGIN -> UNIFIED SINGLE-PAGE LAYOUT (NO TABS)          */}
        {/* ========================================================================= */}
        {isPartnershipRole ? (
          <MitraView
            user={user}
            userData={userData}
            filteredCadres={filteredCadres}
            currentMitraSummary={currentMitraSummary}
            getCadreProgressSummary={getCadreProgress}
            onOpenCreateCadreModal={() => openCreateCadreModal()}
            onInspectCadre={(cadre) => setSelectedCadreForInspect(cadre)}
          />
        ) : (
          /* ========================================================================= */
          /* CASE 2: SUPER ADMIN / ADMIN / BPOM LOGIN -> MULTI-TAB VIEW                */
          /* ========================================================================= */
          <AdminView
            activeTab={activeTab}
            isLoading={isLoading}
            partnersList={partnersList}
            filteredMitra={filteredMitra}
            paginatedMitra={paginatedMitra}
            filteredCadres={filteredCadres}
            cadresByMitraGroup={cadresByMitraGroup}
            searchTerm={searchTerm}
            typeFilter={typeFilter}
            selectedMitraFilter={selectedMitraFilter}
            onSearchChange={setSearchTerm}
            onTypeFilterChange={setTypeFilter}
            onMitraFilterChange={setSelectedMitraFilter}
            onTabChange={handleTabChange}
            getCadresForMitra={getCadresForMitra}
            getCadreProgressSummary={getCadreProgress}
            getMitraProgressSummary={(mitra) =>
              getMitraProgressSummary(mitra, allUsers, distributions, responses, articles)
            }
            onSelectMitraDetail={(mitra) => setSelectedMitraDetail(mitra)}
            onInspectCadre={(cadre) => setSelectedCadreForInspect(cadre)}
            onOpenCreateMitra={() => setIsCreateMitraOpen(true)}
            onOpenCreateCadreModal={openCreateCadreModal}
          />
        )}

        {/* MODAL: DETAIL MITRA & LIST KADER BINAAN (FOR ADMIN) */}
        {selectedMitraDetail && (
          <MitraDetailModal
            mitra={selectedMitraDetail}
            linkedCadres={getCadresForMitra(selectedMitraDetail)}
            onClose={() => setSelectedMitraDetail(null)}
            onAddCadre={(mitra) => openCreateCadreModal(mitra)}
            onInspectCadre={(cadre) => setSelectedCadreForInspect(cadre)}
          />
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
        <CreateMitraModal
          open={isCreateMitraOpen}
          isSubmitting={isSubmittingMitra}
          mitraName={mitraName}
          mitraType={mitraType}
          mitraEmail={mitraEmail}
          mitraPassword={mitraPassword}
          mitraPhone={mitraPhone}
          onClose={() => setIsCreateMitraOpen(false)}
          onNameChange={setMitraName}
          onTypeChange={setMitraType}
          onEmailChange={setMitraEmail}
          onPasswordChange={setMitraPassword}
          onPhoneChange={setMitraPhone}
          onSubmit={handleCreateMitra}
        />

        {/* MODAL: DAFTAR KADER BARU */}
        <CreateCadreModal
          open={isCreateCadreOpen}
          isSubmitting={isSubmittingCadre}
          contextMitra={cadreContextMitra}
          partnersList={partnersList}
          cadreOrganization={cadreOrganization}
          cadreEmail={cadreEmail}
          cadrePassword={cadrePassword}
          cadreName={cadreName}
          cadrePhone={cadrePhone}
          onClose={() => setIsCreateCadreOpen(false)}
          onOrganizationChange={setCadreOrganization}
          onOrganizationSelect={(v) => {
            setCadreOrganization(v)
            const found = partnersList.find((m) => m.displayName === v || m.organization === v)
            if (found) setCadreContextMitra(found)
          }}
          onEmailChange={setCadreEmail}
          onPasswordChange={setCadrePassword}
          onNameChange={setCadreName}
          onPhoneChange={setCadrePhone}
          onSubmit={handleCreateCadre}
        />
      </main>
    </div>
  )
}
