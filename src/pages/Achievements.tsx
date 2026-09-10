import { AchievementCard } from '../components/AchievementCard'
import { InfoCard } from '../components/InfoCard'
import { SectionHeading } from '../components/SectionHeading'
import { achievementCategoryLinks } from '../data/officerData'
import { usePortfolio } from '../context/PortfolioContext'
import { PageHero } from './Biography'

export function Achievements() {
  const { data } = usePortfolio()

  const achievements = data.achievements || []
  const volunteerExperience = data.volunteerExperience || []
  const recentAssignments = data.recentAssignments || []

  return (
    <>
      <PageHero eyebrow="Achievements" title="Professional Achievements" description="A refined presentation of major contributions in peacekeeping, security management, strategic leadership, mentorship, and regional cooperation." />
      <nav className="category-links" aria-label="Achievement categories">
        <div className="container category-links__track">
          {achievementCategoryLinks.map((link) => (
            <a key={link.to} href={link.to}>{link.label}</a>
          ))}
        </div>
      </nav>

      <section className="section" id="highlights">
        <div className="container">
          <SectionHeading eyebrow="Highlights" title="Selected Areas of Contribution" />
          <div className="achievement-list">
            {achievements.map((achievement, idx) => (
              <AchievementCard
                key={achievement.title + idx}
                title={achievement.title}
                description={achievement.description}
                category={achievement.category}
                to={achievement.to}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tint" id="volunteer-service">
        <div className="container">
          <SectionHeading eyebrow="Volunteer Experience" title="Community and Volunteer Service" />
          <div className="work-list">
            {volunteerExperience.map((item, idx) => (
              <article className="work-card" key={`${item.location}-${idx}`}>
                <span>{item.period}</span>
                <h3>{item.location}</h3>
                {item.description.map((paragraph, pIdx) => (
                  <p key={pIdx}>{paragraph}</p>
                ))}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="regional-service">
        <div className="container">
          <SectionHeading eyebrow="Regional Service" title="Boundary and Cross-Border Cooperation" />
          <div className="info-grid">
            {recentAssignments.slice(8).map((assignment, idx) => (
              <InfoCard key={idx} title={assignment}>
                <p>Listed under last assignments during the previous five years.</p>
              </InfoCard>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
