import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchArtworkForDay } from '../lib/artwork'
import { getTodayKey } from '../lib/storage'
import ArchivePicker from '../components/ArchivePicker'

// Strips nationality/dates from AIC artist_display e.g. "Pablo Picasso (Spanish, 1881–1973)" → "Pablo Picasso"
function parseArtistName(display) {
  if (!display) return 'Unknown Artist'
  return display.split('(')[0].trim()
}

// ── Decorative corner bracket (ghost of a picture frame) ──
function CornerBracket({ position }) {
  const SIZE = 22
  const paths = {
    tl: 'M 20,2 L 2,2 L 2,20',
    tr: 'M 2,2 L 20,2 L 20,20',
    bl: 'M 20,20 L 2,20 L 2,2',
    br: 'M 2,20 L 20,20 L 20,2',
  }
  const posStyles = {
    tl: { top: 28, left: 28 },
    tr: { top: 28, right: 28 },
    bl: { bottom: 28, left: 28 },
    br: { bottom: 28, right: 28 },
  }
  return (
    <svg
      width={SIZE + 2}
      height={SIZE + 2}
      viewBox={`0 0 ${SIZE + 2} ${SIZE + 2}`}
      style={{ position: 'absolute', ...posStyles[position], opacity: 0.4, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <path
        d={paths[position]}
        stroke="var(--color-gold)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

// ── Pink brushstroke underline (the one punk moment) ──
function PinkBrushstroke() {
  return (
    <svg
      viewBox="0 0 400 16"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{
        position: 'absolute',
        bottom: -6,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '84%',
        maxWidth: 620,
        height: 16,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      {/* Main stroke — thick, wobbly, tapered at ends */}
      <path
        d="M 6,10 C 35,3 75,13 118,7 C 158,2 196,12 244,8 C 284,4 326,12 362,7 C 380,5 392,9 394,8"
        stroke="var(--color-pink)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.82"
      />
      {/* Secondary shadow stroke for hand-drawn depth */}
      <path
        d="M 6,11 C 50,14 95,6 148,10 C 196,14 238,6 288,9 C 326,12 360,7 394,10"
        stroke="var(--color-pink)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />
    </svg>
  )
}

// ── SVG Icons: gestural brush-stroke style ──
function EyeIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M 4,20 C 9,11 31,11 36,20"
        stroke="var(--color-gold)" strokeWidth="2.5" strokeLinecap="round" fill="none"
      />
      <path
        d="M 4,20 C 9,29 31,29 36,20"
        stroke="var(--color-gold)" strokeWidth="2.5" strokeLinecap="round" fill="none"
      />
      <circle cx="21" cy="20" r="5" fill="var(--color-gold)" />
      <circle cx="21" cy="20" r="2.2" fill="var(--color-bg)" />
    </svg>
  )
}

function BrushIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      {/* Handle */}
      <line x1="31" y1="5" x2="19" y2="19" stroke="var(--color-gold)" strokeWidth="3" strokeLinecap="round" />
      {/* Ferrule */}
      <path
        d="M 14,21 L 19,18 L 22,22 L 17,25 Z"
        stroke="var(--color-gold)" strokeWidth="2" strokeLinejoin="round" fill="none"
      />
      {/* Bristles — splayed from tip */}
      <line x1="12" y1="27" x2="7"  y2="37" stroke="var(--color-gold)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="14" y1="28" x2="12" y2="38" stroke="var(--color-gold)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="28" x2="17" y2="38" stroke="var(--color-gold)" strokeWidth="2"   strokeLinecap="round" />
      <line x1="18" y1="27" x2="22" y2="36" stroke="var(--color-gold)" strokeWidth="2"   strokeLinecap="round" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      {/* Three nodes */}
      <circle cx="20" cy="7"  r="4" fill="var(--color-gold)" />
      <circle cx="7"  cy="32" r="4" fill="var(--color-gold)" />
      <circle cx="33" cy="32" r="4" fill="var(--color-gold)" />
      {/* Curved connecting lines */}
      <path d="M 17,10 Q 10,20 9,28"  stroke="var(--color-gold)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 23,10 Q 30,20 31,28" stroke="var(--color-gold)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export default function Home() {
  const [artwork, setArtwork] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const navigate = useNavigate()
  const todayKey = getTodayKey()

  useEffect(() => {
    fetchArtworkForDay(todayKey).then(a => {
      if (a) setArtwork(a)
      else setError(true)
      setLoading(false)
    })
  }, [todayKey])

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* ── HERO ── */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          padding: '64px 24px 80px',
          textAlign: 'center',
          background: 'var(--color-bg)',
          marginTop: -56, // pull hero up behind transparent nav
          paddingTop: 'calc(56px + 64px)', // compensate: nav height + visual breathing room
        }}
      >
        {/* Frame corner brackets */}
        <CornerBracket position="tl" />
        <CornerBracket position="tr" />
        <CornerBracket position="bl" />
        <CornerBracket position="br" />

        {/* Title with pink brushstroke underline */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(72px, 10vw, 144px)',
            lineHeight: 1.05,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em',
          }}>
            BadForgery
          </h1>
          <PinkBrushstroke />
        </div>

        {/* Tagline */}
        <p style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 'clamp(17px, 2.2vw, 22px)',
          lineHeight: 1.55,
          color: 'var(--color-text-secondary)',
          maxWidth: 520,
          margin: '28px auto 0',
        }}>
          You have 10 seconds to look and 60 seconds to recreate. Don't think, just create. Then share your masterpiece.
        </p>

        {/* Gold divider */}
        <div style={{
          width: 64,
          height: 1,
          background: 'var(--color-gold)',
          margin: '40px auto 0',
        }} />
      </section>

      {/* ── Content column ── */}
      <div style={{ width: '100%', maxWidth: 600, padding: '0 24px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* ── MUSEUM PLACARD ── */}
        <div
          style={{
            width: '100%',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderLeft: '3px solid var(--color-gold)',
            padding: '28px 36px',
            borderRadius: 2,
            marginBottom: 48,
            marginTop: 40,
          }}
        >
          {loading ? (
            <div style={{ height: 64, borderRadius: 2, background: 'var(--color-border)', opacity: 0.5 }} />
          ) : error ? (
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: 14 }}>
              Today's painting couldn't load — try refreshing.
            </p>
          ) : (
            <>
              <p style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-text-tertiary)',
                marginBottom: 8,
              }}>
                Today's Challenge
              </p>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 26,
                lineHeight: 1.2,
                color: 'var(--color-text-primary)',
                marginBottom: 6,
              }}>
                {artwork?.title}
              </p>
              <p style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 15,
                color: 'var(--color-text-secondary)',
                marginBottom: artwork?.date_display ? 4 : 0,
              }}>
                {parseArtistName(artwork?.artist_display)}
              </p>
              {artwork?.date_display && (
                <p style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 13,
                  color: 'var(--color-text-tertiary)',
                }}>
                  {artwork.date_display}
                </p>
              )}
            </>
          )}
        </div>

        {/* ── LOOK / DRAW / SHARE ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 0,
          width: '100%',
          maxWidth: 480,
          marginBottom: 40,
        }}>
          {[
            { icon: <EyeIcon />, label: 'Look', sub: '10 seconds' },
            { icon: <BrushIcon />, label: 'Draw', sub: '60 seconds' },
            { icon: <ShareIcon />, label: 'Share', sub: 'Global gallery' },
          ].map(({ icon, label, sub }) => (
            <div
              key={label}
              style={{ textAlign: 'center', padding: '8px 12px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                {icon}
              </div>
              <p style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-text-primary)',
                marginBottom: 4,
              }}>
                {label}
              </p>
              <p style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 12,
                color: 'var(--color-text-tertiary)',
              }}>
                {sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── PLAY TODAY BUTTON ── */}
        <button
          disabled={loading || error}
          onClick={() => navigate('/play')}
          style={{
            padding: '16px 48px',
            background: loading || error ? 'var(--color-border)' : 'var(--color-text-primary)',
            color: 'var(--color-white)',
            fontFamily: 'var(--font-ui)',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            border: 'none',
            borderRadius: 0,
            cursor: loading || error ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s ease, color 0.2s ease',
            marginBottom: 16,
          }}
          onMouseEnter={e => {
            if (!loading && !error) {
              e.currentTarget.style.background = 'var(--color-gold)'
              e.currentTarget.style.color = 'var(--color-text-primary)'
            }
          }}
          onMouseLeave={e => {
            if (!loading && !error) {
              e.currentTarget.style.background = 'var(--color-text-primary)'
              e.currentTarget.style.color = 'var(--color-white)'
            }
          }}
        >
          Play Today
        </button>

        {/* See today's gallery — goes to /archive/today, not a modal */}
        <button
          onClick={() => navigate(`/archive/${todayKey}`)}
          style={{
            background: 'none',
            border: 'none',
            fontFamily: 'var(--font-ui)',
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text-tertiary)',
            cursor: 'pointer',
            padding: 0,
            marginBottom: 64,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-tertiary)'}
        >
          See Today's Gallery →
        </button>

        {/* ── PAST DAYS (conditional — only renders when data loads) ── */}
        <div style={{ width: '100%' }}>
          <ArchivePicker />
        </div>
      </div>
    </main>
  )
}
