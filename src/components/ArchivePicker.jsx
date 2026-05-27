import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPastDayKeys } from '../lib/storage'
import { fetchArtworkForDay, getImageUrl } from '../lib/artwork'

export default function ArchivePicker() {
  const dayKeys = getPastDayKeys(7)
  const [artworks, setArtworks] = useState({})

  useEffect(() => {
    dayKeys.forEach(async (key) => {
      const a = await fetchArtworkForDay(key)
      if (a) setArtworks(prev => ({ ...prev, [key]: a }))
    })
  }, [])

  return (
    <div>
      <h3 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
        Past Days
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {dayKeys.map(key => {
          const art = artworks[key]
          return (
            <Link
              key={key}
              to={`/archive/${key}`}
              className="flex-shrink-0 w-32 rounded-xl overflow-hidden transition-transform hover:scale-[1.03]"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="h-20 overflow-hidden" style={{ background: '#1a1917' }}>
                {art?.image_id ? (
                  <img
                    src={getImageUrl(art.image_id, '200,')}
                    alt={art.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🎨</div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate" title={art?.title}>{art?.title || '…'}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {key}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
