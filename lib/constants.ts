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

// Durasi (ms) — hindari magic number tersebar
export const TOAST_DURATION_MS = 3000
export const TOAST_DURATION_LONG_MS = 4000
export const VIEW_COOLDOWN_MS = 5000
export const MOBILE_BREAKPOINT_PX = 768
