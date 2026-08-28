import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
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
  const [open, setOpen] = useState(false)
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
        <Link className="brand" to="/" onClick={() => setOpen(false)}>
          <span className="brand__crest">
            <img src={brandAssets.gafLogo} alt="Ghana Armed Forces crest" />
          </span>
          <span>
            <strong>{officer.rank} {officer.name}</strong>
            <small>{officer.force}</small>
          </span>
        </Link>

        <button className="nav__toggle" type="button" aria-expanded={open} aria-label="Toggle menu" onClick={() => setOpen((value) => !value)}>
          {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>

        <div className={`nav__links ${open ? 'is-open' : ''}`}>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  )
}
