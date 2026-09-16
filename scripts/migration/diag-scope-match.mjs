import fs from 'fs'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const db = getFirestore(initializeApp({ projectId: 'desa-sehat-2026' }))
db.settings({ host: 'localhost:8090', ssl: false })

const ds = await db.collection('distributions').get()
console.log('=== DISTRIBUTIONS (kode tersedia) ===')
const codes = new Set()
ds.forEach(d => {
  const x = d.data()
  const c = [x.code, x.distributionCode, x.normalizedCode].filter(Boolean)
  c.forEach(v => codes.add(String(v).toUpperCase()))
  console.log(`  id=${d.id} | code=${x.code || '-'} | distCode=${x.distributionCode || '-'} | ownerId=${x.ownerId || '-'} | ownerType=${x.ownerType || '-'}`)
})
console.log('kode unik:', [...codes])

const rs = await db.collection('responses').get()
console.log('\n=== RESPONSES: distributionCode vs distribusi ===')
const byCode = {}
let noCode = 0
rs.forEach(d => {
  const r = d.data()
  const c = r.distributionCode || r.formCode || '(none)'
  byCode[c] = (byCode[c] || 0) + 1
  if (c === '(none)') noCode++
})
for (const [c, n] of Object.entries(byCode)) {
  const matched = codes.has(String(c).toUpperCase())
  console.log(`  ${String(n).padStart(4)}  ${c}  ${matched ? '✅ cocok' : '❌ TIDAK cocok'}`)
}
console.log('\ntanpa kode sama sekali:', noCode)
process.exit(0)
