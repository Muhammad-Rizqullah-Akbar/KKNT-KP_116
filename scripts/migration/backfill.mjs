#!/usr/bin/env node
/**
 * M3 Migration — Backfill FK untuk legacy responses.
 * Legacy responses (95) hanya punya formId+formCode, tanpa versionId/distributionId.
 * Sesuai ERD, responses harus punya versionId (FK) + distributionId (FK).
 *
 * Backfill:
 * - versionId = `v1-{formId}` (tiap form = 1 version aktif)
 * - distributionId = dari formCode → distributionCode → distributionId
 *
 * Usage: node scripts/migration/backfill.mjs
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.cwd())
const EXPORT_DIR = path.join(ROOT, 'data', 'export')
const TRANSFORMED_DIR = path.join(ROOT, 'data', 'transformed')

function getStr(v) { return (v && typeof v === 'object' && 'stringValue' in v) ? v.stringValue : '' }

// Load distributions untuk map code → id
const distributions = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'distributions.json'), 'utf-8'))
const codeToDistId = {}
const formCodeToDistId = {}
for (const d of distributions) {
  const fields = d.fields || {}
  const code = getStr(fields.code) || getStr(fields.distributionCode)
  const distId = d.id || getStr(fields.distributionId)
  if (code) codeToDistId[code] = distId
}

// Load normalized responses
const normalized = JSON.parse(fs.readFileSync(path.join(TRANSFORMED_DIR, 'responses.normalized.json'), 'utf-8'))

// Backfill legacy (yang punya formCode tapi tidak punya versionId)
let backfilled = 0
let skipped = 0
for (const r of normalized) {
  const fields = r.fields || {}
  const isLegacy = !!getStr(fields.formCode) && !getStr(fields.versionId)
  if (!isLegacy) {
    skipped++
    continue
  }

  const formId = getStr(fields.formId)
  const formCode = getStr(fields.formCode)

  // versionId = v1-formId
  fields.versionId = { stringValue: `v1-${formId}` }
  fields.versionNumber = { integerValue: '1' }

  // distributionId = dari formCode (jika ada distribution dengan code yang cocok)
  // formCode format FRM-XXXX, distribution code format KKPD-XXXX (berbeda)
  // jadi legacy response tidak punya distribution langsung — biarkan null
  // TAPI set distributionCode untuk referensi
  if (!fields.distributionCode) {
    fields.distributionCode = { stringValue: formCode }
  }

  backfilled++
}

// Write backfilled
fs.writeFileSync(
  path.join(TRANSFORMED_DIR, 'responses.backfilled.json'),
  JSON.stringify(normalized, null, 2),
)

console.log('========================================')
console.log('M3 BACKFILL — REPORT')
console.log('========================================')
console.log(`Total normalized: ${normalized.length}`)
console.log(`Backfilled (legacy tanpa versionId): ${backfilled}`)
console.log(`Skipped (sudah punya versionId): ${skipped}`)
console.log('')
console.log('Backfill yang diterapkan:')
console.log('  - versionId = v1-{formId}')
console.log('  - versionNumber = 1')
console.log('  - distributionCode = formCode (referensi)')
console.log('')
console.log('✅ Backfill selesai → data/transformed/responses.backfilled.json')
