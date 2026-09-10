import React, { useState } from 'react'
import { Award, Save, Plus, Trash2, CheckCircle2, Loader2 } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'

export const AwardsAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()
  const [awards, setAwards] = useState(data.awards)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleFieldChange = (index: number, field: string, val: string) => {
    const next = [...awards]
    ;(next[index] as Record<string, string>)[field] = val
    setAwards(next)
  }

  const handleAddAward = () => {
    setAwards([...awards, { title: 'New Military Medal / Award', year: '2026', description: 'Award citation description.' }])
  }

  const handleDeleteAward = (index: number) => {
    if (window.confirm('Delete this award record?')) {
      setAwards(awards.filter((_, i) => i !== index))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await updatePortfolio({ awards })
      setMessage('Awards & decorations saved successfully!')
    } catch {
      setMessage('Failed to save awards.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header admin-page-header--action">
        <div className="admin-page-header__title">
          <div className="admin-header-icon">
            <Award size={24} />
          </div>
          <div>
            <h1>Awards & Decorations Management</h1>
            <p>Manage military honors, UN peacekeeping medals, ECOWAS decorations, and citations.</p>
          </div>
        </div>

        <div className="admin-action-group">
          <button type="button" className="btn btn--secondary" onClick={handleAddAward}>
            <Plus size={18} />
            <span>Add Award</span>
          </button>

          <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={18} className="admin-spinner" /> : <Save size={18} />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="admin-alert is-success">
          <CheckCircle2 size={18} />
          <span>{message}</span>
          <button type="button" className="admin-alert__close" onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <div className="admin-grid-2">
        {awards.map((award, idx) => (
          <div key={idx} className="admin-card admin-award-card">
            <div className="admin-card__header">
              <div className="admin-card__title-wrap">
                <Award size={18} className="text-emerald-600" />
                <h3>Award #{idx + 1}</h3>
              </div>
              <button
                type="button"
                className="admin-icon-btn is-danger"
                onClick={() => handleDeleteAward(idx)}
                title="Delete award"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="admin-form">
              <div className="admin-form-group">
                <label>Award Title</label>
                <input
                  type="text"
                  value={award.title}
                  onChange={(e) => handleFieldChange(idx, 'title', e.target.value)}
                />
              </div>

              <div className="admin-form-group">
                <label>Year / Date</label>
                <input
                  type="text"
                  value={award.year}
                  onChange={(e) => handleFieldChange(idx, 'year', e.target.value)}
                />
              </div>

              <div className="admin-form-group">
                <label>Description / Citation</label>
                <textarea
                  value={award.description}
                  onChange={(e) => handleFieldChange(idx, 'description', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
