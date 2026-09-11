import React, { useState, useEffect, useRef } from 'react'
import { Footprints, Save, Loader2, UploadCloud, Trash2 } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'
import { UnsavedChangesBanner } from '../components/UnsavedChangesBanner'
import { SaveSuccessModal } from '../components/SaveSuccessModal'
import { resolveImageUrl } from '../../utils/imageResolver'
import { deleteCloudinaryImageIfUnused } from '../../services/imageManager'
import { officer as defaultOfficer, brandAssets } from '../../data/officerData'

export const FooterAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()
  const existing = data?.footer

  const [displayName, setDisplayName] = useState(existing?.displayName || defaultOfficer.name)
  const [displayRank, setDisplayRank] = useState(existing?.displayRank || defaultOfficer.rank)
  const [tagline, setTagline] = useState(existing?.tagline || 'A concise professional profile of his service, leadership, education, and documented achievements.')
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl || '')
  const [imagePublicId, setImagePublicId] = useState(existing?.imagePublicId || '')

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (data?.footer) {
      setDisplayName(data.footer.displayName || defaultOfficer.name)
      setDisplayRank(data.footer.displayRank || defaultOfficer.rank)
      setTagline(data.footer.tagline || '')
      setImageUrl(data.footer.imageUrl || '')
      setImagePublicId(data.footer.imagePublicId || '')
    }
  }, [data])

  const isDirty =
    displayName !== (existing?.displayName || defaultOfficer.name) ||
    displayRank !== (existing?.displayRank || defaultOfficer.rank) ||
    tagline !== (existing?.tagline || '') ||
    imageUrl !== (existing?.imageUrl || '')

  const handleReset = () => {
    setDisplayName(existing?.displayName || defaultOfficer.name)
    setDisplayRank(existing?.displayRank || defaultOfficer.rank)
    setTagline(existing?.tagline || '')
    setImageUrl(existing?.imageUrl || '')
    setImagePublicId(existing?.imagePublicId || '')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updatePortfolio({
        footer: { displayName, displayRank, tagline, imageUrl, imagePublicId },
      })
      setShowSuccess(true)
    } catch {
      alert('Failed to save footer settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    const file = e.target.files[0]
    setUploading(true)
    if (imagePublicId) await deleteCloudinaryImageIfUnused(imagePublicId, data)
    const reader = new FileReader()
    const base64 = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: base64, folder: 'site/footer', filename: file.name }),
    })
    if (res.ok) {
      const json = await res.json()
      const url = json.url || json.thumbnailUrl
      const pid = json.publicId || ''
      setImageUrl(url)
      setImagePublicId(pid)
      await updatePortfolio({ footer: { displayName, displayRank, tagline, imageUrl: url, imagePublicId: pid } })
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleRemoveImage = async () => {
    if (!window.confirm('Remove the footer image? The site logo will be used instead.')) return
    if (imagePublicId) await deleteCloudinaryImageIfUnused(imagePublicId, data)
    setImageUrl('')
    setImagePublicId('')
    await updatePortfolio({ footer: { displayName, displayRank, tagline, imageUrl: '', imagePublicId: '' } })
  }

  const previewImg = imageUrl ? resolveImageUrl(imageUrl) : brandAssets.gafLogo.src

  return (
    <div className="admin-page">
      <UnsavedChangesBanner isDirty={isDirty} onSave={handleSave} onReset={handleReset} isSaving={saving} />

      <div className="admin-page-header admin-page-header--action">
        <div className="admin-page-header__title">
          <div className="admin-header-icon"><Footprints size={24} /></div>
          <div>
            <h1>Footer Settings</h1>
            <p>Change the name, rank, tagline, and logo/image shown in the website footer.</p>
          </div>
        </div>
        <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={18} className="admin-spinner" /> : <Save size={18} />}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="admin-dashboard-grid">
        {/* Left – fields */}
        <div className="admin-dashboard-main">
          <div className="admin-card">
            <div className="admin-card__header"><h3>Footer Name & Text</h3></div>
            <div className="admin-form" style={{ gap: '16px' }}>
              <div className="admin-form-group">
                <label>Display Rank</label>
                <input
                  type="text"
                  value={displayRank}
                  onChange={(e) => setDisplayRank(e.target.value)}
                  placeholder="Colonel"
                />
                <small style={{ color: 'var(--admin-text-muted)', fontSize: '12px' }}>
                  e.g. Colonel, Brigadier General
                </small>
              </div>
              <div className="admin-form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Henry Kwaku Badasu"
                />
                <small style={{ color: 'var(--admin-text-muted)', fontSize: '12px' }}>
                  Shown as "{displayRank} {displayName}" in the footer
                </small>
              </div>
              <div className="admin-form-group">
                <label>Tagline / Description</label>
                <textarea
                  value={tagline}
                  rows={3}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="A concise professional profile..."
                />
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ marginTop: '20px' }}>
            <div className="admin-card__header">
              <h3>Footer Image / Logo</h3>
              <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                If no image is set, the Ghana Armed Forces crest is used
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: 'var(--admin-bg-secondary)',
                  border: '1px solid var(--admin-border)',
                  flexShrink: 0,
                }}
              >
                {uploading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Loader2 size={24} className="admin-spinner" />
                  </div>
                ) : (
                  <img src={previewImg} alt="Footer logo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="btn btn--secondary" style={{ cursor: 'pointer' }}>
                  <UploadCloud size={16} />
                  <span>{imageUrl ? 'Replace Image' : 'Upload Image'}</span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleUpload}
                  />
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    className="btn btn--secondary"
                    style={{ color: 'var(--admin-danger)' }}
                    onClick={handleRemoveImage}
                  >
                    <Trash2 size={16} />
                    <span>Remove Image</span>
                  </button>
                )}
                <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', margin: 0 }}>
                  Recommended: square image, at least 400×400px
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right – live preview */}
        <div className="admin-dashboard-sidebar">
          <div className="admin-card">
            <div className="admin-card__header"><h3>Live Preview</h3></div>
            <div
              style={{
                background: '#0f2d1e',
                borderRadius: '10px',
                padding: '24px',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <img
                src={previewImg}
                alt="Footer preview"
                style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', background: 'rgba(255,255,255,0.1)' }}
              />
              <div>
                <span style={{ fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Personal Portfolio
                </span>
                <h4 style={{ margin: '4px 0', fontSize: '16px', fontWeight: 800 }}>
                  {displayRank} {displayName}
                </h4>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: 0, lineHeight: 1.5 }}>
                  {tagline}
                </p>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                <p style={{ fontSize: '11px', opacity: 0.5, margin: 0 }}>
                  Copyright {new Date().getFullYear()} {displayRank} {displayName}. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SaveSuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Footer Settings Saved"
        message="Footer name, image, and tagline have been updated and are live on the website."
      />
    </div>
  )
}
