import type { ComponentType } from 'react'
import {
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
  Globe,
  Home,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  PanelBottom,
  QrCode,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react'
import type { PortfolioData } from '../services/portfolioService'

export type AdminNavItem = {
  to: string
  label: string
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  /** Public page this section appears on (for "View …" links). */
  publicPath: string
  publicLabel: string
  count?: (data: PortfolioData) => number
}

export type AdminNavGroup = { label: string; items: AdminNavItem[] }

export const dashboardItem: AdminNavItem = { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, publicPath: '/', publicLabel: 'site' }
export const everyoneItem: AdminNavItem = { to: '/admin/everyone', label: 'Overview / Everyone', icon: Layers, publicPath: '/', publicLabel: 'site' }
export const usersItem: AdminNavItem = { to: '/admin/users', label: 'Users & Access', icon: Users, publicPath: '/', publicLabel: 'site' }

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: 'Home page',
    items: [
      { to: '/admin/hero', label: 'Hero Section', icon: SlidersHorizontal, publicPath: '/', publicLabel: 'home page', count: (d) => d.hero?.slides?.length ?? 0 },
      { to: '/admin/home-cards', label: 'Career & Achievement Cards', icon: Home, publicPath: '/', publicLabel: 'home page', count: (d) => (d.homeCareerCards?.length ?? 0) + (d.homeAchievementCards?.length ?? 0) },
    ],
  },
  {
    label: 'Portfolio',
    items: [
      { to: '/admin/rank', label: 'Rank & Military Title', icon: ShieldCheck, publicPath: '/biography', publicLabel: 'biography' },
      { to: '/admin/biography', label: 'Biography', icon: UserRound, publicPath: '/biography', publicLabel: 'biography' },
      { to: '/admin/career', label: 'Career', icon: Briefcase, publicPath: '/career', publicLabel: 'career page', count: (d) => d.workHistory?.length ?? 0 },
    ],
  },
  {
    label: 'Achievements',
    items: [
      { to: '/admin/awards', label: 'Awards & Decorations', icon: Award, publicPath: '/awards', publicLabel: 'awards', count: (d) => d.awards?.length ?? 0 },
      { to: '/admin/achievements', label: 'Achievements & Highlights', icon: Trophy, publicPath: '/achievements', publicLabel: 'achievements', count: (d) => d.achievements?.length ?? 0 },
      { to: '/admin/leadership', label: 'Leadership / Service / Excellence', icon: Star, publicPath: '/welcome', publicLabel: 'welcome page' },
    ],
  },
  {
    label: 'Education',
    items: [
      {
        to: '/admin/education',
        label: 'Education & Qualifications',
        icon: GraduationCap,
        publicPath: '/education',
        publicLabel: 'education',
        count: (d) => (d.professionalCertificates?.length ?? 0) + (d.militaryDiplomas?.length ?? 0) + (d.unitarPociCertificates?.length ?? 0),
      },
      { to: '/admin/courses', label: 'Professional Courses', icon: BookOpen, publicPath: '/education', publicLabel: 'education', count: (d) => d.professionalCourses?.length ?? 0 },
    ],
  },
  {
    label: 'Personal & media',
    items: [
      { to: '/admin/languages', label: 'Languages & Interests', icon: Globe, publicPath: '/biography', publicLabel: 'biography', count: (d) => d.languages?.spoken?.length ?? 0 },
      { to: '/admin/gallery', label: 'Gallery Collections', icon: ImageIcon, publicPath: '/gallery', publicLabel: 'gallery' },
    ],
  },
  {
    label: 'Website',
    items: [
      { to: '/admin/welcome', label: 'QR & Welcome Page', icon: QrCode, publicPath: '/welcome', publicLabel: 'welcome page' },
      { to: '/admin/footer', label: 'Footer Settings', icon: PanelBottom, publicPath: '/', publicLabel: 'site' },
      { to: '/admin/settings', label: 'Site & Header Settings', icon: Settings, publicPath: '/', publicLabel: 'site' },
    ],
  },
]

/** Finds the nav entry (and its group) for an admin pathname. */
export function findAdminNavItem(pathname: string): { item: AdminNavItem; group?: string } {
  for (const group of adminNavGroups) {
    const item = group.items.find((i) => pathname.startsWith(i.to))
    if (item) return { item, group: group.label }
  }
  if (pathname.startsWith(everyoneItem.to)) return { item: everyoneItem }
  if (pathname.startsWith(usersItem.to)) return { item: usersItem, group: 'Account' }
  return { item: dashboardItem }
}
