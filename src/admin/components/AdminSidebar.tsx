import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Briefcase,
  Award,
  GraduationCap,
  BookOpen,
  Globe,
  Star,
  Image as ImageIcon,
  QrCode,
  Settings,
  Users,
  LogOut,
  ShieldCheck,
  Sliders,
  Layers,
  Trophy,
  Home,
  Footprints
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePortfolio } from '../../context/PortfolioContext'
import { resolveImageUrl } from '../../utils/imageResolver'

type NavGroup = {
  label: string
  items: { to: string; label: string; icon: React.FC<{ size?: number }> }[]
}

const navGroups: NavGroup[] = [
  {
    label: 'HOME PAGE',
    items: [
      { to: '/admin/hero', label: 'Hero Section', icon: Sliders },
      { to: '/admin/home-cards', label: 'Career & Achievement Cards', icon: Home },
    ],
  },
  {
    label: 'PORTFOLIO',
    items: [
      { to: '/admin/rank', label: 'Rank & Military Title', icon: ShieldCheck },
      { to: '/admin/biography', label: 'Biography', icon: UserCheck },
      { to: '/admin/career', label: 'Career', icon: Briefcase },
    ],
  },
  {
    label: 'ACHIEVEMENTS & EXPERIENCE',
    items: [
      { to: '/admin/awards', label: 'Awards & Decorations', icon: Award },
      { to: '/admin/achievements', label: 'Achievements & Highlights', icon: Trophy },
      { to: '/admin/leadership', label: 'Leadership / Service / Excellence', icon: Star },
    ],
  },
  {
    label: 'EDUCATION & TRAINING',
    items: [
      { to: '/admin/education', label: 'Education & Qualifications', icon: GraduationCap },
      { to: '/admin/courses', label: 'Professional Courses', icon: BookOpen },
    ],
  },
  {
    label: 'PERSONAL',
    items: [
      { to: '/admin/languages', label: 'Languages & Interests', icon: Globe },
    ],
  },
  {
    label: 'MEDIA & GALLERY',
    items: [
      { to: '/admin/gallery', label: 'Gallery Collections', icon: ImageIcon },
    ],
  },
  {
    label: 'WEBSITE',
    items: [
      { to: '/admin/welcome', label: 'QR & Welcome Page', icon: QrCode },
      { to: '/admin/footer', label: 'Footer Settings', icon: Footprints },
      { to: '/admin/settings', label: 'Site & Header Settings', icon: Settings },
    ],
  },
]

export const AdminSidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({ isOpen = false, onClose }) => {
  const { logout } = useAuth()
  const { data } = usePortfolio()
  const navigate = useNavigate()

  const sidebarLogo = data.siteSettings.logoUrl || 'image.png'
  const sidebarTitle = data.siteSettings.adminSidebarTitle || 'Col. Badasu'
  const sidebarSubtitle = data.siteSettings.adminSidebarSubtitle || 'PORTFOLIO ADMIN'

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'HOME PAGE': true,
    PORTFOLIO: true,
    'ACHIEVEMENTS & EXPERIENCE': true,
    'EDUCATION & TRAINING': true,
    PERSONAL: true,
    'MEDIA & GALLERY': true,
    WEBSITE: true,
  })

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <aside className={`admin-sidebar ${isOpen ? 'is-open' : ''}`}>
      {/* Brand Header */}
      <div className="admin-sidebar__brand">
        <div className="admin-sidebar__crest">
          <img src={resolveImageUrl(sidebarLogo)} alt="GAF Emblem" />
        </div>
        <div className="admin-sidebar__brand-text">
          <strong>{sidebarTitle}</strong>
          <span>{sidebarSubtitle}</span>
        </div>
      </div>

      {/* Navigation Scroll Area */}
      <nav className="admin-sidebar__nav">
        {/* Dashboard */}
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => `admin-nav-item ${isActive ? 'is-active' : ''}`}
          onClick={onClose}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/admin/everyone"
          className={({ isActive }) => `admin-nav-item ${isActive ? 'is-active' : ''}`}
          onClick={onClose}
        >
          <Layers size={18} />
          <span>Overview / Everyone</span>
        </NavLink>

        <div className="admin-nav-divider" />

        {/* Category Groups */}
        {navGroups.map((group) => (
          <div key={group.label} className="admin-nav-group">
            <button
              type="button"
              className="admin-nav-group__header"
              onClick={() => toggleGroup(group.label)}
            >
              <span className="admin-nav-group__label">{group.label}</span>
              {openGroups[group.label] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {openGroups[group.label] && (
              <div className="admin-nav-group__children">
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => `admin-nav-subitem ${isActive ? 'is-active' : ''}`}
                      onClick={onClose}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            )}
          </div>
        ))}

        <div className="admin-nav-divider" />

        {/* Account */}
        <p className="admin-nav-group__label" style={{ padding: '4px 16px', marginBottom: '4px' }}>ACCOUNT</p>
        <NavLink
          to="/admin/users"
          className={({ isActive }) => `admin-nav-item ${isActive ? 'is-active' : ''}`}
          onClick={onClose}
        >
          <Users size={18} />
          <span>Users & Access</span>
        </NavLink>

        <button type="button" className="admin-nav-item admin-nav-logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </nav>

      {/* Sidebar Footer Security Badge */}
      <div className="admin-sidebar__footer">
        <div className="admin-sidebar__security-badge">
          <ShieldCheck size={18} />
          <div>
            <strong>Secure Admin Access</strong>
            <p>Only authorized personnel can make changes.</p>
          </div>
        </div>
        <div className="admin-sidebar__watermark">
          <span>Leadership Service Excellence</span>
          <small>v2.0.0</small>
        </div>
      </div>
    </aside>
  )
}
