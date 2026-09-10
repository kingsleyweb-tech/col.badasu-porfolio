import React, { useState } from 'react'
import { Sliders, Save, CheckCircle2, Loader2 } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'

export const HeroAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()

  const [title, setTitle] = useState(data.hero.title)
  const [personalIntro, setPersonalIntro] = useState(data.hero.personalIntro)
  const [supportingText, setSupportingText] = useState(data.hero.supportingText)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      await updatePortfolio({
        hero: {
          ...data.hero,
          title,
          personalIntro,
          supportingText
        }
      })
      setMessage('Hero section successfully updated!')
    } catch {
      setMessage('Failed to save Hero section.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header admin-page-header--action">
        <div className="admin-page-header__title">
          <div className="admin-header-icon">
            <Sliders size={24} />
          </div>
          <div>
            <h1>Hero Section Management</h1>
            <p>Edit the main title, personal introduction, supporting description, and hero slideshow settings.</p>
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
            <label>Hero Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Colonel Henry Kwaku Badasu"
              required
            />
          </div>

          <div className="admin-form-group">
            <label>Personal Introduction</label>
            <textarea
              value={personalIntro}
              onChange={(e) => setPersonalIntro(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="admin-form-group">
            <label>Supporting Text / Subtitle</label>
            <textarea
              value={supportingText}
              onChange={(e) => setSupportingText(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving Changes...' : 'Save Hero Section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
