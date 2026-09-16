/**
 * Verifikasi mendalam: apakah dokumen benar-benar tertulis ke produksi?
 * Memeriksa (1) dokumen probe, (2) jumlah dokumen per koleksi.
 */
import fs from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const env = {}
for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const t = line.trim(); if (!t || t.startsWith('#')) continue
  const i = t.indexOf('='); if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"|"$/g, '')
}
const app = initializeApp({
  credential: cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
})
const db = getFirestore(app)

const COLLECTIONS = ['settings', 'form_registry', 'article_categories', 'responses', 'users', 'articles', 'partnerships', 'distributions', 'forms']

console.log('=== JUMLAH DOKUMEN PRODUKSI SEKARANG ===')
for (const col of COLLECTIONS) {
  const snap = await db.collection(col).get()
  console.log(`  ${col.padEnd(20)} ${snap.size}`)
}

console.log('\n=== CARI DOKUMEN PROBE (id berawalan "probe_") ===')
let probes = 0
for (const col of COLLECTIONS) {
  const snap = await db.collection(col).get()
  for (const d of snap.docs) {
    if (String(d.id).startsWith('probe_')) {
      console.log(`  DITEMUKAN: ${col}/${d.id} -> ${JSON.stringify(d.data()).slice(0, 120)}`)
      probes++
    }
  }
}
console.log(probes === 0 ? '  ✅ Tidak ada dokumen probe di produksi' : `  ⚠️  ${probes} dokumen probe ditemukan`)

console.log('\n=== CEK users BARU (role super_admin tanpa email/waktu baru) ===')
const users = await db.collection('users').get()
for (const d of users.docs) {
  const u = d.data()
  if (!u.email) console.log(`  ⚠️  users/${d.id}: ${JSON.stringify(u).slice(0, 150)}`)
}
console.log(`  total users: ${users.size}`)

process.exit(0)
