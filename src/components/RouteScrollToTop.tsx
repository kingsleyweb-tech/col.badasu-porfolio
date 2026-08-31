import { useEffect, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function RouteScrollToTop() {
  const { hash, pathname, search } = useLocation()

  useEffect(() => {
    if (!('scrollRestoration' in window.history)) {
      return
    }

    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'

    return () => {
      window.history.scrollRestoration = previous
    }
  }, [])

  useLayoutEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1))
      target?.scrollIntoView()
      return
    }

    window.scrollTo(0, 0)

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo(0, 0)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [hash, pathname, search])

  useEffect(() => {
    if (hash) {
      const timer = window.setTimeout(() => {
        document.getElementById(hash.slice(1))?.scrollIntoView()
      }, 0)

      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(() => {
      window.scrollTo(0, 0)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [hash, pathname, search])

  return null
}
