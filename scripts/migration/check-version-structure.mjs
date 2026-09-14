// Cek struktur form_versions: top-level collection vs subcollection
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
  credential: cert({ projectId: env.FIREBASE_PROJECT_ID, clientEmail: env.FIREBASE_CLIENT_EMAIL, privateKey }),
})
const db = getFirestore(app)

console.log('=== form_versions (top-level) ===')
const fv = await db.collection('form_versions').get()
console.log('count:', fv.size)
for (const d of fv.docs) {
  console.log(' -', d.id, JSON.stringify({ formId: d.data().formId, versionNumber: d.data().versionNumber }))
}

console.log('\n=== forms subcollection versions ===')
const forms = await db.collection('forms').get()
for (const f of forms.docs) {
  const sub = await db.collection('forms').doc(f.id).collection('versions').get()
  console.log(` - forms/${f.id}/versions: ${sub.size} docs`)
}

console.log('\n=== forms fields (cek activeVersionId) ===')
for (const f of forms.docs) {
  const d = f.data()
  console.log(' -', f.id, '| activeVersionId:', d.activeVersionId)
}
process.exit(0)
