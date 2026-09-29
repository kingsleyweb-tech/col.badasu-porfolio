import { Link } from 'react-router-dom'
import { usePortfolio } from '../context/PortfolioContext'
import { achievements as defaultAchievements, recentAssignments as defaultAssignments, volunteerExperience as defaultVolunteer } from '../data/officerData'
import { siteImages } from '../data/siteImages'
import type { AchievementCardItem, VolunteerItem } from '../services/portfolioService'
import { IconArrowRight, IconCross, IconMap, IconPeople } from '../components/site/icons'
import { NextPrev, PageHero, SectionHead, SubNav } from '../components/site/PageParts'
import { resolveImageUrl } from '../utils/imageResolver'
import { pad2 } from '../utils/portfolioFormat'

const SECTIONS = [
  { id: 'highlights', label: 'Highlights' },
  { id: 'volunteer-service', label: 'Volunteer Service' },
  { id: 'regional-service', label: 'Regional Service' },
] as const

export function Achievements() {
  const { data } = usePortfolio()
  const achievements: AchievementCardItem[] = data?.achievements?.length
    ? data.achievements
    : defaultAchievements.map(({ title, description, category, to }) => ({ title, description, category: category ?? '', to }))
  const volunteer: VolunteerItem[] = data?.volunteerExperience?.length ? data.volunteerExperience : defaultVolunteer
  const regional = (data?.recentAssignments?.length ? data.recentAssignments : defaultAssignments).slice(8)

  const imageFor = (i: number) =>
    resolveImageUrl(data?.homeAchievementCards?.[i]?.imageUrl) || defaultAchievements[i]?.image.src || siteImages.ecowasChamber

  const regionalIcon = (i: number) => {
    if (i === 0) return <IconCross size={26} strokeWidth={1.8} />
    if (i === regional.length - 1) return <IconPeople size={26} strokeWidth={1.8} />
    return <IconMap size={26} strokeWidth={1.8} />
  }

  return (
    <div className="pg-ach">
      <PageHero
        image={siteImages.officersGroup}
        crumb="Home / Achievements"
        tag="03 — Achievements"
        title={<>Professional<br />achievements</>}
        lead="A refined presentation of major contributions in peacekeeping, security management, strategic leadership, mentorship, and regional cooperation."
        stats={[
          { value: achievements.length, label: 'Highlights' },
          { value: volunteer.length, label: 'Volunteer roles' },
          { value: regional.length, label: 'Regional roles' },
        ]}
      />

      <SubNav items={SECTIONS} />

      <section className="sec" id="highlights" style={{ paddingTop: 80 }}>
        <div className="wrap">
          <SectionHead
            tag="Highlights"
            title={<>Selected areas<br />of contribution</>}
            aside="Areas that define his professional record. Each opens the part of the portfolio that documents it."
          />
          <div className="hl">
            {achievements.map((a, i) => (
              <Link className="card" to={a.to || '/career'} key={a.title + i}>
                <div className="img"><img src={imageFor(i)} alt="" loading="lazy" onError={(e) => { if (e.currentTarget.src !== siteImages.meeting) e.currentTarget.src = siteImages.meeting }} /><div className="ov" /></div>
                <span className="n">{pad2(i + 1)}</span>
                <div className="ovtxt">
                  <div>
                    {a.category && <span className="pill">{a.category}</span>}
                    <h3>{a.title}</h3>
                    <p>{a.description}</p>
                  </div>
                  <span className="round"><IconArrowRight /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="sec surface" id="volunteer-service">
        <div className="wrap">
          <SectionHead
            tag="Volunteer Experience"
            title={<>Community &amp;<br />volunteer service</>}
            aside="Service beyond the mandate: community work in South Sudan, Cote d'Ivoire and Ghana."
          />
          <div className="vol">
            {volunteer.map((v, i) => (
              <article className="vc" key={v.location + i}>
                <div className="hd">
                  <span className="pill gold-d">{v.period}</span>
                  <b>{v.location}</b>
                </div>
                <ul>{v.description.map((d, j) => <li key={j}>{d}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" id="regional-service">
        <div className="wrap">
          <SectionHead
            tag="Regional Service"
            title={<>Boundary &amp; cross-border<br />cooperation</>}
            aside="Listed under his last assignments during the previous five years."
          />
          <div className="reg">
            <div className="feature">
              <div className="img"><img src={siteImages.boundary} alt="Boundary operations team in the field" loading="lazy" /><div className="ov" /></div>
              <div className="ovtxt">
                <span className="pill">Ghana Boundary Commission</span>
                <div className="bigl">Boundary &amp; cross-border service</div>
              </div>
            </div>
            <div className="rl">
              {regional.map((r, i) => (
                <div className="ri" key={i}>
                  <span className="ic">{regionalIcon(i)}</span>
                  <p>{r}</p>
                </div>
              ))}
            </div>
          </div>
          <NextPrev prev={{ to: '/career', label: 'Career' }} next={{ to: '/awards', label: 'Awards' }} />
        </div>
      </section>
    </div>
  )
}
