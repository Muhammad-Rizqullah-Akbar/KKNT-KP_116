import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
const db = getFirestore(initializeApp({ projectId: 'desa-sehat-2026' }))
db.settings({ host: 'localhost:8090', ssl: false })

const fs = await db.collection('forms').get()
for (const d of fs.docs) {
  const fd = d.data()
  console.log(`\n============================================================`)
  console.log(`FORM: ${fd.title}`)
  console.log(`CODE: ${fd.code}  |  ID: ${d.id}`)
  console.log(`============================================================`)
  for (const q of fd.questions || []) {
    const correct = q.config?.correctAnswer
    const hasCorrect = correct !== undefined && correct !== null && correct !== '' && !(Array.isArray(correct) && correct.length === 0)
    if (!hasCorrect) continue
    const stage = q.stageId === 'ozqj6z6' ? 'PENGETAHUAN' : q.stageId === '8otj4xk' ? 'SIKAP' : q.stageId === 'fqqbo23' ? 'PERILAKU' : q.stageId
    const opts = q.config?.options || q.options || []
    console.log(`\n[${stage}] ${q.question}`)
    console.log(`  tipe: ${q.answerType}`)
    console.log(`  KUNCI: ${JSON.stringify(correct)}`)
    if (opts.length > 0 && opts.length <= 10) {
      console.log(`  opsi: ${JSON.stringify(opts)}`)
    }
  }
}
process.exit(0)
