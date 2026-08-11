import 'server-only'

import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

/**
 * The only Firebase Admin SDK boundary. Import this module exclusively from
 * server-only code such as route handlers and server-side authorization.
 */
function initializeAdminApp(): App {
  if (getApps().length) return getApp()

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
try {
  adminFirestore.settings({ ignoreUndefinedProperties: true })
} catch (e) {
  // Already initialized or setting failed
}

export { adminApp, adminAuth, adminFirestore }
