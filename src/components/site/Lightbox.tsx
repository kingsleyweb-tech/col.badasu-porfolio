import { useEffect, useRef } from 'react'
import { pad2 } from '../../utils/portfolioFormat'
import { IconChevronLeft, IconChevronRight, IconClose, IconExpand } from './icons'

export type LightboxImage = { src: string; thumb: string; alt: string }

type LightboxProps = {
  images: LightboxImage[]
  index: number
  title: string
  subtitle?: string
  onIndexChange: (index: number) => void
  onClose: () => void
}

/** Full-screen photograph viewer with thumbnails, keyboard arrows and Escape to close. */
export function Lightbox({ images, index, title, subtitle, onIndexChange, onClose }: LightboxProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const thumbsRef = useRef<HTMLDivElement>(null)
  const total = images.length
  const current = images[index]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % total)
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + total) % total)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, total, onClose, onIndexChange])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [])

  useEffect(() => {
    thumbsRef.current?.querySelector<HTMLElement>('.th.on')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [index])

  if (!current) return null

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else rootRef.current?.requestFullscreen?.().catch(() => {})
  }

  return (
    <div className="lb" ref={rootRef} role="dialog" aria-modal="true" aria-label={`${title} photograph viewer`}>
      <div className="lb-bg" style={{ backgroundImage: `url("${current.thumb}")` }} />
      <div className="top">
        <div className="ttl">
          <b>{title}</b>
          <span>Photograph {pad2(index + 1)}{subtitle ? ` · ${subtitle}` : ''}</span>
        </div>
        <div className="tools">
          <button className="ib fs" type="button" onClick={toggleFullscreen} aria-label="Full screen">
            <IconExpand size={18} />
          </button>
          <button className="ib" type="button" onClick={onClose} aria-label="Close photograph viewer" autoFocus>
            <IconClose size={18} />
          </button>
        </div>
      </div>
      <div className="stage" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <img key={current.src} src={current.src} alt={current.alt} />
      </div>
      {total > 1 && (
        <>
          <button className="navb prev" type="button" aria-label="Previous photograph" onClick={() => onIndexChange((index - 1 + total) % total)}>
            <IconChevronLeft size={22} strokeWidth={2.2} />
          </button>
          <button className="navb next" type="button" aria-label="Next photograph" onClick={() => onIndexChange((index + 1) % total)}>
            <IconChevronRight size={22} strokeWidth={2.2} />
          </button>
        </>
      )}
      <div className="count">{pad2(index + 1)} <span>/ {pad2(total)}</span></div>
      <div className="thumbs" ref={thumbsRef}>
        {images.map((img, i) => (
          <button key={img.src + i} className={`th ${i === index ? 'on' : ''}`} type="button" onClick={() => onIndexChange(i)} aria-label={`Show photograph ${i + 1}`}>
            <img src={img.thumb} alt="" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  )
}
