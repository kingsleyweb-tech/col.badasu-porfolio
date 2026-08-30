import { useEffect, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { brandAssets, officer } from '../data/officerData'

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`site-header ${scrolled ? 'site-header--scrolled' : ''}`}>
      <nav className="nav" aria-label="Primary navigation">
        <Link className="brand" to="/">
          <span className="brand__crest">
            <img src={brandAssets.gafLogo} alt="Ghana Armed Forces crest" width="329" height="61" decoding="async" />
          </span>
          <span>
            <strong>{officer.rank} {officer.name}</strong>
            <small>{officer.force}</small>
          </span>
        </Link>

        {/* Desktop nav links — hidden on mobile via CSS */}
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

