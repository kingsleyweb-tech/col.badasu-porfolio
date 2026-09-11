import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Hero } from '../components/Hero'
import { HoverRevealCard } from '../components/HoverRevealCard'
import { InfoCard } from '../components/InfoCard'
import { OptimizedImage } from '../components/OptimizedImage'
import { SectionHeading } from '../components/SectionHeading'
import { achievements, careerHighlights, education, homeCategoryLinks, officer as defaultOfficer, operations } from '../data/officerData'
import type { ImageAsset } from '../data/officerData'
import { resolveImageUrl } from '../utils/imageResolver'
import { usePortfolio } from '../context/PortfolioContext'

export function Home() {
  const { data } = usePortfolio()
  const officer = data?.officer || defaultOfficer

  const portraitUrl = resolveImageUrl(officer.profileImageUrl || 'hero/profile-home.jpeg')
  const portraitAsset: ImageAsset = {
    src: portraitUrl,
    fallbackSrc: portraitUrl,
    thumbnailSrc: portraitUrl,
    placeholderSrc: portraitUrl,
    srcSet: `${portraitUrl} 800w`,
    alt: `${officer.rank} ${officer.name}`,
    caption: officer.name,
    width: 600,
    height: 800,
  }

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
            <OptimizedImage asset={portraitAsset} alt={`${officer.rank} ${officer.name}`} sizes="(max-width: 760px) 100vw, 520px" />
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
              {(officer.biography || defaultOfficer.biography).slice(0, 2).map((paragraph) => (
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
            {(data?.homeCareerCards?.length ? data.homeCareerCards : careerHighlights).map((item, i) => {
              const card = 'imageUrl' in item
                ? {
                    title: item.title,
                    description: item.description,
                    to: item.to,
                    category: item.category,
                    meta: item.meta,
                    image: {
                      src: resolveImageUrl(item.imageUrl) || careerHighlights[i]?.image?.src || '',
                      fallbackSrc: resolveImageUrl(item.imageUrl) || careerHighlights[i]?.image?.fallbackSrc || '',
                      thumbnailSrc: resolveImageUrl(item.imageUrl) || careerHighlights[i]?.image?.thumbnailSrc || '',
                      placeholderSrc: resolveImageUrl(item.imageUrl) || careerHighlights[i]?.image?.placeholderSrc || '',
                      srcSet: '',
                      alt: item.title,
                      caption: item.title,
                      width: 800,
                      height: 600,
                    },
                  }
                : item
              return <HoverRevealCard key={card.title} {...card} />
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Categories" title="Browse the Profile by Category" description="Direct links to the grouped biography, career, achievements, awards, education, operations, and gallery sections." />
          <div className="category-directory">
            {homeCategoryLinks.map((link) => (
              <Link key={link.to} to={link.to}>{link.label}</Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--contributions section--feature-news">
        <div className="container">
          <SectionHeading eyebrow="Achievements" title="Professional Contributions and Institutional Service" description="Selected areas of work drawn from the supplied material." />
          <div className="card-grid feature-news-grid contributions-list">
            {(data?.homeAchievementCards?.length ? data.homeAchievementCards : achievements).map((item, i) => {
              const card = 'imageUrl' in item
                ? {
                    title: item.title,
                    description: item.description,
                    to: item.to,
                    category: item.category,
                    meta: item.meta,
                    image: {
                      src: resolveImageUrl(item.imageUrl) || achievements[i]?.image?.src || '',
                      fallbackSrc: resolveImageUrl(item.imageUrl) || achievements[i]?.image?.fallbackSrc || '',
                      thumbnailSrc: resolveImageUrl(item.imageUrl) || achievements[i]?.image?.thumbnailSrc || '',
                      placeholderSrc: resolveImageUrl(item.imageUrl) || achievements[i]?.image?.placeholderSrc || '',
                      srcSet: '',
                      alt: item.title,
                      caption: item.title,
                      width: 800,
                      height: 600,
                    },
                  }
                : item
              return <HoverRevealCard key={card.title} {...card} />
            })}
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
