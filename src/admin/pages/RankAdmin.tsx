import React, { useState, useEffect } from 'react'
import { ShieldCheck, Save, Loader2, Award } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'
import { UnsavedChangesBanner } from '../components/UnsavedChangesBanner'
import { SaveSuccessModal } from '../components/SaveSuccessModal'

export const RankAdmin: React.FC = () => {
  const { data, updatePortfolio } = usePortfolio()

  const officer = data.officer || {}

  const [rank, setRank] = useState(officer.rank || 'Colonel')
  const [shortRank, setShortRank] = useState((officer as any).shortRank || 'Col.')
  const [name, setName] = useState(officer.name || 'Henry Kwaku Badasu')
  const [formalName, setFormalName] = useState(officer.formalName || 'BADASU KWAKU HENRY')
  const [force, setForce] = useState(officer.force || 'Ghana Armed Forces')
  const [branch, setBranch] = useState(officer.branch || 'Teshie, Accra - Ghana')
  const [academy, setAcademy] = useState(officer.academy || 'Ghana Military Academy')
  const [enlistment, setEnlistment] = useState(officer.enlistment || '22 November 1995')
  const [profileLabel, setProfileLabel] = useState(officer.profileLabel || 'Senior Army Officer')
  const [motto, setMotto] = useState(officer.motto || 'Professionalism, Integrity and Discipline')

  const [saving, setSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    setRank(officer.rank || 'Colonel')
    setShortRank((officer as any).shortRank || 'Col.')
    setName(officer.name || 'Henry Kwaku Badasu')
    setFormalName(officer.formalName || 'BADASU KWAKU HENRY')
    setForce(officer.force || 'Ghana Armed Forces')
    setBranch(officer.branch || 'Teshie, Accra - Ghana')
    setAcademy(officer.academy || 'Ghana Military Academy')
    setEnlistment(officer.enlistment || '22 November 1995')
    setProfileLabel(officer.profileLabel || 'Senior Army Officer')
    setMotto(officer.motto || 'Professionalism, Integrity and Discipline')
  }, [data])

  const isDirty =
    rank !== (officer.rank || 'Colonel') ||
    shortRank !== ((officer as any).shortRank || 'Col.') ||
    name !== (officer.name || 'Henry Kwaku Badasu') ||
    formalName !== (officer.formalName || 'BADASU KWAKU HENRY') ||
    force !== (officer.force || 'Ghana Armed Forces') ||
    branch !== (officer.branch || 'Teshie, Accra - Ghana') ||
    academy !== (officer.academy || 'Ghana Military Academy') ||
    enlistment !== (officer.enlistment || '22 November 1995') ||
    profileLabel !== (officer.profileLabel || 'Senior Army Officer') ||
    motto !== (officer.motto || 'Professionalism, Integrity and Discipline')

  const handleReset = () => {
    setRank(officer.rank || 'Colonel')
    setShortRank((officer as any).shortRank || 'Col.')
    setName(officer.name || 'Henry Kwaku Badasu')
    setFormalName(officer.formalName || 'BADASU KWAKU HENRY')
    setForce(officer.force || 'Ghana Armed Forces')
    setBranch(officer.branch || 'Teshie, Accra - Ghana')
    setAcademy(officer.academy || 'Ghana Military Academy')
    setEnlistment(officer.enlistment || '22 November 1995')
    setProfileLabel(officer.profileLabel || 'Senior Army Officer')
    setMotto(officer.motto || 'Professionalism, Integrity and Discipline')
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)

    try {
      // Also update rank in biographicDetails if present
      const updatedBiographicDetails = (data.biographicDetails || []).map((detail) => {
        if (detail.label.toLowerCase() === 'rank') {
          return { ...detail, value: rank.toUpperCase() }
        }
        if (detail.label.toLowerCase() === 'name') {
          return { ...detail, value: name.split(' ').slice(0, -1).join(' ').toUpperCase() }
        }
        if (detail.label.toLowerCase() === 'first name') {
          return { ...detail, value: name.split(' ').pop()?.toUpperCase() || detail.value }
        }
        return detail
      })

      // Update footer displayRank if set
      const updatedFooter = {
        ...data.footer,
        displayRank: rank,
        displayName: `${rank} ${name}`,
      }

      await updatePortfolio({
        officer: {
          ...officer,
          rank,
          shortRank,
          name,
          formalName,
          force,
          branch,
          academy,
          enlistment,
          profileLabel,
          motto,
        },
        biographicDetails: updatedBiographicDetails,
        footer: updatedFooter,
      })

      setShowSuccessModal(true)
    } catch (err) {
      console.error(err)
      alert('Failed to save Rank & Military Identity settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <UnsavedChangesBanner isDirty={isDirty} onSave={handleSave} onReset={handleReset} />
      <SaveSuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} message="Rank & Military Title updated successfully! All pages reflect the change." />

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Rank & Military Title Management</h1>
          <p className="admin-page-subtitle">
            Update the rank (e.g. Colonel, Brigadier General) and official identity details. Changes automatically sync across the entire website and portfolio pages.
          </p>
        </div>

        <button
          className="admin-btn admin-btn--primary"
          type="button"
          onClick={() => handleSave()}
          disabled={saving || !isDirty}
        >
          {saving ? <Loader2 size={16} className="admin-spin" /> : <Save size={16} />}
          <span>{saving ? 'Saving...' : 'Save Rank Changes'}</span>
        </button>
      </div>

      <div className="admin-card" style={{ maxWidth: '800px', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
          <ShieldCheck size={24} style={{ color: '#1e3a8a' }} />
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Military Rank & Title</h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              Changing the rank here updates headers, hero banners, footer, QR codes, and biographic records instantly.
            </p>
          </div>
        </div>

        <div className="admin-form-group" style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
            Full Rank Title <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            className="admin-input"
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            placeholder="e.g. Brigadier General, Colonel, Major General"
            required
          />
          <small style={{ color: '#64748b', fontSize: '0.8125rem' }}>
            Full military rank title shown across page headers, biography, hero, and cards (e.g. <strong>Colonel</strong> or <strong>Brigadier General</strong>).
          </small>
        </div>

        <div className="admin-form-group" style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
            Rank Abbreviation / Short Form <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            className="admin-input"
            value={shortRank}
            onChange={(e) => setShortRank(e.target.value)}
            placeholder="e.g. Brig. Gen., Col., Maj. Gen."
            required
          />
          <small style={{ color: '#64748b', fontSize: '0.8125rem' }}>
            Short abbreviation used in site badges and compact views (e.g. <strong>Col.</strong> or <strong>Brig. Gen.</strong>).
          </small>
        </div>

        <div className="admin-form-group" style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
            Officer Display Name <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            className="admin-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Henry Kwaku Badasu"
            required
          />
        </div>

        <div className="admin-form-group" style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
            Formal / Official Full Name (Uppercase)
          </label>
          <input
            type="text"
            className="admin-input"
            value={formalName}
            onChange={(e) => setFormalName(e.target.value)}
            placeholder="e.g. BADASU KWAKU HENRY"
          />
        </div>
      </div>

      <div className="admin-card" style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
          <Award size={24} style={{ color: '#1e3a8a' }} />
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Military Service & Organization</h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              Primary force affiliation, academy, and enlistment credentials.
            </p>
          </div>
        </div>

        <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="admin-form-group">
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Armed Forces Branch</label>
            <input
              type="text"
              className="admin-input"
              value={force}
              onChange={(e) => setForce(e.target.value)}
              placeholder="Ghana Armed Forces"
            />
          </div>

          <div className="admin-form-group">
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Profile Badge / Label</label>
            <input
              type="text"
              className="admin-input"
              value={profileLabel}
              onChange={(e) => setProfileLabel(e.target.value)}
              placeholder="Senior Army Officer"
            />
          </div>

          <div className="admin-form-group">
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Location / Station</label>
            <input
              type="text"
              className="admin-input"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="Teshie, Accra - Ghana"
            />
          </div>

          <div className="admin-form-group">
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Military Academy</label>
            <input
              type="text"
              className="admin-input"
              value={academy}
              onChange={(e) => setAcademy(e.target.value)}
              placeholder="Ghana Military Academy"
            />
          </div>

          <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Enlistment Date</label>
            <input
              type="text"
              className="admin-input"
              value={enlistment}
              onChange={(e) => setEnlistment(e.target.value)}
              placeholder="22 November 1995"
            />
          </div>

          <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Service Motto</label>
            <input
              type="text"
              className="admin-input"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder="Professionalism, Integrity and Discipline"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
