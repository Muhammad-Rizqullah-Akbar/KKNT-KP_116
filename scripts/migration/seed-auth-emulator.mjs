// Seed Firebase AUTH emulator users with UIDs matching Firestore seed
import fs from 'fs'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const app = initializeApp({ projectId: 'desa-sehat-2026' })
const auth = getAuth(app)
const db = getFirestore(app)
db.settings({ host: 'localhost:8090', ssl: false, ignoreUndefinedProperties: true })

const PASSWORD = '[REDACTED_TEST_PASSWORD]'

async function main() {
  console.log('🔐 Syncing Auth emulator users with Firestore UIDs\n')

  // Read all Firestore users, create matching Auth users with SAME uid
  const snap = await db.collection('users').get()

  for (const doc of snap.docs) {
    const u = doc.data()
    const email = u.email
    const uid = doc.id
    if (!email) continue

    try {
      const existing = await auth.getUser(uid).catch(() => null)
      if (existing) {
        await auth.updateUser(uid, { password: PASSWORD, displayName: u.displayName || u.name })
        console.log(`↻ ${email.padEnd(32)} (uid ${uid.slice(0, 8)}...) updated`)
      } else {
        await auth.createUser({
          uid,
          email,
          password: PASSWORD,
          displayName: u.displayName || u.name || '',
        })
        console.log(`✓ ${email.padEnd(32)} (uid ${uid.slice(0, 8)}...) created`)
      }
    } catch (e) {
      console.log(`✗ ${email.padEnd(32)} ERROR: ${e.message}`)
    }
  }

  console.log('\n✅ Auth ↔ Firestore UID synced. All password: ' + PASSWORD)
  console.log('\nLogin credentials (emulator):')
  console.log('  super_admin : [REDACTED_TEST_EMAIL] / ' + PASSWORD)
  console.log('  partnership : [REDACTED_TEST_EMAIL] / ' + PASSWORD)
  console.log('  cadre       : najib.[REDACTED_TEST_EMAIL] / ' + PASSWORD)
  process.exit(0)
}

main()
