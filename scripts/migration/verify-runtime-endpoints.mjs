/**
 * Verifikasi RUNTIME endpoint ringkasan & paged (butuh dev server + emulator).
 * Membuat sesi super_admin sementara di emulator, memanggil endpoint, lalu bersih-bersih.
 */
import { initializeApp, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8090'
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099'

const app = getApps().length ? getApps()[0] : initializeApp({ projectId: 'desa-sehat-2026' })
const db = getFirestore(app)
try { db.settings({ host: 'localhost:8090', ssl: false, ignoreUndefinedProperties: true }) } catch {}
const auth = getAuth(app)

const BASE = 'http://localhost:3000'
const EMAIL = `verify-${Date.now()}@kknt-kp.test`
const PASSWORD = 'VerifyPass123!'

const rec = await auth.createUser({ email: EMAIL, password: PASSWORD, displayName: 'Verifikasi Endpoint' })
await db.collection('users').doc(rec.uid).set({
  uid: rec.uid, email: EMAIL, displayName: 'Verifikasi Endpoint', role: 'super_admin',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
})

function parseCookie(res) {
  const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : []
  const all = raw.length ? raw : [res.headers.get('set-cookie') || '']
  return all.map((c) => String(c).split(';')[0]).filter(Boolean).join('; ')
}

try {
  // 1. Login lewat API untuk dapat cookie sesi
  const loginRes = await fetch(`${BASE}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: await auth.createCustomToken(rec.uid) }),
  })
  let cookie = parseCookie(loginRes)

  // Bila endpoint sesi butuh ID token, pakai jalur login biasa
  if (!cookie) {
    const alt = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    })
    cookie = parseCookie(alt)
  }

  const h = cookie ? { Cookie: cookie } : {}

  // 2. Endpoint ringkasan
  const summary = await fetch(`${BASE}/api/responses/analytics`, { headers: h })
  const summaryJson = await summary.json().catch(() => null)
  console.log(`\n[1] GET /api/responses/analytics -> HTTP ${summary.status}`)
  if (summaryJson?.data) {
    console.log(`    total=${summaryJson.data.total} submitted=${summaryJson.data.submitted} forms=${summaryJson.data.formsCount}`)
    console.log(`    breakdown: ${summaryJson.data.breakdown?.length || 0} form`)
  } else {
    console.log(`    body: ${JSON.stringify(summaryJson).slice(0, 200)}`)
  }

  // 3. Endpoint paged
  const paged = await fetch(`${BASE}/api/responses?paged=true&limit=25&status=all`, { headers: h })
  const pagedJson = await paged.json().catch(() => null)
  console.log(`\n[2] GET /api/responses?paged=true&limit=25 -> HTTP ${paged.status}`)
  if (pagedJson?.responses) {
    const first = pagedJson.responses[0]
    console.log(`    items=${pagedJson.responses.length} hasMore=${pagedJson.hasMore} total=${pagedJson.total}`)
    console.log(`    payload item punya answers? ${first && Object.keys(first.answers || {}).length > 0 ? 'YA (proyeksi gagal)' : 'TIDAK (proyeksi benar)'}`)
    console.log(`    item bytes ~ ${first ? JSON.stringify(first).length : 0}`)
  } else {
    console.log(`    body: ${JSON.stringify(pagedJson).slice(0, 200)}`)
  }

  // 4. Telemetri
  const obs = await fetch(`${BASE}/api/observability/queries`, { headers: h })
  const obsJson = await obs.json().catch(() => null)
  console.log(`\n[3] GET /api/observability/queries -> HTTP ${obs.status}`)
  if (obsJson?.data) {
    console.log(`    endpoint tercatat: ${obsJson.data.summary?.length || 0}`)
    ;(obsJson.data.summary || []).slice(0, 5).forEach((r) => console.log(`      ${r.endpoint} | calls=${r.calls} reads=${r.totalReads} avgMs=${r.avgMs}`))
  }
} finally {
  await db.collection('users').doc(rec.uid).delete().catch(() => {})
  await auth.deleteUser(rec.uid).catch(() => {})
}
process.exit(0)
