import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBVp5JhoUmay5l62K1zq1NYy2aepdRLBI8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'badasu.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'badasu',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'badasu.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1016199059331',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1016199059331:web:04b2b8f95dc16e150548b6',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-YRPW8ECMN0'
}

let app
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
} catch (err) {
  console.warn('Firebase initialization fallback:', err)
  app = getApps()[0] || initializeApp(firebaseConfig)
}

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app

