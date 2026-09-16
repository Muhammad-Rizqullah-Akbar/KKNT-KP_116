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

const snap = await db.collection('responses').get()
let noOwner=0, noPartner=0, noDist=0, noForm=0, noSubmit=0, noStatus=0
const ownerVals = new Set(), statusVals = new Set()
for (const d of snap.docs) {
  const r = d.data()
  if (!r.ownerId) noOwner++
  if (!r.partnershipId) noPartner++
  if (!r.distributionId) noDist++
  if (!r.formId) noForm++
  if (!r.submittedAt) noSubmit++
  if (!r.status) noStatus++
  if (r.ownerId) ownerVals.add(r.ownerId)
  statusVals.add(r.status || '(none)')
}
console.log('TOTAL responses:', snap.size)
console.log('tanpa ownerId       :', noOwner)
console.log('tanpa partnershipId :', noPartner)
console.log('tanpa distributionId:', noDist)
console.log('tanpa formId        :', noForm)
console.log('tanpa submittedAt   :', noSubmit)
console.log('tanpa status        :', noStatus)
console.log('\nownerId unik   :', ownerVals.size, [...ownerVals].slice(0,5))
console.log('status unik    :', [...statusVals])

// distributions
const ds = await db.collection('distributions').get()
let dNoOwner=0, dNoPartner=0
for (const d of ds.docs) { const x=d.data(); if(!x.ownerId) dNoOwner++; if(!x.partnershipId) dNoPartner++ }
console.log('\ndistributions:', ds.size, '| tanpa ownerId:', dNoOwner, '| tanpa partnershipId:', dNoPartner)
process.exit(0)
