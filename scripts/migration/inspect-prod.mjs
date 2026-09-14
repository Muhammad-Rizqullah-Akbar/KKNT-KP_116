// Read-only: inspect production Firestore structure (no writes)
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

const app = initializeApp({
  credential: cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
})
const db = getFirestore(app)

// List all top-level collections and doc counts
const collections = await db.listCollections()
console.log('=== TOP-LEVEL COLLECTIONS DI PRODUKSI ===')
for (const col of collections) {
  const snap = await col.get()
  console.log(`  ${col.id.padEnd(28)} : ${snap.size} doc`)
}

// Check key collections detail
console.log('\n=== users (role breakdown) ===')
const users = await db.collection('users').get()
const roleCount = {}
for (const d of users.docs) {
  const r = d.data().role || '(none)'
  roleCount[r] = (roleCount[r] || 0) + 1
}
for (const [r, c] of Object.entries(roleCount)) console.log(`  ${r.padEnd(16)} : ${c}`)

console.log('\n=== responses count (koleksi utama) ===')
const resp = await db.collection('responses').get()
console.log('  responses :', resp.size)

console.log('\n=== forms count ===')
const forms = await db.collection('forms').get()
console.log('  forms :', forms.size)

process.exit(0)
