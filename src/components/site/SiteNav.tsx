import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useOpenShare } from '../../context/ShareContext'
import { shortName } from '../../utils/portfolioFormat'
import { navItems, useBrand } from './brand'
import { IconClose, IconMenu, IconQr } from './icons'

const isActive = (pathname: string, to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))

export function SiteNav() {
  const { pathname } = useLocation()
  const { officer, logo, motto } = useBrand()
  const openShare = useOpenShare()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const fullName = `${officer.shortRank} ${officer.name}`
  const compactName = shortName(officer.shortRank, officer.name)

  const brand = (
    <Link className="brand" to="/" onClick={() => setMenuOpen(false)}>
      <img src={logo} alt={`${officer.force} crest`} />
      <span>
        <b className="b-full">{fullName}</b>
        <b className="b-short">{compactName}</b>
        <small>{officer.force}</small>
      </span>
    </Link>
  )

  return (
    <>
      <div className={`nav-float ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="wrap">
          <div className={`nav-bar ${scrolled ? 'light' : ''}`}>
            {brand}
            <nav className="links" aria-label="Primary">
              {navItems.map((item) => (
                <Link key={item.to} to={item.to} className={isActive(pathname, item.to) ? 'on' : undefined} aria-current={isActive(pathname, item.to) ? 'page' : undefined}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <button className="nav-cta" type="button" onClick={openShare}>
              <IconQr size={18} />
              Share
            </button>
            <div className="nav-acts">
              <button className="nav-ib" type="button" onClick={openShare} aria-label="Share this portfolio (QR code)">
                <IconQr size={18} />
              </button>
              <button className="nav-ib menu" type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}>
                <IconMenu size={20} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="mm" role="dialog" aria-modal="true" aria-label="Site menu">
          <div className="top">
            <Link className="brand" to="/" onClick={() => setMenuOpen(false)}>
              <img src={logo} alt={`${officer.force} crest`} />
              <span>
                <b>{compactName}</b>
                <small>{officer.force}</small>
              </span>
            </Link>
            <button className="x" type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" autoFocus>
              <IconClose size={20} strokeWidth={2.2} />
            </button>
          </div>
          <nav className="lk" aria-label="Mobile navigation">
            {navItems.map((item, i) => (
              <Link key={item.to} to={item.to} className={isActive(pathname, item.to) ? 'on' : undefined} onClick={() => setMenuOpen(false)}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                <b>{item.label}</b>
              </Link>
            ))}
          </nav>
          <div className="bot">
            <button
              className="btn btn-gold"
              type="button"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                setMenuOpen(false)
                openShare()
              }}
            >
              <IconQr size={18} />
              Share portfolio QR code
            </button>
            <p>{motto.toUpperCase()}</p>
          </div>
        </div>
      )}
    </>
  )
}
