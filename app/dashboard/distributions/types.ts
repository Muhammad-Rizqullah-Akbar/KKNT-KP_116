import type { DistributionDoc } from '@/lib/domain/distributions/distribution-types'

export interface DistributionDetail {
  distribution: DistributionDoc
  formSummary: any
}

export interface VersionItem {
  versionId: string
  versionNumber: number
  createdAt: string
  changeLogSummary?: string
  publishedAt?: string
  [key: string]: any
}

export interface DistributionStats {
  total: number
  active: number
  paused: number
  expired: number
}

export interface DeleteTarget {
  id: string
  code: string
  title: string
}
