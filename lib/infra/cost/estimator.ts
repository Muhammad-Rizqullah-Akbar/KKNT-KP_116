/**
 * ============================================================
 * KKPD-KP V1.5 — Cost Estimator (statis, zero-risk)
 * ============================================================
 * Mengestimasi biaya Firestore per request dari ukuran koleksi
 * dan pola baca/tulis yang SUDAH DIKETAHUI (hasil audit).
 *
 * Sifat: MURNI KALKULASI. Tidak membaca/menulis Firestore,
 * tidak mengubah perilaku production, tidak menambah operasi.
 *
 * Pemakaian:
 *   import { estimateEndpointCost } from '@/lib/cost/estimator'
 *   estimateEndpointCost('responses.list')  // => { reads, costUsd, ... }
 *
 * Untuk dashboard/panel, panggil lewat API route ber-guard.
 */

import {
  FIRESTORE_PRICE_USD,
  FIRESTORE_FREE_TIER_DAILY,
  ESTIMATED_COLLECTION_SIZES,
  DEFAULT_COLLECTION_SIZE,
} from './pricing'

export interface CostEstimate {
  /** Total dokumen dibaca (read) per 1 request */
  reads: number
  writes: number
  deletes: number
  /** USD per 1 request */
  costUsd: number
  /** Komponen pembentuk reads (nama koleksi -> jumlah) untuk transparansi */
  breakdown: Record<string, number>
  /** Asumsi ukuran koleksi yang dipakai */
  collectionSizes: Record<string, number>
}

/**
 * Deskripsi operasi per endpoint. Angka reads didapat dari audit
 * call-graph (bukan cuma file route), per tanggal audit.
 *
 * "full_scan:<collection>" artinya 1x baca SELURUH koleksi
 * (safeGetCollectionDocs / .get() tanpa limit).
 */
const ENDPOINT_OPERATIONS: Record<string, Array<{ kind: 'full_scan' | 'reads' | 'writes' | 'deletes'; collection?: string; count?: number }>> = {
  'responses.list': [
    { kind: 'full_scan', collection: 'responses' },
    { kind: 'full_scan', collection: 'forms' },
    { kind: 'full_scan', collection: 'distributions' },
    { kind: 'full_scan', collection: 'users' },
  ],
  'responses.detail': [
    { kind: 'full_scan', collection: 'responses' },
    { kind: 'full_scan', collection: 'forms' },
    { kind: 'full_scan', collection: 'distributions' },
    { kind: 'full_scan', collection: 'users' },
  ],
  'dashboard.stats': [
    { kind: 'full_scan', collection: 'responses' }, // query.get() 30 hari tanpa limit
  ],
  'auth.login': [{ kind: 'full_scan', collection: 'users' }],
  'auth.users': [{ kind: 'full_scan', collection: 'users' }],
  'v1_5.users': [{ kind: 'full_scan', collection: 'users' }],
  'forms.list': [{ kind: 'full_scan', collection: 'forms' }],
}

function collectionSize(name: string, overrides?: Record<string, number>): number {
  if (overrides && typeof overrides[name] === 'number') return overrides[name]
  return ESTIMATED_COLLECTION_SIZES[name] ?? DEFAULT_COLLECTION_SIZE
}

export function estimateEndpointCost(
  endpointKey: string,
  collectionSizeOverrides?: Record<string, number>,
): CostEstimate {
  const ops = ENDPOINT_OPERATIONS[endpointKey] ?? []
  const breakdown: Record<string, number> = {}
  let reads = 0
  let writes = 0
  let deletes = 0

  for (const op of ops) {
    if (op.kind === 'full_scan' && op.collection) {
      const n = collectionSize(op.collection, collectionSizeOverrides)
      reads += n
      breakdown[op.collection] = (breakdown[op.collection] ?? 0) + n
    } else if (op.kind === 'reads') {
      reads += op.count ?? 0
    } else if (op.kind === 'writes') {
      writes += op.count ?? 0
    } else if (op.kind === 'deletes') {
      deletes += op.count ?? 0
    }
  }

  const costUsd =
    reads * FIRESTORE_PRICE_USD.read +
    writes * FIRESTORE_PRICE_USD.write +
    deletes * FIRESTORE_PRICE_USD.delete

  return {
    reads,
    writes,
    deletes,
    costUsd,
    breakdown,
    collectionSizes: { ...ESTIMATED_COLLECTION_SIZES, ...(collectionSizeOverrides || {}) },
  }
}

/** Proyeksi bulanan: USD per bulan untuk requestPerDay tertentu. */
export function projectMonthlyCostUsd(
  endpointKey: string,
  requestsPerDay: number,
  daysPerMonth = 30,
): number {
  return estimateEndpointCost(endpointKey).costUsd * requestsPerDay * daysPerMonth
}

export interface FreeTierResult {
  /** Berapa request endpoint ini per hari sampai kuota free tier (per operasi) habis */
  requestsPerDayUntilFreeTierExhausted: number
  /** Read ops per hari yang MASUK free tier */
  freeReadsPerDay: number
  /** Read ops per hari yang MELAMPAUI free tier (kena biaya) */
  billableReadsPerDay: number
  /** Biaya bersih per bulan (setelah free tier) untuk requestPerDay ini */
  netCostUsdPerMonth: number
}

/**
 * Hitung biaya BERSIH setelah free tier harian diperhitungkan.
 *
 * Catatan penting: free tier DIPAKAI BERSAMA seluruh endpoint dalam
 * satu proyek. Fungsi ini menganggap free tier sepenuhnya tersedia
 * untuk endpoint ini — untuk akurasi, jumlahkan dulu semua endpoint.
 */
export function estimateWithFreeTier(
  endpointKey: string,
  requestsPerDay: number,
  daysPerMonth = 30,
  collectionSizeOverrides?: Record<string, number>,
): FreeTierResult {
  const e = estimateEndpointCost(endpointKey, collectionSizeOverrides)

  const freeReadsPerDay = Math.min(e.reads * requestsPerDay, FIRESTORE_FREE_TIER_DAILY.read)
  const billableReadsPerDay = Math.max(e.reads * requestsPerDay - FIRESTORE_FREE_TIER_DAILY.read, 0)

  // Kuota per operasi; hitung yang paling membatasi untuk "muat berapa request"
  const limits: number[] = []
  if (e.reads > 0) limits.push(Math.floor(FIRESTORE_FREE_TIER_DAILY.read / e.reads))
  if (e.writes > 0) limits.push(Math.floor(FIRESTORE_FREE_TIER_DAILY.write / e.writes))
  if (e.deletes > 0) limits.push(Math.floor(FIRESTORE_FREE_TIER_DAILY.delete / e.deletes))

  const requestsUntilExhausted = limits.length > 0 ? Math.min(...limits) : Infinity

  const billableWrites = Math.max(e.writes * requestsPerDay - FIRESTORE_FREE_TIER_DAILY.write, 0)
  const billableDeletes = Math.max(e.deletes * requestsPerDay - FIRESTORE_FREE_TIER_DAILY.delete, 0)

  const netCostUsdPerMonth =
    (billableReadsPerDay * FIRESTORE_PRICE_USD.read +
      billableWrites * FIRESTORE_PRICE_USD.write +
      billableDeletes * FIRESTORE_PRICE_USD.delete) *
    daysPerMonth

  return {
    requestsPerDayUntilFreeTierExhausted: requestsUntilExhausted,
    freeReadsPerDay,
    billableReadsPerDay,
    netCostUsdPerMonth,
  }
}

export const ENDPOINT_KEYS = Object.keys(ENDPOINT_OPERATIONS) as Array<keyof typeof ENDPOINT_OPERATIONS>
export type EndpointKey = keyof typeof ENDPOINT_OPERATIONS
