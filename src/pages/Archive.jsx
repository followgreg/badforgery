import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchArtworkForDay } from '../lib/artwork'
import Gallery from '../components/Gallery'
import ArchivePicker from '../components/ArchivePicker'

export default function Archive() {
  const { day_key } = useParams()
  const [artwork, setArtwork] = useState(null)
  const [artworkError, setArtworkError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    setArtwork(null)
    setArtworkError(false)
    setImageLoaded(false)
    fetchArtworkForDay(day_key).then(a => {
      if (a) setArtwork(a)
      else setArtworkError(true)
    })
  }, [day_key])

  const displayDate = day_key
    ? new Date(day_key + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  return (
    <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 py-8">
      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm mb-6 transition-opacity hover:opacity-70"
        style={{ color: 'var(--text-muted)' }}
      >
        ← Back to Today
      </Link>

      {/* Archive header */}
      <div className="mb-8 phase-fade">
        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{displayDate}</p>
        <h1 className="text-4xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          {artwork?.title || '…'}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>{artwork?.artist_display}</p>
        {artwork?.date_display && (
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{artwork?.date_display}</p>
        )}
      </div>

      {/* Artwork image (fully visible in archive) */}
      {artworkError ? (
        <div className="mb-8 p-6 rounded-2xl text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          Artwork image unavailable.
        </div>
      ) : artwork ? (
        <div className="mb-8 flex justify-center">
          <img
            src={artwork.image_url}
            alt={artwork.title}
            className="rounded-2xl object-contain w-full"
            style={{ maxHeight: '55vh' }}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      ) : (
        <div className="mb-8 aspect-video rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />
      )}

      {/* Locked notice */}
      <div
        className="mb-8 px-4 py-3 rounded-xl text-sm text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
      >
        🔒 Drawing is closed for this day — but ratings are still open.
      </div>

      {/* Gallery */}
      <Gallery dayKey={day_key} artwork={artwork} />

      {/* Archive nav */}
      <div className="mt-12">
        <ArchivePicker />
      </div>
    </main>
  )
}
