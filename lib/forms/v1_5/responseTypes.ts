import type { PublicFormProjection } from '@/lib/forms/v1_5/types'
import type { DistributionOwnerType } from '@/lib/forms/v1_5/distributionTypes'
import type { ResponseResultDoc } from '@/lib/forms/v1_5/scoring/scoringTypes'

export type ResponseStatus = 'in_progress' | 'submitted' | 'abandoned' | 'invalid'

export interface RespondentInfo {
  name?: string
  email?: string
  phone?: string
  externalId?: string
}

export interface ResponseDoc {
  responseId: string
  distributionId: string
  distributionCode: string
  formId: string
  versionId: string
  versionNumber: number
  ownerType: DistributionOwnerType
  ownerId: string
  respondent: RespondentInfo
  answers: Record<string, any>
  status: ResponseStatus
  startedAt: string
  updatedAt: string
  submittedAt?: string
  submissionToken: string
  result?: ResponseResultDoc | any
  createdBy?: string
  cadreId?: string
  userId?: string
  formTitle?: string
  groupName?: string
  distributionTitle?: string
  ownerName?: string
  metadata?: {
    userAgent?: string
    locale?: string
    timezone?: string
  }
}

export interface PublicResponseSessionDTO {
  responseId: string
  submissionToken: string
  distributionCode: string
  formId: string
  versionId: string
  versionNumber: number
  title: string
  description?: string
  ownerName: string
  form: PublicFormProjection
}

export interface PublicResponseSubmitDTO {
  responseId: string
  status: ResponseStatus
  submittedAt: string
  message: string
  result?: {
    percentage: number
    grade: string
    thresholdTitle: string
    thresholdDescription?: string
    aspects?: any[]
    recommendations: any[]
  }
}

export interface StartResponseParams {
  distributionCode: string
  respondent?: RespondentInfo
}

export interface SubmitResponseParams {
  submissionToken: string
  answers: Record<string, any>
}

export interface ResponseFilterOptions {
  distributionId?: string
  formId?: string
  versionId?: string
  status?: string
  search?: string
}
