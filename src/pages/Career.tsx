import { useState } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import { operations as defaultOperations, recentAssignments as defaultAssignments, workHistory as defaultWorkHistory } from '../data/officerData'
import type { WorkHistoryItem } from '../data/officerData'
import { siteImages } from '../data/siteImages'
import { useIsMobile } from '../hooks/useMediaQuery'
import { IconPin } from '../components/site/icons'
import { NextPrev, PageHero, SectionHead, SubNav } from '../components/site/PageParts'
import { isPresent, pad2, parseOperation } from '../utils/portfolioFormat'

const SECTIONS = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'work-history', label: 'Detailed Work History' },
  { id: 'recent-assignments', label: 'Recent Assignments' },
  { id: 'operational-experience', label: 'Operational Experience' },
] as const

export function Career() {
  const { data } = usePortfolio()
  const isMobile = useIsMobile()
  const workHistory = data?.workHistory?.length ? data.workHistory : defaultWorkHistory
  const assignments = data?.recentAssignments?.length ? data.recentAssignments : defaultAssignments
  const operations = data?.operations?.length ? data.operations : defaultOperations

  const numbered = workHistory.map((item, i) => ({ item, n: i + 1 }))
  const lastAssignmentSpan = 3 - ((assignments.length - 1) % 3)

  return (
    <div className="pg-career">
      <PageHero
        image={siteImages.boundary}
        crumb="Home / Career"
        tag="02 — Career"
        title={<>Military career<br />history</>}
        lead="A chronological record of appointments, command responsibilities, operational service, and senior staff duties."
        stats={[
          { value: workHistory.length, label: 'Appointments' },
          { value: operations.length, label: 'Missions' },
          { value: assignments.length, label: 'Assignments' },
        ]}
      />

      <SubNav items={SECTIONS} />

      <section className="sec" id="timeline" style={{ paddingTop: 80 }}>
        <div className="wrap">
          <SectionHead
            id="work-history"
            tag="Chronology"
            title={<>Career timeline &amp;<br />work history</>}
            aside="Each appointment shows its headline duty. Open any card to read the complete record of responsibilities."
          />
          {isMobile ? (
            <div className="tl single">
              {numbered.map(({ item, n }) => <TimelineCard key={n} item={item} n={n} />)}
            </div>
          ) : (
            <div className="tl">
              <div className="col l">
                {numbered.filter(({ n }) => n % 2 === 1).map(({ item, n }) => <TimelineCard key={n} item={item} n={n} />)}
              </div>
              <div className="col r">
                {numbered.filter(({ n }) => n % 2 === 0).map(({ item, n }) => <TimelineCard key={n} item={item} n={n} />)}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="sec dark" id="recent-assignments">
        <div className="wrap">
          <SectionHead
            dark
            tag="Recent Assignments"
            title={<>Last assignments during<br />the previous five years</>}
            aside="From security command in Abidjan to international boundary work for the Ghana Boundary Commission."
          />
          <div className="asg">
            {assignments.map((assignment, i) => {
              const isLast = i === assignments.length - 1
              const wide = isLast && lastAssignmentSpan > 1
              return (
                <div className={`as ${wide ? 'wide' : ''}`} key={i} style={wide ? { gridColumn: `span ${lastAssignmentSpan}` } : undefined}>
                  <b>{pad2(i + 1)}</b>
                  <p>{assignment}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="sec surface" id="operational-experience">
        <div className="wrap">
          <SectionHead
            tag="Operational Experience"
            title={<>United Nations peacekeeping<br />operations</>}
            aside="Markers show the number of deployments recorded for each mission."
          />
          <div className="opgrid">
            <div className="feature">
              <div className="img"><img src={siteImages.ecowasChamber} alt="Colonel Badasu at an ECOWAS peace support engagement" loading="lazy" /><div className="ov" /></div>
              <div className="ovtxt">
                <div className="bign">{operations.length}</div>
                <div className="bigl">UN &amp; ECOWAS missions</div>
              </div>
            </div>
            <div className="opl">
              {operations.map((op) => {
                const o = parseOperation(op)
                return (
                  <div className="op" key={op}>
                    <div>
                      <b>{o.code}</b>
                      {isMobile && <p>{o.name}</p>}
                    </div>
                    {!isMobile && <p>{o.name}</p>}
                    <div className="opd">
                      <div className="dots">{Array.from({ length: o.count }, (_, i) => <i key={i} />)}</div>
                      {o.deployment && <span>{o.deployment}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <NextPrev prevOnWhite prev={{ to: '/biography', label: 'Biography' }} next={{ to: '/achievements', label: 'Achievements' }} />
        </div>
      </section>
    </div>
  )
}

function TimelineCard({ item, n }: { item: WorkHistoryItem; n: number }) {
  const duties = item.description.filter(Boolean)
  const [open, setOpen] = useState(n === 1 && duties.length > 1)
  const now = isPresent(item.period)

  return (
    <article className={`tc ${now ? 'now' : ''}`}>
      <div className="top">
        <span className="date">{item.period}</span>
        {now ? <span className="pill gold">Present</span> : <span className="num">{pad2(n)}</span>}
      </div>
      <h3>{item.title}</h3>
      <p className="loc"><IconPin size={15} strokeWidth={2.2} />{item.location}</p>
      {open ? (
        <ul className="duties">{duties.map((d, i) => <li key={i}>{d}</li>)}</ul>
      ) : (
        duties[0] && <p className="sm">{duties[0]}</p>
      )}
      {duties.length > 1 && (
        <button className="xp" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Hide duties' : `Full duties · ${duties.length}`} <span aria-hidden="true">{open ? '−' : '+'}</span>
        </button>
      )}
    </article>
  )
}
