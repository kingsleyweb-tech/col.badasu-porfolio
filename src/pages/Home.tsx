import { Fragment, useCallback, useEffect, useState, type SyntheticEvent } from 'react'
import { Link } from 'react-router-dom'
import { usePortfolio } from '../context/PortfolioContext'
import {
  achievements as defaultAchievements,
  careerHighlights,
  homeCategoryLinks,
  images as defaultSlideImages,
  officer as defaultOfficer,
  operations as defaultOperations,
} from '../data/officerData'
import { siteImages } from '../data/siteImages'
import { IconArrowRight, IconChevronDown, IconChevronLeft, IconChevronRight } from '../components/site/icons'
import { SectionHead } from '../components/site/PageParts'
import { mottoDots } from '../components/site/brand'
import { resolveImageUrl } from '../utils/imageResolver'
import { pad2, parseOperation, shortPeriod, splitYear } from '../utils/portfolioFormat'

const SLIDE_MS = 7000
const INDEX_ORDER = ['biography', 'career', 'education', 'achievements', 'awards', 'gallery']

/** Replace a card photo that fails to load with a local one. */
const swapToFallback = (e: SyntheticEvent<HTMLImageElement>) => {
  if (e.currentTarget.src !== siteImages.meeting) e.currentTarget.src = siteImages.meeting
}

type HomeCardView = { title: string; description: string; category: string; to: string; image: string }

export function Home() {
  const { data } = usePortfolio()
  const officer = { ...defaultOfficer, ...data?.officer }
  const hero = data?.hero
  const operations = data?.operations?.length ? data.operations : defaultOperations
  // Hero heading comes from Admin › Hero Section; the words after the second one render in gold
  const titleWords = (hero?.title || `${officer.rank} ${officer.name}`).trim().split(/\s+/)
  const heroTitle = { lead: titleWords.slice(0, 2).join(' '), rest: titleWords.slice(2).join(' ') }

  // ── Hero slideshow ──────────────────────────────────────────────
  const slides = hero?.slides?.length
    ? hero.slides.map((s, i) => ({ src: resolveImageUrl(typeof s === 'string' ? s : s.url), alt: `${officer.rank} ${officer.name} — photograph ${i + 1}` }))
    : defaultSlideImages.map((img) => ({ src: img.src, alt: img.alt }))

  const captions = [
    hero?.personalIntro || 'A personal professional profile tracing my journey of military service, leadership, and continued dedication.',
    'A Journey of Service, Leadership and Dedication',
    `${officer.name} in Command and Staff Service`,
    'His Peace Support Service',
    'Leadership Beyond the Field',
    'Prepared for Senior Responsibility',
    `${officer.rank} ${officer.name} in Pictures`,
  ]

  const [active, setActive] = useState(0)
  const total = slides.length
  const go = useCallback((i: number) => setActive(((i % total) + total) % total), [total])

  useEffect(() => {
    if (total < 2) return
    const timer = window.setTimeout(() => go(active + 1), SLIDE_MS)
    return () => window.clearTimeout(timer)
  }, [active, total, go])

  // ── Content ────────────────────────────────────────────────────
  const careerCards: HomeCardView[] = (data?.homeCareerCards?.length ? data.homeCareerCards : careerHighlights).map((c, i) => ({
    title: c.title,
    description: c.description,
    category: c.category ?? '',
    to: c.to,
    image: ('imageUrl' in c && c.imageUrl ? resolveImageUrl(c.imageUrl) : '') || careerHighlights[i]?.image.src || siteImages.ecowasChamber,
  }))

  const achievementCards: HomeCardView[] = (data?.homeAchievementCards?.length ? data.homeAchievementCards : defaultAchievements).map((c, i) => ({
    title: c.title,
    description: c.description,
    category: c.category ?? '',
    to: c.to,
    image: ('imageUrl' in c && c.imageUrl ? resolveImageUrl(c.imageUrl) : '') || defaultAchievements[i]?.image.src || siteImages.ecowasChamber,
  }))

  const courses = data?.professionalCourses ?? []
  const qualifications =
    (data?.professionalCertificates?.length ?? 0) + (data?.militaryDiplomas?.length ?? 0) + (data?.unitarPociCertificates?.length ?? 0) + courses.length
  const languages = data?.languages?.spoken?.length ? data.languages.spoken : officer.spokenLanguages
  const enlisted = splitYear(officer.enlistment)
  const biography = officer.biography?.length ? officer.biography : defaultOfficer.biography

  const indexGroups = INDEX_ORDER.map((key) => ({
    key,
    title: key.charAt(0).toUpperCase() + key.slice(1),
    links: homeCategoryLinks.filter((l) => l.to.split(/[/#]/)[1] === key),
  })).filter((g) => g.links.length)
  const [openGroup, setOpenGroup] = useState<string | null>(INDEX_ORDER[0])

  const mosaic = [siteImages.ecowasMeeting, siteImages.television, siteImages.graduation, siteImages.boundary, siteImages.officersGroup]

  return (
    <div className="pg-home">
      <section className="hero" aria-roledescription="carousel" aria-label="Portfolio highlights">
        {slides.map((s, i) => (
          <div key={s.src + i} className={`slide ${i === active ? 'on' : ''}`} aria-hidden={i !== active}>
            <img src={s.src} alt={s.alt} style={i === 0 ? { objectPosition: '70% 20%' } : undefined} loading={i === 0 ? 'eager' : 'lazy'} />
          </div>
        ))}
        <div className="shade" />

        <div className="wrap">
          <span className="tag on-dark rv"><i />Official Portfolio · {officer.force}</span>
          <h1 className="d1 rv rv1">
            {heroTitle.lead}
            {heroTitle.rest && (<><br /><em>{heroTitle.rest}</em></>)}
          </h1>
          <p className="lead rv rv2">{hero?.supportingText || 'Senior Army Officer of the Ghana Armed Forces specializing in UN Peacekeeping, International Security, Crisis Management & Strategic Operations.'}</p>
          <div className="ctas rv rv3">
            <Link className="btn btn-white" to="/biography">
              Explore profile <span className="ar"><IconArrowRight size={16} strokeWidth={2.2} /></span>
            </Link>
            <Link className="btn btn-line-w" to="/career">Service record</Link>
          </div>
          <div className="prog" aria-label="Choose slide">
            {slides.map((_, i) => (
              <button key={i} type="button" className={i === active ? 'on' : undefined} onClick={() => go(i)} aria-label={`Show slide ${i + 1}`} />
            ))}
          </div>
        </div>

        <div className="cap glass rv rv4">
          <div className="cap-h">
            <span>Personal Portfolio · {pad2(active + 1)} / {pad2(total)}</span>
            <div className="arrows">
              <button type="button" aria-label="Previous slide" onClick={() => go(active - 1)}><IconChevronLeft size={16} /></button>
              <button type="button" aria-label="Next slide" onClick={() => go(active + 1)}><IconChevronRight size={16} /></button>
            </div>
          </div>
          <p aria-live="polite">{captions[active % captions.length]}</p>
          <div className="cap-bar"><i key={active} /></div>
        </div>
        <div className="scroll-cue" aria-hidden="true">SCROLL<i /></div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="run">
          {[0, 1].map((copy) => (
            <Fragment key={copy}>
              {operations.map((op) => <span key={op}>{parseOperation(op).code}</span>)}
              <span>{mottoDots(officer.motto)}</span>
            </Fragment>
          ))}
        </div>
      </div>

      <section className="sec">
        <div className="wrap intro">
          <div className="portrait">
            <div className="img">
              <img src={resolveImageUrl(officer.profileImageUrl) || siteImages.graduationProfile} alt={`${officer.rank} ${officer.name}`} />
            </div>
            <div className="glass"><b>{enlisted.year}</b><span>Enlisted{enlisted.rest ? ` · ${enlisted.rest}` : ''}</span></div>
            <div className="seal">{officer.academy}</div>
          </div>
          <div>
            <span className="tag"><i />Profile</span>
            <h2 className="d2">Meet {officer.rank}<br />{officer.name}</h2>
            <p className="lede">{biography[0]}</p>
            {biography[1] && <p className="txt" style={{ marginTop: 18 }}>{biography[1]}</p>}
            <div className="stats4">
              <div><b>{operations.length}</b><span>Missions</span></div>
              <div><b>{data?.workHistory?.length ?? 0}</b><span>Appointments</span></div>
              <div><b>{languages.length}</b><span>Languages</span></div>
              <div><b>{qualifications}</b><span>Qualifications</span></div>
            </div>
            <div className="btn-row">
              <Link className="btn btn-green" to="/biography">Read biography <span className="ar"><IconArrowRight size={16} strokeWidth={2.2} /></span></Link>
              <Link className="btn btn-line" to="/gallery">View gallery</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="sec surface">
        <div className="wrap">
          <SectionHead
            tag="Career"
            title={<>Command, staff &amp;<br />operational service</>}
            aside="The major chapters of his career at a glance. The full chronology, with every appointment and its duties, lives on the career page."
          />
          <div className="bento">
            {careerCards.slice(0, 4).map((card, i) => (
              <Link key={card.title + i} className={`card c${i + 1}`} to={card.to || '/career'}>
                <div className="img"><img src={card.image} alt="" loading="lazy" onError={swapToFallback} /><div className="ov" /></div>
                <div className="ovtxt">
                  <div>
                    {card.category && <span className="pill">{card.category}</span>}
                    <h3 className="h3">{card.title}</h3>
                    {i < 2 && <p className="desc">{card.description}</p>}
                  </div>
                  {i < 2 && <span className="round"><IconArrowRight /></span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="sec dark">
        <div className="wrap">
          <SectionHead
            dark
            tag="Operations"
            title={<>{operations.length === 7 ? 'Seven' : operations.length} peace<br />support missions</>}
            aside="United Nations and ECOWAS deployments across West, Central and East Africa and Southern Lebanon."
          />
          <div className="mgrid">
            {operations.map((op) => {
              const o = parseOperation(op)
              return (
                <div className="mc" key={op}>
                  <b>{o.code}</b>
                  <p>{o.name}</p>
                  {o.deployment && (
                    <span className="dep">
                      {Array.from({ length: o.count }, (_, i) => <i key={i} />)}
                      &nbsp;{o.deployment}
                    </span>
                  )}
                </div>
              )
            })}
            <Link className="mc all" to="/career#operational-experience">
              <b>Full operational record</b>
              <span className="round"><IconArrowRight /></span>
            </Link>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <SectionHead
            tag="Achievements"
            title={<>Professional<br />contributions</>}
            aside={<Link className="btn btn-line" to="/achievements">All achievements</Link>}
          />
          <div className="ach">
            {achievementCards.slice(0, 4).map((card, i) => (
              <Link key={card.title + i} className="card" to={card.to || '/achievements'}>
                <div className="img"><img src={card.image} alt="" loading="lazy" onError={swapToFallback} /></div>
                <div>
                  <span className="n">{pad2(i + 1)} · {card.category}</span>
                  <h3 className="h3">{card.title}</h3>
                  <p className="sm">{card.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingBottom: 'clamp(72px, 9vw, 120px)' }}>
        <div className="wrap">
          <div className="edu-band">
            <div>
              <span className="tag on-dark"><i />Education &amp; Training</span>
              <h2 className="d2">Academic, military &amp; professional development</h2>
              <p className="lead">Professional development certificates, military diplomas, UNITAR-POCI certificates and courses attended in Ghana and abroad.</p>
              <Link className="btn btn-gold" to="/education" style={{ marginTop: 32 }}>View education</Link>
            </div>
            <div>
              {courses.slice(0, 3).map((c) => (
                <div className="erow" key={c.title}>
                  <span>{shortPeriod(c.period)}</span>
                  <div><b>{c.title}</b><small>{c.institution}</small></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sec surface">
        <div className="wrap">
          <SectionHead tag="Profile Index" title="Browse by category" aside="Every section of the portfolio, grouped by page. Each link opens the exact section." />
          <div className="idx">
            {indexGroups.map((g) => {
              const open = openGroup === g.key
              return (
                <div className={`ix ${open ? 'open' : ''}`} key={g.key}>
                  <button className="ix-h" type="button" aria-expanded={open} onClick={() => setOpenGroup(open ? null : g.key)}>
                    <b>{g.title}</b>
                    <span className="pill g">{g.links.length}</span>
                    <IconChevronDown size={18} strokeWidth={2.2} />
                  </button>
                  <div className="links-l">
                    {g.links.map((l) => (
                      <Link className="l" key={l.to} to={l.to}>{l.label}<span aria-hidden="true">→</span></Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <SectionHead
            tag="Gallery"
            title={<>His service<br />in pictures</>}
            aside={<Link className="btn btn-green" to="/gallery">Open the gallery <span className="ar"><IconArrowRight size={16} strokeWidth={2.2} /></span></Link>}
          />
          <Link className="mos" to="/gallery" aria-label="Open the gallery">
            {mosaic.map((src) => (
              <div className="img" key={src}><img src={src} alt="" loading="lazy" /></div>
            ))}
          </Link>
        </div>
      </section>
    </div>
  )
}
