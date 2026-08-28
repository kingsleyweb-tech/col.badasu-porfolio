import { SectionHeading } from '../components/SectionHeading'
import { awards } from '../data/officerData'
import { PageHero } from './Biography'

export function Awards() {
  return (
    <>
      <PageHero eyebrow="Awards" title="Awards and Recognition" description="A formal awards page for medals, decorations, honours, recognitions, and commendations. Items shown are limited to supplied medal references and marked for year verification." />
      <section className="section">
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
