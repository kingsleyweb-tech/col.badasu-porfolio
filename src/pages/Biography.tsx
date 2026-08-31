import { BackButton } from '../components/BackButton'
import { InfoCard } from '../components/InfoCard'
import { OptimizedImage } from '../components/OptimizedImage'
import { SectionHeading } from '../components/SectionHeading'
import { biographicDetails, biographyCategoryLinks, images, officer, promotionDetails } from '../data/officerData'

export function Biography() {
  return (
    <>
      <PageHero eyebrow="Biography" title={`${officer.rank} ${officer.name}`} description="Biographic form details and summary of experience from the supplied PDF content." />
      <section className="section">
        <div className="container content-layout">
          <aside className="side-nav" aria-label="Biography sections">
            {biographyCategoryLinks.map((link) => (
              <a key={link.to} href={link.to}>{link.label}</a>
            ))}
          </aside>
          <div className="text-block">
            <section id="overview">
              <SectionHeading eyebrow="Overview" title="Summary of Experience" />
              <div className="biography-overview">
                <div className="biography-overview__image">
                  <OptimizedImage asset={images[1]} alt={`${officer.rank} ${officer.name}`} sizes="(max-width: 760px) 100vw, 360px" />
                </div>
                <div>
                  {officer.biography.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </section>

            <section id="details">
              <SectionHeading eyebrow="Biographic Form" title="Personal and Service Details" />
              <div className="detail-grid">
                {biographicDetails.map((item) => (
                  <div className="detail-card" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section id="service">
              <SectionHeading eyebrow="Service Profile" title="Leadership, Operations, and Administration" />
              <p>
                The supplied profile describes responsibilities spanning Ghana Army administration, force planning, peacekeeping operations, personnel management, liaison work, logistics, combat operations, and operational coordination in multinational environments.
              </p>
              <div className="info-grid">
                <InfoCard label="Branch" title={officer.branch}>
                  <p>Branch information supplied in the biographic form.</p>
                </InfoCard>
                <InfoCard label="Academy" title={officer.academy}>
                  <p>Military academy supplied in the biographic form.</p>
                </InfoCard>
                <InfoCard label="Enlistment" title={officer.enlistment}>
                  <p>Date provided in the supplied content.</p>
                </InfoCard>
              </div>
              <div className="detail-grid detail-grid--compact">
                {promotionDetails.map((item) => (
                  <div className="detail-card" key={item.label}>
                    <span>Date of Promotion</span>
                    <strong>{item.label}: {item.value}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section id="personal">
              <SectionHeading eyebrow="Languages & Interests" title="Personal Profile Notes" />
              <div className="detail-grid">
                <div className="detail-card" id="languages">
                  <span>Spoken Languages</span>
                  <strong>{officer.spokenLanguages.join(', ')}</strong>
                </div>
                <div className="detail-card">
                  <span>Written Languages</span>
                  <strong>{officer.writtenLanguages.join(', ')}</strong>
                </div>
                <div className="detail-card">
                  <span>French Language Level</span>
                  <strong>{officer.frenchLevel}</strong>
                </div>
                <div className="detail-card" id="hobbies">
                  <span>Hobbies</span>
                  <strong>{officer.hobbies.join(', ')}</strong>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </>
  )
}

type PageHeroProps = {
  eyebrow: string
  title: string
  description: string
}

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="page-hero">
      <div className="container">
        <BackButton />
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  )
}
