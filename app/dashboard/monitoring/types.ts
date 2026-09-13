export type UserProfile = {
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

export type ResponseSummary = {
  responseId: string
  distributionCode?: string
  formTitle?: string
  createdBy?: string
  cadreId?: string
  result?: {
    percentage?: number
    grade?: string
    thresholdTitle?: string
  }
  submittedAt?: string
}

export type DistributionSummary = {
  distributionId: string
  code?: string
  distributionCode?: string
  formId?: string
  createdBy?: string
  cadreId?: string
  status?: string
  expiresAt?: string
  expiredAt?: string
}

export type AlertType = 'danger' | 'warning' | 'info' | 'success'

export type AlertCardItem = {
  id: string
  type: AlertType
  categoryTitle: string
  mitraName: string
  mitraUid?: string
  title: string
  desc: string
  cadre?: UserProfile
  actionLabel?: string
}

export type CadreStatus = 'high' | 'active' | 'attention'

export interface CadreMetric {
  cadre: UserProfile
  distCount: number
  respCount: number
  avgScore: number
  passRate: number
  contributionPct: number
  status: CadreStatus
  organizationName: string
}

export interface MitraMetric {
  mitra: UserProfile
  cadreCount: number
  topRepresentativeCadres: CadreMetric[]
  distCount: number
  respCount: number
  avgScore: number
  status: string
}

export interface MonitoringStats {
  totalMitra: number
  totalCadres: number
  totalDists: number
  totalResponses: number
  activeCadresCount: number
  highPerfCadresCount: number
  avgScore: number
}

export interface MitraGroup {
  mitra: UserProfile
  topCadres: CadreMetric[]
}

export interface TopContributorsByMitra {
  mitraGroups: MitraGroup[]
  topIndependent: CadreMetric[]
}

export interface AlertGroup {
  mitraName: string
  mitra?: UserProfile
  cards: AlertCardItem[]
}
