import React, { useEffect, useState } from 'react'
import { Search, ExternalLink, Menu, Circle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePortfolio } from '../../context/PortfolioContext'
import { AdminSearchModal } from './AdminSearchModal'

export const AdminHeader: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
  const { user, adminCredentials } = useAuth()
  const { data } = usePortfolio()
  const [showSearchModal, setShowSearchModal] = useState(false)

  // Listen for Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearchModal((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const adminEmail = user?.email || adminCredentials.email || 'admin@colonelbadasu.com'
  const fallbackInitial = adminEmail.charAt(0).toUpperCase() || 'C'

  const displayName = data.siteSettings.adminHeaderDisplayName || 'Col. Henry K. Badasu'
  const roleText = data.siteSettings.adminHeaderRole || 'Administrator'
  const initialsBadge = data.siteSettings.adminHeaderInitials || `${fallbackInitial}B`

  return (
    <header className="admin-header">
      {/* Left: Menu toggle + Search */}
      <div className="admin-header__left">
        <button
          type="button"
          className="admin-header__toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div
          className="admin-header__search"
          onClick={() => setShowSearchModal(true)}
          style={{ cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}
        >
          <Search size={16} />
          <input
            type="text"
            placeholder="Search content... (Ctrl+K)"
            readOnly
            style={{ cursor: 'pointer' }}
          />
          <span className="admin-header__search-kbd">
            Ctrl K
          </span>
        </div>
      </div>

      {/* Right: Status + View Site + Avatar */}
      <div className="admin-header__right">
        {/* Website Status Badge */}
        <div className="admin-status-badge">
          <Circle size={8} className="admin-status-badge__dot" />
          <span>Website Live</span>
        </div>

        {/* View Live Portfolio Shortcut */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-header__view-site"
        >
          <span>View Site</span>
          <ExternalLink size={14} />
        </a>

        {/* Admin Profile User Badge */}
        <div className="admin-user-pill">
          <div className="admin-user-pill__avatar">{initialsBadge}</div>
          <div className="admin-user-pill__info admin-user-pill__info--hidden-mobile">
            <strong>{displayName}</strong>
            <small>{roleText}</small>
          </div>
        </div>
      </div>

      <AdminSearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </header>
  )
}
