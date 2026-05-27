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

  const section = 'mb-4'
  const label = 'text-xs uppercase tracking-wider mb-2 block'

  return (
    <div
      className={`flex ${isV ? 'flex-col' : 'flex-row flex-wrap gap-x-6'} p-3 rounded-xl`}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', minWidth: isV ? 120 : undefined }}
    >
      {/* Brush type */}
      <div className={isV ? section : ''}>
        <span className={label} style={{ color: 'var(--text-muted)' }}>Brush</span>
        <div className={`grid grid-cols-3 gap-1`}>
          {BRUSH_TYPES.map(b => (
            <button
              key={b.id}
              title={b.title}
              disabled={disabled}
              onClick={() => setBrushType(b.id)}
              className="rounded p-1 text-lg leading-none transition-all"
              style={{
                background: brushType === b.id ? 'var(--gold)' : 'transparent',
                color: brushType === b.id ? '#0f0e0c' : 'var(--text)',
                border: '1px solid ' + (brushType === b.id ? 'var(--gold)' : 'var(--border)'),
                opacity: disabled ? 0.4 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div className={isV ? section : ''}>
        <span className={label} style={{ color: 'var(--text-muted)' }}>Size</span>
        <div className="flex flex-col gap-1">
          {SIZES.map(s => (
            <button
              key={s}
              disabled={disabled}
              onClick={() => setBrushSize(s)}
              className="flex items-center gap-2 px-2 py-1 rounded text-sm transition-all"
              style={{
                background: brushSize === s ? '#2e2c29' : 'transparent',
                border: '1px solid ' + (brushSize === s ? 'var(--gold)' : 'transparent'),
                color: 'var(--text)',
                opacity: disabled ? 0.4 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <span
                className="rounded-full inline-block flex-shrink-0"
                style={{ width: Math.max(s, 4), height: Math.max(s, 4), background: color, maxWidth: 24, maxHeight: 24 }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{s}px</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active color swatch */}
      <div className={isV ? section : ''}>
        <span className={label} style={{ color: 'var(--text-muted)' }}>Color</span>
        <button
          onClick={() => colorInputRef.current?.click()}
          className="w-full h-8 rounded mb-2 border"
          style={{ background: color, borderColor: 'var(--border)', cursor: 'pointer' }}
          title="Custom color"
        />
        <input
          ref={colorInputRef}
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          className="sr-only"
        />
        {/* Palette grid */}
        <div className="grid grid-cols-6 gap-0.5">
          {PALETTE.map(c => (
            <button
              key={c}
              disabled={disabled}
              onClick={() => setColor(c)}
              title={c}
              className="rounded-sm transition-transform hover:scale-110"
              style={{
                width: 14, height: 14, background: c,
                border: color === c ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
              }}
            />
          ))}
          {/* Black and white */}
          {['#000000', '#ffffff'].map(c => (
            <button
              key={c}
              disabled={disabled}
              onClick={() => setColor(c)}
              className="rounded-sm col-span-3"
              style={{
                height: 14, background: c,
                border: color === c ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
              }}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className={`flex ${isV ? 'flex-col' : 'flex-row'} gap-2 mt-2`}>
        <button
          onClick={onUndo}
          disabled={disabled}
          className="px-3 py-1.5 rounded text-sm font-medium transition-opacity"
          style={{
            background: '#2e2c29', color: 'var(--text)',
            border: '1px solid var(--border)',
            opacity: disabled ? 0.4 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          ↩ Undo
        </button>
        <button
          onClick={onClear}
          disabled={disabled}
          className="px-3 py-1.5 rounded text-sm font-medium transition-opacity"
          style={{
            background: '#2e2c29', color: 'var(--red)',
            border: '1px solid var(--border)',
            opacity: disabled ? 0.4 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          ✕ Clear
        </button>
      </div>
    </div>
  )
}
