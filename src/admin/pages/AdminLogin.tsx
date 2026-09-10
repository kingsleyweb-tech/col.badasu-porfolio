import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShieldCheck, Lock, Mail, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const AdminLogin: React.FC = () => {
  const { login, resetPassword, error, clearError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSubmitting, setForgotSubmitting] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null)
  const [forgotError, setForgotError] = useState<string | null>(null)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    clearError()

    if (!email || !password) {
      setLocalError('Please enter both email address and password.')
      return
    }

    setSubmitting(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid login credentials'
      setLocalError(msg.includes('invalid') ? 'Invalid administrator email or password.' : msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError(null)
    setForgotSuccess(null)

    if (!forgotEmail) {
      setForgotError('Please enter your email address.')
      return
    }

    setForgotSubmitting(true)
    try {
      await resetPassword(forgotEmail)
      setForgotSuccess(`Password reset email sent to ${forgotEmail}. Please check your inbox.`)
    } catch {
      setForgotError('Failed to send reset email. Verify email is registered.')
    } finally {
      setForgotSubmitting(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        {/* Crest & Header */}
        <div className="admin-login-card__header">
          <div className="admin-login-card__crest">
            <img src="https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_120/colonel-badasu/site/root/image" alt="GAF Crest" />
          </div>
          <h1>Colonel Badasu</h1>
          <p>Portfolio Content Management System</p>
          <div className="admin-login-card__badge">
            <ShieldCheck size={14} />
            <span>Authorized Personnel Access Only</span>
          </div>
        </div>

        {/* Errors */}
        {(localError || error) && (
          <div className="admin-login-alert is-error">
            <AlertCircle size={18} />
            <span>{localError || error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-form-group">
            <label htmlFor="email">Administrator Email</label>
            <div className="admin-input-wrapper">
              <Mail size={18} className="admin-input-icon" />
              <input
                id="email"
                type="email"
                placeholder="admin@colonelbadasu.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="admin-form-group">
            <div className="admin-form-group__header">
              <label htmlFor="password">Security Password</label>
              <button
                type="button"
                className="admin-forgot-link"
                onClick={() => {
                  setForgotEmail(email)
                  setShowForgotModal(true)
                }}
              >
                Forgot password?
              </button>
            </div>
            <div className="admin-input-wrapper">
              <Lock size={18} className="admin-input-icon" />
              <input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn--primary admin-login-btn"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="admin-spinner" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="admin-login-card__footer">
          <p>Protected by Firebase Authentication & Firestore Security Rules.</p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="admin-modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>Reset Administrator Password</h3>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setShowForgotModal(false)}
              >
                ×
              </button>
            </div>

            {forgotSuccess ? (
              <div className="admin-modal__body">
                <div className="admin-login-alert is-success">
                  <CheckCircle2 size={18} />
                  <span>{forgotSuccess}</span>
                </div>
                <button
                  type="button"
                  className="btn btn--primary"
                  style={{ width: '100%', marginTop: '16px' }}
                  onClick={() => setShowForgotModal(false)}
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="admin-modal__body">
                <p>Enter your administrator email address below to receive a secure Firebase password reset link.</p>

                {forgotError && (
                  <div className="admin-login-alert is-error">
                    <AlertCircle size={18} />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div className="admin-form-group" style={{ marginTop: '16px' }}>
                  <label>Administrator Email</label>
                  <div className="admin-input-wrapper">
                    <Mail size={18} className="admin-input-icon" />
                    <input
                      type="email"
                      placeholder="admin@colonelbadasu.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="admin-modal__footer">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setShowForgotModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={forgotSubmitting}
                  >
                    {forgotSubmitting ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
