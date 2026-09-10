import React, { useState, useEffect } from 'react'
import { Trophy, Save, Plus, Trash2, Loader2 } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'
import { UnsavedChangesBanner } from '../components/UnsavedChangesBanner'
import { SaveSuccessModal } from '../components/SaveSuccessModal'
import type { AchievementCardItem, VolunteerItem } from '../../services/portfolioService'

export const AchievementsAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()

  const [achievements, setAchievements] = useState<AchievementCardItem[]>(data.achievements || [])
  const [volunteers, setVolunteers] = useState<VolunteerItem[]>(data.volunteerExperience || [])
  const [recentAssignments, setRecentAssignments] = useState<string[]>(data.recentAssignments || [])
  const [operations, setOperations] = useState<string[]>(data.operations || [])

  const [saving, setSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    setAchievements(data.achievements || [])
    setVolunteers(data.volunteerExperience || [])
    setRecentAssignments(data.recentAssignments || [])
    setOperations(data.operations || [])
  }, [data])

  const isDirty =
    JSON.stringify(achievements) !== JSON.stringify(data.achievements || []) ||
    JSON.stringify(volunteers) !== JSON.stringify(data.volunteerExperience || []) ||
    JSON.stringify(recentAssignments) !== JSON.stringify(data.recentAssignments || []) ||
    JSON.stringify(operations) !== JSON.stringify(data.operations || [])

  const handleReset = () => {
    setAchievements(data.achievements || [])
    setVolunteers(data.volunteerExperience || [])
    setRecentAssignments(data.recentAssignments || [])
    setOperations(data.operations || [])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updatePortfolio({ achievements, volunteerExperience: volunteers, recentAssignments, operations })
      setShowSuccessModal(true)
    } catch {
      alert('Failed to save achievements data.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Achievement Cards helpers ─────────────────────────────────────────
  const updateAchievement = (idx: number, field: keyof AchievementCardItem, val: string) => {
    const next = [...achievements]
    next[idx] = { ...next[idx], [field]: val }
    setAchievements(next)
  }

  // ─── Volunteer helpers ─────────────────────────────────────────────────
  const updateVolunteer = (idx: number, field: keyof VolunteerItem, val: string | string[]) => {
    const next = [...volunteers]
    next[idx] = { ...next[idx], [field]: val }
    setVolunteers(next)
  }
  const updateVolunteerDesc = (vIdx: number, dIdx: number, val: string) => {
    const next = [...volunteers]
    const desc = [...next[vIdx].description]
    desc[dIdx] = val
    next[vIdx] = { ...next[vIdx], description: desc }
    setVolunteers(next)
  }

  return (
    <div className="admin-page">
      <UnsavedChangesBanner isDirty={isDirty} onSave={handleSave} onReset={handleReset} isSaving={saving} />

      <div className="admin-page-header admin-page-header--action">
        <div className="admin-page-header__title">
          <div className="admin-header-icon"><Trophy size={24} /></div>
          <div>
            <h1>Achievements & Highlights Management</h1>
            <p>Manage achievement cards, volunteer experience, recent assignments, and UN/ECOWAS operations.</p>
          </div>
        </div>
        <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={18} className="admin-spinner" /> : <Save size={18} />}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* ─── 1. Achievement Cards ─────────────────────────────────────── */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card__header">
          <div>
            <h3>1. Achievements / Highlights (Feature Cards)</h3>
            <p>These cards appear on the Achievements page under "Selected Areas of Contribution".</p>
          </div>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => setAchievements([...achievements, { title: 'New Achievement', description: 'Description', category: 'Category', to: '/achievements' }])}
          >
            <Plus size={16} />
            <span>Add Card</span>
          </button>
        </div>

        <div className="admin-grid-2">
          {achievements.map((item, idx) => (
            <div key={idx} className="admin-item-card">
              <div className="admin-item-card__header">
                <div className="admin-item-card__title">
                  <strong className="admin-badge admin-badge--primary">#{idx + 1}</strong>
                  <h3>{item.title}</h3>
                </div>
                <button type="button" className="admin-icon-btn is-danger" onClick={() => setAchievements(achievements.filter((_, i) => i !== idx))}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="admin-form-group">
                <label>Title</label>
                <input type="text" value={item.title} onChange={(e) => updateAchievement(idx, 'title', e.target.value)} />
              </div>
              <div className="admin-form-group">
                <label>Description</label>
                <textarea value={item.description} onChange={(e) => updateAchievement(idx, 'description', e.target.value)} rows={3} />
              </div>
              <div className="admin-form-group">
                <label>Category Tag</label>
                <input type="text" value={item.category} onChange={(e) => updateAchievement(idx, 'category', e.target.value)} placeholder="Peacekeeping" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 2. Volunteer Experience ──────────────────────────────────── */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card__header">
          <div>
            <h3>2. Volunteer Experience</h3>
            <p>Appears under "Community and Volunteer Service" on the Achievements page.</p>
          </div>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => setVolunteers([...volunteers, { location: 'Location, Country', period: 'Period', description: ['Description here.'] }])}
          >
            <Plus size={16} />
            <span>Add Entry</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {volunteers.map((vol, vIdx) => (
            <div key={vIdx} className="admin-item-card">
              <div className="admin-item-card__header">
                <div className="admin-item-card__title">
                  <strong className="admin-badge admin-badge--primary">#{vIdx + 1}</strong>
                  <h3>{vol.location}</h3>
                </div>
                <button type="button" className="admin-icon-btn is-danger" onClick={() => setVolunteers(volunteers.filter((_, i) => i !== vIdx))}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Location / City</label>
                  <input type="text" value={vol.location} onChange={(e) => updateVolunteer(vIdx, 'location', e.target.value)} />
                </div>
                <div className="admin-form-group">
                  <label>Period</label>
                  <input type="text" value={vol.period} onChange={(e) => updateVolunteer(vIdx, 'period', e.target.value)} />
                </div>
              </div>
              {vol.description.map((desc, dIdx) => (
                <div key={dIdx} className="admin-form-group">
                  <label>Description {dIdx + 1}</label>
                  <textarea value={desc} onChange={(e) => updateVolunteerDesc(vIdx, dIdx, e.target.value)} rows={2} />
                </div>
              ))}
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => {
                  const next = [...volunteers]
                  next[vIdx] = { ...next[vIdx], description: [...next[vIdx].description, ''] }
                  setVolunteers(next)
                }}
              >
                <Plus size={13} /> <span>Add Paragraph</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 3. Recent Assignments ────────────────────────────────────── */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card__header">
          <div>
            <h3>3. Recent Assignments</h3>
            <p>Appears on the Career page under "Assignments in the Last Five Years".</p>
          </div>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => setRecentAssignments([...recentAssignments, 'New assignment description'])}>
            <Plus size={16} />
            <span>Add Assignment</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recentAssignments.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <strong className="admin-badge admin-badge--primary">{idx + 1}</strong>
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const next = [...recentAssignments]
                  next[idx] = e.target.value
                  setRecentAssignments(next)
                }}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--admin-border)', fontSize: '14px' }}
              />
              <button type="button" className="admin-icon-btn is-danger" onClick={() => setRecentAssignments(recentAssignments.filter((_, i) => i !== idx))}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 4. UN/ECOWAS Operations ──────────────────────────────────── */}
      <div className="admin-card">
        <div className="admin-card__header">
          <div>
            <h3>4. UN & ECOWAS Operations</h3>
            <p>Appears on the Career page under "Operational Experience" listing missions served.</p>
          </div>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => setOperations([...operations, 'MISSION NAME - Description'])}>
            <Plus size={16} />
            <span>Add Operation</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {operations.map((op, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <strong className="admin-badge admin-badge--primary">{idx + 1}</strong>
              <input
                type="text"
                value={op}
                onChange={(e) => {
                  const next = [...operations]
                  next[idx] = e.target.value
                  setOperations(next)
                }}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--admin-border)', fontSize: '14px' }}
              />
              <button type="button" className="admin-icon-btn is-danger" onClick={() => setOperations(operations.filter((_, i) => i !== idx))}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <SaveSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Achievements Saved"
        message="All achievement sections updated and live on the website."
      />
    </div>
  )
}
