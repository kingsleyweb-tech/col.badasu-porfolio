import React, { useState } from 'react'
import { Star, Save, Loader2 } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'
import { UnsavedChangesBanner } from '../components/UnsavedChangesBanner'
import { SaveSuccessModal } from '../components/SaveSuccessModal'

export const LeadershipAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()

  // These are the three pillars on the welcome page. They are the same fields as in
  // Admin › QR & Welcome Page, so an edit on either screen shows on the site.
  const stored = {
    p1Title: data.welcome?.leadershipTitle || 'Leadership',
    p1Desc: data.welcome?.leadershipText || '',
    p2Title: data.welcome?.serviceTitle || 'Service',
    p2Desc: data.welcome?.serviceText || '',
    p3Title: data.welcome?.excellenceTitle || 'Excellence',
    p3Desc: data.welcome?.excellenceText || '',
  }

  const [p1Title, setP1Title] = useState(stored.p1Title)
  const [p1Desc, setP1Desc] = useState(stored.p1Desc)
  const [p2Title, setP2Title] = useState(stored.p2Title)
  const [p2Desc, setP2Desc] = useState(stored.p2Desc)
  const [p3Title, setP3Title] = useState(stored.p3Title)
  const [p3Desc, setP3Desc] = useState(stored.p3Desc)

  const [saving, setSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const isDirty =
    p1Title !== stored.p1Title ||
    p1Desc !== stored.p1Desc ||
    p2Title !== stored.p2Title ||
    p2Desc !== stored.p2Desc ||
    p3Title !== stored.p3Title ||
    p3Desc !== stored.p3Desc

  const handleReset = () => {
    setP1Title(stored.p1Title)
    setP1Desc(stored.p1Desc)
    setP2Title(stored.p2Title)
    setP2Desc(stored.p2Desc)
    setP3Title(stored.p3Title)
    setP3Desc(stored.p3Desc)
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      await updatePortfolio({
        welcome: {
          ...data.welcome,
          leadershipTitle: p1Title,
          leadershipText: p1Desc,
          serviceTitle: p2Title,
          serviceText: p2Desc,
          excellenceTitle: p3Title,
          excellenceText: p3Desc,
        },
      })
      setShowSuccessModal(true)
    } catch {
      alert('Failed to save leadership pillars.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <UnsavedChangesBanner isDirty={isDirty} onSave={() => handleSave()} onReset={handleReset} isSaving={saving} />

      <div className="admin-page-header admin-page-header--action">
        <div className="admin-page-header__title">
          <div className="admin-header-icon"><Star size={24} /></div>
          <div>
            <h1>Leadership / Service / Excellence</h1>
            <p>Edit the three core value pillars featured on the welcome page experience.</p>
          </div>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => handleSave()} disabled={saving}>
          {saving ? <Loader2 size={18} className="admin-spinner" /> : <Save size={18} />}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="admin-grid-3">
        <div className="admin-card">
          <div className="admin-card__header"><h3>Pillar 1: Leadership</h3></div>
          <div className="admin-form">
            <div className="admin-form-group">
              <label>Title</label>
              <input type="text" value={p1Title} onChange={(e) => setP1Title(e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Description</label>
              <textarea value={p1Desc} onChange={(e) => setP1Desc(e.target.value)} rows={4} />
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card__header"><h3>Pillar 2: Service</h3></div>
          <div className="admin-form">
            <div className="admin-form-group">
              <label>Title</label>
              <input type="text" value={p2Title} onChange={(e) => setP2Title(e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Description</label>
              <textarea value={p2Desc} onChange={(e) => setP2Desc(e.target.value)} rows={4} />
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card__header"><h3>Pillar 3: Excellence</h3></div>
          <div className="admin-form">
            <div className="admin-form-group">
              <label>Title</label>
              <input type="text" value={p3Title} onChange={(e) => setP3Title(e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Description</label>
              <textarea value={p3Desc} onChange={(e) => setP3Desc(e.target.value)} rows={4} />
            </div>
          </div>
        </div>
      </div>

      <SaveSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Leadership Pillars Saved"
        message="Leadership, Service & Excellence values saved and are now live on the website."
      />
    </div>
  )
}
