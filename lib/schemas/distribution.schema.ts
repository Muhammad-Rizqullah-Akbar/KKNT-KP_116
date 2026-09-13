import { z } from 'zod'
import { userRoleSchema } from './user.schema'

export const distributionStatusSchema = z.enum([
  'draft',
  'active',
  'paused',
  'expired',
  'archived',
])
export type DistributionStatus = z.infer<typeof distributionStatusSchema>

export const distributionSchema = z.object({
  distributionId: z.string(),
  formId: z.string(),
  code: z.string(),
  normalizedCode: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  ownerType: userRoleSchema,
  ownerId: z.string(),
  ownerName: z.string(),
  partnershipId: z.string().optional(),
  versionMode: z.enum(['active', 'pinned']),
  pinnedVersionId: z.string().optional(),
  status: distributionStatusSchema,
  expiresAt: z.any().optional(),
  createdAt: z.any(),
  createdBy: z.string(),
  updatedAt: z.any(),
  updatedBy: z.string(),
})
export type Distribution = z.infer<typeof distributionSchema>
