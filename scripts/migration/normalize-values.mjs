#!/usr/bin/env node
/**
 * NORMALIZE-VALUES — unifikasi total jawaban → LABEL TEKS (single source of truth).
 *
 * Masalah 2 tipe data:
 *   - v1.5 (UUID resp_): key=questionId, value=optionId "opt_xxx_N"
 *   - legacy (non-UUID): key=teks pertanyaan, value=index "3" / label "Salah"
 *
 * Solusi: resolve SEMUA value → label opsi teks.
 *   - optionId "opt_ooqig4b_5" → label opsi ke-6 dari form
 *   - index "3" → label opsi ke-3 (1-based)
 *   - label "Salah" → tetap "Salah"
 *
 * Juga inject label "bahaya" (1-7) ke form agar resolve berhasil.
 *
 * Usage: FIRESTORE_EMULATOR_HOST=localhost:8090 npx tsx scripts/migration/normalize-values.mjs
 */
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const db = getFirestore(initializeApp({ projectId: 'desa-sehat-2026' }))
db.settings({ host: 'localhost:8090', ssl: false, ignoreUndefinedProperties: true })

const BAHAYA_LABELS = [
  'Methanil Yellow (pewarna tekstil)',
  'Mikroba / kuman',
  'Serangga / hama',
  'Kontaminasi dari tangan',
  'MSG (Monosodium Glutamate)',
  'Pecahan kaca',
  'Sabun cuci tangan',
]

const KEDALUWARSA_LABELS = [
  'Nama Produk + Brand',
  'Informasi Produsen',
  'Komposisi (bahan-bahan)',
  'Cara Penyajian',
  'Tanggal + Kode Produksi',
  'Masa Kedaluwarsa',
]

function isBahayaQuestion(q) {
  const opts = q?.config?.options || q?.options || []
  if (!Array.isArray(opts) || opts.length !== 7) return false
  const allNumeric = opts.every((o, i) => String(o).trim() === String(i + 1))
  if (!allNumeric) return false
  const caption = (q?.media?.caption || '').toLowerCase()
  const prompt = (q?.question || q?.prompt || '').toLowerCase()
  return caption.includes('bahaya') || prompt.includes('bahaya')
}

function isKedaluwarsaQuestion(q) {
  const opts = q?.config?.options || q?.options || []
  if (!Array.isArray(opts) || opts.length !== 6) return false
  const allNumeric = opts.every((o, i) => String(o).trim() === String(i + 1))
  if (!allNumeric) return false
  const prompt = (q?.question || q?.prompt || '').toLowerCase()
  return prompt.includes('kedaluwarsa') || prompt.includes('kadaluwarsa')
}

/** Bangun optionId → label map untuk satu question (canonical). */
function buildOptionMap(q) {
  const map = { byOptionId: {}, byIndex: {}, byLabel: {} }
  let opts = []
  if (isBahayaQuestion(q)) {
    opts = BAHAYA_LABELS
  } else if (isKedaluwarsaQuestion(q)) {
    opts = KEDALUWARSA_LABELS
  } else {
    opts = (q?.config?.options || q?.options || []).map((o) =>
      typeof o === 'string' ? o : (o.label || o.text || o.title || String(o))
    )
  }
  const qid = q?.id || q?.questionId || ''
  opts.forEach((label, i) => {
    const optId = `opt_${qid}_${i}`
    map.byOptionId[optId] = label
    map.byIndex[String(i + 1)] = label  // 1-based index
    map.byIndex[String(i)] = label      // 0-based index (legacy)
    map.byLabel[label.toLowerCase()] = label
    map.byLabel[String(label).toLowerCase()] = label
  })
  return map
}

/** Resolve satu value mentah → label teks. Skip object (indicator-table/likert). */
function resolveValue(val, map) {
  if (Array.isArray(val)) return val.map((v) => resolveValue(v, map))
  // Jangan sentuh object (indicator-table / likert map)
  if (val !== null && typeof val === 'object') return val
  const str = String(val ?? '').trim()
  if (!str) return val
  // 1. optionId
  if (map.byOptionId[str]) return map.byOptionId[str]
  // 2. index (1-based / 0-based)
  if (map.byIndex[str]) return map.byIndex[str]
  // 3. label (case-insensitive)
  if (map.byLabel[str.toLowerCase()]) return map.byLabel[str.toLowerCase()]
  // 4. strip prefix "opt_xxx_N" → coba index
  const m = str.match(/^opt_[a-zA-Z0-9]+_(\d+)$/)
  if (m && map.byIndex[m[1]]) return map.byIndex[m[1]]
  return str
}

async function main() {
  console.log('🔧 NORMALIZE-VALUES — unifikasi jawaban → label\n')

  // 1. Load semua form, bangun questionId → optionMap
  const formsSnap = await db.collection('forms').get()
  const formMap = new Map()
  for (const d of formsSnap.docs) {
    formMap.set(d.id, { id: d.id, ...d.data() })
  }

  // 2. Enrich form "bahaya" + "kedaluwarsa" — inject label + resolve correctAnswer index → label
  let enrichedForms = 0
  for (const [fid, form] of formMap) {
    let changed = false
    for (const q of form.questions || []) {
      if (isBahayaQuestion(q)) {
        const correct = q.config?.correctAnswer
        q.config = { ...(q.config || {}), options: BAHAYA_LABELS }
        // resolve correctAnswer index (1-based) → label
        if (correct !== undefined && correct !== '' ) {
          const items = Array.isArray(correct) ? correct : [correct]
          const resolved = items.map((c) => {
            const n = Number(c)
            if (!isNaN(n) && n >= 1 && n <= BAHAYA_LABELS.length) return BAHAYA_LABELS[n - 1]
            return c
          })
          q.config.correctAnswer = Array.isArray(correct) ? resolved : resolved[0]
        }
        changed = true
      } else if (isKedaluwarsaQuestion(q)) {
        const correct = q.config?.correctAnswer
        q.config = { ...(q.config || {}), options: KEDALUWARSA_LABELS }
        if (correct !== undefined && correct !== '' ) {
          const items = Array.isArray(correct) ? correct : [correct]
          const resolved = items.map((c) => {
            const n = Number(c)
            if (!isNaN(n) && n >= 1 && n <= KEDALUWARSA_LABELS.length) return KEDALUWARSA_LABELS[n - 1]
            return c
          })
          q.config.correctAnswer = Array.isArray(correct) ? resolved : resolved[0]
        }
        changed = true
      }
    }
    if (changed) {
      await db.collection('forms').doc(fid).set({ questions: form.questions }, { merge: true })
      enrichedForms++
    }
  }
  console.log(`✅ forms enriched (bahaya + kedaluwarsa labels + correctAnswer resolve): ${enrichedForms}`)

  // 3. Normalisasi semua response value → label
  const respSnap = await db.collection('responses').get()
  let normalizedResponses = 0
  let totalValuesResolved = 0

  for (const d of respSnap.docs) {
    const r = d.data()
    const form = formMap.get(r.formId)
    if (!form) continue

    // Build questionId → optionMap (refresh dari enriched form)
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
