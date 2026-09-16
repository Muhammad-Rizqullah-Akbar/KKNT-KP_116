/**
 * Ambil RULES YANG BENAR-BENAR TER-DEPLOY di produksi via Firebase Rules API.
 * Ini sumber kebenaran (ground truth), bukan file lokal.
 */
import fs from 'fs'
import crypto from 'crypto'

const env = {}
for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const t = line.trim(); if (!t || t.startsWith('#')) continue
  const i = t.indexOf('='); if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"|"$/g, '')
}
const PROJECT = env.FIREBASE_PROJECT_ID
const b64url = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

function jwt(scope) {
  const now = Math.floor(Date.now() / 1000)
  const h = { alg: 'RS256', typ: 'JWT' }
  const c = { iss: env.FIREBASE_CLIENT_EMAIL, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }
  const si = `${b64url(JSON.stringify(h))}.${b64url(JSON.stringify(c))}`
  const s = crypto.createSign('RSA-SHA256'); s.update(si)
  return `${si}.${b64url(s.sign(env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')))}`
}

async function token(scope) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt(scope) }),
  })
  const j = await r.json()
  if (!j.access_token) throw new Error(JSON.stringify(j))
  return j.access_token
}

const tok = await token('https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase')

// === FIRESTORE RULES ===
console.log('========== FIRESTORE RULES YANG TER-DEPLOY ==========\n')
try {
  const rel = await fetch(`https://firebaserules.googleapis.com/v1/projects/${PROJECT}/releases`, {
    headers: { Authorization: `Bearer ${tok}` },
  })
  const relJson = await rel.json()
  const releases = relJson.releases || []
  for (const r of releases) {
    if (!String(r.name).includes('cloud.firestore')) continue
    console.log(`Release : ${r.name}`)
    console.log(`Ruleset : ${r.rulesetName}`)
    console.log(`Waktu   : ${r.updateTime}`)
    const rs = await fetch(`https://firebaserules.googleapis.com/v1/${r.rulesetName}`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
    const rsJson = await rs.json()
    const files = rsJson.source?.files || []
    files.forEach((f) => {
      console.log(`\n--- ${f.name} ---`)
      console.log(f.content)
    })
  }
  if (!releases.length) console.log('Tidak ada release ditemukan')
} catch (e) {
  console.log('GAGAL ambil firestore rules:', e.message)
}

// === STORAGE RULES ===
console.log('\n\n========== STORAGE RULES YANG TER-DEPLOY ==========\n')
try {
  const rel = await fetch(`https://firebaserules.googleapis.com/v1/projects/${PROJECT}/releases`, {
    headers: { Authorization: `Bearer ${tok}` },
  })
  const relJson = await rel.json()
  for (const r of relJson.releases || []) {
    if (!String(r.name).includes('firebase.storage')) continue
    console.log(`Release : ${r.name}`)
    const rs = await fetch(`https://firebaserules.googleapis.com/v1/${r.rulesetName}`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
    const rsJson = await rs.json()
    ;(rsJson.source?.files || []).forEach((f) => {
      console.log(`\n--- ${f.name} ---`)
      console.log(f.content)
    })
  }
} catch (e) {
  console.log('GAGAL ambil storage rules:', e.message)
}
process.exit(0)
