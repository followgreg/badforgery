import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Play from './pages/Play'
import Archive from './pages/Archive'

function Header() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 32px',
        background: 'transparent',
      }}
    >
      <nav style={{ display: 'flex', gap: 28 }}>
        <Link to="/play" className="nav-link">Play</Link>
        <Link to="/" className="nav-link">Archive</Link>
      </nav>
    </header>
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
      </div>
    </BrowserRouter>
  )
}
