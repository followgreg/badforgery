import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import Canvas from '../components/Canvas'
import Toolbar from '../components/Toolbar'
import Timer from '../components/Timer'
import Gallery from '../components/Gallery'
import { fetchArtworkForDay } from '../lib/artwork'
import { getTodayKey, getSubmissionId, setSubmissionId, setPlayed } from '../lib/storage'
import { supabase } from '../lib/supabase'

const STUDY_SECONDS = 10
const DRAW_SECONDS = 60

// Shared button style helpers
const btnPrimary = (disabled) => ({
  padding: '14px 40px',
  background: disabled ? 'var(--color-border)' : 'var(--color-text-primary)',
  color: 'var(--color-white)',
  fontFamily: 'var(--font-ui)',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  border: 'none',
  borderRadius: 0,
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'background 0.2s ease, color 0.2s ease',
})

const btnSecondary = {
  padding: '12px 28px',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-ui)',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  border: '1px solid var(--color-border)',
  borderRadius: 0,
  cursor: 'pointer',
  transition: 'border-color 0.2s ease, color 0.2s ease',
}

function PrimaryBtn({ children, onClick, disabled, style }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnPrimary(disabled),
        background: hovered && !disabled ? 'var(--color-gold)' : btnPrimary(disabled).background,
        color: hovered && !disabled ? 'var(--color-text-primary)' : 'var(--color-white)',
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  )
}

function SecondaryBtn({ children, onClick, style }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      style={{
        ...btnSecondary,
        borderColor: hovered ? 'var(--color-gold)' : 'var(--color-border)',
        color: hovered ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  )
}

function EyebrowLabel({ children }) {
  return (
    <p style={{
      fontFamily: 'var(--font-ui)',
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--color-text-tertiary)',
      marginBottom: 4,
    }}>
      {children}
    </p>
  )
}

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

  const artworkRatio = useMemo(() => {
    if (artwork?.image_width && artwork?.image_height) {
      return artwork.image_width / artwork.image_height
    }
    return 4 / 3
  }, [artwork])

  const handleStudyComplete = useCallback(() => {
    setShowBlack(true)
    setTimeout(() => setReadyBtn(true), 1000)
  }, [])

  const handleStartDraw = useCallback(() => {
    setPhase('draw')
    setPlayed(todayKey)
  }, [todayKey])

  const handleDrawComplete = useCallback(() => {
    setDrawDisabled(true)
    setTimeUp(true)
    showToast("Time's up!")
  }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function handleUndo() { canvasRef.current?.undo() }

  function handleClear() {
    if (!window.confirm("Clear the canvas? This can't be undone.")) return
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

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <main style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      maxWidth: 900,
      margin: '0 auto',
      width: '100%',
      padding: isMobile
        ? '16px 16px max(80px, env(safe-area-inset-bottom, 80px))'
        : '24px 32px 48px',
    }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          padding: '12px 28px',
          background: 'var(--color-text-primary)',
          color: 'var(--color-white)',
          fontFamily: 'var(--font-ui)',
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: '0.08em',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}

      {/* ── STUDY PHASE ── */}
      {phase === 'study' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="phase-fade">
          <EyebrowLabel>Study the Painting</EyebrowLabel>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(26px, 4vw, 36px)',
            color: 'var(--color-text-primary)',
            marginBottom: 4,
            textAlign: 'center',
          }}>
            Memorize it. You won't see it again.
          </h2>
          <p style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 13,
            color: 'var(--color-text-tertiary)',
            marginBottom: 24,
          }}>
            {artwork?.title && `${artwork.title}${artwork.artist_display ? ' · ' + artwork.artist_display.split('(')[0].trim() : ''}`}
          </p>

          {artworkError ? (
            <p style={{ color: 'var(--color-text-tertiary)' }}>Today's painting couldn't load — try refreshing.</p>
          ) : (
            <div style={{ position: 'relative', width: '100%', marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
              {!artworkLoaded && (
                <div style={{ width: '100%', aspectRatio: String(artworkRatio), background: 'var(--color-surface)', borderRadius: 2 }} className="animate-pulse" />
              )}
              {artwork && (
                <div style={{ position: 'relative', maxHeight: '65vh', aspectRatio: String(artworkRatio), maxWidth: '100%' }}>
                  <img
                    src={artwork.image_url}
                    alt={artwork.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: artworkLoaded ? 'block' : 'none', borderRadius: 2 }}
                    onLoad={() => setArtworkLoaded(true)}
                  />
                  {showBlack && (
                    <div className="absolute inset-0 fade-black" style={{ background: 'var(--color-text-primary)', borderRadius: 2 }} />
                  )}
                </div>
              )}
            </div>
          )}

          {artworkLoaded && !readyBtn && (
            <Timer seconds={STUDY_SECONDS} onComplete={handleStudyComplete} danger={4} />
          )}

          {readyBtn && (
            <div className="phase-fade" style={{ marginTop: 16 }}>
              <PrimaryBtn onClick={handleStartDraw}>Ready to Draw</PrimaryBtn>
            </div>
          )}
        </div>
      )}

      {/* ── DRAW PHASE ── */}
      {phase === 'draw' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} className="phase-fade">

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <EyebrowLabel>Drawing from memory</EyebrowLabel>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, color: 'var(--color-text-primary)' }}>
                {artwork?.title}
              </p>
            </div>
            {!timeUp
              ? <Timer seconds={DRAW_SECONDS} onComplete={handleDrawComplete} size="sm" />
              : <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-danger)' }}>Time's Up</span>
            }
          </div>

          {/* Canvas + Toolbar */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 12,
            flex: 1,
          }}>
            {/* On mobile: canvas first, toolbar below */}
            {!isMobile && (
              <Toolbar
                brushType={brushType} setBrushType={setBrushType}
                brushSize={brushSize} setBrushSize={setBrushSize}
                color={color} setColor={setColor}
                onUndo={handleUndo} onClear={handleClear}
                disabled={drawDisabled}
                orientation="vertical"
              />
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <Canvas
                ref={canvasRef}
                brushType={brushType} brushSize={brushSize} color={color}
                disabled={drawDisabled} aspectRatio={artworkRatio}
              />
            </div>

            {isMobile && (
              <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
                <Toolbar
                  brushType={brushType} setBrushType={setBrushType}
                  brushSize={brushSize} setBrushSize={setBrushSize}
                  color={color} setColor={setColor}
                  onUndo={handleUndo} onClear={handleClear}
                  disabled={drawDisabled}
                  orientation="horizontal"
                />
              </div>
            )}
          </div>

          {timeUp && (
            <div style={{ marginTop: 20, textAlign: 'center' }} className="phase-fade">
              <PrimaryBtn onClick={() => { setCapturedDataUrl(canvasRef.current?.getDataURL()); setPhase('submit') }}>
                Submit Your Forgery
              </PrimaryBtn>
            </div>
          )}
        </div>
      )}

      {/* ── SUBMIT PHASE ── */}
      {phase === 'submit' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="phase-fade">
          <EyebrowLabel>Your Forgery</EyebrowLabel>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(28px, 4vw, 40px)',
            color: 'var(--color-text-primary)',
            marginBottom: 6,
            textAlign: 'center',
          }}>
            {submittedId ? 'Update your masterpiece' : 'Ready to confess?'}
          </h2>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--color-text-tertiary)', marginBottom: 32 }}>
            {submittedId ? 'Replace your forgery or leave it as is.' : 'Post it to the global gallery.'}
          </p>

          {/* Side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24, width: '100%', marginBottom: 32 }}>
            <div>
              <EyebrowLabel>The Original</EyebrowLabel>
              {artwork?.image_url && (
                <img src={artwork.image_url} alt={artwork.title} style={{ width: '100%', objectFit: 'contain', maxHeight: 280, borderRadius: 2 }} />
              )}
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 8, textAlign: 'center' }}>
                {artwork?.title}
              </p>
            </div>
            <div>
              <EyebrowLabel>Your Forgery</EyebrowLabel>
              <img
                src={capturedDataUrl}
                alt="Your drawing"
                style={{ width: '100%', objectFit: 'contain', maxHeight: 280, borderRadius: 2, background: '#fff' }}
              />
            </div>
          </div>

          {/* Nickname */}
          <div style={{ width: '100%', maxWidth: 400, marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Anonymous Forger"
              value={nickname}
              onChange={e => setNickname(e.target.value.slice(0, 20))}
              maxLength={20}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 0,
                fontFamily: 'var(--font-ui)',
                fontSize: 15,
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            />
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-text-tertiary)', textAlign: 'right', marginTop: 4 }}>
              {nickname.length}/20
            </p>
          </div>

          {submitError && (
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-danger)', marginBottom: 12 }}>{submitError}</p>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {submittedId && (
              <SecondaryBtn onClick={() => setPhase('gallery')}>See Gallery</SecondaryBtn>
            )}
            <PrimaryBtn onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Posting…' : submittedId ? 'Update My Forgery' : 'Post to Gallery'}
            </PrimaryBtn>
          </div>
        </div>
      )}

      {/* ── GALLERY PHASE ── */}
      {phase === 'gallery' && (
        <div className="phase-fade">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
            <SecondaryBtn onClick={() => setPhase('submit')}>← Edit My Forgery</SecondaryBtn>
          </div>
          <Gallery dayKey={todayKey} artwork={artwork} highlightId={submittedId} />
        </div>
      )}
    </main>
  )
}
