import React, { useState, useEffect } from 'react'
import { Briefcase, Save, Plus, Trash2, Edit3, Loader2, MoveUp, MoveDown } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'
import { UnsavedChangesBanner } from '../components/UnsavedChangesBanner'
import { SaveSuccessModal } from '../components/SaveSuccessModal'

export const CareerAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()
  const [positions, setPositions] = useState(data.workHistory)
  const [saving, setSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)

  useEffect(() => {
    setPositions(data.workHistory)
  }, [data])

  const isDirty = JSON.stringify(positions) !== JSON.stringify(data.workHistory)

  const handleReset = () => {
    setPositions(data.workHistory)
    setEditingIdx(null)
  }

  const handleFieldChange = (index: number, field: string, value: string | string[]) => {
    const next = [...positions]
    if (field === 'description' && typeof value === 'string') {
      next[index].description = value.split('\n').filter(Boolean)
    } else {
      ;(next[index] as Record<string, unknown>)[field] = value
    }
    setPositions(next)
  }

  const handleAddPosition = () => {
    const newPos = {
      title: 'Senior Officer Position',
      location: 'Ghana Armed Forces',
      period: '2026 - Present',
      description: ['Responsibility description entry.']
    }
    setPositions([newPos, ...positions])
    setEditingIdx(0)
  }

  const handleDeletePosition = (index: number) => {
    if (window.confirm('Are you sure you want to delete this career position record?')) {
      setPositions(positions.filter((_, i) => i !== index))
    }
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= positions.length) return
    const next = [...positions]
    const temp = next[index]
    next[index] = next[targetIdx]
    next[targetIdx] = temp
    setPositions(next)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updatePortfolio({ workHistory: positions })
      setShowSuccessModal(true)
    } catch {
      alert('Failed to save career positions.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <UnsavedChangesBanner
        isDirty={isDirty}
        onSave={handleSave}
        onReset={handleReset}
        isSaving={saving}
      />

      <div className="admin-page-header admin-page-header--action">
        <div className="admin-page-header__title">
          <div className="admin-header-icon">
            <Briefcase size={24} />
          </div>
          <div>
            <h1>Career Positions & Responsibilities</h1>
            <p>Add, edit, reorder or remove military service roles, UN peacekeeping missions, and staff appointments.</p>
          </div>
        </div>

        <div className="admin-action-group">
          <button type="button" className="btn btn--secondary" onClick={handleAddPosition}>
            <Plus size={18} />
            <span>Add Position</span>
          </button>

          <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={18} className="admin-spinner" /> : <Save size={18} />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="admin-career-list">
        {positions.map((pos, idx) => {
          const isEditing = editingIdx === idx
          return (
            <div key={idx} className={`admin-card admin-career-card ${isEditing ? 'is-editing' : ''}`}>
              <div className="admin-career-card__header">
                <div className="admin-career-card__title">
                  <strong className="admin-badge admin-badge--primary">{idx + 1}</strong>
                  <h3>{pos.title}</h3>
                  <span className="admin-career-card__period">{pos.period}</span>
                </div>

                <div className="admin-career-card__actions">
                  <button
                    type="button"
                    className="admin-icon-btn"
                    onClick={() => handleMove(idx, 'up')}
                    disabled={idx === 0}
                    title="Move up"
                  >
                    <MoveUp size={16} />
                  </button>

                  <button
                    type="button"
                    className="admin-icon-btn"
                    onClick={() => handleMove(idx, 'down')}
                    disabled={idx === positions.length - 1}
                    title="Move down"
                  >
                    <MoveDown size={16} />
                  </button>

                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={() => setEditingIdx(isEditing ? null : idx)}
                  >
                    <Edit3 size={14} />
                    <span>{isEditing ? 'Close' : 'Edit'}</span>
                  </button>

                  <button
                    type="button"
                    className="admin-icon-btn is-danger"
                    onClick={() => handleDeletePosition(idx)}
                    title="Delete position"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="admin-career-card__form">
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label>Job Title / Appointment</label>
                      <input
                        type="text"
                        value={pos.title}
                        onChange={(e) => handleFieldChange(idx, 'title', e.target.value)}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Location / Unit / Mission</label>
                      <input
                        type="text"
                        value={pos.location}
                        onChange={(e) => handleFieldChange(idx, 'location', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label>Period / Dates</label>
                    <input
                      type="text"
                      value={pos.period}
                      onChange={(e) => handleFieldChange(idx, 'period', e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Responsibilities (One bullet point per line)</label>
                    <textarea
                      value={pos.description.join('\n')}
                      onChange={(e) => handleFieldChange(idx, 'description', e.target.value)}
                      rows={5}
                    />
                  </div>
                </div>
              ) : (
                <div className="admin-career-card__preview">
                  <p className="admin-career-card__location">{pos.location}</p>
                  <ul className="admin-career-card__bullets">
                    {pos.description.map((bullet, bIdx) => (
                      <li key={bIdx}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <SaveSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Career Records Saved"
        message="Career positions and service history updated successfully."
      />
    </div>
  )
}

