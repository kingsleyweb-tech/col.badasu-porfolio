import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  BookOpen,
  Briefcase,
  Download,
  Flag,
  Globe,
  GraduationCap,
  Home,
  Image as ImageIcon,
  PanelBottom,
  Plus,
  QrCode,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trophy,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { usePortfolio } from '../../context/PortfolioContext'
import { resolveImageUrl } from '../../utils/imageResolver'
import { adminFetch } from '../../services/adminApi'

type Section = {
  title: string
  summary: string
  icon: React.ComponentType<{ size?: number }>
  edit: string
  view: string
}

export const MainDashboard: React.FC = () => {
  const { data } = usePortfolio()
  const { user, adminCredentials } = useAuth()
  const [collectionCount, setCollectionCount] = useState<number | null>(null)
  const [totalImages, setTotalImages] = useState<number | null>(null)
  const [galleryOnline, setGalleryOnline] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    const loadGalleryStats = async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await adminFetch('/api/gallery')
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const json = await res.json()
          if (active && json && Array.isArray(json.collections)) {
            setCollectionCount(json.collections.length)
            setTotalImages(json.collections.reduce((acc: number, col: { count?: number }) => acc + (col.count || 0), 0))
            setGalleryOnline(true)
          }
          return
        } catch {
          if (attempt < 3) await new Promise((r) => setTimeout(r, 500 * attempt))
        }
      }
      if (active) setGalleryOnline(false)
    }
    loadGalleryStats()
    return () => {
      active = false
    }
  }, [])

  const officer = data.officer
  const lastName = officer.name.split(' ').pop()
  const len = (list?: unknown[]) => list?.length ?? 0
  const qualifications = len(data.professionalCertificates) + len(data.militaryDiplomas) + len(data.unitarPociCertificates) + len(data.professionalCourses)
  const signedInAs = user?.email || adminCredentials.email || 'Administrator'
  const portrait = resolveImageUrl(officer.profileImageUrl || 'hero/a1.png')
  const collectionsLabel = collectionCount === null ? 'collections' : `${collectionCount} collection${collectionCount === 1 ? '' : 's'}`

  const stats = [
    { value: len(data.workHistory), label: 'Appointments', meta: 'Career timeline' },
    { value: len(data.operations), label: 'Missions', meta: 'Operational record' },
    { value: len(data.awards), label: 'Decorations', meta: 'Awards page' },
    { value: qualifications, label: 'Qualifications', meta: 'Education & courses' },
    { value: collectionCount ?? '—', label: 'Collections', meta: totalImages !== null ? `${totalImages} photos in Cloudinary` : 'Photo library' },
  ]

  const groups: { label: string; sections: Section[] }[] = [
    {
      label: 'Home page',
      sections: [
        { title: 'Hero section', summary: `${len(data.hero?.slides)} slides · intro text`, icon: SlidersHorizontal, edit: '/admin/hero', view: '/' },
        { title: 'Home cards', summary: `${len(data.homeCareerCards)} career · ${len(data.homeAchievementCards)} achievement`, icon: Home, edit: '/admin/home-cards', view: '/' },
        { title: 'Welcome & QR', summary: '3 pillars · QR landing', icon: QrCode, edit: '/admin/welcome', view: '/welcome' },
      ],
    },
    {
      label: 'Profile & career',
      sections: [
        { title: 'Rank & title', summary: `${officer.rank} · ${officer.force}`, icon: ShieldCheck, edit: '/admin/rank', view: '/biography' },
        { title: 'Biography', summary: `${len(officer.biography)} paragraphs · ${len(data.biographicDetails)} record fields`, icon: UserRound, edit: '/admin/biography', view: '/biography' },
        { title: 'Career', summary: `${len(data.workHistory)} appointments`, icon: Briefcase, edit: '/admin/career', view: '/career' },
        { title: 'Missions & assignments', summary: `${len(data.operations)} missions · ${len(data.recentAssignments)} assignments`, icon: Flag, edit: '/admin/achievements', view: '/career' },
        { title: 'Awards', summary: `${len(data.awards)} decorations`, icon: Award, edit: '/admin/awards', view: '/awards' },
        { title: 'Achievements', summary: `${len(data.achievements)} highlights · ${len(data.volunteerExperience)} volunteer`, icon: Trophy, edit: '/admin/achievements', view: '/achievements' },
      ],
    },
    {
      label: 'Education, personal & media',
      sections: [
        {
          title: 'Education',
          summary: `${len(data.professionalCertificates)} certs · ${len(data.militaryDiplomas)} diplomas · ${len(data.unitarPociCertificates)} UNITAR`,
          icon: GraduationCap,
          edit: '/admin/education',
          view: '/education',
        },
        { title: 'Professional courses', summary: `${len(data.professionalCourses)} courses`, icon: BookOpen, edit: '/admin/courses', view: '/education' },
        { title: 'Languages & hobbies', summary: `${len(data.languages?.spoken)} languages · ${len(data.languages?.hobbies)} hobbies`, icon: Globe, edit: '/admin/languages', view: '/biography' },
        { title: 'Gallery', summary: collectionsLabel, icon: ImageIcon, edit: '/admin/gallery', view: '/gallery' },
        { title: 'Footer', summary: 'Name · tagline · crest', icon: PanelBottom, edit: '/admin/footer', view: '/' },
        { title: 'Site & branding', summary: 'Logo · titles · admin profile', icon: Settings, edit: '/admin/settings', view: '/' },
      ],
    },
  ]
  const sectionCount = groups.reduce((n, g) => n + g.sections.length, 0)

  const quickActions = [
    { to: '/admin/gallery', label: 'New gallery collection', icon: ImageIcon },
    { to: '/admin/hero', label: 'Change hero slides', icon: SlidersHorizontal },
    { to: '/admin/career', label: 'Add a career appointment', icon: Plus },
    { to: '/admin/awards', label: 'Add an award', icon: Award },
    { to: '/admin/welcome', label: 'Download QR code', icon: Download },
  ]

  return (
    <div className="ad-page ad-dash">
      <section className="ad-ban">
        <img src={portrait} alt="" />
        <div className="sh" />
        <div className="in">
          <div>
            <span className="ad-tag"><i />Command Console</span>
            <h2>Welcome back,<br />{officer.rank} {lastName}</h2>
            <p>Every section of the public portfolio is managed from here. Changes save to Firestore and appear on the website instantly.</p>
          </div>
          <div className="acts">
            <a className="ad-b gold" href="/" target="_blank" rel="noopener noreferrer">View live site</a>
            <Link className="ad-b lw" to="/admin/welcome">Share QR code</Link>
          </div>
        </div>
      </section>

      <div className="ad-stats">
        {stats.map((s) => (
          <div className="st" key={s.label}>
            <b>{s.value}</b>
            <span>{s.label}</span>
            <small>{s.meta}</small>
          </div>
        ))}
      </div>

      <div className="ad-two">
        <div className="ad-card">
          <div className="hd">
            <div>
              <h3>Everything on the website</h3>
              <p>Every public section, what it holds, and where to edit it.</p>
            </div>
            <span className="ad-pill g">{sectionCount} sections</span>
          </div>
          {groups.map((g) => (
            <React.Fragment key={g.label}>
              <div className="ad-sect">{g.label}</div>
              <div className="ad-map">
                {g.sections.map((s) => {
                  const Icon = s.icon
                  return (
                    <div className="ad-mc" key={s.title}>
                      <Link className="top" to={s.edit}>
                        <span className="i"><Icon size={18} /></span>
                        <div><b>{s.title}</b><small>{s.summary}</small></div>
                      </Link>
                      <div className="ac">
                        <Link className="e" to={s.edit}>Edit</Link>
                        <a href={s.view} target="_blank" rel="noopener noreferrer">View</a>
                      </div>
                    </div>
                  )
                })}
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="ad-side">
          <div className="ad-card ad-qa">
            <div className="hd"><h3>Quick actions</h3></div>
            {quickActions.map((a) => {
              const Icon = a.icon
              return (
                <Link key={a.label} to={a.to}>
                  <span className="i"><Icon size={16} /></span>
                  {a.label}
                  <span className="ar" aria-hidden="true">→</span>
                </Link>
              )
            })}
          </div>
          <div className="ad-card ad-sys">
            <div className="hd"><h3>System status</h3></div>
            <div><span>Public website</span><span className="ad-ok"><i />Live</span></div>
            <div><span>Content database</span><span className="ad-ok"><i />Connected</span></div>
            <div>
              <span>Photo storage</span>
              {galleryOnline === false ? (
                <span className="ad-ok warn"><i />Unreachable</span>
              ) : (
                <span className="ad-ok"><i />{galleryOnline ? 'Connected' : 'Checking…'}</span>
              )}
            </div>
            <div><span>Signed in as</span><span className="who">{signedInAs}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
