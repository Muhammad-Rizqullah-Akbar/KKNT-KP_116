#!/usr/bin/env node
/**
 * VERIFY SCORE (v2) — pakai scoring engine asli + data seeded di emulator.
 * Menghitung skor persis seperti sistem produksi, bandingkan dengan BPOM.
 */
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const app = initializeApp({ projectId: 'desa-sehat-2026' })
const db = getFirestore(app)
db.settings({ host: 'localhost:8090', ssl: false, ignoreUndefinedProperties: true })

// Load TS modules via tsx-compatible dynamic import
const { adaptLegacyForm } = await import('../../lib/domain/forms/legacy-adapter.ts')
const { calculateResponseScore } = await import('../../lib/domain/scoring/scoring-aspects.ts')
const { resolveQuestionAnswer } = await import('../../lib/domain/scoring/scoring-labels.ts')

async function main() {
  console.log('🔍 VERIFY SCORE v2 (scoring engine asli)\n')

  const formsSnap = await db.collection('forms').get()
  const forms = []
  for (const d of formsSnap.docs) forms.push({ id: d.id, ...d.data() })
  console.log(`forms: ${forms.length}`)

  const respSnap = await db.collection('responses').get()
  const responses = []
  for (const d of respSnap.docs) responses.push({ id: d.id, ...d.data() })
  console.log(`responses: ${responses.length}\n`)

  const scored = []
  const aspectTotals = {}

  for (const r of responses) {
    const form = forms.find((f) => f.id === r.formId)
    if (!form) continue

    // Adapt legacy form → canonical
    const { canonical } = adaptLegacyForm({ id: form.id, ...form })
    const questions = canonical.version.questions
    const aspects = canonical.version.aspects
    const scoring = canonical.version.scoring
    const thresholds = [
      { id: 't_a', min: 90, max: 100, grade: 'A', title: 'Sangat Baik' },
      { id: 't_b', min: 75, max: 89, grade: 'B', title: 'Baik' },
      { id: 't_c', min: 60, max: 74, grade: 'C', title: 'Cukup' },
      { id: 't_d', min: 0, max: 59, grade: 'D', title: 'Perlu Pembinaan' },
    ]

    // Resolve answers: questionId → raw value (yang sudah di-seed)
    const answers = r.answers || {}
    // Build answer map resolved by questionId + text (for engine)
    const resolvedAnswers = {}
    questions.forEach((q, idx) => {
      const ans = resolveQuestionAnswer(q, answers, idx)
      if (ans !== undefined) resolvedAnswers[q.questionId] = ans
    })

    const result = calculateResponseScore(
      { aspects, questions, scoring, thresholds, recommendations: { mode: 'manual' } },
      resolvedAnswers
    )

    scored.push({ id: r.id, overall: result.percentage, formTitle: form.title })

    for (const a of result.aspectResults) {
      if (!aspectTotals[a.title]) aspectTotals[a.title] = { total: 0, count: 0 }
      aspectTotals[a.title].total += a.percentage
      aspectTotals[a.title].count++
    }
  }

  const n = scored.length
  const avg = n > 0 ? Math.round(scored.reduce((s, r) => s + r.overall, 0) / n) : 0
  const ms = scored.filter((r) => r.overall >= 75).length

  console.log('=== HASIL (sistem) ===')
  console.log(`Total: ${n} (target 130)`)
  console.log(`Rata-rata overall: ${avg}% (target 71%)`)
  console.log(`MS (>=75%): ${ms} (target 45)`)

  console.log('\n=== PER ASPEK (sistem vs target BPOM) ===')
  const target = { 'Pengetahuan Responden': 67, 'Sikap Responden': 72, 'Perilaku Responden': 79, 'Data Responden': 0, 'Sumber Informasi Keamanan Pangan': 0 }
  for (const [title, { total, count }] of Object.entries(aspectTotals)) {
    console.log(`${title.padEnd(34)} ${Math.round(total / count)}%  (target ${target[title] ?? '?'}%)`)
  }

  process.exit(0)
}

main().catch((e) => { console.error('❌', e); process.exit(1) })
