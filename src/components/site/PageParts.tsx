import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconArrowLeft, IconArrowRight } from './icons'

type Stat = { value: ReactNode; label: string }

type PageHeroProps = {
  image: string
  imagePosition?: string
  crumb: string
  tag: string
  title: ReactNode
  lead: ReactNode
  stats?: Stat[]
  back?: { to: string; label: string }
  aside?: ReactNode
}

/** Dark photographic header used by every inner page. */
export function PageHero({ image, imagePosition, crumb, tag, title, lead, stats, back, aside }: PageHeroProps) {
  return (
    <section className="phero">
      <img className="bgimg" src={image} alt="" style={imagePosition ? { objectPosition: imagePosition } : undefined} />
      <div className="shade" />
      <div className="wrap">
        <div className="crumb rv">
          <BackLink to={back?.to} label={back?.label} />
          <span>{crumb}</span>
        </div>
        <span className="tag on-dark rv rv1"><i />{tag}</span>
        <h1 className="d1 rv rv2">{title}</h1>
        <p className="lead rv rv3">{lead}</p>
        {(stats || aside) && (
          <div className="hstats rv rv4">
            {stats?.map((s) => (
              <div className="glass" key={s.label}><b>{s.value}</b><span>{s.label}</span></div>
            ))}
            {aside}
          </div>
        )}
      </div>
    </section>
  )
}

/** "Back" pill: returns to the previous page when there is one, otherwise to `to`. */
export function BackLink({ to, label = 'Back' }: { to?: string; label?: string }) {
  const navigate = useNavigate()
  if (to) {
    return <Link className="back" to={to}><IconArrowLeft size={16} />{label}</Link>
  }
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'))
  return (
    <button className="back" type="button" onClick={goBack}>
      <IconArrowLeft size={16} />
      {label}
    </button>
  )
}

type SectionHeadProps = { tag: string; title: ReactNode; aside?: ReactNode; dark?: boolean; id?: string }

export function SectionHead({ tag, title, aside, dark, id }: SectionHeadProps) {
  return (
    <div className="shd" id={id}>
      <div className="l">
        <span className={`tag ${dark ? 'on-dark' : ''}`}><i />{tag}</span>
        <h2 className="d2">{title}</h2>
      </div>
      {typeof aside === 'string' ? <p>{aside}</p> : aside}
    </div>
  )
}

type PageLink = { to: string; label: string; small?: string }

/** Previous / next page band at the foot of each page. */
export function NextPrev({ prev, next, prevOnWhite }: { prev?: PageLink; next: PageLink; prevOnWhite?: boolean }) {
  return (
    <div className={`nextp ${prev ? '' : 'single'}`}>
      {prev && (
        <Link to={prev.to} className={prevOnWhite ? 'on-white' : undefined}>
          <span><small>{prev.small ?? '← Previous'}</small><b>{prev.label}</b></span>
        </Link>
      )}
      <Link to={next.to} className="go">
        <span><small>{next.small ?? 'Next →'}</small><b>{next.label}</b></span>
        <span className="round"><IconArrowRight /></span>
      </Link>
    </div>
  )
}

/** In-page section chips; highlights the section currently in view. */
export function SubNav({ items }: { items: ReadonlyArray<{ id: string; label: string }> }) {
  const [active, setActive] = useState(items[0]?.id)

  useEffect(() => {
    const onScroll = () => {
      let current = items[0]?.id
      for (const item of items) {
        const el = document.getElementById(item.id)
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.35) current = item.id
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [items])

  return (
    <div className="wrap subbar">
      <nav className="chips" aria-label="On this page">
        {items.map((item) => (
          <a key={item.id} className={`chip ${active === item.id ? 'on' : ''}`} href={`#${item.id}`}>
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
