/**
 * Deploy rules Firestore & Storage ke DATABASE YANG BENAR: `(default)` us-central1.
 *
 * MASALAH YANG DIPERBAIKI:
 * Ada dua database di project:
 *   - (default)  us-central1      <- DATA PRODUKSI (130 response). Rules masih "if true" = TERBUKA.
 *   - default    asia-southeast2  <- kosong. Rules sudah aman.
 *
 * Deploy normal Firebase CLI menargetkan database `default`, bukan `(default)`.
 * Karena itu deploy sebelumnya tidak memperbaiki database yang berisi data.
 *
 * Skrip ini memakai Firestore Admin REST API untuk membuat ruleset baru dan
 * melepaskannya (release) ke database `(default)`.
 */
import fs from 'fs'
import crypto from 'crypto'

const env = {}
for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const t = line.trim(); if (!t || t.startsWith('#')) continue
  const i = t.indexOf('='); if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"|"$/g, '')
}
const PROJECT = env.FIREBASE_PROJECT_ID
const KEY = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
const b64url = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

function makeJwt() {
  const now = Math.floor(Date.now() / 1000)
  const h = { alg: 'RS256', typ: 'JWT' }
  const c = {
    iss: env.FIREBASE_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }
  const si = `${b64url(JSON.stringify(h))}.${b64url(JSON.stringify(c))}`
  const s = crypto.createSign('RSA-SHA256'); s.update(si)
  return `${si}.${b64url(s.sign(KEY))}`
}

const tr = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: makeJwt() }),
})
const tj = await tr.json()
if (!tj.access_token) { console.error('TOKEN GAGAL:', tj); process.exit(1) }
const tok = tj.access_token

const firestoreRules = fs.readFileSync('firestore.rules', 'utf8')
const storageRules = fs.readFileSync('storage.rules', 'utf8')

// ---------- 1. Buat ruleset Firestore ----------
const createRule = async (name, content) => {
  const res = await fetch(`https://firebaserules.googleapis.com/v1/projects/${PROJECT}/rulesets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: { files: [{ name, content }] } }),
  })
  const j = await res.json()
  if (!res.ok) throw new Error(`Gagal buat ruleset ${name}: ${JSON.stringify(j).slice(0, 400)}`)
  return j.name
}

console.log('=== 1. Buat ruleset Firestore ===')
const fsRuleset = await createRule('firestore.rules', firestoreRules)
console.log(`  ruleset dibuat: ${fsRuleset}`)

console.log('\n=== 2. Release ke DATABASE (default) us-central1 ===')
const relRes = await fetch(
  `https://firebaserules.googleapis.com/v1/projects/${PROJECT}/releases/cloud.firestore%2F(default)`,
  {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ release: { name: `projects/${PROJECT}/releases/cloud.firestore/(default)`, rulesetName: fsRuleset } }),
  },
)
const relJson = await relRes.json()
if (!relRes.ok) {
  console.log(`  PATCH gagal (${relRes.status}): ${JSON.stringify(relJson).slice(0, 400)}`)
  console.log('  Mencoba POST (buat release baru)...')
  const post = await fetch(`https://firebaserules.googleapis.com/v1/projects/${PROJECT}/releases`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: `projects/${PROJECT}/releases/cloud.firestore/(default)`, rulesetName: fsRuleset }),
  })
  console.log(`  POST status: ${post.status} -> ${JSON.stringify(await post.json()).slice(0, 300)}`)
} else {
  console.log(`  ✅ released: ${relJson.name} | ruleset=${relJson.rulesetName}`)
}

// ---------- 3. Verifikasi ----------
console.log('\n=== 3. Verifikasi release sekarang ===')
const all = await fetch(`https://firebaserules.googleapis.com/v1/projects/${PROJECT}/releases`, {
  headers: { Authorization: `Bearer ${tok}` },
})
const allJson = await all.json()
for (const r of allJson.releases || []) {
  const rs = await fetch(`https://firebaserules.googleapis.com/v1/${r.rulesetName}`, {
    headers: { Authorization: `Bearer ${tok}` },
  })
  const rsJson = await rs.json()
  const content = (rsJson.source?.files || []).map((f) => f.content).join('\n')
  const open = /match\s+\/\{document=\*\*\}[\s\S]{0,150}allow[^;]*if\s+true/.test(content)
  console.log(`  ${r.name}`)
  console.log(`     ukuran=${content.length} | wildcard-if-true=${open ? '⚠️ YA' : 'tidak'} | deny-all=${/if\s+false/.test(content) ? 'YA' : 'tidak'}`)
}

process.exit(0)
