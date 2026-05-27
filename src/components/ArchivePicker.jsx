import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPastDayKeys } from '../lib/storage'
import { fetchArtworkForDay, getImageUrl } from '../lib/artwork'

function formatDayLabel(key) {
  // "2026-05-26" → "May 26"
  const d = new Date(key + 'T12:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export default function ArchivePicker() {
  const dayKeys = getPastDayKeys(7)
  const [artworks, setArtworks] = useState({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let loaded = 0
    dayKeys.forEach(async (key) => {
      const a = await fetchArtworkForDay(key)
      if (a) setArtworks(prev => ({ ...prev, [key]: a }))
      loaded += 1
      if (loaded === dayKeys.length) setReady(true)
    })
  }, [])

  // Only render once we have confirmed at least one artwork
  if (!ready || Object.keys(artworks).length === 0) return null

  return (
    <div>
      <p style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--color-text-tertiary)',
        marginBottom: 12,
      }}>
        Past Days
      </p>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {dayKeys.filter(k => artworks[k]).map(key => {
          const art = artworks[key]
          return (
            <Link
              key={key}
              to={`/archive/${key}`}
              style={{
                flexShrink: 0,
                width: 120,
                borderRadius: 0,
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                textDecoration: 'none',
                display: 'block',
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-gold)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
            >
              <div style={{ height: 76, overflow: 'hidden', background: 'var(--color-surface-raised)' }}>
                {art?.image_id ? (
                  <img
                    src={getImageUrl(art.image_id, '200,')}
                    alt={art.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.9 }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    🎨
                  </div>
                )}
              </div>
              <div style={{ padding: '8px 10px' }}>
                <p style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  marginBottom: 2,
                }}>
                  {art?.title}
                </p>
                <p style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 11,
                  color: 'var(--color-text-tertiary)',
                }}>
                  {formatDayLabel(key)}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
