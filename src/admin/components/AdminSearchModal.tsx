import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  X,
  ShieldCheck,
  UserCheck,
  Briefcase,
  Award,
  Trophy,
  Star,
  GraduationCap,
  BookOpen,
  Globe,
  QrCode,
  Home,
  Footprints,
  Settings,
  Sliders,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'
import type { PortfolioData } from '../../services/portfolioService'

export type SearchItem = {
  id: string
  sectionName: string
  title: string
  snippet: string
  path: string
  icon: any
}

function buildSearchIndex(data: PortfolioData): SearchItem[] {
  const items: SearchItem[] = []
  let idCount = 0
  const nextId = () => 'search-item-' + (++idCount)

  const add = (sectionName: string, title: string, snippet: string, path: string, icon: any) => {
    if (!title && !snippet) return
    items.push({
      id: nextId(),
      sectionName,
      title: title || sectionName,
      snippet: snippet || '',
      path,
      icon,
    })
  }

  // 1. Rank & Military Identity
  const officer = data.officer || {}
  add('Rank & Military Title', 'Full Rank Title', officer.rank || 'Colonel', '/admin/rank', ShieldCheck)
  add('Rank & Military Title', 'Rank Abbreviation / Short Form', (officer as any).shortRank || 'Col.', '/admin/rank', ShieldCheck)
  add('Rank & Military Title', 'Officer Display Name', officer.name || 'Henry Kwaku Badasu', '/admin/rank', ShieldCheck)
  add('Rank & Military Title', 'Formal Official Full Name', officer.formalName || '', '/admin/rank', ShieldCheck)
  add('Rank & Military Title', 'Armed Forces Branch', officer.force || 'Ghana Armed Forces', '/admin/rank', ShieldCheck)
  add('Rank & Military Title', 'Academy & Motto', (officer.academy || '') + ' - ' + (officer.motto || ''), '/admin/rank', ShieldCheck)

  // 2. Hero Section
  const hero = data.hero || {}
  add('Hero Section', 'Main Banner Title', hero.title || '', '/admin/hero', Sliders)
  add('Hero Section', 'Personal Intro', hero.personalIntro || '', '/admin/hero', Sliders)
  add('Hero Section', 'Supporting Text', hero.supportingText || '', '/admin/hero', Sliders)

  // 3. Biography
  add('Biography', 'Officer Short Bio', officer.shortBio || '', '/admin/biography', UserCheck)
  if (Array.isArray(officer.biography)) {
    officer.biography.forEach((p, idx) => {
      add('Biography', 'Biography Paragraph ' + (idx + 1), p, '/admin/biography', UserCheck)
    })
  }
  if (Array.isArray(data.biographicDetails)) {
    data.biographicDetails.forEach((detail) => {
      add('Biography Details', detail.label, detail.value, '/admin/biography', UserCheck)
    })
  }

  // 4. Career
  if (Array.isArray(data.workHistory)) {
    data.workHistory.forEach((wh) => {
      const descStr = Array.isArray(wh.description) ? wh.description.join(' ') : wh.description
      add('Career', wh.title, wh.location + ' - ' + descStr, '/admin/career', Briefcase)
    })
  }
  if (Array.isArray(data.recentAssignments)) {
    data.recentAssignments.forEach((assign) => {
      add('Career', 'Recent Assignment', assign, '/admin/career', Briefcase)
    })
  }
  if (Array.isArray(data.operations)) {
    data.operations.forEach((op) => {
      add('Career', 'Peacekeeping Operation', op, '/admin/career', Briefcase)
    })
  }

  // 5. Awards & Medals
  if (Array.isArray(data.awards)) {
    data.awards.forEach((award) => {
      add('Awards & Decorations', award.title, award.year + ' - ' + award.description, '/admin/awards', Award)
    })
  }

  // 6. Achievements
  if (Array.isArray(data.achievements)) {
    data.achievements.forEach((ach) => {
      add('Achievements', ach.title, ach.category + ' - ' + ach.description, '/admin/achievements', Trophy)
    })
  }

  // 7. Leadership / Service / Excellence
  const lead = data.leadership || {}
  if (lead.pillar1) add('Leadership Section', lead.pillar1.title, lead.pillar1.description, '/admin/leadership', Star)
  if (lead.pillar2) add('Service Section', lead.pillar2.title, lead.pillar2.description, '/admin/leadership', Star)
  if (lead.pillar3) add('Excellence Section', lead.pillar3.title, lead.pillar3.description, '/admin/leadership', Star)

  // 8. Education
  const addEdu = (list: any[], category: string) => {
    if (Array.isArray(list)) {
      list.forEach((item) => {
        const text = [item.institution, item.period, item.description].filter(Boolean).join(' - ')
        add('Education & Qualifications', item.title || category, text, '/admin/education', GraduationCap)
      })
    }
  }
  addEdu(data.militaryDiplomas, 'Military Diploma')
  addEdu(data.professionalCertificates, 'Professional Certificate')
  addEdu(data.unitarPociCertificates, 'UNITAR/POCI Certificate')

  // 9. Courses
  if (Array.isArray(data.professionalCourses)) {
    data.professionalCourses.forEach((c) => {
      add('Professional Courses', c.title, (c.institution || '') + ' - ' + (c.description || ''), '/admin/courses', BookOpen)
    })
  }

  // 10. Languages
  const lang = data.languages || {}
  if (Array.isArray(lang.spoken)) add('Languages & Interests', 'Spoken Languages', lang.spoken.join(', '), '/admin/languages', Globe)
  if (Array.isArray(lang.written)) add('Languages & Interests', 'Written Languages', lang.written.join(', '), '/admin/languages', Globe)
  if (lang.frenchLevel) add('Languages & Interests', 'French Level', lang.frenchLevel, '/admin/languages', Globe)
  if (Array.isArray(lang.hobbies)) add('Languages & Interests', 'Hobbies & Interests', lang.hobbies.join(', '), '/admin/languages', Globe)

  // 11. Welcome
  const wel = data.welcome || {}
  add('QR & Welcome Page', 'Welcome Page Title', wel.title || '', '/admin/welcome', QrCode)
  add('QR & Welcome Page', 'Welcome Subtitle', wel.subtitle || '', '/admin/welcome', QrCode)
  add('QR & Welcome Page', 'Welcome Description', wel.description || '', '/admin/welcome', QrCode)
  add('QR & Welcome Page', 'Feature Card 1', (wel.leadershipTitle || '') + ' - ' + (wel.leadershipText || ''), '/admin/welcome', QrCode)
  add('QR & Welcome Page', 'Feature Card 2', (wel.serviceTitle || '') + ' - ' + (wel.serviceText || ''), '/admin/welcome', QrCode)
  add('QR & Welcome Page', 'Feature Card 3', (wel.excellenceTitle || '') + ' - ' + (wel.excellenceText || ''), '/admin/welcome', QrCode)

  // 12. Home Cards
  if (Array.isArray(data.homeCareerCards)) {
    data.homeCareerCards.forEach((c) => {
      add('Career & Achievement Cards', c.title, c.category + ' - ' + c.description, '/admin/home-cards', Home)
    })
  }
  if (Array.isArray(data.homeAchievementCards)) {
    data.homeAchievementCards.forEach((c) => {
      add('Career & Achievement Cards', c.title, c.category + ' - ' + c.description, '/admin/home-cards', Home)
    })
  }

  // 13. Footer
  const foot = data.footer || {}
  add('Footer Settings', 'Footer Display Name', foot.displayName || '', '/admin/footer', Footprints)
  add('Footer Settings', 'Footer Display Rank', foot.displayRank || '', '/admin/footer', Footprints)
  add('Footer Settings', 'Footer Tagline', foot.tagline || '', '/admin/footer', Footprints)

  // 14. Site Settings
  const site = data.siteSettings || {}
  add('Site Settings', 'Site Title', site.siteTitle || '', '/admin/settings', Settings)
  add('Site Settings', 'Site Description', site.siteDescription || '', '/admin/settings', Settings)
  add('Site Settings', 'Contact Details', [site.contactEmail, site.contactPhone, site.contactAddress].filter(Boolean).join(' | '), '/admin/settings', Settings)

  return items
}

function renderHighlightedText(text: string, highlight: string): React.ReactNode {
  const query = highlight.trim()
  if (!query || !text) return text

  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const idx = lowerText.indexOf(lowerQuery)

  if (idx === -1) return text

  const before = text.slice(0, idx)
  const match = text.slice(idx, idx + query.length)
  const after = text.slice(idx + query.length)

  return React.createElement(
    'span',
    null,
    before,
    React.createElement(
      'mark',
      { style: { background: '#fef08a', color: '#854d0e', padding: '0 2px', borderRadius: '2px', fontWeight: 700 } },
      match
    ),
    renderHighlightedText(after, query)
  )
}

const itemContainerStyle = (isSelected: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '12px 14px',
  borderRadius: '10px',
  cursor: 'pointer',
  background: isSelected ? '#f0fdf4' : 'transparent',
  border: isSelected ? '1px solid #166534' : '1px solid transparent',
  transition: 'all 0.15s ease',
})

const iconBoxStyle = (isSelected: boolean): React.CSSProperties => ({
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  background: isSelected ? '#166534' : '#e2e8f0',
  color: isSelected ? '#ffffff' : '#334155',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  marginTop: '2px',
})

export const AdminSearchModal: React.FC<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  const { data } = usePortfolio()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const searchIndex = React.useMemo(() => buildSearchIndex(data), [data])

  const filteredResults = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return searchIndex.filter((item) => {
      return (
        item.sectionName.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.snippet.toLowerCase().includes(q)
      )
    })
  }, [query, searchIndex])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (filteredResults.length > 0 ? (prev + 1) % filteredResults.length : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (filteredResults.length > 0 ? (prev - 1 + filteredResults.length) % filteredResults.length : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredResults[selectedIndex]) {
          handleSelect(filteredResults[selectedIndex].path)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredResults, selectedIndex])

  const handleSelect = (path: string) => {
    onClose()
    navigate(path)
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px',
        paddingLeft: '16px',
        paddingRight: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(85vh - 80px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', gap: '12px', background: '#f8fafc' }}>
          <Search size={22} style={{ color: '#1e3a8a', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search words anywhere e.g. Col, Peacekeeping, Operations, Badasu..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '1.05rem',
              fontWeight: 500,
              background: 'transparent',
              color: '#0f172a',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
            >
              <X size={18} />
            </button>
          )}
          <span style={{ fontSize: '11px', fontWeight: 600, background: '#e2e8f0', color: '#475569', padding: '3px 8px', borderRadius: '6px' }}>
            ESC to close
          </span>
        </div>

        {/* Results Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {!query.trim() ? (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Sparkles size={24} />
              </div>
              <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>Global Dashboard Search Engine</h4>
              <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748b' }}>
                Type any word (e.g. <strong>Col</strong>, <strong>Brigadier</strong>, <strong>UNIFIL</strong>, <strong>Peacekeeping</strong>) to find and jump straight to that section.
              </p>

              <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {['Col', 'Brig. General', 'Peacekeeping', 'Command', 'Lebanon', 'Education'].map((suggest) => (
                  <button
                    key={suggest}
                    type="button"
                    onClick={() => setQuery(suggest)}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '20px',
                      padding: '4px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    Search "{suggest}"
                  </button>
                ))}
              </div>
            </div>
          ) : filteredResults.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b' }}>
              <p style={{ fontSize: '0.95rem', margin: '0 0 4px' }}>No matches found for "<strong>{query}</strong>"</p>
              <small style={{ fontSize: '0.8rem' }}>Try searching another keyword, rank, or section title.</small>
            </div>
          ) : (
            <div>
              <div style={{ padding: '6px 12px 10px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                <span>Found {filteredResults.length} matching result{filteredResults.length > 1 ? 's' : ''}</span>
                <span>Press Enter to select</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filteredResults.map((item, idx) => {
                  const isSelected = idx === selectedIndex
                  const Icon = item.icon
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item.path)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={itemContainerStyle(isSelected)}
                    >
                      <div style={iconBoxStyle(isSelected)}>
                        {React.createElement(Icon, { size: 18 })}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                            {item.sectionName}
                          </span>
                          <ChevronRight size={14} style={{ color: '#94a3b8' }} />
                        </div>
                        <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                          {renderHighlightedText(item.title, query)}
                        </strong>
                        <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.4 }}>
                          {renderHighlightedText(item.snippet, query)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
