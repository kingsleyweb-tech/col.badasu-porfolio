import { resolveImageUrl } from '../utils/imageResolver'

// Structure, types and fixed artwork only. The portfolio's text (biography, career, education,
// awards, personal details) is NOT part of the browser bundle: it lives in Firestore and reaches
// the public pages through /api/portfolio after the visitor's access code has been checked.
// The empty values below are what pages show for a field that has no saved content.

const CLOUD_NAME = 'lxjudwn8'
const ROOT_FOLDER = 'colonel-badasu/site'

export type ImageAsset = {
  src: string
  fallbackSrc: string
  thumbnailSrc: string
  placeholderSrc: string
  srcSet: string
  alt: string
  caption: string
  width: number
  height: number
}

export type TimelineItem = {
  period: string
  title: string
  location: string
  description: string
}

export type FeatureCard = {
  title: string
  description: string
  image: ImageAsset
  to: string
  category?: string
  meta?: string
}

export type AwardItem = {
  title: string
  year: string
  description: string
}

export type EducationItem = {
  category: string
  title: string
  institution: string
  period: string
  description: string
}

export type DetailItem = {
  label: string
  value: string
}

export type CategoryLink = {
  label: string
  to: string
}

export type WorkHistoryItem = {
  title: string
  location: string
  period: string
  description: string[]
}

const crest = '/crest.svg'

export const brandAssets = {
  // Served from /public so the access page and admin sign-in can show it without a session
  gafLogo: { ...imageAsset('image.png', 'Ghana Armed Forces crest', 'Ghana Armed Forces crest'), src: crest, fallbackSrc: crest, thumbnailSrc: crest, placeholderSrc: crest },
}

export const officer = {
  rank: '',
  shortRank: '',
  name: '',
  formalName: '',
  force: '',
  motto: '',
  branch: '',
  academy: '',
  enlistment: '',
  profileLabel: '',
  shortBio: '',
  biography: [] as string[],
  spokenLanguages: [] as string[],
  writtenLanguages: [] as string[],
  frenchLevel: '',
  hobbies: [] as string[],
}

export const biographicDetails: DetailItem[] = []

/** Hero photographs used when no slides are saved. */
export const images: ImageAsset[] = [
  imageAsset('hero/a1.png', 'Portfolio photograph', 'Portfolio photograph'),
  imageAsset('hero/a4.png', 'Portfolio photograph', 'Portfolio photograph'),
  imageAsset('hero/a5.png', 'Portfolio photograph', 'Portfolio photograph'),
  imageAsset('hero/graduation.jpeg', 'Portfolio photograph', 'Portfolio photograph'),
  imageAsset('hero/tv3.jpeg', 'Portfolio photograph', 'Portfolio photograph'),
  imageAsset('hero/ecowas.jpeg', 'Portfolio photograph', 'Portfolio photograph'),
  imageAsset('hero/boundary.jpeg', 'Portfolio photograph', 'Portfolio photograph'),
]

export const workHistory: WorkHistoryItem[] = []

/** Photographs for the Home career cards when a card has no uploaded image (matched by position). */
export const careerHighlights: FeatureCard[] = [
  { title: '', description: '', image: imageAsset('career/boundary.jpeg', '', ''), to: '/career' },
  { title: '', description: '', image: imageAsset('career/ecowas.jpeg', '', ''), to: '/career' },
  { title: '', description: '', image: imageAsset('career/a5.png', '', ''), to: '/career' },
  { title: '', description: '', image: imageAsset('career/a6.png', '', ''), to: '/career' },
]

/** Photographs for the achievement cards when a card has no uploaded image (matched by position). */
export const achievements: FeatureCard[] = [
  { title: '', description: '', image: imageAsset('achievements/ecowas.jpeg', '', ''), to: '/achievements' },
  { title: '', description: '', image: imageAsset('achievements/a4.png', '', ''), to: '/achievements' },
  { title: '', description: '', image: imageAsset('achievements/jungle.jpeg', '', ''), to: '/achievements' },
  { title: '', description: '', image: imageAsset('achievements/boundary.jpeg', '', ''), to: '/achievements' },
]

export const volunteerExperience: WorkHistoryItem[] = []
export const professionalCertificates: EducationItem[] = []
export const militaryDiplomas: EducationItem[] = []
export const unitarPociCertificates: EducationItem[] = []
export const professionalCourses: EducationItem[] = []
export const recentAssignments: string[] = []
export const operations: string[] = []

export const homeCategoryLinks: CategoryLink[] = [
  { label: 'Biography', to: '/biography#overview' },
  { label: 'Biographic Form', to: '/biography#details' },
  { label: 'Service Profile', to: '/biography#service' },
  { label: 'Languages & Hobbies', to: '/biography#personal' },
  { label: 'Career Timeline', to: '/career#timeline' },
  { label: 'Work History', to: '/career#work-history' },
  { label: 'Recent Assignments', to: '/career#recent-assignments' },
  { label: 'Operational Experience', to: '/career#operational-experience' },
  { label: 'Volunteer Service', to: '/achievements#volunteer-service' },
  { label: 'Regional Service', to: '/achievements#regional-service' },
  { label: 'Decorations', to: '/awards#decorations' },
  { label: 'Professional Development', to: '/education#professional-development' },
  { label: 'Military Diplomas', to: '/education#military-diplomas' },
  { label: 'UNITAR-POCI', to: '/education#unitar-poci' },
  { label: 'Professional Courses', to: '/education#professional-courses' },
  { label: 'Gallery', to: '/gallery' }
]

export const welcomeFeatureImages = {
  leadership: imageAsset('leadership.png', 'Leadership', 'Leadership'),
  service: imageAsset('service.png', 'Service', 'Service'),
  excellence: imageAsset('excellence.png', 'Excellence', 'Excellence')
}

function imageAsset(relativePath: string, alt: string, caption: string, version = 'v2'): ImageAsset {
  const resolved = resolveImageUrl(relativePath)

  const cleanPath = relativePath.replace(/^\//, '').replace(/\.[^.]+$/, '')
  const publicPath = cleanPath.includes('/') ? cleanPath : `root/${cleanPath}`
  const baseCloudinary = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`
  const vPath = version ? `${version}/` : ''

  const cSrc = `${baseCloudinary}/f_auto,q_auto,w_1600/${vPath}${ROOT_FOLDER}/${publicPath}`
  const cFallback = `${baseCloudinary}/f_auto,q_auto/${vPath}${ROOT_FOLDER}/${publicPath}`

  const src = resolved || cSrc
  const fallbackSrc = resolved || cFallback
  const thumbnailSrc = resolved || cFallback
  const placeholderSrc = resolved || cFallback

  return {
    src,
    fallbackSrc,
    thumbnailSrc,
    placeholderSrc,
    srcSet: '',
    alt,
    caption,
    width: 1200,
    height: 900
  }
}
