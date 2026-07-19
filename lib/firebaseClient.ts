// lib/firebaseClient.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inisialisasi Firebase (hanya sekali)
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} catch (error) {
  console.error('Firebase init error:', error);
  throw error;
}

const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// HANYA gunakan emulator saat berjalan di localhost
if (typeof window !== 'undefined') {
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
  
  const useEmulator = isLocalhost && process.env.NEXT_PUBLIC_USE_EMULATOR === 'true';

  if (useEmulator) {
    console.log('🔧 Firebase Emulator Mode');
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(firestore, 'localhost', 8090);
    connectStorageEmulator(storage, 'localhost', 9199);
  } else {
    console.log('🌐 Firebase Production Mode');
  }
}

export { app, auth, firestore, storage };