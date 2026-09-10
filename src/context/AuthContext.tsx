import React, { createContext, useContext, useEffect, useState } from 'react'
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
import { doc, setDoc, getDoc } from 'firebase/firestore'

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
const STORAGE_KEY = 'colonel_admin_credentials_v2'

function getStoredCredentials(): AdminCredentials {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      // ignore
    }
  }
  return { email: DEFAULT_EMAIL, pass: DEFAULT_PASS }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials>(getStoredCredentials)
  const [isDemoAdmin, setIsDemoAdmin] = useState<boolean>(() => {
    return localStorage.getItem('colonel_demo_auth') === 'true'
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Sync credentials from Firestore on boot if available
    async function syncFirestoreCredentials() {
      try {
        const docRef = doc(db, 'portfolio', 'admin_account')
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          const data = snap.data() as AdminCredentials
          if (data.email && data.pass) {
            setAdminCredentials(data)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
          }
        }
      } catch {
        // ignore offline errors
      }
    }
    syncFirestoreCredentials()
  }, [])

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser)
        setLoading(false)
      })
      return () => unsubscribe()
    } catch {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, pass: string) => {
    setError(null)
    setLoading(true)

    const cleanInputEmail = email.trim().toLowerCase()
    const currentCreds = getStoredCredentials()
    const cleanStoredEmail = currentCreds.email.trim().toLowerCase()

    try {
      // Primary: Try Firebase Email/Password Auth
      await signInWithEmailAndPassword(auth, email, pass)
      setIsDemoAdmin(false)
      localStorage.removeItem('colonel_demo_auth')
    } catch (err: unknown) {
      // Fallback check against saved dynamic credentials
      if (cleanInputEmail === cleanStoredEmail && pass === currentCreds.pass) {
        setIsDemoAdmin(true)
        localStorage.setItem('colonel_demo_auth', 'true')
      } else {
        const firebaseErr = err as { code?: string; message?: string }
        if (
          firebaseErr.code === 'auth/invalid-credential' ||
          firebaseErr.code === 'auth/user-not-found' ||
          firebaseErr.code === 'auth/wrong-password'
        ) {
          setError('Invalid administrator email or password. Please try again.')
        } else if (firebaseErr.code === 'auth/too-many-requests') {
          setError('Too many failed login attempts. Please wait a few minutes before retrying.')
        } else {
          setError(firebaseErr.message || 'Login failed. Please check your credentials.')
        }
        throw err
      }
    } finally {
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

      // 1. Update Firebase Auth user if authenticated via Firebase
      if (auth.currentUser) {
        if (cleanEmail !== auth.currentUser.email) {
          await updateFirebaseEmail(auth.currentUser, cleanEmail).catch(() => {})
        }
        if (newPass) {
          await updateFirebasePassword(auth.currentUser, newPass).catch(() => {})
        }
      }

      // 2. Update local state, localStorage & active user object
      setAdminCredentials(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

      if (isDemoAdmin || !auth.currentUser) {
        setUser({ email: cleanEmail } as any)
      }

      // 3. Persist to Firestore document
      try {
        const docRef = doc(db, 'portfolio', 'admin_account')
        await setDoc(docRef, updated, { merge: true })
      } catch {
        // ignore offline errors
      }
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string }
      setError(firebaseErr.message || 'Failed to update credentials.')
      throw err
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      if (auth.currentUser) {
        await signOut(auth)
      }
    } catch {
      // ignore
    } finally {
      setIsDemoAdmin(false)
      localStorage.removeItem('colonel_demo_auth')
      setUser(null)
      setLoading(false)
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
