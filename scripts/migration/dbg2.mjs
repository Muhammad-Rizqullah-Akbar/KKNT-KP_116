
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
const db = getFirestore(initializeApp({ projectId: 'desa-sehat-2026' }))
db.settings({ host: 'localhost:8090', ssl: false })

const fs = await db.collection('forms').get()
const form = fs.docs[0]
const fd = form.data()

console.log('=== FORM questions (id | text | type) ===')
for (const q of fd.questions) {
  console.log(`  ${q.id}  |  ${q.question}  |  ${q.answerType}`)
}

const rs = await db.collection('responses').where('formId','==',form.id).limit(1).get()
const r = rs.docs[0]
const rd = r.data()
console.log('\n=== RESPONSE answers (key | value) ===')
for (const [k,v] of Object.entries(rd.answers||{})) {
  console.log(`  ${k}  =  ${JSON.stringify(v)}`)
}
process.exit(0)
