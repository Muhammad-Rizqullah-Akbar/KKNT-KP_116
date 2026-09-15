// Memicu error Firestore untuk SETIAP query yang butuh composite index,
// lalu menangkap link "create index" yang digenerate Firestore sendiri.
import fs from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const env = {}
for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const t = line.trim(); if (!t || t.startsWith('#')) continue
  const i = t.indexOf('='); if (i > 0) env[t.slice(0,i).trim()] = t.slice(i+1).trim().replace(/^"|"$/g,'')
}
const app = initializeApp({credential: cert({projectId:env.FIREBASE_PROJECT_ID,clientEmail:env.FIREBASE_CLIENT_EMAIL,privateKey:env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,'\n')})})
const db = getFirestore(app)

const QUERIES = [
  ['responses: formId + submittedAt (DESC)',
   () => db.collection('responses').where('formId','==','3F0Gp3cxlmXpp0uk7blI').orderBy('submittedAt','desc').limit(1).get()],
  ['responses: formId + submittedAt (ASC)',
   () => db.collection('responses').where('formId','==','3F0Gp3cxlmXpp0uk7blI').orderBy('submittedAt','asc').limit(1).get()],
  ['responses: ownerId + submittedAt (DESC)',
   () => db.collection('responses').where('ownerId','==','x').orderBy('submittedAt','desc').limit(1).get()],
  ['responses: ownerId + submittedAt (ASC)',
   () => db.collection('responses').where('ownerId','==','x').orderBy('submittedAt','asc').limit(1).get()],
  ['responses: partnershipId + submittedAt (ASC)',
   () => db.collection('responses').where('partnershipId','==','x').orderBy('submittedAt','asc').limit(1).get()],
  ['responses: distributionId + submittedAt (DESC)',
   () => db.collection('responses').where('distributionId','==','x').orderBy('submittedAt','desc').limit(1).get()],
  ['responses: formId + status + submittedAt (DESC)',
   () => db.collection('responses').where('formId','==','3F0Gp3cxlmXpp0uk7blI').where('status','==','submitted').orderBy('submittedAt','desc').limit(1).get()],
  ['distributions: formId + status',
   () => db.collection('distributions').where('formId','==','3F0Gp3cxlmXpp0uk7blI').where('status','==','active').limit(1).get()],
  ['distributions: ownerId + createdAt (DESC)',
   () => db.collection('distributions').where('ownerId','==','x').orderBy('createdAt','desc').limit(1).get()],
  ['distributions: partnershipId + createdAt (DESC)',
   () => db.collection('distributions').where('partnershipId','==','x').orderBy('createdAt','desc').limit(1).get()],
  ['articles: status + createdAt (DESC)',
   () => db.collection('articles').where('status','in',['Published','published']).orderBy('createdAt','desc').limit(1).get()],
]

const out = []
for (const [name, fn] of QUERIES) {
  try {
    await fn()
    out.push({ name, status: 'OK (tidak butuh index)' })
  } catch (e) {
    const msg = String(e.message || '')
    const m = msg.match(/https:\/\/console\.firebase\.google\.com\/\S+/)
    if (m) out.push({ name, status: 'BUTUH INDEX', link: m[0] })
    else out.push({ name, status: 'ERROR LAIN', msg: msg.split('\n')[0].slice(0, 120) })
  }
}

console.log('========== LINK COMPOSITE INDEX ==========\n')
let no = 0
for (const r of out) {
  if (r.status === 'BUTUH INDEX') {
    no++
    console.log(`[${no}] ${r.name}`)
    console.log(`${r.link}\n`)
  } else if (r.status.startsWith('OK')) {
    console.log(`[--] ${r.name}  ->  ${r.status}\n`)
  } else {
    console.log(`[!!] ${r.name}  ->  ${r.status}: ${r.msg}\n`)
  }
}
process.exit(0)
