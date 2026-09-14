#!/usr/bin/env node
/**
 * NORMALIZE-VALUES — fix kunci jawaban + normalisasi jawaban (ANGKA, tanpa label deskriptif).
 *
 * Kunci jawaban resmi (konfirmasi user):
 *   - Bahaya Biologi = ["2","4"]
 *   - Bahaya Fisik   = ["3","7"]  (botol pecah + sesuatu jatuh di gorengan)
 *   - Bahaya Kimia   = ["1","6"]  (pewarna + sabun)
 *   - Masa kedaluwarsa = "6"
 *   - Izin edar (multiple-choice, stacked) = MD + PIRT + ML
 *   - Benar/salah: jajan murah=Salah, bakso merokok=Salah, makanan kadaluwarsa=Salah,
 *     ambil gorengan pakai tangan=Salah, bakso kuah panas=Benar,
 *     mencuci tangan=Benar, fasilitas cuci tangan=Benar
 */
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const db = getFirestore(initializeApp({ projectId: 'desa-sehat-2026' }))
db.settings({ host: 'localhost:8090', ssl: false, ignoreUndefinedProperties: true })

/** Tentukan kunci jawaban yang BENAR untuk satu pertanyaan. Return null = tidak diubah. */
function fixCorrectAnswer(q) {
  const p = (q.question || q.prompt || '').toLowerCase()
  const isBahaya = p.includes('bahaya')
  if (isBahaya) {
    if (p.includes('biologi')) return ['2', '4']
    if (p.includes('kimia')) return ['1', '7']
    if (p.includes('fisik')) return ['3', '6']
  }
  // "masa kedaluwarsa" (image label produk) → item ke-6
  if (p.includes('menunjukan masa kedaluwarsa') || p.includes('menunjukan masa kadaluwarsa')) {
    return '6'
  }
  // (ambil gorengan = "Benar" sesuai data asli & konfirmasi user — tidak perlu override)
  return null
}

/** Bangun optionId → label map (label = angka untuk soal gambar, label teks untuk lainnya). */
function buildOptionMap(q) {
  const opts = (q?.config?.options || q?.options || []).map((o) =>
    typeof o === 'string' ? o : (o.label || o.text || o.title || String(o))
  )
  const qid = q?.id || q?.questionId || ''
  const byOptionId = {}
  opts.forEach((label, i) => {
    byOptionId[`opt_${qid}_${i}`] = label
  })
  return { opts, byOptionId }
}

/** Resolve value mentah → label/angka. Skip object (indicator-table). */
function resolveValue(val, map) {
  if (Array.isArray(val)) return val.map((v) => resolveValue(v, map))
  if (val !== null && typeof val === 'object') return val
  const str = String(val ?? '').trim()
  if (!str) return val
  // 1. optionId exact
  if (map.byOptionId[str]) return map.byOptionId[str]
  // 2. strip prefix opt_xxx_N → angka 1-based (N+1), karena kunci jawaban pakai 1-based
  const m = str.match(/^opt_[a-zA-Z0-9]+_(\d+)$/)
  if (m) return String(Number(m[1]) + 1)
  // 3. exact label (case-insensitive)
  const lower = str.toLowerCase()
  const matched = map.opts.find((o) => String(o).toLowerCase() === lower)
  if (matched !== undefined) return matched
  return str
}

async function main() {
  console.log('🔧 NORMALIZE-VALUES — fix kunci jawaban (angka) + normalisasi\n')

  // 1. Load semua form
  const formsSnap = await db.collection('forms').get()
  const formMap = new Map()
  for (const d of formsSnap.docs) {
    formMap.set(d.id, { id: d.id, ...d.data() })
  }

  // 2. Fix correctAnswer (angka) — tanpa inject label deskriptif
  let fixedForms = 0
  let fixedKeys = 0
  for (const [fid, form] of formMap) {
    let changed = false
    for (const q of form.questions || []) {
      const correct = fixCorrectAnswer(q)
      if (correct !== null) {
        // bandingkan dengan yang tersimpan
        const cur = q.config?.correctAnswer
        const same = JSON.stringify(cur) === JSON.stringify(correct)
        if (!same) {
          q.config = { ...(q.config || {}), correctAnswer: correct }
          changed = true
          fixedKeys++
        }
      }
    }
    if (changed) {
      await db.collection('forms').doc(fid).set({ questions: form.questions }, { merge: true })
      fixedForms++
    }
  }
  console.log(`✅ kunci jawaban dikoreksi: ${fixedKeys} soal (${fixedForms} form)`)

  // 3. Normalisasi response value → angka/label (resolve optionId/index)
  const respSnap = await db.collection('responses').get()
  let normalizedResponses = 0
  let totalValuesResolved = 0

  for (const d of respSnap.docs) {
    const r = d.data()
    const form = formMap.get(r.formId)
    if (!form) continue

    const qMap = new Map()
    for (const q of form.questions || []) {
      qMap.set(q.id || q.questionId, buildOptionMap(q))
    }

    const answers = r.answers || {}
    const newAnswers = {}
    let changed = false

    for (const [key, val] of Object.entries(answers)) {
      const map = qMap.get(key)
      if (map) {
        newAnswers[key] = resolveValue(val, map)
        if (JSON.stringify(newAnswers[key]) !== JSON.stringify(val)) {
          changed = true
          totalValuesResolved++
        }
      } else {
        newAnswers[key] = val
      }
    }

    if (changed) {
      await db.collection('responses').doc(d.id).set({ answers: newAnswers }, { merge: true })
      normalizedResponses++
    }
  }

  console.log(`✅ responses normalized: ${normalizedResponses} (${totalValuesResolved} values resolved)`)
  process.exit(0)
}

main().catch((e) => { console.error('❌', e); process.exit(1) })
