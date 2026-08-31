import { useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './components/Footer'
import { Navbar } from './components/Navbar'
import { RouteScrollToTop } from './components/RouteScrollToTop'
import { ScrollToTopButton } from './components/ScrollToTopButton'
import { QrModal } from './components/QrModal'
import { Achievements } from './pages/Achievements'
import { Awards } from './pages/Awards'
import { Biography } from './pages/Biography'
import { Career } from './pages/Career'
import { Education } from './pages/Education'
import { Gallery } from './pages/Gallery'
import { Home } from './pages/Home'
import { Welcome } from './pages/Welcome'

const footerHiddenRoutes = new Set(['/awards', '/career', '/biography', '/welcome'])

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

function AppShell() {
  const { pathname } = useLocation()
  const [qrModalOpen, setQrModalOpen] = useState(false)
  
  const showFooter = !footerHiddenRoutes.has(pathname)
  const showNavbar = pathname !== '/welcome'
  const showScrollTop = pathname !== '/welcome'

  return (
    <>
      <RouteScrollToTop />
      {showNavbar && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/biography" element={<Biography />} />
          <Route path="/career" element={<Career />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/awards" element={<Awards />} />
          <Route path="/education" element={<Education />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/gallery/:collectionSlug" element={<Gallery />} />
        </Routes>
      </main>
      {showFooter && <Footer onQrModalOpen={() => setQrModalOpen(true)} />}
      {showScrollTop && <ScrollToTopButton />}
      
      <QrModal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} />
    </>
  )
}

export default App
