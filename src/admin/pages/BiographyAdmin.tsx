import React, { useState } from 'react'
import { UserCheck, Save, Plus, Trash2, CheckCircle2, Loader2 } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'

export const BiographyAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()

  const [biographyText, setBiographyText] = useState(data.officer.biography.join('\n\n'))
  const [details, setDetails] = useState(data.biographicDetails)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleDetailChange = (index: number, field: 'label' | 'value', val: string) => {
    const next = [...details]
    next[index][field] = val
    setDetails(next)
  }

  const handleAddDetail = () => {
    setDetails([...details, { label: 'NEW FIELD', value: 'Value' }])
  }

  const handleRemoveDetail = (index: number) => {
    setDetails(details.filter((_, i) => i !== index))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const bioArray = biographyText
        .split('\n\n')
        .map((p) => p.trim())
        .filter(Boolean)

      await updatePortfolio({
        officer: {
          ...data.officer,
          biography: bioArray
        },
        biographicDetails: details
      })
      setMessage('Biography and biographic details saved successfully!')
    } catch {
      setMessage('Failed to save biography data.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header admin-page-header--action">
        <div className="admin-page-header__title">
          <div className="admin-header-icon">
            <UserCheck size={24} />
          </div>
          <div>
            <h1>Biography Management</h1>
            <p>Edit Colonel Badasu's main biography narrative and official biographic details table.</p>
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

      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card__header">
          <h3>Main Biography Narrative</h3>
          <p>Separate paragraphs with a blank line (double enter).</p>
        </div>

        <div className="admin-form-group">
          <textarea
            value={biographyText}
            onChange={(e) => setBiographyText(e.target.value)}
            rows={12}
            className="admin-textarea"
          />
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card__header">
          <div>
            <h3>Official Biographic Details</h3>
            <p>Key biographic data shown on the Biography page.</p>
          </div>
          <button type="button" className="btn btn--secondary btn--sm" onClick={handleAddDetail}>
            <Plus size={16} />
            <span>Add Detail Row</span>
          </button>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Detail Label</th>
                <th>Value</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {details.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => handleDetailChange(idx, 'label', e.target.value)}
                      className="admin-table-input"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => handleDetailChange(idx, 'value', e.target.value)}
                      className="admin-table-input"
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="admin-icon-btn is-danger"
                      onClick={() => handleRemoveDetail(idx)}
                      title="Delete row"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
