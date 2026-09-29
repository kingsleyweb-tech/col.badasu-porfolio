import { useEffect, useState } from 'react'
import { IconArrowUp } from './site/icons'

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      className={`totop ${visible ? 'is-visible' : ''}`}
      type="button"
      aria-label="Scroll to top"
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <IconArrowUp size={22} />
    </button>
  )
}
