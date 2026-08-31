import { CareerTimeline } from '../components/CareerTimeline'
import { InfoCard } from '../components/InfoCard'
import { SectionHeading } from '../components/SectionHeading'
import { careerCategoryLinks, operations, recentAssignments, timeline, workHistory } from '../data/officerData'
import { PageHero } from './Biography'

export function Career() {
  return (
    <>
      <PageHero eyebrow="Career" title="Military Career History" description="A chronological record of appointments, command responsibilities, operational service, and senior staff duties from the supplied PDF content." />
      <nav className="category-links" aria-label="Career categories">
        <div className="container category-links__track">
          {careerCategoryLinks.map((link) => (
            <a key={link.to} href={link.to}>{link.label}</a>
          ))}
        </div>
      </nav>

      <section className="section" id="timeline">
        <div className="container">
          <SectionHeading eyebrow="Chronology" title="Career Timeline" />
          <CareerTimeline items={timeline} />
        </div>
      </section>

      <section className="section section--tint" id="work-history">
        <div className="container">
          <SectionHeading eyebrow="Work History" title="Detailed Work History" />
          <div className="work-list">
            {workHistory.map((item) => (
              <article className="work-card" key={`${item.title}-${item.period}`}>
                <span>{item.period}</span>
                <h3>{item.title}</h3>
                <strong>{item.location}</strong>
                {item.description.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="recent-assignments">
        <div className="container">
          <SectionHeading eyebrow="Recent Assignments" title="Last Assignments During the Previous Five Years" />
          <div className="info-grid">
            {recentAssignments.map((assignment) => (
              <InfoCard key={assignment} title={assignment}>
                <p>Listed in the supplied biographic form.</p>
              </InfoCard>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tint" id="operational-experience">
        <div className="container">
          <SectionHeading eyebrow="Operational Experience" title="United Nations Peacekeeping Operations" />
          <div className="info-grid">
            {operations.map((operation) => (
              <InfoCard key={operation} title={operation}>
                <p>Operational experience listed in the supplied biographic form.</p>
              </InfoCard>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
