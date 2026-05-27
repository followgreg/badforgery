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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            Today's Forgeries
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {loading ? '…' : `${submissions.length} submission${submissions.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {['newest', 'top'].map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className="px-3 py-1.5 text-sm font-medium capitalize transition-colors"
              style={{
                background: sort === s ? 'var(--gold)' : 'transparent',
                color: sort === s ? '#0f0e0c' : 'var(--text-muted)',
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
            <div key={i} className="rounded-xl aspect-video animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <p className="text-4xl mb-3">🖼️</p>
          <p>No forgeries yet — be the first!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sorted.map(sub => (
            <button
              key={sub.id}
              onClick={() => setSelected(sub)}
              className="text-left rounded-xl overflow-hidden transition-transform hover:scale-[1.02] focus:outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="aspect-video overflow-hidden" style={{ background: '#fff' }}>
                <img
                  src={sub.drawing_data}
                  alt={`Forgery by ${sub.nickname || 'Anonymous'}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <p className="font-medium text-sm truncate">{sub.nickname || 'Anonymous Forger'}</p>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{timeAgo(sub.created_at)}</p>
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
