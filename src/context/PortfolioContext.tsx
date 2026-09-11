import React, { createContext, useContext, useEffect, useState } from 'react'
import type { PortfolioData } from '../services/portfolioService'
import {
  defaultPortfolioData,
  fetchPortfolioContent,
  savePortfolioContent,
  subscribePortfolioContent
} from '../services/portfolioService'

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

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<PortfolioData>(defaultPortfolioData)
  const [loading, setLoading] = useState<boolean>(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    fetchPortfolioContent().then((initial) => {
      if (active) {
        setData(initial)
        setLoading(false)
      }
    })

    const unsubscribe = subscribePortfolioContent((remoteData) => {
      if (active) {
        setData(remoteData)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const updatePortfolio = async (updated: Partial<PortfolioData>) => {
    // Optimistic UI update
    const previous = data
    const next = { ...data, ...updated }
    setData(next)
    setSaveStatus('saving')
    setSaveError(null)

    try {
      await savePortfolioContent(updated)
      setSaveStatus('saved')
      // Reset to idle after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      // Roll back the optimistic update
      setData(previous)
      const message = err instanceof Error ? err.message : 'Failed to save. Check your connection.'
      setSaveStatus('error')
      setSaveError(message)
      console.error('[Portfolio] Save failed:', err)
      throw err
    }
  }

  const refreshData = async () => {
    const refreshed = await fetchPortfolioContent()
    setData(refreshed)
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
