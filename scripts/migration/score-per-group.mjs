import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
const db = getFirestore(initializeApp({ projectId: 'desa-sehat-2026' }))
db.settings({ host: 'localhost:8090', ssl: false })

const fs = await db.collection('forms').get()
const formMap = new Map()
for (const d of fs.docs) formMap.set(d.id, { id: d.id, title: d.data().title, code: d.data().code })

const rs = await db.collection('responses').get()

// Kelompokkan per form, hitung overall + per aspek (raw poin)
const groups = new Map()
for (const d of rs.docs) {
  const r = d.data()
  const form = formMap.get(r.formId)
  if (!form) continue
  const key = form.title
  if (!groups.has(key)) groups.set(key, { overall: [], aspects: {} })
  const g = groups.get(key)
  g.overall.push(r.result?.percentage || 0)
  for (const a of (r.result?.aspects || [])) {
    if (a.maximumScore === 0) continue
    if (!g.aspects[a.title]) g.aspects[a.title] = { raw: 0, max: 0 }
    g.aspects[a.title].raw += a.rawScore
    g.aspects[a.title].max += a.maximumScore
  }
}

console.log('=== SKOR SISTEM PER FORMULIR ===\n')
for (const [title, g] of groups.entries()) {
  const n = g.overall.length
  const avgOverall = (g.overall.reduce((s,x)=>s+x,0) / n)
  console.log(`--- ${title} (${n}) ---`)
  console.log(`  Overall: ${avgOverall.toFixed(2)}%`)
  for (const [aspek, {raw, max}] of Object.entries(g.aspects)) {
    console.log(`  ${aspek}: ${raw}/${max} = ${(raw/max*100).toFixed(1)}%`)
  }
  console.log()
}
process.exit(0)
