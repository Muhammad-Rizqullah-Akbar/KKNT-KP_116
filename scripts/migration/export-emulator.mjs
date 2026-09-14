// Export SEMUA koleksi emulator → data/emulator-export/ (snapshot target)
// Read-only terhadap emulator. Produksi TIDAK disentuh.
import fs from 'fs'
import path from 'path'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const db = getFirestore(initializeApp({ projectId: 'desa-sehat-2026' }))
db.settings({ host: 'localhost:8090', ssl: false })

const COLLECTIONS = [
  'users', 'partnerships', 'forms', 'form_versions', 'distributions',
  'responses', 'articles', 'article_categories', 'form_access',
  'form_registry', 'form_registry_metadata', 'settings', 'view_logs',
]

const outDir = path.join('data', 'emulator-export')
fs.mkdirSync(outDir, { recursive: true })

console.log('📦 Export emulator (target) →', outDir, '\n')

let totalDocs = 0
const counts = {}
for (const col of COLLECTIONS) {
  const snap = await db.collection(col).get()
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  fs.writeFileSync(path.join(outDir, `${col}.json`), JSON.stringify(docs, null, 2))
  counts[col] = docs.length
  totalDocs += docs.length
  console.log(`  ✓ ${col.padEnd(26)} ${String(docs.length).padStart(4)} docs`)
}

console.log(`\n✅ Total ${totalDocs} dokumen`)

// Verifikasi target: responses harus 130 (40 SMP pre + 40 post + 25 SMA pre + 25 post)
const responses = JSON.parse(fs.readFileSync(path.join(outDir, 'responses.json'), 'utf8'))
console.log(`\n=== VERIFIKASI TARGET ===`)
console.log(`responses: ${responses.length} (target 130)`)

// hitung per formCode
const byCode = {}
for (const r of responses) {
  const c = r.formCode || r.distributionCode || '(none)'
  byCode[c] = (byCode[c] || 0) + 1
}
for (const [c, n] of Object.entries(byCode)) console.log(`  ${String(n).padStart(4)} ${c}`)

process.exit(0)
