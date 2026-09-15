// Membuat composite index Firestore via Admin REST API langsung (bukan CLI).
// CLI `firebase deploy --only firestore:indexes` melaporkan sukses tetapi index
// tidak benar-benar terbuat untuk project desa-sehat-2026.
import fs from 'fs'
import crypto from 'crypto'

const env = {}
for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const t = line.trim(); if (!t || t.startsWith('#')) continue
  const i = t.indexOf('='); if (i > 0) env[t.slice(0,i).trim()] = t.slice(i+1).trim().replace(/^"|"$/g,'')
}
const projectId = env.FIREBASE_PROJECT_ID
const clientEmail = env.FIREBASE_CLIENT_EMAIL
const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')

function makeJwt() {
  const now = Math.floor(Date.now()/1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claim = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(signingInput)
  return `${signingInput}.${b64url(sign.sign(privateKey))}`
}

const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: makeJwt() }),
})
if (!tokenRes.ok) { console.error('TOKEN FAIL', await tokenRes.text()); process.exit(1) }
const { access_token } = await tokenRes.json()
console.log('✅ OAuth token OK')

const BASE = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/collectionGroups`

// Index yang DIBUTUHKAN berdasarkan query aktual (where + orderBy field berbeda).
const WANTED = [
  { collectionGroup: 'responses', fields: [
    { fieldPath: 'formId', order: 'ASCENDING' },
    { fieldPath: 'submittedAt', order: 'DESCENDING' },
  ]},
  { collectionGroup: 'responses', fields: [
    { fieldPath: 'formId', order: 'ASCENDING' },
    { fieldPath: 'submittedAt', order: 'ASCENDING' },
  ]},
  { collectionGroup: 'responses', fields: [
    { fieldPath: 'ownerId', order: 'ASCENDING' },
    { fieldPath: 'submittedAt', order: 'DESCENDING' },
  ]},
  { collectionGroup: 'responses', fields: [
    { fieldPath: 'ownerId', order: 'ASCENDING' },
    { fieldPath: 'submittedAt', order: 'ASCENDING' },
  ]},
  { collectionGroup: 'responses', fields: [
    { fieldPath: 'partnershipId', order: 'ASCENDING' },
    { fieldPath: 'submittedAt', order: 'ASCENDING' },
  ]},
  { collectionGroup: 'responses', fields: [
    { fieldPath: 'distributionId', order: 'ASCENDING' },
    { fieldPath: 'submittedAt', order: 'DESCENDING' },
  ]},
  { collectionGroup: 'responses', fields: [
    { fieldPath: 'formId', order: 'ASCENDING' },
    { fieldPath: 'status', order: 'ASCENDING' },
    { fieldPath: 'submittedAt', order: 'DESCENDING' },
  ]},
  { collectionGroup: 'distributions', fields: [
    { fieldPath: 'formId', order: 'ASCENDING' },
    { fieldPath: 'status', order: 'ASCENDING' },
  ]},
]

// 1. Baca index yang SUDAH ada
const listRes = await fetch(`${BASE}/-/indexes`, { headers: { Authorization: `Bearer ${access_token}` } })
const listJson = await listRes.json()
const existing = (listJson.indexes || []).map((ix) => ({
  cg: ix.name.split('/collectionGroups/')[1].split('/')[0],
  fields: ix.fields.filter((f) => f.fieldPath !== '__name__').map((f) => `${f.fieldPath}:${f.order || f.arrayConfig}`).join(','),
  state: ix.state,
}))
console.log(`\n=== INDEX AKTIF DI PRODUKSI (${existing.length}) ===`)
existing.forEach((e) => console.log(`  [${e.state}] ${e.cg} :: ${e.fields}`))

// 2. Buat yang belum ada
console.log('\n=== MEMBUAT INDEX YANG HILANG ===')
for (const want of WANTED) {
  const key = want.fields.map((f) => `${f.fieldPath}:${f.order}`).join(',')
  const already = existing.find((e) => e.cg === want.collectionGroup && e.fields === key)
  if (already) { console.log(`  SKIP (ada: ${already.state}) ${want.collectionGroup} :: ${key}`); continue }

  const res = await fetch(`${BASE}/${want.collectionGroup}/indexes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ queryScope: 'COLLECTION', fields: want.fields }),
  })
  const body = await res.text()
  if (res.ok || res.status === 409) {
    console.log(`  ✅ DIBUAT ${want.collectionGroup} :: ${key}`)
  } else if (res.status === 400 && body.includes('not necessary')) {
    console.log(`  ⚠️  TIDAK PERLU ${want.collectionGroup} :: ${key}`)
  } else {
    console.log(`  ❌ GAGAL (${res.status}) ${want.collectionGroup} :: ${key}\n     ${body.slice(0,300)}`)
  }
}
console.log('\nSelesai. Index butuh waktu backfill (biasanya beberapa menit).')
process.exit(0)
