#!/usr/bin/env node
/**
 * COMPUTE RESULTS — replika data bersih (data menyesuaikan kode, bukan sebaliknya).
 *
 * Untuk SETIAP response di emulator, hitung ulang `result` (dengan aspects per-aspek)
 * menggunakan scoring engine canonical, lalu TULIS kembali ke Firestore.
 * Ini memastikan response punya field `result.aspects` (source of truth untuk
 * halaman "Hasil Penilaian"), `versionId`, dan `versionNumber` yang benar.
 *
 * Usage: FIRESTORE_EMULATOR_HOST=localhost:8090 node scripts/migration/compute-results.mjs
 */
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const app = initializeApp({ projectId: 'desa-sehat-2026' })
const db = getFirestore(app)
db.settings({ host: 'localhost:8090', ssl: false, ignoreUndefinedProperties: true })

const { adaptLegacyForm } = await import('../../lib/domain/forms/legacy-adapter.ts')
const { calculateResponseScore } = await import('../../lib/domain/scoring/scoring-aspects.ts')
const { resolveQuestionAnswer } = await import('../../lib/domain/scoring/scoring-labels.ts')

const THRESHOLDS = [
  { id: 't_ms', min: 75, max: 100, grade: 'MS', title: 'Memenuhi Syarat (MS)', description: 'Skor ≥ 75%' },
  { id: 't_bl', min: 60, max: 74, grade: 'BL', title: 'Binaan Lanjutan', description: 'Skor 60–74%' },
  { id: 't_pp', min: 0, max: 59, grade: 'PP', title: 'Perlu Perbaikan', description: 'Skor < 60%' },
]

async function main() {
  console.log('🔧 COMPUTE RESULTS — replika data bersih (data → kode)\n')

  const formsSnap = await db.collection('forms').get()
  const formMap = new Map()
  for (const d of formsSnap.docs) {
    formMap.set(d.id, { id: d.id, ...d.data() })
  }
  console.log(`forms: ${formMap.size}`)

  const respSnap = await db.collection('responses').get()
  console.log(`responses: ${respSnap.size}\n`)

  let computed = 0
  let skipped = 0
  const aspectTotals = {}

  for (const d of respSnap.docs) {
    const r = d.data()
    const form = formMap.get(r.formId)
    if (!form) {
      skipped++
      continue
    }

    // Adapt legacy form → canonical (questions with questionId + aspects + scoring)
    const { canonical } = adaptLegacyForm({ id: form.id, ...form })
    const questions = canonical.version.questions
    const aspects = canonical.version.aspects
    const scoring = canonical.version.scoring

    // Resolve answers: questionId → raw value
    const answers = r.answers || {}
    const resolvedAnswers = {}
    questions.forEach((q, idx) => {
      const ans = resolveQuestionAnswer(q, answers, idx)
      if (ans !== undefined) resolvedAnswers[q.questionId] = ans
    })

    const scoreOutput = calculateResponseScore(
      { aspects, questions, scoring, thresholds: THRESHOLDS, recommendations: { mode: 'manual' } },
      resolvedAnswers
    )

    const result = {
      scoringEngineVersion: 'v1.5',
      calculatedAt: r.submittedAt || r.updatedAt || new Date().toISOString(),
      rawScore: scoreOutput.rawScore,
      maximumScore: scoreOutput.maximumScore,
      percentage: scoreOutput.percentage,
      grade: scoreOutput.gradeResult.grade,
      thresholdId: scoreOutput.gradeResult.thresholdId,
      thresholdTitle: scoreOutput.gradeResult.title,
      thresholdDescription: scoreOutput.gradeResult.description,
      aspects: scoreOutput.aspectResults,
      questions: scoreOutput.questionResults,
      recommendations: [],
    }

    // Tulis result + versionId + versionNumber (schema canonical)
    const update = {
      result,
      versionId: `v1-${form.id}`,
      versionNumber: 1,
    }
    await db.collection('responses').doc(d.id).set(update, { merge: true })
    computed++

    // Akumulasi per-aspek (hanya scored)
    for (const a of scoreOutput.aspectResults) {
      if (a.maximumScore === 0) continue
      if (!aspectTotals[a.title]) aspectTotals[a.title] = { raw: 0, max: 0 }
      aspectTotals[a.title].raw += a.rawScore
      aspectTotals[a.title].max += a.maximumScore
    }
  }

  console.log(`\n✅ computed: ${computed}, skipped: ${skipped}`)

  console.log('\n=== RATA-RATA PER ASPEK (scored only) ===')
  const targets = { 'Pengetahuan Responden': 67, 'Sikap Responden': 72, 'Perilaku Responden': 79 }
  for (const [title, { raw, max }] of Object.entries(aspectTotals)) {
    const pct = max > 0 ? Math.round((raw / max) * 100) : 0
    console.log(`  ${title.padEnd(34)} ${pct}%  (target ${targets[title] ?? '?'}%)`)
  }

  process.exit(0)
}

main().catch((e) => { console.error('❌', e); process.exit(1) })
