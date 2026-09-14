import { adaptLegacyForm } from '../../lib/domain/forms/legacy-adapter.ts'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
const db = getFirestore(initializeApp({ projectId: 'desa-sehat-2026' }))
db.settings({ host: 'localhost:8090', ssl: false })

const fs = await db.collection('forms').get()
const form = fs.docs[0]
const fd = form.data()

const { canonical } = adaptLegacyForm({ id: form.id, ...fd })

console.log('=== question pengetahuan (bahaya) — scheme & answerKey ===')
for (const q of canonical.version.questions) {
  if (q.prompt.includes('bahaya') || q.prompt.includes('kedaluwarsa') || q.prompt.includes('Izin Edar')) {
    console.log(`\n${q.prompt}`)
    console.log(`  type=${q.type} scheme=${q.scoring.scheme}`)
    console.log(`  answerKey=${JSON.stringify(q.answerKey)}`)
    console.log(`  options=${JSON.stringify(q.options.map(o => o.label))}`)
  }
}

console.log('\n=== question pengetahuan (Benar/Salah) — scheme & answerKey ===')
for (const q of canonical.version.questions) {
  if (q.prompt.includes('Bakso kuah') || q.prompt.includes('Mencuci tangan perlu')) {
    console.log(`\n${q.prompt}`)
    console.log(`  type=${q.type} scheme=${q.scoring.scheme}`)
    console.log(`  answerKey=${JSON.stringify(q.answerKey)}`)
  }
}
process.exit(0)
