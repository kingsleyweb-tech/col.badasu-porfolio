import { Link } from 'react-router-dom'
import { brandAssets, officer } from '../data/officerData'
import { OptimizedImage } from './OptimizedImage'

const links = ['Biography', 'Career', 'Achievements', 'Awards', 'Education', 'Gallery']

type FooterProps = {
  onQrModalOpen: () => void
}

export function Footer({ onQrModalOpen }: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <OptimizedImage asset={brandAssets.gafLogo} sizes="220px" />
          <span>Personal Portfolio</span>
          <h2>{officer.rank} {officer.name}</h2>
          <p>A concise professional profile of his service, leadership, education, and documented achievements.</p>
        </div>
        <h3>Quick Links</h3>
        <nav aria-label="Footer navigation">
          {links.map((link) => (
            <Link key={link} to={`/${link.toLowerCase()}`}>
              {link}
            </Link>
          ))}
          <button 
            className="footer__qr-trigger" 
            type="button" 
            onClick={onQrModalOpen}
            title="Share this portfolio"
          >
            QR Code
          </button>
        </nav>
      </div>
      <p className="footer__copy">Copyright {new Date().getFullYear()} {officer.rank} {officer.name}. All rights reserved.</p>
    </footer>
  )
}
