import React, { useState } from 'react'
import { Globe, Save, CheckCircle2, Loader2 } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'

export const LanguagesAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()

  const [spoken, setSpoken] = useState(data.languages.spoken.join(', '))
  const [written, setWritten] = useState(data.languages.written.join(', '))
  const [frenchLevel, setFrenchLevel] = useState(data.languages.frenchLevel)
  const [hobbies, setHobbies] = useState(data.languages.hobbies.join(', '))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      await updatePortfolio({
        languages: {
          spoken: spoken.split(',').map((s) => s.trim()).filter(Boolean),
          written: written.split(',').map((s) => s.trim()).filter(Boolean),
          frenchLevel,
          hobbies: hobbies.split(',').map((s) => s.trim()).filter(Boolean)
        }
      })
      setMessage('Languages & personal proficiencies saved successfully!')
    } catch {
      setMessage('Failed to save language settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header admin-page-header--action">
        <div className="admin-page-header__title">
          <div className="admin-header-icon">
            <Globe size={24} />
          </div>
          <div>
            <h1>Languages & Personal Proficiencies</h1>
            <p>Edit spoken and written languages, French language certifications, and personal hobbies.</p>
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

      <div className="admin-card">
        <form onSubmit={handleSave} className="admin-form">
          <div className="admin-form-group">
            <label>Spoken Languages (Comma separated)</label>
            <input
              type="text"
              value={spoken}
              onChange={(e) => setSpoken(e.target.value)}
              placeholder="Ewe, Twi, English, French"
            />
          </div>

          <div className="admin-form-group">
            <label>Written Languages (Comma separated)</label>
            <input
              type="text"
              value={written}
              onChange={(e) => setWritten(e.target.value)}
              placeholder="Ewe, Twi, English, French"
            />
          </div>

          <div className="admin-form-group">
            <label>French Language Proficiency Level</label>
            <input
              type="text"
              value={frenchLevel}
              onChange={(e) => setFrenchLevel(e.target.value)}
              placeholder="Advanced Level, B1, B2"
            />
          </div>

          <div className="admin-form-group">
            <label>Hobbies & Personal Interests (Comma separated)</label>
            <input
              type="text"
              value={hobbies}
              onChange={(e) => setHobbies(e.target.value)}
              placeholder="Reading, Singing, Badminton, Lawn Tennis"
            />
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Language Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
