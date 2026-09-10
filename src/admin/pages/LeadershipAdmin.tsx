import React, { useState } from 'react'
import { Star, Save, CheckCircle2, Loader2 } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'

export const LeadershipAdmin: React.FC = () => {
  const { updatePortfolio } = usePortfolio()

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [leadershipTitle, setLeadershipTitle] = useState('Leadership')
  const [leadershipDesc, setLeadershipDesc] = useState('Demonstrated strategic command, operational direction, and team management across UN missions.')
  
  const [serviceTitle, setServiceTitle] = useState('Service')
  const [serviceDesc, setServiceDesc] = useState('Over 28 years of unblemished military service to Ghana and the international community.')

  const [excellenceTitle, setExcellenceTitle] = useState('Excellence')
  const [excellenceDesc, setExcellenceDesc] = useState('Rigorous adherence to military ethics, strategic education, and professional development.')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      await updatePortfolio({})
      setMessage('Leadership, Service & Excellence sections updated!')
    } catch {
      setMessage('Failed to update section.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header admin-page-header--action">
        <div className="admin-page-header__title">
          <div className="admin-header-icon">
            <Star size={24} />
          </div>
          <div>
            <h1>Leadership / Service / Excellence</h1>
            <p>Manage the core value pillars featured on the homepage and welcome experience.</p>
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

      <div className="admin-grid-3">
        <div className="admin-card">
          <div className="admin-card__header">
            <h3>Pillar 1: Leadership</h3>
          </div>
          <div className="admin-form">
            <div className="admin-form-group">
              <label>Title</label>
              <input type="text" value={leadershipTitle} onChange={(e) => setLeadershipTitle(e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Description</label>
              <textarea value={leadershipDesc} onChange={(e) => setLeadershipDesc(e.target.value)} rows={4} />
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card__header">
            <h3>Pillar 2: Service</h3>
          </div>
          <div className="admin-form">
            <div className="admin-form-group">
              <label>Title</label>
              <input type="text" value={serviceTitle} onChange={(e) => setServiceTitle(e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Description</label>
              <textarea value={serviceDesc} onChange={(e) => setServiceDesc(e.target.value)} rows={4} />
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card__header">
            <h3>Pillar 3: Excellence</h3>
          </div>
          <div className="admin-form">
            <div className="admin-form-group">
              <label>Title</label>
              <input type="text" value={excellenceTitle} onChange={(e) => setExcellenceTitle(e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Description</label>
              <textarea value={excellenceDesc} onChange={(e) => setExcellenceDesc(e.target.value)} rows={4} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
