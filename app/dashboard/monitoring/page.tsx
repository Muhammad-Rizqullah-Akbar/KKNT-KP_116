'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/infra/safe-fetch'
import { queryKeys } from '@/lib/query-keys'
import CadreView from './cadre-view'
import MitraView from './mitra-view'
import AdminView from './admin-view'
import { useMonitoringMetrics } from './use-monitoring-metrics'
import type { UserProfile, ResponseSummary, DistributionSummary } from './types'

export default function MonitoringDomainPage() {
  const { user, userData } = useAuth()
  const isCadre = userData?.role === 'cadre'
  const isPartnershipRole = userData?.role === 'partnership'

  // Fetch all Monitoring Data via TanStack Query
  const { data: monitoringData, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.monitoring,
    queryFn: async () => {
      const [usersRes, distRes, respRes] = await Promise.all([
        safeFetchJson('/api/auth/users'),
        safeFetchJson('/api/distributions'),
        safeFetchJson('/api/responses'),
      ])

      return {
        users:
          usersRes.ok && usersRes.data && Array.isArray(usersRes.data.users)
            ? (usersRes.data.users as UserProfile[])
            : [],
        distributions:
          distRes.ok && distRes.data && Array.isArray(distRes.data.distributions)
            ? (distRes.data.distributions as DistributionSummary[])
            : [],
        responses:
          respRes.ok && respRes.data && Array.isArray(respRes.data.responses)
            ? (respRes.data.responses as ResponseSummary[])
            : [],
      }
    },
  })

  const users = monitoringData?.users ?? []
  const distributions = monitoringData?.distributions ?? []
  const responses = monitoringData?.responses ?? []

  const metrics = useMonitoringMetrics({
    monitoringData: { users, distributions, responses },
    userUid: user?.uid,
    userData,
    isPartnershipRole,
  })

  // =========================================================================
  // VIEW 1: CADRE PERSONALIZED DASHBOARD VIEW
  // =========================================================================
  if (isCadre) {
    return (
      <CadreView
        user={user}
        userData={userData}
        distributions={distributions}
        responses={responses}
        cadreMetrics={metrics.cadreMetrics}
      />
    )
  }

  // =========================================================================
  // VIEW 2: MITRA ROLE LOGIN -> SINGLE INTEGRATED MONITORING PAGE (NO TABS)
  // =========================================================================
  if (isPartnershipRole) {
    return (
      <MitraView
        userData={userData}
        userEmail={user?.email}
        cadreMetrics={metrics.cadreMetrics}
        stats={metrics.stats}
      />
    )
  }

  // =========================================================================
  // VIEW 3: SUPER ADMIN / ADMIN SYSTEMS / BPOM MULTI-TAB MONITORING PAGE
  // =========================================================================
  return (
    <AdminView
      cadreMetrics={metrics.cadreMetrics}
      mitraMetrics={metrics.mitraMetrics}
      stats={metrics.stats}
      topContributorsByMitra={metrics.topContributorsByMitra}
      allClassifiedAlertCardsCount={metrics.allClassifiedAlertCards.length}
      alertCardsGroupedByMitra={metrics.alertCardsGroupedByMitra}
      isLoading={isLoading}
    />
  )
}
