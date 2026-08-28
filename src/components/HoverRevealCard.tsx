import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

type HoverRevealCardProps = {
  image: string
  title: string
  description: string
  to: string
  category?: string
  meta?: string
}

export function HoverRevealCard({ image, title, description, to, category, meta }: HoverRevealCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <motion.article
      className={`reveal-card ${open ? 'is-open' : ''}`}
      onClick={() => setOpen((value) => !value)}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <img src={image} alt="" loading="lazy" />
      <div className="reveal-card__shade" aria-hidden="true" />
      <div className="reveal-card__content">
        {category ? <span className="reveal-card__eyebrow">{category}</span> : null}
        {meta ? <span className="reveal-card__meta">{meta}</span> : null}
        <h3>{title}</h3>
        <p>{description}</p>
        <Link className="text-link" to={to} onClick={(event) => event.stopPropagation()}>
          Read more <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </motion.article>
  )
}
