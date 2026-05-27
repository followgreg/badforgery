import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import Canvas from '../components/Canvas'
import Toolbar from '../components/Toolbar'
import Timer from '../components/Timer'
import Gallery from '../components/Gallery'
import { fetchArtworkForDay } from '../lib/artwork'
import { getTodayKey, getSubmissionId, setSubmissionId, setPlayed } from '../lib/storage'
import { supabase } from '../lib/supabase'

// PHASES: study → draw → submit → gallery
const STUDY_SECONDS = 10
const DRAW_SECONDS = 60

export default function Play() {
  const [searchParams] = useSearchParams()
  const todayKey = getTodayKey()
  const existingSubId = getSubmissionId(todayKey)

  const [phase, setPhase] = useState(existingSubId || searchParams.get('gallery') ? 'gallery' : 'study')
  const [artwork, setArtwork] = useState(null)
  const [artworkError, setArtworkError] = useState(false)
  const [artworkLoaded, setArtworkLoaded] = useState(false)
  const [showBlack, setShowBlack] = useState(false)
  const [readyBtn, setReadyBtn] = useState(false)
  const [studyComplete, setStudyComplete] = useState(false)

  // Draw state
  const [brushType, setBrushType] = useState('round')
  const [brushSize, setBrushSize] = useState(8)
  const [color, setColor] = useState('#2c2c2c')
  const [drawDisabled, setDrawDisabled] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const canvasRef = useRef(null)

  // Submit state
  const [capturedDataUrl, setCapturedDataUrl] = useState(null)
  const [nickname, setNickname] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState(existingSubId)
  const [submitError, setSubmitError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetchArtworkForDay(todayKey).then(a => {
      if (a) setArtwork(a)
      else setArtworkError(true)
    })
  }, [todayKey])

  const handleStudyComplete = useCallback(() => {
    setShowBlack(true)
    setTimeout(() => setReadyBtn(true), 1000)
  }, [])

  const handleStartDraw = useCallback(() => {
    setStudyComplete(true)
    setPhase('draw')
    setPlayed(todayKey)
  }, [todayKey])

  const handleDrawComplete = useCallback(() => {
    setDrawDisabled(true)
    setTimeUp(true)
    showToast('Time\'s up!')
  }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function handleUndo() {
    canvasRef.current?.undo()
  }

  function handleClear() {
    if (!window.confirm('Clear the canvas? This can\'t be undone.')) return
    canvasRef.current?.clear()
  }

  async function handleSubmit() {
    const drawingData = capturedDataUrl || canvasRef.current?.getDataURL()
    if (!drawingData) return
    if (!supabase) { setSubmitError('Gallery unavailable — submission disabled.'); return }

    setSubmitting(true)
    setSubmitError('')
    try {
      if (submittedId) {
        // Update existing
        const { error } = await supabase
          .from('submissions')
          .update({ drawing_data: drawingData, nickname: nickname.trim() || null })
          .eq('id', submittedId)
        if (error) throw error
        setPhase('gallery')
      } else {
        const { data, error } = await supabase
          .from('submissions')
          .insert({
            day_key: todayKey,
            nickname: nickname.trim() || null,
            drawing_data: drawingData,
            artwork_id: artwork?.artwork_id || '',
          })
          .select('id')
          .single()
        if (error) throw error
        setSubmissionId(todayKey, data.id)
        setSubmittedId(data.id)
        setPhase('gallery')
      }
    } catch (e) {
      setSubmitError('Something went wrong. Try again.')
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  // Derive canvas aspect ratio from artwork dimensions; fall back to 4:3
  const artworkRatio = useMemo(() => {
    if (artwork?.image_width && artwork?.image_height) {
      return artwork.image_width / artwork.image_height
    }
    return 4 / 3
  }, [artwork])

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 py-6">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl font-medium text-sm shadow-xl"
          style={{ background: 'var(--gold)', color: '#0f0e0c' }}
        >
          {toast}
        </div>
      )}

      {/* STUDY PHASE */}
      {phase === 'study' && (
        <div className="flex-1 flex flex-col items-center phase-fade">
          <h2 className="text-3xl font-bold mb-2 text-center" style={{ fontFamily: 'var(--font-display)' }}>
            Study the Painting
          </h2>
          <p className="text-sm mb-6 text-center" style={{ color: 'var(--text-muted)' }}>
            Memorize it. You won't see it again.
          </p>

          {artworkError ? (
            <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
              Today's painting couldn't load — try refreshing.
            </div>
          ) : (
            <div className="relative w-full mb-6 flex justify-center">
              {!artworkLoaded && (
                <div className="w-full aspect-video rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />
              )}
              {artwork && (
                <div className="relative" style={{ maxHeight: '70vh', aspectRatio: artworkRatio, maxWidth: '100%' }}>
                  <img
                    src={artwork.image_url}
                    alt={artwork.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: artworkLoaded ? 'block' : 'none',
                      borderRadius: 4,
                    }}
                    onLoad={() => setArtworkLoaded(true)}
                  />
                  {showBlack && (
                    <div
                      className="absolute inset-0 rounded-2xl fade-black"
                      style={{ background: '#000' }}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {artworkLoaded && !readyBtn && (
            <Timer seconds={STUDY_SECONDS} onComplete={handleStudyComplete} danger={4} />
          )}

          {readyBtn && (
            <button
              onClick={handleStartDraw}
              className="mt-4 px-8 py-4 rounded-2xl text-xl font-semibold transition-all hover:opacity-90 active:scale-95 phase-fade"
              style={{ background: 'var(--gold)', color: '#0f0e0c', fontFamily: 'var(--font-display)' }}
            >
              Ready to Draw →
            </button>
          )}
        </div>
      )}

      {/* DRAW PHASE */}
      {phase === 'draw' && (
        <div className="flex-1 flex flex-col phase-fade">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Drawing from memory</p>
              <p className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{artwork?.title}</p>
            </div>
            {!timeUp && (
              <Timer seconds={DRAW_SECONDS} onComplete={handleDrawComplete} size="sm" />
            )}
            {timeUp && (
              <span className="text-sm font-bold" style={{ color: 'var(--red)' }}>TIME'S UP</span>
            )}
          </div>

          {/* Canvas + Toolbar layout */}
          <div className={`flex ${isMobile ? 'flex-col-reverse' : 'flex-row'} gap-3 flex-1`}>
            {/* Toolbar */}
            <Toolbar
              brushType={brushType} setBrushType={setBrushType}
              brushSize={brushSize} setBrushSize={setBrushSize}
              color={color} setColor={setColor}
              onUndo={handleUndo}
              onClear={handleClear}
              disabled={drawDisabled}
              orientation={isMobile ? 'horizontal' : 'vertical'}
            />

            {/* Canvas area */}
            <div className="flex-1 min-w-0">
              <Canvas
                ref={canvasRef}
                brushType={brushType}
                brushSize={brushSize}
                color={color}
                disabled={drawDisabled}
                aspectRatio={artworkRatio}
              />
            </div>
          </div>

          {timeUp && (
            <div className="mt-4 text-center phase-fade">
              <button
                onClick={() => { setCapturedDataUrl(canvasRef.current?.getDataURL()); setPhase('submit') }}
                className="px-8 py-4 rounded-2xl text-xl font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'var(--gold)', color: '#0f0e0c', fontFamily: 'var(--font-display)' }}
              >
                Submit Your Forgery →
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUBMIT PHASE */}
      {phase === 'submit' && (
        <div className="flex-1 flex flex-col items-center phase-fade">
          <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Your Forgery
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            {submittedId ? 'Update your forgery or keep what you have.' : 'Post it to the global gallery.'}
          </p>

          {/* Side by side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
            <div>
              <p className="text-xs uppercase tracking-wider mb-2 text-center" style={{ color: 'var(--text-muted)' }}>The Original</p>
              {artwork?.image_url && (
                <img src={artwork.image_url} alt={artwork.title} className="w-full rounded-xl object-contain" style={{ maxHeight: 300 }} />
              )}
              <p className="text-center text-sm mt-2" style={{ fontFamily: 'var(--font-display)' }}>{artwork?.title}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-2 text-center" style={{ color: 'var(--text-muted)' }}>Your Forgery</p>
              <img
                src={capturedDataUrl}
                alt="Your drawing"
                className="w-full rounded-xl"
                style={{ maxHeight: 300, objectFit: 'contain', background: '#fff' }}
              />
            </div>
          </div>

          {/* Nickname */}
          <div className="w-full max-w-md mb-4">
            <input
              type="text"
              placeholder="Anonymous Forger"
              value={nickname}
              onChange={e => setNickname(e.target.value.slice(0, 20))}
              maxLength={20}
              className="w-full px-4 py-3 rounded-xl text-base outline-none"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
            <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-muted)' }}>{nickname.length}/20</p>
          </div>

          {submitError && (
            <p className="text-sm mb-3" style={{ color: 'var(--red)' }}>{submitError}</p>
          )}

          <div className="flex gap-3">
            {submittedId && (
              <button
                onClick={() => setPhase('gallery')}
                className="px-6 py-3 rounded-xl font-medium text-base"
                style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                See Gallery
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-3 rounded-xl font-semibold text-base transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ background: 'var(--gold)', color: '#0f0e0c' }}
            >
              {submitting ? 'Posting…' : submittedId ? 'Update My Forgery' : 'Post to Gallery'}
            </button>
          </div>
        </div>
      )}

      {/* GALLERY PHASE */}
      {phase === 'gallery' && (
        <div className="phase-fade">
          <div className="flex items-center justify-between mb-8">
            <div />
            <button
              onClick={() => setPhase('submit')}
              className="text-sm px-4 py-2 rounded-lg"
              style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              ← Edit My Forgery
            </button>
          </div>
          <Gallery dayKey={todayKey} artwork={artwork} highlightId={submittedId} />
        </div>
      )}
    </main>
  )
}
