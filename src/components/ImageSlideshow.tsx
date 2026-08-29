import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ImageAsset } from '../data/officerData'

type TransitionName = 'bars' | 'glitter' | 'zoom' | 'reveal' | 'vortex'

type ImageSlideshowProps = {
  images: ImageAsset[]
  active: number
  onActiveChange: (index: number) => void
}

const transitions: TransitionName[] = ['bars', 'glitter', 'zoom', 'reveal', 'vortex']

function getTransition(): TransitionName {
  return transitions[Math.floor(Math.random() * transitions.length)]
}

export function ImageSlideshow({ images, active, onActiveChange }: ImageSlideshowProps) {
  const [transition, setTransition] = useState<TransitionName>('zoom')
  const reduceMotion = useReducedMotion()
  const bars = useMemo(() => Array.from({ length: 12 }, (_, index) => index), [])
  const particles = useMemo(() => Array.from({ length: 28 }, (_, index) => index), [])

  const goTo = useCallback((index: number) => {
    setTransition(getTransition())
    onActiveChange((index + images.length) % images.length)
  }, [images.length, onActiveChange])

  useEffect(() => {
    const timer = window.setTimeout(() => goTo(active + 1), 7000)
    return () => window.clearTimeout(timer)
  }, [active, goTo])

  const current = images[active]
  const next = images[(active + 1) % images.length]

  useEffect(() => {
    const first = images[0]
    if (!first) {
      return
    }

    const existing = document.querySelector<HTMLLinkElement>(`link[rel="preload"][href="${first.src}"]`)
    const link = existing ?? document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = first.src
    link.setAttribute('fetchpriority', 'high')

    if (!existing) {
      document.head.appendChild(link)
    }
  }, [images])

  useEffect(() => {
    if (!next) {
      return
    }

    const image = new Image()
    image.decoding = 'async'
    image.src = next.src
  }, [next])

  return (
    <div className={`slideshow slideshow--${transition}`}>
      <AnimatePresence mode="sync" initial={false}>
        <motion.img
          key={current.src}
          src={current.src}
          alt={current.alt}
          width={current.width}
          height={current.height}
          loading="eager"
          fetchPriority={active === 0 ? 'high' : 'auto'}
          decoding="async"
          sizes="100vw"
          className="slideshow__image"
          initial={reduceMotion ? { opacity: 0 } : transitionInitial(transition)}
          animate={reduceMotion ? { opacity: 1 } : transitionAnimate(transition)}
          exit={reduceMotion ? { opacity: 0 } : transitionExit(transition)}
          transition={{ duration: reduceMotion ? 0.15 : 0.72, ease: [0.22, 1, 0.36, 1] }}
        />
      </AnimatePresence>

      {!reduceMotion && transition === 'bars' && (
        <div className="slideshow__bars" aria-hidden="true">
          {bars.map((bar) => (
            <motion.span
              key={bar}
              initial={{ scaleY: 1 }}
              animate={{ scaleY: 0 }}
              transition={{ duration: 0.75, delay: bar * 0.025, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}

      {!reduceMotion && transition === 'glitter' && (
        <div className="slideshow__particles" aria-hidden="true">
          {particles.map((particle) => (
            <motion.span
              key={particle}
              initial={{ opacity: 0.55, scale: 0.2 }}
              animate={{ opacity: 0, scale: 1.4, y: -18 }}
              transition={{ duration: 0.8, delay: (particle % 7) * 0.035, ease: 'easeOut' }}
              style={{ left: `${(particle * 37) % 100}%`, top: `${(particle * 19) % 100}%` }}
            />
          ))}
        </div>
      )}

      <div className="slideshow__controls">
        <button type="button" aria-label="Previous slide" onClick={() => goTo(active - 1)}>
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <div className="slideshow__dots" aria-label="Choose hero image">
          {images.map((image, index) => (
            <button
              type="button"
              aria-label={`Show slide ${index + 1}`}
              aria-current={index === active}
              className={index === active ? 'is-active' : ''}
              key={image.src}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
        <button type="button" aria-label="Next slide" onClick={() => goTo(active + 1)}>
          <ChevronRight size={22} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function transitionInitial(name: TransitionName) {
  switch (name) {
    case 'bars':
      return { opacity: 0.9, clipPath: 'inset(0 0 0 100%)', scale: 1.04 }
    case 'glitter':
      return { opacity: 0, filter: 'brightness(1.18)', scale: 1.03 }
    case 'reveal':
      return { opacity: 1, clipPath: 'inset(0 100% 0 0)' }
    case 'vortex':
      return { opacity: 0, rotate: -1.2, scale: 1.08 }
    default:
      return { opacity: 0, scale: 1.12 }
  }
}

function transitionAnimate(name: TransitionName) {
  switch (name) {
    case 'bars':
    case 'reveal':
      return { opacity: 1, clipPath: 'inset(0 0% 0 0)', scale: 1 }
    case 'glitter':
      return { opacity: 1, filter: 'brightness(1)', scale: 1 }
    case 'vortex':
      return { opacity: 1, rotate: 0, scale: 1 }
    default:
      return { opacity: 1, scale: 1 }
  }
}

function transitionExit(name: TransitionName) {
  switch (name) {
    case 'vortex':
      return { opacity: 0, rotate: 1, scale: 0.99 }
    case 'zoom':
      return { opacity: 0, scale: 0.96 }
    default:
      return { opacity: 0 }
  }
}
