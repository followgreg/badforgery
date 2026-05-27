import { useRef } from 'react'

const BRUSH_TYPES = [
  { id: 'round', label: '●', title: 'Round' },
  { id: 'flat', label: '▬', title: 'Flat' },
  { id: 'texture', label: '◈', title: 'Texture' },
  { id: 'spray', label: '⁘', title: 'Spray' },
  { id: 'watercolor', label: '◉', title: 'Watercolor' },
  { id: 'eraser', label: '◻', title: 'Eraser' },
]

const SIZES = [3, 8, 16, 28, 45]

const PALETTE = [
  // Row 1 — dark spectrum
  '#1a0a0a','#0a1a0a','#0a0a1a','#1a1a0a','#1a0a1a','#0a1a1a',
  // Row 2 — earth/skin tones
  '#8B4513','#CD853F','#DEB887','#F4A460','#E9967A','#BC8F8F',
  // Row 3 — bright spectrum
  '#E24B4A','#E8853A','#E8C547','#4CAF50','#2196F3','#9C27B0',
  // Row 4 — mid tones
  '#C2185B','#FF7043','#FDD835','#66BB6A','#42A5F5','#AB47BC',
  // Row 5 — pastels
  '#F48FB1','#FFCC80','#FFF176','#A5D6A7','#90CAF9','#CE93D8',
  // Row 6 — neutrals
  '#757575','#9E9E9E','#BDBDBD','#E0E0E0','#ECEFF1','#FFFFFF',
]

const label = {
  display: 'block',
  fontFamily: 'var(--font-ui)',
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
  marginBottom: 6,
}

export default function Toolbar({
  brushType, setBrushType,
  brushSize, setBrushSize,
  color, setColor,
  onUndo, onClear,
  disabled,
  orientation = 'vertical',
}) {
  const colorInputRef = useRef(null)
  const isV = orientation === 'vertical'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isV ? 'column' : 'row',
        flexWrap: isV ? undefined : 'wrap',
        gap: isV ? 16 : '0 24px',
        padding: 12,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 0,
        minWidth: isV ? 116 : undefined,
      }}
    >
      {/* Brush type */}
      <div>
        <span style={label}>Brush</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
          {BRUSH_TYPES.map(b => (
            <button
              key={b.id}
              title={b.title}
              disabled={disabled}
              onClick={() => setBrushType(b.id)}
              style={{
                padding: '4px 2px',
                fontSize: 15,
                lineHeight: 1,
                background: brushType === b.id ? 'var(--color-text-primary)' : 'transparent',
                color: brushType === b.id ? 'var(--color-white)' : 'var(--color-text-secondary)',
                border: '1px solid ' + (brushType === b.id ? 'var(--color-text-primary)' : 'var(--color-border)'),
                borderRadius: 0,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                transition: 'background 0.1s, color 0.1s',
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <span style={label}>Size</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SIZES.map(s => (
            <button
              key={s}
              disabled={disabled}
              onClick={() => setBrushSize(s)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '3px 6px',
                background: brushSize === s ? 'var(--color-text-primary)' : 'transparent',
                border: '1px solid ' + (brushSize === s ? 'var(--color-text-primary)' : 'transparent'),
                borderRadius: 0,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
              }}
            >
              <span
                style={{
                  width: Math.min(Math.max(s, 4), 20),
                  height: Math.min(Math.max(s, 4), 20),
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: color,
                  display: 'inline-block',
                }}
              />
              <span style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 10,
                color: brushSize === s ? 'var(--color-white)' : 'var(--color-text-tertiary)',
              }}>
                {s}px
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <span style={label}>Color</span>
        <button
          onClick={() => colorInputRef.current?.click()}
          style={{
            width: '100%',
            height: 28,
            background: color,
            border: '1px solid var(--color-border)',
            borderRadius: 0,
            cursor: 'pointer',
            display: 'block',
            marginBottom: 6,
          }}
          title="Custom color"
        />
        <input
          ref={colorInputRef}
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
        />
        {/* Palette grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2 }}>
          {PALETTE.map(c => (
            <button
              key={c}
              disabled={disabled}
              onClick={() => setColor(c)}
              title={c}
              style={{
                width: 14, height: 14,
                background: c,
                border: color === c ? '2px solid var(--color-gold)' : '1px solid rgba(0,0,0,0.1)',
                borderRadius: 0,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                padding: 0,
              }}
            />
          ))}
          {/* Black and white wide swatches */}
          {['#000000', '#ffffff'].map(c => (
            <button
              key={c}
              disabled={disabled}
              onClick={() => setColor(c)}
              style={{
                gridColumn: 'span 3',
                height: 14,
                background: c,
                border: color === c ? '2px solid var(--color-gold)' : '1px solid rgba(0,0,0,0.1)',
                borderRadius: 0,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* Actions — Undo and Clear, styled to match the design system */}
      <div style={{ display: 'flex', flexDirection: isV ? 'column' : 'row', gap: 6 }}>
        <button
          onClick={onUndo}
          disabled={disabled}
          style={{
            padding: '7px 12px',
            fontFamily: 'var(--font-ui)',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            background: 'var(--color-bg)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 0,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            transition: 'border-color 0.15s, color 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-text-primary)' } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
        >
          ↩ Undo
        </button>
        <button
          onClick={onClear}
          disabled={disabled}
          style={{
            padding: '7px 12px',
            fontFamily: 'var(--font-ui)',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            background: 'var(--color-bg)',
            color: 'var(--color-danger)',
            border: '1px solid var(--color-border)',
            borderRadius: 0,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            transition: 'border-color 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = 'var(--color-danger)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
        >
          ✕ Clear
        </button>
      </div>
    </div>
  )
}
