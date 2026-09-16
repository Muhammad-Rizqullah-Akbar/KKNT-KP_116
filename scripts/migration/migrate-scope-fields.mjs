/**
 * MIGRASI FIELD SCOPE — perbaikan berdasarkan diagnosa nyata.
 *
 * TEMUAN: `distributionCode` pada response berisi KODE FORM (FRM-*),
 * bukan kode distribusi (KKPD-*). Tidak ada relasi response→distribution
 * pada data ini, sehingga ownerId/partnershipId TIDAK DAPAT di-resolve.
 *
 * Yang AMAN dan BENAR untuk diisi:
 *   1. status      → 'submitted' bila submittedAt ada
 *   2. formCode    → samakan dengan code form berdasarkan formId
 *   3. versionId   → bila kosong, turunkan dari formId
 *   4. distributionCode → TIDAK diubah (berisi kode form, dipakai UI)
 *   5. ownerId/partnershipId → TIDAK dipaksa (tidak ada sumber yang sah)
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

// Peta form
const formSnap = await db.collection('forms').get()
const formById = {}
formSnap.forEach((d) => { formById[d.id] = { id: d.id, ...d.data() } })
console.log(`Forms: ${formSnap.size}`)

const respSnap = await db.collection('responses').get()
let changed = 0
const stats = { status: 0, formCode: 0, versionId: 0, formId: 0 }
const updates = []

for (const d of respSnap.docs) {
  const r = d.data()
  const patch = {}
  const form = r.formId ? formById[r.formId] : null

  // 1. status
  if (!r.status) {
    patch.status = r.submittedAt ? 'submitted' : 'in_progress'
    stats.status++
  }

  // 2. formCode: samakan dengan kode form yang benar
  if (form?.code && r.formCode !== form.code) {
    patch.formCode = form.code
    stats.formCode++
  }

  // 3. versionId turunan dari formId (format yang dipakai sistem)
  if (!r.versionId && r.formId) {
    patch.versionId = `v1-${r.formId}`
    stats.versionId++
  }

  // 4. formId bila kosong tapi punya formCode
  if (!r.formId && r.formCode) {
    const found = formSnap.docs.find((x) => (x.data().code || '').toUpperCase() === String(r.formCode).toUpperCase())
    if (found) { patch.formId = found.id; stats.formId++ }
  }

  if (Object.keys(patch).length) { changed++; updates.push({ ref: d.ref, patch }) }
}

console.log('\n=== RENCANA ===')
console.log(`Total response : ${respSnap.size}`)
console.log(`Akan diubah    : ${changed}`)
console.log(`  + status     : ${stats.status}`)
console.log(`  + formCode   : ${stats.formCode}`)
console.log(`  + versionId  : ${stats.versionId}`)
console.log(`  + formId     : ${stats.formId}`)
console.log('\nCATATAN: ownerId/partnershipId TIDAK diisi — tidak ada relasi response→distribution pada data ini.')

if (!APPLY) { console.log('\n(DRY-RUN) tambahkan --apply untuk menulis.'); process.exit(0) }

console.log('\nMenulis...')
for (let i = 0; i < updates.length; i += 400) {
  const b = db.batch()
  for (const u of updates.slice(i, i + 400)) b.set(u.ref, u.patch, { merge: true })
  await b.commit()
}
console.log(`✅ ${Math.min(updates.length, updates.length)} response diperbarui.`)
process.exit(0)
