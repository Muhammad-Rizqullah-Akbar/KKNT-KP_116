'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/shared/safeFetch'
import { getArticles, type ArticleData } from '@/lib/firebase/repositories/articles.repo'
import { Icon } from '@/components/ui/Icons'

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

      // 2. Fetch Distributions
      let myDists: any[] = []
      const distRes = await safeFetchJson('/api/v1_5/distributions')
      if (distRes.ok && distRes.data && Array.isArray(distRes.data.distributions)) {
        const allDists = distRes.data.distributions
        const userUid = userOverride?.uid || user?.uid || authUser?.uid
        const userDisplayName = String(userData?.displayName || authUserData?.displayName || userOverride?.displayName || '').toLowerCase().trim()
        const userEmail = String(userData?.email || authUser?.email || userOverride?.email || '').toLowerCase().trim()

        myDists = allDists.filter((d: any) => {
          if (d.createdBy && userUid && d.createdBy === userUid) return true
          if (d.cadreId && userUid && d.cadreId === userUid) return true
          if (d.ownerId && userUid && d.ownerId === userUid) return true

          const ownerLower = String(d.ownerName || d.cadreName || '').toLowerCase().trim()
          if (userEmail && ownerLower === userEmail) return true
          if (userDisplayName && userDisplayName.length > 2 && ownerLower === userDisplayName) return true

          return false
        })

        if (myDists.length === 0 && (userData?.role === 'super_admin' || userData?.role === 'admin')) {
          myDists = allDists
        }
      }

      // Extract set of user's active distribution codes
      const myCodesSet = new Set<string>()
      myDists.forEach((d: any) => {
        if (d.code) myCodesSet.add(String(d.code).toLowerCase().trim())
        if (d.distributionId) myCodesSet.add(String(d.distributionId).toLowerCase().trim())
      })
      if (userData?.cadreCode) myCodesSet.add(String(userData.cadreCode).toLowerCase().trim())

      // 3. Fetch Responses & Calculate per-distribution counts
      const respRes = await safeFetchJson('/api/v1_5/responses')
      let filteredMyResponsesCount = 0
      let totalSysCount = 0

      if (respRes.ok && respRes.data && Array.isArray(respRes.data.responses)) {
        const allResponses = respRes.data.responses
        totalSysCount = allResponses.length

        // Map per-distribution respondent counts
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

        // Filter total responses belonging to this user's distribution codes or UID
        const myResponses = allResponses.filter((r: any) => {
          const rCode = String(
            r.distributionCode ||
            r.code ||
            r.metadata?.distributionCode ||
            r.metadata?.cadreCode ||
            r.cadreCode ||
            ''
          ).toLowerCase().trim()

          const isMatchedCode = rCode !== '' && myCodesSet.has(rCode)
          const isMatchedUid = r.createdBy === user?.uid || r.cadreId === user?.uid || r.userId === user?.uid

          return isMatchedCode || isMatchedUid
        })

        filteredMyResponsesCount = myResponses.length > 0 ? myResponses.length : (userData?.role === 'super_admin' || userData?.role === 'admin' ? totalSysCount : 0)
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
      : userData?.role === 'admin'
      ? 'Admin Systems'
      : userData?.role === 'internal_bpom'
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
            <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
              <Icon name="loader" className="w-5 h-5 text-purple-400 animate-spin" />
              <span>Memuat data aktivitas & progress akun...</span>
            </div>
          ) : activeTab === 'progress' ? (
            <div className="space-y-4">
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5 space-y-1">
                  <span className="text-slate-400 text-[11px]">Artikel Published</span>
                  <p className="text-xl font-bold font-mono text-cyan-300">{articleStats.published}</p>
                  <span className="text-[10px] text-slate-500 font-mono">Diterbitkan ke CMS</span>
                </div>

                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5 space-y-1">
                  <span className="text-slate-400 text-[11px]">Total Views Pembaca</span>
                  <p className="text-xl font-bold font-mono text-emerald-300">{articleStats.totalViews}</p>
                  <span className="text-[10px] text-slate-500 font-mono">Diakses oleh publik</span>
                </div>

                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5 space-y-1">
                  <span className="text-slate-400 text-[11px]">Kode Distribusi Saya</span>
                  <p className="text-xl font-bold font-mono text-purple-300">{distStats.active}</p>
                  <span className="text-[10px] text-slate-500 font-mono">Aktif menyebar</span>
                </div>

                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5 space-y-1">
                  <span className="text-slate-400 text-[11px]">Responden (Kode Saya)</span>
                  <p className="text-xl font-bold font-mono text-amber-300">
                    {myResponsesCount} <span className="text-[11px] font-normal text-slate-500">/ {totalSystemResponsesCount} total</span>
                  </p>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Terjaring via link/kode Anda
                  </span>
                </div>
              </div>

              {/* Status Otorisasi & Lencana Badges */}
              <div className="rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-950 to-slate-950 border border-purple-500/30 p-4 space-y-2">
                <h4 className="font-bold text-slate-200 flex items-center gap-2">
                  <Icon name="award" className="w-4 h-4 text-purple-400" />
                  <span>Status Keaktifan & Lencana Akun</span>
                </h4>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-200 border border-purple-500/30 text-xs font-semibold">
                    🏆 Kader / Mitra Edukator Pangan
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 text-xs font-semibold">
                    ✓ Terverifikasi Sistem BPOM V1.5
                  </span>
                </div>
              </div>
            </div>
          ) : activeTab === 'articles' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-200">Kontribusi Artikel Edukasi ({articles.length})</h4>
                <Link onClick={onClose} href="/dashboard/articles" className="text-xs text-purple-400 hover:underline">
                  + Tulis Artikel Baru (CMS)
                </Link>
              </div>

              {articles.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-500">
                  Belum ada artikel edukasi yang ditulis oleh akun Anda.
                </div>
              ) : (
                <div className="divide-y divide-slate-800 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                  {articles.map((art) => (
                    <div key={art.id || art.slug} className="p-3 flex items-center justify-between">
                      <div className="space-y-0.5 max-w-md">
                        <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] font-bold">
                          {art.category || 'Materi Edukasi'}
                        </span>
                        <p className="font-bold text-slate-100">{art.title}</p>
                      </div>
                      <span className="font-mono text-emerald-400 text-[11px] font-bold">
                        👁️ {art.views || 0} views
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'distributions' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-200">Kode & Link Distribusi Saya ({distributions.length})</h4>
                <Link onClick={onClose} href="/dashboard/distributions" className="text-xs text-cyan-400 hover:underline">
                  + Buat Kode Distribusi Baru
                </Link>
              </div>

              {distributions.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-500">
                  Belum ada kode distribusi publik yang dibuat untuk akun ini.
                </div>
              ) : (
                <div className="divide-y divide-slate-800 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                  {distributions.map((d) => (
                    <div key={d.distributionId} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-cyan-400 font-bold text-xs px-2.5 py-0.5 rounded-lg bg-cyan-950 border border-cyan-500/30">
                            {d.code}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                            📊 {d.respondentCount || 0} Responden Terjaring
                          </span>
                        </div>
                        <p className="font-bold text-slate-100 mt-1">{d.title}</p>
                        {d.cadreName && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Kader/Pemilik: <strong className="text-slate-300">{d.cadreName}</strong> ({d.targetAudience || 'Umum'})
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <a
                          href={`/form/${d.code}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-semibold text-xs transition-colors flex items-center gap-1"
                        >
                          <span>Buka Form Publik</span>
                          <Icon name="externalLink" className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
