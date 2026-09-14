// VERIFIKASI PRODUKSI pasca-migrasi (read-only, tidak menulis)
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

console.log('=== VERIFIKASI PRODUKSI (pasca-migrasi) ===\n')
for (const c of ['users','partnerships','forms','v1_5_forms','form_versions','formGroups','distributions','responses','articles','form_access','form_registry']) {
  const s = await db.collection(c).get()
  console.log(String(s.size).padStart(4), c)
}

// verifikasi responses breakdown
const resp = await db.collection('responses').get()
const byCode = {}
let withResult = 0
for (const d of resp.docs) {
  const r = d.data()
  const code = r.formCode || r.distributionCode || '(none)'
  byCode[code] = (byCode[code] || 0) + 1
  if (r.result?.aspects?.length) withResult++
}
console.log('\n=== responses breakdown ===')
for (const [c, n] of Object.entries(byCode).sort()) console.log(String(n).padStart(4), c)
console.log('\npunya result.aspects:', withResult, '/', resp.size)

// verifikasi forms
const forms = await db.collection('forms').get()
console.log('\n=== forms ===')
for (const d of forms.docs) {
  const f = d.data()
  console.log(`- ${d.id}: ${f.metadata?.title || f.title} (${(f.questions?.length||0)} soal)`)
}

console.log('\n✅ VERIFIKASI SELESAI')
process.exit(0)
