import 'server-only'

import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

/**
 * The only Firebase Admin SDK boundary. Import this module exclusively from
 * server-only code such as route handlers and server-side authorization.
 *
 * Emulator support: when FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST
 * are set, the Admin SDK binds to the local emulator instead of production —
 * no credentials required. This is the critical fix that prevents a "sandbox"
 * from silently hitting production Firestore/Auth from every API route.
 */
function initializeAdminApp(): App {
  if (getApps().length) return getApp()

  const isEmulator =
    process.env.FIRESTORE_EMULATOR_HOST === 'localhost:8090' ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST === 'localhost:9099'

  if (isEmulator) {
    // Emulator mode: no credentials needed, any projectId accepted
    const projectId = process.env.FIREBASE_PROJECT_ID?.trim() || 'desa-sehat-2026'
    return initializeApp({ projectId })
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim()
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim()
  let privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim()
  if (privateKey) {
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1)
    }
    privateKey = privateKey.replace(/\\n/g, '\n')
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin SDK is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
    )
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  })
}

const adminApp = initializeAdminApp()
const adminAuth = getAuth(adminApp)
const adminFirestore = getFirestore(adminApp)

const isEmulator =
  process.env.FIRESTORE_EMULATOR_HOST === 'localhost:8090' ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST === 'localhost:9099'

if (isEmulator) {
  try {
    adminFirestore.settings({ host: 'localhost:8090', ssl: false, ignoreUndefinedProperties: true })
  } catch (e) {
    // Already initialized
  }
} else {
  try {
    adminFirestore.settings({ ignoreUndefinedProperties: true })
  } catch (e) {
    // Already initialized
  }
}

export { adminApp, adminAuth, adminFirestore }
