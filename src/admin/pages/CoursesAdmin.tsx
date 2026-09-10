import React, { useState, useEffect } from 'react'
import { BookOpen, Save, Plus, Trash2, Loader2 } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'
import { UnsavedChangesBanner } from '../components/UnsavedChangesBanner'
import { SaveSuccessModal } from '../components/SaveSuccessModal'

export const CoursesAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()
  const [courses, setCourses] = useState(data.professionalCourses || [])
  const [saving, setSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    setCourses(data.professionalCourses || [])
  }, [data])

  const isDirty = JSON.stringify(courses) !== JSON.stringify(data.professionalCourses || [])

  const handleReset = () => {
    setCourses(data.professionalCourses || [])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updatePortfolio({ professionalCourses: courses })
      setShowSuccessModal(true)
    } catch {
      alert('Failed to save professional courses.')
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
            <BookOpen size={24} />
          </div>
          <div>
            <h1>Professional Courses & Training Management</h1>
            <p>Manage courses attended in Ghana and foreign countries (War College, University of London LLB, MA in Strategy, etc.).</p>
          </div>
        </div>

        <div className="admin-action-group">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setCourses([...courses, { category: 'Professional Course', title: 'New Course Name', institution: 'Location / Institution', period: '2026', description: 'Course details' }])}
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

      <div className="admin-grid-2">
        {courses.map((c, idx) => (
          <div key={idx} className="admin-card" style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
            <div className="admin-card__header">
              <h3>Course #{idx + 1}</h3>
              <button type="button" className="admin-icon-btn is-danger" onClick={() => setCourses(courses.filter((_, i) => i !== idx))}>
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
                    const next = [...courses]
                    next[idx].title = e.target.value
                    setCourses(next)
                  }}
                />
              </div>

              <div className="admin-form-group">
                <label>Institution / Provider</label>
                <input
                  type="text"
                  value={c.institution}
                  onChange={(e) => {
                    const next = [...courses]
                    next[idx].institution = e.target.value
                    setCourses(next)
                  }}
                />
              </div>

              <div className="admin-form-group">
                <label>Dates / Period</label>
                <input
                  type="text"
                  value={c.period}
                  onChange={(e) => {
                    const next = [...courses]
                    next[idx].period = e.target.value
                    setCourses(next)
                  }}
                />
              </div>

              <div className="admin-form-group">
                <label>Description (Optional)</label>
                <input
                  type="text"
                  value={c.description || ''}
                  onChange={(e) => {
                    const next = [...courses]
                    next[idx].description = e.target.value
                    setCourses(next)
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <SaveSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Courses Saved"
        message="Professional courses updated live on your site."
      />
    </div>
  )
}
