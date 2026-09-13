'use client'

import { useState, useEffect, useMemo } from 'react'
import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import { Icon } from '@/components/ui/Icons'
import { ProfileProgressModal } from '@/features/dashboard/components/modals/ProfileProgressModal'
import OverviewTab from './overview-tab'
import CadresTab from './cadres-tab'
import MitraTab from './mitra-tab'
import AlertsTab from './alerts-tab'
import type {
  CadreMetric,
  MitraMetric,
  MonitoringStats,
  TopContributorsByMitra,
  AlertGroup,
  UserProfile,
} from './types'

interface AdminViewProps {
  cadreMetrics: CadreMetric[]
  mitraMetrics: MitraMetric[]
  stats: MonitoringStats
  topContributorsByMitra: TopContributorsByMitra
  allClassifiedAlertCardsCount: number
  alertCardsGroupedByMitra: AlertGroup[]
  isLoading: boolean
}

export default function AdminView({
  cadreMetrics,
  mitraMetrics,
  stats,
  topContributorsByMitra,
  allClassifiedAlertCardsCount,
  alertCardsGroupedByMitra,
  isLoading,
}: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'cadres' | 'mitra' | 'alerts'>('overview')

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [mitraFilter, setMitraFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Pagination States for Cost & Performance Efficiency
  const [cadreCurrentPage, setCadreCurrentPage] = useState<number>(1)
  const cadrePageSize = 20 // Max 20 cadres per page

  const [alertCurrentPage, setAlertCurrentPage] = useState<number>(1)
  const alertPageSize = 10 // Max 10 alert cards per page

  // Inspection Modal State
  const [selectedCadreForInspect, setSelectedCadreForInspect] = useState<UserProfile | null>(null)

  // Alerts Pagination Math (Max 10 cards per page)
  const alertTotalPages = Math.ceil(allClassifiedAlertCardsCount / alertPageSize) || 1

  // Filtered & Ranked Cadre Metrics (Sorted for Leaderboard)
  const filteredRankedCadreMetrics = useMemo(() => {
    const filtered = cadreMetrics.filter((item) => {
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        item.cadre.displayName.toLowerCase().includes(term) ||
        item.cadre.email.toLowerCase().includes(term) ||
        item.organizationName.toLowerCase().includes(term)

      const matchesMitra =
        mitraFilter === 'all' ||
        item.cadre.partnershipId === mitraFilter ||
        item.organizationName.toLowerCase() === mitraFilter.toLowerCase()

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter

      return matchesSearch && matchesMitra && matchesStatus
    })

    // Sort strictly by Leaderboard score & response count
    return filtered.sort((metricA, metricB) => metricB.respCount - metricA.respCount || metricB.avgScore - metricA.avgScore)
  }, [cadreMetrics, searchTerm, mitraFilter, statusFilter])

  // Cadre Leaderboard Pagination Math (Max 20 cadres per page)
  const cadreTotalPages = Math.ceil(filteredRankedCadreMetrics.length / cadrePageSize) || 1
  const paginatedCadreLeaderboard = useMemo(() => {
    const start = (cadreCurrentPage - 1) * cadrePageSize
    return filteredRankedCadreMetrics.slice(start, start + cadrePageSize)
  }, [filteredRankedCadreMetrics, cadreCurrentPage, cadrePageSize])

  // Reset pagination when search/filters change
  useEffect(() => {
    setCadreCurrentPage(1)
  }, [searchTerm, mitraFilter, statusFilter])

  return (
    <div className="min-h-screen bg-[#080812] text-slate-100 font-sans flex flex-col">
      <Topbar
        title="Domain Monitoring Command Center"
        subtitle="Super Admin Level Analysis: Per-Cadre & Per-Mitra Contribution Engine"
      />

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* DOMAIN HEADER & NAVIGATION TABS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/[0.06] backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-display text-white tracking-wide">Domain Monitoring</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                SUPER ADMIN LEVEL ANALYTICS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pusat komando analisis kontribusi mendalam per-Kader Lapangan dan per-Mitra Instansi.
            </p>
          </div>

          {/* NAVIGATION TABS */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex-wrap">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                activeTab === 'overview'
                  ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon name="dashboard" className="w-3.5 h-3.5" />
              Overview KPI
            </button>

            <button
              onClick={() => setActiveTab('cadres')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                activeTab === 'cadres'
                  ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon name="award" className="w-3.5 h-3.5" />
              Leaderboard Kader ({cadreMetrics.length})
            </button>

            <button
              onClick={() => setActiveTab('mitra')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                activeTab === 'mitra'
                  ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon name="building" className="w-3.5 h-3.5" />
              Analisis Per-Mitra ({mitraMetrics.length})
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                activeTab === 'alerts'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon name="alertCircle" className="w-3.5 h-3.5" />
              Alert Dipisah Per-Mitra ({allClassifiedAlertCardsCount})
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR FOR CADRES & MITRA */}
        {(activeTab === 'cadres' || activeTab === 'mitra') && (
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/40 p-3.5 rounded-xl border border-slate-800">
            <div className="flex flex-1 items-center gap-3 w-full">
              <div className="relative flex-1">
                <Icon name="search" className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={activeTab === 'cadres' ? 'Cari nama kader, email, instansi...' : 'Cari nama mitra...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>

              {activeTab === 'cadres' && (
                <>
                  <select
                    value={mitraFilter}
                    onChange={(e) => setMitraFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="all">Semua Mitra Instansi</option>
                    {mitraMetrics.map((mitraMetric) => (
                      <option key={mitraMetric.mitra.uid} value={mitraMetric.mitra.displayName}>
                        {mitraMetric.mitra.displayName}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="all">Semua Level Kontribusi</option>
                    <option value="high">High Contributor (≥5 Respon)</option>
                    <option value="active">Aktif (≥1 Respon)</option>
                    <option value="attention">Perlu Atensi (0 Respon)</option>
                  </select>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: EXECUTIVE OVERVIEW KPI & TOP KONTRIBUTOR DIPISAHKAN PER-MITRA */}
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            topContributorsByMitra={topContributorsByMitra}
            onOpenCadres={() => setActiveTab('cadres')}
            onInspectCadre={setSelectedCadreForInspect}
          />
        )}

        {/* TAB 2: LEADERBOARD KADER LAPANGAN (PAGINATED AT MAX 20 CADRES PER PAGE) */}
        {activeTab === 'cadres' && (
          <CadresTab
            filteredRankedCadreMetrics={filteredRankedCadreMetrics}
            paginatedCadreLeaderboard={paginatedCadreLeaderboard}
            isLoading={isLoading}
            cadreCurrentPage={cadreCurrentPage}
            cadreTotalPages={cadreTotalPages}
            onPrevPage={() => setCadreCurrentPage((p) => Math.max(1, p - 1))}
            onNextPage={() => setCadreCurrentPage((p) => Math.min(cadreTotalPages, p + 1))}
            onInspectCadre={setSelectedCadreForInspect}
          />
        )}

        {/* TAB 3: DEEP PER-MITRA ANALYSIS TABLE (WITH MAX 5 REPRESENTATIVE CADRES PER MITRA) */}
        {activeTab === 'mitra' && <MitraTab mitraMetrics={mitraMetrics} onInspectCadre={setSelectedCadreForInspect} />}

        {/* TAB 4: ACTIONABLE ALERTS GROUPED & SEPARATED BY MITRA (MAX 10 CARDS PER PAGE) */}
        {activeTab === 'alerts' && (
          <AlertsTab
            alertCardsGroupedByMitra={alertCardsGroupedByMitra}
            allClassifiedAlertCardsCount={allClassifiedAlertCardsCount}
            alertCurrentPage={alertCurrentPage}
            alertTotalPages={alertTotalPages}
            onPrevPage={() => setAlertCurrentPage((p) => Math.max(1, p - 1))}
            onNextPage={() => setAlertCurrentPage((p) => Math.min(alertTotalPages, p + 1))}
            onInspectCadre={setSelectedCadreForInspect}
          />
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
      </main>
    </div>
  )
}
