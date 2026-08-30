import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Clock, ArrowRight } from 'lucide-react'
import { OptimizedImage } from '../components/OptimizedImage'
import { brandAssets, welcomeFeatureImages } from '../data/officerData'

export function Welcome() {
  const [seconds, setSeconds] = useState(9)
  const navigate = useNavigate()
  const timerRef = useRef<number | null>(null)
  const shouldReduceMotion = useReducedMotion()

  const navigateToHome = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
    }
    navigate('/')
  }

  useEffect(() => {
    // 9-second automatic redirect countdown
    timerRef.current = window.setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            window.clearInterval(timerRef.current)
          }
          navigate('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
      }
    }
  }, [navigate])

  const formatSeconds = (sec: number) => {
    return sec < 10 ? `0${sec}` : `${sec}`
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.15,
        delayChildren: 0.1
      }
    }
  }

  const fadeUpVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' as const }
    }
  }

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6 }
    }
  }

  return (
    <div className="welcome-page-container">
      {/* Decorative Bottom Arc */}
      <div className="welcome-page__bottom-arc" aria-hidden="true" />

      {/* Top Header GAF Logo */}
      <div className="welcome-page__top-bar">
        <OptimizedImage
          asset={brandAssets.gafLogo}
          className="welcome-page__gaf-logo-wrap"
          imageClassName="welcome-page__gaf-logo"
          loading="eager"
          sizes="72px"
        />
      </div>

      <motion.main 
        className="welcome-page__content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Top Gold Star decoration */}
        <motion.div variants={fadeInVariants} className="welcome-page__star-decor">
          ★
        </motion.div>

        {/* Center Shield/Crest Logo */}
        <motion.div variants={fadeUpVariants} className="welcome-page__crest-wrapper">
          <img 
            src="/pwa.png" 
            alt="Colonel Badasu Crest" 
            className="welcome-page__crest-logo" 
          />
        </motion.div>

        {/* Decorative Divider */}
        <motion.div variants={fadeInVariants} className="welcome-page__divider">
          <div className="divider-line" />
          <span className="divider-star">★</span>
          <div className="divider-line" />
        </motion.div>

        {/* Headings */}
        <motion.div variants={fadeUpVariants} className="welcome-page__headers">
          <span className="welcome-page__pre-title">Welcome to the</span>
          <h1 className="welcome-page__title">OFFICIAL PORTFOLIO</h1>
          <span className="welcome-page__of-title">OF</span>
          <h2 className="welcome-page__name">COLONEL BADASU</h2>
        </motion.div>

        {/* Introductory Sentence */}
        <motion.p variants={fadeUpVariants} className="welcome-page__intro-text">
          This platform provides an overview of my journey, leadership, service, achievements and commitment to excellence.
        </motion.p>

        {/* Three Compact Features */}
        <motion.div variants={fadeInVariants} className="welcome-page__features">
          <div className="welcome-feature-card">
            <div className="welcome-feature-card__img-container">
              <OptimizedImage asset={welcomeFeatureImages.leadership} sizes="32px" />
            </div>
            <h3>LEADERSHIP</h3>
            <p>Leading with vision, integrity and purpose.</p>
          </div>

          <div className="welcome-feature-card">
            <div className="welcome-feature-card__img-container">
              <OptimizedImage asset={welcomeFeatureImages.service} sizes="32px" />
            </div>
            <h3>SERVICE</h3>
            <p>Dedicated to duty, country and people.</p>
          </div>

          <div className="welcome-feature-card">
            <div className="welcome-feature-card__img-container">
              <OptimizedImage asset={welcomeFeatureImages.excellence} sizes="32px" />
            </div>
            <h3>EXCELLENCE</h3>
            <p>Striving for the highest standards in all I do.</p>
          </div>
        </motion.div>

        {/* Main CTA Action Button */}
        <motion.div variants={fadeUpVariants} className="welcome-page__cta-wrapper">
          <button 
            onClick={navigateToHome} 
            className="welcome-cta-btn"
            type="button"
          >
            <div className="welcome-cta-btn__content">
              <span className="welcome-cta-btn__sub">READ EVERYTHING ABOUT</span>
              <span className="welcome-cta-btn__main">COLONEL BADASU</span>
            </div>
            <ArrowRight size={20} className="welcome-cta-btn__icon" />
          </button>
        </motion.div>

        {/* Redirect Countdown Timer */}
        <motion.div variants={fadeInVariants} className="welcome-page__countdown">
          <Clock size={16} className="welcome-page__countdown-icon" />
          <span className="welcome-page__countdown-text">
            You will be redirected automatically in
          </span>
          <span className="welcome-page__countdown-number-ring">
            {formatSeconds(seconds)}
          </span>
          <span className="welcome-page__countdown-text">
            seconds
          </span>
        </motion.div>
      </motion.main>
    </div>
  )
}
