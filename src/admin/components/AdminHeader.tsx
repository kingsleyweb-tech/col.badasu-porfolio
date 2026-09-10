import React, { useEffect, useState } from 'react'
import { Search, ExternalLink, Menu, Circle, QrCode } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { QrModal } from '../../components/QrModal'

export const AdminHeader: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
  const { user, isDemoAdmin } = useAuth()
  const [timeStr, setTimeStr] = useState('')
  const [showQrModal, setShowQrModal] = useState(false)

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }
      setTimeStr(now.toLocaleDateString('en-GB', options).replace(',', ' |'))
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])

  const adminEmail = user?.email || (isDemoAdmin ? 'admin@colonelbadasu.com' : 'Administrator')
  const initial = adminEmail.charAt(0).toUpperCase() || 'C'

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <button
          type="button"
          className="admin-header__toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div className="admin-header__search">
          <Search size={16} />
          <input type="text" placeholder="Search sections, pages or settings..." />
        </div>
      </div>

      <div className="admin-header__right">
        {/* Live Date/Time */}
        <div className="admin-header__date">{timeStr}</div>

        {/* Website Status Badge */}
        <div className="admin-status-badge">
          <Circle size={8} className="admin-status-badge__dot" />
          <span>Website Live</span>
        </div>

        {/* QR Code Quick Action */}
        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          className="admin-header__view-site"
          title="View Scannable QR Code"
          style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', cursor: 'pointer' }}
        >
          <QrCode size={15} />
          <span>QR Code</span>
        </button>

        {/* View Live Portfolio Shortcut */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-header__view-site"
        >
          <span>View Portfolio</span>
          <ExternalLink size={14} />
        </a>

        {/* Admin Profile User Badge */}
        <div className="admin-user-pill">
          <div className="admin-user-pill__avatar">{initial}B</div>
          <div className="admin-user-pill__info">
            <strong>Col. Henry K. Badasu</strong>
            <small>Administrator</small>
          </div>
        </div>
      </div>

      {showQrModal && (
        <QrModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} />
      )}
    </header>
  )
}

