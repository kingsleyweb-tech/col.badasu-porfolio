import { brandAssets, officer as defaultOfficer } from '../../data/officerData'
import { usePortfolio } from '../../context/PortfolioContext'
import { resolveImageUrl } from '../../utils/imageResolver'

export const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Biography', to: '/biography' },
  { label: 'Career', to: '/career' },
  { label: 'Achievements', to: '/achievements' },
  { label: 'Awards', to: '/awards' },
  { label: 'Education', to: '/education' },
  { label: 'Gallery', to: '/gallery' },
]

/** "Professionalism, Integrity and Discipline" → "Professionalism · Integrity · Discipline" */
export const mottoDots = (motto: string) => motto.split(/,\s*|\s+and\s+/i).filter(Boolean).join(' · ')

/** Officer details and crest used by the site chrome (nav, footer, share dialog). */
export function useBrand() {
  const { data } = usePortfolio()
  const officer = { ...defaultOfficer, ...data?.officer }
  const logo = data?.siteSettings?.logoUrl ? resolveImageUrl(data.siteSettings.logoUrl) : brandAssets.gafLogo.src
  return { officer, logo, motto: mottoDots(officer.motto || defaultOfficer.motto) }
}
