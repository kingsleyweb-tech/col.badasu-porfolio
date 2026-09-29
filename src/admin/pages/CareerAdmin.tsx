import React, { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Briefcase, Plus, Search, Trash2 } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'
import type { WorkHistoryItem } from '../../data/officerData'
import { UnsavedChangesBanner } from '../components/UnsavedChangesBanner'
import { SaveSuccessModal } from '../components/SaveSuccessModal'

const pad2 = (n: number) => String(n).padStart(2, '0')
const isPresent = (period: string) => /present/i.test(period)

export const CareerAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()
  const [positions, setPositions] = useState<WorkHistoryItem[]>(data.workHistory)
  const [saving, setSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [filter, setFilter] = useState('')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    setPositions(data.workHistory)
  }, [data])

  const isDirty = JSON.stringify(positions) !== JSON.stringify(data.workHistory)
  const changedCount = positions.filter((p, i) => JSON.stringify(p) !== JSON.stringify(data.workHistory[i])).length

  const handleReset = () => {
    setPositions(data.workHistory)
    setEditingIdx(null)
  }

  // Copy the edited record so the published data in context is never mutated
  const handleFieldChange = (index: number, field: keyof WorkHistoryItem, value: string) => {
    setPositions((prev) =>
      prev.map((pos, i) => {
        if (i !== index) return pos
        return field === 'description' ? { ...pos, description: value.split('\n').filter(Boolean) } : { ...pos, [field]: value }
      })
    )
  }

  const handleAddPosition = () => {
    const newPos: WorkHistoryItem = {
      title: 'New appointment',
      location: 'Ghana Armed Forces',
      period: `${new Date().getFullYear()} - Present`,
      description: ['Headline duty for this appointment.'],
    }
    setPositions([newPos, ...positions])
    setEditingIdx(0)
    setFilter('')
  }

  const handleDeletePosition = (index: number) => {
    if (window.confirm('Delete this appointment from the career timeline?')) {
      setPositions(positions.filter((_, i) => i !== index))
      setEditingIdx(null)
    }
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= positions.length) return
    const next = [...positions]
    ;[next[index], next[targetIdx]] = [next[targetIdx], next[index]]
    setPositions(next)
    if (editingIdx === index) setEditingIdx(targetIdx)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updatePortfolio({ workHistory: positions })
      setLastSaved(new Date())
      setShowSuccessModal(true)
    } catch {
      alert('Failed to save career positions.')
    } finally {
      setSaving(false)
    }
  }

  const query = filter.trim().toLowerCase()
  const visible = positions
    .map((pos, idx) => ({ pos, idx }))
    .filter(({ pos }) => !query || `${pos.title} ${pos.location} ${pos.period}`.toLowerCase().includes(query))
  const previewIdx = editingIdx ?? 0
  const preview = positions[previewIdx]

  return (
    <div className="ad-page">
      <div className="ad-ph">
        <div className="t">
          <span className="ic"><Briefcase size={26} /></span>
          <div>
            <h1>Career</h1>
            <p>Appointments shown on the career timeline, most recent first. Reorder with the arrows; one duty per line.</p>
          </div>
        </div>
        <button type="button" className="ad-b g" onClick={handleAddPosition}>
          <Plus size={16} strokeWidth={2.4} />
          Add appointment
        </button>
      </div>

      <UnsavedChangesBanner
        isDirty={isDirty}
        onSave={handleSave}
        onReset={handleReset}
        isSaving={saving}
        message={`You have unsaved changes to ${changedCount || 1} appointment${changedCount > 1 ? 's' : ''}`}
      />

      <div className="ad-two wide">
        <div className="ad-card">
          <div className="ad-tools">
            <label className="ad-inp">
              <Search size={15} />
              <input type="search" placeholder="Filter appointments…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter appointments" />
            </label>
            <span className="ad-pill g">{positions.length} appointments</span>
          </div>

          {visible.length === 0 && <p className="ad-empty">No appointments match “{filter}”.</p>}

          {visible.map(({ pos, idx }) => {
            const isEditing = editingIdx === idx
            return (
              <div key={idx} className={`ad-row ${isEditing ? 'open' : ''}`}>
                <span className="n">{pad2(idx + 1)}</span>
                <div className="ad-row-head">
                  <button type="button" className="ad-row-title" onClick={() => setEditingIdx(isEditing ? null : idx)} aria-expanded={isEditing}>
                    <b>{pos.title || 'Untitled appointment'}</b>
                    <small>{pos.period} · {pos.location}</small>
                  </button>
                  <div className="acts">
                    {isPresent(pos.period) && !isEditing && <span className="ad-pill gold">Present</span>}
                    <button type="button" className="ad-icb" onClick={() => handleMove(idx, 'up')} disabled={idx === 0} aria-label="Move up">
                      <ArrowUp size={15} />
                    </button>
                    <button type="button" className="ad-icb" onClick={() => handleMove(idx, 'down')} disabled={idx === positions.length - 1} aria-label="Move down">
                      <ArrowDown size={15} />
                    </button>
                    {isEditing ? (
                      <button type="button" className="ad-icb danger" onClick={() => handleDeletePosition(idx)} aria-label="Delete appointment">
                        <Trash2 size={15} />
                      </button>
                    ) : (
                      <button type="button" className="ad-b sm l" onClick={() => setEditingIdx(idx)}>Edit</button>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="ad-form">
                    <div>
                      <label className="ad-lbl" htmlFor={`title-${idx}`}>Position title</label>
                      <input id={`title-${idx}`} className="ad-field" value={pos.title} onChange={(e) => handleFieldChange(idx, 'title', e.target.value)} autoFocus />
                    </div>
                    <div>
                      <label className="ad-lbl" htmlFor={`period-${idx}`}>Period</label>
                      <input id={`period-${idx}`} className="ad-field" value={pos.period} onChange={(e) => handleFieldChange(idx, 'period', e.target.value)} />
                      <div className="ad-hint">Write “Present” for a current role — it gets the gold marker.</div>
                    </div>
                    <div className="full">
                      <label className="ad-lbl" htmlFor={`loc-${idx}`}>Location / unit</label>
                      <input id={`loc-${idx}`} className="ad-field" value={pos.location} onChange={(e) => handleFieldChange(idx, 'location', e.target.value)} />
                    </div>
                    <div className="full">
                      <label className="ad-lbl" htmlFor={`duties-${idx}`}>Duties — one per line</label>
                      <textarea
                        id={`duties-${idx}`}
                        className="ad-field"
                        rows={7}
                        value={pos.description.join('\n')}
                        onChange={(e) => handleFieldChange(idx, 'description', e.target.value)}
                      />
                      <div className="ad-hint">
                        {pos.description.length} dut{pos.description.length === 1 ? 'y' : 'ies'} · the first line is the headline shown on the card.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="ad-card ad-prev">
          <div className="hd">
            <div>
              <h3>Live preview</h3>
              <p>How {editingIdx === null ? 'the first' : 'the open'} appointment appears on the career page.</p>
            </div>
          </div>
          {preview ? (
            <div className="ad-tc">
              <div className="top">
                <span className="dt">{preview.period}</span>
                {isPresent(preview.period) && <span className="ad-pill gold">Present</span>}
              </div>
              <div className="ttl">{preview.title}</div>
              <div className="loc">{preview.location}</div>
              {preview.description[0] && <p>{preview.description[0]}</p>}
              {preview.description.length > 1 && <span className="ad-b sm l">Full duties · {preview.description.length} +</span>}
            </div>
          ) : (
            <p className="ad-empty">No appointments yet.</p>
          )}
          <div className="ad-kv"><span>Last saved</span><b>{lastSaved ? lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not this session'}</b></div>
        </div>
      </div>

      <SaveSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Career records saved"
        message="Career positions and service history updated successfully."
      />
    </div>
  )
}
