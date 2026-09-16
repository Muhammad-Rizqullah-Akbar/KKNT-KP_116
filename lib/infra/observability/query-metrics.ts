/**
 * DL-009 — Telemetri query & biaya (observability).
 *
 * Mencatat operasi baca Firestore secara terukur TANPA data pribadi.
 * Tujuan: mengetahui endpoint mana yang paling boros, sehingga optimasi
 * bisa berdasarkan data — bukan dugaan.
 *
 * Aman: hanya menyimpan angka + nama koleksi. Tidak menyimpan jawaban,
 * email, token, atau data pribadi apa pun.
 */

export interface QueryMetric {
  endpoint: string
  collection: string
  /** Perkiraan jumlah dokumen terbaca */
  reads: number
  /** Durasi milidetik */
  ms: number
  ok: boolean
  at: string
}

const MAX_ENTRIES = 500
const buffer: QueryMetric[] = []

/** Catat satu operasi baca. */
export function recordQuery(metric: Omit<QueryMetric, 'at'>): void {
  buffer.push({ ...metric, at: new Date().toISOString() })
  if (buffer.length > MAX_ENTRIES) buffer.splice(0, buffer.length - MAX_ENTRIES)
}

/** Ukur durasi & catat hasil sebuah operasi. */
export async function traced<T>(
  meta: { endpoint: string; collection: string; reads?: number },
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    const n = Array.isArray(result) ? result.length : meta.reads || 0
    recordQuery({ endpoint: meta.endpoint, collection: meta.collection, reads: n, ms: Date.now() - start, ok: true })
    return result
  } catch (error) {
    recordQuery({ endpoint: meta.endpoint, collection: meta.collection, reads: 0, ms: Date.now() - start, ok: false })
    throw error
  }
}

export interface QuerySummaryRow {
  endpoint: string
  calls: number
  totalReads: number
  avgMs: number
  errorRate: number
}

/** Ringkasan per endpoint (siap ditampilkan di dashboard). */
export function summarizeQueries(): QuerySummaryRow[] {
  const map = new Map<string, { calls: number; reads: number; ms: number; errors: number }>()
  for (const m of buffer) {
    const e = map.get(m.endpoint) ?? { calls: 0, reads: 0, ms: 0, errors: 0 }
    e.calls++
    e.reads += m.reads
    e.ms += m.ms
    if (!m.ok) e.errors++
    map.set(m.endpoint, e)
  }
  return Array.from(map.entries())
    .map(([endpoint, v]) => ({
      endpoint,
      calls: v.calls,
      totalReads: v.reads,
      avgMs: Math.round(v.ms / v.calls),
      errorRate: Math.round((v.errors / v.calls) * 100),
    }))
    .sort((a, b) => b.totalReads - a.totalReads)
}

/** Snapshot mentah (untuk endpoint telemetry). */
export function getRecentQueries(limit = 50): QueryMetric[] {
  return buffer.slice(-Math.max(1, Math.min(limit, MAX_ENTRIES))).reverse()
}

/** Cari endpoint yang berpotensi mahal (banyak read per panggilan). */
export function findCostHazards(thresholdReads = 100): QuerySummaryRow[] {
  return summarizeQueries().filter((r) => r.totalReads / Math.max(1, r.calls) >= thresholdReads)
}
