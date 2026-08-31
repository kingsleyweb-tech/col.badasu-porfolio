import { SectionHeading } from '../components/SectionHeading'
import { educationCategoryLinks, militaryDiplomas, professionalCertificates, professionalCourses, unitarPociCertificates } from '../data/officerData'
import { PageHero } from './Biography'

export function Education() {
  return (
    <>
      <PageHero eyebrow="Education" title="Education and Military Training" description="Professional development certificates, military diplomas, and courses attended in Ghana and foreign countries from the supplied PDF content." />
      <nav className="category-links" aria-label="Education categories">
        <div className="container category-links__track">
          {educationCategoryLinks.map((link) => (
            <a key={link.to} href={link.to}>{link.label}</a>
          ))}
        </div>
      </nav>

      <section className="section" id="professional-development">
        <div className="container">
          <SectionHeading eyebrow="Professional Development" title="Professional Development Certificates" />
          <div className="education-list">
            {professionalCertificates.map((item) => (
              <article className="education-row" key={`${item.category}-${item.title}`}>
                <span>{item.category}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p><strong>{item.institution}</strong></p>
                  <p>{item.period}</p>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tint" id="military-diplomas">
        <div className="container">
          <SectionHeading eyebrow="Military Diplomas" title="Military Diplomas and Certificates" />
          <div className="education-list">
            {militaryDiplomas.map((item) => (
              <article className="education-row" key={`${item.category}-${item.title}`}>
                <span>{item.category}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p><strong>{item.institution}</strong></p>
                  <p>{item.period}</p>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="unitar-poci">
        <div className="container">
          <SectionHeading eyebrow="UNITAR-POCI" title="Certificates of Completion" description="Individual UNITAR-POCI certificates obtained at UNOCI FHQ, Abidjan, Cote d'Ivoire, from June 2004 to July 2005." />
          <div className="education-list">
            {unitarPociCertificates.map((item) => (
              <article className="education-row" key={`${item.category}-${item.title}`}>
                <span>{item.category}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p><strong>{item.institution}</strong></p>
                  <p>{item.period}</p>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tint" id="professional-courses">
        <div className="container">
          <SectionHeading eyebrow="Professional Courses" title="Courses Attended in Ghana and Foreign Countries" />
          <div className="education-list">
            {professionalCourses.map((item) => (
              <article className="education-row" key={`${item.category}-${item.title}`}>
                <span>{item.period}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p><strong>{item.institution}</strong></p>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
