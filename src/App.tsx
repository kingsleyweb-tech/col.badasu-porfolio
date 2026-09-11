import { useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PortfolioProvider } from './context/PortfolioContext'
import { UploadProvider } from './context/UploadContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Footer } from './components/Footer'
import { Navbar } from './components/Navbar'
import { RouteScrollToTop } from './components/RouteScrollToTop'
import { ScrollToTopButton } from './components/ScrollToTopButton'
import { QrModal } from './components/QrModal'
import { GlobalUploadToast } from './admin/components/GlobalUploadToast'

// Public Pages
import { Achievements } from './pages/Achievements'
import { Awards } from './pages/Awards'
import { Biography } from './pages/Biography'
import { Career } from './pages/Career'
import { Education } from './pages/Education'
import { Gallery } from './pages/Gallery'
import { Home } from './pages/Home'
import { Welcome } from './pages/Welcome'

// Admin Shell & Pages
import { AdminLayout } from './admin/AdminLayout'
import { AdminLogin } from './admin/pages/AdminLogin'
import { MainDashboard } from './admin/pages/MainDashboard'
import { EveryoneSection } from './admin/pages/EveryoneSection'
import { HeroAdmin } from './admin/pages/HeroAdmin'
import { BiographyAdmin } from './admin/pages/BiographyAdmin'
import { CareerAdmin } from './admin/pages/CareerAdmin'
import { AwardsAdmin } from './admin/pages/AwardsAdmin'
import { EducationAdmin } from './admin/pages/EducationAdmin'
import { CoursesAdmin } from './admin/pages/CoursesAdmin'
import { LanguagesAdmin } from './admin/pages/LanguagesAdmin'
import { LeadershipAdmin } from './admin/pages/LeadershipAdmin'
import { GalleryAdmin } from './admin/pages/GalleryAdmin'
import { WelcomeAdmin } from './admin/pages/WelcomeAdmin'
import { SiteSettingsAdmin } from './admin/pages/SiteSettingsAdmin'
import { UsersAdmin } from './admin/pages/UsersAdmin'
import { AchievementsAdmin } from './admin/pages/AchievementsAdmin'
import { HomeCardsAdmin } from './admin/pages/HomeCardsAdmin'
import { FooterAdmin } from './admin/pages/FooterAdmin'
import { RankAdmin } from './admin/pages/RankAdmin'

const footerHiddenRoutes = new Set(['/awards', '/career', '/biography', '/welcome'])

function App() {
  return (
    <AuthProvider>
      <PortfolioProvider>
        <UploadProvider>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </UploadProvider>
      </PortfolioProvider>
    </AuthProvider>
  )
}

function AppShell() {
  const { pathname } = useLocation()
  const [qrModalOpen, setQrModalOpen] = useState(false)

  const isAdminRoute = pathname.startsWith('/admin')
  const showFooter = !isAdminRoute && !footerHiddenRoutes.has(pathname)
  const showNavbar = !isAdminRoute && pathname !== '/welcome'
  const showScrollTop = !isAdminRoute && pathname !== '/welcome'

  return (
    <>
      <RouteScrollToTop />
      {showNavbar && <Navbar />}
      <main className={isAdminRoute ? 'is-admin-view' : ''}>
        <Routes>
          {/* Public Portfolio Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/biography" element={<Biography />} />
          <Route path="/career" element={<Career />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/awards" element={<Awards />} />
          <Route path="/education" element={<Education />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/gallery/:collectionSlug" element={<Gallery />} />

          {/* Admin Unprotected Route */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Protected Routes Shell */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<MainDashboard />} />
            <Route path="everyone" element={<EveryoneSection />} />
            <Route path="hero" element={<HeroAdmin />} />
            <Route path="biography" element={<BiographyAdmin />} />
            <Route path="career" element={<CareerAdmin />} />
            <Route path="awards" element={<AwardsAdmin />} />
            <Route path="education" element={<EducationAdmin />} />
            <Route path="courses" element={<CoursesAdmin />} />
            <Route path="languages" element={<LanguagesAdmin />} />
            <Route path="leadership" element={<LeadershipAdmin />} />
            <Route path="gallery" element={<GalleryAdmin />} />
            <Route path="welcome" element={<WelcomeAdmin />} />
            <Route path="rank" element={<RankAdmin />} />
            <Route path="settings" element={<SiteSettingsAdmin />} />
            <Route path="achievements" element={<AchievementsAdmin />} />
            <Route path="home-cards" element={<HomeCardsAdmin />} />
            <Route path="footer" element={<FooterAdmin />} />
            <Route path="users" element={<UsersAdmin />} />
          </Route>
        </Routes>
      </main>
      {showFooter && <Footer onQrModalOpen={() => setQrModalOpen(true)} />}
      {showScrollTop && <ScrollToTopButton />}

      <QrModal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} />
      {/* Global upload progress toast — visible on any admin page */}
      <GlobalUploadToast />
    </>
  )
}

export default App
