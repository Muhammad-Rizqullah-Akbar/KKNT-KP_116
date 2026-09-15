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

const FID = '3F0Gp3cxlmXpp0uk7blI'
const tests = [
  ['A. where formId only', () => db.collection('responses').where('formId','==',FID).limit(5).get()],
  ['B. orderBy submittedAt desc only', () => db.collection('responses').orderBy('submittedAt','desc').limit(5).get()],
  ['C. where formId + orderBy submittedAt ASC', () => db.collection('responses').where('formId','==',FID).orderBy('submittedAt','asc').limit(5).get()],
  ['D. where formId + orderBy submittedAt DESC', () => db.collection('responses').where('formId','==',FID).orderBy('submittedAt','desc').limit(5).get()],
  ['E. where ownerId + orderBy submittedAt ASC', () => db.collection('responses').where('ownerId','==','x').orderBy('submittedAt','asc').limit(5).get()],
  ['F. where ownerId + orderBy submittedAt DESC', () => db.collection('responses').where('ownerId','==','x').orderBy('submittedAt','desc').limit(5).get()],
  ['G. where distributionId + orderBy submittedAt DESC', () => db.collection('responses').where('distributionId','==','x').orderBy('submittedAt','desc').limit(5).get()],
  ['H. where partnershipId + orderBy submittedAt ASC', () => db.collection('responses').where('partnershipId','==','x').orderBy('submittedAt','asc').limit(5).get()],
]
for (const [name, fn] of tests) {
  try { const s = await fn(); console.log('PASS', name, '| docs=', s.size) }
  catch (e) { console.log('FAIL', name, '|', String(e.message).split('\n')[0].slice(0, 90)) }
}
process.exit(0)
