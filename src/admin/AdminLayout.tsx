import React, { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AdminSidebar } from './components/AdminSidebar'
import { AdminHeader } from './components/AdminHeader'
import { AdminSearchModal } from './components/AdminSearchModal'

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { pathname } = useLocation()

  // Ctrl+K / Cmd+K opens the search palette from anywhere in the console
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const openSearch = () => {
    setSidebarOpen(false)
    setSearchOpen(true)
  }

  return (
    <div className="ad">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onOpenSearch={openSearch} />
      {sidebarOpen && <div className="ad-scrim" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}

      <div className="ad-main">
        <AdminHeader onToggleSidebar={() => setSidebarOpen(true)} onOpenSearch={openSearch} />
        <div className="ad-content" key={pathname}>
          <Outlet />
        </div>
      </div>

      <AdminSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
