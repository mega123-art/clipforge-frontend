import { useState, useEffect, CSSProperties } from 'react'
import api from '../api'
import { X, Download, Loader, Info, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import type { AxiosError } from 'axios'
import type { ExportResponse } from '../types/api'

interface AspectOption { id: string; label: string }
const ASPECT_RATIOS: AspectOption[] = [
  { id: '9:16', label: '9:16' },
  { id: 'square_in_vertical', label: '1:1 in 9:16' },
  { id: '1:1', label: '1:1' },
  { id: '16:9', label: '16:9' },
]

interface CaptionStyleOption {
  id: string
  label: string
  sample: string
  css: CSSProperties
  bg: string
}

const CAPTION_STYLES: CaptionStyleOption[] = [
  {
    id: 'word_highlight',
    label: 'Word highlight',
    sample: 'BIG IDEA',
    css: { color: '#FFFF00', fontWeight: 800, textShadow: '2px 2px 0 #000' },
    bg: '#000',
  },
  {
    id: 'karaoke_pop',
    label: 'Karaoke pop',
    sample: 'POP!',
    css: { color: '#FFFF00', fontWeight: 900, transform: 'scale(1.15)', textShadow: '2px 2px 0 #000' },
    bg: '#111',
  },
  {
    id: 'neon_glow',
    label: 'Neon glow',
    sample: 'NEON',
    css: {
      color: '#fff',
      fontWeight: 800,
      textShadow: '0 0 6px #ff00ff, 0 0 12px #00ffff',
    },
    bg: '#0a0a18',
  },
  {
    id: 'bold_yellow',
    label: 'MrBeast bold',
    sample: 'HUGE',
    css: { color: '#FFD400', fontWeight: 900, fontSize: '1.3rem', textShadow: '3px 3px 0 #000, -2px -2px 0 #000' },
    bg: '#000',
  },
  {
    id: 'bubble',
    label: 'Bubble',
    sample: 'hello',
    css: {
      color: '#fff',
      background: 'rgba(30,30,30,0.85)',
      padding: '4px 10px',
      borderRadius: '999px',
      fontWeight: 600,
    },
    bg: '#1a1a1a',
  },
  {
    id: 'typewriter',
    label: 'Typewriter',
    sample: 'typing|',
    css: { color: '#fff', fontFamily: 'monospace', background: 'rgba(0,0,0,0.6)', padding: '2px 6px' },
    bg: '#000',
  },
  {
    id: 'gradient_pop',
    label: 'Gradient pop',
    sample: 'WOW',
    css: {
      background: 'linear-gradient(90deg,#ff0080,#ff8c00,#ffd400)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: 900,
    },
    bg: '#000',
  },
  {
    id: 'subtitle_clean',
    label: 'Clean',
    sample: 'subtitle',
    css: { color: '#fff', fontSize: '0.7rem', background: 'rgba(0,0,0,0.5)', padding: '1px 4px' },
    bg: '#000',
  },
  {
    id: 'full_sentence',
    label: 'Full sentence',
    sample: 'sentence',
    css: { color: '#fff', fontWeight: 700, background: 'rgba(0,0,0,0.4)', padding: '2px 6px' },
    bg: '#000',
  },
  {
    id: 'tiktok_native',
    label: 'TikTok',
    sample: 'native',
    css: { color: '#fff', fontWeight: 800, textShadow: '0 0 4px #000, 2px 2px 0 #000' },
    bg: '#111',
  },
  {
    id: 'magenta_pop',
    label: 'Magenta pop',
    sample: 'POP',
    css: { color: '#fff', fontWeight: 900, background: 'rgba(200,0,140,0.8)', padding: '2px 6px', borderRadius: 4 },
    bg: '#000',
  },
  {
    id: 'cyan_neon',
    label: 'Cyan neon',
    sample: 'NEON',
    css: { color: '#fff', fontWeight: 900, textShadow: '0 0 6px #00ffff, 0 0 12px #00ffff' },
    bg: '#0a0a18',
  },
  {
    id: 'fire_gradient',
    label: 'Fire gradient',
    sample: 'FIRE',
    css: {
      background: 'linear-gradient(90deg, #ff2200, #ff8c00, #ffd400)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontWeight: 900,
    },
    bg: '#000',
  },
  {
    id: 'spotify_green',
    label: 'Spotify',
    sample: 'spotify',
    css: { color: '#1ed760', fontWeight: 800, background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: 4 },
    bg: '#000',
  },
  {
    id: 'shadow_3d',
    label: '3D shadow',
    sample: 'BOLD',
    css: { color: '#ffff00', fontWeight: 900, textShadow: '4px 4px 0 #d65500, 8px 8px 0 rgba(0,0,0,0.6)' },
    bg: '#111',
  },
]

interface HookStyleOption {
  id: string
  label: string
  boxCss: CSSProperties
  textCss: CSSProperties
}

const HOOK_STYLES: HookStyleOption[] = [
  {
    id: 'serif_card',
    label: 'Serif card',
    boxCss: {
      background: 'rgba(255,255,255,0.96)',
      borderRadius: 14,
      padding: '8px 14px',
      boxShadow: '0 10px 24px rgba(0,0,0,0.45)',
      transform: 'rotate(-1.5deg)',
    },
    textCss: { color: '#0f0f0f', fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 700 },
  },
  {
    id: 'mrbeast_yellow',
    label: 'MrBeast',
    boxCss: { padding: '4px 8px' },
    textCss: {
      color: '#ffdc00',
      fontFamily: 'Inter, "Helvetica Neue", system-ui, sans-serif',
      fontWeight: 900,
      WebkitTextStroke: '2px #000',
      textShadow: '3px 3px 0 rgba(0,0,0,0.95)',
      textTransform: 'uppercase',
    },
  },
  {
    id: 'sticker_pop',
    label: 'Sticker pop',
    boxCss: {
      background: '#ffde00',
      borderRadius: 10,
      padding: '6px 12px',
      border: '3px solid #000',
      boxShadow: '6px 8px 0 rgba(0,0,0,0.85)',
      transform: 'rotate(-4deg)',
    },
    textCss: {
      color: '#000',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 900,
      textTransform: 'uppercase',
    },
  },
  {
    id: 'neon_glow',
    label: 'Neon glow',
    boxCss: {
      background: 'rgba(10,10,20,0.92)',
      borderRadius: 10,
      padding: '6px 12px',
    },
    textCss: {
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      textShadow: '0 0 6px #ff00c8, 0 0 12px #ff00c8, 0 0 18px #00dcff',
    },
  },
  {
    id: 'hot_pink',
    label: 'Hot pink',
    boxCss: {
      background: '#ff1e82',
      borderRadius: 14,
      padding: '6px 12px',
      boxShadow: '6px 8px 0 rgba(0,0,0,0.55)',
      border: '3px solid #c2006e',
    },
    textCss: {
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
  },
  {
    id: 'breaking_news',
    label: 'Breaking news',
    boxCss: {
      background: '#d21919',
      borderRadius: 4,
      padding: '6px 14px',
      border: '2px solid #fff',
      boxShadow: '4px 6px 0 rgba(0,0,0,0.6)',
    },
    textCss: {
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
  },
  {
    id: 'headline_anton',
    label: 'Headline',
    boxCss: { padding: '4px 8px' },
    textCss: {
      color: '#fff',
      fontFamily: '"Oswald", "Bebas Neue", Impact, system-ui, sans-serif',
      fontWeight: 900,
      WebkitTextStroke: '2px #000',
      textShadow: '3px 3px 0 rgba(0,0,0,0.95)',
      textTransform: 'uppercase',
      letterSpacing: '1.5px',
    },
  },
  {
    id: 'glass_dark',
    label: 'Glass',
    boxCss: {
      background: 'rgba(30,30,35,0.65)',
      borderRadius: 18,
      padding: '6px 12px',
      border: '1px solid rgba(255,255,255,0.25)',
      boxShadow: '0 8px 22px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
    },
    textCss: {
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 800,
    },
  },
  {
    id: 'sunset_gradient',
    label: 'Sunset',
    boxCss: {
      background: 'linear-gradient(90deg, #ff6e3c, #ff3c96)',
      borderRadius: 16,
      padding: '6px 12px',
      boxShadow: '6px 8px 0 rgba(0,0,0,0.5)',
    },
    textCss: {
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
  },
  {
    id: 'ocean_gradient',
    label: 'Ocean',
    boxCss: {
      background: 'linear-gradient(90deg, #00c8ff, #7850ff)',
      borderRadius: 16,
      padding: '6px 12px',
      boxShadow: '6px 8px 0 rgba(0,0,0,0.5)',
    },
    textCss: {
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
  },
  {
    id: 'gold_luxe',
    label: 'Gold luxe',
    boxCss: {
      background: '#0f0f0f',
      border: '2px solid #d4af37',
      padding: '6px 14px',
      boxShadow: '4px 6px 0 rgba(0,0,0,0.6)',
    },
    textCss: {
      color: '#d4af37',
      fontFamily: 'Georgia, serif',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '2px',
    },
  },
  {
    id: 'pastel_card',
    label: 'Pastel',
    boxCss: {
      background: '#ffdcec',
      borderRadius: 18,
      padding: '6px 14px',
      boxShadow: '4px 6px 10px rgba(0,0,0,0.3)',
      transform: 'rotate(1.5deg)',
    },
    textCss: {
      color: '#6e1e50',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 800,
    },
  },
  {
    id: 'matrix_green',
    label: 'Matrix',
    boxCss: {
      background: '#000',
      borderRadius: 4,
      padding: '6px 12px',
    },
    textCss: {
      color: '#00ff5a',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      textShadow: '0 0 6px #00ff5a, 0 0 12px #00ff5a',
    },
  },
  {
    id: 'claymorphism',
    label: 'Clay',
    boxCss: {
      background: '#a7c6ff',
      borderRadius: 22,
      padding: '8px 14px',
      boxShadow: '6px 8px 0 rgba(50,60,120,0.45)',
    },
    textCss: {
      color: '#1c1e3c',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 800,
    },
  },
  {
    id: 'brutalism_red',
    label: 'Brutalist',
    boxCss: {
      background: '#ff0000',
      borderRadius: 0,
      padding: '6px 14px',
      border: '4px solid #000',
      boxShadow: '10px 10px 0 #000',
    },
    textCss: {
      color: '#fff',
      fontFamily: '"Oswald", "Bebas Neue", Impact, system-ui, sans-serif',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '2px',
    },
  },
  {
    id: 'glitch_rgb',
    label: 'Glitch',
    boxCss: {
      background: '#000',
      borderRadius: 4,
      padding: '6px 12px',
    },
    textCss: {
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '1.5px',
      textShadow: '-2px 0 #ff003c, 2px 0 #00dcff',
    },
  },
  {
    id: 'memphis_pop',
    label: 'Memphis',
    boxCss: {
      background: '#ff71ce',
      borderRadius: 14,
      padding: '6px 12px',
      border: '3px solid #86ccca',
      boxShadow: '6px 8px 0 rgba(0,0,0,0.55)',
      transform: 'rotate(-3deg)',
    },
    textCss: {
      color: '#1c1e3c',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
  },
]

interface FocusModeOption {
  id: 'none' | 'speaker' | 'center' | 'face'
  label: string
  desc: string
  comingSoon?: boolean
}

const FOCUS_MODES: FocusModeOption[] = [
  { id: 'face', label: 'Face Focus (Pro)', desc: 'TikTok-style: locks on face, ultra-smooth, no shake, max quality', comingSoon: true },
  { id: 'speaker', label: 'Speaker focus', desc: 'Auto-track active speaker (multi-speaker podcasts)', comingSoon: true },
  { id: 'center', label: 'Center crop', desc: 'Crop to center' },
  { id: 'none', label: 'Blurred BG', desc: 'Fit + blur background' },
]

interface PreviewPanelProps {
  aspectRatio: string
  captionStyle: string
  captionPosition: 'top' | 'middle' | 'bottom'
  includeCaptions: boolean
  hookText: string
  hookPosition: 'top' | 'center' | 'bottom'
  hookFontScale: number
  hookStyle: string
  hookYPct: number | null
}

function PreviewPanel({
  aspectRatio,
  captionStyle,
  captionPosition,
  includeCaptions,
  hookText,
  hookPosition,
  hookFontScale,
  hookStyle,
  hookYPct,
}: PreviewPanelProps) {
  const cs = CAPTION_STYLES.find((s) => s.id === captionStyle) ?? CAPTION_STYLES[0]
  const hs = HOOK_STYLES.find((s) => s.id === hookStyle) ?? HOOK_STYLES[0]
  const aspectClass =
    aspectRatio === '1:1' ? 'aspect-square' :
    aspectRatio === '16:9' ? 'aspect-video' :
    'aspect-[9/16]'
  const showSquareInVertical = aspectRatio === 'square_in_vertical'

  const captionPosClass =
    captionPosition === 'top' ? 'top-6 justify-start' :
    captionPosition === 'middle' ? 'top-0 bottom-0 justify-center' :
    'bottom-10 justify-end'

  // Hook position: slider wins when set, else preset.
  let hookTopStyle: CSSProperties | undefined
  let hookPosClass: string
  if (hookYPct !== null) {
    hookTopStyle = { top: `${hookYPct}%` }
    hookPosClass = ''
  } else {
    hookTopStyle = undefined
    hookPosClass =
      hookPosition === 'top'
        ? (showSquareInVertical ? 'top-[25%]' : 'top-6')
        : hookPosition === 'center'
        ? 'top-1/2 -translate-y-1/2'
        : (showSquareInVertical ? 'bottom-[25%]' : 'bottom-24')
  }

  return (
    <div className="shrink-0 w-full lg:w-52 flex flex-col items-center">
      <div
        className={`relative w-full sm:w-52 ${aspectClass} max-h-[62vh] rounded-2xl overflow-hidden`}
        style={{ border: '1.5px solid rgba(255,255,255,0.1)', boxShadow: '0 0 0 1px rgba(0,0,0,0.5), 0 20px 48px rgba(0,0,0,0.7)' }}
      >
        {/* Cinematic background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-700 via-slate-900 to-black" />
        <div className="absolute inset-0 bg-gradient-to-tr from-violet-950/30 via-transparent to-rose-950/20" />
        {/* Bottom scrim */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

        {/* Person silhouette (head + shoulders) */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-[18%] pointer-events-none select-none">
          <div className="flex flex-col items-center opacity-20">
            <div className="w-8 h-8 rounded-full bg-zinc-300" />
            <div className="w-[4.5rem] h-14 rounded-t-[50%] bg-zinc-300 -mt-0.5" />
          </div>
        </div>

        {/* Status bar */}
        <div className="absolute top-0 inset-x-0 px-3 pt-2 flex items-center justify-between pointer-events-none">
          <span className="text-[7px] font-semibold text-white/30">9:41</span>
          <div className="w-8 h-1 rounded-full bg-white/10" />
        </div>

        {/* square-in-vertical black bars */}
        {showSquareInVertical && (
          <>
            <div className="absolute inset-x-0 top-0 h-[23.4%] bg-black pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-[23.4%] bg-black pointer-events-none" />
          </>
        )}

        {/* Hook overlay */}
        {hookText.trim() && (
          <div
            className={`absolute left-0 right-0 px-4 flex justify-center pointer-events-none ${hookPosClass}`}
            style={hookTopStyle}
          >
            <div className="text-center" style={{ ...hs.boxCss, ...hs.textCss, fontSize: `${10 * hookFontScale}px`, lineHeight: 1.25, maxWidth: '90%' }}>
              {hookText}
            </div>
          </div>
        )}

        {/* Caption sample */}
        {includeCaptions && (
          <div className={`absolute left-0 right-0 px-3 flex flex-col items-center pointer-events-none ${captionPosClass}`}>
            <span style={cs.css} className="text-xs whitespace-nowrap">{cs.sample}</span>
          </div>
        )}

        {/* TikTok-style side actions */}
        <div className="absolute right-2 bottom-16 flex flex-col items-center gap-3 pointer-events-none opacity-35">
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-6 h-6 rounded-full bg-white/25 border border-white/20" />
            <span className="text-[5px] text-white/60">24K</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-5 h-5 rounded-full bg-white/15 border border-white/15" />
            <span className="text-[5px] text-white/60">Share</span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-[9px] uppercase tracking-widest text-forge-dim font-medium">Preview</p>
    </div>
  )
}

interface ExportModalProps {
  clipIds: string[]
  index?: number
  onIndexChange?: (i: number) => void
  onClose: () => void
}

export default function ExportModal({ clipIds, index = 0, onIndexChange, onClose }: ExportModalProps) {
  const safeIds = Array.isArray(clipIds) ? clipIds : []
  const total = safeIds.length
  const safeIndex = Math.max(0, Math.min(index, total - 1))
  const clipId: string | undefined = safeIds[safeIndex]

  const [aspectRatio, setAspectRatio] = useState<string>('9:16')
  const [captionStyle, setCaptionStyle] = useState<string>('word_highlight')
  const [captionPosition, setCaptionPosition] = useState<'top' | 'middle' | 'bottom'>('bottom')
  const [includeCaptions, setIncludeCaptions] = useState(true)
  const [focusMode, setFocusMode] = useState<'none' | 'speaker' | 'center' | 'face'>('center')
  const [hookText, setHookText] = useState<string>('')
  const [hookPosition, setHookPosition] = useState<'top' | 'center' | 'bottom'>('top')
  const [hookFontScale, setHookFontScale] = useState<number>(1.0)
  const [hookStyle, setHookStyle] = useState<string>('serif_card')
  // Vertical position of hook as % from top of frame. null = use named preset.
  const [hookYPct, setHookYPct] = useState<number | null>(null)
  const [hookSuggestions, setHookSuggestions] = useState<string[]>([])
  const [hookGenLoading, setHookGenLoading] = useState(false)
  const [hookGenError, setHookGenError] = useState<string | null>(null)
  const [musicEnabled, setMusicEnabled] = useState(false)
  const [musicTrackId, setMusicTrackId] = useState<string | null>(null)
  const [musicVolume, setMusicVolume] = useState(0.5)
  const [musicFadeIn, setMusicFadeIn] = useState(0)
  const [musicFadeOut, setMusicFadeOut] = useState(0)
  const [musicTrimStart, setMusicTrimStart] = useState(0)
  const [musicTrimEnd, setMusicTrimEnd] = useState(0)
  const [musicFile, setMusicFile] = useState<File | null>(null)
  const [musicTracks, setMusicTracks] = useState<Array<{id: string, filename: string, duration: number}>>([])
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'settings' | 'export'>('preview')

  const handleGenerateHook = async () => {
    if (!clipId) return
    setHookGenLoading(true)
    setHookGenError(null)
    try {
      const { data } = await api.post<{ suggestions: string[] }>(
        `/api/clips/${clipId}/hook-suggestions`,
      )
      setHookSuggestions(data.suggestions || [])
    } catch (err) {
      const ax = err as AxiosError<{ detail?: string }>
      setHookGenError(ax.response?.data?.detail || 'Generation failed.')
    } finally {
      setHookGenLoading(false)
    }
  }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  // Reset per-clip state when navigating between clips.
  useEffect(() => {
    setLoading(false)
    setError(null)
    setDownloadUrl(null)
  }, [clipId])

  // Invalidate download when any export option changes — stale file would
  // download with old options. User must re-run Export.
  useEffect(() => {
    setDownloadUrl(null)
    setError(null)
  }, [aspectRatio, captionStyle, captionPosition, includeCaptions, focusMode,
      hookText, hookPosition, hookFontScale, hookStyle, hookYPct,
      musicEnabled, musicTrackId, musicVolume, musicFadeIn, musicFadeOut, musicTrimStart, musicTrimEnd])

  const goPrev = () => {
    if (safeIndex > 0 && onIndexChange) onIndexChange(safeIndex - 1)
  }
  const goNext = () => {
    if (safeIndex < total - 1 && onIndexChange) onIndexChange(safeIndex + 1)
  }

  const [downloading, setDownloading] = useState(false)

  const handleExport = async () => {
    if (!clipId) return
    setLoading(true)
    setError(null)
    const targetId = clipId
    try {
      // Backend now dispatches asynchronously and returns 202 immediately
      // (Railway proxy was killing sync 5min ffmpeg renders). Poll clip
      // status until the export finishes server-side.
      // Focus mode only meaningful for 9:16 (the picker is hidden otherwise).
      // Force "none" for other aspects so backend doesn't run face_track on a
      // 2hr source for no reason — that pegs CPU for many minutes and looks
      // like a silent hang from the user's perspective.
      const effectiveFocusMode = aspectRatio === '9:16' ? focusMode : 'none'
      const { data } = await api.post<ExportResponse & { status?: string }>(
        `/api/clips/${targetId}/export`,
        {
          aspect_ratio: aspectRatio,
          caption_style: captionStyle,
          caption_position: captionPosition,
          include_captions: includeCaptions,
          focus_mode: effectiveFocusMode,
          output_format: 'mp4',
          hook_text: hookText.trim() || null,
          hook_position: hookPosition,
          hook_font_scale: hookFontScale,
          hook_style: hookStyle,
          hook_y_pct: hookYPct,
          music_enabled: musicEnabled,
          music_track_id: musicTrackId,
          music_volume: musicVolume,
          music_fade_in: musicFadeIn,
          music_fade_out: musicFadeOut,
          music_trim_start: musicTrimStart,
          music_trim_end: musicTrimEnd,
        },
      )
      if (targetId !== clipId) return

      // If backend ran sync (old version) it already returned the URL.
      if (data.status !== 'exporting' && data.download_url) {
        setDownloadUrl(data.download_url)
        return
      }

      // Poll clip status every 3s, max 20 min (hook overlay + Railway shared
      // vCPU = ~2x render time on long clips).
      const deadline = Date.now() + 20 * 60 * 1000
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 3000))
        if (targetId !== clipId) return
        let poll: { status?: string; error_message?: string } | null = null
        try {
          const r = await api.get<{ status?: string; error_message?: string }>(
            `/api/clips/${targetId}`,
          )
          poll = r.data
        } catch {
          continue // transient; keep polling
        }
        if (poll?.status === 'exported') {
          setDownloadUrl(data.download_url || `/api/clips/${targetId}/download`)
          return
        }
        if (poll?.status === 'failed') {
          setError(poll.error_message || 'Export failed.')
          return
        }
      }
      setError('Export timed out after 20 minutes. Try a shorter clip or simpler options.')
    } catch (err) {
      const ax = err as AxiosError<{ detail?: string }>
      setError(ax.response?.data?.detail || 'Export failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!downloadUrl) return
    setDownloading(true)
    setError(null)
    // Open blank window synchronously while user gesture is active.
    // After the await the gesture context is gone — popup blockers would
    // kill a.click()/_blank. We redirect this pre-approved window instead.
    const win = window.open('', '_blank')
    try {
      const resp = await api.get(downloadUrl, { responseType: 'arraybuffer' })
      const contentType = (String(resp.headers['content-type'] || '')).toLowerCase()

      if (contentType.includes('application/json')) {
        const text = new TextDecoder().decode(resp.data as ArrayBuffer)
        const parsed = JSON.parse(text) as { url?: string }
        if (!parsed.url) throw new Error('No download URL returned')
        if (win) {
          win.location.href = parsed.url
        } else {
          window.location.href = parsed.url
        }
        return
      }

      // Local streaming fallback — blob download in same tab
      if (win) win.close()
      const blob = new Blob([resp.data as ArrayBuffer], { type: 'video/mp4' })
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `clip_${clipId}.mp4`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000)
    } catch (err) {
      if (win) win.close()
      const ax = err as AxiosError<{ detail?: string }>
      setError(ax.response?.data?.detail || ax.message || 'Download failed.')
    } finally {
      setDownloading(false)
    }
  }

  if (!clipId) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-3 sm:py-8"
    >
      <div className="bg-forge-card border border-forge-border rounded-2xl p-3 sm:p-4 lg:p-6 w-full max-w-2xl md:max-w-4xl mx-2 sm:mx-4 my-auto shadow-2xl">
        <div className="flex items-center justify-between mb-3 sm:mb-5 gap-2">
          <div className="flex items-center gap-2">
            {total > 1 && (
              <button
                onClick={goPrev}
                disabled={safeIndex === 0}
                aria-label="Previous clip"
                className="cursor-pointer p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 transition-colors duration-200"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div>
              <h2 id="export-modal-title" className="font-semibold text-sm sm:text-lg">Export Clip</h2>
              {total > 1 && (
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{safeIndex + 1} of {total}</p>
              )}
            </div>
            {total > 1 && (
              <button
                onClick={goNext}
                disabled={safeIndex >= total - 1}
                aria-label="Next clip"
                className="cursor-pointer p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 transition-colors duration-200"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close export dialog"
            className="cursor-pointer p-2 -m-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 transition-colors duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs for mobile */}
        <div className="lg:hidden flex gap-2 mb-4 border-b border-forge-border pb-0">
          {(['preview', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'preview' | 'settings' | 'export')}
              className={`py-2 px-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === tab || (tab === 'settings' && activeTab === 'export')
                  ? 'border-forge-accent text-forge-accent'
                  : 'border-transparent text-forge-muted hover:text-forge-text'
              }`}
            >
              {tab === 'preview' ? 'Preview' : 'Settings'}
            </button>
          ))}
        </div>

        {/* Content: Tabs on mobile, side-by-side on desktop */}
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-6 lg:max-h-[75vh]">
          {/* Preview */}
          <div className={`${activeTab !== 'preview' ? 'hidden lg:block' : 'block'}`}>
            <PreviewPanel
              aspectRatio={aspectRatio}
              captionStyle={captionStyle}
              captionPosition={captionPosition}
              includeCaptions={includeCaptions}
              hookText={hookText}
              hookPosition={hookPosition}
              hookFontScale={hookFontScale}
              hookStyle={hookStyle}
              hookYPct={hookYPct}
            />
          </div>

          {/* Settings + Export (combined, scrollable with sticky button) */}
          <div className={`flex-1 flex flex-col min-h-0 ${activeTab === 'preview' ? 'hidden lg:flex' : 'flex'} lg:max-h-[75vh]`}>
          <div className="flex-1 space-y-3 sm:space-y-4 overflow-y-auto pr-0.5 sm:pr-1">
          {/* Aspect ratio */}
          <div>
            <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">Aspect ratio</label>
            <div className="grid grid-cols-2 sm:flex gap-1.5 sm:gap-2" role="radiogroup" aria-label="Aspect ratio">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar.id}
                  role="radio"
                  aria-checked={aspectRatio === ar.id}
                  onClick={() => setAspectRatio(ar.id)}
                  className={`flex-1 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs border cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${
                    aspectRatio === ar.id
                      ? 'bg-pink-500 border-pink-400 text-white'
                      : 'border-forge-border text-gray-300 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>

          {/* Frame mode */}
          {aspectRatio === '9:16' && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Frame</label>
              <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Frame mode">
                {FOCUS_MODES.map((fm) => (
                  <button
                    key={fm.id}
                    role="radio"
                    aria-checked={focusMode === fm.id}
                    onClick={() => { if (!fm.comingSoon) setFocusMode(fm.id) }}
                    disabled={fm.comingSoon}
                    aria-disabled={fm.comingSoon}
                    title={fm.comingSoon ? 'Coming soon' : fm.desc}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs border text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 transition-colors duration-200 ${
                      fm.comingSoon
                        ? 'border-forge-border text-gray-500 opacity-50 cursor-not-allowed'
                        : focusMode === fm.id
                          ? 'bg-forge-card border-forge-accent text-pink-200 cursor-pointer'
                          : 'border-forge-border text-gray-400 hover:border-gray-500 hover:text-white cursor-pointer'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 transition-colors duration-200 ${focusMode === fm.id && !fm.comingSoon ? 'bg-forge-accent border-forge-accent' : 'border-gray-600'}`} />
                    <span className="flex-1 leading-tight min-w-0">
                      <span className="font-medium block truncate">{fm.label.replace(' (Pro)', '')}</span>
                      {fm.comingSoon && <span className="text-[9px] text-amber-400/70">Soon</span>}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Captions toggle */}
          <div className="flex items-center justify-between">
            <label htmlFor="caption-toggle" className="text-sm text-gray-300 cursor-pointer">Include captions</label>
            <button
              id="caption-toggle"
              type="button"
              role="switch"
              aria-checked={includeCaptions}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIncludeCaptions((v) => !v)
              }}
              style={{
                width: 40,
                height: 20,
                borderRadius: 9999,
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 200ms',
                backgroundColor: includeCaptions ? '#7c3aed' : '#3f3f46',
                border: 'none',
                padding: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: includeCaptions ? 22 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: 9999,
                  background: '#fff',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  transition: 'left 200ms',
                  pointerEvents: 'none',
                }}
              />
            </button>
          </div>

          {/* Caption style grid */}
          {includeCaptions && (
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">Caption style</label>
              <div
                className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5"
                role="radiogroup"
                aria-label="Caption style"
                style={{ scrollbarWidth: 'none' }}
              >
                {CAPTION_STYLES.map((cs) => (
                  <button
                    key={cs.id}
                    role="radio"
                    aria-checked={captionStyle === cs.id}
                    aria-label={cs.label}
                    onClick={() => setCaptionStyle(cs.id)}
                    className={`shrink-0 w-[4.5rem] rounded-lg border-2 overflow-hidden cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${
                      captionStyle === cs.id
                        ? 'border-forge-accent ring-2 ring-forge-accent/30'
                        : 'border-forge-border hover:border-gray-500'
                    }`}
                  >
                    <div className="aspect-video flex items-center justify-center" style={{ background: cs.bg }}>
                      <span style={cs.css} className="text-[11px] whitespace-nowrap leading-none">{cs.sample}</span>
                    </div>
                    <div className="text-[9px] text-gray-200 py-1 px-1 truncate bg-forge-card">{cs.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Caption position */}
          {includeCaptions && (
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">Caption position</label>
              <div className="flex gap-1.5 sm:gap-2" role="radiogroup" aria-label="Caption position">
                {(['top', 'middle', 'bottom'] as const).map((pos) => (
                  <button
                    key={pos}
                    role="radio"
                    aria-checked={captionPosition === pos}
                    onClick={() => setCaptionPosition(pos)}
                    className={`flex-1 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm border cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 capitalize ${
                      captionPosition === pos
                        ? 'bg-pink-500 border-pink-400 text-white'
                        : 'border-forge-border text-gray-300 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Viral hook */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="hook-text" className="block text-sm text-gray-400">
                Viral hook <span className="text-gray-600">(optional)</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateHook}
                disabled={hookGenLoading}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-pink-500/20 border border-pink-500/40 text-pink-300 hover:bg-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
              >
                {hookGenLoading ? (
                  <><Loader size={12} className="animate-spin" /> Generating</>
                ) : (
                  <><Sparkles size={12} /> Generate</>
                )}
              </button>
            </div>
            <input
              id="hook-text"
              type="text"
              value={hookText}
              onChange={(e) => setHookText(e.target.value)}
              placeholder="e.g. POV: you fix prod at 3am"
              maxLength={140}
              className="w-full px-3 py-2 rounded-lg bg-forge-bg border border-forge-border text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-pink-400"
            />
            {hookGenError && (
              <p role="alert" className="text-xs text-red-400 mt-1">{hookGenError}</p>
            )}
            {hookSuggestions.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Suggestions — click to use</p>
                <div className="flex flex-wrap gap-1.5">
                  {hookSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setHookText(s)
                        setHookSuggestions([])
                      }}
                      className="text-left text-xs px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-forge-border text-gray-200 cursor-pointer transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {hookText.trim() && (
              <div className="mt-2 space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Style</label>
                  <div
                    className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5"
                    role="radiogroup"
                    aria-label="Hook style"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    {HOOK_STYLES.map((hs) => (
                      <button
                        key={hs.id}
                        role="radio"
                        aria-checked={hookStyle === hs.id}
                        aria-label={hs.label}
                        onClick={() => setHookStyle(hs.id)}
                        className={`shrink-0 w-[4.5rem] rounded-lg border-2 overflow-hidden cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${
                          hookStyle === hs.id
                            ? 'border-forge-accent ring-2 ring-forge-accent/30'
                            : 'border-forge-border hover:border-gray-500'
                        }`}
                      >
                        <div className="aspect-video flex items-center justify-center bg-zinc-900">
                          <span style={{ ...hs.boxCss, ...hs.textCss, fontSize: '9px', padding: '4px 8px' }}>HOOK</span>
                        </div>
                        <div className="text-[9px] text-gray-200 py-1 px-1 truncate bg-forge-card">{hs.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1.5 sm:gap-2" role="radiogroup" aria-label="Hook position">
                  {(['top', 'center', 'bottom'] as const).map((pos) => (
                    <button
                      key={pos}
                      role="radio"
                      aria-checked={hookPosition === pos && hookYPct === null}
                      onClick={() => { setHookPosition(pos); setHookYPct(null) }}
                      className={`flex-1 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm border cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 capitalize ${
                        hookPosition === pos && hookYPct === null
                          ? 'bg-pink-500 border-pink-400 text-white'
                          : 'border-forge-border text-gray-300 hover:border-gray-500 hover:text-white'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
                {/* Vertical fine-tune slider — overrides preset when set */}
                <div className="flex items-center gap-3">
                  <label htmlFor="hook-y" className="text-xs text-gray-400 shrink-0">
                    Y {hookYPct === null ? 'preset' : `${hookYPct.toFixed(0)}%`}
                  </label>
                  <input
                    id="hook-y"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={hookYPct ?? (hookPosition === 'top' ? 10 : hookPosition === 'center' ? 50 : 70)}
                    onChange={(e) => setHookYPct(parseFloat(e.target.value))}
                    className="flex-1 accent-pink-500"
                  />
                  {hookYPct !== null && (
                    <button
                      type="button"
                      onClick={() => setHookYPct(null)}
                      className="text-[10px] text-gray-500 hover:text-gray-300 underline cursor-pointer"
                    >
                      reset
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <label htmlFor="hook-scale" className="text-xs text-gray-400 shrink-0">
                    Size {hookFontScale.toFixed(1)}x
                  </label>
                  <input
                    id="hook-scale"
                    type="range"
                    min="0.8"
                    max="1.5"
                    step="0.1"
                    value={hookFontScale}
                    onChange={(e) => setHookFontScale(parseFloat(e.target.value))}
                    className="flex-1 accent-[#06b6d4]"
                  />
                </div>
              </div>
            )}
          </div>

          {focusMode === 'speaker' && (
            <div className="flex items-start gap-2 p-2.5 bg-amber-950/40 border border-amber-800/50 rounded-lg text-xs text-amber-200">
              <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>Speaker focus runs face detection — first export per job adds ~10–30s.</span>
            </div>
          )}
          {focusMode === 'face' && (
            <div className="flex items-start gap-2 p-2.5 bg-forge-card/40 border border-pink-800/50 rounded-lg text-xs text-pink-200">
              <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>Face Focus uses MediaPipe + One-Euro smoothing + scene-cut locking + max-quality encode. First export adds ~30–60s.</span>
            </div>
          )}

          {/* Music Settings */}
          <div className="space-y-3 border border-gray-700 rounded-lg p-3.5 bg-gray-950/40">
            <div className="flex items-center gap-2">
              <input
                id="music-enabled"
                type="checkbox"
                checked={musicEnabled}
                onChange={(e) => setMusicEnabled(e.target.checked)}
                className="rounded cursor-pointer accent-[#06b6d4]"
              />
              <label htmlFor="music-enabled" className="text-sm font-medium text-gray-200 cursor-pointer">
                Add background music
              </label>
            </div>

            {musicEnabled && (
              <div className="space-y-3 pl-6 border-l border-gray-700">
                <div className="space-y-1">
                  <label htmlFor="music-upload" className="text-xs text-gray-400 block">
                    Upload music track
                  </label>
                  <input
                    id="music-upload"
                    type="file"
                    accept=".mp3,.m4a,.wav"
                    onChange={(e) => {
                      setMusicFile(e.target.files?.[0] || null)
                      if (e.target.files?.[0]) {
                        // In a real app, would upload here
                        // For now, just store filename as track_id
                        setMusicTrackId(e.target.files[0].name.replace(/\.[^.]+$/, ''))
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded text-xs text-gray-300 file:bg-cyan-600 file:text-white file:border-0 file:py-1 file:px-2 file:rounded file:text-xs file:font-semibold file:cursor-pointer"
                  />
                  {musicFile && <p className="text-[10px] text-gray-500 mt-1">{musicFile.name} ({(musicFile.size / 1024 / 1024).toFixed(1)} MB)</p>}
                </div>

                {musicTrackId && (
                  <>
                    <div className="space-y-1">
                      <label htmlFor="music-trim-start" className="text-xs text-gray-400 block">
                        Trim start {musicTrimStart.toFixed(1)}s
                      </label>
                      <input
                        id="music-trim-start"
                        type="range"
                        min="0"
                        max="30"
                        step="0.1"
                        value={musicTrimStart}
                        onChange={(e) => setMusicTrimStart(parseFloat(e.target.value))}
                        className="w-full accent-[#06b6d4]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="music-trim-end" className="text-xs text-gray-400 block">
                        Trim end {musicTrimEnd.toFixed(1)}s (0 = full)
                      </label>
                      <input
                        id="music-trim-end"
                        type="range"
                        min="0"
                        max="30"
                        step="0.1"
                        value={musicTrimEnd}
                        onChange={(e) => setMusicTrimEnd(parseFloat(e.target.value))}
                        className="w-full accent-[#06b6d4]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="music-volume" className="text-xs text-gray-400 block">
                        Volume {(musicVolume * 100).toFixed(0)}%
                      </label>
                      <input
                        id="music-volume"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={musicVolume}
                        onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                        className="w-full accent-[#06b6d4]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="music-fade-in" className="text-xs text-gray-400 block">
                        Fade in {musicFadeIn.toFixed(1)}s
                      </label>
                      <input
                        id="music-fade-in"
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        value={musicFadeIn}
                        onChange={(e) => setMusicFadeIn(parseFloat(e.target.value))}
                        className="w-full accent-[#06b6d4]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="music-fade-out" className="text-xs text-gray-400 block">
                        Fade out {musicFadeOut.toFixed(1)}s
                      </label>
                      <input
                        id="music-fade-out"
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        value={musicFadeOut}
                        onChange={(e) => setMusicFadeOut(parseFloat(e.target.value))}
                        className="w-full accent-[#06b6d4]"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          </div>

          {/* Export button — sticky at bottom of settings column */}
          <div className="pt-3 mt-1 border-t border-forge-border space-y-2">
            {error && (
              <p role="alert" className="text-red-400 text-xs">{error}</p>
            )}
            {downloadUrl ? (
              <div className="space-y-2">
                <button
                  key={clipId}
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                >
                  {downloading ? <><Loader size={16} className="animate-spin" aria-hidden="true" /> Downloading...</> : <><Download size={16} aria-hidden="true" /> Download clip</>}
                </button>
                {total > 1 && safeIndex < total - 1 && (
                  <button
                    onClick={goNext}
                    className="w-full py-2 text-sm text-gray-300 hover:text-white border border-forge-border hover:border-gray-500 rounded-xl cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
                  >
                    Next clip ({safeIndex + 2} of {total}) →
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleExport}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-semibold cursor-pointer transition-all duration-200 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
              >
                {loading ? <><Loader size={16} className="animate-spin" aria-hidden="true" /> Exporting...</> : <><Download size={16} aria-hidden="true" /> Export</>}
              </button>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
