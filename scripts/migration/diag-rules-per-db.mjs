/**
 * Periksa rules per-DATABASE (bukan hanya per-project).
 * Ada dua database: (default) dan default.
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
  const c = { iss: env.FIREBASE_CLIENT_EMAIL, scope: 'https://www.googleapis.com/auth/cloud-platform', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }
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

// 1. Semua database
const dbRes = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases`, {
  headers: { Authorization: `Bearer ${tok}` },
})
const dbJson = await dbRes.json()
console.log('========== DATABASE ==========')
;(dbJson.databases || []).forEach((d) => console.log(`  ${d.name} | tipe=${d.type} | lokasi=${d.locationId}`))

// 2. Semua release rules
const relRes = await fetch(`https://firebaserules.googleapis.com/v1/projects/${PROJECT}/releases`, {
  headers: { Authorization: `Bearer ${tok}` },
})
const relJson = await relRes.json()
console.log('\n========== RELEASE RULES ==========')
const releases = relJson.releases || []
if (!releases.length) console.log('  (tidak ada release)')
releases.forEach((r) => console.log(`  ${r.name}\n     ruleset=${r.rulesetName} | waktu=${r.updateTime}`))

// 3. Isi ruleset tiap release firestore
for (const r of releases) {
  if (!String(r.name).includes('firestore') && !String(r.name).includes('storage')) continue
  const rs = await fetch(`https://firebaserules.googleapis.com/v1/${r.rulesetName}`, {
    headers: { Authorization: `Bearer ${tok}` },
  })
  const rsJson = await rs.json()
  const files = rsJson.source?.files || []
  const total = files.reduce((n, f) => n + String(f.content || '').length, 0)
  const hasWildcardTrue = files.some((f) => /match\s+\/\{document=\*\*\}[\s\S]{0,120}allow[^;]*if\s+true/.test(String(f.content)))
  const hasDenyAll = files.some((f) => /match\s+\/\{document=\*\*\}[\s\S]{0,120}allow[^;]*if\s+false/.test(String(f.content)))
  console.log(`\n  --- ${r.name} ---`)
  console.log(`     ukuran rules: ${total} karakter`)
  console.log(`     ada pola "wildcard if true": ${hasWildcardTrue ? '⚠️ YA' : 'tidak'}`)
  console.log(`     ada deny-all fallback     : ${hasDenyAll ? 'YA (baik)' : 'tidak'}`)
}

process.exit(0)
