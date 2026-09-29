import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/portfolio.css'
import './styles/admin.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Register PWA service worker for offline capabilities and app installation
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
