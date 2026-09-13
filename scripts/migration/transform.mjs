#!/usr/bin/env node
/**
 * M3 Migration — Transform legacy data → target schema (DRY-RUN, no production touch).
 *
 * Membaca data export (Firestore REST JSON) di data/export/,
 * menghasilkan data transformed di data/transformed/ (DUPLIKAT — asli TIDAK diubah),
 * lalu mencetak laporan verifikasi angka (target: 40 SMP + 25 SMA = 65 siswa).
 *
 * Usage: node scripts/migration/transform.mjs
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.cwd())
const EXPORT_DIR = path.join(ROOT, 'data', 'export')
const OUT_DIR = path.join(ROOT, 'data', 'transformed')

// ============ LOAD ============
function loadJson(name) {
  const p = path.join(EXPORT_DIR, name)
  if (!fs.existsSync(p)) return null
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

const responses = loadJson('responses.json') || []
const forms = loadJson('forms.json') || []
const v15Forms = loadJson('v1_5_forms.json') || []
const users = loadJson('users.json') || []
const distributions = loadJson('distributions.json') || []

// ============ MAP formId -> title ============
const formIdToTitle = {}
for (const form of v15Forms) {
  const f = form.fields || {}
  const fid = f.formId?.stringValue
  const title = f.title?.stringValue
  if (fid) formIdToTitle[fid] = title
}

// ============ CLASSIFY ============
function classifyResponse(r) {
  const fields = r.fields || {}
  const isLegacy = !!fields.formCode?.stringValue
  const status = fields.status?.stringValue
  const formId = fields.formId?.stringValue || ''

  // test/salinan detection
  const isTestSampah = /salinan|test|testing|form__/i.test(formId)

  if (isLegacy) {
    const title = fields.formTitle?.stringValue || ''
    const school = title.includes('SMP') ? 'SMP' : title.includes('SMA') ? 'SMA' : 'Masyarakat'
    const ptype = /pre/i.test(title) ? 'pre' : /post/i.test(title) ? 'post' : '?'
    return { kind: 'legacy', school, ptype, status: 'submitted', isTest: false, title }
  }

  // v1.5
  const title = formIdToTitle[formId] || ''
  const school = title.includes('SMP') ? 'SMP' : title.includes('SMA') ? 'SMA' : 'Masyarakat'
  const ptype = /pre/i.test(title) ? 'pre' : /post/i.test(title) ? 'post' : '?'
  return { kind: 'v1.5', school, ptype, status: status || '?', isTest: isTestSampah, title }
}

// ============ ANALYZE ============
const stats = {
  total: responses.length,
  valid: 0,
  draft: 0,
  test: 0,
  smp: { pre: 0, post: 0 },
  sma: { pre: 0, post: 0 },
  masyarakat: 0,
}

const validResponses = []
const draftResponses = []
const testResponses = []

for (const r of responses) {
  const c = classifyResponse(r)
  if (c.isTest) {
    testResponses.push(r)
    stats.test++
    continue
  }
  if (c.status === 'in_progress') {
    draftResponses.push(r)
    stats.draft++
    continue
  }
  // valid (submitted legacy + submitted v1.5)
  validResponses.push(r)
  stats.valid++
  if (c.school === 'SMP') stats.smp[c.ptype]++
  else if (c.school === 'SMA') stats.sma[c.ptype]++
  else stats.masyarakat++
}

// ============ REPORT ============
console.log('========================================')
console.log('M3 MIGRATION — DRY-RUN TRANSFORM REPORT')
console.log('========================================')
console.log(`Total responses (mentah): ${stats.total}`)
console.log(`  VALID (submitted):      ${stats.valid}`)
console.log(`  DRAFT (in_progress):    ${stats.draft}  → FLAG/buang`)
console.log(`  TEST/SALINAN:           ${stats.test}  → buang`)
console.log('')
console.log('--- Valid breakdown ---')
console.log(`SMP: pre=${stats.smp.pre} post=${stats.smp.post} → siswa=${Math.min(stats.smp.pre, stats.smp.post)}`)
console.log(`SMA: pre=${stats.sma.pre} post=${stats.sma.post} → siswa=${Math.min(stats.sma.pre, stats.sma.post)}`)
console.log(`Masyarakat: ${stats.masyarakat}`)
console.log('')
const smpStudents = Math.min(stats.smp.pre, stats.smp.post)
const smaStudents = Math.min(stats.sma.pre, stats.sma.post)
console.log(`TOTAL SISWA: ${smpStudents + smaStudents} (target 65)`)
console.log(`TOTAL RESPONSE VALID: ${stats.valid} (target 130)`)
console.log('')

// ============ WRITE DUPLICAT (transformed) ============
fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(
  path.join(OUT_DIR, 'responses.valid.json'),
  JSON.stringify(validResponses, null, 2),
)
fs.writeFileSync(
  path.join(OUT_DIR, 'responses.draft.json'),
  JSON.stringify(draftResponses, null, 2),
)
fs.writeFileSync(
  path.join(OUT_DIR, 'responses.test.json'),
  JSON.stringify(testResponses, null, 2),
)
console.log(`Duplikat ditulis ke data/transformed/ (asli TIDAK diubah)`)
console.log(`  responses.valid.json: ${validResponses.length} doc`)
console.log(`  responses.draft.json: ${draftResponses.length} doc`)
console.log(`  responses.test.json:  ${testResponses.length} doc`)

// ============ VERIFICATION GATE ============
const expectedStudents = 65
const expectedResponses = 130
const passStudents = smpStudents + smaStudents === expectedStudents
const passResponses = stats.valid === expectedResponses

console.log('')
console.log('--- VERIFICATION GATE ---')
console.log(`Siswa 65?  ${passStudents ? '✅ PASS' : '❌ FAIL'}`)
console.log(`Resp 130?  ${passResponses ? '✅ PASS' : '❌ FAIL'}`)
if (!passStudents || !passResponses) {
  console.error('❌ VERIFICATION GAGAL — jangan lanjut ke seed sebelum angka cocok.')
  process.exit(1)
}
console.log('✅ VERIFICATION PASS — aman untuk lanjut ke seed emulator.')
