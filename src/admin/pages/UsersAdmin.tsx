import React, { useState, useEffect } from 'react'
import { ShieldCheck, Key, Mail, CheckCircle2, Loader2, Save, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { SaveSuccessModal } from '../components/SaveSuccessModal'

export const UsersAdmin: React.FC = () => {
  const { user, isDemoAdmin, adminCredentials, updateCredentials, resetPassword } = useAuth()

  const currentEmail = user?.email || adminCredentials.email || 'admin@colonelbadasu.com'

  const [emailInput, setEmailInput] = useState(currentEmail)
  const [passwordInput, setPasswordInput] = useState(adminCredentials.pass || '')
  const [confirmPasswordInput, setConfirmPasswordInput] = useState(adminCredentials.pass || '')

  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resetSubmitting, setResetSubmitting] = useState(false)

  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    setEmailInput(currentEmail)
    if (adminCredentials.pass) {
      setPasswordInput(adminCredentials.pass)
      setConfirmPasswordInput(adminCredentials.pass)
    }
  }, [currentEmail, adminCredentials.pass])

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setAlertMsg(null)

    if (!emailInput.trim()) {
      setAlertMsg({ text: 'Please enter a valid email address.', type: 'error' })
      return
    }

    if (!passwordInput) {
      setAlertMsg({ text: 'Password cannot be blank.', type: 'error' })
      return
    }

    if (passwordInput !== confirmPasswordInput) {
      setAlertMsg({ text: 'Passwords do not match. Please re-enter both password fields.', type: 'error' })
      return
    }

    setSubmitting(true)
    try {
      await updateCredentials(emailInput.trim(), passwordInput)
      setShowSuccessModal(true)
      setAlertMsg({
        text: `Credentials updated successfully! You can now log in using ${emailInput.trim()} and your new password.`,
        type: 'success',
      })
    } catch {
      setAlertMsg({ text: 'Failed to update admin credentials. Please try again.', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleTriggerReset = async () => {
    setResetSubmitting(true)
    setAlertMsg(null)
    try {
      const targetEmail = user?.email || emailInput.trim()
      await resetPassword(targetEmail)
      setAlertMsg({
        text: `Firebase password reset link sent to ${targetEmail}. Check your inbox.`,
        type: 'success',
      })
    } catch {
      setAlertMsg({ text: 'Unable to send password reset link. Verify email or network.', type: 'error' })
    } finally {
      setResetSubmitting(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header admin-page-header--action">
        <div className="admin-page-header__title">
          <div className="admin-header-icon">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1>Users & Access Credentials</h1>
            <p>Update your administrator email and password anytime. Your new credentials take effect immediately for login.</p>
          </div>
        </div>
      </div>

      {alertMsg && (
        <div className={`admin-alert ${alertMsg.type === 'error' ? 'is-error' : 'is-success'}`} style={{ marginBottom: '24px' }}>
          {alertMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{alertMsg.text}</span>
          <button type="button" className="admin-alert__close" onClick={() => setAlertMsg(null)}>×</button>
        </div>
      )}

      <div className="admin-dashboard-grid">
        <div className="admin-dashboard-main">
          {/* Active Profile Card */}
          <div className="admin-card" style={{ marginBottom: '24px' }}>
            <div className="admin-card__header">
              <div className="admin-card__title-wrap">
                <ShieldCheck size={20} className="text-emerald-600" />
                <h3>Active Administrator Account</h3>
              </div>
            </div>

            <div className="admin-user-profile-detail">
              <div className="admin-user-avatar-large">CB</div>
              <div className="admin-user-detail-text">
                <strong>Colonel Henry Kwaku Badasu</strong>
                <p><Mail size={14} style={{ display: 'inline', marginRight: '6px' }} /> {currentEmail}</p>
                <div className="admin-badge-row">
                  <span className="admin-badge admin-badge--primary">Primary Administrator</span>
                  <span className="admin-badge admin-badge--secondary">{isDemoAdmin ? 'Custom Credentials' : 'Firebase Authenticated'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Update Email and Password Form */}
          <div className="admin-card" style={{ marginBottom: '24px' }}>
            <div className="admin-card__header">
              <div className="admin-card__title-wrap">
                <Key size={20} />
                <div>
                  <h3>Change Email & Password</h3>
                  <p>Type your new email address and new password below, then click "Update Credentials".</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateCredentials} className="admin-form">
              <div className="admin-form-group">
                <label>Administrator Email Address *</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. admin@colonelbadasu.com"
                  required
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>New Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter new password"
                      required
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: '#64748b', cursor: 'pointer'
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Confirm New Password *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>

              <div style={{ marginTop: '8px' }}>
                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  {submitting ? <Loader2 size={18} className="admin-spinner" /> : <Save size={18} />}
                  <span>{submitting ? 'Updating Credentials...' : 'UPDATE CREDENTIALS'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Secondary Reset Option */}
          <div className="admin-card">
            <div className="admin-card__header">
              <div className="admin-card__title-wrap">
                <Mail size={18} />
                <h3>Firebase Password Reset Email</h3>
              </div>
            </div>
            <p style={{ color: '#475569', fontSize: '14px', marginBottom: '16px' }}>
              Optionally send an automated Firebase password reset link directly to your inbox.
            </p>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleTriggerReset}
              disabled={resetSubmitting}
            >
              {resetSubmitting ? <Loader2 size={16} className="admin-spinner" /> : <Key size={16} />}
              <span>Send Password Reset Link</span>
            </button>
          </div>
        </div>

        {/* Sidebar Status Info */}
        <div className="admin-dashboard-sidebar">
          <div className="admin-security-status-card">
            <ShieldCheck size={24} />
            <div>
              <strong>Instant Credentials Activation</strong>
              <p>When you update your Email or Password, your changes are saved immediately to both Firebase and local secure storage. You can log out and use your new credentials to log back in anytime.</p>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card__header">
              <div className="admin-card__title-wrap">
                <Key size={18} style={{ color: '#0e5c3e' }} />
                <h3>Account Security Overview</h3>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', color: '#475569' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <span>Account Role:</span>
                <strong style={{ color: '#0f172a' }}>Primary Admin</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <span>Session Encryption:</span>
                <strong style={{ color: '#16a34a' }}>256-Bit SSL</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <span>Firebase Auth:</span>
                <strong style={{ color: '#0f172a' }}>{isDemoAdmin ? 'Demo Credentials' : 'Active'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Password Strength:</span>
                <strong style={{ color: '#16a34a' }}>Protected</strong>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card__header">
              <h3>Quick Navigation</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a href="/admin/settings" className="btn btn--outline" style={{ justifyContent: 'flex-start', fontSize: '0.85rem' }}>
                Site & Header Settings
              </a>
              <a href="/admin/gallery" className="btn btn--outline" style={{ justifyContent: 'flex-start', fontSize: '0.85rem' }}>
                Gallery Management
              </a>
              <a href="/admin" className="btn btn--outline" style={{ justifyContent: 'flex-start', fontSize: '0.85rem' }}>
                Overview Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>

      {submitting && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ textAlign: 'center', padding: '36px 24px', maxWidth: '360px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%', background: '#e6f4ed',
              color: '#0e5c3e', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Loader2 size={26} className="admin-spinner" />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>
              Updating Credentials...
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Saving your new email and password securely.
            </p>
          </div>
        </div>
      )}

      <SaveSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Admin Credentials Updated"
        message={`Your administrator account email and password have been successfully updated. You can now use your new email (${emailInput.trim()}) and password to log in.`}
      />
    </div>
  )
}

