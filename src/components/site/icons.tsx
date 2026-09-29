import type { ReactNode } from 'react'

type IconProps = { size?: number; strokeWidth?: number; className?: string }

function Svg({ size = 20, strokeWidth = 2, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const IconArrowRight = (p: IconProps) => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>
export const IconArrowLeft = (p: IconProps) => <Svg {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>
export const IconArrowUp = (p: IconProps) => <Svg {...p}><path d="M12 19V5M6 11l6-6 6 6" /></Svg>
export const IconChevronLeft = (p: IconProps) => <Svg {...p}><path d="M15 6l-6 6 6 6" /></Svg>
export const IconChevronRight = (p: IconProps) => <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>
export const IconChevronDown = (p: IconProps) => <Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>
export const IconClose = (p: IconProps) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
export const IconMenu = (p: IconProps) => <Svg {...p}><path d="M4 8h16M4 16h10" /></Svg>
export const IconExpand = (p: IconProps) => <Svg {...p}><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></Svg>
export const IconPlay = (p: IconProps) => <Svg {...p}><path d="M8 5v14l11-7z" /></Svg>
export const IconPlus = (p: IconProps) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
export const IconDownload = (p: IconProps) => <Svg {...p}><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></Svg>
export const IconInfo = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" /></Svg>
export const IconLoader = (p: IconProps) => <Svg {...p}><path d="M21 12a9 9 0 1 1-6.2-8.56" /></Svg>
export const IconImage = (p: IconProps) => <Svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></Svg>
export const IconRefresh = (p: IconProps) => <Svg {...p}><path d="M20 11a8 8 0 0 0-14.9-3M4 5v4h4M4 13a8 8 0 0 0 14.9 3M20 19v-4h-4" /></Svg>

export const IconPrint = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2" />
    <rect x="6" y="14" width="12" height="7" />
  </Svg>
)

export const IconQr = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <path d="M14 14h3v3M21 14v7h-4M14 21v-3" />
  </Svg>
)

export const IconPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Svg>
)

export const IconCap = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 10l9-5 9 5-9 5-9-5z" />
    <path d="M7 12v4c0 1.5 2.2 3 5 3s5-1.5 5-3v-4" />
  </Svg>
)

export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
)

export const IconDoc = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M14 3v6h6M8 13h8M8 17h5" />
  </Svg>
)

export const IconRibbon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="9" r="6" />
    <path d="M8.5 14L7 22l5-3 5 3-1.5-8" />
  </Svg>
)

export const IconGlobe = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </Svg>
)

export const IconCross = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 12h18M12 3v18" />
    <circle cx="12" cy="12" r="9" />
  </Svg>
)

export const IconMap = (p: IconProps) => <Svg {...p}><path d="M4 21V4l8 3 8-3v17l-8-3-8 3z" /></Svg>

export const IconPeople = (p: IconProps) => (
  <Svg {...p}>
    <path d="M17 20a5 5 0 0 0-10 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    <path d="M21 20a4 4 0 0 0-3-3.9M3 20a4 4 0 0 1 3-3.9" />
  </Svg>
)

/** The ribbon-and-star medal drawn on the awards page. */
export function MedalSvg({ variant }: { variant: 'un' | 'ecowas' | 'gaf' }) {
  const disc = { un: '#c9a24a', ecowas: '#1c5033', gaf: '#0b0f0c' }[variant]
  const accent = { un: '#fff', ecowas: '#e2c47c', gaf: '#c9a24a' }[variant]
  return (
    <svg className="medal" viewBox="0 0 92 128" aria-hidden="true">
      <path d="M26 0h40v44L46 56 26 44z" fill="#133a24" />
      <path d="M38 0h16v48l-8 4-8-4z" fill="#c9a24a" />
      <circle cx="46" cy="88" r="34" fill={disc} />
      <circle cx="46" cy="88" r="26" fill="none" stroke={accent} strokeOpacity={variant === 'un' ? 0.5 : 1} strokeWidth="2" />
      <path d="M46 70l5.3 11 12 1.5-8.8 8.3 2.3 11.9L46 96.9l-10.8 5.8 2.3-11.9-8.8-8.3 12-1.5z" fill={accent} />
    </svg>
  )
}
