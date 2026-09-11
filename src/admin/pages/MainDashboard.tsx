import React, { useEffect, useState } from 'react'
import {
  ExternalLink,
  ShieldCheck,
  Clock,
  Settings,
  ImageIcon,
  Briefcase,
  Award,
  UserCheck
} from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'

export const MainDashboard: React.FC = () => {
  const { data } = usePortfolio()
  const [collectionCount, setCollectionCount] = useState<number>(0)
  const [totalImages, setTotalImages] = useState<number>(0)

  useEffect(() => {
    let active = true
    const loadGalleryStats = async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetch('/api/gallery')
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          if (active && data && Array.isArray(data.collections)) {
            setCollectionCount(data.collections.length)
            const total = data.collections.reduce((acc: number, col: { count?: number }) => acc + (col.count || 0), 0)
            setTotalImages(total)
          }
          break
        } catch {
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 500 * attempt))
          }
        }
      }
    }
    loadGalleryStats()
    return () => { active = false }
  }, [])

  const totalEntries =
    (data.workHistory?.length || 0) +
    (data.awards?.length || 0) +
    (data.militaryDiplomas?.length || 0) +
    (data.professionalCertificates?.length || 0) +
    (data.unitarPociCertificates?.length || 0) +
    totalImages

  const recentActivity = [
    { title: 'Updated site settings', desc: 'Site title and logo changed', time: '2 hours ago', icon: Settings },
    { title: 'New gallery collection added', desc: '"UN Peacekeeping" collection uploaded', time: '4 hours ago', icon: ImageIcon },
    { title: 'Career section updated', desc: 'Added new position details', time: '6 hours ago', icon: Briefcase },
    { title: 'Award added', desc: '"United Nations Medal" added', time: '8 hours ago', icon: Award },
    { title: 'Profile information updated', desc: 'Contact details and bio updated', time: 'Yesterday', icon: UserCheck }
  ]

  return (
    <div className="admin-page">
      {/* Welcome Banner */}
      <div className="admin-page-header">
        <div>
          <h1>Welcome, Colonel Badasu</h1>
          <p>Manage your portfolio content from one place. Make changes anytime, and they will reflect instantly on your website.</p>
        </div>
      </div>

      {/* Stat Cards — 1 primary hero + 3 secondary */}
      <div className="admin-stats-hero-grid">
        {/* Primary Big Card */}
        <div className="admin-stat-card admin-stat-card--primary">
          <span className="admin-stat-card__title">Gallery Collections</span>
          <strong className="admin-stat-card__value">
            {collectionCount ? collectionCount : '—'}
          </strong>
          <small className="admin-stat-card__meta">
            {totalImages ? `${totalImages} total media files in Cloudinary` : 'Synced with Cloudinary CDN'}
          </small>
        </div>

        {/* Secondary Small Cards */}
        <div className="admin-stats-secondary-group">
          <div className="admin-stat-card admin-stat-card--secondary">
            <span className="admin-stat-card__title">Total Sections</span>
            <strong className="admin-stat-card__value">11</strong>
            <small className="admin-stat-card__meta">Active portfolio sections</small>
          </div>

          <div className="admin-stat-card admin-stat-card--secondary">
            <span className="admin-stat-card__title">Content Items</span>
            <strong className="admin-stat-card__value">{totalEntries}</strong>
            <small className="admin-stat-card__meta">Total live data entries</small>
          </div>

          <div className="admin-stat-card admin-stat-card--secondary">
            <span className="admin-stat-card__title">System Status</span>
            <strong className="admin-stat-card__value">Live</strong>
            <small className="admin-stat-card__meta">Firebase &amp; Cloudinary connected</small>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="admin-dashboard-grid">
        {/* Left: empty main — sidebar takes full width now */}
        <div className="admin-dashboard-main" style={{ display: 'none' }} />

        {/* Sidebar: Flag Banner + Recent Activity + Security */}
        <div className="admin-dashboard-sidebar" style={{ gridColumn: '1 / -1' }}>
          {/* Ghana Flag Card */}
          <div className="admin-flag-card">
            <div className="admin-flag-card__overlay">
              <span className="admin-flag-card__tag">Your Portfolio</span>
              <h3>Live &amp; Updated</h3>
              <p>Every change you make here will be reflected on your public website instantly.</p>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--secondary btn--sm admin-flag-card__btn"
              >
                <span>View Live Site</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="admin-card">
            <div className="admin-card__header">
              <div className="admin-card__title-wrap">
                <Clock size={18} />
                <h3>Recent Activity</h3>
              </div>
              <span className="admin-link">View All</span>
            </div>
            <div className="admin-activity-list">
              {recentActivity.map((act, idx) => {
                const Icon = act.icon
                return (
                  <div key={idx} className="admin-activity-item">
                    <div className="admin-activity-item__icon">
                      <Icon size={16} />
                    </div>
                    <div className="admin-activity-item__body">
                      <strong>{act.title}</strong>
                      <p>{act.desc}</p>
                    </div>
                    <span className="admin-activity-item__time">{act.time}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Security Status Card */}
          <div className="admin-security-status-card">
            <ShieldCheck size={20} />
            <div>
              <strong>Your portfolio is secure</strong>
              <p>All changes are protected and backed up.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
