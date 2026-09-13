#!/usr/bin/env node
/**
 * M3 Migration — Normalize legacy answers → target schema (questionId key).
 * DRY-RUN: membaca data/transformed/responses.valid.json,
 * menghasilkan data/transformed/responses.normalized.json (DUPLIKAT).
 *
 * Transform inti: legacy `answers` (key = teks pertanyaan) → v1.5 (key = questionId).
 * Value label mentah dipertahankan (sudah human-readable), hanya key yang di-normalisasi.
 *
 * Usage: node scripts/migration/normalize.mjs
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.cwd())
const EXPORT_DIR = path.join(ROOT, 'data', 'export')
const TRANSFORMED_DIR = path.join(ROOT, 'data', 'transformed')

function getStr(v) {
  if (v && typeof v === 'object' && 'stringValue' in v) return v['stringValue']
  return ''
}

function extractQuestionTextToId(form) {
  const fields = form.fields || {}
  const qarr = fields.questions?.arrayValue?.values || []
  const map = {}
  for (const qv of qarr) {
    const f = qv.mapValue?.fields || {}
    const id = getStr(f.id)
    const q = getStr(f.question)
    if (q) map[q.trim().toLowerCase()] = id
  }
  return map
}

// ============ BUILD MAPPING ============
const forms = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'forms.json'), 'utf-8') || '[]')
const v15Forms = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'v1_5_forms.json'), 'utf-8') || '[]')
const allForms = [...forms, ...v15Forms]

const formTextToId = {}
for (const form of allForms) {
  const fid = getStr(form.fields?.formId)
  if (fid) formTextToId[fid] = extractQuestionTextToId(form)
}

// ============ NORMALIZE ============
const valid = JSON.parse(fs.readFileSync(path.join(TRANSFORMED_DIR, 'responses.valid.json'), 'utf-8'))

const normalized = []
let legacyCount = 0
let v15Count = 0
let keyMatched = 0
let keyUnmatched = 0

for (const r of valid) {
  const fields = r.fields || {}
  const isLegacy = !!getStr(fields.formCode)

  if (!isLegacy) {
    // v1.5 sudah target — lewat langsung
    normalized.push(r)
    v15Count++
    continue
  }

  // Legacy: normalisasi key answers teks -> questionId
  legacyCount++
  const fid = getStr(fields.formId)
  const mapping = formTextToId[fid] || {}
  const rawAnswers = fields.answers?.mapValue?.fields || {}

  const newAnswers = {}
  for (const [textKey, value] of Object.entries(rawAnswers)) {
    const qid = mapping[textKey.trim().toLowerCase()]
    if (qid) {
      newAnswers[qid] = value // value dipertahankan (label mentah)
      keyMatched++
    } else {
      // fallback: pertahankan key teks asli
      newAnswers[textKey] = value
      keyUnmatched++
    }
  }

  normalized.push({
    ...r,
    fields: {
      ...fields,
      answers: { mapValue: { fields: newAnswers } },
      // tandai sudah normalisasi
      _normalized: { booleanValue: true },
    },
  })
}

// ============ REPORT ============
console.log('========================================')
console.log('M3 NORMALIZATION — DRY-RUN REPORT')
console.log('========================================')
console.log(`Total valid responses: ${valid.length}`)
console.log(`  legacy (di-normalisasi): ${legacyCount}`)
console.log(`  v1.5 (sudah target):    ${v15Count}`)
console.log('')
console.log(`Answer key matched:   ${keyMatched}`)
console.log(`Answer key unmatched: ${keyUnmatched}`)
console.log('')
const matchRate = ((keyMatched / (keyMatched + keyUnmatched || 1)) * 100).toFixed(2)
console.log(`Match rate: ${matchRate}%`)

// ============ WRITE ============
fs.writeFileSync(
  path.join(TRANSFORMED_DIR, 'responses.normalized.json'),
  JSON.stringify(normalized, null, 2),
)
console.log('')
console.log('✅ Duplikat dinormalisasi → data/transformed/responses.normalized.json')

// ============ GATE ============
if (keyUnmatched > 0) {
  console.warn(`⚠️  ${keyUnmatched} answer key tidak match — perlu investigasi.`)
}
if (matchRate < 95) {
  console.error('❌ Match rate < 95% — jangan lanjut seed sebelum match rate aman.')
  process.exit(1)
}
console.log('✅ NORMALIZATION PASS — match rate > 95%.')
