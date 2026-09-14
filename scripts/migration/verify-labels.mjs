import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
const db = getFirestore(initializeApp({ projectId: 'desa-sehat-2026' }))
db.settings({ host: 'localhost:8090', ssl: false })

// Verifikasi: SEMUA jawaban = label teks (bukan opt_ / id / index mentah)
const s = await db.collection('responses').get()
let optLeak = 0, numericLeak = 0, idPattern = 0
const leaks = []

for (const d of s.docs) {
  const r = d.data()
  for (const [qid, val] of Object.entries(r.answers || {})) {
    const vals = Array.isArray(val) ? val : [val]
    for (const v of vals) {
      if (v === null || typeof v === 'object') continue
      const str = String(v)
      if (str.includes('opt_')) { optLeak++; leaks.push([d.id, qid, str]); }
      if (/^\d+$/.test(str.trim()) && !str.includes('.')) { numericLeak++; leaks.push([d.id, qid, str]); }
      if (/^q_\d|_option_|optionId/.test(str)) { idPattern++; }
    }
  }
}

console.log('=== VERIFIKASI LABEL (130 response) ===')
console.log('opt_ leak:', optLeak)
console.log('numeric-only leak:', numericLeak)
console.log('id-pattern leak:', idPattern)

if (leaks.length > 0) {
  console.log('\n=== contoh leak ===')
  for (const l of leaks.slice(0, 20)) console.log('  ', l.join(' → '))
} else {
  console.log('\n✅ SEMUA jawaban sudah label teks (tidak ada id/angka/optionId)')
}

// Sample jawaban bahaya fisik (wxrt7q6) untuk konfirmasi label
const s2 = await db.collection('responses').where('formId','==','HPSpuvMNuUmopVoPY2lr').limit(3).get()
console.log('\n=== sample jawaban (bahaya + izin edar) ===')
for (const d of s2.docs) {
  const r = d.data()
  const a = r.answers || {}
  console.log(`  ${d.id}:`)
  for (const k of ['wxrt7q6','jjn3cdx','t4bkvug','wqtota6']) {
    if (a[k] !== undefined) console.log(`    ${k} = ${JSON.stringify(a[k])}`)
  }
}
process.exit(0)
