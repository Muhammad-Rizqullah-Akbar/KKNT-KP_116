'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/shared/safeFetch'
import { getArticles, type ArticleData } from '@/lib/firebase/repositories/articles.repo'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import type { DistributionDoc } from '@/lib/forms/v1_5/distributionTypes'

export default function UserProfileProgressPage() {
  const { user, userData, refreshUserData } = useAuth()

  const [articles, setArticles] = useState<ArticleData[]>([])
  const [distributions, setDistributions] = useState<DistributionDoc[]>([])
  const [responsesCount, setResponsesCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Active Tab: 'articles' | 'distributions' | 'settings'
  const [activeTab, setActiveTab] = useState<'articles' | 'distributions' | 'settings'>('articles')

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

  const [cadresCount, setCadresCount] = useState<number>(0)
  const [teamResponsesCount, setTeamResponsesCount] = useState<number>(0)

  // Load User Data & Activity Progress
  const loadUserProgress = async () => {
    setIsLoading(true)
    try {
      // 1. Fetch CMS Articles (strictly personal)
      try {
        const allArticles = await getArticles()
        const userUid = user?.uid
        const userEmail = (user?.email || '').toLowerCase().trim()
        const userDisplayName = (userData?.displayName || user?.displayName || '').toLowerCase().trim()

        const myArticles = allArticles.filter((a) => {
          if ((a as any).authorId && userUid && (a as any).authorId === userUid) return true
          if ((a as any).createdBy && userUid && (a as any).createdBy === userUid) return true

          const authorLower = (a.author || '').toLowerCase().trim()
          if (userEmail && authorLower === userEmail) return true
          if (userDisplayName && userDisplayName.length > 2 && authorLower === userDisplayName) return true

          return false
        })
        setArticles(myArticles)
      } catch (artErr) {
        console.warn('Could not fetch articles:', artErr)
      }

      // 2. Fetch Distributions (strictly personal or partner organization)
      const distRes = await safeFetchJson('/api/v1_5/distributions')
      let myDistCodes: string[] = []
      if (distRes.ok && distRes.data && Array.isArray(distRes.data.distributions)) {
        const myDists = distRes.data.distributions.filter(
          (d: DistributionDoc) =>
            d.createdBy === user?.uid ||
            d.ownerId === user?.uid ||
            (userData?.displayName && d.ownerName?.toLowerCase() === userData.displayName.toLowerCase())
        )
        setDistributions(myDists)
        myDistCodes = myDists.map((d: DistributionDoc) => d.code).filter(Boolean)
      }

      // 3. Fetch Responses Count & Mitra Cadre Team Stats
      const respRes = await safeFetchJson('/api/v1_5/responses')
      const usersRes = await safeFetchJson('/api/auth/users')

      if (respRes.ok && respRes.data && Array.isArray(respRes.data.responses)) {
        const allResponses = respRes.data.responses

        // Personal responses count
        const personalResponses = allResponses.filter((r: any) =>
          r.createdBy === user?.uid ||
          (r.distributionCode && myDistCodes.includes(r.distributionCode)) ||
          (userData?.displayName && r.ownerName?.toLowerCase() === userData.displayName.toLowerCase())
        )
        setResponsesCount(personalResponses.length)

        // If user is Mitra / Partner: Calculate Team Cadre Statistics
        if (['mitra', 'partner', 'partnership', 'organization', 'superadmin', 'admin'].includes(userData?.role || '')) {
          let cadreUids: string[] = []
          let cadreNames: string[] = []

          if (usersRes.ok && usersRes.data && Array.isArray(usersRes.data.users)) {
            const myCadres = usersRes.data.users.filter((u: any) =>
              u.role === 'cadre' &&
              (
                u.mitraId === user?.uid ||
                (userData?.organization && u.organization?.toLowerCase() === userData.organization.toLowerCase()) ||
                (userData?.organization && u.partnershipName?.toLowerCase() === userData.organization.toLowerCase())
              )
            )
            setCadresCount(myCadres.length)
            cadreUids = myCadres.map((u: any) => u.uid || u.id)
            cadreNames = myCadres.map((u: any) => (u.displayName || u.name || '').toLowerCase()).filter(Boolean)
          }

          // Accumulate team responses from Cadres under this Mitra
          const teamResponses = allResponses.filter((r: any) =>
            cadreUids.includes(r.createdBy) ||
            (r.ownerName && cadreNames.includes(r.ownerName.toLowerCase()))
          )
          setTeamResponsesCount(teamResponses.length)
        }
      }
    } catch (err: any) {
      console.error('Error loading profile progress:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUserProgress()
  }, [user, userData])

  useEffect(() => {
    if (userData) {
      setEditDisplayName(userData.displayName || '')
      setEditOrganization(userData.organization || '')
      setEditPartnershipType(userData.partnershipType || 'Sekolah')
      setEditPhone(userData.phone || '')
    }
  }, [userData])

  // Article Stats
  const articleStats = useMemo(() => {
    const total = articles.length
    const published = articles.filter((a) => a.status === 'Published').length
    const totalViews = articles.reduce((acc, a) => acc + (a.views || 0), 0)
    return { total, published, totalViews }
  }, [articles])

  // Distribution Stats
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

      showToast('Profil dan informasi akun berhasil diperbarui!')
      if (refreshUserData) refreshUserData()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

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
    <div className="flex flex-col min-h-screen bg-[#070913] text-slate-100 font-sans">
      <Topbar
        title="Profil & Progress Aktivitas Pengguna"
        subtitle="Pantau capaian pencapaian artikel edukasi, distribusi kuesioner V1.5, dan statistik kegiatan Anda"
      />

      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Profile Card Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/60 to-slate-900 border border-purple-500/30 p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-cyan-500 to-emerald-500 p-1 shrink-0 shadow-xl">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-xl font-extrabold text-white">
                {userData?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-slate-100">
                  {userData?.displayName || user?.email?.split('@')[0] || 'Pengguna KKPD-KP'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-extrabold">
                  {roleLabel}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  ✓ Terverifikasi BPOM
                </span>
              </div>

              <p className="text-xs text-slate-400 font-mono">
                {user?.email} • Instansi: <span className="text-cyan-300 font-bold">{userData?.organization || 'BPOM / Umum'}</span> ({userData?.partnershipType || 'Sekolah'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto">
            <button
              onClick={() => setActiveTab('settings')}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
            >
              <Icon name="settings" className="w-4 h-4" />
              <span>Edit Profil</span>
            </button>

            <Link
              href="/dashboard/articles"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Icon name="bookOpen" className="w-4 h-4 text-cyan-400" />
              <span>Tulis Artikel (CMS)</span>
            </Link>
          </div>
        </div>

        {/* Progress Overview Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Artikel Edukasi Diterbitkan</span>
              <Icon name="bookOpen" className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-100 mt-2">{articleStats.published}</p>
            <span className="text-[10px] text-slate-500 font-mono">Total {articleStats.total} draf & artikel</span>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Pembaca (Views)</span>
              <Icon name="eye" className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-300 mt-2">{articleStats.totalViews}</p>
            <span className="text-[10px] text-slate-500 font-mono">Diakses oleh publik</span>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Kode Distribusi Aktif</span>
              <Icon name="send" className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-purple-300 mt-2">{distStats.active}</p>
            <span className="text-[10px] text-slate-500 font-mono">Total {distStats.total} kode dibuat</span>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Respon Langsung Saya</span>
              <Icon name="checkCircle" className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-amber-300 mt-2">{responsesCount}</p>
            <span className="text-[10px] text-slate-500 font-mono">Hasil survei kuesioner</span>
          </div>

          {['mitra', 'partner', 'partnership', 'organization', 'superadmin', 'admin'].includes(userData?.role || '') && (
            <div className="rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-purple-950/40 border border-cyan-500/30 p-4 shadow-sm col-span-2 sm:col-span-4">
              <div className="flex items-center justify-between text-xs text-cyan-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Icon name="users" className="w-4 h-4 text-cyan-400" />
                  Dampak Tim Kader Mitra ({userData?.organization || 'Instansi Partnership'})
                </span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                  {cadresCount} Kader Binaan Aktif
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 flex-wrap gap-4">
                <div>
                  <p className="text-3xl font-black font-mono text-cyan-300">
                    {responsesCount + teamResponsesCount} <span className="text-xs text-slate-400 font-normal">Total Respon Gabungan</span>
                  </p>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    {teamResponsesCount} respon terkumpul via {cadresCount} Kader Binaan + {responsesCount} respon langsung Mitra.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
                  ⚡ Keaktifan Mitra Disupport oleh Cadre Team
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs w-fit">
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeTab === 'articles'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon name="bookOpen" className="w-4 h-4" />
            <span>Kontribusi Artikel Edukasi ({articleStats.total})</span>
          </button>

          <button
            onClick={() => setActiveTab('distributions')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeTab === 'distributions'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon name="send" className="w-4 h-4" />
            <span>Distribusi Kuesioner V1.5 ({distStats.total})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon name="settings" className="w-4 h-4" />
            <span>Pengaturan Akun & Profil</span>
          </button>
        </div>

        {/* Tab Content 1: Articles Contribution */}
        {activeTab === 'articles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <Icon name="bookOpen" className="w-4 h-4 text-purple-400" />
                <span>Materi Edukasi Pangan Yang Diterbitkan</span>
              </h3>

              <Link
                href="/dashboard/articles"
                className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-bold hover:bg-purple-600/30 transition-all"
              >
                + Tulis Artikel Baru (CMS)
              </Link>
            </div>

            <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
              {articles.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                  <Icon name="bookOpen" className="w-10 h-10 mx-auto text-slate-700" />
                  <p className="font-bold text-slate-300">Belum ada artikel edukasi yang dipublish</p>
                  <p className="max-w-md mx-auto text-slate-500">
                    Mulai bagikan materi edukasi keamanan pangan untuk sekolah, pasar, dan komunitas Anda melalui CMS.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {articles.map((art) => (
                    <div key={art.id || art.slug} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors">
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                            {art.category || 'Materi Edukasi'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            art.status === 'Published'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}>
                            {art.status}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-100">{art.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-1">{art.excerpt || 'Penulisan edukasi keamanan pangan BPOM.'}</p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono pt-1">
                          <span>Penulis: {art.author || userData?.displayName}</span>
                          <span>•</span>
                          <span>{art.views || 0} Pembaca</span>
                          <span>•</span>
                          <span>{art.date}</span>
                        </div>
                      </div>

                      <Link
                        href="/dashboard/articles"
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold self-start md:self-center transition-colors"
                      >
                        Buka di CMS
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content 2: Distribution Codes Progress */}
        {activeTab === 'distributions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <Icon name="send" className="w-4 h-4 text-cyan-400" />
                <span>Kode Distribusi Kuesioner V1.5 Milik Anda</span>
              </h3>

              <Link
                href="/dashboard/distributions"
                className="px-3 py-1.5 rounded-xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold hover:bg-cyan-600/30 transition-all"
              >
                + Buat Kode Distribusi
              </Link>
            </div>

            <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
              {distributions.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                  <Icon name="send" className="w-10 h-10 mx-auto text-slate-700" />
                  <p className="font-bold text-slate-300">Belum ada kode distribusi instrumen V1.5</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {distributions.map((d) => (
                    <div key={d.distributionId} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors">
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-cyan-400 font-extrabold text-xs px-2.5 py-0.5 rounded-lg bg-cyan-950 border border-cyan-500/30">
                            {d.code}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                            d.status === 'active' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}>
                            {d.status}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-100">{d.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-1">{d.description || 'Distribusi kuesioner V1.5.'}</p>
                      </div>

                      <a
                        href={`/form/${d.code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-cyan-600/20 text-cyan-200 border border-cyan-500/40 text-xs font-semibold self-start md:self-center transition-colors"
                      >
                        Buka Form Publik
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content 3: Profile & Account Settings */}
        {activeTab === 'settings' && (
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 max-w-2xl">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-800">
              <Icon name="settings" className="w-5 h-5 text-purple-400" />
              <span>Pengaturan Profil & Instansi</span>
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Nama Lengkap / Nama Tampilan</label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Jenis Instansi / Kemitraan</label>
                  <select
                    value={editPartnershipType}
                    onChange={(e) => setEditPartnershipType(e.target.value)}
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
                  <label className="block font-semibold text-slate-300 mb-1.5">Nama Instansi / Lembaga</label>
                  <input
                    type="text"
                    value={editOrganization}
                    onChange={(e) => setEditOrganization(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">No. HP / WhatsApp</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-600/20 flex items-center gap-2 transition-all"
                >
                  {isSaving ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="check" className="w-4 h-4" />}
                  <span>Simpan Perubahan Profil</span>
                </button>
              </div>
            </form>
          </div>
        )}
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
