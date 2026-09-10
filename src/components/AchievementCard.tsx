import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ImageAsset } from '../data/officerData'
import { OptimizedImage } from './OptimizedImage'

type AchievementCardProps = {
  title: string
  description: string
  image?: ImageAsset
  category?: string
  to?: string
}

export function AchievementCard({ title, description, image, category, to }: AchievementCardProps) {
  return (
    <article className="achievement-card">
      {image && <OptimizedImage asset={image} alt="" variant="thumbnail" sizes="(max-width: 760px) 100vw, 230px" />}
      <div>
        {category && <span className="badge badge--gold" style={{ display: 'inline-block', marginBottom: '6px' }}>{category}</span>}
        <h3>{title}</h3>
        <p>{description}</p>
        {to && (
          <Link className="text-link" to={to}>
            Read more <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  )
}
