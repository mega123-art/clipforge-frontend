import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader, Pause, Play, Scissors, Trash2 } from 'lucide-react'
import api, { API_BASE_URL as API_BASE } from '../api'

export type CropRect = [number, number, number, number] // x, y, w, h — source-normalized
export type FrameLayout = 'single' | 'split' | 'fit'
export interface FrameSegment {
  start: number   // seconds from clip start
  end: number
  layout: FrameLayout
  rects: CropRect[]
}
export interface FrameValue { segments: FrameSegment[] }

interface Props {
  clipId: string
  value: FrameValue | null
  onChange: (v: FrameValue) => void
}

// Output canvas is 1080x1920. `single` fills it, `split` stacks two 1080x960
// halves, `fit` letterboxes the window whole. Box aspect here must match, or
// the drag preview lies about what gets exported. `fit` is free-form.
const ASPECT: Record<FrameLayout, number | null> = {
  single: 1080 / 1920,
  split: 1080 / 960,
  fit: null,
}
const LAYOUT_LABEL: Record<FrameLayout, string> = {
  single: 'One window',
  split: 'Split screen',
  fit: 'Fit whole (bars)',
}
const PREVIEW_W = 216
const PREVIEW_H = 384

function widthFor(a: number, h: number, srcW: number, srcH: number) {
  return (a * h * srcH) / srcW
}

function clampRect(r: CropRect): CropRect {
  const [, , w, h] = r
  return [
    Math.min(Math.max(r[0], 0), Math.max(0, 1 - w)),
    Math.min(Math.max(r[1], 0), Math.max(0, 1 - h)),
    w, h,
  ]
}

function defaultRects(layout: FrameLayout, srcW: number, srcH: number): CropRect[] {
  const a = ASPECT[layout]
  if (a === null) return [[0, 0, 1, 1]]  // fit: whole frame, bars fill the rest
  const fit = (want: number): [number, number] => {
    let h = want
    let w = widthFor(a, h, srcW, srcH)
    if (w > 1) { w = 1; h = (srcW / srcH) / a }
    return [w, h]
  }
  if (layout === 'single') {
    const [w, h] = fit(1)
    return [clampRect([(1 - w) / 2, (1 - h) / 2, w, h])]
  }
  // Split: left and right halves — the two-up podcast shot.
  const [w, h] = fit(0.9)
  const y = (1 - h) / 2
  return [
    clampRect([Math.max(0, 0.25 - w / 2), y, w, h]),
    clampRect([Math.min(1 - w, 0.75 - w / 2), y, w, h]),
  ]
}

const segAt = (segs: FrameSegment[], t: number) =>
  segs.findIndex((s) => t >= s.start && t < s.end)

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`

/**
 * Manual reframe editor. Plays the clip at its ORIGINAL aspect and lets the
 * user hand-place the vertical window — per time range, because podcast
 * sources cut between a single-speaker shot and a two-up split, and one crop
 * that suits the first lands on the seam of the second.
 */
export default function FrameEditor({ clipId, value, onChange }: Props) {
  const [src, setSrc] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const [duration, setDuration] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [sel, setSel] = useState(0)        // segment being edited
  const [activeBox, setActiveBox] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<{ i: number; mode: 'move' | 'resize'; dx: number; dy: number } | null>(null)
  const valueRef = useRef<FrameValue | null>(value)
  valueRef.current = value

  const segments = value?.segments ?? []
  const current: FrameSegment | undefined = segments[Math.min(sel, segments.length - 1)]

  // The low-res source proxy is rendered server-side on this call.
  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setSrc(null)
    api.get<{ stream_url: string }>(`/api/clips/${clipId}/source-clip-url`)
      .then(({ data }) => {
        if (cancelled) return
        setSrc(`${API_BASE}${data.stream_url}`)
        setStatus('ready')
      })
      .catch(() => { if (!cancelled) setStatus('error') })
    return () => { cancelled = true }
  }, [clipId])

  const onLoaded = () => {
    const v = videoRef.current
    if (!v) return
    const d = { w: v.videoWidth, h: v.videoHeight }
    setDims(d)
    setDuration(v.duration || 0)
    if (!value) {
      onChange({ segments: [{ start: 0, end: v.duration || 0, layout: 'single', rects: defaultRects('single', d.w, d.h) }] })
    }
    v.play().then(() => setPlaying(true)).catch(() => {})
  }

  // Live 9:16 preview — draws whichever segment owns the current playhead, so
  // playing through shows the real cut-to-cut result.
  useEffect(() => {
    let raf = 0
    const draw = () => {
      raf = requestAnimationFrame(draw)
      const v = videoRef.current
      const c = canvasRef.current
      const segs = valueRef.current?.segments
      if (!v || !c || !segs?.length || !v.videoWidth) return
      const ctx = c.getContext('2d')
      if (!ctx) return
      const seg = segs[Math.max(0, segAt(segs, v.currentTime))] ?? segs[0]
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H)
      const px = (r: CropRect) => [r[0] * v.videoWidth, r[1] * v.videoHeight, r[2] * v.videoWidth, r[3] * v.videoHeight] as const
      if (seg.layout === 'fit') {
        const [sx, sy, sw, sh] = px(seg.rects[0])
        const k = Math.min(PREVIEW_W / sw, PREVIEW_H / sh)
        ctx.drawImage(v, sx, sy, sw, sh, (PREVIEW_W - sw * k) / 2, (PREVIEW_H - sh * k) / 2, sw * k, sh * k)
      } else {
        const slotH = PREVIEW_H / seg.rects.length
        seg.rects.forEach((r, i) => {
          const [sx, sy, sw, sh] = px(r)
          ctx.drawImage(v, sx, sy, sw, sh, 0, i * slotH, PREVIEW_W, slotH)
        })
      }
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const patchSeg = useCallback((i: number, patch: Partial<FrameSegment>) => {
    const val = valueRef.current
    if (!val) return
    const segments = val.segments.slice()
    segments[i] = { ...segments[i], ...patch }
    onChange({ segments })
  }, [onChange])

  const setRect = useCallback((box: number, r: CropRect) => {
    const val = valueRef.current
    if (!val || !val.segments[sel]) return
    const rects = val.segments[sel].rects.slice()
    rects[box] = clampRect(r)
    patchSeg(sel, { rects })
  }, [sel, patchSeg])

  // ── Segment timeline ops ──────────────────────────────────────────────────
  const splitHere = () => {
    const val = valueRef.current
    const v = videoRef.current
    if (!val || !v) return
    const t = v.currentTime
    const i = segAt(val.segments, t)
    if (i < 0) return
    const s = val.segments[i]
    if (t - s.start < 0.3 || s.end - t < 0.3) return  // too tight to be useful
    const segments = val.segments.slice()
    segments.splice(i, 1,
      { ...s, end: t },
      { ...s, start: t, rects: s.rects.map((r) => [...r] as CropRect) },
    )
    onChange({ segments })
    setSel(i + 1)
  }

  const deleteSeg = (i: number) => {
    const val = valueRef.current
    if (!val || val.segments.length < 2) return
    const segments = val.segments.filter((_, k) => k !== i)
    // Absorb the removed span into its neighbour so the timeline stays gapless.
    if (i === 0) segments[0] = { ...segments[0], start: 0 }
    else segments[i - 1] = { ...segments[i - 1], end: val.segments[i].end }
    onChange({ segments })
    setSel(Math.max(0, i - 1))
  }

  const setLayout = (layout: FrameLayout) => {
    if (!dims || !current) return
    const keep = current.rects
    let rects = defaultRects(layout, dims.w, dims.h)
    // Keep the user's placement where the shapes still line up.
    if (layout === 'split' && keep.length === 2) rects = keep
    if (layout === 'single' && keep.length >= 1 && current.layout !== 'fit') {
      rects = [clampRect([keep[0][0], keep[0][1], rects[0][2], rects[0][3]])]
    }
    patchSeg(sel, { layout, rects })
    setActiveBox(0)
  }

  // ── Dragging ──────────────────────────────────────────────────────────────
  const stagePoint = (e: React.PointerEvent) => {
    const host = stageRef.current!.getBoundingClientRect()
    return { px: (e.clientX - host.left) / host.width, py: (e.clientY - host.top) / host.height }
  }

  const startDrag = (e: React.PointerEvent, i: number, mode: 'move' | 'resize') => {
    if (!current) return
    e.stopPropagation()
    const { px, py } = stagePoint(e)
    const r = current.rects[i]
    dragRef.current = { i, mode, dx: px - r[0], dy: py - r[1] }
    setActiveBox(i)
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d || !current || !dims) return
    const { px, py } = stagePoint(e)
    const r = current.rects[d.i]
    if (d.mode === 'move') {
      setRect(d.i, [px - d.dx, py - d.dy, r[2], r[3]])
      return
    }
    // Resize from the bottom-right corner, top-left pinned.
    const a = ASPECT[current.layout]
    let h = Math.min(Math.max(py - r[1], 0.08), 1 - r[1])
    if (a === null) {
      const w = Math.min(Math.max(px - r[0], 0.08), 1 - r[0])
      setRect(d.i, [r[0], r[1], w, h])
      return
    }
    let w = widthFor(a, h, dims.w, dims.h)
    if (r[0] + w > 1) { w = 1 - r[0]; h = (w * dims.w) / (a * dims.h) }
    setRect(d.i, [r[0], r[1], w, h])
  }

  const endDrag = () => { dragRef.current = null }

  const nudge = (e: React.KeyboardEvent) => {
    if (!current) return
    const step = e.shiftKey ? 0.05 : 0.01
    const map: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
    }
    const d = map[e.key]
    if (!d) return
    e.preventDefault()
    const r = current.rects[activeBox]
    setRect(activeBox, [r[0] + d[0], r[1] + d[1], r[2], r[3]])
  }

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play().then(() => setPlaying(true)).catch(() => {})
    else { v.pause(); setPlaying(false) }
  }

  const seek = (t: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = t
    setTime(t)
    const i = segAt(valueRef.current?.segments ?? [], t)
    if (i >= 0) setSel(i)
  }

  if (status === 'error') {
    return <p className="text-xs text-red-400">Couldn’t load the source video for framing.</p>
  }

  return (
    <div className="space-y-2">
      {/* Layout of the SELECTED segment */}
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Layout for this segment">
        {(Object.keys(LAYOUT_LABEL) as FrameLayout[]).map((l) => (
          <button
            key={l}
            role="radio"
            aria-checked={current?.layout === l}
            onClick={() => setLayout(l)}
            className={`px-2.5 py-1 rounded-lg text-xs border transition-colors duration-200 cursor-pointer ${
              current?.layout === l
                ? 'bg-forge-card border-forge-accent text-pink-200'
                : 'border-forge-border text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            {LAYOUT_LABEL[l]}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {/* Stage: original-aspect video with the draggable window(s) */}
        <div
          ref={stageRef}
          className="relative flex-1 min-w-0 rounded-lg overflow-hidden bg-black select-none touch-none"
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {src && (
            <video
              ref={videoRef}
              src={src}
              onLoadedMetadata={onLoaded}
              onTimeUpdate={(e) => {
                const v = e.currentTarget
                setTime(v.currentTime)
                // Follow the playhead only while playing, so editing a segment
                // doesn't get yanked away mid-drag.
                if (!v.paused) {
                  const i = segAt(valueRef.current?.segments ?? [], v.currentTime)
                  if (i >= 0) setSel(i)
                }
              }}
              onEnded={() => setPlaying(false)}
              loop
              muted
              playsInline
              className="w-full block"
            />
          )}
          {status === 'loading' && (
            <div className="aspect-video grid place-items-center text-gray-400 gap-2">
              <Loader size={18} className="animate-spin" />
              <span className="text-[10px]">Preparing source…</span>
            </div>
          )}
          {current?.rects.map((r, i) => (
            <div
              key={i}
              role="slider"
              tabIndex={0}
              aria-label={current.rects.length > 1 ? `Window ${i + 1} position` : 'Crop window position'}
              aria-valuenow={Math.round(r[0] * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              onPointerDown={(e) => startDrag(e, i, 'move')}
              onKeyDown={nudge}
              onFocus={() => setActiveBox(i)}
              className={`absolute cursor-move border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${
                activeBox === i ? 'border-forge-accent' : 'border-white/70'
              }`}
              style={{ left: `${r[0] * 100}%`, top: `${r[1] * 100}%`, width: `${r[2] * 100}%`, height: `${r[3] * 100}%` }}
            >
              {current.rects.length > 1 && (
                <span className="absolute top-0 left-0 px-1 text-[9px] bg-black/60 text-white">
                  {i === 0 ? 'TOP' : 'BOTTOM'}
                </span>
              )}
              <span
                onPointerDown={(e) => startDrag(e, i, 'resize')}
                className="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 rounded-sm bg-forge-accent cursor-nwse-resize"
              />
            </div>
          ))}
        </div>

        {/* Live export preview — follows the playhead's segment */}
        <div className="shrink-0">
          <canvas
            ref={canvasRef}
            width={PREVIEW_W}
            height={PREVIEW_H}
            className="rounded-lg bg-black"
            style={{ width: 108, height: 192 }}
          />
          <p className="mt-1 text-[9px] uppercase tracking-widest text-forge-dim text-center">9:16</p>
        </div>
      </div>

      {/* Transport */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? 'Pause' : 'Play'}
          className="p-1.5 rounded-lg border border-forge-border text-gray-300 hover:text-white hover:border-gray-500 cursor-pointer"
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <input
          type="range" min="0" max={duration || 1} step="0.05" value={time}
          aria-label="Scrub clip"
          onChange={(e) => seek(parseFloat(e.target.value))}
          className="flex-1 accent-[#06b6d4]"
        />
        <span className="text-[10px] text-gray-500 tabular-nums w-16 text-right">
          {fmt(time)} / {fmt(duration)}
        </span>
      </div>

      {/* Segment timeline: each block keeps its own framing */}
      {duration > 0 && segments.length > 0 && (
        <div className="space-y-1">
          <div className="relative h-7 rounded-md overflow-hidden bg-gray-900 flex">
            {segments.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setSel(i); seek(s.start + 0.01) }}
                title={`${LAYOUT_LABEL[s.layout]} · ${fmt(s.start)}–${fmt(s.end)}`}
                style={{ width: `${((s.end - s.start) / duration) * 100}%` }}
                className={`h-full text-[9px] truncate px-1 border-r border-black/60 last:border-r-0 cursor-pointer transition-colors duration-150 ${
                  i === sel ? 'bg-forge-accent/40 text-pink-100' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {LAYOUT_LABEL[s.layout]}
              </button>
            ))}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
              style={{ left: `${(time / duration) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={splitHere}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] border border-forge-border text-gray-300 hover:text-white hover:border-gray-500 cursor-pointer"
            >
              <Scissors size={12} /> Split at playhead
            </button>
            <button
              type="button"
              onClick={() => deleteSeg(sel)}
              disabled={segments.length < 2}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] border border-forge-border text-gray-300 hover:text-white hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Trash2 size={12} /> Remove segment
            </button>
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-500">
        Drag the box over what should stay in frame; pull the corner to resize. Split the timeline
        where the source cuts to a two-up shot, then give that stretch “Split screen” or
        “Fit whole” so a centre crop never lands on the seam.
      </p>
    </div>
  )
}
