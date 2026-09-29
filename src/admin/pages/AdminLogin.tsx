import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShieldCheck, Lock, Mail, Loader2, AlertCircle, CheckCircle2, ArrowRight, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePortfolio } from '../../context/PortfolioContext'
import { resolveImageUrl } from '../../utils/imageResolver'
import ecowasBg from '../../assets/images/ecowas/ecowas-bg.jpeg'

export const AdminLogin: React.FC = () => {
  const { login, resetPassword, error, clearError } = useAuth()
  const { data } = usePortfolio()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSubmitting, setForgotSubmitting] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null)
  const [forgotError, setForgotError] = useState<string | null>(null)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin'
  const logo = resolveImageUrl(data.siteSettings.logoUrl || 'image.png')

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
    <div className="ad-login">
      <div className="l">
        <img className="bg" src={ecowasBg} alt="" />
        <div className="sh" />
        <div className="brand">
          <img src={logo} alt="Ghana Armed Forces crest" />
          <div>
            <b>{data.siteSettings.adminSidebarTitle || 'Col. Badasu'}</b>
            <small>{data.siteSettings.adminSidebarSubtitle || 'PORTFOLIO ADMIN'}</small>
          </div>
        </div>
        <div className="in">
          <span className="ad-tag"><i />Content management</span>
          <h1>Command<br /><em>console</em></h1>
          <p>
            Manage every section of the official portfolio of {data.officer.rank} {data.officer.name}: biography, career, awards,
            education, gallery and site settings.
          </p>
        </div>
      </div>

      <div className="r">
        <div>
          <span className="ad-tag dark"><i />Authorised personnel only</span>
          <h2>Sign in</h2>
          <p>Use your administrator email and password.</p>
        </div>

        {(localError || error) && (
          <div className="ad-alert err" role="alert">
            <AlertCircle size={16} />
            <span>{localError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="ad-login-form">
          <div>
            <label htmlFor="email" className="ad-lbl">Administrator email</label>
            <div className="ad-inp">
              <Mail size={17} />
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

          <div>
            <div className="ad-lbl-row">
              <label htmlFor="password" className="ad-lbl">Password</label>
              <button
                type="button"
                className="ad-link"
                onClick={() => {
                  setForgotEmail(email)
                  setShowForgotModal(true)
                }}
              >
                Forgot password?
              </button>
            </div>
            <div className="ad-inp">
              <Lock size={17} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button type="button" className="show" onClick={() => setShowPassword((v) => !v)} aria-pressed={showPassword}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" className="ad-b g sub" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={18} className="admin-spinner" />
                Authenticating…
              </>
            ) : (
              <>
                Sign in to dashboard
                <ArrowRight size={16} strokeWidth={2.2} />
              </>
            )}
          </button>
        </form>

        <div className="foot">
          <ShieldCheck size={16} />
          Protected by Firebase Authentication and Firestore security rules.
        </div>
        <Link to="/" className="back">← Back to the public website</Link>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="admin-modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="reset-title">
            <div className="admin-modal__header">
              <h3 id="reset-title">Reset administrator password</h3>
              <button type="button" className="admin-modal__close" onClick={() => setShowForgotModal(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="admin-modal__body">
                <div className="ad-alert ok">
                  <CheckCircle2 size={18} />
                  <span>{forgotSuccess}</span>
                </div>
                <button type="button" className="ad-b g" style={{ width: '100%', marginTop: 16 }} onClick={() => setShowForgotModal(false)}>
                  Return to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="admin-modal__body">
                <p>Enter your administrator email address to receive a secure Firebase password reset link.</p>

                {forgotError && (
                  <div className="ad-alert err">
                    <AlertCircle size={18} />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div style={{ marginTop: 16 }}>
                  <label className="ad-lbl" htmlFor="reset-email">Administrator email</label>
                  <div className="ad-inp">
                    <Mail size={17} />
                    <input
                      id="reset-email"
                      type="email"
                      placeholder="admin@colonelbadasu.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="admin-modal__footer">
                  <button type="button" className="ad-b l" onClick={() => setShowForgotModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="ad-b g" disabled={forgotSubmitting}>
                    {forgotSubmitting ? 'Sending…' : 'Send reset link'}
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
