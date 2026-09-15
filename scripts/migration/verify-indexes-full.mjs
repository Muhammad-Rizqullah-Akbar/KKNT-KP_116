// Verifikasi lengkap: index terpasang + semua query produksi nyata
import fs from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const env = {}
for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const t = line.trim(); if (!t || t.startsWith('#')) continue
  const i = t.indexOf('='); if (i > 0) env[t.slice(0,i).trim()] = t.slice(i+1).trim().replace(/^"|"$/g,'')
}
const PROJECT = env.FIREBASE_PROJECT_ID
const app = initializeApp({credential: cert({projectId:PROJECT,clientEmail:env.FIREBASE_CLIENT_EMAIL,privateKey:env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,'\n')})})
const db = getFirestore(app)

// ---- 1. Gunakan access token dari metadata server? Tidak. Pakai REST via admin SDK credential.
import crypto from 'crypto'
const b64url = (b) => Buffer.from(b).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
function jwt() {
  const now = Math.floor(Date.now()/1000)
  const h = { alg:'RS256', typ:'JWT' }
  const c = { iss: env.FIREBASE_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now+3600 }
  const si = `${b64url(JSON.stringify(h))}.${b64url(JSON.stringify(c))}`
  const s = crypto.createSign('RSA-SHA256'); s.update(si)
  return `${si}.${b64url(s.sign(env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,'\n')))}`
}
const tr = await fetch('https://oauth2.googleapis.com/token', {
  method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
  body: new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt()})
})
const { access_token } = await tr.json()

const listRes = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/collectionGroups/-/indexes`, { headers: { Authorization: `Bearer ${access_token}` } })
const lj = await listRes.json()
const idx = (lj.indexes || []).map((ix) => ({
  cg: ix.name.split('/collectionGroups/')[1].split('/')[0],
  state: ix.state,
  fields: ix.fields.filter(f => f.fieldPath !== '__name__').map(f => `${f.fieldPath} ${f.order || f.arrayConfig}`).join(' + '),
}))
console.log(`=== INDEX TERPASANG DI ${PROJECT} (${idx.length}) ===`)
idx.forEach((e, i) => console.log(`  ${i+1}. [${e.state}] ${e.cg}: ${e.fields}`))

// ---- 2. Uji semua query yang dipakai kode produksi
console.log('\n=== UJI QUERY PRODUKSI ===')
const FID = '3F0Gp3cxlmXpp0uk7blI'
const Q = [
  ['responses formId+status', () => db.collection('responses').where('formId','==',FID).where('status','==','submitted').limit(25).get()],
  ['responses formId+submittedAt desc', () => db.collection('responses').where('formId','==',FID).orderBy('submittedAt','desc').limit(25).get()],
  ['responses formId+submittedAt asc', () => db.collection('responses').where('formId','==',FID).orderBy('submittedAt','asc').limit(25).get()],
  ['responses ownerId+submittedAt desc', () => db.collection('responses').where('ownerId','==','x').orderBy('submittedAt','desc').limit(25).get()],
  ['responses ownerId+submittedAt asc', () => db.collection('responses').where('ownerId','==','x').orderBy('submittedAt','asc').limit(25).get()],
  ['responses partnershipId+submittedAt asc', () => db.collection('responses').where('partnershipId','==','x').orderBy('submittedAt','asc').limit(25).get()],
  ['responses distributionId+submittedAt desc', () => db.collection('responses').where('distributionId','==','FRM-Z1LU').orderBy('submittedAt','desc').limit(25).get()],
  ['responses formId+status+submittedAt desc', () => db.collection('responses').where('formId','==',FID).where('status','==','submitted').orderBy('submittedAt','desc').limit(25).get()],
  ['responses status+submittedAt desc', () => db.collection('responses').where('status','==','submitted').orderBy('submittedAt','desc').limit(25).get()],
  ['distributions formId+status', () => db.collection('distributions').where('formId','==',FID).where('status','==','active').limit(25).get()],
  ['distributions ownerId+createdAt desc', () => db.collection('distributions').where('ownerId','==','x').orderBy('createdAt','desc').limit(25).get()],
  ['distributions partnershipId+createdAt desc', () => db.collection('distributions').where('partnershipId','==','x').orderBy('createdAt','desc').limit(25).get()],
  ['articles status+createdAt desc', () => db.collection('articles').where('status','in',['Published','published']).orderBy('createdAt','desc').limit(25).get()],
  ['responses count total', () => db.collection('responses').count().get()],
  ['responses count by form', () => db.collection('responses').where('formId','==',FID).count().get()],
]
let pass = 0, fail = 0
for (const [n, fn] of Q) {
  try { const s = await fn(); const v = typeof s.data === 'function' ? s.data().count : s.size; console.log(`  ✅ ${n} -> ${v}`); pass++ }
  catch (e) { console.log(`  ❌ ${n} -> ${String(e.message).split('\n')[0].slice(0,80)}`); fail++ }
}
console.log(`\nHASIL: ${pass} PASS / ${fail} FAIL`)
process.exit(0)
