import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader, Pause, Play } from 'lucide-react'
import api, { API_BASE_URL as API_BASE } from '../api'

export type CropRect = [number, number, number, number] // x, y, w, h — source-normalized
export type FrameLayout = 'single' | 'split'
export interface FrameValue {
  layout: FrameLayout
  rects: CropRect[]
}

interface Props {
  clipId: string
  value: FrameValue | null
  onChange: (v: FrameValue) => void
}

// Output canvas is 1080x1920. A single window fills it; split stacks two
// 1080x960 halves. Box aspect in the editor must match, or the drag preview
// lies about what gets exported.
const ASPECT: Record<FrameLayout, number> = { single: 1080 / 1920, split: 1080 / 960 }
const PREVIEW_W = 216
const PREVIEW_H = 384

/** Normalized width of a box `h` tall that lands at pixel aspect `a` on srcW x srcH. */
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

/** Default boxes for a layout: single = centered full-height; split = two side-by-side. */
function defaultsFor(layout: FrameLayout, srcW: number, srcH: number): CropRect[] {
  const a = ASPECT[layout]
  const fit = (h: number): [number, number] => {
    let hh = h
    let w = widthFor(a, hh, srcW, srcH)
    if (w > 1) { w = 1; hh = (srcW / srcH) / a }
    return [w, hh]
  }
  if (layout === 'single') {
    const [w, h] = fit(1)
    return [clampRect([(1 - w) / 2, (1 - h) / 2, w, h])]
  }
  // Split: grab the left and right halves of the frame — the two-person
  // podcast shot this exists for.
  const [w, h] = fit(0.9)
  const y = (1 - h) / 2
  return [
    clampRect([Math.max(0, 0.25 - w / 2), y, w, h]),
    clampRect([Math.min(1 - w, 0.75 - w / 2), y, w, h]),
  ]
}

/**
 * Manual reframe editor: plays the clip at its ORIGINAL aspect and lets the
 * user drag/resize the 9:16 window by hand, with a live preview of the export.
 * Auto center-crop lands on empty desk space in two-person podcast shots.
 */
export default function FrameEditor({ clipId, value, onChange }: Props) {
  const [src, setSrc] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState(0)   // which box the keyboard nudges

  const videoRef = useRef<HTMLVideoElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<{ i: number; mode: 'move' | 'resize'; dx: number; dy: number } | null>(null)
  // rAF preview reads the latest value without re-subscribing every drag frame.
  const valueRef = useRef<FrameValue | null>(value)
  valueRef.current = value

  // The proxy render happens server-side on this call, so it can take a few
  // seconds on a long clip.
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
    if (!value) onChange({ layout: 'single', rects: defaultsFor('single', d.w, d.h) })
    v.play().then(() => setPlaying(true)).catch(() => {})
  }

  // Live preview: draw each crop window into its slot on a 9:16 canvas.
  useEffect(() => {
    let raf = 0
    const draw = () => {
      raf = requestAnimationFrame(draw)
      const v = videoRef.current
      const c = canvasRef.current
      const val = valueRef.current
      if (!v || !c || !val || !v.videoWidth) return
      const ctx = c.getContext('2d')
      if (!ctx) return
      const slotH = PREVIEW_H / val.rects.length
      val.rects.forEach((r, i) => {
        ctx.drawImage(
          v,
          r[0] * v.videoWidth, r[1] * v.videoHeight,
          r[2] * v.videoWidth, r[3] * v.videoHeight,
          0, i * slotH, PREVIEW_W, slotH,
        )
      })
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const setRect = useCallback((i: number, r: CropRect) => {
    const val = valueRef.current
    if (!val) return
    const rects = val.rects.slice()
    rects[i] = clampRect(r)
    onChange({ ...val, rects })
  }, [onChange])

  const stagePoint = (e: React.PointerEvent) => {
    const host = stageRef.current!.getBoundingClientRect()
    return { px: (e.clientX - host.left) / host.width, py: (e.clientY - host.top) / host.height }
  }

  const startDrag = (e: React.PointerEvent, i: number, mode: 'move' | 'resize') => {
    if (!value) return
    e.stopPropagation()
    const { px, py } = stagePoint(e)
    const r = value.rects[i]
    dragRef.current = { i, mode, dx: px - r[0], dy: py - r[1] }
    setActive(i)
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d || !value || !dims) return
    const { px, py } = stagePoint(e)
    const r = value.rects[d.i]
    if (d.mode === 'move') {
      setRect(d.i, [px - d.dx, py - d.dy, r[2], r[3]])
    } else {
      // Resize from the bottom-right corner, top-left pinned, aspect locked.
      let h = Math.min(Math.max(py - r[1], 0.1), 1 - r[1])
      let w = widthFor(ASPECT[value.layout], h, dims.w, dims.h)
      if (r[0] + w > 1) { w = 1 - r[0]; h = w * dims.w / (ASPECT[value.layout] * dims.h) }
      setRect(d.i, [r[0], r[1], w, h])
    }
  }

  const endDrag = () => { dragRef.current = null }

  const switchLayout = (layout: FrameLayout) => {
    if (!dims) return
    const next = defaultsFor(layout, dims.w, dims.h)
    // Keep the box the user already positioned when going split → single.
    if (layout === 'single' && value?.rects.length) {
      const [x, y] = value.rects[0]
      next[0] = clampRect([x, y, next[0][2], next[0][3]])
    }
    onChange({ layout, rects: next })
  }

  const nudge = (e: React.KeyboardEvent) => {
    if (!value) return
    const step = e.shiftKey ? 0.05 : 0.01
    const map: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
    }
    const d = map[e.key]
    if (!d) return
    e.preventDefault()
    const r = value.rects[active]
    setRect(active, [r[0] + d[0], r[1] + d[1], r[2], r[3]])
  }

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play().then(() => setPlaying(true)).catch(() => {}) }
    else { v.pause(); setPlaying(false) }
  }

  const seek = (frac: number) => {
    const v = videoRef.current
    if (!v || !v.duration) return
    v.currentTime = frac * v.duration
    setProgress(frac)
  }

  if (status === 'error') {
    return <p className="text-xs text-red-400">Couldn’t load the source video for framing.</p>
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5" role="radiogroup" aria-label="Frame layout">
        {(['single', 'split'] as FrameLayout[]).map((l) => (
          <button
            key={l}
            role="radio"
            aria-checked={value?.layout === l}
            onClick={() => switchLayout(l)}
            className={`px-2.5 py-1 rounded-lg text-xs border transition-colors duration-200 cursor-pointer ${
              value?.layout === l
                ? 'bg-forge-card border-forge-accent text-pink-200'
                : 'border-forge-border text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            {l === 'single' ? 'One window' : 'Split screen'}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {/* Stage: original-aspect video with the draggable window(s) on top */}
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
                if (v.duration) setProgress(v.currentTime / v.duration)
              }}
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
          {value?.rects.map((r, i) => (
            <div
              key={i}
              role="slider"
              tabIndex={0}
              aria-label={value.rects.length > 1 ? `Window ${i + 1} position` : 'Crop window position'}
              aria-valuenow={Math.round(r[0] * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              onPointerDown={(e) => startDrag(e, i, 'move')}
              onKeyDown={nudge}
              onFocus={() => setActive(i)}
              className={`absolute cursor-move border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${
                active === i ? 'border-forge-accent' : 'border-white/70'
              }`}
              style={{ left: `${r[0] * 100}%`, top: `${r[1] * 100}%`, width: `${r[2] * 100}%`, height: `${r[3] * 100}%` }}
            >
              {value.rects.length > 1 && (
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

        {/* Live export preview */}
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
          type="range" min="0" max="1" step="0.001" value={progress}
          aria-label="Scrub clip"
          onChange={(e) => seek(parseFloat(e.target.value))}
          className="flex-1 accent-[#06b6d4]"
        />
      </div>
      <p className="text-[10px] text-gray-500">
        Drag the box over what should stay in frame; pull the corner to resize. Arrow keys nudge.
        Split screen stacks two windows — one per speaker.
      </p>
    </div>
  )
}
