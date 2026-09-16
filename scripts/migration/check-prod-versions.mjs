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

const fv = await db.collection('form_versions').get()
console.log('PRODUKSI form_versions:', fv.size)
fv.forEach((d) => {
  const x = d.data()
  console.log('  -', d.id, '| formId:', x.formId, '| vNum:', x.versionNumber, '| keys:', Object.keys(x).join(','))
})

const f = await db.collection('forms').get()
console.log('\nPRODUKSI forms:', f.size)
for (const d of f.docs) {
  const x = d.data()
  const sub = await db.collection('forms').doc(d.id).collection('versions').get()
  console.log(`  - ${d.id} | sub=${sub.size} | activeVersionId=${x.activeVersionId || 'KOSONG'} | status=${x.status || 'KOSONG'}`)
}
process.exit(0)
