import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Play from './pages/Play'
import Archive from './pages/Archive'

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
      {/* Logo — only on non-home pages */}
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
        <Link to="/play" className="nav-link">Play</Link>
        <Link to="/" className="nav-link">Archive</Link>
      </nav>
    </header>
  )
}

function Footer() {
  const { pathname } = useLocation()
  // Hide footer on play page — game must fill the viewport
  if (pathname === '/play') return null
  return (
    <footer style={{
      textAlign: 'center',
      padding: '24px 0',
      fontSize: 12,
      color: 'var(--color-text-tertiary)',
      borderTop: '1px solid var(--color-border)',
      fontFamily: 'var(--font-ui)',
      letterSpacing: '0.05em',
    }}>
      BadForgery — attempt greatness badly.
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
          <Route path="/archive/:day_key" element={<Archive />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
