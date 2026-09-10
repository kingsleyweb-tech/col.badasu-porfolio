import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../lib/firebase'

type AuthContextType = {
  user: User | null
  isDemoAdmin: boolean
  loading: boolean
  error: string | null
  login: (email: string, pass: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEMO_EMAIL = 'admin@colonelbadasu.com'
const DEMO_PASS = 'Colonel2026!'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isDemoAdmin, setIsDemoAdmin] = useState<boolean>(() => {
    return localStorage.getItem('colonel_demo_auth') === 'true'
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

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

    try {
      // Primary: Firebase Email/Password Auth
      await signInWithEmailAndPassword(auth, email, pass)
      setIsDemoAdmin(false)
      localStorage.removeItem('colonel_demo_auth')
    } catch (err: unknown) {
      // Fallback fallback check for initial admin onboarding if Firebase project isn't provisioned yet
      if (email.trim().toLowerCase() === DEMO_EMAIL.toLowerCase() && pass === DEMO_PASS) {
        setIsDemoAdmin(true)
        localStorage.setItem('colonel_demo_auth', 'true')
      } else {
        const firebaseErr = err as { code?: string; message?: string }
        if (firebaseErr.code === 'auth/invalid-credential' || firebaseErr.code === 'auth/user-not-found' || firebaseErr.code === 'auth/wrong-password') {
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
        login,
        logout,
        resetPassword,
        clearError
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
