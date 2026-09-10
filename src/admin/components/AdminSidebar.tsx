import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
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
  Layers
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const AdminSidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({ isOpen = false, onClose }) => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [contentOpen, setContentOpen] = useState(true)

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  const navItems = [
    { to: '/admin/everyone', label: 'Everyone Section', icon: Layers },
    { to: '/admin/biography', label: 'Biography', icon: UserCheck },
    { to: '/admin/career', label: 'Career', icon: Briefcase },
    { to: '/admin/awards', label: 'Awards & Decorations', icon: Award },
    { to: '/admin/education', label: 'Education & Qualifications', icon: GraduationCap },
    { to: '/admin/courses', label: 'Professional Courses', icon: BookOpen },
    { to: '/admin/languages', label: 'Languages', icon: Globe },
    { to: '/admin/leadership', label: 'Leadership / Service / Excellence', icon: Star },
    { to: '/admin/hero', label: 'Hero Section', icon: Sliders },
    { to: '/admin/gallery', label: 'Military Journey / Gallery', icon: ImageIcon },
    { to: '/admin/welcome', label: 'QR Landing Page', icon: QrCode },
    { to: '/admin/settings', label: 'Site Settings', icon: Settings }
  ]

  return (
    <aside className={`admin-sidebar ${isOpen ? 'is-open' : ''}`}>
      {/* Brand Header */}
      <div className="admin-sidebar__brand">
        <div className="admin-sidebar__crest">
          <img src="https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_100/colonel-badasu/site/root/image" alt="GAF Emblem" />
        </div>
        <div className="admin-sidebar__brand-text">
          <strong>Col. Badasu</strong>
          <span>Portfolio Admin</span>
        </div>
      </div>

      {/* Navigation Scroll Area */}
      <nav className="admin-sidebar__nav">
        {/* Main Dashboard Link */}
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => `admin-nav-item ${isActive ? 'is-active' : ''}`}
          onClick={onClose}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        {/* Content Management Group */}
        <div className="admin-nav-group">
          <button
            type="button"
            className="admin-nav-group__header"
            onClick={() => setContentOpen(!contentOpen)}
          >
            <div className="admin-nav-group__title">
              <Layers size={18} />
              <span>Content Management</span>
            </div>
            {contentOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {contentOpen && (
            <div className="admin-nav-group__children">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.to
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`admin-nav-subitem ${isActive ? 'is-active' : ''}`}
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

        {/* Account & Access Group */}
        <div className="admin-nav-divider" />

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
            <p>Only authorized personnel can make changes to the portfolio.</p>
          </div>
        </div>
        <div className="admin-sidebar__watermark">
          <span>Leadership Service Excellence</span>
          <small>v1.0.0</small>
        </div>
      </div>
    </aside>
  )
}
