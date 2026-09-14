import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
const db = getFirestore(initializeApp({ projectId: 'desa-sehat-2026' }))
db.settings({ host: 'localhost:8090', ssl: false })

const { adaptLegacyForm } = await import('../../lib/domain/forms/legacy-adapter.ts')
const { calculateQuestionScore } = await import('../../lib/domain/scoring/scoring-compute.ts')
const { normalizeQuestionOptions, resolveCorrectOptionIds } = await import('../../lib/domain/scoring/scoring-options.ts')

const fs = await db.collection('forms').get()
const form = fs.docs[0]
const fd = form.data()
const rs = await db.collection('responses').where('formId', '==', form.id).limit(1).get()
const rd = rs.docs[0].data()

const { canonical } = adaptLegacyForm({ id: form.id, ...fd })
const answers = rd.answers || {}

console.log('=== DEBUG Pengetahuan (bahaya) scoring ===')
for (const q of canonical.version.questions) {
  if (q.aspectId !== undefined && canonical.version.aspects.find(a => a.aspectId === q.aspectId)?.title === 'Pengetahuan Responden') {
    const ans = answers[q.questionId]
    const opts = normalizeQuestionOptions(q)
    const correct = resolveCorrectOptionIds(q, opts)
    const result = calculateQuestionScore(q, ans)
    console.log(`\n${q.prompt}`)
    console.log(`  type=${q.type} scheme=${q.scoring.scheme}`)
    console.log(`  answer=${JSON.stringify(ans)}`)
    console.log(`  correct=${JSON.stringify(correct)}`)
    console.log(`  → raw=${result.rawScore}/${result.maximumScore} included=${result.includedInTotal}`)
  }
}
process.exit(0)
