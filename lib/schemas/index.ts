import { z } from 'zod'

/**
 * Zod schemas — single source of truth for data validation at the boundary.
 * Turunan dari TARGET_STRUCTURE_FINAL.md (10 koleksi, sinkron dengan ERD).
 * Setiap schema mendefinisikan bentuk dokumen Firestore yang valid.
 */

// ============================================================
// 1. users
// ============================================================
export const userRoleSchema = z.enum(['super_admin', 'partnership', 'cadre'])

export const userSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  role: userRoleSchema,
  organization: z.string().optional(),
  partnershipId: z.string().optional(),
  phone: z.string().optional(),
  photoURL: z.string().optional(),
  createdAt: z.any(), // Timestamp
  updatedAt: z.any(), // Timestamp
})
export type User = z.infer<typeof userSchema>

// ============================================================
// 2. partnerships
// ============================================================
export const partnershipTypeSchema = z.enum([
  'sekolah',
  'puskesmas',
  'pasar',
  'desa',
  'komunitas',
  'kampus',
])

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

// ============================================================
// 3. forms (metadata) + 4. versions (subcollection)
// ============================================================
export const formStatusSchema = z.enum(['draft', 'published', 'archived'])

export const formSchema = z.object({
  formId: z.string(),
  schemaVersion: z.enum(['v1.0', 'v1.5']),
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

// ============================================================
// 5. distributions
// ============================================================
export const distributionStatusSchema = z.enum([
  'draft',
  'active',
  'paused',
  'expired',
  'archived',
])

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

// ============================================================
// 6. responses (PALING KRITIS — 1 skema unified)
// ============================================================
export const responseStatusSchema = z.enum([
  'in_progress',
  'submitted',
  'abandoned',
  'invalid',
])

export const respondentSchema = z.object({
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  institution: z.string().optional(),
})

export const responseQuestionSchema = z.object({
  questionId: z.string(),
  aspectId: z.string().optional(),
  label: z.string(),
  value: z.any(),
  score: z.number().optional(),
})

export const responseResultSchema = z.object({
  rawScore: z.number(),
  maximumScore: z.number(),
  percentage: z.number(),
  grade: z.string(),
  thresholdTitle: z.string().optional(),
  aspects: z.array(z.any()),
  questions: z.array(z.any()),
  recommendations: z.array(z.any()),
})

export const responseSchema = z.object({
  responseId: z.string(),
  distributionId: z.string(),
  distributionCode: z.string(),
  formId: z.string(),
  versionId: z.string(),
  versionNumber: z.number().int(),
  ownerType: userRoleSchema,
  ownerId: z.string(),
  partnershipId: z.string().optional(),
  respondent: respondentSchema,
  questions: z.array(responseQuestionSchema),
  biodata: z.array(z.any()),
  status: responseStatusSchema,
  submissionToken: z.string(),
  result: responseResultSchema.optional(),
  startedAt: z.any(),
  submittedAt: z.any().optional(),
  updatedAt: z.any(),
  updatedBy: z.string(),
})
export type Response = z.infer<typeof responseSchema>

// ============================================================
// 7. articles + 8. article_categories
// ============================================================
export const articleSchema = z.object({
  articleId: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().optional(),
  content: z.string(),
  blocks: z.array(z.any()),
  category: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  status: z.enum(['draft', 'published']),
  featuredImage: z.string().optional(),
  gallery: z.array(z.any()),
  tags: z.array(z.string()),
  views: z.number().int().nonnegative(),
  readTime: z.number().int(),
  pretestCode: z.string().optional(),
  posttestCode: z.string().optional(),
  createdAt: z.any(),
  updatedAt: z.any(),
})
export type Article = z.infer<typeof articleSchema>

export const articleCategorySchema = z.object({
  categoryId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.any(),
})
export type ArticleCategory = z.infer<typeof articleCategorySchema>

// ============================================================
// 9. form_access (junction RBAC)
// ============================================================
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

// ============================================================
// 10. form_registry + settings (singleton)
// ============================================================
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
