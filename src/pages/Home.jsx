import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchArtworkForDay } from '../lib/artwork'
import { getTodayKey, getSubmissionId } from '../lib/storage'
import ArchivePicker from '../components/ArchivePicker'

export default function Home() {
  const [artwork, setArtwork] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const navigate = useNavigate()
  const todayKey = getTodayKey()
  const alreadySubmitted = !!getSubmissionId(todayKey)

  useEffect(() => {
    fetchArtworkForDay(todayKey).then(a => {
      if (a) setArtwork(a)
      else setError(true)
      setLoading(false)
    })
  }, [todayKey])

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-12 max-w-2xl mx-auto w-full">
      {/* Hero */}
      <div className="text-center mb-12 phase-fade">
        <h1
          className="text-6xl md:text-8xl font-bold mb-4 italic"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)' }}
        >
          BadForgery
        </h1>
        <p className="text-xl md:text-2xl" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
          You have 10 seconds to look.<br />60 seconds to lie.
        </p>
      </div>

      {/* Today's artwork info (image hidden) */}
      <div
        className="w-full rounded-2xl p-6 mb-8 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {loading ? (
          <div className="animate-pulse h-16 rounded" style={{ background: 'var(--border)' }} />
        ) : error ? (
          <p style={{ color: 'var(--text-muted)' }}>Today's painting couldn't load — try refreshing.</p>
        ) : (
          <>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Today's Challenge</p>
            <p
              className="text-2xl font-semibold mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {artwork?.title}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>{artwork?.artist_display}</p>
            {artwork?.date_display && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{artwork?.date_display}</p>
            )}
          </>
        )}
      </div>

      {/* Steps */}
      <div className="grid grid-cols-3 gap-4 w-full mb-10">
        {[
          { icon: '👁️', step: 'Look', desc: '10 seconds' },
          { icon: '✏️', step: 'Draw', desc: '60 seconds' },
          { icon: '🌐', step: 'Share', desc: 'Global gallery' },
        ].map(({ icon, step, desc }) => (
          <div
            key={step}
            className="rounded-xl p-4 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="text-3xl mb-2">{icon}</div>
            <p className="font-semibold text-sm">{step}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        disabled={loading || error}
        onClick={() => navigate(alreadySubmitted ? '/play?gallery=1' : '/play')}
        className="w-full max-w-xs py-4 rounded-2xl text-xl font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
        style={{
          background: loading || error ? 'var(--border)' : 'var(--gold)',
          color: '#0f0e0c',
          fontFamily: 'var(--font-display)',
        }}
      >
        {alreadySubmitted ? 'See Today\'s Gallery' : 'Play Today'}
      </button>

      {/* Archive */}
      <div className="w-full mt-16">
        <ArchivePicker />
      </div>
    </main>
  )
}
