import { useState, useRef } from 'react'
import { Scissors, Plus, Clock, Wand2, Check } from 'lucide-react'
import type { AxiosError } from 'axios'

function toSeconds(str: string): number {
  const parts = str.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + (parts[1] || 0)
  if (parts.length === 1) return parts[0] || 0
  return 0
}

function toMMSS(s: number): string {
  const sec = Math.max(0, Math.floor(s))
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

// Extract a single timestamp from a text fragment.
function extractTimestamp(text: string): number | null {
  const t = text.trim()

  let m = t.match(/(\d{1,3}):(\d{2})/)
  if (m) return parseInt(m[1]) * 60 + parseInt(m[2])

  m = t.match(/(\d{1,3})\.(\d{2})\b/)
  if (m && parseInt(m[2]) <= 59) return parseInt(m[1]) * 60 + parseInt(m[2])

  m = t.match(/(\d+)\s*m(?:in(?:utes?)?)?\s*(\d+)\s*s(?:ec(?:onds?)?)?/i)
  if (m) return parseInt(m[1]) * 60 + parseInt(m[2])

  m = t.match(/(\d+)\s*m(?:in(?:utes?)?)?(?!\s*\d)/i)
  if (m) return parseInt(m[1]) * 60

  m = t.match(/(\d+)\s*s(?:ec(?:onds?)?)?/i)
  if (m) return parseInt(m[1])

  m = t.match(/(\d+)/)
  if (m) return parseInt(m[1])

  return null
}

interface ParsedRange {
  start: number
  end: number
}

function parseNLP(text: string): ParsedRange | null {
  const halves = text.split(/\bto\b|\band\b|[-–—]/i)
  if (halves.length >= 2) {
    const s = extractTimestamp(halves[0])
    const e = extractTimestamp(halves[1])
    if (s !== null && e !== null) return { start: s, end: e }
  }

  const tokens: number[] = []
  const combined = text.matchAll(/(\d{1,3}:\d{2}|\d{1,3}\.\d{2}|\d+\s*m(?:in)?(?:\s*\d+\s*s(?:ec)?)?|\d+\s*s(?:ec(?:onds?)?)?|\d+)/gi)
  for (const match of combined) {
    const tok = extractTimestamp(match[0])
    if (tok !== null) tokens.push(tok)
    if (tokens.length === 2) break
  }
  if (tokens.length === 2) return { start: tokens[0], end: tokens[1] }

  return null
}

interface TimeInputProps {
  label: string
  value: number
  max: number
  onChange: (v: number) => void
}

function TimeInput({ label, value, max, onChange }: TimeInputProps) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState('')

  const commit = () => {
    const s = Math.max(0, Math.min(max, toSeconds(raw)))
    onChange(s)
    setEditing(false)
  }

  return (
    <div className="flex flex-col gap-1 flex-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-forge-dim">{label}</span>
      {editing ? (
        <input
          autoFocus
          type="text"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          placeholder="m:ss"
          className="bg-forge-surface border border-forge-accent/50 rounded-lg px-3 py-2 text-sm font-mono text-forge-text outline-none w-full"
        />
      ) : (
        <button
          onClick={() => { setRaw(toMMSS(value)); setEditing(true) }}
          className="bg-forge-surface border border-forge-border hover:border-forge-accent/50 rounded-lg px-3 py-2 text-sm font-mono text-forge-text text-left transition-colors cursor-pointer"
        >
          {toMMSS(value)}
        </button>
      )}
    </div>
  )
}

interface ManualClipperProps {
  duration: number
  jobId: string
  onCreated: () => void
}

type DragType = 'start' | 'end' | null

export default function ManualClipper({ duration, jobId, onCreated }: ManualClipperProps) {
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(Math.min(60, duration))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nlpText, setNlpText] = useState('')
  const [nlpParsed, setNlpParsed] = useState(false)
  const barRef = useRef<HTMLDivElement | null>(null)
  const dragging = useRef<DragType>(null)

  const clampStart = (v: number) => setStart(Math.max(0, Math.min(v, end - 1)))
  const clampEnd = (v: number) => setEnd(Math.min(duration, Math.max(v, start + 1)))

  const getPosFromEvent = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): number => {
    const rect = barRef.current!.getBoundingClientRect()
    const x = 'touches' in e && e.touches.length
      ? e.touches[0].clientX
      : (e as MouseEvent).clientX
    return Math.max(0, Math.min(1, (x - rect.left) / rect.width))
  }

  const startDrag = (e: React.MouseEvent | React.TouchEvent, type: 'start' | 'end') => {
    e.preventDefault()
    dragging.current = type
    const move = (me: MouseEvent | TouchEvent) => {
      const t = getPosFromEvent(me) * duration
      if (dragging.current === 'start') clampStart(t)
      else clampEnd(t)
    }
    const up = () => {
      dragging.current = null
      window.removeEventListener('mousemove', move as EventListener)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchmove', move as EventListener)
      window.removeEventListener('touchend', up)
    }
    window.addEventListener('mousemove', move as EventListener)
    window.addEventListener('mouseup', up)
    window.addEventListener('touchmove', move as EventListener, { passive: false })
    window.addEventListener('touchend', up)
  }

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragging.current) return
    const t = getPosFromEvent(e) * duration
    const dStart = Math.abs(t - start)
    const dEnd = Math.abs(t - end)
    if (dStart <= dEnd) clampStart(t)
    else clampEnd(t)
  }

  const handleNLP = () => {
    if (!nlpText.trim()) return
    const result = parseNLP(nlpText)
    if (!result) {
      setError("Couldn't parse timestamps — try '3:02 to 5:30' or '1m30s - 4m'")
      return
    }
    const s = Math.max(0, Math.min(result.start, duration))
    const e = Math.max(0, Math.min(result.end, duration))
    if (s >= e) {
      setError('Start must be before end')
      return
    }
    setStart(s)
    setEnd(e)
    setError(null)
    setNlpParsed(true)
    setTimeout(() => setNlpParsed(false), 2000)
  }

  const startPct = (start / duration) * 100
  const endPct = (end / duration) * 100
  const clipDuration = Math.round(end - start)

  const handleCreate = async () => {
    if (end <= start) { setError('End must be after start'); return }
    setLoading(true)
    setError(null)
    try {
      const { default: api } = await import('../api')
      await api.post(`/api/jobs/${jobId}/manual-clip`, {
        start_seconds: parseFloat(start.toFixed(2)),
        end_seconds: parseFloat(end.toFixed(2)),
      }, { silent: true })
      onCreated()
    } catch (err) {
      const ax = err as AxiosError<{ detail?: string }>
      setError(ax.response?.data?.detail || 'Failed to create clip')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card rounded-2xl p-5 border border-forge-border space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-forge-accent/10 border border-forge-accent/20 flex items-center justify-center">
          <Scissors size={13} className="text-forge-accent" />
        </div>
        <span className="text-sm font-black text-forge-text">Manual Clip</span>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-forge-dim px-2.5 py-1 rounded-full bg-forge-surface border border-forge-border">
          <Clock size={11} />
          {clipDuration}s
        </span>
      </div>

      {/* NLP input */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-forge-surface border border-forge-border focus-within:border-forge-accent/40 rounded-xl px-3 py-2.5 transition-colors">
          <Wand2 size={13} className="text-forge-accent shrink-0" />
          <input
            type="text"
            value={nlpText}
            onChange={(e) => { setNlpText(e.target.value); setNlpParsed(false) }}
            onKeyDown={(e) => e.key === 'Enter' && handleNLP()}
            placeholder="e.g. 'clip from 3:02 to 5:30' or '1.30 to 4.00'"
            className="flex-1 bg-transparent outline-none text-sm text-forge-text placeholder-forge-dim"
          />
        </div>
        <button
          onClick={handleNLP}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shrink-0 ${
            nlpParsed
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              : 'bg-forge-accent/10 border-forge-accent/30 text-forge-accent hover:bg-forge-accent/20'
          }`}
        >
          {nlpParsed ? <><Check size={13} /> Parsed</> : <><Wand2 size={13} /> Parse</>}
        </button>
      </div>

      {/* Scrubber bar */}
      <div
        ref={barRef}
        className="relative h-8 flex items-center cursor-pointer select-none"
        onClick={handleBarClick}
      >
        <div className="absolute inset-x-0 h-2 bg-forge-surface rounded-full border border-forge-border" />
        <div
          className="absolute h-2 bg-forge-accent/70 rounded-full"
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
        />
        <div
          className="absolute w-5 h-5 rounded-full bg-white border-2 border-forge-accent shadow-lg cursor-ew-resize z-10 -translate-x-1/2 hover:scale-110 transition-transform"
          style={{ left: `${startPct}%` }}
          onMouseDown={(e) => startDrag(e, 'start')}
          onTouchStart={(e) => startDrag(e, 'start')}
          onClick={(e) => e.stopPropagation()}
        />
        <div
          className="absolute w-5 h-5 rounded-full bg-white border-2 border-forge-accent shadow-lg cursor-ew-resize z-10 -translate-x-1/2 hover:scale-110 transition-transform"
          style={{ left: `${endPct}%` }}
          onMouseDown={(e) => startDrag(e, 'end')}
          onTouchStart={(e) => startDrag(e, 'end')}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Timeline labels */}
      <div className="flex justify-between text-[10px] text-forge-dim font-mono -mt-2">
        <span>0:00</span>
        <span>{toMMSS(duration / 2)}</span>
        <span>{toMMSS(duration)}</span>
      </div>

      {/* Time inputs + create */}
      <div className="flex gap-3 items-end">
        <TimeInput label="Start" value={start} max={end - 1} onChange={clampStart} />
        <div className="pb-2.5 text-forge-dim text-sm">→</div>
        <TimeInput label="End" value={end} max={duration} onChange={clampEnd} />
        <button
          onClick={handleCreate}
          disabled={loading || clipDuration < 1}
          className="btn-primary flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Plus size={14} />}
          {loading ? 'Creating…' : 'Create Clip'}
        </button>
      </div>

      {error && (
        <p className="text-xs text-forge-gold bg-forge-gold/10 border border-forge-gold/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  )
}
