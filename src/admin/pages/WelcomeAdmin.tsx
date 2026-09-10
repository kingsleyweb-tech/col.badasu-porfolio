import React, { useState } from 'react'
import { QrCode, Save, CheckCircle2, Loader2, Download, Printer } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'

export const WelcomeAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()

  const [title, setTitle] = useState(data.welcome.title)
  const [subtitle, setSubtitle] = useState(data.welcome.subtitle)
  const [description, setDescription] = useState(data.welcome.description)
  const [qrUrl, setQrUrl] = useState(data.welcome.qrRedirectUrl)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      await updatePortfolio({
        welcome: {
          ...data.welcome,
          title,
          subtitle,
          description,
          qrRedirectUrl: qrUrl
        }
      })
      setMessage('QR Welcome landing page settings saved!')
    } catch {
      setMessage('Failed to save welcome page.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header admin-page-header--action">
        <div className="admin-page-header__title">
          <div className="admin-header-icon">
            <QrCode size={24} />
          </div>
          <div>
            <h1>QR Landing Page & Permanent QR Settings</h1>
            <p>Manage the welcome landing page content and verify the permanent portfolio QR code.</p>
          </div>
        </div>

        <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={18} className="admin-spinner" /> : <Save size={18} />}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
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
          <div className="admin-card">
            <div className="admin-card__header">
              <h3>Welcome Landing Page Text</h3>
            </div>

            <form onSubmit={handleSave} className="admin-form">
              <div className="admin-form-group">
                <label>Page Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="admin-form-group">
                <label>Subtitle / Officer Name</label>
                <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} required />
              </div>

              <div className="admin-form-group">
                <label>Description Paragraph</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
              </div>

              <div className="admin-form-group">
                <label>Permanent QR Redirect Destination URL</label>
                <input type="url" value={qrUrl} onChange={(e) => setQrUrl(e.target.value)} required />
              </div>
            </form>
          </div>
        </div>

        <div className="admin-dashboard-sidebar">
          <div className="admin-card">
            <div className="admin-card__header">
              <h3>Permanent QR Code</h3>
            </div>

            <div className="admin-qr-preview">
              <div className="admin-qr-box">
                <QrCode size={120} className="text-emerald-700" />
              </div>
              <p>Points permanently to: <strong>{qrUrl}</strong></p>
              <div className="admin-qr-actions">
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => window.print()}>
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <a href={qrUrl} target="_blank" rel="noopener noreferrer" className="btn btn--secondary btn--sm">
                  <Download size={14} />
                  <span>Test Link</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
