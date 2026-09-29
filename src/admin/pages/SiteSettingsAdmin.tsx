import React, { useState, useEffect } from 'react'
import { Settings, Save, UploadCloud, Loader2 } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'
import { UnsavedChangesBanner } from '../components/UnsavedChangesBanner'
import { SaveSuccessModal } from '../components/SaveSuccessModal'
import { resolveImageUrl } from '../../utils/imageResolver'
import { deleteCloudinaryImageIfUnused } from '../../services/imageManager'
import { adminFetch } from '../../services/adminApi'

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

      const res = await adminFetch('/api/upload', {
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

  const field = (id: string, label: string, value: string, onChange: (v: string) => void, opts: { required?: boolean; type?: string; placeholder?: string; maxLength?: number; hint?: string } = {}) => (
    <div>
      <label className="ad-lbl" htmlFor={id}>{label}{opts.required ? ' *' : ''}</label>
      <input
        id={id}
        className="ad-field"
        type={opts.type ?? 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={opts.placeholder}
        maxLength={opts.maxLength}
        required={opts.required}
      />
      {opts.hint && <div className="ad-hint">{opts.hint}</div>}
    </div>
  )

  return (
    <div className="ad-page">
      <div className="ad-ph">
        <div className="t">
          <span className="ic"><Settings size={26} /></span>
          <div>
            <h1>Site &amp; branding</h1>
            <p>Logo, sidebar brand, admin profile, site title and contact details.</p>
          </div>
        </div>
        <button type="button" className="ad-b g" onClick={() => handleSave()} disabled={saving}>
          {saving ? <Loader2 size={16} className="admin-spinner" /> : <Save size={16} />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <UnsavedChangesBanner isDirty={isDirty} onSave={() => handleSave()} onReset={handleReset} isSaving={saving} />

      <div className="ad-two settings">
        <form className="ad-card" onSubmit={handleSave}>
          <div className="ad-step"><i>1</i>Emblem &amp; logo</div>
          <div className="ad-logo">
            <img src={resolveImageUrl(logoUrl)} alt="Current emblem" />
            <div className="ad-logo-txt">
              <b>Site emblem</b>
              <span>Shown in the website header, footer and admin sidebar. Stored in Cloudinary.</span>
            </div>
            <div className="acts">
              <label className="ad-b sm gold">
                {uploadingLogo ? <Loader2 size={14} className="admin-spinner" /> : <UploadCloud size={14} />}
                {uploadingLogo ? 'Uploading…' : 'Replace'}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="sr-only" />
              </label>
              <button
                type="button"
                className="ad-b sm lw"
                onClick={() => setLogoUrl('https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_100/colonel-badasu/site/root/image')}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="ad-step"><i>2</i>Sidebar brand</div>
          <div className="ad-grid2">
            {field('sb-title', 'Sidebar title', adminSidebarTitle, setAdminSidebarTitle, { required: true, placeholder: 'e.g. Col. Badasu' })}
            {field('sb-sub', 'Sidebar subtitle', adminSidebarSubtitle, setAdminSidebarSubtitle, { required: true, placeholder: 'e.g. PORTFOLIO ADMIN' })}
          </div>

          <div className="ad-step"><i>3</i>Admin profile in header</div>
          <div className="ad-grid2">
            {field('hd-name', 'Display name', adminHeaderDisplayName, setAdminHeaderDisplayName, { required: true, placeholder: 'e.g. Col. Henry K. Badasu' })}
            {field('hd-role', 'Role', adminHeaderRole, setAdminHeaderRole, { required: true, placeholder: 'e.g. Administrator' })}
            {field('hd-init', 'Avatar initials', adminHeaderInitials, setAdminHeaderInitials, { required: true, maxLength: 3, placeholder: 'e.g. HB', hint: 'One to three letters.' })}
          </div>

          <div className="ad-step"><i>4</i>Website details</div>
          <div className="ad-grid2">
            <div className="full">{field('site-title', 'Site title', siteTitle, setSiteTitle, { required: true })}</div>
            <div className="full">
              <label className="ad-lbl" htmlFor="site-desc">Site description</label>
              <textarea id="site-desc" className="ad-field" rows={3} value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} required />
            </div>
            {field('c-email', 'Contact email', contactEmail, setContactEmail, { type: 'email', required: true })}
            {field('c-phone', 'Contact phone', contactPhone, setContactPhone)}
            <div className="full">{field('c-addr', 'Headquarters address', contactAddress, setContactAddress)}</div>
          </div>
        </form>

        <div className="ad-side">
          <div className="ad-card">
            <div className="hd"><h3>Live sidebar preview</h3></div>
            <div className="ad-pv">
              <div className="brand">
                <img src={resolveImageUrl(logoUrl)} alt="" />
                <div><b>{adminSidebarTitle}</b><small>{adminSidebarSubtitle}</small></div>
              </div>
              <div className="me">
                <span className="ad-av">{adminHeaderInitials}</span>
                <div><b>{adminHeaderDisplayName}</b><small>{adminHeaderRole}</small></div>
              </div>
            </div>
          </div>
          <div className="ad-card">
            <div className="hd"><h3>Asset storage</h3></div>
            <div className="ad-kv"><span>Storage engine</span><b>Cloudinary CDN</b></div>
            <div className="ad-kv"><span>Logo folder</span><code>site/logo</code></div>
            <div className="ad-kv"><span>Optimisation</span><b className="green">Auto WebP &amp; lossless</b></div>
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
