import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPastDayKeys, getTodayKey } from '../lib/storage'
import { fetchArtworkForDay, getImageUrl } from '../lib/artwork'

function shortDate(key) {
  return new Date(key + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  })
}

export default function ArchiveListing() {
  const todayKey = getTodayKey()
  // today + 29 past days = 30 total
  const allKeys = [todayKey, ...getPastDayKeys(29)]

  const [artworks, setArtworks] = useState({})

  useEffect(() => {
    allKeys.forEach(async key => {
      const a = await fetchArtworkForDay(key)
      if (a) setArtworks(prev => ({ ...prev, [key]: a }))
    })
  }, [])

  return (
    <main style={{
      flex: 1,
      maxWidth: 900,
      margin: '0 auto',
      width: '100%',
      padding: '28px 20px 72px',
      boxSizing: 'border-box',
    }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-text-tertiary)',
          marginBottom: 6,
        }}>
          Past Paintings
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 'clamp(28px, 5vw, 44px)',
          color: 'var(--color-text-primary)',
          lineHeight: 1.15,
        }}>
          The Archive
        </h1>
      </div>

      {/* Grid — auto-fill so it collapses to 2 cols on mobile, 4-5 on desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 10,
      }}>
        {allKeys.map(key => {
          const art = artworks[key]
          const isToday = key === todayKey

          return (
            <Link
              key={key}
              to={`/archive/${key}`}
              style={{
                display: 'block',
                textDecoration: 'none',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                overflow: 'hidden',
                position: 'relative',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-gold)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
            >
              {/* Today badge */}
              {isToday && (
                <div style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  zIndex: 1,
                  background: 'var(--color-text-primary)',
                  color: 'var(--color-white)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '3px 7px',
                }}>
                  Today
                </div>
              )}

              {/* Thumbnail */}
              <div style={{
                aspectRatio: '4/3',
                background: 'var(--color-surface-raised)',
                overflow: 'hidden',
              }}>
                {art?.image_id ? (
                  <img
                    src={getImageUrl(art.image_id, '400,')}
                    alt={art.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%' }} className="animate-pulse" />
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '9px 11px' }}>
                <p style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-tertiary)',
                  marginBottom: 3,
                }}>
                  {shortDate(key)}
                </p>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}>
                  {art?.title || '…'}
                </p>
                {art?.artist_display && (
                  <p style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 11,
                    color: 'var(--color-text-tertiary)',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    marginTop: 2,
                  }}>
                    {art.artist_display.split('(')[0].trim()}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
