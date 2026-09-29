import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
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
import { adminFetch } from '../services/adminApi'
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

/** True when the signed-in Firebase user is the account recorded as the administrator. */
async function isRecordedAdmin(user: User): Promise<boolean> {
  try {
    const snap = await getDoc(adminAccountRef())
    return snap.exists() && snap.data().uid === user.uid
  } catch {
    // Security Rules refuse the read for anyone who is not the administrator
    return false
  }
}

/**
 * One-time switch from the password stored in admin_account to Firebase Auth. The stored password
 * is never readable; instead the Security Rules accept this write only when claimPass equals it
 * and the account's email matches. Afterwards the stored password is deleted.
 */
async function claimAdmin(user: User, pass: string): Promise<boolean> {
  try {
    await setDoc(adminAccountRef(), { uid: user.uid, claimPass: pass }, { merge: true })
  } catch {
    return false
  }
  await setDoc(
    adminAccountRef(),
    { email: user.email, pass: deleteField(), claimPass: deleteField(), updatedAt: new Date().toISOString() },
    { merge: true }
  ).catch(() => {})
  return true
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

  // login() does its own checks; the listener must not sign the user out halfway through them
  const loginInProgress = useRef(false)

  const acceptAdmin = (currentUser: User) => {
    setUser(currentUser)
    setAdminCredentials({ email: currentUser.email || '' })
    deleteDoc(doc(db, 'portfolio', LEGACY_SESSION_DOC)).catch(() => {})
    // Lets the administrator open the protected portfolio pages without the visitor access code
    adminFetch('/api/admin-session', { method: 'POST' }).catch(() => {})
  }

  // Firebase Auth keeps the session across reloads; each restored session is re-checked here
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (loginInProgress.current) return
      if (currentUser && (await isRecordedAdmin(currentUser))) {
        acceptAdmin(currentUser)
      } else {
        setUser(null)
        if (currentUser) await signOut(auth).catch(() => {})
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const login = async (email: string, pass: string) => {
    const invalid = 'Invalid administrator email or password. Please try again.'
    setError(null)
    setLoading(true)
    loginInProgress.current = true
    try {
      let current: User
      let created = false
      try {
        current = (await signInWithEmailAndPassword(auth, email.trim(), pass)).user
      } catch (signInErr: unknown) {
        const code = (signInErr as { code?: string }).code
        const badCredentials =
          code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-email'
        if (!badCredentials) throw new Error(friendlyAuthError(signInErr, 'Login failed. Please check your connection.'), { cause: signInErr })

        // No Firebase account yet: create it, then prove it belongs to the administrator below
        try {
          current = (await createUserWithEmailAndPassword(auth, email.trim(), pass)).user
          created = true
        } catch (createErr: unknown) {
          throw new Error(invalid, { cause: createErr })
        }
      }

      if ((await isRecordedAdmin(current)) || (await claimAdmin(current, pass))) {
        acceptAdmin(current)
        return
      }

      // Wrong password for the administrator: remove the account that was just created
      if (created) await current.delete().catch(() => {})
      await signOut(auth).catch(() => {})
      throw new Error(created ? invalid : 'This account is not the portfolio administrator.')
    } catch (err: unknown) {
      setUser(null)
      setError(err instanceof Error ? err.message : invalid)
      throw err
    } finally {
      loginInProgress.current = false
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await fetch('/api/admin-session', { method: 'DELETE' }).catch(() => {})
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
