import { Link } from 'react-router-dom'
import { brandAssets, officer } from '../data/officerData'

const links = ['Biography', 'Career', 'Achievements', 'Awards', 'Education', 'Gallery']

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <img src={brandAssets.gafLogo} alt="Ghana Armed Forces crest" />
          <h2>{officer.force}</h2>
          <p>{officer.motto}</p>
        </div>
        <h3>Related Links</h3>
        <nav aria-label="Footer navigation">
          {links.map((link) => (
            <Link key={link} to={`/${link.toLowerCase()}`}>
              {link}
            </Link>
          ))}
        </nav>
      </div>
      <p className="footer__copy">Copyright {new Date().getFullYear()} {officer.rank} {officer.name}. All rights reserved.</p>
    </footer>
  )
}
