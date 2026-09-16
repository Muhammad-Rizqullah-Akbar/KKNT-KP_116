/**
 * DL-012 — Pemeriksaan invarian data produksi.
 *
 * Memverifikasi kondisi data yang WAJIB benar. Aman: read-only.
 * Keluar dengan kode 1 bila ada pelanggaran (bisa dipakai sebagai CI gate).
 *
 * Usage:
 *   node scripts/migration/check-invariants.mjs              # produksi (via .env)
 *   FIRESTORE_EMULATOR_HOST=localhost:8090 node scripts/migration/check-invariants.mjs
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

const checks = []
const fail = (name, detail) => checks.push({ name, ok: false, detail })
const pass = (name, detail) => checks.push({ name, ok: true, detail })

// ---------- Ambil data ----------
const [respSnap, formSnap, distSnap] = await Promise.all([
  db.collection('responses').get(),
  db.collection('forms').get(),
  db.collection('distributions').get(),
])

const responses = respSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
const forms = formSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
const dists = distSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

// ---------- 1. Struktur dasar response ----------
const noResponseId = responses.filter((r) => !r.responseId).length
noResponseId === 0 ? pass('responseId terisi', '0 kosong') : fail('responseId terisi', `${noResponseId} kosong`)

const noFormId = responses.filter((r) => !r.formId).length
noFormId === 0 ? pass('formId terisi', '0 kosong') : fail('formId terisi', `${noFormId} kosong`)

const noVersionId = responses.filter((r) => !r.versionId).length
noVersionId === 0 ? pass('versionId terisi', '0 kosong') : fail('versionId terisi', `${noVersionId} kosong`)

const noStatus = responses.filter((r) => !r.status).length
noStatus === 0 ? pass('status terisi', '0 kosong') : fail('status terisi', `${noStatus} kosong`)

const noSubmittedAt = responses.filter((r) => r.status === 'submitted' && !r.submittedAt).length
noSubmittedAt === 0 ? pass('submittedAt ada bila submitted', '0 masalah') : fail('submittedAt ada bila submitted', `${noSubmittedAt} masalah`)

// ---------- 2. Hasil penilaian ----------
const submitted = responses.filter((r) => r.status === 'submitted')
const noAspects = submitted.filter((r) => !Array.isArray(r.result?.aspects) || r.result.aspects.length === 0).length
noAspects === 0
  ? pass('semua submitted punya result.aspects', `${submitted.length} response`)
  : fail('semua submitted punya result.aspects', `${noAspects} tanpa aspects`)

const noPercentage = submitted.filter((r) => typeof r.result?.percentage !== 'number').length
noPercentage === 0 ? pass('semua submitted punya persentase', '0 masalah') : fail('semua submitted punya persentase', `${noPercentage} masalah`)

// ---------- 3. Biodata tidak dinilai ----------
let biodataScored = 0
submitted.forEach((r) => {
  (r.result?.questions || []).forEach((q) => {
    const isBiodata = String(q.aspectId || '').includes('sb8q8qy') || q.questionType === 'biodata' || q.biodataKey
    if (isBiodata && q.includedInTotal === true && Number(q.maximumScore) > 0) biodataScored++
  })
})
biodataScored === 0 ? pass('biodata tidak dinilai', '0 pelanggaran') : fail('biodata tidak dinilai', `${biodataScored} pertanyaan biodata masih dinilai`)

// ---------- 4. Relasi form ----------
const formIds = new Set(forms.map((f) => f.id))
const orphanForm = responses.filter((r) => r.formId && !formIds.has(r.formId)).length
orphanForm === 0 ? pass('tidak ada orphan formId', '0 orphan') : fail('tidak ada orphan formId', `${orphanForm} orphan`)

// ---------- 5. Struktur versioning ----------
let formsWithoutVersion = 0
for (const f of forms) {
  const sub = await db.collection('forms').doc(f.id).collection('versions').get()
  if (sub.size === 0 || !f.activeVersionId) formsWithoutVersion++
}
formsWithoutVersion === 0
  ? pass('setiap form punya versi aktif', `${forms.length} form`)
  : fail('setiap form punya versi aktif', `${formsWithoutVersion} form tanpa versi`)

// ---------- 6. Koleksi lama tidak aktif ----------
const legacyForms = await db.collection('v1_5_forms').get()
legacyForms.size === 0 ? pass('koleksi v1_5_forms kosong', '0 dokumen') : fail('koleksi v1_5_forms kosong', `${legacyForms.size} dokumen`)

const groups = await db.collection('formGroups').get()
groups.size === 0 ? pass('koleksi formGroups kosong', '0 dokumen') : fail('koleksi formGroups kosong', `${groups.size} dokumen`)

// ---------- 7. Distribusi ----------
const distNoOwner = dists.filter((d) => !d.ownerId).length
distNoOwner === 0 ? pass('distribusi punya ownerId', `${dists.length} distribusi`) : fail('distribusi punya ownerId', `${distNoOwner} kosong`)

// ---------- Laporan ----------
console.log(`\n=== PEMERIKSAAN INVARIAN (${USE_EMULATOR ? 'EMULATOR' : 'PRODUKSI'}) ===\n`)
console.log(`Data: ${responses.length} response, ${forms.length} form, ${dists.length} distribusi\n`)
checks.forEach((c) => console.log(`  ${c.ok ? '✅' : '❌'} ${c.name.padEnd(42)} ${c.detail}`))

const failed = checks.filter((c) => !c.ok)
console.log(`\nHASIL: ${checks.length - failed.length} LULUS / ${failed.length} GAGAL`)
if (failed.length) {
  console.log('\nPelanggaran:')
  failed.forEach((f) => console.log(`  ❌ ${f.name}: ${f.detail}`))
}
process.exit(failed.length ? 1 : 0)
