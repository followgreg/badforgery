import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchArtworkForDay } from '../lib/artwork'
import Gallery from '../components/Gallery'
import ArchivePicker from '../components/ArchivePicker'

export default function Archive() {
  const { day_key } = useParams()
  const [artwork, setArtwork] = useState(null)
  const [artworkError, setArtworkError] = useState(false)

  useEffect(() => {
    setArtwork(null)
    setArtworkError(false)
    fetchArtworkForDay(day_key).then(a => {
      if (a) setArtwork(a)
      else setArtworkError(true)
    })
  }, [day_key])

  const displayDate = day_key
    ? new Date(day_key + 'T12:00:00Z').toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
      })
    : ''

  return (
    <main style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      maxWidth: 860,
      margin: '0 auto',
      width: '100%',
      padding: '24px 20px 64px',
      boxSizing: 'border-box',
    }}>

      {/* Back link */}
      <Link
        to="/"
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-text-tertiary)',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: 28,
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-tertiary)'}
      >
        ← Back to Today
      </Link>

      {/* Placard */}
      <div style={{ marginBottom: 24 }} className="phase-fade">
        <p style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-text-tertiary)',
          marginBottom: 6,
        }}>
          {displayDate}
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 'clamp(24px, 5vw, 44px)',
          color: 'var(--color-text-primary)',
          lineHeight: 1.15,
          marginBottom: 6,
        }}>
          {artwork?.title || '…'}
        </h1>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--color-text-secondary)' }}>
          {artwork?.artist_display?.split('(')[0].trim()}
        </p>
        {artwork?.date_display && (
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 3 }}>
            {artwork.date_display}
          </p>
        )}
      </div>

      {/* — The Original — */}
      <div style={{ marginBottom: 32 }}>
        <p style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-text-tertiary)',
          marginBottom: 10,
        }}>
          The Original
        </p>

        {artworkError ? (
          <div style={{
            padding: '20px 24px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-tertiary)',
            fontSize: 14,
            fontFamily: 'var(--font-ui)',
          }}>
            Artwork image unavailable.
          </div>
        ) : artwork ? (
          <img
            src={artwork.image_url}
            alt={artwork.title}
            style={{
              display: 'block',
              width: '100%',
              objectFit: 'contain',
              maxHeight: '55vh',
            }}
          />
        ) : (
          <div style={{
            aspectRatio: '4/3',
            background: 'var(--color-surface)',
            maxHeight: '55vh',
          }} className="animate-pulse" />
        )}
      </div>

      {/* Locked notice */}
      <div style={{
        marginBottom: 32,
        padding: '11px 18px',
        background: 'var(--color-surface)',
        borderLeft: '3px solid var(--color-border-strong)',
        fontFamily: 'var(--font-ui)',
        fontSize: 12,
        color: 'var(--color-text-tertiary)',
        letterSpacing: '0.02em',
      }}>
        Drawing is closed for this day — ratings are still open.
      </div>

      {/* Gallery of forgeries */}
      <Gallery dayKey={day_key} artwork={artwork} />

      <div style={{ marginTop: 48 }}>
        <ArchivePicker />
      </div>
    </main>
  )
}
