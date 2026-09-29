import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { QR_PORTFOLIO_URL } from '../../config/qrConfig'
import { usePortfolio } from '../../context/PortfolioContext'
import { useOpenShare } from '../../context/ShareContext'
import { resolveImageUrl } from '../../utils/imageResolver'
import { lastName } from '../../utils/portfolioFormat'
import { navItems, useBrand } from './brand'

export function SiteFooter() {
  const { data } = usePortfolio()
  const { officer, logo, motto } = useBrand()
  const openShare = useOpenShare()
  const footer = data?.footer

  const displayRank = footer?.displayRank || officer.rank
  const displayName = footer?.displayName || officer.name
  const tagline = footer?.tagline || 'A concise professional profile of his service, leadership, education, and documented achievements.'
  const footerLogo = footer?.imageUrl ? resolveImageUrl(footer.imageUrl) : logo
  const surname = lastName(displayName)

  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="big" aria-hidden="true">{officer.shortRank} {surname}</div>
        <div className="big big-m" aria-hidden="true">{surname}</div>
        <div className="ftr-grid">
          <div>
            <Link className="brand" to="/">
              <img src={footerLogo} alt={`${officer.force} crest`} />
              <span>
                <b>{displayRank} {displayName}</b>
                <small>Personal Portfolio</small>
              </span>
            </Link>
            <p className="tagline">{tagline}</p>
          </div>
          <div>
            <div className="ttl">Portfolio</div>
            <nav aria-label="Footer">
              {navItems.slice(1).map((item) => (
                <Link key={item.to} to={item.to}>{item.label}</Link>
              ))}
            </nav>
          </div>
          <div>
            <div className="ttl">Share</div>
            <button className="qrc" type="button" onClick={openShare}>
              <QRCodeSVG value={QR_PORTFOLIO_URL} level="M" fgColor="#07150d" bgColor="#ffffff" aria-hidden="true" />
              <span>
                <b>Portfolio QR code</b>
                <small>Scan, download or print a code that opens this portfolio.</small>
              </span>
            </button>
          </div>
        </div>
        <div className="fbar">
          <span>Copyright {new Date().getFullYear()} {displayRank} {displayName}. All rights reserved.</span>
          <span>{motto}</span>
        </div>
      </div>
    </footer>
  )
}
