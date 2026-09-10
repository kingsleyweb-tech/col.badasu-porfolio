import { SectionHeading } from '../components/SectionHeading'
import { awardCategoryLinks } from '../data/officerData'
import { PageHero } from './Biography'
import { usePortfolio } from '../context/PortfolioContext'
import { defaultAwards } from '../services/portfolioService'

export function Awards() {
  const { data } = usePortfolio()
  const awardsList = data?.awards || defaultAwards

  return (
    <>
      <PageHero eyebrow="Awards" title="Awards and Recognition" description="Formal military honors, UN peacekeeping medals, ECOWAS decorations, and official citations." />
      <nav className="category-links" aria-label="Award categories">
        <div className="container category-links__track">
          {awardCategoryLinks.map((link) => (
            <a key={link.to} href={link.to}>{link.label}</a>
          ))}
        </div>
      </nav>

      <section className="section" id="decorations">
        <div className="container">
          <SectionHeading eyebrow="Decorations" title="Medals & Official Recognition" />
          <div className="award-list">
            {awardsList.map((award, idx) => (
              <article className="award-row" key={idx}>
                <span className="award-year" style={{ fontWeight: 700, color: '#1f5c3a', display: 'inline-block', minWidth: '60px' }}>
                  {award.year}
                </span>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem' }}>{award.title}</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9375rem' }}>{award.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

