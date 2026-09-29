import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortfolio } from '../context/PortfolioContext'
import { officer as defaultOfficer } from '../data/officerData'
import { siteImages } from '../data/siteImages'
import { useBrand } from '../components/site/brand'
import { IconArrowRight } from '../components/site/icons'
import { resolveImageUrl } from '../utils/imageResolver'
import { lastName, pad2 } from '../utils/portfolioFormat'

const REDIRECT_SECONDS = 15
const SLIDE_MS = 7000

export function Welcome() {
  const navigate = useNavigate()
  const { data } = usePortfolio()
  const { logo } = useBrand()
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS)
  const [slide, setSlide] = useState(0)

  const officer = { ...defaultOfficer, ...data?.officer }
  const surname = lastName(officer.name)
  const welcome = data?.welcome
  // "Welcome to the Official Portfolio" (Admin › QR & Welcome Page) reads into the name below it
  const welcomeTitle = (welcome?.title || 'Welcome to the Official Portfolio').trim()
  const welcomeLine = /\sof$/i.test(welcomeTitle) ? welcomeTitle : `${welcomeTitle} of`

  const backgrounds = [siteImages.ecowasMeeting, siteImages.officersGroup, siteImages.portrait]

  const pillars = [
    { image: resolveImageUrl(welcome?.leadershipImage) || siteImages.leadership, title: welcome?.leadershipTitle || 'Leadership', text: welcome?.leadershipText || 'Leading with vision, integrity and purpose.' },
    { image: resolveImageUrl(welcome?.serviceImage) || siteImages.service, title: welcome?.serviceTitle || 'Service', text: welcome?.serviceText || 'Dedicated to duty, country and people.' },
    { image: resolveImageUrl(welcome?.excellenceImage) || siteImages.excellence, title: welcome?.excellenceTitle || 'Excellence', text: welcome?.excellenceText || 'Striving for the highest standards in all I do.' },
  ]

  useEffect(() => {
    if (seconds <= 0) {
      navigate('/')
      return
    }
    const timer = window.setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [seconds, navigate])

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((s) => (s + 1) % 3), SLIDE_MS)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="wl">
      {backgrounds.map((src, i) => (
        <div key={src} className={`slide ${i === slide ? 'on' : ''}`} aria-hidden="true">
          <img src={src} alt="" />
        </div>
      ))}
      <div className="shade" />

      <div className="in">
        <img className="crest rv" src={logo} alt={`${officer.force} crest`} />
        <div className="pre rv rv1">{welcomeLine}</div>
        <h1 className="name rv rv2">{officer.rank} <em>{surname}</em></h1>
        <p className="intro rv rv3">{welcome?.description || 'This platform provides an overview of my journey, leadership, service, achievements and commitment to excellence.'}</p>
        <div className="pillars rv rv4">
          {pillars.map((p) => (
            <div className="pl" key={p.title}>
              <img src={p.image} alt="" />
              <div><b>{p.title}</b><span>{p.text}</span></div>
            </div>
          ))}
        </div>
        <div className="cta-gap" />
        <button className="cta rv rv5" type="button" onClick={() => navigate('/')}>
          <span><small>READ EVERYTHING ABOUT</small><b>{officer.rank} {surname}</b></span>
          <i><IconArrowRight size={20} strokeWidth={2.2} /></i>
        </button>
        <div className="cd" role="timer" aria-live="polite">
          <span>Redirecting automatically in</span>
          <div className="cd-ring">
            <svg viewBox="0 0 58 58" aria-hidden="true">
              <circle cx="29" cy="29" r="26" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="3" />
              <circle className="p" cx="29" cy="29" r="26" fill="none" stroke="#e2c47c" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <b>{pad2(seconds)}</b>
          </div>
          <span>seconds</span>
        </div>
        <button className="skip" type="button" onClick={() => navigate('/')}>Skip to portfolio</button>
      </div>
    </div>
  )
}
