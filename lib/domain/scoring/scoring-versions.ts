/**
 * Versi mesin penilaian.
 *
 * Nilai ini TERSIMPAN pada dokumen response (`result.engineVersion`).
 * Jangan mengubah nilai lama tanpa migrasi data — response lama harus
 * tetap terbaca.
 */

/** Versi mesin penilaian yang dipakai saat ini. */
export const ENGINE_VERSION_CURRENT = 'v1.5'

/** Nilai versi lama yang masih tersimpan pada data historis. */
export const ENGINE_VERSION_ARCHIVED = 'legacy-v1'

/** Nilai yang menandai hasil penilaian perlu dihitung ulang. */
export const ENGINE_VERSION_NONE = 'none'

const ARCHIVED_VALUES = new Set([ENGINE_VERSION_ARCHIVED, 'none', ''])

/** True bila nilai versi berasal dari data historis (belum dihitung ulang). */
export function isArchivedEngineVersion(value: unknown): boolean {
  const v = String(value ?? '').trim().toLowerCase()
  return ARCHIVED_VALUES.has(v)
}
