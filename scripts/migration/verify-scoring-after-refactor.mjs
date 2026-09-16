/**
 * Verifikasi: hasil penilaian tetap sama setelah refactor enrichment.
 * Emulator: FIRESTORE_EMULATOR_HOST=localhost:8090
 * Produksi : tanpa env (via .env) — read-only
 */
import fs from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const USE_EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST
let app
if (USE_EMULATOR) {
  app = initializeApp({ projectId: 'desa-sehat-2026' })
} else {
  const env = {}
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue
    const i = t.indexOf('='); if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"|"$/g, '')
  }
  app = initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
}
const db = getFirestore(app)
if (USE_EMULATOR) db.settings({ host: 'localhost:8090', ssl: false })

const snap = await db.collection('responses').get()
const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

let withPct = 0, withAspects = 0, sumPct = 0
const codes = {}
for (const r of docs) {
  const pct = r.result?.percentage
  if (typeof pct === 'number') { withPct++; sumPct += pct }
  if (Array.isArray(r.result?.aspects) && r.result.aspects.length > 0) withAspects++
  const c = r.formCode || r.distributionCode || '(none)'
  codes[c] = (codes[c] || 0) + 1
}

console.log(`\n=== HASIL PENILAIAN (${USE_EMULATOR ? 'EMULATOR' : 'PRODUKSI'}) ===`)
console.log(`total response      : ${docs.length}`)
console.log(`punya percentage    : ${withPct}`)
console.log(`punya result.aspects: ${withAspects}`)
console.log(`rata-rata skor      : ${withPct ? (sumPct / withPct).toFixed(2) : '-'}%`)
console.log(`\nper kode form:`)
Object.entries(codes).sort().forEach(([c, n]) => console.log(`  ${String(n).padStart(4)} ${c}`))

// Rata-rata per aspek
const aspectAcc = {}
docs.forEach((r) => {
  (r.result?.aspects || []).forEach((a) => {
    if (a.maximumScore > 0) {
      const key = a.title || a.aspectId
      if (!aspectAcc[key]) aspectAcc[key] = { total: 0, n: 0 }
      aspectAcc[key].total += a.percentage
      aspectAcc[key].n++
    }
  })
})
console.log('\nrata-rata per aspek:')
Object.entries(aspectAcc).forEach(([k, v]) => console.log(`  ${k.padEnd(24)} ${Math.round(v.total / v.n)}%  (n=${v.n})`))
process.exit(0)
