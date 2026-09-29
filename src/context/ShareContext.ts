import { createContext, useContext } from 'react'

/** Lets the nav, menu and footer open the portfolio QR / share dialog. */
export const ShareContext = createContext<() => void>(() => {})

export const useOpenShare = () => useContext(ShareContext)
