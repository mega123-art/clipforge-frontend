import { useRef } from 'react'

interface TrimHandleProps {
  /** Absolute source-video seconds — same units the backend stores in user_start/end_seconds. */
  start: number
  end: number
  /** Bounds the handles may travel between, also in absolute source seconds. */
  min: number
  max: number
  onStartChange: (v: number) => void
  onEndChange: (v: number) => void
}

const MIN_CLIP_SECONDS = 1
const KEY_STEP_SECONDS = 1

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function TrimHandle({ start, end, min, max, onStartChange, onEndChange }: TrimHandleProps) {
  const barRef = useRef<HTMLDivElement | null>(null)

  const span = Math.max(max - min, MIN_CLIP_SECONDS)

  const clampStart = (v: number) => Math.max(min, Math.min(v, end - MIN_CLIP_SECONDS))
  const clampEnd = (v: number) => Math.min(max, Math.max(v, start + MIN_CLIP_SECONDS))

  // Pointer events + capture: one code path for mouse/touch/pen, and the
  // capture is released automatically if the element unmounts mid-drag.
  const startDrag = (e: React.PointerEvent<HTMLDivElement>, type: 'start' | 'end') => {
    e.preventDefault()
    e.stopPropagation()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)

    const move = (pe: PointerEvent) => {
      const rect = barRef.current?.getBoundingClientRect()
      if (!rect?.width) return
      const pos = Math.max(0, Math.min(1, (pe.clientX - rect.left) / rect.width))
      const time = min + pos * span
      if (type === 'start') onStartChange(clampStart(time))
      else onEndChange(clampEnd(time))
    }
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
  }

  const onKeyDown = (e: React.KeyboardEvent, type: 'start' | 'end') => {
    const dir = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0
    if (!dir) return
    e.preventDefault()
    e.stopPropagation()
    const step = dir * KEY_STEP_SECONDS
    if (type === 'start') onStartChange(clampStart(start + step))
    else onEndChange(clampEnd(end + step))
  }

  const pct = (v: number) => Math.max(0, Math.min(100, ((v - min) / span) * 100))
  const startPct = pct(start)
  const endPct = pct(end)

  const handleProps = (type: 'start' | 'end') => ({
    role: 'slider' as const,
    tabIndex: 0,
    'aria-label': type === 'start' ? 'Clip start' : 'Clip end',
    'aria-valuemin': Math.round(min),
    'aria-valuemax': Math.round(max),
    'aria-valuenow': Math.round(type === 'start' ? start : end),
    'aria-valuetext': formatTime(type === 'start' ? start : end),
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => startDrag(e, type),
    onKeyDown: (e: React.KeyboardEvent) => onKeyDown(e, type),
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    // touch-action:none is what stops the browser scrolling instead of dragging.
    style: { left: `${type === 'start' ? startPct : endPct}%`, touchAction: 'none' as const },
    className:
      'absolute w-4 h-4 bg-white rounded-full shadow-lg cursor-ew-resize z-10 -translate-x-1/2 ' +
      'outline-none focus-visible:ring-2 focus-visible:ring-forge-accent',
  })

  return (
    <div className="space-y-2 py-2">
      <div className="flex justify-between text-xs text-gray-400 font-mono tabular-nums">
        <span>{formatTime(start)}</span>
        <span>{formatTime(end)}</span>
      </div>

      <div ref={barRef} className="relative h-6 flex items-center select-none">
        {/* Background track */}
        <div className="absolute inset-x-0 h-1.5 bg-forge-border rounded-full" />

        {/* Selected range */}
        <div
          className="absolute h-1.5 bg-forge-accent rounded-full"
          style={{ left: `${startPct}%`, width: `${Math.max(0, endPct - startPct)}%` }}
        />

        <div {...handleProps('start')} />
        <div {...handleProps('end')} />
      </div>

      <p className="text-xs text-gray-500 text-center">
        Drag handles to trim · {Math.round(end - start)}s selected
      </p>
    </div>
  )
}
