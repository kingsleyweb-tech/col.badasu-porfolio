import { motion } from 'framer-motion'
import type { TimelineItem } from '../data/officerData'

type CareerTimelineProps = {
  items: TimelineItem[]
}

export function CareerTimeline({ items }: CareerTimelineProps) {
  return (
    <div className="timeline">
      {items.map((item, index) => (
        <motion.article
          className="timeline__item"
          key={`${item.period}-${item.title}`}
          initial={{ opacity: 0, x: -18 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.25), ease: 'easeOut' }}
        >
          <div className="timeline__marker" aria-hidden="true" />
          <div>
            <span>{item.period}</span>
            <h3>{item.title}</h3>
            <strong>{item.location}</strong>
            <p>{item.description}</p>
          </div>
        </motion.article>
      ))}
    </div>
  )
}
