/**
 * UJI RULES PRODUKSI — CARA BENAR (Firebase Web SDK).
 *
 * Security rules HANYA dievaluasi oleh Firebase SDK klien, bukan REST API.
 * Skrip ini memakai Web SDK tanpa login (anonim) sehingga request.auth == null,
 * persis seperti pengunjung publik.
 *
 * Hanya melakukan READ + percobaan WRITE ke collection uji sementara
 * (`rules_probe`) yang tidak dipakai aplikasi, lalu membersihkannya.
 */
const PROJECT = 'desa-sehat-2026'

async function main() {
  const { initializeApp } = await import('firebase/app')
  const { getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, limit, query } = await import('firebase/firestore')

  const app = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: PROJECT,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  })
  const db = getFirestore(app)

  const result = []
  const rec = (name, ok, detail) => {
    result.push({ name, ok, detail })
    console.log(`  ${ok ? '✅' : '❌'} ${name.padEnd(44)} ${detail}`)
  }

  async function canRead(path, id) {
    try {
      if (id) { await getDoc(doc(db, path, id)); return { ok: true } }
      await getDocs(query(collection(db, path), limit(1)))
      return { ok: true }
    } catch (e) {
      return { ok: false, code: e?.code || String(e) }
    }
  }

  async function canWrite(path, id, data) {
    try {
      await setDoc(doc(db, path, id), data)
      return { ok: true }
    } catch (e) {
      return { ok: false, code: e?.code || String(e) }
    }
  }

  console.log('\n========== UJI RULES PRODUKSI via Web SDK (tanpa login) ==========\n')

  console.log('--- A. Baca data publik (harus BERHASIL) ---')
  let r = await canRead('settings')
  rec('BACA settings', r.ok, r.ok ? 'berhasil (benar)' : `gagal: ${r.code}`)
  r = await canRead('article_categories')
  rec('BACA article_categories', r.ok, r.ok ? 'berhasil (benar)' : `gagal: ${r.code}`)
  r = await canRead('form_registry')
  rec('BACA form_registry', r.ok, r.ok ? 'berhasil (benar)' : `gagal: ${r.code}`)

  console.log('\n--- B. Baca data internal (harus GAGAL) ---')
  r = await canRead('users')
  rec('BACA users', !r.ok, r.ok ? 'BERHASIL -> CELAH' : `ditolak (benar): ${r.code}`)
  r = await canRead('responses')
  rec('BACA responses', !r.ok, r.ok ? 'BERHASIL -> CELAH' : `ditolak (benar): ${r.code}`)
  r = await canRead('distributions')
  rec('BACA distributions', !r.ok, r.ok ? 'BERHASIL -> CELAH' : `ditolak (benar): ${r.code}`)
  r = await canRead('partnerships')
  rec('BACA partnerships', !r.ok, r.ok ? 'BERHASIL -> CELAH' : `ditolak (benar): ${r.code}`)
  r = await canRead('forms', '3F0Gp3cxlmXpp0uk7blI')
  rec('BACA forms (draft milik orang lain)', !r.ok, r.ok ? 'BERHASIL -> CELAH' : `ditolak (benar): ${r.code}`)
  r = await canRead('forms', '3F0Gp3cxlmXpp0uk7blI')
  // subcollection versions (kunci jawaban)
  try {
    await getDocs(query(collection(db, 'forms', '3F0Gp3cxlmXpp0uk7blI', 'versions'), limit(1)))
    rec('BACA forms/*/versions (kunci jawaban)', false, 'BERHASIL -> CELAH')
  } catch (e) {
    rec('BACA forms/*/versions (kunci jawaban)', true, `ditolak (benar): ${e?.code || e}`)
  }

  console.log('\n--- C. Tulis sebagai publik (harus GAGAL) ---')
  const probeId = `probe_${Date.now()}`
  r = await canWrite('settings', probeId, { probe: true })
  rec('TULIS settings', !r.ok, r.ok ? 'BERHASIL -> CELAH' : `ditolak (benar): ${r.code}`)
  if (r.ok) await deleteDoc(doc(db, 'settings', probeId)).catch(() => {})

  r = await canWrite('responses', probeId, { probe: true })
  rec('TULIS responses', !r.ok, r.ok ? 'BERHASIL -> CELAH' : `ditolak (benar): ${r.code}`)
  if (r.ok) await deleteDoc(doc(db, 'responses', probeId)).catch(() => {})

  r = await canWrite('users', probeId, { role: 'super_admin' })
  rec('TULIS users (eskalasi role)', !r.ok, r.ok ? 'BERHASIL -> CELAH KRITIS' : `ditolak (benar): ${r.code}`)
  if (r.ok) await deleteDoc(doc(db, 'users', probeId)).catch(() => {})

  r = await canWrite('articles', probeId, { probe: true })
  rec('TULIS articles', !r.ok, r.ok ? 'BERHASIL -> CELAH' : `ditolak (benar): ${r.code}`)
  if (r.ok) await deleteDoc(doc(db, 'articles', probeId)).catch(() => {})

  r = await canWrite('form_registry', probeId, { probe: true })
  rec('TULIS form_registry', !r.ok, r.ok ? 'BERHASIL -> CELAH' : `ditolak (benar): ${r.code}`)
  if (r.ok) await deleteDoc(doc(db, 'form_registry', probeId)).catch(() => {})

  const failed = result.filter((x) => !x.ok)
  console.log(`\nHASIL: ${result.length - failed.length} SESUAI / ${failed.length} CELAH`)
  if (failed.length) {
    console.log('\n⚠️  CELAH KEAMANAN:')
    failed.forEach((f) => console.log(`  ❌ ${f.name}: ${f.detail}`))
  }
  process.exit(failed.length ? 1 : 0)
}

main().catch((e) => { console.error('GAGAL menjalankan uji:', e); process.exit(2) })
