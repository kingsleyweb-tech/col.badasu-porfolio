import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateEmail as updateFirebaseEmail,
  updatePassword as updateFirebasePassword,
} from 'firebase/auth'
import { auth, db } from '../lib/firebase'
import { deleteDoc, deleteField, doc, getDoc, setDoc } from 'firebase/firestore'

export type AdminCredentials = {
  email: string
  updatedAt?: string
}

type AuthContextType = {
  user: User | null
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

// ─── Firestore paths ───────────────────────────────────────────────────────────
// portfolio/admin_account records which Firebase Auth account is the administrator ({ email, uid }).
// Firestore Security Rules only allow that account to write portfolio content.
const CREDS_DOC = 'admin_account'
// Left over from the old shared "demo session"; removed on the next sign-in.
const LEGACY_SESSION_DOC = 'admin_session'

const adminAccountRef = () => doc(db, 'portfolio', CREDS_DOC)

const sameEmail = (a?: string | null, b?: string | null) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * Returns true when the signed-in Firebase user is the portfolio administrator. The first time the
 * administrator signs in with Firebase Auth, their account id is recorded in admin_account.
 */
async function confirmAdmin(user: User): Promise<boolean> {
  let data: { email?: string; uid?: string }
  try {
    const snap = await getDoc(adminAccountRef())
    data = snap.exists() ? snap.data() : {}
  } catch {
    // Security Rules refuse the read for anyone who is not the administrator
    return false
  }

  if (data.uid) return data.uid === user.uid
  if (!sameEmail(data.email, user.email)) return false

  await setDoc(
    adminAccountRef(),
    { email: user.email, uid: user.uid, pass: deleteField(), updatedAt: new Date().toISOString() },
    { merge: true }
  )
  return true
}

/**
 * Accounts created before Firebase Auth was used kept their password in admin_account. When that
 * password matches, the administrator's Firebase Auth account is created with it (one time only),
 * and the stored password is deleted by confirmAdmin().
 */
async function migrateLegacyAdmin(email: string, pass: string): Promise<boolean> {
  let legacy: { email?: string; pass?: string; uid?: string }
  try {
    const snap = await getDoc(adminAccountRef())
    legacy = snap.exists() ? snap.data() : {}
  } catch {
    return false
  }
  if (legacy.uid || !legacy.pass || !sameEmail(legacy.email, email) || legacy.pass !== pass) return false

  try {
    await createUserWithEmailAndPassword(auth, email.trim(), pass)
    return true
  } catch {
    return false
  }
}

function friendlyAuthError(err: unknown, fallback: string): string {
  const code = (err as { code?: string }).code || ''
  if (code === 'auth/requires-recent-login') return 'For security, sign out and sign in again, then repeat this change.'
  if (code === 'auth/weak-password') return 'Choose a stronger password (at least 6 characters).'
  if (code === 'auth/email-already-in-use') return 'That email address is already used by another account.'
  if (code === 'auth/invalid-email') return 'Enter a valid email address.'
  if (code === 'auth/operation-not-allowed') return 'Firebase requires the new email to be verified first. Use the password reset link instead, or change the email in the Firebase console.'
  if (code === 'auth/too-many-requests') return 'Too many attempts. Wait a few minutes and try again.'
  if (code === 'auth/network-request-failed') return 'Network error. Check your connection.'
  return fallback
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials>({ email: '' })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Firebase Auth keeps the session across reloads; each restored session is re-checked here
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null)
        setLoading(false)
        return
      }
      const isAdmin = await confirmAdmin(currentUser).catch(() => false)
      if (isAdmin) {
        setUser(currentUser)
        setAdminCredentials({ email: currentUser.email || '' })
        deleteDoc(doc(db, 'portfolio', LEGACY_SESSION_DOC)).catch(() => {})
      } else {
        setUser(null)
        setError('This account is not the portfolio administrator.')
        await signOut(auth).catch(() => {})
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const login = async (email: string, pass: string) => {
    setError(null)
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass)
    } catch (firebaseErr: unknown) {
      const code = (firebaseErr as { code?: string }).code
      const badCredentials =
        code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-email'

      if (badCredentials && (await migrateLegacyAdmin(email, pass))) return

      setError(badCredentials ? 'Invalid administrator email or password. Please try again.' : friendlyAuthError(firebaseErr, 'Login failed. Please check your connection.'))
      setLoading(false)
      throw firebaseErr
    }
    // onAuthStateChanged confirms the account and clears `loading`
  }

  const logout = async () => {
    setLoading(true)
    try {
      await signOut(auth)
    } finally {
      setUser(null)
      setLoading(false)
    }
  }

  const updateCredentials = async (newEmail: string, newPass: string) => {
    setError(null)
    const current = auth.currentUser
    if (!current) throw new Error('Not signed in')
    try {
      const cleanEmail = newEmail.trim()
      if (!sameEmail(cleanEmail, current.email)) await updateFirebaseEmail(current, cleanEmail)
      if (newPass) await updateFirebasePassword(current, newPass)

      const updated: AdminCredentials = { email: cleanEmail, updatedAt: new Date().toISOString() }
      await setDoc(adminAccountRef(), updated, { merge: true })
      setAdminCredentials(updated)
    } catch (err: unknown) {
      const message = friendlyAuthError(err, 'Failed to update credentials.')
      setError(message)
      throw new Error(message, { cause: err })
    }
  }

  const resetPassword = async (email: string) => {
    setError(null)
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (err: unknown) {
      const message = friendlyAuthError(err, 'Failed to send password reset email.')
      setError(message)
      throw new Error(message, { cause: err })
    }
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider
      value={{
        user,
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
