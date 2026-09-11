import React, { useState, useEffect } from 'react'
import { Settings, Save, UploadCloud, Trash2, Loader2, UserCheck, ShieldCheck } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'
import { UnsavedChangesBanner } from '../components/UnsavedChangesBanner'
import { SaveSuccessModal } from '../components/SaveSuccessModal'
import { resolveImageUrl } from '../../utils/imageResolver'
import { deleteCloudinaryImageIfUnused } from '../../services/imageManager'

export const SiteSettingsAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()

  const [siteTitle, setSiteTitle] = useState(data.siteSettings.siteTitle)
  const [siteDescription, setSiteDescription] = useState(data.siteSettings.siteDescription)
  const [logoUrl, setLogoUrl] = useState(data.siteSettings.logoUrl)
  const [contactEmail, setContactEmail] = useState(data.siteSettings.contactEmail)
  const [contactPhone, setContactPhone] = useState(data.siteSettings.contactPhone)
  const [contactAddress, setContactAddress] = useState(data.siteSettings.contactAddress)

  // Admin Dashboard Branding & Header settings
  const [adminSidebarTitle, setAdminSidebarTitle] = useState(data.siteSettings.adminSidebarTitle || 'Col. Badasu')
  const [adminSidebarSubtitle, setAdminSidebarSubtitle] = useState(data.siteSettings.adminSidebarSubtitle || 'PORTFOLIO ADMIN')
  const [adminHeaderDisplayName, setAdminHeaderDisplayName] = useState(data.siteSettings.adminHeaderDisplayName || 'Col. Henry K. Badasu')
  const [adminHeaderRole, setAdminHeaderRole] = useState(data.siteSettings.adminHeaderRole || 'Administrator')
  const [adminHeaderInitials, setAdminHeaderInitials] = useState(data.siteSettings.adminHeaderInitials || 'MB')

  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    setSiteTitle(data.siteSettings.siteTitle)
    setSiteDescription(data.siteSettings.siteDescription)
    setLogoUrl(data.siteSettings.logoUrl)
    setContactEmail(data.siteSettings.contactEmail)
    setContactPhone(data.siteSettings.contactPhone)
    setContactAddress(data.siteSettings.contactAddress)
    setAdminSidebarTitle(data.siteSettings.adminSidebarTitle || 'Col. Badasu')
    setAdminSidebarSubtitle(data.siteSettings.adminSidebarSubtitle || 'PORTFOLIO ADMIN')
    setAdminHeaderDisplayName(data.siteSettings.adminHeaderDisplayName || 'Col. Henry K. Badasu')
    setAdminHeaderRole(data.siteSettings.adminHeaderRole || 'Administrator')
    setAdminHeaderInitials(data.siteSettings.adminHeaderInitials || 'MB')
  }, [data])

  const isDirty =
    siteTitle !== data.siteSettings.siteTitle ||
    siteDescription !== data.siteSettings.siteDescription ||
    logoUrl !== data.siteSettings.logoUrl ||
    contactEmail !== data.siteSettings.contactEmail ||
    contactPhone !== data.siteSettings.contactPhone ||
    contactAddress !== data.siteSettings.contactAddress ||
    adminSidebarTitle !== (data.siteSettings.adminSidebarTitle || 'Col. Badasu') ||
    adminSidebarSubtitle !== (data.siteSettings.adminSidebarSubtitle || 'PORTFOLIO ADMIN') ||
    adminHeaderDisplayName !== (data.siteSettings.adminHeaderDisplayName || 'Col. Henry K. Badasu') ||
    adminHeaderRole !== (data.siteSettings.adminHeaderRole || 'Administrator') ||
    adminHeaderInitials !== (data.siteSettings.adminHeaderInitials || 'MB')

  const handleReset = () => {
    setSiteTitle(data.siteSettings.siteTitle)
    setSiteDescription(data.siteSettings.siteDescription)
    setLogoUrl(data.siteSettings.logoUrl)
    setContactEmail(data.siteSettings.contactEmail)
    setContactPhone(data.siteSettings.contactPhone)
    setContactAddress(data.siteSettings.contactAddress)
    setAdminSidebarTitle(data.siteSettings.adminSidebarTitle || 'Col. Badasu')
    setAdminSidebarSubtitle(data.siteSettings.adminSidebarSubtitle || 'PORTFOLIO ADMIN')
    setAdminHeaderDisplayName(data.siteSettings.adminHeaderDisplayName || 'Col. Henry K. Badasu')
    setAdminHeaderRole(data.siteSettings.adminHeaderRole || 'Administrator')
    setAdminHeaderInitials(data.siteSettings.adminHeaderInitials || 'MB')
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]

    setUploadingLogo(true)

    try {
      const reader = new FileReader()
      const base64Data = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: base64Data,
          folder: 'site/logo',
          filename: 'gaf-logo'
        })
      })

      if (res.ok) {
        const result = await res.json()
        const newLogo = result.url || result.thumbnailUrl
        const oldLogo = logoUrl
        setLogoUrl(newLogo)
        if (oldLogo && oldLogo !== newLogo) {
          await deleteCloudinaryImageIfUnused(oldLogo, data)
        }
      } else {
        alert('Failed to upload logo.')
      }
    } catch {
      alert('Error uploading logo image.')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)

    try {
      await updatePortfolio({
        siteSettings: {
          ...data.siteSettings,
          siteTitle,
          siteDescription,
          logoUrl,
          contactEmail,
          contactPhone,
          contactAddress,
          adminSidebarTitle,
          adminSidebarSubtitle,
          adminHeaderDisplayName,
          adminHeaderRole,
          adminHeaderInitials
        }
      })
      setShowSuccessModal(true)
    } catch {
      alert('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <UnsavedChangesBanner
        isDirty={isDirty}
        onSave={() => handleSave()}
        onReset={handleReset}
        isSaving={saving}
      />

      <div className="admin-page-header admin-page-header--action">
        <div className="admin-page-header__title">
          <div className="admin-header-icon">
            <Settings size={24} />
          </div>
          <div>
            <h1>Site Settings & Admin Dashboard Branding</h1>
            <p>Customize the logo, sidebar brand name, header admin user profile, site title, and contact details.</p>
          </div>
        </div>

        <button type="button" className="btn btn--primary" onClick={() => handleSave()} disabled={saving}>
          {saving ? <Loader2 size={18} className="admin-spinner" /> : <Save size={18} />}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="admin-dashboard-grid">
        <div className="admin-dashboard-main">
          {/* SECTION 1: Admin Dashboard Branding, Sidebar & Top Header Settings */}
          <div className="admin-card" style={{ marginBottom: '24px' }}>
            <div className="admin-card__header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} style={{ color: '#1f5c3a' }} />
                <span>Admin Dashboard & Sidebar Branding</span>
              </h3>
              <p>Change the logo, title, and subtitle in the left sidebar as well as the name and avatar in the top header.</p>
            </div>

            <div className="admin-logo-preview-row" style={{ marginBottom: '20px' }}>
              <div className="admin-logo-preview-box" style={{ background: '#0b2d21', padding: '12px', borderRadius: '12px' }}>
                <img src={resolveImageUrl(logoUrl)} alt="Header Logo Preview" style={{ objectFit: 'contain', maxHeight: '50px' }} />
              </div>

              <div className="admin-logo-preview-info">
                <strong>Sidebar & Site Emblem Logo</strong>
                <p>Appears in the left sidebar and public website header. Stored in Cloudinary.</p>
                <div className="admin-action-group">
                  <label className="btn btn--secondary btn--sm" style={{ cursor: 'pointer' }}>
                    <UploadCloud size={16} />
                    <span>{uploadingLogo ? 'Uploading...' : 'Replace Emblem / Logo'}</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                  </label>
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm is-danger"
                    onClick={() => setLogoUrl('https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_100/colonel-badasu/site/root/image')}
                  >
                    <Trash2 size={16} />
                    <span>Reset Default</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Branding Fields */}
            <div className="admin-form">
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#1f5c3a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                1. Left Sidebar Brand Name
              </h4>
              <div className="admin-form-row" style={{ marginBottom: '20px' }}>
                <div className="admin-form-group">
                  <label>Sidebar Brand Title *</label>
                  <input
                    type="text"
                    value={adminSidebarTitle}
                    onChange={(e) => setAdminSidebarTitle(e.target.value)}
                    placeholder="e.g. Col. Badasu"
                    required
                  />
                  <small style={{ color: '#64748b' }}>Primary name shown at top left of sidebar</small>
                </div>
                <div className="admin-form-group">
                  <label>Sidebar Subtitle / Tagline *</label>
                  <input
                    type="text"
                    value={adminSidebarSubtitle}
                    onChange={(e) => setAdminSidebarSubtitle(e.target.value)}
                    placeholder="e.g. PORTFOLIO ADMIN"
                    required
                  />
                  <small style={{ color: '#64748b' }}>Subtitle shown beneath title in sidebar</small>
                </div>
              </div>

              {/* Top Header User Profile Fields */}
              <h4 style={{ margin: '16px 0 12px 0', fontSize: '0.875rem', color: '#1f5c3a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                2. Top Dashboard Header User Profile
              </h4>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Header Display Name *</label>
                  <input
                    type="text"
                    value={adminHeaderDisplayName}
                    onChange={(e) => setAdminHeaderDisplayName(e.target.value)}
                    placeholder="e.g. Col. Henry K. Badasu"
                    required
                  />
                  <small style={{ color: '#64748b' }}>Name displayed in top right user pill</small>
                </div>
                <div className="admin-form-group">
                  <label>Header User Role *</label>
                  <input
                    type="text"
                    value={adminHeaderRole}
                    onChange={(e) => setAdminHeaderRole(e.target.value)}
                    placeholder="e.g. Administrator"
                    required
                  />
                  <small style={{ color: '#64748b' }}>Role subtitle beneath header name</small>
                </div>
                <div className="admin-form-group">
                  <label>Avatar Badge Initials *</label>
                  <input
                    type="text"
                    value={adminHeaderInitials}
                    onChange={(e) => setAdminHeaderInitials(e.target.value)}
                    placeholder="e.g. MB"
                    maxLength={3}
                    required
                  />
                  <small style={{ color: '#64748b' }}>1-3 letter badge (e.g. MB)</small>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Global Site Settings Form */}
          <div className="admin-card">
            <div className="admin-card__header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={20} style={{ color: '#1f5c3a' }} />
                <span>Global Portfolio & Contact Settings</span>
              </h3>
            </div>

            <form onSubmit={handleSave} className="admin-form">
              <div className="admin-form-group">
                <label>Website Title</label>
                <input type="text" value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} required />
              </div>

              <div className="admin-form-group">
                <label>Meta Description / SEO Tagline</label>
                <textarea value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} rows={3} required />
              </div>

              <div className="admin-form-group">
                <label>Official Contact Email</label>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Official Phone Number</label>
                  <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                </div>
                <div className="admin-form-group">
                  <label>Official Headquarters Address</label>
                  <input type="text" value={contactAddress} onChange={(e) => setContactAddress(e.target.value)} />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <SaveSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Settings & Branding Saved"
        message="Dashboard sidebar branding, header user info, site settings and logo updated live."
      />
    </div>
  )
}
