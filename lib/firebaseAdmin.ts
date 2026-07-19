// lib/firebaseAdmin.ts
const admin = require('firebase-admin');

if (!admin.apps.length) {
  // Jika menggunakan emulator, cukup beri projectId tanpa credential
  if (process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    // Mode produksi (pakai credential asli)
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
}

// Ekspor layanan yang dibutuhkan
const auth = admin.auth();
const firestore = admin.firestore();
const messaging = admin.messaging(); 

export { auth, firestore, messaging };