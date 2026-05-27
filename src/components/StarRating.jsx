import { useState } from 'react'

export default function StarRating({ avg, count, onRate, locked = false, size = 20 }) {
  const [hover, setHover] = useState(0)
  const display = hover || Math.round(avg || 0)

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          className={`star-btn p-0 border-0 bg-transparent cursor-${locked ? 'default' : 'pointer'}`}
          style={{ fontSize: size, lineHeight: 1, color: n <= display ? '#E8C547' : '#3a3836' }}
          onMouseEnter={() => !locked && setHover(n)}
          onMouseLeave={() => !locked && setHover(0)}
          onClick={() => !locked && onRate?.(n)}
          disabled={locked}
          aria-label={`${n} star`}
        >
          ★
        </button>
      ))}
      {count > 0 && (
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }} className="ml-1">
          {avg?.toFixed(1)} ({count})
        </span>
      )}
    </div>
  )
}
