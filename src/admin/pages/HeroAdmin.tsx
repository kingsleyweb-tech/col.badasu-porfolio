import React, { useState, useEffect } from 'react'
import { Sliders, Save, Loader2 } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'
import { UnsavedChangesBanner } from '../components/UnsavedChangesBanner'
import { SaveSuccessModal } from '../components/SaveSuccessModal'

export const HeroAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()

  const [title, setTitle] = useState(data.hero.title)
  const [personalIntro, setPersonalIntro] = useState(data.hero.personalIntro)
  const [supportingText, setSupportingText] = useState(data.hero.supportingText)
  const [saving, setSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    setTitle(data.hero.title)
    setPersonalIntro(data.hero.personalIntro)
    setSupportingText(data.hero.supportingText)
  }, [data])

  const isDirty =
    title !== data.hero.title ||
    personalIntro !== data.hero.personalIntro ||
    supportingText !== data.hero.supportingText

  const handleReset = () => {
    setTitle(data.hero.title)
    setPersonalIntro(data.hero.personalIntro)
    setSupportingText(data.hero.supportingText)
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)

    try {
      await updatePortfolio({
        hero: {
          ...data.hero,
          title,
          personalIntro,
          supportingText
        }
      })
      setShowSuccessModal(true)
    } catch (err) {
      alert('Failed to save Hero section.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <UnsavedChangesBanner
        isDirty={isDirty}
        onSave={() => handleSave()}
        onReset={handleReset}
        isSaving={saving}
      />

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

        <button type="button" className="btn btn--primary" onClick={() => handleSave()} disabled={saving}>
          {saving ? <Loader2 size={18} className="admin-spinner" /> : <Save size={18} />}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

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

      <SaveSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Hero Section Saved"
        message="Your Hero section edits have been updated and are live on the website."
      />
    </div>
  )
}

