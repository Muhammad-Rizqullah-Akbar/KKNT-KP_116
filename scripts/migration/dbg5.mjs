import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
const db = getFirestore(initializeApp({ projectId: 'desa-sehat-2026' }))
db.settings({ host: 'localhost:8090', ssl: false })

const fs = await db.collection('forms').get()
const form = fs.docs[0]
const fd = form.data()

console.log('=== stages (id | name | includeInScoring) ===')
for (const st of fd.stages || []) {
  console.log(`  id=${st.id}  name=${st.name}  includeInScoring=${st.includeInScoring}`)
}

console.log('\n=== questions (stageId | question) — semua ===')
for (const q of fd.questions || []) {
  console.log(`  stageId=${q.stageId ?? '(none)'}  |  ${q.question}`)
}
process.exit(0)
