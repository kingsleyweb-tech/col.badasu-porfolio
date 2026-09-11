import { Link } from 'react-router-dom'
import { brandAssets, officer as defaultOfficer } from '../data/officerData'
import { OptimizedImage } from './OptimizedImage'
import { usePortfolio } from '../context/PortfolioContext'
import { resolveImageUrl } from '../utils/imageResolver'
import type { ImageAsset } from '../data/officerData'

const links = ['Biography', 'Career', 'Achievements', 'Awards', 'Education', 'Gallery']

type FooterProps = {
  onQrModalOpen: () => void
}

export function Footer({ onQrModalOpen }: FooterProps) {
  const { data } = usePortfolio()
  const footer = data?.footer

  const displayRank = footer?.displayRank || defaultOfficer.rank
  const displayName = footer?.displayName || defaultOfficer.name
  const tagline = footer?.tagline || 'A concise professional profile of his service, leadership, education, and documented achievements.'

  // Build image asset for footer logo
  const footerImgUrl = footer?.imageUrl ? resolveImageUrl(footer.imageUrl) : ''
  const footerImageAsset: ImageAsset | null = footerImgUrl
    ? {
        src: footerImgUrl,
        fallbackSrc: footerImgUrl,
        thumbnailSrc: footerImgUrl,
        placeholderSrc: footerImgUrl,
        srcSet: '',
        alt: `${displayRank} ${displayName}`,
        caption: displayName,
        width: 220,
        height: 220,
      }
    : null

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <OptimizedImage
            asset={footerImageAsset || brandAssets.gafLogo}
            sizes="220px"
          />
          <span>Personal Portfolio</span>
          <h2>{displayRank} {displayName}</h2>
          <p>{tagline}</p>
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
      <p className="footer__copy">Copyright {new Date().getFullYear()} {displayRank} {displayName}. All rights reserved.</p>
    </footer>
  )
}
