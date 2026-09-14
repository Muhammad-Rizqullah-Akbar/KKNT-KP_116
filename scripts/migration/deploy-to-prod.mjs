// MIGRASI PRODUKSI — deploy data emulator (target) → Firestore produksi.
//
// ⚠️ DESTRUKTIF: menimpa koleksi produksi dengan data emulator.
// Sebelum jalan, WAJIB:
//   1. Backup produksi (sudah ada: data/export/2026-09-14T22-46-06/)
//   2. Verifikasi data emulator (sudah: data/emulator-export/)
//   3. Konfirmasi eksplisit user.
//
// Safety: script ini REFUSE jalan kalau tidak ada flag --yes + --backup-verified.
//
// Usage:
//   node scripts/migration/deploy-to-prod.mjs --yes --backup-verified
//
// (TIDAK membaca .env untuk kredensial; pakai firebase-admin cert dari .env)

import fs from 'fs'
import path from 'path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

// ---- Gate argumen ----
const args = process.argv.slice(2)
const yes = args.includes('--yes')
const backupVerified = args.includes('--backup-verified')
if (!yes || !backupVerified) {
  console.error('❌ REFUSE. Jalankan dengan: node scripts/migration/deploy-to-prod.mjs --yes --backup-verified')
  console.error('   --yes              : konfirmasi destruktif')
  console.error('   --backup-verified  : backup produksi sudah dicek')
  process.exit(1)
}

// ---- Load .env (kredensial produksi) ----
const env = {}
for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"|"$/g, '')
}
if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
  console.error('❌ .env tidak lengkap')
  process.exit(1)
}
const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')

const app = initializeApp({
  credential: cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  }),
})
const db = getFirestore(app)

const SRC = path.join('data', 'emulator-export')
const COLLECTIONS = [
  'users', 'partnerships', 'forms', 'form_versions', 'distributions',
  'responses', 'articles', 'article_categories', 'form_access',
  'form_registry', 'form_registry_metadata', 'settings', 'view_logs',
]

// ---- Filter: buang response testing (distributionCode/formCode KKPD5X9) ----
function isTestingResponse(r) {
  const code = r.formCode || r.distributionCode || ''
  // Hanya buang response testing E2E (kode KKPD5X9), bukan response valid
  // yang kebetulan id-nya resp_* tanpa formCode (punya distributionCode FRM-*).
  if (code === 'KKPD5X9') return true
  return false
}

console.log('🚨 MIGRASI PRODUKSI DIMULAI (destruktif) 🚨\n')

let totalWritten = 0
for (const col of COLLECTIONS) {
  const file = path.join(SRC, `${col}.json`)
  if (!fs.existsSync(file)) {
    console.log(`  - ${col.padEnd(26)} (skip, tidak ada file)` )
    continue
  }
  const docs = JSON.parse(fs.readFileSync(file, 'utf8'))

  // Filter testing response untuk koleksi responses
  let finalDocs = docs
  if (col === 'responses') {
    const before = docs.length
    finalDocs = docs.filter(r => !isTestingResponse(r))
    console.log(`  responses: ${before} → ${finalDocs.length} (buang testing)`)
  }

  // Clear koleksi lalu write ulang
  const snap = await db.collection(col).get()
  for (const d of snap.docs) await d.ref.delete()

  // Batch write
  const BATCH = 400
  for (let i = 0; i < finalDocs.length; i += BATCH) {
    const batch = db.batch()
    for (const doc of finalDocs.slice(i, i + BATCH)) {
      const { id, ...data } = doc
      const ref = db.collection(col).doc(id)
      batch.set(ref, data)
    }
    await batch.commit()
  }
  totalWritten += finalDocs.length
  console.log(`  ✓ ${col.padEnd(26)} ${String(finalDocs.length).padStart(4)} docs`)
}

console.log(`\n✅ MIGRASI SELESAI. Total ${totalWritten} dokumen ditulis ke produksi.`)
process.exit(0)
