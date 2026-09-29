import type { CSSProperties } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import { defaultAwards } from '../services/portfolioService'
import { siteImages } from '../data/siteImages'
import { MedalSvg } from '../components/site/icons'
import { NextPrev, PageHero, SectionHead } from '../components/site/PageParts'

type Group = 'un' | 'ecowas' | 'gaf'

const GROUPS: Record<Group, { label: string; pill: string; pillClass: string; pillStyle?: CSSProperties }> = {
  un: { label: 'United Nations Medals', pill: 'United Nations', pillClass: 'pill g' },
  ecowas: { label: 'ECOWAS Medal', pill: 'ECOWAS', pillClass: 'pill gold' },
  gaf: { label: 'Ghana Armed Forces', pill: 'Ghana Armed Forces', pillClass: 'pill', pillStyle: { background: '#0b0f0c' } },
}

const groupOf = (title: string): Group => (/united nations|\bun\b/i.test(title) ? 'un' : /ecowas/i.test(title) ? 'ecowas' : 'gaf')

export function Awards() {
  const { data } = usePortfolio()
  const awards = (data?.awards?.length ? data.awards : defaultAwards).map((a) => ({ ...a, group: groupOf(a.title) }))
  const chronology = [...awards].sort((a, b) => (parseInt(a.year) || 0) - (parseInt(b.year) || 0))
  const counts = (Object.keys(GROUPS) as Group[])
    .map((g) => ({ g, count: awards.filter((a) => a.group === g).length }))
    .filter((c) => c.count > 0)
  const unCount = awards.filter((a) => a.group === 'un').length

  return (
    <div className="pg-awards">
      <PageHero
        image={siteImages.ecowasChamber}
        crumb="Home / Awards"
        tag="04 — Awards"
        title={<>Awards &amp;<br />recognition</>}
        lead="Formal military honors, UN peacekeeping medals, ECOWAS decorations, and official citations."
        stats={[
          { value: awards.length, label: 'Decorations' },
          ...(unCount ? [{ value: unCount, label: 'UN medals' }] : []),
        ]}
      />

      <section className="sec" id="decorations" style={{ paddingTop: 100 }}>
        <div className="wrap">
          <SectionHead
            tag="Decorations"
            title={<>Medals &amp; official<br />recognition</>}
            aside="Each decoration with the year it was awarded and the service it recognises."
          />
          <div className="groups">
            {counts.map(({ g, count }) => (
              <div className="grp" key={g}><span>{GROUPS[g].label}</span><b>{count}</b></div>
            ))}
          </div>
          <div className="medals">
            {awards.map((award, i) => {
              const group = GROUPS[award.group]
              return (
                <article className="md" key={award.title + i}>
                  <span className="yr" aria-hidden="true">{award.year}</span>
                  <MedalSvg variant={award.group} />
                  <div className="md-body">
                    <span className={group.pillClass} style={group.pillStyle}>{group.pill}</span>
                    <h3>{award.title}</h3>
                    <p>{award.description}</p>
                    <div className="foot"><span className="meta">Awarded</span><b>{award.year}</b></div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="sec dark">
        <div className="wrap">
          <SectionHead dark tag="Chronology" title={<>Recognition across<br />two decades</>} aside="The same decorations in the order they were awarded." />
          <div className="rail" style={{ '--n': Math.min(chronology.length, 6) } as CSSProperties}>
            {chronology.map((a, i) => (
              <div key={a.title + i}><b>{a.year}</b><span>{a.title}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <NextPrev prev={{ to: '/achievements', label: 'Achievements' }} next={{ to: '/education', label: 'Education' }} />
        </div>
      </section>
    </div>
  )
}
