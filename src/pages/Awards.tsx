import { SectionHeading } from '../components/SectionHeading'
import { awardCategoryLinks, awards } from '../data/officerData'
import { PageHero } from './Biography'

export function Awards() {
  return (
    <>
      <PageHero eyebrow="Awards" title="Awards and Recognition" description="A formal awards page for medals, decorations, honours, recognitions, and commendations. Items shown are limited to supplied medal references and marked for year verification." />
      <nav className="category-links" aria-label="Award categories">
        <div className="container category-links__track">
          {awardCategoryLinks.map((link) => (
            <a key={link.to} href={link.to}>{link.label}</a>
          ))}
        </div>
      </nav>

      <section className="section" id="decorations">
        <div className="container">
          <SectionHeading eyebrow="Decorations" title="Medals Referenced in Supplied Material" />
          <div className="award-list">
            {awards.map((award) => (
              <article className="award-row" key={award.title}>
                <span>{award.year}</span>
                <div>
                  <h3>{award.title}</h3>
                  <p>{award.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
