import { usePortfolio } from '../context/PortfolioContext'
import { biographicDetails as defaultDetails, officer as defaultOfficer } from '../data/officerData'
import { siteImages } from '../data/siteImages'
import { IconCalendar, IconCap, IconPin } from '../components/site/icons'
import { NextPrev, PageHero, SectionHead, SubNav } from '../components/site/PageParts'
import { resolveImageUrl } from '../utils/imageResolver'
import { pullQuote, shortName, splitYear } from '../utils/portfolioFormat'

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'service', label: 'Service Profile' },
  { id: 'details', label: 'Biographic Form' },
  { id: 'languages', label: 'Languages' },
  { id: 'hobbies', label: 'Hobbies' },
] as const

export function Biography() {
  const { data } = usePortfolio()
  const officer = { ...defaultOfficer, ...data?.officer }
  const biography = officer.biography ?? defaultOfficer.biography
  const details = data?.biographicDetails ?? defaultDetails
  const spoken = data?.languages?.spoken ?? officer.spokenLanguages
  const written = data?.languages?.written ?? officer.writtenLanguages
  const languages = spoken.concat(written.filter((l) => !spoken.includes(l)))
  const hobbies = data?.languages?.hobbies ?? officer.hobbies
  const frenchLevel = data?.languages?.frenchLevel || officer.frenchLevel
  const [firstName, ...otherNames] = officer.name.split(' ')
  const portrait = resolveImageUrl(officer.profileImageUrl) || siteImages.portrait

  return (
    <div className="pg-bio">
      <PageHero
        image={siteImages.ecowasMeeting}
        crumb="Home / Biography"
        tag="01 — Biography"
        title={<>{officer.rank} {firstName}<br />{otherNames.join(' ')}</>}
        lead="His biographic record, summary of experience, service profile and personal notes, in one continuous profile."
        stats={[
          { value: officer.shortRank.replace('.', '').toUpperCase(), label: 'Rank' },
          { value: splitYear(officer.enlistment).year, label: 'Enlisted' },
          { value: languages.length, label: 'Languages' },
        ]}
      />

      <SubNav items={SECTIONS} />

      <section className="sec" id="overview" style={{ paddingTop: 80 }}>
        <div className="wrap ov2">
          <div className="idcard">
            <div className="img"><img src={portrait} alt={`${officer.rank} ${officer.name}`} /></div>
            <div className="b">
              <b>{shortName(officer.shortRank, officer.name)}</b>
              <div className="role">{officer.profileLabel}</div>
              <div className="row"><span>Force</span>{officer.force}</div>
              <div className="row"><span>Motto</span>{officer.motto}</div>
            </div>
          </div>
          <div>
            <span className="tag"><i />Overview</span>
            <h2 className="d2">Summary of experience</h2>
            <p className="lede">{biography[0]}</p>
            {biography[1] && <p className="txt">{biography[1]}</p>}
            {biography[2] && <div className="quote"><p>{pullQuote(biography[2])}</p></div>}
            {biography.slice(2).map((paragraph) => (
              <p className="txt" key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="sec surface" id="service">
        <div className="wrap">
          <SectionHead
            tag="Service Profile"
            title={<>Leadership, operations<br />&amp; administration</>}
            aside="His responsibilities span Ghana Army administration, force planning, peacekeeping operations, personnel management, liaison work, logistics, combat operations, and operational coordination in multinational environments."
          />
          <div className="facts3">
            <div className="fact"><div className="ic"><IconPin size={24} strokeWidth={1.8} /></div><div><span>Branch</span><b>{officer.branch}</b></div></div>
            <div className="fact"><div className="ic"><IconCap size={24} strokeWidth={1.8} /></div><div><span>Academy</span><b>{officer.academy}</b></div></div>
            <div className="fact"><div className="ic"><IconCalendar size={24} strokeWidth={1.8} /></div><div><span>Enlistment</span><b>{officer.enlistment}</b></div></div>
          </div>
        </div>
      </section>

      <section className="sec" id="details">
        <div className="wrap">
          <div className="record">
            <div className="stamp" aria-hidden="true">Official<br />Record</div>
            <span className="tag on-dark"><i />Official Record</span>
            <h2 className="d2">Official biographic details</h2>
            <div className="kvs">
              {details.map((item, idx) => (
                <div className="kv" key={item.label + idx}><span>{item.label}</span><b>{item.value}</b></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sec" id="personal" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <SectionHead tag="Languages & Interests" title="Personal profile notes" aside="Spoken and written languages, French proficiency and personal interests." />
          <div className="langs" id="languages">
            {languages.map((lang) => (
              <div className="lg" key={lang}>
                <b>{lang}</b>
                <div className="ok">
                  {spoken.includes(lang) && <span>✓ Spoken</span>}
                  {written.includes(lang) && <span>✓ Written</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="extras">
            <div className="french">
              <div className="lbl">French Language Level</div>
              <b>{frenchLevel}</b>
            </div>
            <div className="hobbies" id="hobbies">
              <div className="lbl">Hobbies</div>
              <div className="chips">
                {hobbies.map((h) => <span className="chip" key={h}>{h}</span>)}
              </div>
            </div>
          </div>
          <NextPrev prev={{ to: '/', label: 'Home' }} next={{ to: '/career', label: 'Career' }} />
        </div>
      </section>
    </div>
  )
}
