import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Search, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePortfolio } from '../../context/PortfolioContext'
import { resolveImageUrl } from '../../utils/imageResolver'
import { adminNavGroups, dashboardItem, everyoneItem, usersItem, type AdminNavItem } from '../adminNav'

type AdminSidebarProps = {
  isOpen?: boolean
  onClose?: () => void
  onOpenSearch: () => void
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen = false, onClose, onOpenSearch }) => {
  const { logout } = useAuth()
  const { data } = usePortfolio()
  const navigate = useNavigate()

  const settings = data.siteSettings
  const sidebarLogo = resolveImageUrl(settings.logoUrl || 'image.png')
  const sidebarTitle = settings.adminSidebarTitle || 'Col. Badasu'
  const sidebarSubtitle = settings.adminSidebarSubtitle || 'PORTFOLIO ADMIN'
  const displayName = settings.adminHeaderDisplayName || 'Col. Henry K. Badasu'
  const role = settings.adminHeaderRole || 'Administrator'
  const initials = settings.adminHeaderInitials || 'CB'

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  const renderItem = (item: AdminNavItem, end = false) => {
    const Icon = item.icon
    const count = item.count?.(data)
    return (
      <NavLink key={item.to} to={item.to} end={end} className={({ isActive }) => `ad-it ${isActive ? 'on' : ''}`} onClick={onClose}>
        <Icon size={17} strokeWidth={2} />
        <span>{item.label}</span>
        {!!count && <span className="n">{count}</span>}
      </NavLink>
    )
  }

  return (
    <aside className={`ad-sb ${isOpen ? 'is-open' : ''}`} aria-label="Admin navigation">
      <div className="br">
        <img src={sidebarLogo} alt="Ghana Armed Forces crest" />
        <div>
          <b>{sidebarTitle}</b>
          <small>{sidebarSubtitle}</small>
        </div>
        <button type="button" className="ad-sb-x" onClick={onClose} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      <button type="button" className="find" onClick={onOpenSearch}>
        <Search size={15} />
        Search everything
        <kbd>Ctrl K</kbd>
      </button>

      <nav className="ad-nav">
        {renderItem(dashboardItem, true)}
        {renderItem(everyoneItem)}
        {adminNavGroups.map((group) => (
          <React.Fragment key={group.label}>
            <div className="ad-grp">{group.label}</div>
            {group.items.map((item) => renderItem(item))}
          </React.Fragment>
        ))}
        <div className="ad-grp">Account</div>
        {renderItem(usersItem)}
      </nav>

      <div className="bot">
        <div className="me">
          <span className="ad-av">{initials}</span>
          <div>
            <b>{displayName}</b>
            <small>{role}</small>
          </div>
          <button type="button" className="out" onClick={handleLogout} aria-label="Log out" title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
