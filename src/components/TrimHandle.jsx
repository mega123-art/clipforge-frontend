import { useRef } from 'react'

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function TrimHandle({ start, end, duration, onStartChange, onEndChange }) {
  const barRef = useRef(null)

  const getPositionFromEvent = (e) => {
    const rect = barRef.current.getBoundingClientRect()
    const x = e.touches ? e.touches[0].clientX : e.clientX
    return Math.max(0, Math.min(1, (x - rect.left) / rect.width))
  }

  const startDrag = (e, type) => {
    e.preventDefault()
    const move = (me) => {
      const pos = getPositionFromEvent(me)
      const time = pos * duration
      if (type === 'start') {
        onStartChange(Math.min(time, end - 1))
      } else {
        onEndChange(Math.max(time, start + 1))
      }
    }
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    window.addEventListener('touchmove', move)
    window.addEventListener('touchend', up)
  }

  const startPct = (start / duration) * 100
  const endPct = (end / duration) * 100

  return (
    <div className="space-y-2 py-2">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{formatTime(start)}</span>
        <span>{formatTime(end)}</span>
      </div>

      <div ref={barRef} className="relative h-6 flex items-center">
        {/* Background track */}
        <div className="absolute inset-x-0 h-1.5 bg-forge-border rounded-full" />

        {/* Selected range */}
        <div
          className="absolute h-1.5 bg-violet-500 rounded-full"
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
        />

        {/* Start handle */}
        <div
          className="absolute w-4 h-4 bg-white rounded-full shadow-lg cursor-ew-resize z-10 -translate-x-1/2"
          style={{ left: `${startPct}%` }}
          onMouseDown={(e) => startDrag(e, 'start')}
          onTouchStart={(e) => startDrag(e, 'start')}
        />

        {/* End handle */}
        <div
          className="absolute w-4 h-4 bg-white rounded-full shadow-lg cursor-ew-resize z-10 -translate-x-1/2"
          style={{ left: `${endPct}%` }}
          onMouseDown={(e) => startDrag(e, 'end')}
          onTouchStart={(e) => startDrag(e, 'end')}
        />
      </div>

      <p className="text-xs text-gray-500 text-center">
        Drag handles to trim · {Math.round(end - start)}s selected
      </p>
    </div>
  )
}
