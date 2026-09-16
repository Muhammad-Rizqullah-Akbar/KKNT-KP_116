/**
 * DL-005 — Migrasi struktur versioning form.
 *
 * MASALAH: produksi menyimpan versi di koleksi top-level `form_versions`
 * (4 dokumen), sedangkan kode + rules mengharapkan subcollection
 * `forms/{formId}/versions/{versionId}`.
 *
 * TINDAKAN:
 *   1. Baca semua dokumen `forms/{formId}`.
 *   2. Baca semua dokumen `form_versions` (top-level).
 *   3. Untuk tiap form: pastikan ada snapshot di forms/{formId}/versions/{formId}_v1.
 *   4. Isi `activeVersionId` + `activeVersionNumber` + `status` pada form.
 *
 * Tidak menghapus data lama (aman). Verifikasi 0 form tanpa versi.
 *
 * Usage:
 *   FIRESTORE_EMULATOR_HOST=localhost:8090 node scripts/migration/migrate-form-versions.mjs
 *   FIRESTORE_EMULATOR_HOST=localhost:8090 node scripts/migration/migrate-form-versions.mjs --apply
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

// ---- 1. Baca keadaan sekarang ----
const formsSnap = await db.collection('forms').get()
const legacySnap = await db.collection('form_versions').get()

console.log(`forms               : ${formsSnap.size}`)
console.log(`form_versions (top) : ${legacySnap.size}`)

// peta versi lama: formId -> versi
const legacyByForm = {}
legacySnap.forEach((d) => {
  const v = { versionId: d.id, ...d.data() }
  const fid = v.formId || String(d.id).split('_')[0]
  if (fid) legacyByForm[fid] = v
})

// ---- 2. Rencana ----
const plan = []
let needSubcollection = 0
let needActiveRef = 0

for (const fd of formsSnap.docs) {
  const form = fd.data()
  const fid = fd.id
  const subSnap = await db.collection('forms').doc(fid).collection('versions').get()
  const legacy = legacyByForm[fid]

  const versionNumber = form.activeVersionNumber || legacy?.versionNumber || 1
  const versionId = form.activeVersionId || `${fid}_v${versionNumber}`

  if (subSnap.size === 0) needSubcollection++
  if (!form.activeVersionId || !form.activeVersionNumber) needActiveRef++

  plan.push({ fid, title: form.metadata?.title || form.title || '-', subCount: subSnap.size, versionId, versionNumber, hasLegacy: !!legacy })
}

console.log('\n=== RENCANA ===')
console.log(`Form butuh snapshot subcollection : ${needSubcollection}`)
console.log(`Form butuh activeVersionId ref    : ${needActiveRef}`)
plan.forEach((p) => console.log(`  ${p.fid} | sub=${p.subCount} | v=${p.versionId} | ${p.title.slice(0, 40)}`))

if (!APPLY) { console.log('\n(DRY-RUN) tambahkan --apply untuk menulis.'); process.exit(0) }

// ---- 3. Tulis ----
console.log('\nMenulis...')
let written = 0
for (const p of plan) {
  const formRef = db.collection('forms').doc(p.fid)
  const formSnap = await formRef.get()
  const form = formSnap.data() || {}

  const subSnap = await formRef.collection('versions').get()
  if (subSnap.size === 0) {
    // Buat snapshot dari aggregate + data versi lama bila ada
    const legacy = legacyByForm[p.fid] || {}
    const snapshot = {
      versionId: p.versionId,
      formId: p.fid,
      versionNumber: p.versionNumber,
      status: form.status === 'draft' ? 'draft' : 'published',
      metadata: form.metadata || legacy.metadata || { title: 'Formulir' },
      aspects: form.aspects || legacy.aspects || [],
      questions: form.questions || legacy.questions || [],
      scoring: form.scoring || legacy.scoring || {},
      validation: form.validation || legacy.validation || {},
      thresholds: form.thresholds || legacy.thresholds || [],
      recommendations: form.recommendations || legacy.recommendations || {},
      distribution: form.distribution || legacy.distribution || {},
      createdAt: form.createdAt || legacy.createdAt || new Date().toISOString(),
      createdBy: form.createdBy || legacy.createdBy || 'migration',
    }
    if (form.publishedAt || legacy.publishedAt) {
      snapshot.publishedAt = form.publishedAt || legacy.publishedAt
    }
    if (form.publishedBy || legacy.publishedBy) {
      snapshot.publishedBy = form.publishedBy || legacy.publishedBy
    }
    await formRef.collection('versions').doc(p.versionId).set(snapshot, { merge: true })
    written++
  }

  // Update aggregate: activeVersionId + activeVersionNumber + metadata.status
  const patch = {
    activeVersionId: p.versionId,
    activeVersionNumber: p.versionNumber,
    'metadata.status': form.status === 'draft' ? 'draft' : 'published',
  }
  await formRef.set(patch, { merge: true })
}

console.log(`✅ ${written} snapshot subcollection dibuat, ${plan.length} form diperbarui.`)

// ---- 4. Verifikasi ----
console.log('\n=== VERIFIKASI ===')
for (const fd of (await db.collection('forms').get()).docs) {
  const sub = await db.collection('forms').doc(fd.id).collection('versions').get()
  const f = fd.data()
  console.log(`  ${fd.id} | versions=${sub.size} | activeVersionId=${f.activeVersionId || 'KOSONG'} | vNum=${f.activeVersionNumber || 'KOSONG'}`)
}
process.exit(0)
