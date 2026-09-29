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
import { useAuth } from './AuthContext'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type PortfolioContextType = {
  data: PortfolioData
  loading: boolean
  saveStatus: SaveStatus
  saveError: string | null
  updatePortfolio: (updated: Partial<PortfolioData>) => Promise<void>
  refreshData: () => Promise<void>
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined)

/** Leaves the protected portfolio for the access page, returning here after the code is entered. */
function goToAccessPage(reason?: 'expired' | 'revoked') {
  const next = window.location.pathname + window.location.search + window.location.hash
  const params = new URLSearchParams({ next })
  if (reason) params.set('reason', reason)
  window.location.replace(`/access?${params.toString()}`)
}

/**
 * source="admin":  the signed-in administrator reads Firestore directly, with live updates.
 * source="public": portfolio pages load the content from /api/portfolio, which requires a valid
 *                  visitor session. The page leaves for the access page when the one-hour session
 *                  ends, or as soon as the administrator changes the code, disables access or
 *                  revokes sessions. Content saved in the admin dashboard is re-fetched immediately.
 */
export const PortfolioProvider: React.FC<{ source: 'public' | 'admin'; children: React.ReactNode }> = ({ source, children }) => {
  const { user } = useAuth()
  const [data, setData] = useState<PortfolioData>(defaultPortfolioData)
  const [loading, setLoading] = useState<boolean>(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const hadSession = useRef(false)

  const loadPublic = useCallback(async (reason?: 'expired' | 'revoked') => {
    try {
      const { data: content, session } = await fetchPublicPortfolio()
      hadSession.current = true
      setData(content)
      setLoading(false)
      return session
    } catch (err) {
      if (err instanceof AccessRequiredError) goToAccessPage(hadSession.current ? reason ?? 'expired' : undefined)
      else if (!hadSession.current) {
        // The server could not confirm access: the access page explains that it is unavailable
        console.error('[Portfolio] Could not load content:', err)
        goToAccessPage()
      }
      return null
    }
  }, [])

  // Public pages
  useEffect(() => {
    if (source !== 'public') return
    let active = true
    let expiryTimer: number | undefined

    const schedule = (expiresAt?: number) => {
      window.clearTimeout(expiryTimer)
      // The session is never extended: the page locks exactly when it ends
      if (expiresAt) expiryTimer = window.setTimeout(() => goToAccessPage('expired'), Math.max(0, expiresAt - Date.now()) + 500)
    }

    loadPublic().then((session) => active && schedule(session?.expiresAt))

    const stop = subscribePublicChanges((kind) => {
      if (!active) return
      loadPublic(kind === 'access' ? 'revoked' : 'expired').then((session) => active && session && schedule(session.expiresAt))
    })

    // Re-check when the visitor comes back to the tab (a sleeping device may have missed the timer)
    const onVisible = () => {
      if (document.visibilityState === 'visible' && active) loadPublic().then((session) => active && session && schedule(session.expiresAt))
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      active = false
      window.clearTimeout(expiryTimer)
      stop()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [source, loadPublic])

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
    <PortfolioContext.Provider value={{ data, loading, saveStatus, saveError, updatePortfolio, refreshData }}>
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
