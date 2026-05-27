import { useEffect, useRef, useState } from 'react'

export default function Timer({ seconds, onComplete, danger = 10, size = 'lg' }) {
  const [count, setCount] = useState(seconds)
  const [pulsing, setPulsing] = useState(false)
  const intervalRef = useRef(null)
  const doneRef = useRef(false)

  useEffect(() => {
    setCount(seconds)
    doneRef.current = false
  }, [seconds])

  useEffect(() => {
    if (count <= 0) {
      if (!doneRef.current) {
        doneRef.current = true
        onComplete?.()
      }
      return
    }
    intervalRef.current = setInterval(() => {
      setCount(c => {
        setPulsing(false)
        requestAnimationFrame(() => setPulsing(true))
        return c - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [count, onComplete])

  const isDanger = count <= danger && count > 0
  const isLg = size === 'lg'

  return (
    <div
      className={`font-mono font-bold tabular-nums select-none ${isLg ? 'text-7xl' : 'text-4xl'}`}
      style={{ color: isDanger ? 'var(--red)' : 'var(--gold)' }}
    >
      <span
        key={count}
        className={pulsing ? 'pulse inline-block' : 'inline-block'}
        onAnimationEnd={() => setPulsing(false)}
      >
        {count}
      </span>
    </div>
  )
}
