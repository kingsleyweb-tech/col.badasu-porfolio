import React, { useState, useEffect, useRef } from 'react'
import { QrCode, Save, CheckCircle2, Loader2, Download, Printer, UploadCloud, Trash2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { usePortfolio } from '../../context/PortfolioContext'
import { UnsavedChangesBanner } from '../components/UnsavedChangesBanner'
import { SaveSuccessModal } from '../components/SaveSuccessModal'
import { uploadImageToCloudinary, deleteCloudinaryImageIfUnused } from '../../services/imageManager'
import { resolveImageUrl } from '../../utils/imageResolver'
import { welcomeFeatureImages } from '../../data/officerData'

export const WelcomeAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()

  const [title, setTitle] = useState(data.welcome.title)
  const [subtitle, setSubtitle] = useState(data.welcome.subtitle)
  const [description, setDescription] = useState(data.welcome.description)
  const [qrUrl, setQrUrl] = useState(data.welcome.qrRedirectUrl)

  // Feature card texts
  const [leadershipTitle, setLeadershipTitle] = useState(data.welcome.leadershipTitle || 'LEADERSHIP')
  const [leadershipText, setLeadershipText] = useState(data.welcome.leadershipText || 'Leading with vision, integrity and purpose.')
  const [leadershipImage, setLeadershipImage] = useState(data.welcome.leadershipImage || '')
  const [leadershipImagePublicId, setLeadershipImagePublicId] = useState(data.welcome.leadershipImagePublicId || '')

  const [serviceTitle, setServiceTitle] = useState(data.welcome.serviceTitle || 'SERVICE')
  const [serviceText, setServiceText] = useState(data.welcome.serviceText || 'Dedicated to duty, country and people.')
  const [serviceImage, setServiceImage] = useState(data.welcome.serviceImage || '')
  const [serviceImagePublicId, setServiceImagePublicId] = useState(data.welcome.serviceImagePublicId || '')

  const [excellenceTitle, setExcellenceTitle] = useState(data.welcome.excellenceTitle || 'EXCELLENCE')
  const [excellenceText, setExcellenceText] = useState(data.welcome.excellenceText || 'Striving for the highest standards in all I do.')
  const [excellenceImage, setExcellenceImage] = useState(data.welcome.excellenceImage || '')
  const [excellenceImagePublicId, setExcellenceImagePublicId] = useState(data.welcome.excellenceImagePublicId || '')

  const [uploadingCard, setUploadingCard] = useState<'leadership' | 'service' | 'excellence' | null>(null)
  const [saving, setSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const leadershipFileRef = useRef<HTMLInputElement>(null)
  const serviceFileRef = useRef<HTMLInputElement>(null)
  const excellenceFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTitle(data.welcome.title)
    setSubtitle(data.welcome.subtitle)
    setDescription(data.welcome.description)
    setQrUrl(data.welcome.qrRedirectUrl)
    setLeadershipTitle(data.welcome.leadershipTitle || 'LEADERSHIP')
    setLeadershipText(data.welcome.leadershipText || 'Leading with vision, integrity and purpose.')
    setLeadershipImage(data.welcome.leadershipImage || '')
    setLeadershipImagePublicId(data.welcome.leadershipImagePublicId || '')
    setServiceTitle(data.welcome.serviceTitle || 'SERVICE')
    setServiceText(data.welcome.serviceText || 'Dedicated to duty, country and people.')
    setServiceImage(data.welcome.serviceImage || '')
    setServiceImagePublicId(data.welcome.serviceImagePublicId || '')
    setExcellenceTitle(data.welcome.excellenceTitle || 'EXCELLENCE')
    setExcellenceText(data.welcome.excellenceText || 'Striving for the highest standards in all I do.')
    setExcellenceImage(data.welcome.excellenceImage || '')
    setExcellenceImagePublicId(data.welcome.excellenceImagePublicId || '')
  }, [data])

  const isDirty =
    title !== data.welcome.title ||
    subtitle !== data.welcome.subtitle ||
    description !== data.welcome.description ||
    qrUrl !== data.welcome.qrRedirectUrl ||
    leadershipTitle !== (data.welcome.leadershipTitle || 'LEADERSHIP') ||
    leadershipText !== (data.welcome.leadershipText || 'Leading with vision, integrity and purpose.') ||
    leadershipImage !== (data.welcome.leadershipImage || '') ||
    serviceTitle !== (data.welcome.serviceTitle || 'SERVICE') ||
    serviceText !== (data.welcome.serviceText || 'Dedicated to duty, country and people.') ||
    serviceImage !== (data.welcome.serviceImage || '') ||
    excellenceTitle !== (data.welcome.excellenceTitle || 'EXCELLENCE') ||
    excellenceText !== (data.welcome.excellenceText || 'Striving for the highest standards in all I do.') ||
    excellenceImage !== (data.welcome.excellenceImage || '')

  const handleReset = () => {
    setTitle(data.welcome.title)
    setSubtitle(data.welcome.subtitle)
    setDescription(data.welcome.description)
    setQrUrl(data.welcome.qrRedirectUrl)
    setLeadershipTitle(data.welcome.leadershipTitle || 'LEADERSHIP')
    setLeadershipText(data.welcome.leadershipText || 'Leading with vision, integrity and purpose.')
    setLeadershipImage(data.welcome.leadershipImage || '')
    setLeadershipImagePublicId(data.welcome.leadershipImagePublicId || '')
    setServiceTitle(data.welcome.serviceTitle || 'SERVICE')
    setServiceText(data.welcome.serviceText || 'Dedicated to duty, country and people.')
    setServiceImage(data.welcome.serviceImage || '')
    setServiceImagePublicId(data.welcome.serviceImagePublicId || '')
    setExcellenceTitle(data.welcome.excellenceTitle || 'EXCELLENCE')
    setExcellenceText(data.welcome.excellenceText || 'Striving for the highest standards in all I do.')
    setExcellenceImage(data.welcome.excellenceImage || '')
    setExcellenceImagePublicId(data.welcome.excellenceImagePublicId || '')
  }

  const handleUploadCardImage = async (cardKey: 'leadership' | 'service' | 'excellence', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCard(cardKey)

    try {
      const res = await uploadImageToCloudinary(file, 'colonel-badasu/welcome')
      if (res.success && res.url) {
        if (cardKey === 'leadership') {
          if (leadershipImage) await deleteCloudinaryImageIfUnused(leadershipImage, data)
          setLeadershipImage(res.url)
          setLeadershipImagePublicId(res.publicId)
        } else if (cardKey === 'service') {
          if (serviceImage) await deleteCloudinaryImageIfUnused(serviceImage, data)
          setServiceImage(res.url)
          setServiceImagePublicId(res.publicId)
        } else if (cardKey === 'excellence') {
          if (excellenceImage) await deleteCloudinaryImageIfUnused(excellenceImage, data)
          setExcellenceImage(res.url)
          setExcellenceImagePublicId(res.publicId)
        }
      } else {
        alert(res.error || 'Failed to upload image to Cloudinary.')
      }
    } catch {
      alert('Error uploading image to Cloudinary.')
    } finally {
      setUploadingCard(null)
      e.target.value = ''
    }
  }

  const handleRemoveCardImage = async (cardKey: 'leadership' | 'service' | 'excellence') => {
    if (cardKey === 'leadership' && leadershipImage) {
      await deleteCloudinaryImageIfUnused(leadershipImage, data)
      setLeadershipImage('')
      setLeadershipImagePublicId('')
    } else if (cardKey === 'service' && serviceImage) {
      await deleteCloudinaryImageIfUnused(serviceImage, data)
      setServiceImage('')
      setServiceImagePublicId('')
    } else if (cardKey === 'excellence' && excellenceImage) {
      await deleteCloudinaryImageIfUnused(excellenceImage, data)
      setExcellenceImage('')
      setExcellenceImagePublicId('')
    }
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
          leadershipImage,
          leadershipImagePublicId,
          serviceTitle,
          serviceText,
          serviceImage,
          serviceImagePublicId,
          excellenceTitle,
          excellenceText,
          excellenceImage,
          excellenceImagePublicId,
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
            <p>Manage the welcome landing page content, card title images, feature texts, and permanent portfolio QR code.</p>
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

          {/* Feature Cards with Image Upload */}
          <div className="admin-card">
            <div className="admin-card__header">
              <div>
                <h3>Feature Card Texts & Icons</h3>
                <p style={{ fontSize: '13px', color: 'var(--admin-text-muted)', margin: 0 }}>
                  Upload/change custom icons for each card. Saved directly to Cloudinary.
                </p>
              </div>
            </div>

            <div className="admin-grid-3" style={{ gap: '16px' }}>
              {/* Leadership Card */}
              <div style={{ background: 'var(--admin-bg-secondary)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>Card 1 (Leadership)</span>
                  {uploadingCard === 'leadership' && <Loader2 size={16} className="admin-spin" style={{ color: 'var(--admin-primary)' }} />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'white', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    <img
                      src={resolveImageUrl(leadershipImage || welcomeFeatureImages.leadership.src)}
                      alt="Leadership Icon"
                      style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <input
                      type="file"
                      ref={leadershipFileRef}
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={(e) => handleUploadCardImage('leadership', e)}
                    />
                    <button
                      type="button"
                      className="btn btn--secondary btn--xs"
                      onClick={() => leadershipFileRef.current?.click()}
                      disabled={uploadingCard === 'leadership'}
                    >
                      <UploadCloud size={13} />
                      <span>{leadershipImage ? 'Change' : 'Upload'}</span>
                    </button>
                    {leadershipImage && (
                      <button
                        type="button"
                        className="btn btn--danger btn--xs"
                        onClick={() => handleRemoveCardImage('leadership')}
                        disabled={uploadingCard === 'leadership'}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label>Title</label>
                  <input type="text" value={leadershipTitle} onChange={(e) => setLeadershipTitle(e.target.value)} />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label>Description</label>
                  <textarea value={leadershipText} onChange={(e) => setLeadershipText(e.target.value)} rows={3} />
                </div>
              </div>

              {/* Service Card */}
              <div style={{ background: 'var(--admin-bg-secondary)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>Card 2 (Service)</span>
                  {uploadingCard === 'service' && <Loader2 size={16} className="admin-spin" style={{ color: 'var(--admin-primary)' }} />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'white', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    <img
                      src={resolveImageUrl(serviceImage || welcomeFeatureImages.service.src)}
                      alt="Service Icon"
                      style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <input
                      type="file"
                      ref={serviceFileRef}
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={(e) => handleUploadCardImage('service', e)}
                    />
                    <button
                      type="button"
                      className="btn btn--secondary btn--xs"
                      onClick={() => serviceFileRef.current?.click()}
                      disabled={uploadingCard === 'service'}
                    >
                      <UploadCloud size={13} />
                      <span>{serviceImage ? 'Change' : 'Upload'}</span>
                    </button>
                    {serviceImage && (
                      <button
                        type="button"
                        className="btn btn--danger btn--xs"
                        onClick={() => handleRemoveCardImage('service')}
                        disabled={uploadingCard === 'service'}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label>Title</label>
                  <input type="text" value={serviceTitle} onChange={(e) => setServiceTitle(e.target.value)} />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label>Description</label>
                  <textarea value={serviceText} onChange={(e) => setServiceText(e.target.value)} rows={3} />
                </div>
              </div>

              {/* Excellence Card */}
              <div style={{ background: 'var(--admin-bg-secondary)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>Card 3 (Excellence)</span>
                  {uploadingCard === 'excellence' && <Loader2 size={16} className="admin-spin" style={{ color: 'var(--admin-primary)' }} />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'white', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    <img
                      src={resolveImageUrl(excellenceImage || welcomeFeatureImages.excellence.src)}
                      alt="Excellence Icon"
                      style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <input
                      type="file"
                      ref={excellenceFileRef}
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={(e) => handleUploadCardImage('excellence', e)}
                    />
                    <button
                      type="button"
                      className="btn btn--secondary btn--xs"
                      onClick={() => excellenceFileRef.current?.click()}
                      disabled={uploadingCard === 'excellence'}
                    >
                      <UploadCloud size={13} />
                      <span>{excellenceImage ? 'Change' : 'Upload'}</span>
                    </button>
                    {excellenceImage && (
                      <button
                        type="button"
                        className="btn btn--danger btn--xs"
                        onClick={() => handleRemoveCardImage('excellence')}
                        disabled={uploadingCard === 'excellence'}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label>Title</label>
                  <input type="text" value={excellenceTitle} onChange={(e) => setExcellenceTitle(e.target.value)} />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label>Description</label>
                  <textarea value={excellenceText} onChange={(e) => setExcellenceText(e.target.value)} rows={3} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: QR Code & Live Preview */}
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

          {/* Live Preview Card */}
          <div className="admin-card" style={{ marginTop: '24px' }}>
            <div className="admin-card__header"><h3>Live Cards Preview</h3></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { t: leadershipTitle, d: leadershipText, img: leadershipImage || welcomeFeatureImages.leadership.src },
                { t: serviceTitle, d: serviceText, img: serviceImage || welcomeFeatureImages.service.src },
                { t: excellenceTitle, d: excellenceText, img: excellenceImage || welcomeFeatureImages.excellence.src },
              ].map((card, i) => (
                <div key={i} style={{ background: 'var(--admin-bg-secondary)', borderRadius: '8px', padding: '12px 16px', borderLeft: '3px solid var(--admin-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={resolveImageUrl(card.img)}
                    alt={card.t}
                    style={{ width: '28px', height: '28px', objectFit: 'contain', flexShrink: 0 }}
                  />
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block', marginBottom: '2px' }}>{card.t}</strong>
                    <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', margin: 0 }}>{card.d}</p>
                  </div>
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
        message="QR code settings, card icons, and welcome page content have been updated and saved to Cloudinary."
      />
    </div>
  )
}

