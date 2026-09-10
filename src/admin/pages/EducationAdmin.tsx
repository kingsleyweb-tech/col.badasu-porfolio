import React, { useState, useEffect } from 'react'
import { GraduationCap, Save, Plus, Trash2, Loader2 } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'
import { UnsavedChangesBanner } from '../components/UnsavedChangesBanner'
import { SaveSuccessModal } from '../components/SaveSuccessModal'

export const EducationAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()

  const [profCerts, setProfCerts] = useState(data.professionalCertificates || [])
  const [milDiplomas, setMilDiplomas] = useState(data.militaryDiplomas || [])
  const [unitarCerts, setUnitarCerts] = useState(data.unitarPociCertificates || [])
  const [profCourses, setProfCourses] = useState(data.professionalCourses || [])

  const [saving, setSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    setProfCerts(data.professionalCertificates || [])
    setMilDiplomas(data.militaryDiplomas || [])
    setUnitarCerts(data.unitarPociCertificates || [])
    setProfCourses(data.professionalCourses || [])
  }, [data])

  const isDirty =
    JSON.stringify(profCerts) !== JSON.stringify(data.professionalCertificates || []) ||
    JSON.stringify(milDiplomas) !== JSON.stringify(data.militaryDiplomas || []) ||
    JSON.stringify(unitarCerts) !== JSON.stringify(data.unitarPociCertificates || []) ||
    JSON.stringify(profCourses) !== JSON.stringify(data.professionalCourses || [])

  const handleReset = () => {
    setProfCerts(data.professionalCertificates || [])
    setMilDiplomas(data.militaryDiplomas || [])
    setUnitarCerts(data.unitarPociCertificates || [])
    setProfCourses(data.professionalCourses || [])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updatePortfolio({
        professionalCertificates: profCerts,
        militaryDiplomas: milDiplomas,
        unitarPociCertificates: unitarCerts,
        professionalCourses: profCourses
      })
      setShowSuccessModal(true)
    } catch {
      alert('Failed to save education qualifications.')
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
            <GraduationCap size={24} />
          </div>
          <div>
            <h1>Education & Qualifications Management</h1>
            <p>Manage all 4 sections of education: Professional Development, Military Diplomas, UNITAR-POCI, and Professional Courses.</p>
          </div>
        </div>

        <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={18} className="admin-spinner" /> : <Save size={18} />}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* 1. Professional Development Certificates */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card__header">
          <div>
            <h3>1. Professional Development Certificates</h3>
            <p>Certificates from GIMPA, Oxford Brookes, etc.</p>
          </div>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() =>
              setProfCerts([
                ...profCerts,
                { category: 'Professional Development Certificate', title: 'New Certificate', institution: 'Institution Name', period: '2026', description: 'Description' }
              ])
            }
          >
            <Plus size={16} />
            <span>Add Certificate</span>
          </button>
        </div>

        <div className="admin-grid-2">
          {profCerts.map((item, idx) => (
            <div key={idx} className="admin-item-card">
              <div className="admin-item-card__header">
                <div className="admin-item-card__title">
                  <strong className="admin-badge admin-badge--primary">#{idx + 1}</strong>
                  <h3>{item.title}</h3>
                </div>
                <button
                  type="button"
                  className="admin-icon-btn is-danger"
                  onClick={() => setProfCerts(profCerts.filter((_, i) => i !== idx))}
                  title="Delete certificate"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="admin-form-group">
                <label>Certificate Title</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => {
                    const next = [...profCerts]
                    next[idx].title = e.target.value
                    setProfCerts(next)
                  }}
                />
              </div>

              <div className="admin-form-group">
                <label>Institution / Provider</label>
                <input
                  type="text"
                  value={item.institution}
                  onChange={(e) => {
                    const next = [...profCerts]
                    next[idx].institution = e.target.value
                    setProfCerts(next)
                  }}
                />
              </div>

              <div className="admin-form-group">
                <label>Period / Year</label>
                <input
                  type="text"
                  value={item.period}
                  onChange={(e) => {
                    const next = [...profCerts]
                    next[idx].period = e.target.value
                    setProfCerts(next)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Military Diplomas Section */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card__header">
          <div>
            <h3>2. Military Diplomas & Strategic Certificates</h3>
            <p>Diplomas from Cranfield University, War College, Wales University, etc.</p>
          </div>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() =>
              setMilDiplomas([
                ...milDiplomas,
                { category: 'Military Diploma', title: 'New Military Diploma', institution: 'University', period: '2026', description: 'Description' }
              ])
            }
          >
            <Plus size={16} />
            <span>Add Qualification</span>
          </button>
        </div>

        <div className="admin-grid-2">
          {milDiplomas.map((item, idx) => (
            <div key={idx} className="admin-item-card">
              <div className="admin-item-card__header">
                <div className="admin-item-card__title">
                  <strong className="admin-badge admin-badge--primary">#{idx + 1}</strong>
                  <h3>{item.title}</h3>
                </div>
                <button
                  type="button"
                  className="admin-icon-btn is-danger"
                  onClick={() => setMilDiplomas(milDiplomas.filter((_, i) => i !== idx))}
                  title="Delete qualification"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="admin-form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => {
                    const next = [...milDiplomas]
                    next[idx].title = e.target.value
                    setMilDiplomas(next)
                  }}
                />
              </div>

              <div className="admin-form-group">
                <label>Institution</label>
                <input
                  type="text"
                  value={item.institution}
                  onChange={(e) => {
                    const next = [...milDiplomas]
                    next[idx].institution = e.target.value
                    setMilDiplomas(next)
                  }}
                />
              </div>

              <div className="admin-form-group">
                <label>Period / Year</label>
                <input
                  type="text"
                  value={item.period}
                  onChange={(e) => {
                    const next = [...milDiplomas]
                    next[idx].period = e.target.value
                    setMilDiplomas(next)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. UNITAR-POCI Certificates */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card__header">
          <div>
            <h3>3. UNITAR-POCI Certificates of Completion</h3>
            <p>Certificates obtained at UNOCI FHQ, Abidjan, Cote d'Ivoire.</p>
          </div>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() =>
              setUnitarCerts([
                ...unitarCerts,
                { category: 'UNITAR-POCI Certificates', title: 'New UNITAR Course', institution: 'UNOCI FHQ Abidjan, Cote d\'Ivoire', period: 'June 2004 - July 2005', description: 'UNITAR-POCI certificate of completion.' }
              ])
            }
          >
            <Plus size={16} />
            <span>Add UNITAR Certificate</span>
          </button>
        </div>

        <div className="admin-grid-2">
          {unitarCerts.map((item, idx) => (
            <div key={idx} className="admin-item-card">
              <div className="admin-item-card__header">
                <div className="admin-item-card__title">
                  <strong className="admin-badge admin-badge--primary">#{idx + 1}</strong>
                  <h3>{item.title}</h3>
                </div>
                <button
                  type="button"
                  className="admin-icon-btn is-danger"
                  onClick={() => setUnitarCerts(unitarCerts.filter((_, i) => i !== idx))}
                  title="Delete UNITAR certificate"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="admin-form-group">
                <label>Course Title</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => {
                    const next = [...unitarCerts]
                    next[idx].title = e.target.value
                    setUnitarCerts(next)
                  }}
                />
              </div>

              <div className="admin-form-group">
                <label>Institution / Location</label>
                <input
                  type="text"
                  value={item.institution}
                  onChange={(e) => {
                    const next = [...unitarCerts]
                    next[idx].institution = e.target.value
                    setUnitarCerts(next)
                  }}
                />
              </div>

              <div className="admin-form-group">
                <label>Period / Year</label>
                <input
                  type="text"
                  value={item.period}
                  onChange={(e) => {
                    const next = [...unitarCerts]
                    next[idx].period = e.target.value
                    setUnitarCerts(next)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Professional Courses */}
      <div className="admin-card">
        <div className="admin-card__header">
          <div>
            <h3>4. Courses Attended in Ghana & Foreign Countries</h3>
            <p>Military & executive courses attended in Ghana and international institutions.</p>
          </div>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() =>
              setProfCourses([
                ...profCourses,
                { category: 'Professional Course', title: 'New Course Name', institution: 'Location / Institution', period: '2026', description: 'Course details' }
              ])
            }
          >
            <Plus size={16} />
            <span>Add Professional Course</span>
          </button>
        </div>

        <div className="admin-grid-2">
          {profCourses.map((item, idx) => (
            <div key={idx} className="admin-item-card">
              <div className="admin-item-card__header">
                <div className="admin-item-card__title">
                  <strong className="admin-badge admin-badge--primary">#{idx + 1}</strong>
                  <h3>{item.title}</h3>
                </div>
                <button
                  type="button"
                  className="admin-icon-btn is-danger"
                  onClick={() => setProfCourses(profCourses.filter((_, i) => i !== idx))}
                  title="Delete course"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="admin-form-group">
                <label>Course Title</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => {
                    const next = [...profCourses]
                    next[idx].title = e.target.value
                    setProfCourses(next)
                  }}
                />
              </div>

              <div className="admin-form-group">
                <label>Institution / Location</label>
                <input
                  type="text"
                  value={item.institution}
                  onChange={(e) => {
                    const next = [...profCourses]
                    next[idx].institution = e.target.value
                    setProfCourses(next)
                  }}
                />
              </div>

              <div className="admin-form-group">
                <label>Period / Dates</label>
                <input
                  type="text"
                  value={item.period}
                  onChange={(e) => {
                    const next = [...profCourses]
                    next[idx].period = e.target.value
                    setProfCourses(next)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <SaveSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Education & Qualifications Saved"
        message="All 4 sections of Education & Qualifications have been updated live."
      />
    </div>
  )
}
