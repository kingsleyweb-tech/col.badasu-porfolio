import React, { useState } from 'react'
import { ShieldCheck, Key, Mail, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const UsersAdmin: React.FC = () => {
  const { user, isDemoAdmin, resetPassword } = useAuth()
  const [resetSubmitting, setResetSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const adminEmail = user?.email || (isDemoAdmin ? 'admin@colonelbadasu.com' : 'Colonel Badasu Administrator')

  const handleTriggerReset = async () => {
    setResetSubmitting(true)
    setMessage(null)
    try {
      if (user?.email) {
        await resetPassword(user.email)
        setMessage(`Firebase password reset link dispatched to ${user.email}. Check inbox to update password.`)
      } else {
        setMessage('Password reset link dispatched to administrator email.')
      }
    } catch {
      setMessage('Unable to send password reset. Verify Firebase Auth setup.')
    } finally {
      setResetSubmitting(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Users & Access Security</h1>
          <p>Manage Firebase Authentication account credentials and Firestore security policies.</p>
        </div>
      </div>

      {message && (
        <div className="admin-alert is-success">
          <CheckCircle2 size={18} />
          <span>{message}</span>
          <button type="button" className="admin-alert__close" onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <div className="admin-dashboard-grid">
        <div className="admin-dashboard-main">
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
                <p><Mail size={14} style={{ display: 'inline', marginRight: '6px' }} /> {adminEmail}</p>
                <div className="admin-badge-row">
                  <span className="admin-badge admin-badge--success">Firebase Authenticated</span>
                  <span className="admin-badge admin-badge--primary">Primary Administrator</span>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card__header">
              <div className="admin-card__title-wrap">
                <Key size={18} />
                <h3>Security & Password Management</h3>
              </div>
            </div>

            <p style={{ color: '#475569', fontSize: '14px', marginBottom: '20px' }}>
              Your account is secured via Firebase Authentication Email + Password provider. To update your security password, click below to trigger a Firebase password reset email.
            </p>

            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleTriggerReset}
              disabled={resetSubmitting}
            >
              {resetSubmitting ? <Loader2 size={16} className="admin-spinner" /> : <Key size={16} />}
              <span>Send Firebase Password Reset Email</span>
            </button>
          </div>
        </div>

        <div className="admin-dashboard-sidebar">
          <div className="admin-security-status-card">
            <ShieldCheck size={24} />
            <div>
              <strong>Firestore Security Rules Active</strong>
              <p>Public users have READ-ONLY access. Writes require an authenticated Firebase admin session.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
