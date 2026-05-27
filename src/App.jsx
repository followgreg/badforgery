import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Play from './pages/Play'
import Archive from './pages/Archive'

function Header() {
  return (
    <header
      className="flex items-center justify-between px-4 py-4 border-b"
      style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
    >
      <Link
        to="/"
        className="text-2xl font-bold italic transition-opacity hover:opacity-80"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)' }}
      >
        BadForgery
      </Link>
      <nav className="flex gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        <Link to="/play" className="hover:text-white transition-colors">Play</Link>
        <Link to="/" className="hover:text-white transition-colors">Archive</Link>
      </nav>
    </header>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-dvh" style={{ background: 'var(--bg)' }}>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<Play />} />
          <Route path="/archive/:day_key" element={<Archive />} />
        </Routes>
        <footer
          className="text-center py-6 text-xs border-t"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          BadForgery — attempt greatness badly.
        </footer>
      </div>
    </BrowserRouter>
  )
}
