import React, { useState, useEffect } from 'react'
import { QrCode, Save, CheckCircle2, Loader2, Download, Printer } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { usePortfolio } from '../../context/PortfolioContext'
import { UnsavedChangesBanner } from '../components/UnsavedChangesBanner'
import { SaveSuccessModal } from '../components/SaveSuccessModal'

export const WelcomeAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()

  const [title, setTitle] = useState(data.welcome.title)
  const [subtitle, setSubtitle] = useState(data.welcome.subtitle)
  const [description, setDescription] = useState(data.welcome.description)
  const [qrUrl, setQrUrl] = useState(data.welcome.qrRedirectUrl)

  // Feature card texts
  const [leadershipTitle, setLeadershipTitle] = useState(data.welcome.leadershipTitle || 'LEADERSHIP')
  const [leadershipText, setLeadershipText] = useState(data.welcome.leadershipText || 'Leading with vision, integrity and purpose.')
  const [serviceTitle, setServiceTitle] = useState(data.welcome.serviceTitle || 'SERVICE')
  const [serviceText, setServiceText] = useState(data.welcome.serviceText || 'Dedicated to duty, country and people.')
  const [excellenceTitle, setExcellenceTitle] = useState(data.welcome.excellenceTitle || 'EXCELLENCE')
  const [excellenceText, setExcellenceText] = useState(data.welcome.excellenceText || 'Striving for the highest standards in all I do.')

  const [saving, setSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    setTitle(data.welcome.title)
    setSubtitle(data.welcome.subtitle)
    setDescription(data.welcome.description)
    setQrUrl(data.welcome.qrRedirectUrl)
    setLeadershipTitle(data.welcome.leadershipTitle || 'LEADERSHIP')
    setLeadershipText(data.welcome.leadershipText || 'Leading with vision, integrity and purpose.')
    setServiceTitle(data.welcome.serviceTitle || 'SERVICE')
    setServiceText(data.welcome.serviceText || 'Dedicated to duty, country and people.')
    setExcellenceTitle(data.welcome.excellenceTitle || 'EXCELLENCE')
    setExcellenceText(data.welcome.excellenceText || 'Striving for the highest standards in all I do.')
  }, [data])

  const isDirty =
    title !== data.welcome.title ||
    subtitle !== data.welcome.subtitle ||
    description !== data.welcome.description ||
    qrUrl !== data.welcome.qrRedirectUrl ||
    leadershipTitle !== (data.welcome.leadershipTitle || 'LEADERSHIP') ||
    leadershipText !== (data.welcome.leadershipText || 'Leading with vision, integrity and purpose.') ||
    serviceTitle !== (data.welcome.serviceTitle || 'SERVICE') ||
    serviceText !== (data.welcome.serviceText || 'Dedicated to duty, country and people.') ||
    excellenceTitle !== (data.welcome.excellenceTitle || 'EXCELLENCE') ||
    excellenceText !== (data.welcome.excellenceText || 'Striving for the highest standards in all I do.')

  const handleReset = () => {
    setTitle(data.welcome.title)
    setSubtitle(data.welcome.subtitle)
    setDescription(data.welcome.description)
    setQrUrl(data.welcome.qrRedirectUrl)
    setLeadershipTitle(data.welcome.leadershipTitle || 'LEADERSHIP')
    setLeadershipText(data.welcome.leadershipText || 'Leading with vision, integrity and purpose.')
    setServiceTitle(data.welcome.serviceTitle || 'SERVICE')
    setServiceText(data.welcome.serviceText || 'Dedicated to duty, country and people.')
    setExcellenceTitle(data.welcome.excellenceTitle || 'EXCELLENCE')
    setExcellenceText(data.welcome.excellenceText || 'Striving for the highest standards in all I do.')
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      await updatePortfolio({
        welcome: {
          ...data.welcome,
          title,
          subtitle,
          description,
          qrRedirectUrl: qrUrl,
          leadershipTitle,
          leadershipText,
          serviceTitle,
          serviceText,
          excellenceTitle,
          excellenceText,
        },
      })
      setShowSuccessModal(true)
    } catch {
      alert('Failed to save welcome page settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadQR = () => {
    const svg = document.getElementById('admin-qr-code')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 400
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, 400, 400)
      ctx.drawImage(img, 0, 0, 400, 400)
      const a = document.createElement('a')
      a.download = 'colonel-badasu-qr-code.png'
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`
  }

  return (
    <div className="admin-page">
      <UnsavedChangesBanner isDirty={isDirty} onSave={() => handleSave()} onReset={handleReset} isSaving={saving} />

      <div className="admin-page-header admin-page-header--action">
        <div className="admin-page-header__title">
          <div className="admin-header-icon"><QrCode size={24} /></div>
          <div>
            <h1>QR Landing Page & Welcome Settings</h1>
            <p>Manage the welcome landing page content, feature card texts, and the permanent portfolio QR code.</p>
          </div>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => handleSave()} disabled={saving}>
          {saving ? <Loader2 size={18} className="admin-spinner" /> : <Save size={18} />}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="admin-dashboard-grid">
        {/* Left column */}
        <div className="admin-dashboard-main">
          {/* Landing page text */}
          <div className="admin-card" style={{ marginBottom: '24px' }}>
            <div className="admin-card__header"><h3>Welcome Landing Page Text</h3></div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="admin-form-group">
                <label>Page Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="admin-form-group">
                <label>Subtitle / Officer Name Line</label>
                <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} required />
              </div>
              <div className="admin-form-group">
                <label>Description Paragraph</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
              </div>
              <div className="admin-form-group">
                <label>Permanent QR Redirect URL</label>
                <input type="url" value={qrUrl} onChange={(e) => setQrUrl(e.target.value)} required placeholder="https://colonelbadasu.com" />
              </div>
            </form>
          </div>

          {/* Feature Cards */}
          <div className="admin-card">
            <div className="admin-card__header">
              <h3>Feature Card Texts</h3>
              <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>Shown on the welcome page under the main heading</span>
            </div>
            <div className="admin-grid-3" style={{ gap: '16px' }}>
              {/* Leadership */}
              <div style={{ background: 'var(--admin-bg-secondary)', borderRadius: '8px', padding: '16px' }}>
                <div className="admin-form-group">
                  <label>Card 1 Title</label>
                  <input type="text" value={leadershipTitle} onChange={(e) => setLeadershipTitle(e.target.value)} />
                </div>
                <div className="admin-form-group">
                  <label>Card 1 Text</label>
                  <textarea value={leadershipText} onChange={(e) => setLeadershipText(e.target.value)} rows={3} />
                </div>
              </div>
              {/* Service */}
              <div style={{ background: 'var(--admin-bg-secondary)', borderRadius: '8px', padding: '16px' }}>
                <div className="admin-form-group">
                  <label>Card 2 Title</label>
                  <input type="text" value={serviceTitle} onChange={(e) => setServiceTitle(e.target.value)} />
                </div>
                <div className="admin-form-group">
                  <label>Card 2 Text</label>
                  <textarea value={serviceText} onChange={(e) => setServiceText(e.target.value)} rows={3} />
                </div>
              </div>
              {/* Excellence */}
              <div style={{ background: 'var(--admin-bg-secondary)', borderRadius: '8px', padding: '16px' }}>
                <div className="admin-form-group">
                  <label>Card 3 Title</label>
                  <input type="text" value={excellenceTitle} onChange={(e) => setExcellenceTitle(e.target.value)} />
                </div>
                <div className="admin-form-group">
                  <label>Card 3 Text</label>
                  <textarea value={excellenceText} onChange={(e) => setExcellenceText(e.target.value)} rows={3} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Real QR Code */}
        <div className="admin-dashboard-sidebar">
          <div className="admin-card">
            <div className="admin-card__header"><h3>Permanent QR Code</h3></div>
            <div className="admin-qr-preview">
              <div className="admin-qr-box" style={{ background: 'white', padding: '16px', borderRadius: '12px', display: 'inline-block' }}>
                <QRCodeSVG
                  id="admin-qr-code"
                  value={qrUrl || 'https://colonelbadasu.com'}
                  size={200}
                  level="H"
                  includeMargin={false}
                  style={{ display: 'block' }}
                />
              </div>
              <p style={{ fontSize: '13px', color: 'var(--admin-text-muted)', marginTop: '12px', wordBreak: 'break-all' }}>
                Points to: <strong style={{ color: '#0f172a' }}>{qrUrl}</strong>
              </p>
              <div className="admin-qr-actions">
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => window.print()}>
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button type="button" className="btn btn--secondary btn--sm" onClick={handleDownloadQR}>
                  <Download size={14} />
                  <span>Download PNG</span>
                </button>
                <a href={qrUrl} target="_blank" rel="noopener noreferrer" className="btn btn--secondary btn--sm">
                  <CheckCircle2 size={14} />
                  <span>Test Link</span>
                </a>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="admin-card" style={{ marginTop: '24px' }}>
            <div className="admin-card__header"><h3>Feature Cards Preview</h3></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { t: leadershipTitle, d: leadershipText },
                { t: serviceTitle, d: serviceText },
                { t: excellenceTitle, d: excellenceText },
              ].map((card, i) => (
                <div key={i} style={{ background: 'var(--admin-bg-secondary)', borderRadius: '8px', padding: '12px 16px', borderLeft: '3px solid var(--admin-primary)' }}>
                  <strong style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>{card.t}</strong>
                  <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', margin: 0 }}>{card.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SaveSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Welcome Page Saved"
        message="QR code settings and welcome page content have been updated and are live."
      />
    </div>
  )
}
