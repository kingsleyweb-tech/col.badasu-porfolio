// Visitor session timing for the public pages. The server decides access: every protected request
// checks the stored session, which ends exactly 30 minutes after the code was entered. What runs
// here only shows the remaining time, warns before the end and leaves the page when it ends.
//
// The remaining time is counted from the server's own clock (serverNow in each response) plus a
// monotonic timer, so changing the device clock neither extends nor shortens it.

export type PublicSession = { kind: 'visitor' | 'admin'; expiresAt: number; serverNow: number }
export type SessionClock = PublicSession & { perf: number }

/** Reached zero this long ago before the page leaves, so the server has certainly ended it too. */
export const EXPIRY_MARGIN_MS = 1500
/** Warnings are shown at 5, 4, 3, 2 and 1 minute(s) remaining. */
export const WARNING_MINUTES = [5, 4, 3, 2, 1]

export const toClock = (session: PublicSession): SessionClock => ({ ...session, perf: performance.now() })

export const remainingMs = (clock: SessionClock) => clock.expiresAt - (clock.serverNow + (performance.now() - clock.perf))

/** Session status for the open page. Read-only: checking never extends the session. */
export async function fetchAccessStatus(): Promise<({ authenticated: true; viewer: PublicSession['kind'] } & Omit<PublicSession, 'kind'>) | { authenticated: false }> {
  const res = await fetch('/api/access', { credentials: 'same-origin', cache: 'no-store' })
  if (!res.ok) throw new Error(`Access status failed (${res.status})`)
  return res.json()
}

/** Leaves the protected portfolio for the access page, returning here after the code is entered. */
export function goToAccessPage(reason?: 'expired' | 'revoked') {
  const next = window.location.pathname + window.location.search + window.location.hash
  const params = new URLSearchParams({ next })
  if (reason) params.set('reason', reason)
  window.location.replace(`/access?${params.toString()}`)
}

// ─── Other tabs ────────────────────────────────────────────────────────────────
// All tabs share one cookie and one server expiry; when one tab sees the session end it tells the
// others so they leave at the same moment instead of waiting for their next check.

const CHANNEL = 'pf-access'

export function announceSessionEnded() {
  try {
    const channel = new BroadcastChannel(CHANNEL)
    channel.postMessage('ended')
    channel.close()
  } catch {
    // BroadcastChannel unavailable: the other tabs still find out on their next server check
  }
}

export function onSessionEndedElsewhere(callback: () => void): () => void {
  try {
    const channel = new BroadcastChannel(CHANNEL)
    channel.onmessage = (event) => event.data === 'ended' && callback()
    return () => channel.close()
  } catch {
    return () => {}
  }
}

// ─── Warnings ──────────────────────────────────────────────────────────────────

/**
 * The warning to show now (minutes remaining, rounded up), or null. Each mark is shown once, as the
 * time crosses it; opening the page with 3:30 left shows the 4-minute warning, never the 5-minute one.
 */
export function nextWarning(remaining: number, shown: readonly number[]): number | null {
  if (remaining <= 0) return null
  const minutes = Math.ceil(remaining / 60000)
  return WARNING_MINUTES.includes(minutes) && !shown.includes(minutes) ? minutes : null
}

/** The marks to record after showing `minutes`: it and every earlier (larger) mark. */
export const markShown = (shown: readonly number[], minutes: number) => [...new Set([...shown, ...WARNING_MINUTES.filter((m) => m >= minutes)])]

export const warningMessage = (minutes: number) => `You will be automatically logged out in ${minutes} minute${minutes === 1 ? '' : 's'}.`

// Shown marks are kept per tab and per session (keyed by its expiry), so a refresh does not repeat
// them. They are only numbers: nothing here grants or describes access.
const warnedKey = (expiresAt: number) => `pf-warned-${expiresAt}`

export function readShownWarnings(expiresAt: number): number[] {
  try {
    const value = JSON.parse(sessionStorage.getItem(warnedKey(expiresAt)) || '[]')
    return Array.isArray(value) ? value.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}

export function saveShownWarnings(expiresAt: number, shown: readonly number[]) {
  try {
    sessionStorage.setItem(warnedKey(expiresAt), JSON.stringify(shown))
  } catch {
    // Storage unavailable: warnings could repeat after a refresh, nothing else changes
  }
}
