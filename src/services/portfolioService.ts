import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  officer as defaultOfficer,
  biographicDetails as defaultBiographicDetails,
  workHistory as defaultWorkHistory,
  volunteerExperience as defaultVolunteerExperience,
  professionalCertificates as defaultProfessionalCertificates,
  militaryDiplomas as defaultMilitaryDiplomas,
  unitarPociCertificates as defaultUnitarCertificates,
  professionalCourses as defaultProfessionalCourses,
  brandAssets as defaultBrandAssets,
  achievements as defaultAchievementCards,
  recentAssignments as defaultRecentAssignments,
  operations as defaultOperations,
} from '../data/officerData'

// ─── Core Types ────────────────────────────────────────────────────────────────

export type AchievementCardItem = {
  title: string
  description: string
  category: string
  to: string
}

export type HomeCard = {
  title: string
  description: string
  category: string
  meta: string
  to: string
  imageUrl: string     // resolved URL (local or Cloudinary)
  imagePublicId: string
}

export type VolunteerItem = {
  location: string
  period: string
  description: string[]
}

export type LeadershipPillar = {
  title: string
  description: string
}

export type HeroSlide = {
  url: string       // full Cloudinary URL
  publicId: string  // Cloudinary public_id for deletion
}

// ─── Main PortfolioData Type ───────────────────────────────────────────────────

export type PortfolioData = {
  officer: typeof defaultOfficer & { profileImageUrl?: string }
  biographicDetails: typeof defaultBiographicDetails
  workHistory: typeof defaultWorkHistory
  volunteerExperience: VolunteerItem[]
  professionalCertificates: typeof defaultProfessionalCertificates
  militaryDiplomas: typeof defaultMilitaryDiplomas
  unitarPociCertificates: typeof defaultUnitarCertificates
  professionalCourses: typeof defaultProfessionalCourses
  awards: Array<{ title: string; year: string; description: string }>
  achievements: AchievementCardItem[]
  recentAssignments: string[]
  operations: string[]
  languages: {
    spoken: string[]
    written: string[]
    frenchLevel: string
    hobbies: string[]
  }
  leadership: {
    pillar1: LeadershipPillar
    pillar2: LeadershipPillar
    pillar3: LeadershipPillar
  }
  hero: {
    title: string
    personalIntro: string
    supportingText: string
    slides: HeroSlide[]
  }
  welcome: {
    title: string
    subtitle: string
    description: string
    qrRedirectUrl: string
    heroImageSrc: string
    leadershipTitle: string
    leadershipText: string
    leadershipImage?: string
    leadershipImagePublicId?: string
    serviceTitle: string
    serviceText: string
    serviceImage?: string
    serviceImagePublicId?: string
    excellenceTitle: string
    excellenceText: string
    excellenceImage?: string
    excellenceImagePublicId?: string
  }
  homeCareerCards: HomeCard[]
  homeAchievementCards: HomeCard[]
  footer: {
    displayName: string
    displayRank: string
    tagline: string
    imageUrl: string
    imagePublicId: string
  }
  siteSettings: {
    siteTitle: string
    siteDescription: string
    logoUrl: string
    logoPublicId: string
    footerCopyright: string
    contactEmail: string
    contactPhone: string
    contactAddress: string
  }
}

// ─── Default Values ────────────────────────────────────────────────────────────

export const defaultAwards = [
  { title: 'United Nations Medal (UNIFIL - Lebanon)', year: '2006', description: 'Awarded for distinguished service in UNIFIL operations.' },
  { title: 'United Nations Medal (MONUC - DR Congo)', year: '2007', description: 'Awarded for peace support operations in MONUC.' },
  { title: "United Nations Medal (UNOCI - Cote d'Ivoire)", year: '2004', description: 'Awarded for peacekeeping and ceasefire monitoring.' },
  { title: 'United Nations Medal (UNAMSIL - Sierra Leone)', year: '1999', description: 'Awarded for disarmament and peace enforcement service.' },
  { title: 'ECOWAS Medal (ECOMIG - The Gambia)', year: '2018', description: 'Awarded for ECOWAS mission operations as Chief Operations Officer.' },
  { title: 'Long Service & Good Conduct Medal (Ghana Armed Forces)', year: '2015', description: 'Awarded for unblemished long military service.' },
]

const defaultHeroSlides: HeroSlide[] = [
  { url: 'https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_1600/v2/colonel-badasu/site/hero/a1', publicId: 'colonel-badasu/site/hero/a1' },
  { url: 'https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_1600/v2/colonel-badasu/site/hero/a4', publicId: 'colonel-badasu/site/hero/a4' },
  { url: 'https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_1600/v2/colonel-badasu/site/hero/a5', publicId: 'colonel-badasu/site/hero/a5' },
  { url: 'https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_1600/v2/colonel-badasu/site/hero/graduation', publicId: 'colonel-badasu/site/hero/graduation' },
  { url: 'https://res.cloudinary.com/lxjudwn8/image/upload/f_auto,q_auto,w_1600/v2/colonel-badasu/site/hero/boundary', publicId: 'colonel-badasu/site/hero/boundary' },
]

export const defaultPortfolioData: PortfolioData = {
  officer: defaultOfficer,
  biographicDetails: defaultBiographicDetails,
  workHistory: defaultWorkHistory,
  volunteerExperience: defaultVolunteerExperience.map((v) => ({
    location: v.location,
    period: v.period,
    description: v.description,
  })),
  professionalCertificates: defaultProfessionalCertificates,
  militaryDiplomas: defaultMilitaryDiplomas,
  unitarPociCertificates: defaultUnitarCertificates,
  professionalCourses: defaultProfessionalCourses,
  awards: defaultAwards,
  achievements: defaultAchievementCards.map((a) => ({
    title: a.title,
    description: a.description,
    category: a.category || '',
    to: a.to,
  })),
  recentAssignments: defaultRecentAssignments,
  operations: defaultOperations,
  languages: {
    spoken: defaultOfficer.spokenLanguages,
    written: defaultOfficer.writtenLanguages,
    frenchLevel: defaultOfficer.frenchLevel,
    hobbies: defaultOfficer.hobbies,
  },
  leadership: {
    pillar1: { title: 'Leadership', description: 'Demonstrated strategic command, operational direction, and team management across UN missions.' },
    pillar2: { title: 'Service', description: 'Over 28 years of unblemished military service to Ghana and the international community.' },
    pillar3: { title: 'Excellence', description: 'Rigorous adherence to military ethics, strategic education, and professional development.' },
  },
  hero: {
    title: 'Colonel Henry Kwaku Badasu',
    personalIntro: defaultOfficer.shortBio,
    supportingText: 'Senior Army Officer of the Ghana Armed Forces specializing in UN Peacekeeping, International Security, Crisis Management & Strategic Operations.',
    slides: defaultHeroSlides,
  },
  welcome: {
    title: 'Welcome to the Official Portfolio',
    subtitle: 'Col. Henry Kwaku Badasu - Senior Army Officer, Ghana Armed Forces',
    description: 'Explore the military service, international peacekeeping missions, strategic leadership, academic milestones, and professional honors of Colonel Henry Kwaku Badasu.',
    qrRedirectUrl: 'https://colonelbadasu.com',
    heroImageSrc: defaultOfficer.biography[0],
    leadershipTitle: 'LEADERSHIP',
    leadershipText: 'Leading with vision, integrity and purpose.',
    leadershipImage: '',
    leadershipImagePublicId: '',
    serviceTitle: 'SERVICE',
    serviceText: 'Dedicated to duty, country and people.',
    serviceImage: '',
    serviceImagePublicId: '',
    excellenceTitle: 'EXCELLENCE',
    excellenceText: 'Striving for the highest standards in all I do.',
    excellenceImage: '',
    excellenceImagePublicId: '',
  },
  homeCareerCards: [
    { title: 'Chief Operations Officer, ECOMIG Force Headquarters', description: 'Planning, force generation, rotation, repatriation, doctrine review, and peacekeeping threat assessment.', category: 'Command', meta: 'Career Record', to: '/career', imageUrl: '', imagePublicId: '' },
    { title: 'Deputy Director Army Peacekeeping Operations', description: 'Nomination, screening, pre-deployment training, rotation planning, and peacekeeping reporting.', category: 'Operations', meta: 'Career Record', to: '/career', imageUrl: '', imagePublicId: '' },
    { title: 'Deputy Director Army Administration', description: 'Headquarters administration, operational coordination, training activities, and stakeholder liaison.', category: 'Staff', meta: 'Career Record', to: '/career', imageUrl: '', imagePublicId: '' },
    { title: 'UN and ECOWAS Operational Service', description: "Assignments across Sierra Leone, Liberia, Cote d'Ivoire, DR Congo, Lebanon, South Sudan, and The Gambia.", category: 'Service', meta: 'Career Record', to: '/career', imageUrl: '', imagePublicId: '' },
  ],
  homeAchievementCards: [
    { title: 'UN Peacekeeping Operations in Africa', description: 'Extensive operational experience in United Nations peacekeeping operations across Africa.', category: 'Peacekeeping', meta: 'Institutional Service', to: '/career#operational-experience', imageUrl: '', imagePublicId: '' },
    { title: 'Risk, Crisis, and Security Management', description: 'Demonstrated understanding of risk, crisis, and security management in military operational contexts.', category: 'Security', meta: 'Institutional Service', to: '/career#work-history', imageUrl: '', imagePublicId: '' },
    { title: 'Strategic Leadership Preparation', description: 'War College Strategic Level Leadership and Management preparation for senior military responsibilities.', category: 'Leadership', meta: 'Institutional Service', to: '/education#professional-courses', imageUrl: '', imagePublicId: '' },
    { title: 'Professional Mentorship and Service', description: 'Mentorship for ASIS International Certifications and guidance for professional development.', category: 'Mentorship', meta: 'Institutional Service', to: '/career#work-history', imageUrl: '', imagePublicId: '' },
  ],
  footer: {
    displayName: 'Henry Kwaku Badasu',
    displayRank: 'Colonel',
    tagline: 'A concise professional profile of his service, leadership, education, and documented achievements.',
    imageUrl: '',
    imagePublicId: '',
  },
  siteSettings: {
    siteTitle: 'Col. Henry Kwaku Badasu Portfolio',
    siteDescription: 'Official portfolio of Col. Henry Kwaku Badasu, Senior Army Officer of the Ghana Armed Forces.',
    logoUrl: defaultBrandAssets.gafLogo.src,
    logoPublicId: 'colonel-badasu/site/root/image',
    footerCopyright: '© 2026 Colonel Henry Kwaku Badasu. All Rights Reserved.',
    contactEmail: 'info@colonelbadasu.com',
    contactPhone: '+233 24 000 0000',
    contactAddress: 'Army Headquarters, Burma Camp, Accra - Ghana',
  },
}

// ─── Firestore CRUD ────────────────────────────────────────────────────────────

const PORTFOLIO_DOC_ID = 'portfolio_main'
const LOCAL_STORAGE_KEY = 'colonel_portfolio_content_v2'

export async function fetchPortfolioContent(): Promise<PortfolioData> {
  try {
    const docRef = doc(db, 'portfolio', PORTFOLIO_DOC_ID)
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      return { ...defaultPortfolioData, ...snap.data() } as PortfolioData
    }
  } catch (err) {
    console.info('Firestore offline/fallback mode active:', err)
  }

  const localSaved = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (localSaved) {
    try {
      return { ...defaultPortfolioData, ...JSON.parse(localSaved) }
    } catch {
      // ignore corrupt cache
    }
  }

  return defaultPortfolioData
}

export async function savePortfolioContent(updated: Partial<PortfolioData>): Promise<void> {
  const current = await fetchPortfolioContent()
  const merged = { ...current, ...updated }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged))

  try {
    const docRef = doc(db, 'portfolio', PORTFOLIO_DOC_ID)
    await setDoc(docRef, merged, { merge: true })
  } catch (err) {
    console.warn('Firestore write warning:', err)
  }
}

export function subscribePortfolioContent(callback: (data: PortfolioData) => void): () => void {
  try {
    const docRef = doc(db, 'portfolio', PORTFOLIO_DOC_ID)
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const remoteData = { ...defaultPortfolioData, ...snap.data() } as PortfolioData
          callback(remoteData)
        }
      },
      (err) => {
        console.info('Realtime snapshot offline, using fallback:', err)
      }
    )
  } catch {
    return () => {}
  }
}
