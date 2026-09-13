import { z } from 'zod'

export const userRoleSchema = z.enum(['super_admin', 'partnership', 'cadre'])
export type UserRole = z.infer<typeof userRoleSchema>

export const userSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  role: userRoleSchema,
  organization: z.string().optional(),
  partnershipId: z.string().optional(),
  phone: z.string().optional(),
  photoURL: z.string().optional(),
  createdAt: z.any(),
  updatedAt: z.any(),
})
export type User = z.infer<typeof userSchema>
