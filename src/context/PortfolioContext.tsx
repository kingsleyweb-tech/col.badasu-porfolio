import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { PortfolioData } from '../services/portfolioService'
import {
  AccessRequiredError,
  defaultPortfolioData,
  fetchPortfolioContent,
  fetchPublicPortfolio,
  savePortfolioContent,
  subscribePortfolioContent,
  subscribePublicChanges,
} from '../services/portfolioService'
import type { SessionClock } from '../services/visitorSession'
import {
  EXPIRY_MARGIN_MS,
  announceSessionEnded,
  fetchAccessStatus,
  goToAccessPage,
  onSessionEndedElsewhere,
  remainingMs,
  toClock,
} from '../services/visitorSession'
import { useAuth } from './AuthContext'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type PortfolioContextType = {
  data: PortfolioData
  loading: boolean
  saveStatus: SaveStatus
  saveError: string | null
  /** Public pages: the current session, timed by the server's clock (null on admin pages) */
  session: SessionClock | null
  updatePortfolio: (updated: Partial<PortfolioData>) => Promise<void>
  refreshData: () => Promise<void>
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined)

/** How often an open page asks the server whether its session is still valid. */
const SESSION_CHECK_MS = 60 * 1000

/**
 * source="admin":  the signed-in administrator reads Firestore directly, with live updates.
 * source="public": portfolio pages load the content from /api/portfolio, which requires a valid
 *                  visitor session. The session ends exactly 30 minutes after the code was entered
 *                  (the server enforces this on every request; activity never extends it). The page
 *                  leaves for the access page when it ends, when the server stops accepting it, or
 *                  as soon as the administrator changes the code, disables access or revokes
 *                  sessions. Content saved in the admin dashboard is re-fetched immediately.
 */
export const PortfolioProvider: React.FC<{ source: 'public' | 'admin'; children: React.ReactNode }> = ({ source, children }) => {
  const { user } = useAuth()
  const [data, setData] = useState<PortfolioData>(defaultPortfolioData)
  const [loading, setLoading] = useState<boolean>(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [session, setSession] = useState<SessionClock | null>(null)
  const hadSession = useRef(false)
  const ended = useRef(false)

  /** Hides the content at once and leaves for the access page (once). */
  const endSession = useCallback((reason: 'expired' | 'revoked', notifyOtherTabs = true) => {
    if (ended.current) return
    ended.current = true
    setLoading(true)
    setData(defaultPortfolioData)
    setSession(null)
    if (notifyOtherTabs) announceSessionEnded()
    goToAccessPage(reason)
  }, [])

  /** Keeps the clock in step with the server, without re-rendering when nothing changed. */
  const updateClock = useCallback((next: SessionClock) => {
    setSession((current) =>
      current && current.kind === next.kind && current.expiresAt === next.expiresAt && Math.abs(remainingMs(current) - remainingMs(next)) < 2000 ? current : next
    )
  }, [])

  const loadPublic = useCallback(async (reason?: 'expired' | 'revoked') => {
    try {
      const { data: content, session: current } = await fetchPublicPortfolio()
      if (ended.current) return
      hadSession.current = true
      setData(content)
      updateClock(toClock(current))
      setLoading(false)
    } catch (err) {
      if (err instanceof AccessRequiredError) {
        if (hadSession.current) endSession(reason ?? 'expired')
        else goToAccessPage()
      } else if (!hadSession.current) {
        // The server could not confirm access: the access page explains that it is unavailable
        console.error('[Portfolio] Could not load content:', err)
        goToAccessPage()
      }
    }
  }, [endSession, updateClock])

  // Public pages: first load, content/access changes, other tabs, and the regular server check
  useEffect(() => {
    if (source !== 'public') return
    let active = true

    loadPublic()

    const stop = subscribePublicChanges((kind) => {
      if (active) loadPublic(kind === 'access' ? 'revoked' : 'expired')
    })
    const stopTabs = onSessionEndedElsewhere(() => active && endSession('expired', false))

    // Read-only status check (never extends the session). Catches a sleeping device or a paused
    // timer, a session ended in another tab, and a device clock that was changed.
    const check = async () => {
      if (!active || !hadSession.current || ended.current) return
      try {
        const status = await fetchAccessStatus()
        if (!active) return
        if (status.authenticated) updateClock(toClock({ kind: status.viewer, expiresAt: status.expiresAt, serverNow: status.serverNow }))
        else endSession('expired')
      } catch {
        // Offline or the server is unreachable: the local countdown still ends the session on time
      }
    }
    const interval = window.setInterval(check, SESSION_CHECK_MS)
    const onVisible = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', check)

    return () => {
      active = false
      stop()
      stopTabs()
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', check)
    }
  }, [source, loadPublic, endSession, updateClock])

  // Public pages: leave exactly when the session ends. The expiry comes from the server and is
  // never moved by anything the visitor does.
  useEffect(() => {
    if (source !== 'public' || !session) return
    const tick = () => {
      if (remainingMs(session) <= -EXPIRY_MARGIN_MS) endSession('expired')
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [source, session, endSession])

  // Admin dashboard
  useEffect(() => {
    if (source !== 'admin') return
    if (!user) {
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    const unsubscribe = subscribePortfolioContent(
      (remoteData) => {
        if (!active) return
        setData(remoteData)
        setLoading(false)
      },
      () => active && setLoading(false)
    )
    return () => {
      active = false
      unsubscribe()
    }
  }, [source, user])

  const updatePortfolio = async (updated: Partial<PortfolioData>) => {
    // Optimistic UI update
    const previous = data
    setData({ ...data, ...updated })
    setSaveStatus('saving')
    setSaveError(null)

    try {
      await savePortfolioContent(updated)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      setData(previous)
      const message = err instanceof Error ? err.message : 'Failed to save. Check your connection.'
      setSaveStatus('error')
      setSaveError(message)
      console.error('[Portfolio] Save failed:', err)
      throw err
    }
  }

  const refreshData = async () => {
    if (source === 'public') await loadPublic()
    else setData(await fetchPortfolioContent())
  }

  return (
    <PortfolioContext.Provider value={{ data, loading, saveStatus, saveError, session, updatePortfolio, refreshData }}>
      {children}
    </PortfolioContext.Provider>
  )
}

export const usePortfolio = () => {
  const context = useContext(PortfolioContext)
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider')
  }
  return context
}
