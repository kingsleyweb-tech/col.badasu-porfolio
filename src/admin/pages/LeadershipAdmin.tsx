import React, { useState } from 'react'
import { Star, Save, Loader2 } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'
import { UnsavedChangesBanner } from '../components/UnsavedChangesBanner'
import { SaveSuccessModal } from '../components/SaveSuccessModal'

export const LeadershipAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()

  const [p1Title, setP1Title] = useState(data.leadership?.pillar1?.title || 'Leadership')
  const [p1Desc, setP1Desc] = useState(data.leadership?.pillar1?.description || 'Demonstrated strategic command, operational direction, and team management across UN missions.')
  const [p2Title, setP2Title] = useState(data.leadership?.pillar2?.title || 'Service')
  const [p2Desc, setP2Desc] = useState(data.leadership?.pillar2?.description || 'Over 28 years of unblemished military service to Ghana and the international community.')
  const [p3Title, setP3Title] = useState(data.leadership?.pillar3?.title || 'Excellence')
  const [p3Desc, setP3Desc] = useState(data.leadership?.pillar3?.description || 'Rigorous adherence to military ethics, strategic education, and professional development.')

  const [saving, setSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const stored = data.leadership
  const isDirty =
    p1Title !== (stored?.pillar1?.title || 'Leadership') ||
    p1Desc !== (stored?.pillar1?.description || '') ||
    p2Title !== (stored?.pillar2?.title || 'Service') ||
    p2Desc !== (stored?.pillar2?.description || '') ||
    p3Title !== (stored?.pillar3?.title || 'Excellence') ||
    p3Desc !== (stored?.pillar3?.description || '')

  const handleReset = () => {
    setP1Title(stored?.pillar1?.title || 'Leadership')
    setP1Desc(stored?.pillar1?.description || '')
    setP2Title(stored?.pillar2?.title || 'Service')
    setP2Desc(stored?.pillar2?.description || '')
    setP3Title(stored?.pillar3?.title || 'Excellence')
    setP3Desc(stored?.pillar3?.description || '')
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      await updatePortfolio({
        leadership: {
          pillar1: { title: p1Title, description: p1Desc },
          pillar2: { title: p2Title, description: p2Desc },
          pillar3: { title: p3Title, description: p3Desc },
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
