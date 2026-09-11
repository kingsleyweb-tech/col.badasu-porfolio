import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import type { User } from 'firebase/auth'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
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
const CREDS_DOC = 'admin_account'    // portfolio/admin_account
const SESSION_DOC = 'admin_session'  // portfolio/admin_session

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

function generateSessionToken(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2)}`
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

  // In-memory session token (only lives for this browser session)
  const sessionToken = useRef<string | null>(null)

  // On mount: listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      // If Firebase Auth logs us out (e.g. token expired), clear demo state too
      if (!currentUser) setIsDemoAdmin(false)
      setLoading(false)
    })

    // Load admin credentials from Firestore on boot
    loadCredentialsFromFirestore().then(setAdminCredentials)

    // Check for an active demo session stored in Firestore
    async function restoreSession() {
      try {
        const snap = await getDoc(doc(db, 'portfolio', SESSION_DOC))
        if (snap.exists()) {
          const data = snap.data()
          if (data?.active === true && data?.token) {
            sessionToken.current = data.token
            setIsDemoAdmin(true)
          }
        }
      } catch {
        // ignore
      }
    }
    restoreSession()

    return () => unsubscribe()
  }, [])

  const login = async (email: string, pass: string) => {
    setError(null)
    setLoading(true)

    try {
      // Primary path: real Firebase email/password auth
      await signInWithEmailAndPassword(auth, email, pass)
      setIsDemoAdmin(false)
    } catch (firebaseErr: unknown) {
      const errCode = (firebaseErr as { code?: string }).code

      // Only fall through to credential check for auth errors, not network errors
      if (
        errCode === 'auth/invalid-credential' ||
        errCode === 'auth/user-not-found' ||
        errCode === 'auth/wrong-password' ||
        errCode === 'auth/invalid-email'
      ) {
        // Fallback: check against Firestore-stored admin credentials
        const creds = await loadCredentialsFromFirestore()
        const emailMatch = email.trim().toLowerCase() === creds.email.trim().toLowerCase()
        const passMatch = pass === creds.pass

        if (emailMatch && passMatch) {
          // Credentials are valid – create a demo session in Firestore
          const token = generateSessionToken()
          sessionToken.current = token
          setAdminCredentials(creds)
          setIsDemoAdmin(true)

          // Persist session to Firestore so it survives page refresh
          try {
            await setDoc(doc(db, 'portfolio', SESSION_DOC), {
              active: true,
              token,
              createdAt: new Date().toISOString(),
            })
          } catch {
            // Session persistence is non-critical
          }
        } else {
          setError('Invalid administrator email or password. Please try again.')
          setLoading(false)
          throw new Error('Invalid credentials')
        }
      } else {
        // Re-throw unexpected errors (network, etc.)
        const msg = (firebaseErr as { message?: string }).message
        setError(msg || 'Login failed. Please check your connection.')
        setLoading(false)
        throw firebaseErr
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      // Clear Firestore demo session
      await deleteDoc(doc(db, 'portfolio', SESSION_DOC)).catch(() => {})
      sessionToken.current = null

      // Sign out of Firebase Auth if we have a real session
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

      // Persist updated credentials to Firestore (this is the source of truth)
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
