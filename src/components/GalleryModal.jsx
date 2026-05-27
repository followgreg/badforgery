import { useEffect, useState } from 'react'
import StarRating from './StarRating'
import { supabase } from '../lib/supabase'
import { hasRated, setRated } from '../lib/storage'

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function GalleryModal({ submission, artwork, onClose }) {
  const [avgRating, setAvgRating] = useState(submission.avg_rating || 0)
  const [ratingCount, setRatingCount] = useState(submission.rating_count || 0)
  const [locked, setLocked] = useState(() => hasRated(submission.id))

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  async function handleRate(stars) {
    if (!supabase || locked) return
    setLocked(true)
    setRated(submission.id)
    const newCount = ratingCount + 1
    const newAvg = (avgRating * ratingCount + stars) / newCount
    setAvgRating(newAvg)
    setRatingCount(newCount)
    await supabase.from('ratings').insert({ submission_id: submission.id, stars })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl overflow-hidden w-full max-w-4xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-lg"
          style={{ background: '#2e2c29', color: 'var(--text-muted)' }}
        >
          ✕
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Original */}
          <div className="p-4">
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>The Original</p>
            {artwork?.image_url && (
              <img
                src={artwork.image_url}
                alt={artwork.title}
                className="w-full rounded-lg object-cover"
                style={{ maxHeight: 400 }}
              />
            )}
            <p className="mt-2 text-sm font-medium" style={{ fontFamily: 'var(--font-display)' }}>{artwork?.title}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{artwork?.artist_display}</p>
          </div>

          {/* Drawing */}
          <div className="p-4" style={{ borderLeft: '1px solid var(--border)' }}>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>The Forgery</p>
            <img
              src={submission.drawing_data}
              alt="Forgery"
              className="w-full rounded-lg"
              style={{ maxHeight: 400, objectFit: 'contain', background: '#fff' }}
            />
            <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-medium text-sm">{submission.nickname || 'Anonymous Forger'}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(submission.created_at)}</p>
              </div>
              <StarRating
                avg={avgRating}
                count={ratingCount}
                onRate={handleRate}
                locked={locked}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
