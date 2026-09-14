import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
const db = getFirestore(initializeApp({ projectId: 'desa-sehat-2026' }))
db.settings({ host: 'localhost:8090', ssl: false })

const fs = await db.collection('forms').get()
const form = fs.docs[0]
const fd = form.data()
console.log('FORM id:', form.id)
console.log('FORM title:', fd.title)
console.log('FORM questions count:', (fd.questions || []).length)
if (fd.questions && fd.questions[0]) {
  console.log('Q[0] keys:', Object.keys(fd.questions[0]))
  console.log('Q[0] id:', fd.questions[0].id, '| question:', fd.questions[0].question)
  console.log('Q[0] config.options:', JSON.stringify(fd.questions[0].config?.options)?.slice(0, 200))
  console.log('Q[0] answerType:', fd.questions[0].answerType)
}

const rs = await db.collection('responses').where('formId', '==', form.id).limit(1).get()
if (rs.size > 0) {
  const r = rs.docs[0]
  const rd = r.data()
  const ans = rd.answers || {}
  console.log('\nRESPONSE id:', r.id)
  console.log('answers keys (first 6):', Object.keys(ans).slice(0, 6))
  console.log('answers sample:', JSON.stringify(Object.entries(ans).slice(0, 3)))
  console.log('formId:', rd.formId, '| formCode:', rd.formCode)
}
process.exit(0)
