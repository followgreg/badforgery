import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Canvas from '../components/Canvas'
import Toolbar from '../components/Toolbar'
import Timer from '../components/Timer'
import Gallery from '../components/Gallery'
import { fetchArtworkForDay } from '../lib/artwork'
import { getTodayKey } from '../lib/storage'
import { supabase } from '../lib/supabase'

const STUDY_SECONDS = 10
const DRAW_SECONDS = 60
const HEADER_H = 56 // px — must match App.jsx header height

// Button helpers
function PrimaryBtn({ children, onClick, disabled, style }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '13px 36px',
        background: disabled ? 'var(--color-border)' : hovered ? 'var(--color-gold)' : 'var(--color-text-primary)',
        color: hovered && !disabled ? 'var(--color-text-primary)' : 'var(--color-white)',
        fontFamily: 'var(--font-ui)',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        border: 'none',
        borderRadius: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s, color 0.15s',
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
        padding: '11px 24px',
        background: 'transparent',
        color: hovered ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        fontFamily: 'var(--font-ui)',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        border: '1px solid ' + (hovered ? 'var(--color-gold)' : 'var(--color-border)'),
        borderRadius: 0,
        cursor: 'pointer',
        transition: 'border-color 0.15s, color 0.15s',
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
  const todayKey = getTodayKey()

  // Always start fresh — unlimited plays per day
  const [phase, setPhase] = useState('study')
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
  const [submittedId, setSubmittedId] = useState(null)   // current session's submission ID (for gallery highlight)
  const [submitError, setSubmitError] = useState('')
  const [toast, setToast] = useState('')

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

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
  }, [])

  const handleDrawComplete = useCallback(() => {
    setDrawDisabled(true)
    setTimeUp(true)
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
      // Always insert a new submission — unlimited plays allowed
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
      setSubmittedId(data.id)   // track for gallery highlight this session
      setPhase('gallery')
    } catch (e) {
      setSubmitError('Something went wrong. Try again.')
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  // The viewport height available below the header
  const gameH = `calc(100dvh - ${HEADER_H}px)`

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: HEADER_H + 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          padding: '10px 24px',
          background: 'var(--color-text-primary)',
          color: 'var(--color-white)',
          fontFamily: 'var(--font-ui)',
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: '0.08em',
          whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}

      {/* ── STUDY PHASE ── fills viewport below header, no scroll */}
      {phase === 'study' && (
        <div
          className="phase-fade"
          style={{
            height: gameH,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: isMobile ? '16px 20px 12px' : '24px 48px 16px',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          <EyebrowLabel>Study the Painting</EyebrowLabel>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: isMobile ? 22 : 30,
            color: 'var(--color-text-primary)',
            marginBottom: 4,
            textAlign: 'center',
            lineHeight: 1.2,
            flexShrink: 0,
          }}>
            Memorize it. You won't see it again.
          </h2>
          <p style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 12,
            color: 'var(--color-text-tertiary)',
            marginBottom: 12,
            textAlign: 'center',
            flexShrink: 0,
          }}>
            {artwork?.title && `${artwork.title}${artwork.artist_display ? ' · ' + artwork.artist_display.split('(')[0].trim() : ''}`}
          </p>

          {/* Image — flex-grows to fill remaining space; overlays inside */}
          <div style={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}>
            {artworkError ? (
              <p style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-ui)', fontSize: 14 }}>
                Today's painting couldn't load — try refreshing.
              </p>
            ) : (
              <>
                {!artworkLoaded && (
                  <div style={{
                    width: '100%',
                    maxWidth: '100%',
                    aspectRatio: String(artworkRatio),
                    background: 'var(--color-surface)',
                    borderRadius: 2,
                    maxHeight: '100%',
                  }} className="animate-pulse" />
                )}
                {artwork && (
                  <div style={{
                    position: 'relative',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    display: artworkLoaded ? 'block' : 'none',
                  }}>
                    <img
                      src={artwork.image_url}
                      alt={artwork.title}
                      style={{
                        display: 'block',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                      }}
                      onLoad={() => setArtworkLoaded(true)}
                    />
                    {showBlack && (
                      <div className="absolute inset-0 fade-black" style={{ background: 'var(--color-text-primary)' }} />
                    )}
                  </div>
                )}
              </>
            )}

            {/* Timer — overlaid at bottom of image area */}
            {artworkLoaded && !readyBtn && (
              <div style={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
              }}>
                <Timer seconds={STUDY_SECONDS} onComplete={handleStudyComplete} danger={4} />
              </div>
            )}

            {/* Ready to Draw — centered overlay on blacked-out image */}
            {readyBtn && (
              <div
                className="phase-fade"
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PrimaryBtn onClick={handleStartDraw}>Ready to Draw</PrimaryBtn>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DRAW PHASE ── fills viewport below header, no scroll */}
      {phase === 'draw' && (
        <div
          className="phase-fade"
          style={{
            height: gameH,
            display: 'flex',
            flexDirection: 'column',
            padding: isMobile ? '10px 12px 6px' : '12px 20px 8px',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {/* Compact header row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
            flexShrink: 0,
            gap: 12,
          }}>
            <div style={{ minWidth: 0 }}>
              <EyebrowLabel>Drawing from memory</EyebrowLabel>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: isMobile ? 14 : 17,
                color: 'var(--color-text-primary)',
                lineHeight: 1.2,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}>
                {artwork?.title}
              </p>
            </div>
            {!timeUp
              ? <Timer seconds={DRAW_SECONDS} onComplete={handleDrawComplete} size="sm" />
              : <span style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--color-danger)',
                  flexShrink: 0,
                }}>Time's Up</span>
            }
          </div>

          {/* Canvas + Toolbar — fills remaining height */}
          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 10,
          }}>
            {/* Desktop: toolbar on left */}
            {!isMobile && (
              <div style={{ flexShrink: 0, overflowY: 'auto' }}>
                <Toolbar
                  brushType={brushType} setBrushType={setBrushType}
                  brushSize={brushSize} setBrushSize={setBrushSize}
                  color={color} setColor={setColor}
                  onUndo={handleUndo} onClear={handleClear}
                  disabled={drawDisabled}
                  orientation="vertical"
                />
              </div>
            )}

            {/* Canvas — centered, scales to fit; submit overlay when time's up */}
            <div style={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              display: 'flex',
              alignItems: isMobile ? 'flex-start' : 'center',
              justifyContent: 'center',
              position: 'relative',
            }}>
              <Canvas
                ref={canvasRef}
                brushType={brushType} brushSize={brushSize} color={color}
                disabled={drawDisabled} aspectRatio={artworkRatio}
              />
              {timeUp && (
                <div
                  className="phase-fade"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(26,23,20,0.6)',
                  }}
                >
                  <PrimaryBtn onClick={() => {
                    setCapturedDataUrl(canvasRef.current?.getDataURL())
                    setPhase('submit')
                  }}>
                    Submit Your Forgery
                  </PrimaryBtn>
                </div>
              )}
            </div>

            {/* Mobile: toolbar below canvas, horizontally scrollable */}
            {isMobile && (
              <div style={{ flexShrink: 0, overflowX: 'auto' }}>
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

        </div>
      )}

      {/* ── SUBMIT PHASE ── scrollable, centered */}
      {phase === 'submit' && (
        <div
          className="phase-fade"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: 860,
            margin: '0 auto',
            width: '100%',
            padding: isMobile ? '24px 20px 48px' : '32px 40px 64px',
            boxSizing: 'border-box',
          }}
        >
          <EyebrowLabel>Your Forgery</EyebrowLabel>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(26px, 4vw, 38px)',
            color: 'var(--color-text-primary)',
            marginBottom: 6,
            textAlign: 'center',
          }}>
            Ready to confess?
          </h2>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--color-text-tertiary)', marginBottom: 32 }}>
            Post it to the global gallery.
          </p>

          {/* Side by side */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 24,
            width: '100%',
            marginBottom: 32,
          }}>
            <div>
              <EyebrowLabel>The Original</EyebrowLabel>
              {artwork?.image_url && (
                <img src={artwork.image_url} alt={artwork.title}
                  style={{ width: '100%', objectFit: 'contain', maxHeight: 280 }} />
              )}
              <p style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 13,
                color: 'var(--color-text-secondary)',
                marginTop: 8,
                textAlign: 'center',
              }}>
                {artwork?.title}
              </p>
            </div>
            <div>
              <EyebrowLabel>Your Forgery</EyebrowLabel>
              <img
                src={capturedDataUrl}
                alt="Your drawing"
                style={{ width: '100%', objectFit: 'contain', maxHeight: 280, background: '#fff' }}
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
                boxSizing: 'border-box',
              }}
            />
            <p style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 11,
              color: 'var(--color-text-tertiary)',
              textAlign: 'right',
              marginTop: 4,
            }}>
              {nickname.length}/20
            </p>
          </div>

          {submitError && (
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-danger)', marginBottom: 12 }}>
              {submitError}
            </p>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <PrimaryBtn onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Posting…' : 'Post to Gallery'}
            </PrimaryBtn>
          </div>
        </div>
      )}

      {/* ── GALLERY PHASE ── matches Archive page layout */}
      {phase === 'gallery' && (
        <div
          className="phase-fade"
          style={{
            flex: 1,
            maxWidth: 860,
            margin: '0 auto',
            width: '100%',
            padding: isMobile ? '24px 20px 64px' : '28px 40px 64px',
            boxSizing: 'border-box',
          }}
        >
          {/* Play Again — resets everything for a fresh session */}
          <button
            onClick={() => {
              setCapturedDataUrl(null)
              setSubmittedId(null)
              setTimeUp(false)
              setDrawDisabled(false)
              setShowBlack(false)
              setReadyBtn(false)
              setArtworkLoaded(false)
              setPhase('study')
            }}
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-text-tertiary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'inline-block',
              marginBottom: 28,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-tertiary)'}
          >
            ← Play Again
          </button>

          {/* Placard — mirrors Archive */}
          <div style={{ marginBottom: 24 }}>
            <p style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-text-tertiary)',
              marginBottom: 6,
            }}>
              {new Date(todayKey + 'T12:00:00Z').toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
              })}
            </p>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(24px, 5vw, 40px)',
              color: 'var(--color-text-primary)',
              lineHeight: 1.15,
              marginBottom: 6,
            }}>
              {artwork?.title || '…'}
            </h2>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--color-text-secondary)' }}>
              {artwork?.artist_display?.split('(')[0].trim()}
            </p>
            {artwork?.date_display && (
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 3 }}>
                {artwork.date_display}
              </p>
            )}
          </div>

          {/* The Original — mirrors Archive */}
          <div style={{ marginBottom: 32 }}>
            <p style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-text-tertiary)',
              marginBottom: 10,
            }}>
              The Original
            </p>
            {artwork ? (
              <img
                src={artwork.image_url}
                alt={artwork.title}
                style={{ display: 'block', width: '100%', objectFit: 'contain', maxHeight: '52vh' }}
              />
            ) : (
              <div style={{ aspectRatio: '4/3', background: 'var(--color-surface)', maxHeight: '52vh' }} className="animate-pulse" />
            )}
          </div>

          {/* Gallery of today's forgeries */}
          <Gallery dayKey={todayKey} artwork={artwork} highlightId={submittedId} />
        </div>
      )}
    </main>
  )
}
