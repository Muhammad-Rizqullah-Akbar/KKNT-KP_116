// Read-only: list production users (no writes)
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

const snap = await db.collection('users').get()
console.log('TOTAL USERS:', snap.size)
for (const d of snap.docs) {
  const u = d.data()
  console.log(
    '-',
    (u.role || '?').padEnd(14),
    '|',
    (u.email || '(no email)').padEnd(32),
    '|',
    (u.displayName || u.name || '').slice(0, 28)
  )
}
process.exit(0)
