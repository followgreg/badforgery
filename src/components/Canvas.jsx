import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useState } from 'react'

const MAX_UNDO = 15

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

const Canvas = forwardRef(function Canvas({ brushType, brushSize, color, disabled, aspectRatio = 4 / 3 }, ref) {
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)
  const lastPos = useRef(null)
  const undoStack = useRef([])
  const [, forceUpdate] = useState(0)

  useImperativeHandle(ref, () => ({
    getDataURL: () => canvasRef.current?.toDataURL('image/png'),
    clear: () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      undoStack.current = []
    },
    undo: () => {
      if (undoStack.current.length === 0) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      const prev = undoStack.current.pop()
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = prev
      forceUpdate(n => n + 1)
    },
    canUndo: () => undoStack.current.length > 0,
  }))

  // Size canvas on mount / resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const container = canvas.parentElement
      const w = container.clientWidth
      const h = Math.round(w / aspectRatio)
      // Save current drawing
      const dataUrl = canvas.width > 0 ? canvas.toDataURL() : null
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      if (dataUrl) {
        const img = new Image()
        img.onload = () => ctx.drawImage(img, 0, 0, w, h)
        img.src = dataUrl
      }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement)
    return () => ro.disconnect()
  }, [aspectRatio])

  const saveUndo = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (undoStack.current.length >= MAX_UNDO) undoStack.current.shift()
    undoStack.current.push(canvas.toDataURL())
  }, [])

  const getPos = useCallback((e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const src = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    }
  }, [])

  const drawStroke = useCallback((ctx, from, to, type, size, col) => {
    const { r, g, b } = hexToRgb(col)

    if (type === 'eraser') {
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(to.x, to.y, size, 0, Math.PI * 2)
      ctx.fill()
      // Draw along path
      if (from) {
        const dx = to.x - from.x
        const dy = to.y - from.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const steps = Math.max(1, Math.floor(dist / (size / 2)))
        for (let i = 0; i <= steps; i++) {
          const x = from.x + (dx * i) / steps
          const y = from.y + (dy * i) / steps
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.restore()
      // Fill erased area with white
      ctx.save()
      ctx.globalCompositeOperation = 'destination-over'
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      ctx.restore()
      return
    }

    if (type === 'spray') {
      ctx.save()
      ctx.fillStyle = `rgba(${r},${g},${b},0.6)`
      const radius = size * 2
      const density = size * 3
      const cx = to.x, cy = to.y
      for (let i = 0; i < density; i++) {
        const angle = Math.random() * Math.PI * 2
        const dist = Math.random() * radius
        ctx.beginPath()
        ctx.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, 1, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
      return
    }

    if (type === 'watercolor') {
      ctx.save()
      ctx.globalAlpha = 0.15
      ctx.filter = 'blur(4px)'
      ctx.fillStyle = col
      ctx.beginPath()
      ctx.arc(to.x, to.y, size * 2, 0, Math.PI * 2)
      ctx.fill()
      if (from) {
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.strokeStyle = col
        ctx.lineWidth = size * 3
        ctx.lineCap = 'round'
        ctx.stroke()
      }
      ctx.restore()
      return
    }

    if (type === 'texture') {
      ctx.save()
      ctx.globalAlpha = 0.6
      // Multiple offset strokes for rough edge
      for (let i = 0; i < 4; i++) {
        const ox = (Math.random() - 0.5) * size * 0.6
        const oy = (Math.random() - 0.5) * size * 0.6
        ctx.beginPath()
        if (from) {
          ctx.moveTo(from.x + ox, from.y + oy)
          ctx.lineTo(to.x + ox, to.y + oy)
        } else {
          ctx.arc(to.x + ox, to.y + oy, size / 2, 0, Math.PI * 2)
        }
        ctx.strokeStyle = col
        ctx.lineWidth = size * 0.7
        ctx.lineCap = 'round'
        ctx.stroke()
      }
      ctx.restore()
      return
    }

    if (type === 'flat') {
      ctx.save()
      ctx.globalAlpha = 0.9
      if (from) {
        const angle = Math.atan2(to.y - from.y, to.x - from.x)
        ctx.translate(to.x, to.y)
        ctx.rotate(angle)
        ctx.fillStyle = col
        ctx.fillRect(-size * 1.5, -size / 3, size * 3, size * 0.66)
        // fill along path
        ctx.restore()
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.strokeStyle = col
        ctx.lineWidth = size * 0.7
        ctx.lineCap = 'butt'
        ctx.stroke()
      } else {
        ctx.fillStyle = col
        ctx.fillRect(to.x - size * 1.5, to.y - size / 3, size * 3, size * 0.66)
      }
      ctx.restore()
      return
    }

    // Round (default)
    ctx.save()
    ctx.globalAlpha = 0.9
    ctx.strokeStyle = col
    ctx.fillStyle = col
    ctx.lineWidth = size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (from) {
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.arc(to.x, to.y, size / 2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }, [])

  const startDraw = useCallback((e) => {
    if (disabled) return
    e.preventDefault()
    saveUndo()
    isDrawing.current = true
    const pos = getPos(e)
    lastPos.current = pos
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    drawStroke(ctx, null, pos, brushType, brushSize, color)
  }, [disabled, saveUndo, getPos, drawStroke, brushType, brushSize, color])

  const moveDraw = useCallback((e) => {
    if (!isDrawing.current || disabled) return
    e.preventDefault()
    const pos = getPos(e)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    drawStroke(ctx, lastPos.current, pos, brushType, brushSize, color)
    lastPos.current = pos
  }, [disabled, getPos, drawStroke, brushType, brushSize, color])

  const endDraw = useCallback(() => {
    isDrawing.current = false
    lastPos.current = null
  }, [])

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDraw}
      onMouseMove={moveDraw}
      onMouseUp={endDraw}
      onMouseLeave={endDraw}
      onTouchStart={startDraw}
      onTouchMove={moveDraw}
      onTouchEnd={endDraw}
      style={{
        display: 'block',
        width: '100%',
        touchAction: 'none',
        cursor: disabled ? 'not-allowed' : (brushType === 'eraser' ? 'cell' : 'crosshair'),
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: '#fff',
      }}
    />
  )
})

export default Canvas
