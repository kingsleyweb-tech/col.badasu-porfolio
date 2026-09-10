import React, { useState } from 'react'
import { BookOpen, Save, Plus, Trash2, CheckCircle2, Loader2 } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'

export const CoursesAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()
  const [certs, setCerts] = useState(data.professionalCertificates)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await updatePortfolio({ professionalCertificates: certs })
      setMessage('Professional courses saved successfully!')
    } catch {
      setMessage('Failed to save courses.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header admin-page-header--action">
        <div className="admin-page-header__title">
          <div className="admin-header-icon">
            <BookOpen size={24} />
          </div>
          <div>
            <h1>Professional Courses & Training</h1>
            <p>Manage professional certificates, executive courses, and specialized military training programs.</p>
          </div>
        </div>

        <div className="admin-action-group">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setCerts([...certs, { category: 'Professional Development Certificate', title: 'New Course Title', institution: 'Training Institution', period: '2026', description: 'Course details' }])}
          >
            <Plus size={18} />
            <span>Add Course</span>
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
        {certs.map((c, idx) => (
          <div key={idx} className="admin-card">
            <div className="admin-card__header">
              <h3>Course #{idx + 1}</h3>
              <button type="button" className="admin-icon-btn is-danger" onClick={() => setCerts(certs.filter((_, i) => i !== idx))}>
                <Trash2 size={16} />
              </button>
            </div>

            <div className="admin-form">
              <div className="admin-form-group">
                <label>Course Title</label>
                <input
                  type="text"
                  value={c.title}
                  onChange={(e) => {
                    const next = [...certs]
                    next[idx].title = e.target.value
                    setCerts(next)
                  }}
                />
              </div>

              <div className="admin-form-group">
                <label>Institution / Provider</label>
                <input
                  type="text"
                  value={c.institution}
                  onChange={(e) => {
                    const next = [...certs]
                    next[idx].institution = e.target.value
                    setCerts(next)
                  }}
                />
              </div>

              <div className="admin-form-group">
                <label>Dates / Period</label>
                <input
                  type="text"
                  value={c.period}
                  onChange={(e) => {
                    const next = [...certs]
                    next[idx].period = e.target.value
                    setCerts(next)
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
