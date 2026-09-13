'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import { Icon } from '@/components/ui/Icons'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/lib/hooks'
import { fetchProfileProgress, getRoleLabel, type ProfileProgress } from './profile-utils'
import ArticlesTab from './articles-tab'
import DistributionsTab from './distributions-tab'
import ProfileSettings from './profile-settings'

export default function UserProfileProgressPage() {
  const { user, userData, refreshUserData } = useAuth()

  // Active Tab: 'articles' | 'distributions' | 'settings'
  const [activeTab, setActiveTab] = useState<'articles' | 'distributions' | 'settings'>('articles')

  // Edit Profile Form State
  const [editDisplayName, setEditDisplayName] = useState(userData?.displayName || '')
  const [editOrganization, setEditOrganization] = useState(userData?.organization || '')
  const [editPartnershipType, setEditPartnershipType] = useState(userData?.partnershipType || 'Sekolah')
  const [editPhone, setEditPhone] = useState(userData?.phone || '')
  const [isSaving, setIsSaving] = useState(false)
  const { visible, message, show } = useToast()

  // Load User Data & Activity Progress (re-fetches when user / userData change)
  const {
    data: {
      articles = [],
      distributions = [],
      responsesCount = 0,
      cadresCount = 0,
      teamResponsesCount = 0,
    } = {},
  } = useQuery<ProfileProgress>({
    queryKey: queryKeys.profile.progress(user?.uid, userData),
    queryFn: async () => fetchProfileProgress(user, userData),
  })

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

      show('Profil dan informasi akun berhasil diperbarui!')
      if (refreshUserData) refreshUserData()
    } catch (err: any) {
      show(`Error: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const roleLabel = getRoleLabel(userData?.role)

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

          {['mitra', 'partner', 'partnership', 'organization', 'superadmin', 'super_admin'].includes(userData?.role || '') && (
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
          <ArticlesTab articles={articles} displayName={userData?.displayName} />
        )}

        {/* Tab Content 2: Distribution Codes Progress */}
        {activeTab === 'distributions' && (
          <DistributionsTab distributions={distributions} />
        )}

        {/* Tab Content 3: Profile & Account Settings */}
        {activeTab === 'settings' && (
          <ProfileSettings
            editDisplayName={editDisplayName}
            editOrganization={editOrganization}
            editPartnershipType={editPartnershipType}
            editPhone={editPhone}
            isSaving={isSaving}
            setEditDisplayName={setEditDisplayName}
            setEditOrganization={setEditOrganization}
            setEditPartnershipType={setEditPartnershipType}
            setEditPhone={setEditPhone}
            onSubmit={handleSaveProfile}
          />
        )}
      </div>

      {/* Toast */}
      {visible && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-3">
          {message}
        </div>
      )}
    </div>
  )
}
