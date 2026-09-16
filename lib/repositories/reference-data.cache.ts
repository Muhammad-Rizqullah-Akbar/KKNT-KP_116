/**
 * Data referensi (forms, distributions, users) jarang berubah, tetapi saat ini
 * dibaca ULANG dari Firestore pada setiap permintaan daftar response.
 *
 * Dampak biaya: setiap kali daftar dibuka = 3 pembacaan koleksi penuh.
 * Pada 10.000 response dengan 200 buka/hari = ratusan ribu pembacaan terbuang.
 *
 * Solusi: simpan di cache proses dengan masa berlaku pendek, dan sediakan
 * fungsi invalidasi yang dipanggil setiap kali data referensi berubah.
 *
 * Catatan serverless: cache ini bersifat best-effort per instance. Nilainya
 * adalah memangkas pembacaan berulang dalam satu instance yang melayani
 * banyak permintaan — bukan jaminan konsistensi lintas instance.
 */

export interface RefData {
  forms: { id: string; data: any }[]
  distributions: { id: string; data: any }[]
  users: { id: string; data: any }[]
}

const TTL_MS = 60 * 1000 // 1 menit
let cache: { at: number; value: RefData } | null = null
let inflight: Promise<RefData> | null = null

/** Ambil data referensi (dari cache bila masih segar). */
export async function getReferenceData(
  loader: () => Promise<RefData>,
): Promise<RefData> {
  const now = Date.now()
  if (cache && now - cache.at < TTL_MS) return cache.value
  if (inflight) return inflight

  inflight = (async () => {
    try {
      const value = await loader()
      cache = { at: Date.now(), value }
      return value
    } finally {
      inflight = null
    }
  })()

  return inflight
}

/** Kosongkan cache (panggil setelah form/distribusi/pengguna berubah). */
export function invalidateReferenceData(): void {
  cache = null
}

/** Info cache (untuk observabilitas). */
export function referenceCacheInfo(): { cached: boolean; ageMs: number | null; ttlMs: number } {
  return {
    cached: cache !== null,
    ageMs: cache ? Date.now() - cache.at : null,
    ttlMs: TTL_MS,
  }
}
