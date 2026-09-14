#!/usr/bin/env node
/**
 * E2E seed — minimal, self-contained (no data/export dependency).
 * Digunakan di CI untuk setup emulator kosong sebelum Playwright golden flow.
 * Playwright test membuat form/distribution/response sendiri di dalam test.
 *
 * Usage: node scripts/migration/seed-e2e.mjs
 */

import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const app = initializeApp({ projectId: 'desa-sehat-2026' })
const db = getFirestore(app)
db.settings({ host: 'localhost:8090', ssl: false, ignoreUndefinedProperties: true })

async function main() {
  console.log('🔧 E2E seed — minimal setup (emulator)')

  // Pastikan koleksi target ada (bisa kosong, test akan isi sendiri)
  // Tidak ada data produksi — murni fixture test kosong.
  const collections = [
    'users', 'partnerships', 'forms', 'form_versions', 'distributions',
    'responses', 'articles', 'article_categories', 'form_registry', 'settings',
  ]

  for (const name of collections) {
    // touch koleksi dengan doc dummy lalu hapus (Firestore tidak bisa buat koleksi kosong)
    const dummy = db.collection(name).doc('__seed_probe__')
    await dummy.set({ _probe: true })
    await dummy.delete()
  }

  console.log('✅ E2E seed siap — emulator bersih, Playwright akan isi data sendiri')
}

main().catch((e) => {
  console.error('❌ E2E seed error:', e.message)
  process.exit(1)
})
