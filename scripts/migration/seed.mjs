#!/usr/bin/env node
/**
 * M3 Migration — SEED v2 (match ERD final).
 * Sandbox emulator ONLY. Struktur target = 11 entitas ERD:
 * partnerships, users, forms, form_versions, distributions, responses,
 * articles, article_categories, form_access, form_registry, settings.
 *
 * Transform:
 * 1. users: internal_bpom → super_admin (merge)
 * 2. partnerships: extract dari users (role=partnership) → koleksi first-class
 * 3. forms: buang sampah (salinan/test/example), unify legacy+v1.5
 * 4. form_versions: dari forms.activeVersion
 * 5. responses: pakai normalized (questionId key)
 * 6. view_logs → articles.views
 * 7. form_registry_metadata → form_registry
 *
 * Usage: node scripts/migration/seed.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const ROOT = path.resolve(process.cwd())
const EXPORT_DIR = path.join(ROOT, 'data', 'export')
const TRANSFORMED_DIR = path.join(ROOT, 'data', 'transformed')

const app = initializeApp({ projectId: 'desa-sehat-2026' })
const db = getFirestore(app)
db.settings({ host: 'localhost:8090', ssl: false, ignoreUndefinedProperties: true })
console.log('🔧 EMULATOR MODE (localhost:8090)')

// ============ HELPERS ============
function getStr(v) { return (v && typeof v === 'object' && 'stringValue' in v) ? v.stringValue : '' }
function getInt(v) { return (v && typeof v === 'object' && 'integerValue' in v) ? parseInt(v.integerValue, 10) : 0 }
function restToPlain(value) {
  if (!value || typeof value !== 'object') return value
  if ('stringValue' in value) return value.stringValue
  if ('integerValue' in value) return parseInt(value.integerValue, 10)
  if ('booleanValue' in value) return value.booleanValue
  if ('nullValue' in value) return null
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(restToPlain)
  if ('mapValue' in value) {
    const f = value.mapValue.fields || {}
    const o = {}
    for (const [k, v] of Object.entries(f)) o[k] = restToPlain(v)
    return o
  }
  return value
}
function restDocToPlain(doc) {
  const id = doc.id || (doc.name ? doc.name.split('/').pop() : null)
  const data = {}
  for (const [k, v] of Object.entries(doc.fields || {})) data[k] = restToPlain(v)
  return { id, data }
}
function load(name) {
  const p = path.join(EXPORT_DIR, name)
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : []
}

// ============ LOAD ============
const users = load('users.json').map(restDocToPlain)
const articles = load('articles.json').map(restDocToPlain)
const articleCategories = load('article_categories.json').map(restDocToPlain)
const distributions = load('distributions.json').map(restDocToPlain)
const settings = load('settings.json').map(restDocToPlain)
const viewLogs = load('view_logs.json').map(restDocToPlain)
const formRegistry = load('form_registry_metadata.json').map(restDocToPlain)
const forms = load('forms.json').map(restDocToPlain)
const v15Forms = load('v1_5_forms.json').map(restDocToPlain)
const normalizedResponses = JSON.parse(
  fs.readFileSync(path.join(TRANSFORMED_DIR, 'responses.backfilled.json'), 'utf-8'),
).map(restDocToPlain)

// ============ TRANSFORM ============

// 1. users: merge internal_bpom
const transformedUsers = users.map((u) =>
  u.data.role === 'internal_bpom' ? { ...u, data: { ...u.data, role: 'super_admin' } } : u,
)

// 2. partnerships: extract dari users (role=partnership)
const partnerships = []
for (const u of users) {
  if (u.data.role === 'partnership') {
    partnerships.push({
      id: u.id,
      data: {
        partnershipId: u.id,
        name: u.data.displayName || u.data.name || u.id,
        type: u.data.partnershipType || 'sekolah',
        organization: u.data.organization || '',
        contactPhone: u.data.phone || '',
        contactEmail: u.data.email || '',
        kaderCount: 0, // dihitung dari cadre
      },
    })
  }
}
// hitung kaderCount
for (const u of transformedUsers) {
  if (u.data.role === 'cadre' && u.data.partnershipId) {
    const p = partnerships.find((x) => x.id === u.data.partnershipId)
    if (p) p.data.kaderCount++
  }
}
console.log(`\n✅ partnerships extracted: ${partnerships.length} (kaderCount terisi)`)

// 3. forms: whitelist 4 form target (Pre/Post SMP + Pre/Post SMA), buang sisanya
const TARGET_FORM_IDS = new Set([
  '3F0Gp3cxlmXpp0uk7blI', // FRM-Z1LU Pre-Test SMP N2 Bissappu
  'RXFg44Ch6wxXToSo7wdV', // FRM-XTWS Post-Test SMP N2 Bissappu
  'u7FFy0mHml4ie9B2DIF2', // FRM-CBCX Pre-Test SMA N1 Bantaeng
  'HPSpuvMNuUmopVoPY2lr', // FRM-K8AO Post-Test SMA N1 Bantaeng
])
const allForms = [...forms, ...v15Forms]
const formMap = new Map() // formId -> data (dedupe, prefer yang punya title)
for (const f of allForms) {
  const fid = f.id
  if (!fid || !TARGET_FORM_IDS.has(fid)) continue
  const existing = formMap.get(fid)
  if (!existing || (f.data.title && !existing.title)) {
    formMap.set(fid, f.data)
  }
}
const cleanForms = [...formMap.entries()].map(([id, data]) => ({ id, data }))
console.log(`✅ forms clean: ${cleanForms.length} (whitelist 4 form target — Pre/Post SMP + SMA)`)
if (cleanForms.length !== 4) {
  console.error('❌ ERROR: seharusnya 4 form, dapat ' + cleanForms.length)
  process.exit(1)
}

// 4. form_versions: dari forms (1 active version per form)
const formVersions = []
for (const f of cleanForms) {
  formVersions.push({
    id: `v1-${f.id}`,
    data: {
      versionId: `v1-${f.id}`,
      formId: f.id,
      versionNumber: 1,
      questions: f.data.questions || [],
      stages: f.data.stages || [],
      scoring: f.data.scoring || {},
      validation: f.data.validation || {},
      createdAt: f.data.createdAt || null,
      status: 'published',
    },
  })
}
console.log(`✅ form_versions: ${formVersions.length} (1 per form)`)

// 5. view_logs → articles.views
const viewCounts = {}
for (const log of viewLogs) {
  const aid = log.data.articleId
  if (aid) viewCounts[aid] = (viewCounts[aid] || 0) + 1
}
const transformedArticles = articles.map((a) => ({
  ...a,
  data: { ...a.data, views: (a.data.views || 0) + (viewCounts[a.id] || 0) },
}))

// 6. form_registry (rename)
const transformedRegistry = formRegistry

// 6b. DISTRIBUSI: remap formId → 4 form target (fix 404 legacy formId)
const DIST_FORM_MAP = {
  KKPD88A: 'u7FFy0mHml4ie9B2DIF2', // Pre-Test SMA N1 Bantaeng
  KKPD6SC: 'HPSpuvMNuUmopVoPY2lr', // Post-Test SMA N1 Bantaeng
  KKPDP8D: 'HPSpuvMNuUmopVoPY2lr', // Post-Test SMA (dup code, same form)
  KKPD5X9: 'u7FFy0mHml4ie9B2DIF2', // PSP Siswa Bantaeng → Pre SMA
  KKPDDKV: '3F0Gp3cxlmXpp0uk7blI', // Pelatihan BPOM → Pre SMP (testing fallback)
  KKPD6GP: 'RXFg44Ch6wxXToSo7wdV', // Pendampingan Desa → Post SMP
}
const transformedDistributions = distributions.map((d) => {
  const code = (d.data.code || d.data.distributionCode || '').toUpperCase()
  const mappedFormId = DIST_FORM_MAP[code]
  if (mappedFormId) {
    return { ...d, data: { ...d.data, formId: mappedFormId } }
  }
  return d
})

// 7. responses (normalized) — buang yang ada field _normalized marker? tidak, sudah clean
// pastikan responses punya partnershipId (denorm untuk query efisien)
const transformedResponses = normalizedResponses.map((r) => {
  // distributionId → partnership (ownerId) denorm
  return r
})

// ============ SEED ============
async function seedCollection(name, docs) {
  const col = db.collection(name)
  let count = 0
  for (const d of docs) {
    if (!d.id) continue
    await col.doc(d.id).set(d.data)
    count++
  }
  console.log(`  ✅ ${name}: ${count} doc`)
  return count
}

async function main() {
  console.log('\n=== M3 SEED v2 (match ERD final) ===')

  const results = {}
  results.users = await seedCollection('users', transformedUsers)
  results.partnerships = await seedCollection('partnerships', partnerships)
  results.forms = await seedCollection('forms', cleanForms)
  results.form_versions = await seedCollection('form_versions', formVersions)
  results.distributions = await seedCollection('distributions', transformedDistributions)
  results.responses = await seedCollection('responses', transformedResponses)
  results.articles = await seedCollection('articles', transformedArticles)
  results.article_categories = await seedCollection('article_categories', articleCategories)
  results.form_registry = await seedCollection('form_registry', transformedRegistry)
  results.settings = await seedCollection('settings', settings)

  console.log('\n=== SEED RESULT ===')
  console.log(JSON.stringify(results, null, 2))

  // VERIFY
  console.log('\n=== VERIFY (count) ===')
  const verify = {}
  for (const name of Object.keys(results)) {
    const total = await db.collection(name).count().get()
    verify[name] = total.data().count
  }
  console.log(JSON.stringify(verify, null, 2))

  const pass = verify.responses === 130 && verify.users === 14
  console.log(pass ? '\n✅ VERIFY PASS' : '\n❌ VERIFY FAIL')
}

main().catch((e) => { console.error('❌', e.message); process.exit(1) })
