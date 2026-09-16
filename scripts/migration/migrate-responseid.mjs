/**
 * DL-012a — Lengkapi field `responseId` di dalam dokumen response.
 *
 * TEMUAN: 95 response tidak punya field `responseId` di dalam data
 * (hanya ada sebagai document ID). Beberapa bagian kode membaca
 * `doc.responseId`, sehingga perlu diselaraskan.
 *
 * DRY-RUN default. --apply untuk menulis.
 */
import fs from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const APPLY = process.argv.includes('--apply')
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
if (USE_EMULATOR) db.settings({ host: 'localhost:8090', ssl: false, ignoreUndefinedProperties: true })

console.log(`MODE: ${USE_EMULATOR ? 'EMULATOR' : 'PRODUKSI'} | ${APPLY ? 'APPLY' : 'DRY-RUN'}\n`)

const snap = await db.collection('responses').get()
const updates = []
let skipped = 0
for (const d of snap.docs) {
  const r = d.data()
  if (r.responseId === d.id) { skipped++; continue }
  updates.push({ ref: d.ref, id: d.id, existing: r.responseId })
}

console.log(`Total response     : ${snap.size}`)
console.log(`Sudah benar        : ${skipped}`)
console.log(`Akan dilengkapi    : ${updates.length}`)
if (updates.length) {
  console.log('\nContoh 3:')
  updates.slice(0, 3).forEach((u) => console.log(`  docID=${u.id} | responseId sekarang=${u.existing || '(kosong)'}`))
}

if (!APPLY) { console.log('\n(DRY-RUN) tambahkan --apply untuk menulis.'); process.exit(0) }

for (let i = 0; i < updates.length; i += 400) {
  const b = db.batch()
  for (const u of updates.slice(i, i + 400)) b.set(u.ref, { responseId: u.id }, { merge: true })
  await b.commit()
}
console.log(`\n✅ ${updates.length} response dilengkapi.`)
process.exit(0)
