import { ArrowRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { images, officer } from '../data/officerData'
import { ImageSlideshow } from './ImageSlideshow'

const heroSlides = [
  {
    eyebrow: 'Personal Portfolio',
    title: `${officer.rank} ${officer.name}`,
    text: 'A personal professional profile tracing my journey of military service, leadership, and continued dedication.'
  },
  {
    eyebrow: 'Service Record',
    title: 'A Journey of Service, Leadership and Dedication',
    text: `${officer.rank} ${officer.name}'s profile brings together supplied notes on his career, peace support service, education, and professional development.`
  },
  {
    eyebrow: 'Command and Staff',
    title: 'Colonel Badasu in Command and Staff Service',
    text: 'A profile page for his documented command responsibilities, headquarters administration, and multinational peace support experience.'
  },
  {
    eyebrow: 'Peace Support',
    title: 'His Peace Support Service',
    text: 'A dedicated record of supplied United Nations and ECOWAS service references across multiple mission environments.'
  },
  {
    eyebrow: 'Institutional Service',
    title: 'Leadership Beyond the Field',
    text: 'A personal portfolio space for Colonel Badasu\'s professional work in security planning, operational coordination, training, and mentorship.'
  },
  {
    eyebrow: 'Professional Development',
    title: 'Prepared for Senior Responsibility',
    text: 'A focused view of his supplied academic, military, and professional preparation without adding unverified claims.'
  },
  {
    eyebrow: 'Gallery',
    title: 'Colonel Badasu in Pictures',
    text: 'Selected local images presented as part of his personal professional profile and service story.'
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
            <motion.span
              initial={{ opacity: 0, x: -34 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
            >
              {slide.eyebrow}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 42 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.68, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              {slide.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.58, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {slide.text}
            </motion.p>
          </motion.div>
        </AnimatePresence>
        <Link className="btn btn--primary" to="/biography">
          Explore profile <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </motion.div>
    </section>
  )
}
