import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  ImageIcon,
  Users,
  CloudCheck,
  Sliders,
  UserCheck,
  Briefcase,
  Award,
  GraduationCap,
  BookOpen,
  Globe,
  Star,
  QrCode,
  Settings,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Clock
} from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'

export const MainDashboard: React.FC = () => {
  const { data } = usePortfolio()
  const [collectionCount, setCollectionCount] = useState<number>(0)
  const [totalImages, setTotalImages] = useState<number>(0)

  useEffect(() => {
    let active = true
    fetch('/api/gallery')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (active && data && Array.isArray(data.folders)) {
          setCollectionCount(data.folders.length)
          const total = data.folders.reduce((acc: number, folder: { totalResources?: number }) => acc + (folder.totalResources || 0), 0)
          setTotalImages(total)
        }
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  const totalEntries =
    (data.workHistory?.length || 0) +
    (data.awards?.length || 0) +
    (data.militaryDiplomas?.length || 0) +
    (data.professionalCertificates?.length || 0) +
    (data.unitarPociCertificates?.length || 0) +
    totalImages

  const statCards = [
    { title: 'Total Sections', value: '11', meta: 'Active portfolio sections', icon: FileText, color: 'blue' },
    { title: 'Gallery Collections', value: collectionCount ? `${collectionCount}` : 'Live', meta: totalImages ? `${totalImages} media files in Cloudinary` : 'Synced with Cloudinary', icon: ImageIcon, color: 'green' },
    { title: 'Content Items', value: `${totalEntries}`, meta: 'Total live data entries', icon: Users, color: 'purple' },
    { title: 'System Status', value: 'Live & Active', meta: 'Connected to Firebase & Cloudinary', icon: CloudCheck, color: 'teal' }
  ]

  const quickAccessSections = [
    { title: 'Rank & Military Title', desc: 'Change military rank title (e.g. Brig. General) across site.', icon: ShieldCheck, to: '/admin/rank' },
    { title: 'Hero Section', desc: 'Update the main banner, title and intro text.', icon: Sliders, to: '/admin/hero' },
    { title: 'Biography', desc: 'Edit personal information and summary.', icon: UserCheck, to: '/admin/biography' },
    { title: 'Career', desc: 'Add, edit or remove career positions and responsibilities.', icon: Briefcase, to: '/admin/career' },
    { title: 'Awards & Decorations', desc: 'Manage awards, medals and honors.', icon: Award, to: '/admin/awards' },
    { title: 'Education & Qualifications', desc: 'Update academic background and degrees.', icon: GraduationCap, to: '/admin/education' },
    { title: 'Professional Courses', desc: 'Manage training and certification records.', icon: BookOpen, to: '/admin/courses' },
    { title: 'Languages', desc: 'Edit spoken and written languages.', icon: Globe, to: '/admin/languages' },
    { title: 'Leadership / Service / Excellence', desc: 'Update key sections and messages.', icon: Star, to: '/admin/leadership' },
    { title: 'Military Journey / Gallery', desc: 'Manage photos, collections and media.', icon: ImageIcon, to: '/admin/gallery' },
    { title: 'QR Landing Page', desc: 'Edit QR page content and redirect settings.', icon: QrCode, to: '/admin/welcome' },
    { title: 'Site Settings', desc: 'Update logo, site title and general settings.', icon: Settings, to: '/admin/settings' },
    { title: 'Users & Access', desc: 'Manage admin accounts and permissions.', icon: Users, to: '/admin/users' }
  ]

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

      {/* Stat Cards Row */}
      <div className="admin-stats-grid">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="admin-stat-card">
              <div className={`admin-stat-card__icon is-${stat.color}`}>
                <Icon size={20} />
              </div>
              <div className="admin-stat-card__content">
                <span className="admin-stat-card__title">{stat.title}</span>
                <strong className="admin-stat-card__value">{stat.value}</strong>
                <small className="admin-stat-card__meta">{stat.meta}</small>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Grid Layout */}
      <div className="admin-dashboard-grid">
        {/* Left Column: Quick Access Sections */}
        <div className="admin-dashboard-main">
          <div className="admin-section-header">
            <div>
              <h2>Quick Access</h2>
              <p>Jump directly to the section you want to manage.</p>
            </div>
          </div>

          <div className="admin-quick-grid">
            {quickAccessSections.map((sec, idx) => {
              const Icon = sec.icon
              return (
                <Link key={idx} to={sec.to} className="admin-quick-card">
                  <div className="admin-quick-card__icon">
                    <Icon size={20} />
                  </div>
                  <div className="admin-quick-card__body">
                    <strong>{sec.title}</strong>
                    <p>{sec.desc}</p>
                  </div>
                  <ChevronRight size={18} className="admin-quick-card__arrow" />
                </Link>
              )
            })}
          </div>
        </div>

        {/* Right Column: Ghana Flag Banner + Recent Activity */}
        <div className="admin-dashboard-sidebar">
          {/* Ghana Flag Card */}
          <div className="admin-flag-card">
            <div className="admin-flag-card__overlay">
              <span className="admin-flag-card__tag">Your Portfolio</span>
              <h3>Live & Updated</h3>
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
