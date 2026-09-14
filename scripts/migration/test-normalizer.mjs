#!/usr/bin/env node
/**
 * Test canonical normalizer against real data patterns.
 * Verifies "Jenis Kelamin" (2 options) → "Laki Laki"/"Perempuan" (NOT "Pilihan 1/2"),
 * and knowledge questions with numeric indices resolve to real labels.
 */
import { resolveOptionLabel, normalizeAnswerValue, normalizeScaleLabel } from '../../lib/domain/answers/normalizer.js'

let pass = 0
let fail = 0
function assertEq(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) pass++
  else {
    fail++
    console.log(`❌ ${name}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`)
  }
}

// ===== CASE 1: Jenis Kelamin (single-choice, 2 options) =====
const genderQ = {
  questionId: 'wqtota6',
  answerType: 'single-choice',
  question: 'Jenis Kelamin',
  config: { options: ['1. Laki Laki', '2. Perempuan'] },
}
assertEq('JK label "1. Laki Laki"', resolveOptionLabel(genderQ, '1. Laki Laki'), '1. Laki Laki')
assertEq('JK label "2. Perempuan"', resolveOptionLabel(genderQ, '2. Perempuan'), '2. Perempuan')
assertEq('JK index "1" → Laki Laki', resolveOptionLabel(genderQ, '1'), '1. Laki Laki')
assertEq('JK index "2" → Perempuan', resolveOptionLabel(genderQ, '2'), '2. Perempuan')
assertEq('JK NEVER "Pilihan 1"', resolveOptionLabel(genderQ, '1') === 'Pilihan 1', false)

// ===== CASE 2: Pengetahuan multiple-choice (numeric index) =====
const bahayaQ = {
  questionId: 'wcu7mc3',
  answerType: 'multiple-choice',
  question: 'Berdasarkan gambar diatas, manakah yang termasuk 2 macam bahaya Biologi?',
  config: { options: ['Mikroba', 'Benda asing', 'Bahan kimia', 'Pewarna', 'Pengawet', 'Pemanis', 'Logam berat'] },
}
assertEq('bahaya index "2" → Benda asing', resolveOptionLabel(bahayaQ, '2'), 'Benda asing')
assertEq('bahaya array ["2","4"]', normalizeAnswerValue(bahayaQ, ['2', '4']), ['Benda asing', 'Pewarna'])
assertEq('bahaya index "1" → Mikroba', resolveOptionLabel(bahayaQ, '1'), 'Mikroba')
assertEq('bahaya index "7" → Logam berat', resolveOptionLabel(bahayaQ, '7'), 'Logam berat')

// ===== CASE 3: Likert scale normalization =====
assertEq('scale "SS"', normalizeScaleLabel('SS'), 'Sangat Setuju')
assertEq('scale "STS"', normalizeScaleLabel('STS'), 'Sangat Tidak Setuju')
assertEq('scale "N"', normalizeScaleLabel('N'), 'Netral')
assertEq('scale "Sering/Selalu" passthrough', normalizeScaleLabel('Sering/Selalu'), 'Sering/Selalu')

// ===== CASE 4: indicator-table (Sikap) map =====
const sikapQ = {
  questionId: '4qxynh9',
  answerType: 'indicator-table',
  question: 'Aspek Sikap Terhadap Keamanan Pangan',
}
const sikapAnswer = { 'Saya mencuci tangan': 'SS', 'Saya jajan': 'N' }
const sikapNorm = normalizeAnswerValue(sikapQ, sikapAnswer)
assertEq('sikap map SS → full label', sikapNorm['Saya mencuci tangan'], 'Sangat Setuju')
assertEq('sikap map N → Netral', sikapNorm['Saya jajan'], 'Netral')

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
