'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/infra/safe-fetch'
import { getArticles, type ArticleData } from '@/lib/repositories/articles.repo'
import { Icon } from '@/components/ui/Icons'
import { SkeletonCard, SkeletonOverview } from '@/components/ui/Skeleton'
import { ProgressTab, ArticlesTab, DistributionsTab } from '././ProfileProgressTabs'

interface ProfileProgressModalProps {
  isOpen: boolean
  onClose: () => void
  userOverride?: {
    uid: string
    email: string
    displayName?: string
    role?: string
    organization?: string
    partnershipType?: string
    phone?: string
    cadreCode?: string
  }
}

export function ProfileProgressModal({ isOpen, onClose, userOverride }: ProfileProgressModalProps) {
  const { user: authUser, userData: authUserData, logout, refreshUserData } = useAuth()

  const user = userOverride || authUser
  const userData = userOverride || authUserData

  const [articles, setArticles] = useState<ArticleData[]>([])
  const [distributions, setDistributions] = useState<any[]>([])
  const [myResponses, setMyResponses] = useState<any[]>([])
  const [myResponsesCount, setMyResponsesCount] = useState<number>(0)
  const [totalSystemResponsesCount, setTotalSystemResponsesCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Active Tab inside Modal: 'progress' | 'articles' | 'distributions' | 'settings'
  const [activeTab, setActiveTab] = useState<'progress' | 'articles' | 'distributions' | 'settings'>('progress')

  // Edit Profile Form State
  const [editDisplayName, setEditDisplayName] = useState(userData?.displayName || '')
  const [editOrganization, setEditOrganization] = useState(userData?.organization || '')
  const [editPartnershipType, setEditPartnershipType] = useState(userData?.partnershipType || 'Sekolah')
  const [editPhone, setEditPhone] = useState(userData?.phone || '')
  const [isSaving, setIsSaving] = useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Load User Data & Activity Progress
  const loadUserProgress = async () => {
    if (!isOpen) return
    setIsLoading(true)
    try {
      // 1. Fetch CMS Articles strictly authored by target user
      try {
        const allArticles = await getArticles()
        const userUid = user?.uid
        const userEmail = (user?.email || '').toLowerCase().trim()
        const userDisplayName = (userData?.displayName || user?.displayName || '').toLowerCase().trim()

        const myArticles = allArticles.filter((a) => {
          if (a.authorId && userUid && a.authorId === userUid) return true
          if (a.createdBy && userUid && a.createdBy === userUid) return true

          const authorLower = (a.author || '').toLowerCase().trim()
          if (userEmail && authorLower === userEmail) return true
          if (userDisplayName && userDisplayName.length > 2 && authorLower === userDisplayName) return true

          return false
        })
        setArticles(myArticles)
      } catch (artErr) {
        console.warn('Could not fetch articles:', artErr)
      }

      // 2. Fetch Distributions (STRICT OWNERSHIP ONLY)
      let myDists: any[] = []
      const distRes = await safeFetchJson('/api/distributions')
      const targetUid = userOverride?.uid || user?.uid || authUser?.uid
      const targetEmail = String(userOverride?.email || userData?.email || authUser?.email || '').toLowerCase().trim()
      const targetDisplayName = String(userOverride?.displayName || userData?.displayName || authUserData?.displayName || '').toLowerCase().trim()

      if (distRes.ok && distRes.data && Array.isArray(distRes.data.distributions)) {
        const allDists = distRes.data.distributions

        myDists = allDists.filter((d: any) => {
          if (d.createdBy && targetUid && d.createdBy === targetUid) return true
          if (d.cadreId && targetUid && d.cadreId === targetUid) return true
          if (d.ownerId && targetUid && d.ownerId === targetUid) return true

          const ownerLower = String(d.ownerName || d.cadreName || '').toLowerCase().trim()
          if (targetEmail && ownerLower === targetEmail) return true
          if (targetDisplayName && targetDisplayName.length > 2 && ownerLower === targetDisplayName) return true

          return false
        })
      }

      // Extract set of target user's active distribution codes
      const myCodesSet = new Set<string>()
      myDists.forEach((d: any) => {
        if (d.code) myCodesSet.add(String(d.code).toLowerCase().trim())
        if (d.distributionId) myCodesSet.add(String(d.distributionId).toLowerCase().trim())
      })
      if ((userData as any)?.cadreCode) myCodesSet.add(String((userData as any).cadreCode).toLowerCase().trim())

      // 3. Fetch Responses (STRICT OWNERSHIP ONLY)
      const respRes = await safeFetchJson('/api/responses')
      let filteredMyResponsesCount = 0
      let totalSysCount = 0

      if (respRes.ok && respRes.data && Array.isArray(respRes.data.responses)) {
        const allResponses = respRes.data.responses
        totalSysCount = allResponses.length

        // Map per-distribution respondent counts for target user's distributions
        const enrichedDists = myDists.map((d: any) => {
          const codeLower = String(d.code || '').toLowerCase().trim()
          const distIdLower = String(d.distributionId || '').toLowerCase().trim()

          const count = allResponses.filter((r: any) => {
            const rCode = String(
              r.distributionCode ||
              r.code ||
              r.metadata?.distributionCode ||
              r.metadata?.cadreCode ||
              r.cadreCode ||
              ''
            ).toLowerCase().trim()

            const rDistId = String(r.distributionId || '').toLowerCase().trim()
            return (codeLower && rCode === codeLower) || (distIdLower && rDistId === distIdLower)
          }).length

          return { ...d, respondentCount: count }
        })

        setDistributions(enrichedDists)

        // Filter total responses strictly belonging to this target user's distribution codes or UID
        const myResponsesList = allResponses.filter((r: any) => {
          const rCode = String(
            r.distributionCode ||
            r.code ||
            r.metadata?.distributionCode ||
            r.metadata?.cadreCode ||
            r.cadreCode ||
            ''
          ).toLowerCase().trim()

          const isMatchedCode = rCode !== '' && myCodesSet.has(rCode)
          const isMatchedUid =
            (r.createdBy && targetUid && r.createdBy === targetUid) ||
            (r.cadreId && targetUid && r.cadreId === targetUid) ||
            (r.userId && targetUid && r.userId === targetUid)

          return isMatchedCode || isMatchedUid
        })

        setMyResponses(myResponsesList)
        filteredMyResponsesCount = myResponsesList.length
      } else {
        setDistributions(myDists)
      }

      setMyResponsesCount(filteredMyResponsesCount)
      setTotalSystemResponsesCount(totalSysCount)
    } catch (err) {
      console.error('Error loading profile modal progress:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUserProgress()
  }, [isOpen, user, userData])

  useEffect(() => {
    if (userData) {
      const u = userData as any
      setEditDisplayName(u.displayName || '')
      setEditOrganization(u.organization || '')
      setEditPartnershipType(u.partnershipType || 'Sekolah')
      setEditPhone(u.phone || '')
    }
  }, [userData])

  // Stats
  const articleStats = useMemo(() => {
    const total = articles.length
    const published = articles.filter((a) => a.status === 'Published').length
    const totalViews = articles.reduce((acc, a) => acc + (a.views || 0), 0)
    return { total, published, totalViews }
  }, [articles])

  const distStats = useMemo(() => {
    const total = distributions.length
    const active = distributions.filter((d) => d.status === 'active').length
    return { total, active }
  }, [distributions])

  const cadreResponseStats = useMemo(() => {
    const scores = myResponses
      .map((r) => r.result?.percentage)
      .filter((s): s is number => typeof s === 'number')

    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const passCount = myResponses.filter((r) => r.result?.percentage && r.result.percentage >= 75).length
    const passRate = myResponses.length > 0 ? Math.round((passCount / myResponses.length) * 100) : 0
    const lowScoreCount = myResponses.filter((r) => r.result?.percentage && r.result.percentage < 60).length

    return { avgScore, passCount, passRate, lowScoreCount, totalResponses: myResponses.length }
  }, [myResponses])

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.uid) return

    setIsSaving(true)
    try {
      const res = await fetch('/api/auth/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          role: userData?.role || 'public',
          organization: editOrganization,
          partnershipType: editPartnershipType,
          phone: editPhone,
          displayName: editDisplayName,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menyimpan perubahan profil.')
      }

      showToast('Profil & informasi akun berhasil diperbarui!')
      if (refreshUserData) refreshUserData()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  if (!isOpen) return null

  const roleLabel =
    userData?.role === 'super_admin'
      ? 'Super Admin BPOM'
      : userData?.role === 'super_admin'
      ? 'Admin Systems'
      : userData?.role === 'super_admin'
      ? 'Internal BPOM Evaluator'
      : userData?.role === 'partnership'
      ? 'Mitra / Instansi Partnership'
      : userData?.role === 'cadre'
      ? 'Kader Lapangan'
      : 'Pengguna Publik'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-cyan-500 to-emerald-500 p-0.5 shrink-0 shadow-lg">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-lg font-extrabold text-white">
                {userData?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-100">
                  {userData?.displayName || user?.email?.split('@')[0] || 'Pengguna KKPD-KP'}
                </h3>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                  {roleLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {user?.email} • Instansi: <span className="text-cyan-300 font-bold">{(userData as any)?.organization || 'BPOM / Umum'}</span> ({(userData as any)?.partnershipType || 'Sekolah'})
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 transition-colors">
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-2xl text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'progress' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon name="barChart" className="w-3.5 h-3.5" />
            <span>Progress & Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab('articles')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'articles' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon name="bookOpen" className="w-3.5 h-3.5" />
            <span>Artikel CMS ({articleStats.total})</span>
          </button>

          <button
            onClick={() => setActiveTab('distributions')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'distributions' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon name="send" className="w-3.5 h-3.5" />
            <span>Kode Distribusi ({distStats.total})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'settings' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon name="settings" className="w-3.5 h-3.5" />
            <span>Edit Profil</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {isLoading ? (
            <div className="space-y-4 py-2">
              <SkeletonOverview />
              <SkeletonCard />
            </div>
          ) : activeTab === 'progress' ? (
            <ProgressTab activeCodes={distStats.active} stats={cadreResponseStats} />
          ) : activeTab === 'articles' ? (
            <ArticlesTab articles={articles} onClose={onClose} />
          ) : activeTab === 'distributions' ? (
            <DistributionsTab distributions={distributions} onClose={onClose} />
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-3 pt-1">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Lengkap / Nama Tampilan</label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Jenis Instansi / Kemitraan</label>
                  <select
                    value={editPartnershipType}
                    onChange={(e) => setEditPartnershipType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-400 cursor-pointer"
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
                  <label className="block font-semibold text-slate-300 mb-1">Nama Instansi / Lembaga</label>
                  <input
                    type="text"
                    value={editOrganization}
                    onChange={(e) => setEditOrganization(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">No. HP / WhatsApp</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-600/20 flex items-center gap-1.5 transition-all"
                >
                  {isSaving ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="check" className="w-4 h-4" />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-200 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Icon name="logout" className="w-3.5 h-3.5" />
            <span>Keluar Akun (Logout)</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Tutup Modal
          </button>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-3">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
