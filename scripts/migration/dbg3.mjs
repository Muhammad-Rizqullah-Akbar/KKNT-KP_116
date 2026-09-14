import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
const db = getFirestore(initializeApp({ projectId: 'desa-sehat-2026' }))
db.settings({ host: 'localhost:8090', ssl: false })

const { adaptLegacyForm } = await import('../../lib/domain/forms/legacy-adapter.ts')

const fs = await db.collection('forms').get()
const form = fs.docs[0]
const fd = form.data()

const { canonical, warnings } = adaptLegacyForm({ id: form.id, ...fd })

console.log('=== canonical.version.questions (questionId | prompt | type) ===')
for (const q of canonical.version.questions.slice(0, 8)) {
  console.log(`  questionId=${q.questionId}  prompt=${q.prompt}  type=${q.type}`)
}

console.log('\n=== canonical.version.aspects ===')
for (const a of canonical.version.aspects) {
  console.log(`  aspectId=${a.aspectId}  title=${a.title}  isScored=${a.isScored}`)
}

console.log('\n=== canonical.version.scoring ===')
console.log(JSON.stringify(canonical.version.scoring, null, 2))

console.log('\nwarnings:', warnings)
process.exit(0)
