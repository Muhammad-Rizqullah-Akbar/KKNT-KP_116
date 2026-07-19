// scripts/createAdmin.ts
const admin = require('firebase-admin')

// Pakai service account yang sama dengan firebaseAdmin.ts
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

async function createAdmin() {
  const email = 'admin@kkntkp.id'
  const password = 'admin123456'
  
  try {
    // Buat user di Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: 'Super Admin',
    })
    
    // Buat document di Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email,
      displayName: 'Super Admin',
      role: 'super_admin',
      photoURL: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    
    console.log('✅ Admin created:', userRecord.uid)
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      console.log('⚠️ User already exists, creating Firestore document...')
      const user = await admin.auth().getUserByEmail(email)
      await admin.firestore().collection('users').doc(user.uid).set({
        email,
        displayName: 'Super Admin',
        role: 'super_admin',
        photoURL: '',
        updatedAt: new Date().toISOString(),
      }, { merge: true })
      console.log('✅ Firestore document updated')
    } else {
      console.error('Error:', error)
    }
  }
}

createAdmin()