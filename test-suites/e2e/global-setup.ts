import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

/**
 * Playwright globalSetup — jalan SETELAH webServer (emulator) ready.
 * Seed minimal data test sebelum spec dijalankan.
 */
export default async function globalSetup() {
  const app = initializeApp({ projectId: 'desa-sehat-2026' })
  const db = getFirestore(app)
  db.settings({ host: 'localhost:8090', ssl: false, ignoreUndefinedProperties: true })

  const collections = [
    'users', 'partnerships', 'forms', 'form_versions', 'distributions',
    'responses', 'articles', 'article_categories', 'form_registry', 'settings',
  ]

  for (const name of collections) {
    const dummy = db.collection(name).doc('seed_probe')
    await dummy.set({ _probe: true })
    await dummy.delete()
  }

  console.log('✅ E2E globalSetup: emulator siap, koleksi terinisialisasi')
}
