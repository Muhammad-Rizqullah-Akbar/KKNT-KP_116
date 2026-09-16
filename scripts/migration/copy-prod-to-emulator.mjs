/**
 * Salin data relasi (form_versions + forms) dari PRODUKSI ke EMULATOR
 * agar pengujian migrasi realistis.
 */
import fs from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8090'

const env = {}
for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const t = line.trim(); if (!t || t.startsWith('#')) continue
  const i = t.indexOf('='); if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"|"$/g, '')
}

const prodApp = initializeApp({
  credential: cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
}, 'prod')
const prodDb = getFirestore(prodApp)

const emuApp = initializeApp({ projectId: 'desa-sehat-2026' }, 'emu')
const emuDb = getFirestore(emuApp)
emuDb.settings({ host: 'localhost:8090', ssl: false, ignoreUndefinedProperties: true })

const COLLECTIONS = ['form_versions', 'forms']

for (const col of COLLECTIONS) {
  const snap = await prodDb.collection(col).get()
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  for (let i = 0; i < docs.length; i += 400) {
    const b = emuDb.batch()
    for (const doc of docs.slice(i, i + 400)) {
      const { id, ...rest } = doc
      b.set(emuDb.collection(col).doc(id), rest)
    }
    await b.commit()
  }
  console.log(`  ${col}: ${docs.length} dokumen disalin ke emulator`)
}

console.log('✅ Selesai')
process.exit(0)
