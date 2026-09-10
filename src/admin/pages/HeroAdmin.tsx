import React, { useState, useEffect, useRef } from 'react'
import { Sliders, Save, Loader2, UploadCloud, Trash2, Plus, GripVertical } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'
import { UnsavedChangesBanner } from '../components/UnsavedChangesBanner'
import { SaveSuccessModal } from '../components/SaveSuccessModal'
import type { HeroSlide } from '../../services/portfolioService'
import { resolveImageUrl } from '../../utils/imageResolver'
import { deleteCloudinaryImageIfUnused } from '../../services/imageManager'

export const HeroAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()

  const [title, setTitle] = useState(data.hero.title)
  const [personalIntro, setPersonalIntro] = useState(data.hero.personalIntro)
  const [supportingText, setSupportingText] = useState(data.hero.supportingText)
  const [slides, setSlides] = useState<HeroSlide[]>(data.hero.slides || [])
  const [saving, setSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [uploadingNew, setUploadingNew] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTitle(data.hero.title)
    setPersonalIntro(data.hero.personalIntro)
    setSupportingText(data.hero.supportingText)
    setSlides(data.hero.slides || [])
  }, [data])

  const isDirty =
    title !== data.hero.title ||
    personalIntro !== data.hero.personalIntro ||
    supportingText !== data.hero.supportingText ||
    JSON.stringify(slides) !== JSON.stringify(data.hero.slides || [])

  const handleReset = () => {
    setTitle(data.hero.title)
    setPersonalIntro(data.hero.personalIntro)
    setSupportingText(data.hero.supportingText)
    setSlides(data.hero.slides || [])
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      await updatePortfolio({ hero: { ...data.hero, title, personalIntro, supportingText, slides } })
      setShowSuccessModal(true)
    } catch {
      alert('Failed to save Hero section.')
    } finally {
      setSaving(false)
    }
  }

  const uploadFile = async (file: File): Promise<{ url: string; publicId: string } | null> => {
    const reader = new FileReader()
    const base64 = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: base64, folder: 'site/hero', filename: file.name }),
    })
    if (!res.ok) return null
    const json = await res.json()
    return { url: json.url || json.thumbnailUrl, publicId: json.publicId || '' }
  }

  const deleteFromCloudinary = async (publicId: string) => {
    if (!publicId) return
    await fetch('/api/delete-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
    }).catch(() => {})
  }

  const handleAddSlides = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    setUploadingNew(true)
    const newSlides: HeroSlide[] = []
    for (const file of files) {
      const result = await uploadFile(file)
      if (result) newSlides.push(result)
    }
    setSlides((prev) => [...prev, ...newSlides])
    setUploadingNew(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleReplaceSlide = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    setUploadingIdx(idx)
    const old = slides[idx]
    const oldUrl = typeof old === 'string' ? old : old?.url || old?.publicId
    const result = await uploadFile(e.target.files[0])
    if (result) {
      if (oldUrl) await deleteCloudinaryImageIfUnused(oldUrl, data)
      const next = [...slides]
      next[idx] = result
      setSlides(next)
    }
    setUploadingIdx(null)
  }

  const handleRemoveSlide = async (idx: number) => {
    if (!window.confirm('Remove this slide from the hero slideshow?')) return
    const old = slides[idx]
    const oldUrl = typeof old === 'string' ? old : old?.url || old?.publicId
    if (oldUrl) await deleteCloudinaryImageIfUnused(oldUrl, data)
    setSlides(slides.filter((_, i) => i !== idx))
  }

  return (
    <div className="admin-page">
      <UnsavedChangesBanner isDirty={isDirty} onSave={() => handleSave()} onReset={handleReset} isSaving={saving} />

      <div className="admin-page-header admin-page-header--action">
        <div className="admin-page-header__title">
          <div className="admin-header-icon"><Sliders size={24} /></div>
          <div>
            <h1>Hero Section Management</h1>
            <p>Edit the main title, personal introduction, supporting description, and manage the hero slideshow images.</p>
          </div>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => handleSave()} disabled={saving}>
          {saving ? <Loader2 size={18} className="admin-spinner" /> : <Save size={18} />}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Text Fields */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card__header"><h3>Hero Text Content</h3></div>
        <form onSubmit={handleSave} className="admin-form">
          <div className="admin-form-group">
            <label>Hero Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Colonel Henry Kwaku Badasu" />
          </div>
          <div className="admin-form-group">
            <label>Personal Introduction</label>
            <textarea value={personalIntro} onChange={(e) => setPersonalIntro(e.target.value)} rows={4} />
          </div>
          <div className="admin-form-group">
            <label>Supporting Text / Subtitle</label>
            <textarea value={supportingText} onChange={(e) => setSupportingText(e.target.value)} rows={3} />
          </div>
        </form>
      </div>

      {/* Slideshow Image Management */}
      <div className="admin-card">
        <div className="admin-card__header">
          <div>
            <h3>Hero Slideshow Images</h3>
            <p>These images cycle behind the hero text. Add, replace or remove slides. Changes save with the Save button above.</p>
          </div>
          <label className="btn btn--secondary btn--sm" style={{ cursor: 'pointer' }}>
            {uploadingNew ? <Loader2 size={16} className="admin-spinner" /> : <Plus size={16} />}
            <span>{uploadingNew ? 'Uploading...' : 'Add Slides'}</span>
            <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleAddSlides} style={{ display: 'none' }} />
          </label>
        </div>

        {slides.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
            <UploadCloud size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
            <p>No slides configured. Click "Add Slides" to upload hero background images.</p>
            <p style={{ fontSize: '13px' }}>Default images will be used until slides are added here.</p>
          </div>
        ) : (
          <div className="admin-hero-slides-grid">
            {slides.map((slide, idx) => (
              <div key={idx} className="admin-hero-slide-card">
                <div className="admin-hero-slide-card__media">
                  {uploadingIdx === idx ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Loader2 size={24} className="admin-spinner" />
                    </div>
                  ) : (
                    <img
                      src={resolveImageUrl(typeof slide === 'string' ? slide : slide.url)}
                      alt={`Hero slide ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                  <div className="admin-hero-slide-card__badge">{idx + 1}</div>
                </div>
                <div className="admin-hero-slide-card__actions">
                  <label className="btn btn--secondary btn--sm" style={{ cursor: 'pointer', fontSize: '12px' }}>
                    <UploadCloud size={13} />
                    <span>Replace</span>
                    <input type="file" accept="image/*" onChange={(e) => handleReplaceSlide(idx, e)} style={{ display: 'none' }} />
                  </label>
                  <button
                    type="button"
                    className="admin-icon-btn is-danger"
                    onClick={() => handleRemoveSlide(idx)}
                    title="Remove slide"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SaveSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Hero Section Saved"
        message="Your Hero section edits and slideshow have been updated and are live on the website."
      />
    </div>
  )
}
