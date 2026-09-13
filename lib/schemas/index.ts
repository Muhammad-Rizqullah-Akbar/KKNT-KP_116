/**
 * lib/schemas/ — Zod schema (runtime validation) — single source of truth.
 * Setiap entitas dipisah ke file .schema.ts; barrel ini re-export semuanya.
 * Type diturunkan via z.infer (lihat lib/types/).
 */

export * from './user.schema'
export * from './partnership.schema'
export * from './form.schema'
export * from './distribution.schema'
export * from './response.schema'
export * from './article.schema'
export * from './access-registry-settings.schema'
