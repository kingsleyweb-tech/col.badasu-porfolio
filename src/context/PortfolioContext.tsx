import React, { createContext, useContext, useEffect, useState } from 'react'
import type { PortfolioData } from '../services/portfolioService'
import {
  defaultPortfolioData,
  fetchPortfolioContent,
  savePortfolioContent,
  subscribePortfolioContent
} from '../services/portfolioService'

type PortfolioContextType = {
  data: PortfolioData
  loading: boolean
  updatePortfolio: (updated: Partial<PortfolioData>) => Promise<void>
  refreshData: () => Promise<void>
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined)

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<PortfolioData>(defaultPortfolioData)
  const [loading, setLoading] = useState<boolean>(true)

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
    const next = { ...data, ...updated }
    setData(next)
    await savePortfolioContent(updated)
  }

  const refreshData = async () => {
    const refreshed = await fetchPortfolioContent()
    setData(refreshed)
  }

  return (
    <PortfolioContext.Provider value={{ data, loading, updatePortfolio, refreshData }}>
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
