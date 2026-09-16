/**
 * Periksa isi database bernama `default` (asia-southeast2) dan
 * bandingkan dengan `(default)` (us-central1).
 */
import fs from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const env = {}
for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const t = line.trim(); if (!t || t.startsWith('#')) continue
  const i = t.indexOf('='); if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"|"$/g, '')
}
const cred = cert({
  projectId: env.FIREBASE_PROJECT_ID,
  clientEmail: env.FIREBASE_CLIENT_EMAIL,
  privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
})

const COLLECTIONS = ['users', 'responses', 'forms', 'distributions', 'partnerships', 'articles', 'settings']

for (const dbId of ['(default)', 'default']) {
  console.log(`\n========== DATABASE: ${dbId} ==========`)
  try {
    const app = initializeApp({ credential: cred }, `app_${dbId}`)
    const db = getFirestore(app, dbId)
    let total = 0
    for (const col of COLLECTIONS) {
      const snap = await db.collection(col).get()
      total += snap.size
      console.log(`  ${col.padEnd(16)} ${snap.size}`)
    }
    console.log(`  TOTAL dokumen: ${total}`)
  } catch (e) {
    console.log(`  GAGAL: ${String(e.message).slice(0, 200)}`)
  }
}
process.exit(0)
