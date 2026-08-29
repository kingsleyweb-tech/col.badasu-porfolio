import { useEffect, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function RouteScrollToTop() {
  const { pathname, search } = useLocation()

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
    window.scrollTo(0, 0)

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo(0, 0)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [pathname, search])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.scrollTo(0, 0)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [pathname, search])

  return null
}
