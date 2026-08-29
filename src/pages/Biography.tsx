import { BackButton } from '../components/BackButton'
import { InfoCard } from '../components/InfoCard'
import { SectionHeading } from '../components/SectionHeading'
import { biographicDetails, images, officer, promotionDetails } from '../data/officerData'

export function Biography() {
  return (
    <>
      <PageHero eyebrow="Biography" title={`${officer.rank} ${officer.name}`} description="Biographic form details and summary of experience from the supplied PDF content." />
      <section className="section">
        <div className="container content-layout">
          <aside className="side-nav" aria-label="Biography sections">
            <a href="#overview">Overview</a>
            <a href="#details">Biographic Form</a>
            <a href="#service">Service Profile</a>
            <a href="#personal">Languages</a>
          </aside>
          <div className="text-block">
            <section id="overview">
              <SectionHeading eyebrow="Overview" title="Summary of Experience" />
              <div className="biography-overview">
                <div className="biography-overview__image">
                  <img src={images[1].src} alt={`${officer.rank} ${officer.name}`} width={images[1].width} height={images[1].height} loading="lazy" decoding="async" />
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
              <p><strong>Spoken and written languages:</strong> {officer.languages.join(', ')}.</p>
              <p><strong>French language level:</strong> {officer.frenchLevel}.</p>
              <p><strong>Interests:</strong> {officer.hobbies.join(', ')}.</p>
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
