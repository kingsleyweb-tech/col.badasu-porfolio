import React, { useState, useEffect } from 'react'
import { Settings, Save, UploadCloud, Trash2, Loader2 } from 'lucide-react'
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
  }, [data])

  const isDirty =
    siteTitle !== data.siteSettings.siteTitle ||
    siteDescription !== data.siteSettings.siteDescription ||
    logoUrl !== data.siteSettings.logoUrl ||
    contactEmail !== data.siteSettings.contactEmail ||
    contactPhone !== data.siteSettings.contactPhone ||
    contactAddress !== data.siteSettings.contactAddress

  const handleReset = () => {
    setSiteTitle(data.siteSettings.siteTitle)
    setSiteDescription(data.siteSettings.siteDescription)
    setLogoUrl(data.siteSettings.logoUrl)
    setContactEmail(data.siteSettings.contactEmail)
    setContactPhone(data.siteSettings.contactPhone)
    setContactAddress(data.siteSettings.contactAddress)
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
          contactAddress
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
            <h1>Site Settings & Header Logo</h1>
            <p>Manage header crest logo (replace gaf.png), site title, SEO descriptions, and official contact information.</p>
          </div>
        </div>

        <button type="button" className="btn btn--primary" onClick={() => handleSave()} disabled={saving}>
          {saving ? <Loader2 size={18} className="admin-spinner" /> : <Save size={18} />}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="admin-dashboard-grid">
        <div className="admin-dashboard-main">
          {/* Header Logo Management Card */}
          <div className="admin-card" style={{ marginBottom: '24px' }}>
            <div className="admin-card__header">
              <h3>Header Crest Logo Management</h3>
              <p>Replace or update the official crest logo displayed in the portfolio header.</p>
            </div>

            <div className="admin-logo-preview-row">
              <div className="admin-logo-preview-box">
                <img src={resolveImageUrl(logoUrl)} alt="Header Logo Preview" />
              </div>

              <div className="admin-logo-preview-info">
                <strong>Current Header Logo</strong>
                <p>Stored in Cloudinary and referenced dynamically by the public navigation bar.</p>
                <div className="admin-action-group">
                  <label className="btn btn--secondary btn--sm">
                    <UploadCloud size={16} />
                    <span>{uploadingLogo ? 'Uploading...' : 'Replace Logo'}</span>
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
          </div>

          {/* Global Site Settings Form */}
          <div className="admin-card">
            <div className="admin-card__header">
              <h3>Global Portfolio Settings</h3>
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
        title="Site Settings Saved"
        message="Site settings and logo updated live on your site."
      />
    </div>
  )
}

