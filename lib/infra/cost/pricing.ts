/**
 * ============================================================
 * KKPD-KP V1.5 — Cost Model (pricing constants)
 * ============================================================
 * TUJUAN: membuat biaya Firestore bisa DIESTIMASI, bukan cuma hemat.
 *
 * PENTING:
 * - Harga di bawah adalah PLACEHOLDER acuan us-central1 dan
 *   WAJIB divalidasi ke daftar harga Firebase terkini sebelum
 *   dipakai untuk keputusan finansial.
 * - Sumber harga: https://firebase.google.com/pricing (Cloud Firestore)
 *
 * Satuan dasar: USD per 100.000 operasi (Firestore billing unit).
 * Simpan sebagai "USD per 1 operasi" supaya mudah dikalikan.
 *
 * File ini BARU dan BELUM di-import siapa pun — aman, tidak
 * mengubah perilaku production sampai dihubungkan eksplisit.
 */

export interface FirestorePricing {
  /** USD per 1 document read */
  read: number
  /** USD per 1 document write (set/update/create) */
  write: number
  /** USD per 1 document delete */
  delete: number
}

/**
 * Harga RESMI Cloud Firestore per 100.000 dokumen (us-central1, default),
 * diambil dari https://cloud.google.com/firestore/pricing (diakses 2026).
 *
 * - Document reads   : $0.03 / 100.000
 * - Document writes  : $0.09 / 100.000
 * - Document deletes : $0.01 / 100.000
 *
 * Free tier harian (Spark): 50.000 reads, 20.000 writes, 20.000 deletes.
 */
export const FIRESTORE_PRICE_USD: FirestorePricing = {
  read: 0.03 / 100_000,
  write: 0.09 / 100_000,
  delete: 0.01 / 100_000,
}

/**
 * Free tier harian (Spark plan), di-reset tiap hari dan dipakai
 * BERSAMA oleh seluruh endpoint dalam satu proyek.
 * Sumber: https://firebase.google.com/pricing — validasi sebelum dipakai.
 */
export const FIRESTORE_FREE_TIER_DAILY: FirestorePricing = {
  read: 50_000,
  write: 20_000,
  delete: 20_000,
}

/**
 * Ukuran koleksi (jumlah dokumen). Dipakai untuk estimasi STATIS
 * ketika code path diketahui melakukan full-collection scan.
 *
 * ANGKA CONTOH — ganti dengan angka produksi aktual.
 * Bisa dipindahkan ke Firestore settings agar bisa di-update
 * tanpa deploy ulang.
 */
export const ESTIMATED_COLLECTION_SIZES: Record<string, number> = {
  responses: 10_000,
  forms: 500,
  distributions: 200,
  users: 300,
  articles: 200,
  form_access: 100,
  partnerships: 200,
  form_registry: 2,
  settings: 10,
  article_categories: 20,
}

export const DEFAULT_COLLECTION_SIZE = 100
