import { z } from 'zod'

export const formAccessSchema = z.object({
  accessId: z.string(),
  formId: z.string(),
  subjectType: z.enum(['cadre', 'partnership']),
  subjectId: z.string(),
  subjectName: z.string(),
  permissions: z.array(z.enum(['distribute', 'view'])),
  status: z.enum(['active', 'revoked']),
  createdBy: z.string(),
  createdAt: z.any(),
  updatedAt: z.any(),
})
export type FormAccess = z.infer<typeof formAccessSchema>

export const formRegistrySchema = z.object({
  docId: z.string(),
  categories: z.array(z.string()),
  targets: z.array(z.string()),
  updatedAt: z.any(),
})
export type FormRegistry = z.infer<typeof formRegistrySchema>

export const settingsSchema = z.object({
  docId: z.string(),
  hero: z.record(z.string(), z.any()),
  partnership: z.record(z.string(), z.any()),
  gallery: z.array(z.any()),
  branding: z.record(z.string(), z.any()),
  updatedAt: z.any(),
})
export type Settings = z.infer<typeof settingsSchema>
