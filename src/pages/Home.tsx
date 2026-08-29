import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Hero } from '../components/Hero'
import { HoverRevealCard } from '../components/HoverRevealCard'
import { InfoCard } from '../components/InfoCard'
import { SectionHeading } from '../components/SectionHeading'
import { achievements, careerHighlights, education, images, officer, operations } from '../data/officerData'

export function Home() {
  return (
    <>
      <Hero />

      <section className="section profile-section">
        <div className="container split profile-section__grid">
          <motion.div
            className="split__image profile-section__image"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <img src={images[1].src} alt="Profile introduction placeholder" width={images[1].width} height={images[1].height} loading="lazy" decoding="async" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <span className="kicker">Profile</span>
            <h2>Meet {officer.rank} {officer.name}</h2>
            <div className="profile-section__copy">
              {officer.biography.slice(0, 2).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="split__actions">
              <Link className="btn btn--primary" to="/biography">
                Read more <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className="btn btn--secondary" to="/gallery">
                View gallery
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section section--tint section--feature-news">
        <div className="container">
          <SectionHeading eyebrow="Career" title="A Structured Record of Command, Staff, and Operational Service" description="Summary cards introduce the major professional chapters. Detailed chronology lives on the career page." />
          <div className="card-grid feature-news-grid">
            {careerHighlights.map((item) => (
              <HoverRevealCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--contributions section--feature-news">
        <div className="container">
          <SectionHeading eyebrow="Achievements" title="Professional Contributions and Institutional Service" description="Selected areas of work drawn from the supplied material." />
          <div className="card-grid feature-news-grid contributions-list">
            {achievements.map((item) => (
              <HoverRevealCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tint">
        <div className="container">
          <SectionHeading eyebrow="Education & Training" title="Academic, Military, and Professional Development" description="Professional development certificates, military diplomas, and courses from the supplied content." />
          <div className="info-grid">
            {education.slice(0, 3).map((item) => (
              <InfoCard key={item.title} label={item.category} title={item.title}>
                <p>{item.institution}</p>
                <p>{item.period}</p>
              </InfoCard>
            ))}
          </div>
          <div className="split__actions">
            <Link className="btn btn--primary" to="/education">
              View education <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Operations" title="Peace Support Experience" description="Operational experience from the supplied biographic form." />
          <div className="stat-band">
            {operations.slice(0, 4).map((operation) => (
              <div key={operation}>
                <strong>{operation.split(' - ')[0]}</strong>
                <span>{operation.split(' - ').slice(1).join(' - ')}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
