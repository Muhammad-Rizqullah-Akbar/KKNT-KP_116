import { z } from 'zod'

export const partnershipTypeSchema = z.enum([
  'sekolah',
  'puskesmas',
  'pasar',
  'desa',
  'komunitas',
  'kampus',
])
export type PartnershipType = z.infer<typeof partnershipTypeSchema>

export const partnershipSchema = z.object({
  partnershipId: z.string(),
  name: z.string(),
  type: partnershipTypeSchema,
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  address: z.string().optional(),
  kaderCount: z.number().int().nonnegative(),
  createdAt: z.any(),
  updatedAt: z.any(),
})
export type Partnership = z.infer<typeof partnershipSchema>
