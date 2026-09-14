import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
const db = getFirestore(initializeApp({ projectId: 'desa-sehat-2026' }))
db.settings({ host: 'localhost:8090', ssl: false })

const { adaptLegacyForm } = await import('../../lib/domain/forms/legacy-adapter.ts')
const { calculateResponseScore } = await import('../../lib/domain/scoring/scoring-aspects.ts')
const { resolveQuestionAnswer } = await import('../../lib/domain/scoring/scoring-labels.ts')

const fs = await db.collection('forms').get()
const form = fs.docs[0]
const fd = form.data()

const rs = await db.collection('responses').where('formId', '==', form.id).limit(1).get()
const r = rs.docs[0]
const rd = r.data()

const { canonical } = adaptLegacyForm({ id: form.id, ...fd })
const questions = canonical.version.questions
const aspects = canonical.version.aspects
const scoring = canonical.version.scoring
const thresholds = [
  { id: 't_a', min: 90, max: 100, grade: 'A', title: 'Sangat Baik' },
  { id: 't_b', min: 75, max: 89, grade: 'B', title: 'Baik' },
  { id: 't_c', min: 60, max: 74, grade: 'C', title: 'Cukup' },
  { id: 't_d', min: 0, max: 59, grade: 'D', title: 'Perlu Pembinaan' },
]

const answers = rd.answers || {}

// Debug: resolve 3 question
console.log('=== DEBUG resolveQuestionAnswer ===')
for (const q of questions.slice(0, 3)) {
  const resolved = resolveQuestionAnswer(q, answers, questions.indexOf(q))
  console.log(`  q=${q.questionId} (${q.prompt}) → resolved=${JSON.stringify(resolved)}`)
}

// Resolve all answers
const resolvedAnswers = {}
questions.forEach((q, idx) => {
  const ans = resolveQuestionAnswer(q, answers, idx)
  if (ans !== undefined) resolvedAnswers[q.questionId] = ans
})
console.log(`\nresolvedAnswers count: ${Object.keys(resolvedAnswers).length} / ${questions.length}`)

const result = calculateResponseScore(
  { aspects, questions, scoring, thresholds, recommendations: { mode: 'manual' } },
  resolvedAnswers
)

console.log('\n=== RESULT ===')
console.log('percentage:', result.percentage)
console.log('rawScore:', result.rawScore, '/ maximumScore:', result.maximumScore)
console.log('\naspectResults:')
for (const a of result.aspectResults) {
  console.log(`  ${a.title}: ${a.percentage}% (raw=${a.rawScore}/${a.maximumScore}, weight=${a.weightPercentage}%, contrib=${a.weightedContribution})`)
}

process.exit(0)
