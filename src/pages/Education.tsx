import { usePortfolio } from '../context/PortfolioContext'
import type { EducationItem } from '../data/officerData'
import { siteImages } from '../data/siteImages'
import { useIsMobile } from '../hooks/useMediaQuery'
import { IconCap, IconDoc, IconGlobe, IconPin, IconRibbon } from '../components/site/icons'
import { NextPrev, PageHero, SectionHead } from '../components/site/PageParts'
import { isNotStated, pad2 } from '../utils/portfolioFormat'

/** Show the description only when it adds something beyond the title. */
const addsToTitle = (item: EducationItem) =>
  !!item.description && !item.description.toLowerCase().startsWith(item.title.toLowerCase().replace(/\.$/, ''))

export function Education() {
  const { data } = usePortfolio()
  const isMobile = useIsMobile()
  const certificates = data?.professionalCertificates ?? []
  const diplomas = data?.militaryDiplomas ?? []
  const unitar = data?.unitarPociCertificates ?? []
  const courses = data?.professionalCourses ?? []
  const unitarPeriod = unitar.find((u) => !isNotStated(u.period))?.period ?? 'June 2004 - July 2005'
  const unitarPlace = unitar[0]?.institution || "UNOCI FHQ Abidjan, Cote d'Ivoire"

  const categories = [
    { id: 'professional-development', label: 'Professional Development', count: certificates.length, icon: <IconDoc size={22} strokeWidth={1.8} /> },
    { id: 'military-diplomas', label: 'Military Diplomas', count: diplomas.length, icon: <IconRibbon size={22} strokeWidth={1.8} /> },
    { id: 'unitar-poci', label: 'UNITAR-POCI', count: unitar.length, icon: <IconGlobe size={22} strokeWidth={1.8} /> },
    { id: 'professional-courses', label: 'Professional Courses', count: courses.length, icon: <IconCap size={22} strokeWidth={1.8} /> },
  ]

  return (
    <div className="pg-edu">
      <PageHero
        image={siteImages.graduation}
        crumb="Home / Education"
        tag="05 — Education"
        title={<>Education &amp;<br />military training</>}
        lead="Professional development certificates, military diplomas, and courses attended in Ghana and foreign countries."
      />

      <div className="wrap">
        <nav className="cats" aria-label="Education categories">
          {categories.map((c) => (
            <a className="cat" href={`#${c.id}`} key={c.id}>
              <span className="ic">{c.icon}</span>
              <b>{c.count}</b>
              <span>{c.label}</span>
            </a>
          ))}
        </nav>
      </div>

      <section className="sec" id="professional-development" style={{ paddingTop: 100 }}>
        <div className="wrap">
          <SectionHead
            tag="Professional Development"
            title={<>Professional development<br />certificates</>}
            aside="Postgraduate study, accountancy, French language and international relations."
          />
          <div className="pd">
            {certificates.map((item, i) => (
              <article className="pc" key={item.title + i}>
                <span className="pill g">{item.period}</span>
                <h3>{item.title}</h3>
                {addsToTitle(item) && <p className="sm">{item.description}</p>}
                <p className="ins"><IconPin size={16} />{item.institution}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sec dark" id="military-diplomas">
        <div className="wrap">
          <SectionHead
            dark
            tag="Military Diplomas"
            title={<>Military diplomas<br />&amp; certificates</>}
            aside="Defence and crisis management in the United Kingdom, peace support operations and logistics training in Ghana."
          />
          <div className="dip">
            {diplomas.map((item, i) => (
              <div className="dr" key={item.title + i}>
                <span className="n">{pad2(i + 1)}</span>
                <h3>{item.title}</h3>
                <span className="i">{item.institution}</span>
                <span className="p">
                  <span className={isNotStated(item.period) ? 'pill' : 'pill gold-d'}>{item.period}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" id="unitar-poci">
        <div className="wrap">
          <SectionHead
            tag="UNITAR-POCI"
            title={<>Certificates of<br />completion</>}
            aside={`Individual UNITAR-POCI certificates obtained at ${unitarPlace}, from ${unitarPeriod.replace(' - ', ' to ')}.`}
          />
          <div className="un">
            <div className="badge">
              <b>{unitar.length}</b>
              <div className="t">UNITAR-POCI Certificates</div>
              <div className="s">{unitarPlace}</div>
              <span className="pill gold-d">{unitarPeriod}</span>
            </div>
            <div className="ulist">
              {unitar.map((item, i) => (
                <div key={item.title + i} className={item.title.length > 70 ? 'wide' : undefined}>
                  <i>{pad2(i + 1)}</i>
                  {item.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sec surface" id="professional-courses">
        <div className="wrap">
          <SectionHead
            tag="Professional Courses"
            title={<>Courses in Ghana<br />&amp; abroad</>}
            aside="From the Young Officers Course to War College, law and mediation degrees."
          />
          {isMobile ? (
            <div className="crs">
              {courses.map((c, i) => (
                <div className="cr" key={c.title + i}>
                  <span className="n">{pad2(i + 1)}</span>
                  <b>{c.title}</b>
                  <span className={isNotStated(c.institution) ? 'muted' : undefined}>{c.institution}</span>
                  {!isNotStated(c.period) && <small>{c.period}</small>}
                </div>
              ))}
            </div>
          ) : (
            <div className="tbl" role="table" aria-label="Professional courses">
              <div className="tr h" role="row">
                <span role="columnheader">#</span>
                <span role="columnheader">Course</span>
                <span role="columnheader">Institution</span>
                <span role="columnheader">Period</span>
              </div>
              {courses.map((c, i) => (
                <div className="tr" role="row" key={c.title + i}>
                  <span className="n" role="cell">{pad2(i + 1)}</span>
                  <b role="cell">{c.title}</b>
                  <span className={`i ${isNotStated(c.institution) ? 'muted' : ''}`} role="cell">{c.institution}</span>
                  <span className={`p ${isNotStated(c.period) ? 'muted' : ''}`} role="cell">{c.period}</span>
                </div>
              ))}
            </div>
          )}
          <NextPrev prevOnWhite prev={{ to: '/awards', label: 'Awards' }} next={{ to: '/gallery', label: 'Gallery' }} />
        </div>
      </section>
    </div>
  )
}
