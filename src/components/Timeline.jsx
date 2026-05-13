import { useState, useRef } from 'react'

const CLIP_TYPE_COLORS = {
  controversy: { from: '#ef4444', to: '#b91c1c' },
  hook_intro: { from: '#f97316', to: '#c2410c' },
  quotable: { from: '#eab308', to: '#a16207' },
  myth_bust: { from: '#22c55e', to: '#15803d' },
  shocking_stat: { from: '#06b6d4', to: '#0e7490' },
  emotional_peak: { from: '#ec4899', to: '#be185d' },
  debate_moment: { from: '#a855f7', to: '#7e22ce' },
  story_arc: { from: '#3b82f6', to: '#1d4ed8' },
}

const DEFAULT_COLOR = { from: '#7c3aed', to: '#5b21b6' }

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function tickInterval(duration) {
  if (duration <= 60) return 10
  if (duration <= 300) return 30
  if (duration <= 1200) return 60
  if (duration <= 3600) return 300
  return 600
}

export default function Timeline({ duration, clips, selectedClipId, onClipClick }) {
  const [hoverX, setHoverX] = useState(null)
  const trackRef = useRef(null)

  const tick = tickInterval(duration)
  const ticks = []
  for (let t = 0; t <= duration; t += tick) ticks.push(t)

  const onMouseMove = (e) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    setHoverX(x)
  }
  const hoverTime = hoverX !== null && trackRef.current
    ? (hoverX / trackRef.current.getBoundingClientRect().width) * duration
    : null

  // Sort clips so smaller-score render first, selected last (on top).
  const sorted = [...clips].sort((a, b) => {
    if (a.id === selectedClipId) return 1
    if (b.id === selectedClipId) return -1
    return (a.score || 0) - (b.score || 0)
  })

  return (
    <div>
      <div
        ref={trackRef}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHoverX(null)}
        className="relative h-16 bg-gradient-to-b from-forge-surface to-forge-card rounded-xl overflow-hidden border border-forge-border"
      >
        {/* Tick grid */}
        {ticks.map((t) => (
          <div
            key={t}
            className="absolute top-0 bottom-0 w-px bg-forge-border/40"
            style={{ left: `${(t / duration) * 100}%` }}
          />
        ))}

        {/* Faux waveform bg */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none"
          preserveAspectRatio="none"
          viewBox="0 0 100 64"
        >
          <path
            d="M0,32 Q5,12 10,32 T20,32 T30,28 T40,36 T50,20 T60,32 T70,40 T80,24 T90,32 T100,32"
            stroke="currentColor"
            strokeWidth="0.6"
            fill="none"
            className="text-violet-300"
          />
        </svg>

        {/* Hover scrubber */}
        {hoverX !== null && (
          <>
            <div
              className="absolute top-0 bottom-0 w-px bg-violet-400/70 pointer-events-none z-20"
              style={{ left: hoverX }}
            />
            <div
              className="absolute -top-7 px-2 py-0.5 rounded bg-violet-600 text-white text-[10px] font-mono pointer-events-none z-30 shadow-lg"
              style={{ left: hoverX, transform: 'translateX(-50%)' }}
            >
              {formatTime(hoverTime)}
            </div>
          </>
        )}

        {/* Clips */}
        {sorted.map((clip) => {
          const left = (clip.start_seconds / duration) * 100
          const width = ((clip.end_seconds - clip.start_seconds) / duration) * 100
          const color = CLIP_TYPE_COLORS[clip.clip_type] || DEFAULT_COLOR
          const isSelected = clip.id === selectedClipId
          // Score-driven height: 60% baseline, +40% top per score (0..1).
          const score = Math.max(0, Math.min(1, clip.score || 0.5))
          const heightPct = 50 + score * 45
          const approved = clip.user_approved

          return (
            <button
              key={clip.id}
              onClick={() => onClipClick(clip.id)}
              style={{
                left: `${left}%`,
                width: `${Math.max(width, 0.6)}%`,
                height: `${heightPct}%`,
                background: `linear-gradient(180deg, ${color.from} 0%, ${color.to} 100%)`,
                boxShadow: isSelected
                  ? `0 0 0 2px rgba(255,255,255,0.9), 0 0 24px ${color.from}99`
                  : `0 1px 3px rgba(0,0,0,0.4)`,
                opacity: isSelected ? 1 : 0.78,
                zIndex: isSelected ? 10 : 1,
              }}
              className={`absolute bottom-0 rounded-md cursor-pointer transition-all duration-200 hover:opacity-100 hover:!h-[95%] group ${isSelected ? 'animate-pulse-soft' : ''}`}
              title={`#${clip.rank} ${clip.clip_type.replace('_', ' ')} • ${formatTime(clip.start_seconds)}–${formatTime(clip.end_seconds)}`}
            >
              {/* Rank badge */}
              {width > 2.5 && (
                <span className="absolute top-0.5 left-1 text-[9px] font-bold text-white/95 leading-none drop-shadow">
                  #{clip.rank}
                </span>
              )}
              {/* Approved checkmark */}
              {approved && width > 1.5 && (
                <span className="absolute top-0.5 right-1 text-[10px] leading-none text-white drop-shadow">✓</span>
              )}
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-black/90 border border-white/10 text-[11px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-40 shadow-xl">
                <div className="font-bold">#{clip.rank} · {clip.clip_type.replace('_', ' ')}</div>
                <div className="text-gray-400 font-mono text-[10px]">
                  {formatTime(clip.start_seconds)} → {formatTime(clip.end_seconds)} ({Math.round(clip.end_seconds - clip.start_seconds)}s)
                </div>
                {clip.score != null && (
                  <div className="text-violet-300 text-[10px]">score {(clip.score * 100).toFixed(0)}</div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Tick labels */}
      <div className="relative mt-1 h-3 text-[10px] text-forge-dim font-mono">
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute -translate-x-1/2"
            style={{ left: `${(t / duration) * 100}%` }}
          >
            {formatTime(t)}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
        {[...new Set(clips.map((c) => c.clip_type))].map((type) => {
          const c = CLIP_TYPE_COLORS[type] || DEFAULT_COLOR
          return (
            <div key={type} className="flex items-center gap-1.5 text-[11px] text-forge-muted">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: `linear-gradient(180deg, ${c.from}, ${c.to})` }}
              />
              {type.replace('_', ' ')}
            </div>
          )
        })}
      </div>
    </div>
  )
}
