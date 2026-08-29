import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

type AchievementCardProps = {
  title: string
  description: string
  image: string
  to: string
}

export function AchievementCard({ title, description, image, to }: AchievementCardProps) {
  return (
    <article className="achievement-card">
      <img src={image} alt="" loading="lazy" decoding="async" />
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
        <Link className="text-link" to={to}>
          Read more <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
