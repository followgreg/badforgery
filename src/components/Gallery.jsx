import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import GalleryModal from './GalleryModal'
import StarRating from './StarRating'

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function Gallery({ dayKey, artwork, highlightId }) {
  const [submissions, setSubmissions] = useState([])
  const [sort, setSort] = useState('newest')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!supabase) { setError(true); setLoading(false); return }
    async function load() {
      setLoading(true)
      // Fetch submissions
      const { data: subs, error: subErr } = await supabase
        .from('submissions')
        .select('*')
        .eq('day_key', dayKey)

      if (subErr) { setError(true); setLoading(false); return }

      // Fetch ratings aggregate
      const ids = (subs || []).map(s => s.id)
      let ratingMap = {}
      if (ids.length > 0) {
        const { data: ratings } = await supabase
          .from('ratings')
          .select('submission_id, stars')
          .in('submission_id', ids)

        ;(ratings || []).forEach(r => {
          if (!ratingMap[r.submission_id]) ratingMap[r.submission_id] = { sum: 0, count: 0 }
          ratingMap[r.submission_id].sum += r.stars
          ratingMap[r.submission_id].count += 1
        })
      }

      const enriched = (subs || []).map(s => ({
        ...s,
        avg_rating: ratingMap[s.id] ? ratingMap[s.id].sum / ratingMap[s.id].count : 0,
        rating_count: ratingMap[s.id]?.count || 0,
      }))

      setSubmissions(enriched)
      setLoading(false)

      // Auto-open highlighted submission
      if (highlightId) {
        const found = enriched.find(s => s.id === highlightId)
        if (found) setSelected(found)
      }
    }
    load()
  }, [dayKey, highlightId])

  const sorted = [...submissions].sort((a, b) => {
    if (sort === 'top') return b.avg_rating - a.avg_rating
    return new Date(b.created_at) - new Date(a.created_at)
  })

  if (error) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
        Gallery unavailable — couldn't reach the server.
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400, fontSize: 28, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
            The Forgeries
          </h2>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
            {loading ? '…' : `${submissions.length} submission${submissions.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', border: '1px solid var(--color-border)' }}>
          {['newest', 'top'].map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              style={{
                padding: '8px 16px',
                fontFamily: 'var(--font-ui)',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: sort === s ? 'var(--color-text-primary)' : 'transparent',
                color: sort === s ? 'var(--color-white)' : 'var(--color-text-tertiary)',
                border: 'none',
                borderRadius: 0,
                cursor: 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
            >
              {s === 'top' ? 'Top Rated' : 'Newest'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ aspectRatio: '4/3', background: 'var(--color-surface)', borderRadius: 2 }} className="animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-ui)', fontSize: 14 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🖼️</p>
          <p>No forgeries yet — be the first!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sorted.map(sub => (
            <button
              key={sub.id}
              onClick={() => setSelected(sub)}
              style={{
                textAlign: 'left',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 0,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease',
                padding: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-gold)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
            >
              <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: '#fff' }}>
                <img
                  src={sub.drawing_data}
                  alt={`Forgery by ${sub.nickname || 'Anonymous'}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div style={{ padding: '10px 12px' }}>
                <p style={{ fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: 13, color: 'var(--color-text-primary)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginBottom: 2 }}>{sub.nickname || 'Anonymous Forger'}</p>
                <p style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 6 }}>{timeAgo(sub.created_at)}</p>
                <StarRating avg={sub.avg_rating} count={sub.rating_count} locked size={14} />
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <GalleryModal
          submission={selected}
          artwork={artwork}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
