import React, { useState } from 'react'
import { GraduationCap, Save, Plus, Trash2, CheckCircle2, Loader2 } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'

export const EducationAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()
  const [diplomas, setDiplomas] = useState(data.militaryDiplomas)
  const [certificates] = useState(data.professionalCertificates)
  const [unitars] = useState(data.unitarPociCertificates)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await updatePortfolio({
        militaryDiplomas: diplomas,
        professionalCertificates: certificates,
        unitarPociCertificates: unitars
      })
      setMessage('Academic & military qualifications saved successfully!')
    } catch {
      setMessage('Failed to save qualifications.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header admin-page-header--action">
        <div className="admin-page-header__title">
          <div className="admin-header-icon">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1>Education & Qualifications Management</h1>
            <p>Manage university degrees, military diplomas, post-graduate certificates, and academic institutions.</p>
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

      {/* Military Diplomas Section */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card__header">
          <div>
            <h3>Military Diplomas & Strategic Certificates</h3>
            <p>Diplomas from Cranfield University, War College, Wales University, etc.</p>
          </div>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() =>
              setDiplomas([
                ...diplomas,
                { category: 'Military Diploma', title: 'New Military Diploma', institution: 'University', period: '2026', description: 'Description' }
              ])
            }
          >
            <Plus size={16} />
            <span>Add Qualification</span>
          </button>
        </div>

        <div className="admin-grid-2">
          {diplomas.map((item, idx) => (
            <div key={idx} className="admin-card-inner">
              <div className="admin-form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => {
                    const next = [...diplomas]
                    next[idx].title = e.target.value
                    setDiplomas(next)
                  }}
                />
              </div>

              <div className="admin-form-group">
                <label>Institution</label>
                <input
                  type="text"
                  value={item.institution}
                  onChange={(e) => {
                    const next = [...diplomas]
                    next[idx].institution = e.target.value
                    setDiplomas(next)
                  }}
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Period / Year</label>
                  <input
                    type="text"
                    value={item.period}
                    onChange={(e) => {
                      const next = [...diplomas]
                      next[idx].period = e.target.value
                      setDiplomas(next)
                    }}
                  />
                </div>
                <div className="admin-form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm is-danger"
                    onClick={() => setDiplomas(diplomas.filter((_, i) => i !== idx))}
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
