/**
 * UJI EMPIRIS RULES PRODUKSI (tanpa auth = sebagai publik).
 *
 * Memakai Firestore REST API langsung ke produksi. Request TANPA token
 * membuat rules dievaluasi dengan request.auth == null — persis seperti
 * pengunjung publik.
 *
 * Yang diuji:
 *   1. Baca data publik (settings, article_categories, form_registry) -> harus BOLEH
 *   2. Tulis data publik (settings, form_registry) -> harus DITOLAK
 *   3. Baca users, responses, distributions -> harus DITOLAK
 *   4. Tulis responses -> harus DITOLAK
 *   5. Hapus apa pun -> harus DITOLAK
 */
const PROJECT = 'desa-sehat-2026'
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`

async function testRead(path) {
  const res = await fetch(`${BASE}/${path}?pageSize=1`)
  return res.status
}

async function testWrite(path, body) {
  const res = await fetch(`${BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.status
}

async function testDelete(path) {
  const res = await fetch(`${BASE}/${path}`, { method: 'DELETE' })
  return res.status
}

const ts = new Date().toISOString()
const result = []
const check = (name, status, expectAllowed) => {
  const allowed = status >= 200 && status < 300
  const ok = allowed === expectAllowed
  result.push({ name, status, expect: expectAllowed ? 'BOLEH' : 'DITOLAK', ok })
  console.log(`  ${ok ? '✅' : '❌'} ${name.padEnd(46)} HTTP ${status} | harapan: ${expectAllowed ? 'BOLEH' : 'DITOLAK'}`)
}

console.log('\n========== UJI RULES FIRESTORE PRODUKSI (tanpa auth) ==========\n')

console.log('--- A. Data publik (harus BOLEH dibaca) ---')
check('GET settings (publik)', await testRead('settings'), true)
check('GET article_categories (publik)', await testRead('article_categories'), true)
check('GET form_registry (publik)', await testRead('form_registry'), true)

console.log('\n--- B. Data internal (harus DITOLAK dibaca) ---')
check('GET users (internal)', await testRead('users'), false)
check('GET responses (internal)', await testRead('responses'), false)
check('GET distributions (internal)', await testRead('distributions'), false)
check('GET partnerships (internal)', await testRead('partnerships'), false)
check('GET form_access (internal)', await testRead('form_access'), false)

console.log('\n--- C. Tulis data publik (harus DITOLAK) ---')
check('POST settings (tulis publik)', await testWrite('settings', { fields: { hacker_test: { stringValue: ts } } }), false)
check('POST form_registry (tulis publik)', await testWrite('form_registry', { fields: { hacker_test: { stringValue: ts } } }), false)
check('POST article_categories (tulis publik)', await testWrite('article_categories', { fields: { hacker_test: { stringValue: ts } } }), false)

console.log('\n--- D. Tulis data internal sebagai publik (harus DITOLAK) ---')
check('POST responses (publik)', await testWrite('responses', { fields: { hacker_test: { stringValue: ts } } }), false)
check('POST users (publik)', await testWrite('users', { fields: { role: { stringValue: 'super_admin' } } }), false)
check('POST articles (publik)', await testWrite('articles', { fields: { hacker_test: { stringValue: ts } } }), false)

console.log('\n--- E. Hapus sebagai publik (harus DITOLAK) ---')
check('DELETE settings (publik)', await testDelete('settings'), false)
check('DELETE responses (publik)', await testDelete('responses'), false)

const failed = result.filter((r) => !r.ok)
console.log(`\nHASIL: ${result.length - failed.length} SESUAI / ${failed.length} TIDAK SESUAI`)
if (failed.length) {
  console.log('\n⚠️  PELANGGARAN KEAMANAN:')
  failed.forEach((f) => console.log(`  ❌ ${f.name}: HTTP ${f.status} (harapan ${f.expect})`))
}
process.exit(failed.length ? 1 : 0)
