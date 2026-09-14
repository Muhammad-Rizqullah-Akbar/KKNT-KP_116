// Read-only: export SEMUA koleksi produksi ke data/export/<timestamp>/
// TIDAK menulis apa pun ke Firestore. Hanya membaca (read-only snapshot).
// Dipakai sebagai backup segar sebelum migrasi produksi.
//
// Usage: node scripts/migration/export-prod.mjs
import fs from 'fs'
import path from 'path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Load .env (kredensial produksi, TIDAK ter-commit)
const env = {}
for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"|"$/g, '')
}

if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
  console.error('❌ .env tidak lengkap. Butuh FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY')
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

const COLLECTIONS = [
  'users',
  'partnerships',
  'forms',
  'v1_5_forms',
  'form_versions',
  'formGroups',
  'distributions',
  'responses',
  'articles',
  'article_categories',
  'form_access',
  'form_registry',
  'form_registry_metadata',
  'settings',
  'view_logs',
]

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const outDir = path.join('data', 'export', timestamp)
fs.mkdirSync(outDir, { recursive: true })

console.log(`📦 Export produksi → ${outDir}\n`)

let totalDocs = 0
for (const col of COLLECTIONS) {
  try {
    const snap = await db.collection(col).get()
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    const file = path.join(outDir, `${col}.json`)
    fs.writeFileSync(file, JSON.stringify(docs, null, 2))
    totalDocs += docs.length
    console.log(`  ✓ ${col.padEnd(28)} ${String(docs.length).padStart(4)} docs`)
  } catch (e) {
    console.log(`  ✗ ${col.padEnd(28)} ERROR: ${e.message}`)
  }
}

console.log(`\n✅ Selesai. Total ${totalDocs} dokumen → ${outDir}`)
process.exit(0)
