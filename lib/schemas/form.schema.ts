import { z } from 'zod'

export const formStatusSchema = z.enum(['draft', 'published', 'archived'])
export type FormStatus = z.infer<typeof formStatusSchema>

export const formSchema = z.object({
  formId: z.string(),
  schemaVersion: z.string().optional(),
  metadata: z.object({
    title: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    target: z.string().optional(),
    kind: z.string().optional(),
    status: z.string().optional(),
    allowCadreDistribution: z.boolean().optional(),
  }),
  activeVersionId: z.string().optional(),
  activeVersionNumber: z.number().int().optional(),
  status: formStatusSchema,
  createdAt: z.any(),
  createdBy: z.string(),
  updatedAt: z.any(),
  updatedBy: z.string(),
  publishedAt: z.any().optional(),
  publishedBy: z.string().optional(),
})
export type Form = z.infer<typeof formSchema>

export const formVersionSchema = z.object({
  versionId: z.string(),
  formId: z.string(),
  versionNumber: z.number().int(),
  status: z.enum(['published', 'archived']),
  metadata: z.record(z.string(), z.any()),
  aspects: z.array(z.any()),
  questions: z.array(z.any()),
  scoring: z.record(z.string(), z.any()),
  validation: z.record(z.string(), z.any()),
  thresholds: z.array(z.any()),
  recommendations: z.any(),
  publishedAt: z.any().optional(),
  publishedBy: z.string().optional(),
})
export type FormVersion = z.infer<typeof formVersionSchema>
