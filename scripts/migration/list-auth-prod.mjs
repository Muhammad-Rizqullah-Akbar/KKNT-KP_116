// Read-only: list Firebase AUTH users in production (not Firestore)
import fs from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const env = {}
for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"|"$/g, '')
}

const app = initializeApp({
  credential: cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
})
const auth = getAuth(app)

const list = await auth.listUsers(1000)
console.log('TOTAL AUTH USERS:', list.users.length)
console.log('')
for (const u of list.users) {
  const providers = (u.providerData || []).map((p) => p.providerId).join(',')
  console.log(
    '-',
    (u.uid || '?').slice(0, 28).padEnd(28),
    '|',
    (u.email || '(no email)').padEnd(32),
    '|',
    (u.displayName || '').slice(0, 24).padEnd(24),
    '| disabled:', u.disabled ? 'Y' : 'N',
    '| provider:', providers || '(none)'
  )
}
process.exit(0)
