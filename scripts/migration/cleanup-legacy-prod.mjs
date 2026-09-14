// Bersihkan koleksi legacy produksi (v1_5_forms, formGroups) pasca-migrasi.
// Read-only verifikasi dulu, lalu delete. Backup sudah ada di data/export/.
import fs from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const env = {}
for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"|"$/g, '')
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

const LEGACY = ['v1_5_forms', 'formGroups']

console.log('=== HAPUS KOLEKSI LEGACY ===\n')
for (const col of LEGACY) {
  const snap = await db.collection(col).get()
  console.log(`${col}: ${snap.size} docs → hapus`)
  for (const d of snap.docs) await d.ref.delete()
}

console.log('\n=== VERIFIKASI ===')
for (const col of LEGACY) {
  const s = await db.collection(col).get()
  console.log(`${col}: ${s.size} docs (harus 0)`)
}
console.log('\n✅ LEGACY DIBERSIHKAN')
process.exit(0)
