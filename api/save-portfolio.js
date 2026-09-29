// Vercel Serverless Function to persist portfolio updates to Firestore server
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || ''
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const updatedData = req.body
    if (!updatedData || typeof updatedData !== 'object') {
      return res.status(400).json({ error: 'Invalid payload' })
    }

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      return res.status(503).json({ error: 'Firebase config missing on server.' })
    }

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
    const db = getFirestore(app)
    const docRef = doc(db, 'portfolio', 'portfolio_main')

    const snap = await getDoc(docRef)
    const current = snap.exists() ? snap.data() : {}
    const merged = { ...current, ...updatedData, updatedAt: new Date().toISOString() }

    await setDoc(docRef, merged, { merge: true })

    return res.status(200).json({ success: true, message: 'Portfolio content saved to Firestore server successfully.' })
  } catch (err) {
    console.error('Save portfolio API error:', err)
    return res.status(500).json({ error: 'Failed to save portfolio content', detail: err.message })
  }
}
