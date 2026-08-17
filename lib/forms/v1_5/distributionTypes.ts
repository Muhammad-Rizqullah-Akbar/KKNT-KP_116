import type { PublicFormProjection } from '@/lib/forms/v1_5/types'

export type DistributionOwnerType = 'admin' | 'cadre' | 'partnership'
export type DistributionVersionMode = 'active' | 'pinned'
export type DistributionStatus = 'draft' | 'active' | 'paused' | 'expired' | 'archived'

export interface DistributionOwner {
  type: DistributionOwnerType
  userId: string
  name: string
}

export interface DistributionDoc {
  distributionId: string
  formId: string
  code: string
  normalizedCode: string
  title: string
  description?: string
  ownerType: DistributionOwnerType
  ownerId: string
  ownerName: string
  partnershipId?: string
  createdByRole?: string
  versionMode: DistributionVersionMode
  pinnedVersionId?: string
  status: DistributionStatus
  expiresAt?: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export interface FormAccessDoc {
  accessId: string
  formId: string
  subjectType: 'cadre' | 'partnership'
  subjectId: string
  subjectName: string
  permissions: string[]
  status: 'active' | 'revoked'
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface PublicDistributionDTO {
  code: string
  status: DistributionStatus
  title: string
  description?: string
  formId: string
  versionMode: DistributionVersionMode
  resolvedVersionId: string
  resolvedVersionNumber: number
  expiresAt?: string
  ownerName: string
  responseId?: string
  submissionToken?: string
  form: PublicFormProjection
}

export type PublicResponseSessionDTO = PublicDistributionDTO

export interface CreateDistributionParams {
  formId: string
  title?: string
  description?: string
  ownerType?: DistributionOwnerType
  targetUserId?: string
  partnershipId?: string
  targetUserName?: string
  versionMode?: DistributionVersionMode
  pinnedVersionId?: string
  expiresAt?: string
}

export interface UpdateDistributionParams {
  title?: string
  description?: string
  versionMode?: DistributionVersionMode
  pinnedVersionId?: string
  status?: DistributionStatus
  expiresAt?: string
}
