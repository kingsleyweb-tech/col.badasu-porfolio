import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShieldCheck, Lock, Mail, Loader2, AlertCircle, CheckCircle2, ArrowRight, Shield, Award, Globe } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import ecowasBg from '../../assets/images/ecowas/WhatsApp Image 2026-08-31 at 11.18.07 AM.jpeg'

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
      <div className="admin-login-container">
        {/* Left Info Panel (Visible on Large Screens with ECOWAS image background) */}
        <div
          className="admin-login-info-panel"
          style={{ backgroundImage: `url("${ecowasBg}")` }}
        >
          <div className="admin-login-info-overlay">
            <div className="admin-login-info-top">
              <div className="admin-login-info-badge">
                <Shield size={14} />
                <span>ECOWAS MISSION & LEADERSHIP</span>
              </div>
              <h2 className="admin-login-info-title">Colonel Badasu</h2>
              <p className="admin-login-info-subtitle">
                Portfolio Content Management System
              </p>
              <div className="admin-login-info-divider" />
              <blockquote className="admin-login-info-quote">
                “Serving with honor, strategic military leadership, and unwavering commitment to peace, security, and national excellence.”
              </blockquote>
            </div>

            <div className="admin-login-info-features">
              <div className="admin-info-feature-item">
                <div className="admin-info-feature-icon">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4>Secure Command Portal</h4>
                  <p>Restricted access for authenticated military and portfolio administrators.</p>
                </div>
              </div>

              <div className="admin-info-feature-item">
                <div className="admin-info-feature-icon">
                  <Award size={20} />
                </div>
                <div>
                  <h4>Leadership & Career Management</h4>
                  <p>Maintain verified records of achievements, military ranks, & honors.</p>
                </div>
              </div>

              <div className="admin-info-feature-item">
                <div className="admin-info-feature-icon">
                  <Globe size={20} />
                </div>
                <div>
                  <h4>ECOWAS Mission Gallery</h4>
                  <p>Centralized cloud storage for operational media and public portfolio assets.</p>
                </div>
              </div>
            </div>

            <div className="admin-login-info-footer">
              <p>© Ghana Armed Forces • Secure Administration Portal</p>
            </div>
          </div>
        </div>

        {/* Right Form Card (Login Form) */}
        <div className="admin-login-card">
          {/* Crest & Header */}
          <div className="admin-login-card__header">
            <div className="admin-login-card__crest">
              <img
                src="https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_120/colonel-badasu/site/root/image"
                alt="GAF Crest"
              />
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
                  <span>SIGN IN TO DASHBOARD</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="admin-login-card__footer">
            <p>Protected by Firebase Authentication & Firestore Security Rules.</p>
          </div>
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
