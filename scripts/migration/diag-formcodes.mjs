import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const db = getFirestore(initializeApp({ projectId: 'desa-sehat-2026' }))
db.settings({ host: 'localhost:8090', ssl: false })

const fs = await db.collection('forms').get()
console.log('=== FORMS ===')
fs.forEach(d => {
  const x = d.data()
  console.log(`  id=${d.id} | code=${x.code || '-'} | normalizedCode=${x.normalizedCode || '-'} | title=${x.metadata?.title || x.title || '-'}`)
})

console.log('\n=== sample RESPONSE lengkap ===')
const rs = await db.collection('responses').limit(2).get()
rs.forEach(d => {
  const r = d.data()
  console.log(JSON.stringify({
    id: d.id, formId: r.formId, distributionCode: r.distributionCode, formCode: r.formCode,
    distributionId: r.distributionId, ownerId: r.ownerId, status: r.status, versionId: r.versionId,
  }, null, 2))
})

console.log('\n=== apakah formCode di response cocok dgn forms? ===')
const codes = new Set()
fs.forEach(d => { const x=d.data(); [x.code, x.normalizedCode].filter(Boolean).forEach(v=>codes.add(String(v).toUpperCase())) })
const rs2 = await db.collection('responses').get()
const counter = {}
let withFormCode = 0
rs2.forEach(d => {
  const r = d.data()
  const c = r.formCode || '(none)'
  counter[c] = (counter[c]||0)+1
  if (r.formCode) withFormCode++
})
console.log('responses punya formCode:', withFormCode, '/', rs2.size)
for (const [c,n] of Object.entries(counter)) console.log(`  ${String(n).padStart(4)} ${c} ${codes.has(String(c).toUpperCase())?'✅':'❌'}`)
process.exit(0)
