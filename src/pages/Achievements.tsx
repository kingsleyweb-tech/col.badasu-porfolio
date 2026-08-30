import { AchievementCard } from '../components/AchievementCard'
import { InfoCard } from '../components/InfoCard'
import { SectionHeading } from '../components/SectionHeading'
import { achievements, images, recentAssignments, volunteerExperience } from '../data/officerData'
import { PageHero } from './Biography'

export function Achievements() {
  return (
    <>
      <PageHero eyebrow="Achievements" title="Professional Achievements" description="A refined presentation of major contributions in peacekeeping, security management, strategic leadership, mentorship, and regional cooperation." />
      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Highlights" title="Selected Areas of Contribution" />
          <div className="achievement-list">
            {achievements.map((achievement, index) => (
              <AchievementCard key={achievement.title} {...achievement} image={images[index % images.length]} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tint">
        <div className="container">
          <SectionHeading eyebrow="Volunteer Experience" title="Community and Volunteer Service" />
          <div className="work-list">
            {volunteerExperience.map((item) => (
              <article className="work-card" key={`${item.location}-${item.period}`}>
                <span>{item.period}</span>
                <h3>{item.location}</h3>
                {item.description.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Regional Service" title="Boundary and Cross-Border Cooperation" />
          <div className="info-grid">
            {recentAssignments.slice(8).map((assignment) => (
              <InfoCard key={assignment} title={assignment}>
                <p>Listed under last assignments during the previous five years.</p>
              </InfoCard>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
