import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

type InfoCardProps = {
  label?: string
  title: string
  children: ReactNode
}

export function InfoCard({ label, title, children }: InfoCardProps) {
  return (
    <motion.article
      className="info-card"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {label && <span>{label}</span>}
      <h3>{title}</h3>
      <div>{children}</div>
    </motion.article>
  )
}
