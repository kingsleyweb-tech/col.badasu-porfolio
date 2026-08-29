import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './components/Footer'
import { Navbar } from './components/Navbar'
import { RouteScrollToTop } from './components/RouteScrollToTop'
import { ScrollToTopButton } from './components/ScrollToTopButton'
import { Achievements } from './pages/Achievements'
import { Awards } from './pages/Awards'
import { Biography } from './pages/Biography'
import { Career } from './pages/Career'
import { Education } from './pages/Education'
import { Gallery } from './pages/Gallery'
import { Home } from './pages/Home'

const footerHiddenRoutes = new Set(['/awards', '/career', '/biography'])

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

function AppShell() {
  const { pathname } = useLocation()
  const showFooter = !footerHiddenRoutes.has(pathname)

  return (
    <>
      <RouteScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/biography" element={<Biography />} />
          <Route path="/career" element={<Career />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/awards" element={<Awards />} />
          <Route path="/education" element={<Education />} />
          <Route path="/gallery" element={<Gallery />} />
        </Routes>
      </main>
      {showFooter && <Footer />}
      <ScrollToTopButton />
    </>
  )
}

export default App
