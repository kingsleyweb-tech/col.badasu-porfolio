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
  brandAssets as defaultBrandAssets
} from '../data/officerData'

export type PortfolioData = {
  officer: typeof defaultOfficer
  biographicDetails: typeof defaultBiographicDetails
  workHistory: typeof defaultWorkHistory
  volunteerExperience: typeof defaultVolunteerExperience
  professionalCertificates: typeof defaultProfessionalCertificates
  militaryDiplomas: typeof defaultMilitaryDiplomas
  unitarPociCertificates: typeof defaultUnitarCertificates
  professionalCourses: typeof defaultProfessionalCourses
  awards: Array<{ title: string; year: string; description: string }>
  languages: {
    spoken: string[]
    written: string[]
    frenchLevel: string
    hobbies: string[]
  }
  hero: {
    title: string
    personalIntro: string
    supportingText: string
    slides: string[]
  }
  welcome: {
    title: string
    subtitle: string
    description: string
    qrRedirectUrl: string
    heroImageSrc: string
  }
  siteSettings: {
    siteTitle: string
    siteDescription: string
    logoUrl: string
    footerCopyright: string
    contactEmail: string
    contactPhone: string
    contactAddress: string
  }
}

export const defaultAwards = [
  { title: 'United Nations Medal (UNIFIL - Lebanon)', year: '2006', description: 'Awarded for distinguished service in UNIFIL operations.' },
  { title: 'United Nations Medal (MONUC - DR Congo)', year: '2007', description: 'Awarded for peace support operations in MONUC.' },
  { title: 'United Nations Medal (UNOCI - Cote d\'Ivoire)', year: '2004', description: 'Awarded for peacekeeping and ceasefire monitoring.' },
  { title: 'United Nations Medal (UNAMSIL - Sierra Leone)', year: '1999', description: 'Awarded for disarmament and peace enforcement service.' },
  { title: 'ECOWAS Medal (ECOMIG - The Gambia)', year: '2018', description: 'Awarded for ECOWAS mission operations as Chief Operations Officer.' },
  { title: 'Long Service & Good Conduct Medal (Ghana Armed Forces)', year: '2015', description: 'Awarded for unblemished long military service.' }
]

export const defaultPortfolioData: PortfolioData = {
  officer: defaultOfficer,
  biographicDetails: defaultBiographicDetails,
  workHistory: defaultWorkHistory,
  volunteerExperience: defaultVolunteerExperience,
  professionalCertificates: defaultProfessionalCertificates,
  militaryDiplomas: defaultMilitaryDiplomas,
  unitarPociCertificates: defaultUnitarCertificates,
  professionalCourses: defaultProfessionalCourses,
  awards: defaultAwards,
  languages: {
    spoken: defaultOfficer.spokenLanguages,
    written: defaultOfficer.writtenLanguages,
    frenchLevel: defaultOfficer.frenchLevel,
    hobbies: defaultOfficer.hobbies
  },
  hero: {
    title: 'Colonel Henry Kwaku Badasu',
    personalIntro: defaultOfficer.shortBio,
    supportingText: 'Senior Army Officer of the Ghana Armed Forces specializing in UN Peacekeeping, International Security, Crisis Management & Strategic Operations.',
    slides: ['hero/a1.png', 'hero/a4.png', 'hero/a5.png', 'hero/graduation.jpeg', 'hero/boundary.jpeg']
  },
  welcome: {
    title: 'Welcome to the Official Portfolio',
    subtitle: 'Col. Henry Kwaku Badasu - Senior Army Officer, Ghana Armed Forces',
    description: 'Explore the military service, international peacekeeping missions, strategic leadership, academic milestones, and professional honors of Colonel Henry Kwaku Badasu.',
    qrRedirectUrl: 'https://colonelbadasu.com',
    heroImageSrc: defaultOfficer.biography[0]
  },
  siteSettings: {
    siteTitle: 'Col. Henry Kwaku Badasu Portfolio',
    siteDescription: 'Official portfolio of Col. Henry Kwaku Badasu, Senior Army Officer of the Ghana Armed Forces.',
    logoUrl: defaultBrandAssets.gafLogo.src,
    footerCopyright: '© 2026 Colonel Henry Kwaku Badasu. All Rights Reserved.',
    contactEmail: 'info@colonelbadasu.com',
    contactPhone: '+233 24 000 0000',
    contactAddress: 'Army Headquarters, Burma Camp, Accra - Ghana'
  }
}

const PORTFOLIO_DOC_ID = 'portfolio_main'
const LOCAL_STORAGE_KEY = 'colonel_portfolio_content_v1'

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

  // Check localStorage cached edits if offline/demo
  const localSaved = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (localSaved) {
    try {
      return { ...defaultPortfolioData, ...JSON.parse(localSaved) }
    } catch {
      // ignore
    }
  }

  return defaultPortfolioData
}

export async function savePortfolioContent(updated: Partial<PortfolioData>): Promise<void> {
  const current = await fetchPortfolioContent()
  const merged = { ...current, ...updated }

  // 1. LocalStorage update for instant local state sync
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged))

  // 2. Firestore document sync
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
