import { useEffect, useRef, useState } from 'react'
import { usePortfolio } from '../../context/PortfolioContext'
import { markShown, nextWarning, readShownWarnings, remainingMs, saveShownWarnings, warningMessage } from '../../services/visitorSession'

const TOAST_MS = 8000

const formatRemaining = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/**
 * Remaining access time and the warnings before it ends (portfolio pages). Display only: the server
 * keeps the session's fixed end time, and nothing here (including dismissing a warning) changes it.
 * The administrator's preview has no visitor session, so it shows a label instead.
 */
export function SessionStatus() {
  const { session } = usePortfolio()
  const [remaining, setRemaining] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!session || session.kind !== 'visitor') return
    let shown = readShownWarnings(session.expiresAt)

    const tick = () => {
      const left = remainingMs(session)
      setRemaining(left)
      const minutes = nextWarning(left, shown)
      if (minutes !== null) {
        shown = markShown(shown, minutes)
        saveShownWarnings(session.expiresAt, shown)
        setToast(warningMessage(minutes))
        window.clearTimeout(toastTimer.current)
        toastTimer.current = window.setTimeout(() => setToast(null), TOAST_MS)
      }
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [session])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  if (!session) return null

  if (session.kind === 'admin') {
    return (
      <div className="pf-session is-admin" title="You are viewing the portfolio as the administrator">
        Admin preview
      </div>
    )
  }

  const low = remaining !== null && remaining <= 5 * 60 * 1000
  return (
    <>
      <div className={`pf-session ${low ? 'is-low' : ''}`} title="Access ends 30 minutes after the code was entered">
        <span className="sr-only">Access time remaining: </span>
        <b>{remaining === null ? '—' : formatRemaining(remaining)}</b> left
      </div>
      <div className="pf-session-toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="pf-session-toast">
            <span>{toast}</span>
            <button type="button" onClick={() => setToast(null)} aria-label="Dismiss">×</button>
          </div>
        )}
      </div>
    </>
  )
}
