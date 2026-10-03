import { doc, getDoc, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { PublicSession } from './visitorSession'
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
    adminSidebarTitle?: string
    adminSidebarSubtitle?: string
    adminHeaderDisplayName?: string
    adminHeaderRole?: string
    adminHeaderInitials?: string
  }
}

// ─── Default Values ────────────────────────────────────────────────────────────
// Empty on purpose: the portfolio content is not shipped in the browser bundle. Public pages get it
// from /api/portfolio after the access check; the admin dashboard reads Firestore directly.

export const defaultAwards: PortfolioData['awards'] = []

const emptyPillar: LeadershipPillar = { title: '', description: '' }

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
  achievements: [],
  recentAssignments: defaultRecentAssignments,
  operations: defaultOperations,
  languages: { spoken: [], written: [], frenchLevel: '', hobbies: [] },
  leadership: { pillar1: emptyPillar, pillar2: emptyPillar, pillar3: emptyPillar },
  hero: { title: '', personalIntro: '', supportingText: '', slides: [] },
  welcome: {
    title: '',
    subtitle: '',
    description: '',
    qrRedirectUrl: '',
    heroImageSrc: '',
    leadershipTitle: '',
    leadershipText: '',
    serviceTitle: '',
    serviceText: '',
    excellenceTitle: '',
    excellenceText: '',
  },
  homeCareerCards: [],
  homeAchievementCards: [],
  footer: { displayName: '', displayRank: '', tagline: '', imageUrl: '', imagePublicId: '' },
  siteSettings: {
    siteTitle: '',
    siteDescription: '',
    logoUrl: defaultBrandAssets.gafLogo.src,
    logoPublicId: '',
    footerCopyright: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
  },
}

// ─── Achievement cards ─────────────────────────────────────────────────────────
// The achievement cards on the Home page and the Achievements page are one list: the text lives in
// `achievements` and each card's photo in `homeAchievementCards` at the same position. Both admin
// screens read and write them through these helpers so the two fields never drift apart.

export function achievementCardsFrom(data: Pick<PortfolioData, 'achievements' | 'homeAchievementCards'>): HomeCard[] {
  const photos = data.homeAchievementCards ?? []
  return (data.achievements ?? []).map((a, i) => ({
    title: a.title,
    description: a.description,
    category: a.category ?? '',
    to: a.to,
    meta: photos[i]?.meta || 'Institutional Service',
    imageUrl: photos[i]?.imageUrl || '',
    imagePublicId: photos[i]?.imagePublicId || '',
  }))
}

export function achievementCardsUpdate(cards: HomeCard[]): Pick<PortfolioData, 'achievements' | 'homeAchievementCards'> {
  return {
    achievements: cards.map(({ title, description, category, to }) => ({ title, description, category, to })),
    homeAchievementCards: cards,
  }
}

// ─── Firestore CRUD ────────────────────────────────────────────────────────────
// Firestore is the only store of portfolio content. Only the signed-in administrator may read or
// write portfolio/portfolio_main directly (Security Rules); public pages use /api/portfolio.

const PORTFOLIO_DOC_ID = 'portfolio_main'
// Public, content-free change markers: { updatedAt } for content, { enabled, codeVersion, epoch } for access
const CONTENT_META = ['site_meta', 'content'] as const
const ACCESS_META = ['site_meta', 'access'] as const

const withDefaults = (stored: Partial<PortfolioData>): PortfolioData => ({ ...defaultPortfolioData, ...stored })

/** Admin: one read of the stored document. */
export async function fetchPortfolioContent(): Promise<PortfolioData> {
  const snap = await getDoc(doc(db, 'portfolio', PORTFOLIO_DOC_ID))
  return snap.exists() ? withDefaults(snap.data() as Partial<PortfolioData>) : defaultPortfolioData
}

/**
 * Admin: save changed sections in one atomic write, and bump the public change marker so open
 * portfolio pages fetch the new content within a second.
 */
export async function savePortfolioContent(updated: Partial<PortfolioData>): Promise<void> {
  const batch = writeBatch(db)
  batch.set(doc(db, 'portfolio', PORTFOLIO_DOC_ID), { ...updated, updatedAt: serverTimestamp() }, { merge: true })
  batch.set(doc(db, ...CONTENT_META), { updatedAt: serverTimestamp() })
  await batch.commit()
}

/** Admin: live updates of the stored document. */
export function subscribePortfolioContent(callback: (data: PortfolioData) => void, onError?: (err: unknown) => void): () => void {
  return onSnapshot(
    doc(db, 'portfolio', PORTFOLIO_DOC_ID),
    (snap) => {
      if (snap.exists()) callback(withDefaults(snap.data() as Partial<PortfolioData>))
    },
    (err) => {
      console.error('[Portfolio] Realtime snapshot error:', err)
      onError?.(err)
    }
  )
}

export class AccessRequiredError extends Error {
  constructor() {
    super('access_required')
  }
}

/** Public pages: the content, returned only for a valid visitor session (or the administrator). */
export async function fetchPublicPortfolio(): Promise<{ data: PortfolioData; session: PublicSession }> {
  const res = await fetch('/api/portfolio', { credentials: 'same-origin', cache: 'no-store' })
  if (res.status === 401) throw new AccessRequiredError()
  if (!res.ok) throw new Error(`Portfolio request failed (${res.status})`)
  const body = (await res.json()) as { data: Partial<PortfolioData>; session: PublicSession }
  return { data: withDefaults(body.data), session: body.session }
}

/** Public pages: fires when the administrator saves content or changes portfolio access. */
export function subscribePublicChanges(onChange: (kind: 'content' | 'access') => void): () => void {
  const seen = { content: '', access: '' }
  const watch = (kind: 'content' | 'access', path: readonly [string, string]) =>
    onSnapshot(
      doc(db, ...path),
      (snap) => {
        const marker = JSON.stringify(snap.data() ?? null)
        if (seen[kind] && seen[kind] !== marker) onChange(kind)
        seen[kind] = marker
      },
      () => {}
    )
  const stops = [watch('content', CONTENT_META), watch('access', ACCESS_META)]
  return () => stops.forEach((stop) => stop())
}
