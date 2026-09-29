import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, Menu, Search } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'
import { brandAssets } from '../../data/officerData'
import { resolveImageUrl } from '../../utils/imageResolver'
import { findAdminNavItem } from '../adminNav'

type AdminHeaderProps = {
  onToggleSidebar: () => void
  onOpenSearch: () => void
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar, onOpenSearch }) => {
  const { pathname } = useLocation()
  const { data } = usePortfolio()
  const { item, group } = findAdminNavItem(pathname)
  const isDashboard = pathname === '/admin' || pathname === '/admin/'

  return (
    <header className="ad-tb">
      {/* Phone-only brand bar */}
      <div className="ad-tb-brand">
        <img src={resolveImageUrl(data.siteSettings.logoUrl || brandAssets.gafLogo.src)} alt="Ghana Armed Forces crest" />
        <div>
          <b>{data.siteSettings.adminSidebarTitle || 'Col. Badasu'}</b>
          <small>ADMIN</small>
        </div>
      </div>

      <nav className="crumbs" aria-label="Breadcrumb">
        {isDashboard ? <span>Admin</span> : <Link to="/admin">Admin</Link>}
        {group && (<><span>/</span><span>{group}</span></>)}
        {!isDashboard && (<><span>/</span><b>{item.label}</b></>)}
        {isDashboard && (<><span>/</span><b>Dashboard</b></>)}
      </nav>

      <div className="r">
        <span className="ad-live"><i />Website live</span>
        <a className="ad-b l" href={item.publicPath} target="_blank" rel="noopener noreferrer">
          View {item.publicLabel}
          <ArrowUpRight size={14} strokeWidth={2.2} />
        </a>
        <button type="button" className="ad-tb-ib" onClick={onOpenSearch} aria-label="Search">
          <Search size={17} />
        </button>
        <button type="button" className="ad-tb-ib menu" onClick={onToggleSidebar} aria-label="Open navigation menu">
          <Menu size={18} strokeWidth={2.2} />
        </button>
      </div>
    </header>
  )
}
