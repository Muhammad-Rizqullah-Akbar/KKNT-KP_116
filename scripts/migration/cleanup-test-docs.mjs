/**
 * CEK & BERSIHKAN dokumen uji yang mungkin terbuat di produksi.
 * Dokumen uji ditandai dengan field `hacker_test`.
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

const COLLECTIONS = ['settings', 'form_registry', 'article_categories', 'responses', 'users', 'articles']
let found = 0
const toDelete = []

for (const col of COLLECTIONS) {
  const snap = await db.collection(col).get()
  for (const d of snap.docs) {
    const data = d.data()
    if (data && (data.hacker_test !== undefined || data.role === 'super_admin' && !data.email)) {
      const flag = data.hacker_test !== undefined ? 'hacker_test' : 'role tanpa email'
      console.log(`  DITEMUKAN di ${col}/${d.id} (${flag})`)
      found++
      toDelete.push({ ref: d.ref, path: `${col}/${d.id}` })
    }
  }
}

console.log(`\nTotal dokumen uji ditemukan: ${found}`)

if (found === 0) {
  console.log('✅ Tidak ada dokumen uji — produksi bersih.')
  process.exit(0)
}

console.log('\nMenghapus...')
for (const item of toDelete) {
  await item.ref.delete()
  console.log(`  dihapus: ${item.path}`)
}
console.log(`\n✅ ${toDelete.length} dokumen uji dihapus.`)
process.exit(0)
