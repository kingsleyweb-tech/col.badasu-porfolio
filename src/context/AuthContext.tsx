import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  sendPasswordResetEmail,
  updateEmail as updateFirebaseEmail,
  updatePassword as updateFirebasePassword,
} from 'firebase/auth'
import { auth, db } from '../lib/firebase'
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore'

export type AdminCredentials = {
  email: string
  pass: string
  updatedAt?: string
}

type AuthContextType = {
  user: User | null
  isDemoAdmin: boolean
  loading: boolean
  error: string | null
  adminCredentials: AdminCredentials
  login: (email: string, pass: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateCredentials: (newEmail: string, newPass: string) => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEFAULT_EMAIL = 'admin@colonelbadasu.com'
const DEFAULT_PASS = 'Colonel2026!'

// ─── Firestore paths ───────────────────────────────────────────────────────────
const CREDS_DOC = 'admin_account'      // portfolio/admin_account
const SESSION_DOC = 'admin_session'    // portfolio/admin_session

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function loadCredentialsFromFirestore(): Promise<AdminCredentials> {
  try {
    const snap = await getDoc(doc(db, 'portfolio', CREDS_DOC))
    if (snap.exists()) {
      const data = snap.data() as AdminCredentials
      if (data.email && data.pass) return data
    }
  } catch {
    // Firestore unavailable – fall back to defaults
  }
  return { email: DEFAULT_EMAIL, pass: DEFAULT_PASS }
}

async function saveSessionToFirestore(uid: string): Promise<void> {
  try {
    await setDoc(doc(db, 'portfolio', SESSION_DOC), {
      uid,
      isDemoAdmin: true,
      createdAt: new Date().toISOString(),
    })
  } catch {
    // non-critical
  }
}

async function clearSessionFromFirestore(): Promise<void> {
  try {
    await deleteDoc(doc(db, 'portfolio', SESSION_DOC))
  } catch {
    // non-critical
  }
}

async function checkDemoSession(uid: string | null): Promise<boolean> {
  if (!uid) return false
  try {
    const snap = await getDoc(doc(db, 'portfolio', SESSION_DOC))
    if (snap.exists()) {
      const data = snap.data()
      return data.uid === uid && data.isDemoAdmin === true
    }
  } catch {
    // ignore
  }
  return false
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isDemoAdmin, setIsDemoAdmin] = useState<boolean>(false)
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials>({
    email: DEFAULT_EMAIL,
    pass: DEFAULT_PASS,
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // On mount: listen to Firebase auth, restore demo session from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        // Check if this Firebase user has an active demo session stored in Firestore
        const demo = await checkDemoSession(currentUser.uid)
        setIsDemoAdmin(demo)
      } else {
        setIsDemoAdmin(false)
      }

      setLoading(false)
    })

    // Load admin credentials from Firestore on boot
    loadCredentialsFromFirestore().then(setAdminCredentials)

    return () => unsubscribe()
  }, [])

  const login = async (email: string, pass: string) => {
    setError(null)
    setLoading(true)

    try {
      // Primary path: real Firebase email/password auth
      await signInWithEmailAndPassword(auth, email, pass)
      setIsDemoAdmin(false)
    } catch {
      // Fallback: check against Firestore-stored admin credentials
      const creds = await loadCredentialsFromFirestore()
      const match =
        email.trim().toLowerCase() === creds.email.trim().toLowerCase() &&
        pass === creds.pass

      if (match) {
        // Sign in anonymously so Firestore write rules are satisfied
        const anonResult = await signInAnonymously(auth)
        setIsDemoAdmin(true)
        // Persist demo session to Firestore (replaces localStorage)
        await saveSessionToFirestore(anonResult.user.uid)
      } else {
        setError('Invalid administrator email or password. Please try again.')
        setLoading(false)
        throw new Error('Invalid credentials')
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await clearSessionFromFirestore()
      if (auth.currentUser) {
        await signOut(auth)
      }
    } catch {
      // ignore
    } finally {
      setIsDemoAdmin(false)
      setUser(null)
      setLoading(false)
    }
  }

  const updateCredentials = async (newEmail: string, newPass: string) => {
    setError(null)
    try {
      const cleanEmail = newEmail.trim()
      const updated: AdminCredentials = {
        email: cleanEmail,
        pass: newPass,
        updatedAt: new Date().toISOString(),
      }

      // Update Firebase Auth user if authenticated via real email/password
      if (auth.currentUser && !isDemoAdmin) {
        if (cleanEmail !== auth.currentUser.email) {
          await updateFirebaseEmail(auth.currentUser, cleanEmail).catch(() => {})
        }
        if (newPass) {
          await updateFirebasePassword(auth.currentUser, newPass).catch(() => {})
        }
      }

      // Persist updated credentials to Firestore
      await setDoc(doc(db, 'portfolio', CREDS_DOC), updated, { merge: true })

      setAdminCredentials(updated)
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string }
      setError(firebaseErr.message || 'Failed to update credentials.')
      throw err
    }
  }

  const resetPassword = async (email: string) => {
    setError(null)
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string }
      setError(firebaseErr.message || 'Failed to send password reset email.')
      throw err
    }
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider
      value={{
        user,
        isDemoAdmin,
        loading,
        error,
        adminCredentials,
        login,
        logout,
        resetPassword,
        updateCredentials,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
