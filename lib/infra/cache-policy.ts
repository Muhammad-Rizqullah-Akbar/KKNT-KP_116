/**
 * DL-008 — Kebijakan cache terpusat (serverless-safe).
 *
 * PENTING soal lingkungan serverless (Vercel):
 * - Cache di memory proses HANYA berlaku untuk satu instance. Instance bisa
 *   dibuat/hilang kapan saja (cold start), dan beberapa instance berjalan
 *   bersamaan. Jadi cache memory TIDAK boleh diandalkan untuk konsistensi.
 * - Yang dipakai di sini adalah cache di sisi KLIEN (browser) lewat
 *   TanStack Query, yang konsisten untuk satu pengguna. Ini cara paling aman
 *   menekan pembacaan berulang tanpa menambah ketergantungan layanan baru.
 * - Cache TIDAK pernah dipakai untuk keputusan otorisasi.
 */

/** Data jarang berubah (formulir, registry, pengaturan). */
export const CACHE_STATIC = {
  staleTime: 15 * 60 * 1000, // 15 menit
  gcTime: 60 * 60 * 1000, // 1 jam
} as const

/** Ringkasan/statistik dashboard — perlu segar, tapi tidak tiap detik. */
export const CACHE_SUMMARY = {
  staleTime: 5 * 60 * 1000, // 5 menit
  gcTime: 30 * 60 * 1000, // 30 menit
} as const

/** Daftar data (respons, responden, distribusi) — sering berubah. */
export const CACHE_LIST = {
  staleTime: 60 * 1000, // 1 menit
  gcTime: 10 * 60 * 1000, // 10 menit
} as const

/** Data yang harus selalu segar (detail, sesi pengisian). */
export const CACHE_LIVE = {
  staleTime: 0,
  gcTime: 5 * 60 * 1000,
} as const

/** Telemetri biaya — boleh basi agak lama. */
export const CACHE_TELEMETRY = {
  staleTime: 10 * 60 * 1000, // 10 menit
  gcTime: 60 * 60 * 1000,
} as const
