import { ArrowRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { images, officer } from '../data/officerData'
import { ImageSlideshow } from './ImageSlideshow'

const heroSlides = [
  {
    eyebrow: 'Senior Army Officer',
    title: `${officer.rank} ${officer.name}`,
    text: officer.motto
  },
  {
    eyebrow: officer.force,
    title: 'Service Defined by Leadership',
    text: officer.shortBio
  },
  {
    eyebrow: 'Command and Staff',
    title: 'Operational Leadership Across Missions',
    text: 'A career shaped by command responsibility, headquarters administration, and multinational peace support operations.'
  },
  {
    eyebrow: 'Peace Support',
    title: 'United Nations and ECOWAS Service',
    text: 'Experience across Sierra Leone, Liberia, Cote d\'Ivoire, DR Congo, Lebanon, South Sudan, and The Gambia.'
  },
  {
    eyebrow: 'Institutional Service',
    title: 'Risk, Crisis, and Security Management',
    text: 'Professional work spanning security planning, operational coordination, training, mentoring, and public service.'
  },
  {
    eyebrow: 'Professional Development',
    title: 'Strategic Training and Education',
    text: 'Academic, military, and professional preparation for senior responsibilities in complex security environments.'
  },
  {
    eyebrow: 'Gallery',
    title: 'A Visual Record of Service',
    text: 'Selected moments from ceremonial, operational, training, and professional engagements.'
  }
]

export function Hero() {
  const [active, setActive] = useState(0)
  const slide = heroSlides[active] ?? heroSlides[0]

  return (
    <section className="hero-shell">
      <ImageSlideshow images={images} active={active} onActiveChange={setActive} />
      <div className="hero-shell__overlay" aria-hidden="true" />
      <motion.div
        className="hero-shell__content"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            className="hero-shell__copy"
            key={active}
            initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -24, filter: 'blur(8px)' }}
            transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
          >
            <span>{slide.eyebrow}</span>
            <h1>{slide.title}</h1>
            <p>{slide.text}</p>
          </motion.div>
        </AnimatePresence>
        <Link className="btn btn--primary" to="/biography">
          Explore profile <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </motion.div>
    </section>
  )
}
