import { BrowserRouter, Routes, Route, Link, NavLink, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Play from './pages/Play'
import Archive from './pages/Archive'
import ArchiveListing from './pages/ArchiveListing'

function navClass({ isActive }) {
  return isActive ? 'nav-link nav-link-active' : 'nav-link'
}

function Header() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: isHome ? 'transparent' : 'var(--color-bg)',
        borderBottom: isHome ? 'none' : '1px solid var(--color-border)',
      }}
    >
      {/* Logo — only visible on non-home pages */}
      {!isHome ? (
        <Link to="/" style={{ textDecoration: 'none', lineHeight: 1 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 20,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.01em',
          }}>
            BadForgery
          </span>
        </Link>
      ) : (
        <div />
      )}

      <nav style={{ display: 'flex', gap: 28 }}>
        <NavLink to="/play" className={navClass}>Play</NavLink>
        {/* Archive goes to the full listing page */}
        <NavLink to="/archive" className={navClass}>Archive</NavLink>
      </nav>
    </header>
  )
}

function Footer() {
  const { pathname } = useLocation()
  if (pathname === '/play') return null
  return (
    <footer style={{
      textAlign: 'center',
      padding: '20px 24px',
      borderTop: '1px solid var(--color-border)',
      fontFamily: 'var(--font-ui)',
    }}>
      <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
        ©2026 Never Stop Creating, LLC
      </p>
      <a
        href="mailto:info@neverstopcreatingllc.com"
        style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textDecoration: 'none' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-tertiary)'}
      >
        info@neverstopcreatingllc.com
      </a>
    </footer>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--color-bg)' }}>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<Play />} />
          <Route path="/archive" element={<ArchiveListing />} />
          <Route path="/archive/:day_key" element={<Archive />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
