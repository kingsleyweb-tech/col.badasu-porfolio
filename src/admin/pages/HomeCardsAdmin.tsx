import React, { useState, useEffect, useRef } from 'react'
import { LayoutDashboard, Save, Loader2, UploadCloud, Trash2, Plus, Image as ImageIcon, Briefcase, Trophy } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'
import { UnsavedChangesBanner } from '../components/UnsavedChangesBanner'
import { SaveSuccessModal } from '../components/SaveSuccessModal'
import type { HomeCard } from '../../services/portfolioService'
import { resolveImageUrl } from '../../utils/imageResolver'
import { deleteCloudinaryImageIfUnused } from '../../services/imageManager'
import { careerHighlights, achievements } from '../../data/officerData'

// ── helpers ─────────────────────────────────────────────────────────────────

async function uploadFile(file: File, folder: string): Promise<{ url: string; publicId: string } | null> {
  const reader = new FileReader()
  const base64 = await new Promise<string>((resolve) => {
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: base64, folder, filename: file.name }),
  })
  if (!res.ok) return null
  const json = await res.json()
  return { url: json.url || json.thumbnailUrl, publicId: json.publicId || '' }
}

// ── Sub-component: card row ──────────────────────────────────────────────────

function CardRow({
  card,
  index,
  fallbackImg,
  uploadingIdx,
  onUpload,
  onRemoveImage,
  onChange,
}: {
  card: HomeCard
  index: number
  fallbackImg: string
  uploadingIdx: number | null
  onUpload: (idx: number, file: File) => void
  onRemoveImage: (idx: number) => void
  onChange: (idx: number, field: keyof HomeCard, value: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const displayImg = card.imageUrl ? resolveImageUrl(card.imageUrl) : fallbackImg

  return (
    <div className="admin-card" style={{ marginBottom: '16px' }}>
      <div className="admin-card__header">
        <h3 style={{ fontSize: '14px' }}>Card {index + 1} — <em style={{ fontWeight: 400 }}>{card.category}</em></h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Image column */}
        <div>
          <div
            style={{
              width: '160px',
              height: '120px',
              borderRadius: '8px',
              overflow: 'hidden',
              background: 'var(--admin-bg-secondary)',
              position: 'relative',
              border: '1px solid var(--admin-border)',
            }}
          >
            {uploadingIdx === index ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Loader2 size={24} className="admin-spinner" />
              </div>
            ) : displayImg ? (
              <img src={displayImg} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '6px', color: 'var(--admin-text-muted)' }}>
                <ImageIcon size={28} style={{ opacity: 0.4 }} />
                <span style={{ fontSize: '11px' }}>No image</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
            <label className="btn btn--secondary btn--sm" style={{ cursor: 'pointer', fontSize: '11px' }}>
              <UploadCloud size={12} />
              <span>{card.imageUrl ? 'Replace' : 'Upload'}</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files?.[0]) onUpload(index, e.target.files[0]); if (fileRef.current) fileRef.current.value = '' }}
              />
            </label>
            {card.imageUrl && (
              <button type="button" className="admin-icon-btn is-danger" onClick={() => onRemoveImage(index)} title="Remove image">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Fields column */}
        <div className="admin-form" style={{ gap: '12px' }}>
          <div className="admin-form-group">
            <label>Card Title</label>
            <input type="text" value={card.title} onChange={(e) => onChange(index, 'title', e.target.value)} />
          </div>
          <div className="admin-form-group">
            <label>Description</label>
            <textarea value={card.description} rows={2} onChange={(e) => onChange(index, 'description', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="admin-form-group">
              <label>Category Badge</label>
              <input type="text" value={card.category} onChange={(e) => onChange(index, 'category', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Meta Label</label>
              <input type="text" value={card.meta} onChange={(e) => onChange(index, 'meta', e.target.value)} />
            </div>
          </div>
          <div className="admin-form-group">
            <label>Link (to)</label>
            <input type="text" value={card.to} onChange={(e) => onChange(index, 'to', e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Admin Page ──────────────────────────────────────────────────────────

export const HomeCardsAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()

  const [careerCards, setCareerCards] = useState<HomeCard[]>(
    data?.homeCareerCards?.length ? data.homeCareerCards : []
  )
  const [achieveCards, setAchieveCards] = useState<HomeCard[]>(
    data?.homeAchievementCards?.length ? data.homeAchievementCards : []
  )
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [uploadingCareer, setUploadingCareer] = useState<number | null>(null)
  const [uploadingAchieve, setUploadingAchieve] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'career' | 'achievements'>('career')

  useEffect(() => {
    if (data?.homeCareerCards?.length) setCareerCards(data.homeCareerCards)
    if (data?.homeAchievementCards?.length) setAchieveCards(data.homeAchievementCards)
  }, [data])

  // Initialize with defaults if empty
  const initCareerCards = (): HomeCard[] =>
    careerHighlights.map((c) => ({
      title: c.title,
      description: c.description,
      category: c.category || '',
      meta: c.meta || 'Career Record',
      to: c.to,
      imageUrl: '',
      imagePublicId: '',
    }))

  const initAchieveCards = (): HomeCard[] =>
    achievements.map((a) => ({
      title: a.title,
      description: a.description,
      category: a.category || '',
      meta: a.meta || 'Institutional Service',
      to: a.to,
      imageUrl: '',
      imagePublicId: '',
    }))

  const isDirty =
    JSON.stringify(careerCards) !== JSON.stringify(data?.homeCareerCards || []) ||
    JSON.stringify(achieveCards) !== JSON.stringify(data?.homeAchievementCards || [])

  const handleReset = () => {
    setCareerCards(data?.homeCareerCards || [])
    setAchieveCards(data?.homeAchievementCards || [])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updatePortfolio({ homeCareerCards: careerCards, homeAchievementCards: achieveCards })
      setShowSuccess(true)
    } catch {
      alert('Failed to save Home Cards.')
    } finally {
      setSaving(false)
    }
  }

  // ── Career card handlers ─────────────────────────────────────────────────

  const handleCareerChange = (idx: number, field: keyof HomeCard, value: string) => {
    setCareerCards((prev) => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c))
  }

  const handleCareerUpload = async (idx: number, file: File) => {
    setUploadingCareer(idx)
    const old = careerCards[idx]
    if (old.imagePublicId) await deleteCloudinaryImageIfUnused(old.imagePublicId, data)
    const result = await uploadFile(file, 'site/home/career')
    if (result) {
      const next = careerCards.map((c, i) => i === idx ? { ...c, imageUrl: result.url, imagePublicId: result.publicId } : c)
      setCareerCards(next)
      await updatePortfolio({ homeCareerCards: next })
    }
    setUploadingCareer(null)
  }

  const handleCareerRemoveImage = async (idx: number) => {
    const old = careerCards[idx]
    if (old.imagePublicId) await deleteCloudinaryImageIfUnused(old.imagePublicId, data)
    const next = careerCards.map((c, i) => i === idx ? { ...c, imageUrl: '', imagePublicId: '' } : c)
    setCareerCards(next)
    await updatePortfolio({ homeCareerCards: next })
  }

  // ── Achievement card handlers ────────────────────────────────────────────

  const handleAchieveChange = (idx: number, field: keyof HomeCard, value: string) => {
    setAchieveCards((prev) => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c))
  }

  const handleAchieveUpload = async (idx: number, file: File) => {
    setUploadingAchieve(idx)
    const old = achieveCards[idx]
    if (old.imagePublicId) await deleteCloudinaryImageIfUnused(old.imagePublicId, data)
    const result = await uploadFile(file, 'site/home/achievements')
    if (result) {
      const next = achieveCards.map((c, i) => i === idx ? { ...c, imageUrl: result.url, imagePublicId: result.publicId } : c)
      setAchieveCards(next)
      await updatePortfolio({ homeAchievementCards: next })
    }
    setUploadingAchieve(null)
  }

  const handleAchieveRemoveImage = async (idx: number) => {
    const old = achieveCards[idx]
    if (old.imagePublicId) await deleteCloudinaryImageIfUnused(old.imagePublicId, data)
    const next = achieveCards.map((c, i) => i === idx ? { ...c, imageUrl: '', imagePublicId: '' } : c)
    setAchieveCards(next)
    await updatePortfolio({ homeAchievementCards: next })
  }

  const activeCards = activeTab === 'career' ? careerCards : achieveCards
  const fallbackCards = activeTab === 'career' ? careerHighlights : achievements

  return (
    <div className="admin-page">
      <UnsavedChangesBanner isDirty={isDirty} onSave={handleSave} onReset={handleReset} isSaving={saving} />

      <div className="admin-page-header admin-page-header--action">
        <div className="admin-page-header__title">
          <div className="admin-header-icon"><LayoutDashboard size={24} /></div>
          <div>
            <h1>Home Page Cards</h1>
            <p>Upload or replace images and edit the text for Career and Achievements cards shown on the homepage.</p>
          </div>
        </div>
        <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={18} className="admin-spinner" /> : <Save size={18} />}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'career' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveTab('career')}
        >
          <Briefcase size={16} />
          <span>Career Cards ({careerCards.length || careerHighlights.length})</span>
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'achievements' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setActiveTab('achievements')}
        >
          <Trophy size={16} />
          <span>Achievement Cards ({achieveCards.length || achievements.length})</span>
        </button>
      </div>

      {/* Initialize button when no cards saved yet */}
      {activeCards.length === 0 && (
        <div className="admin-card" style={{ textAlign: 'center', padding: '32px', marginBottom: '20px' }}>
          <ImageIcon size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: '16px' }}>
            No {activeTab === 'career' ? 'Career' : 'Achievement'} cards configured yet.
            Click below to load the defaults and start customizing images.
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              if (activeTab === 'career') setCareerCards(initCareerCards())
              else setAchieveCards(initAchieveCards())
            }}
          >
            <Plus size={16} />
            <span>Load Default Cards</span>
          </button>
        </div>
      )}

      {/* Render card rows */}
      {activeTab === 'career'
        ? careerCards.map((card, i) => (
            <CardRow
              key={i}
              card={card}
              index={i}
              fallbackImg={resolveImageUrl(fallbackCards[i]?.image?.thumbnailSrc || '')}
              uploadingIdx={uploadingCareer}
              onUpload={handleCareerUpload}
              onRemoveImage={handleCareerRemoveImage}
              onChange={handleCareerChange}
            />
          ))
        : achieveCards.map((card, i) => (
            <CardRow
              key={i}
              card={card}
              index={i}
              fallbackImg={resolveImageUrl(fallbackCards[i]?.image?.thumbnailSrc || '')}
              uploadingIdx={uploadingAchieve}
              onUpload={handleAchieveUpload}
              onRemoveImage={handleAchieveRemoveImage}
              onChange={handleAchieveChange}
            />
          ))}

      <SaveSuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Home Cards Saved"
        message="Career and Achievements card images and content have been updated on the homepage."
      />
    </div>
  )
}
