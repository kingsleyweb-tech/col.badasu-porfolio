import { useEffect, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { brandAssets, officer } from '../data/officerData'
import { usePortfolio } from '../context/PortfolioContext'
import { OptimizedImage } from './OptimizedImage'
import { resolveImageUrl } from '../utils/imageResolver'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Biography', to: '/biography' },
  { label: 'Career', to: '/career' },
  { label: 'Achievements', to: '/achievements' },
  { label: 'Awards', to: '/awards' },
  { label: 'Education', to: '/education' },
  { label: 'Gallery', to: '/gallery' }
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { data } = usePortfolio()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const customLogoUrl = data.siteSettings.logoUrl

  return (
    <header className={`site-header ${scrolled ? 'site-header--scrolled' : ''}`}>
      <nav className="nav" aria-label="Primary navigation">
        <Link className="brand" to="/">
          <span className="brand__crest">
            {customLogoUrl ? (
              <img
                src={resolveImageUrl(customLogoUrl)}
                alt="Ghana Armed Forces crest"
                style={{ width: '42px', height: '42px', objectFit: 'contain' }}
              />
            ) : (
              <OptimizedImage asset={brandAssets.gafLogo} loading="eager" sizes="58px" />
            )}
          </span>
          <span>
            <strong>{data.officer.rank || officer.rank} {data.officer.name || officer.name}</strong>
            <small>{data.officer.force || officer.force}</small>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="nav__links">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  )
}
