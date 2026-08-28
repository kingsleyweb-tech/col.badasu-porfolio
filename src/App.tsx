import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Footer } from './components/Footer'
import { Navbar } from './components/Navbar'
import { Achievements } from './pages/Achievements'
import { Awards } from './pages/Awards'
import { Biography } from './pages/Biography'
import { Career } from './pages/Career'
import { Education } from './pages/Education'
import { Gallery } from './pages/Gallery'
import { Home } from './pages/Home'

function App() {
  return (
    <BrowserRouter>
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
      <Footer />
    </BrowserRouter>
  )
}

export default App
