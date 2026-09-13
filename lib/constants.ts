/**
 * Konstanta role & status terpusat — hindari magic string tersebar.
 * Sumber kebenaran: lib/domain/auth/authorization.ts (APP_ROLES) + lib/schemas/.
 * Impor dari sini di komponen, jangan hardcode string literal.
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  PARTNERSHIP: 'partnership',
  CADRE: 'cadre',
} as const

export const ROLES_ARRAY = [ROLES.SUPER_ADMIN, ROLES.PARTNERSHIP, ROLES.CADRE] as const

/** Role yang punya akses global (lihat seluruh data). */
export const GLOBAL_ROLES = [ROLES.SUPER_ADMIN] as const

export const RESPONSE_STATUS = {
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  ABANDONED: 'abandoned',
  INVALID: 'invalid',
} as const

export const DISTRIBUTION_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  EXPIRED: 'expired',
  ARCHIVED: 'archived',
} as const

export const FORM_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const
