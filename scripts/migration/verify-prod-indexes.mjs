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
const queries = [
  ['responses formId+status', () => db.collection('responses').where('formId','==','3F0Gp3cxlmXpp0uk7blI').where('status','==','submitted').get()],
  ['responses formId+submittedAt', () => db.collection('responses').where('formId','==','3F0Gp3cxlmXpp0uk7blI').orderBy('submittedAt','desc').limit(25).get()],
  ['responses ownerId+submittedAt', () => db.collection('responses').where('ownerId','==','none').orderBy('submittedAt','desc').limit(25).get()],
  ['distributions formId+status', () => db.collection('distributions').where('formId','==','3F0Gp3cxlmXpp0uk7blI').where('status','==','active').get()],
]
for (const [name, fn] of queries) {
  try { const s=await fn(); console.log('PASS', name, 'docs=', s.size) }
  catch(e) { console.log('FAIL', name, e.message) }
}
process.exit(0)
