/**
 * DIAGNOSA: kenapa uji SDK melaporkan tulis berhasil?
 * Memeriksa apakah SDK memakai cache lokal (tanpa server) atau benar-benar ke server.
 */
const PROJECT = 'desa-sehat-2026'

async function main() {
  const { initializeApp, deleteApp } = await import('firebase/app')
  const fsMod = await import('firebase/firestore')

  const app = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: PROJECT,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  })
  const db = fsMod.getFirestore(app)

  const id = `diag_${Date.now()}`
  console.log('Mencoba menulis dokumen diagnosa:', id)

  try {
    await fsMod.setDoc(fsMod.doc(db, 'settings', id), { diag: true })
    console.log('  setDoc TIDAK melempar error.')
    console.log('  -> Memeriksa apakah benar-benar ada di SERVER...')
    const { getDocFromServer } = fsMod
    const snap = await getDocFromServer(fsMod.doc(db, 'settings', id))
    console.log(`  getDocFromServer: exists=${snap.exists()}`)
    if (snap.exists()) {
      console.log('  ⚠️  Dokumen ADA di server -> tulis benar-benar berhasil (celah nyata)')
      await fsMod.deleteDoc(fsMod.doc(db, 'settings', id)).catch(() => {})
      console.log('  dibersihkan.')
    } else {
      console.log('  ✅ Dokumen TIDAK ada di server -> tulis ditolak (SDK menahan di antrean lokal)')
    }
  } catch (e) {
    console.log(`  ✅ setDoc DITOLAK server: code=${e?.code} | ${String(e?.message).slice(0, 120)}`)
  }

  // Uji baca dari server (bukan cache)
  console.log('\nMencoba BACA users dari SERVER (getDocFromServer)...')
  try {
    const snap = await fsMod.getDocFromServer(fsMod.doc(db, 'users', 'nonexistent_probe_id'))
    console.log(`  hasil: exists=${snap.exists()} -> pembacaan tidak ditolak (cek rules users)`)
  } catch (e) {
    console.log(`  ✅ ditolak: code=${e?.code} | ${String(e?.message).slice(0, 120)}`)
  }

  console.log('\nMencoba BACA collection users (getDocsFromServer, limit 1)...')
  try {
    const q = fsMod.query(fsMod.collection(db, 'users'), fsMod.limit(1))
    const snap = await fsMod.getDocsFromServer(q)
    console.log(`  hasil: ${snap.size} dokumen -> ${snap.size > 0 ? 'BISA DIBACA (celah)' : 'kosong'}`)
  } catch (e) {
    console.log(`  ✅ ditolak: code=${e?.code} | ${String(e?.message).slice(0, 120)}`)
  }

  await deleteApp(app)
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
