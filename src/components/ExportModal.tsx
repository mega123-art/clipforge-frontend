import { useState, useEffect, CSSProperties } from 'react'
import api from '../api'
import { X, Download, Loader, Info, ChevronLeft, ChevronRight } from 'lucide-react'
import type { AxiosError } from 'axios'
import type { ExportResponse } from '../types/api'

const ASPECT_RATIOS: string[] = ['9:16', '1:1', '16:9']

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
]

interface FocusModeOption {
  id: 'none' | 'speaker' | 'center' | 'face'
  label: string
  desc: string
}

const FOCUS_MODES: FocusModeOption[] = [
  { id: 'face', label: 'Face Focus (Pro)', desc: 'TikTok-style: locks on face, ultra-smooth, no shake, max quality' },
  { id: 'speaker', label: 'Speaker focus', desc: 'Auto-track active speaker (multi-speaker podcasts)' },
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
}

function PreviewPanel({
  aspectRatio,
  captionStyle,
  captionPosition,
  includeCaptions,
  hookText,
  hookPosition,
  hookFontScale,
}: PreviewPanelProps) {
  const cs = CAPTION_STYLES.find((s) => s.id === captionStyle) ?? CAPTION_STYLES[0]
  const aspectClass =
    aspectRatio === '1:1' ? 'aspect-square' :
    aspectRatio === '16:9' ? 'aspect-video' :
    'aspect-[9/16]'

  const captionPosClass =
    captionPosition === 'top' ? 'top-6 justify-start' :
    captionPosition === 'middle' ? 'top-0 bottom-0 justify-center' :
    'bottom-10 justify-end'

  const hookPosClass =
    hookPosition === 'top' ? 'top-6' :
    hookPosition === 'center' ? 'top-1/2 -translate-y-1/2' :
    'bottom-24'

  return (
    <div className="shrink-0 w-full md:w-[280px] flex flex-col items-center">
      <div className={`relative w-full ${aspectClass} max-h-[60vh] rounded-xl overflow-hidden border border-forge-border bg-gradient-to-br from-zinc-800 via-zinc-900 to-black`}>
        {/* Mock subject silhouette */}
        <div className="absolute inset-0 flex items-end justify-center pb-12 opacity-30 pointer-events-none">
          <div className="w-32 h-32 rounded-full bg-zinc-600" />
        </div>

        {/* Hook overlay */}
        {hookText.trim() && (
          <div className={`absolute left-0 right-0 px-4 flex justify-center pointer-events-none ${hookPosClass}`}>
            <div
              className="bg-white/95 text-black rounded-xl shadow-lg text-center"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontWeight: 700,
                fontSize: `${10 * hookFontScale}px`,
                lineHeight: 1.25,
                padding: '8px 12px',
                maxWidth: '90%',
              }}
            >
              {hookText}
            </div>
          </div>
        )}

        {/* Caption sample */}
        {includeCaptions && (
          <div className={`absolute left-0 right-0 px-3 flex flex-col items-center pointer-events-none ${captionPosClass}`}>
            <span style={cs.css} className="text-xs whitespace-nowrap">
              {cs.sample}
            </span>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-500">Live preview</p>
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
  const [focusMode, setFocusMode] = useState<'none' | 'speaker' | 'center' | 'face'>('face')
  const [hookText, setHookText] = useState<string>('')
  const [hookPosition, setHookPosition] = useState<'top' | 'center' | 'bottom'>('top')
  const [hookFontScale, setHookFontScale] = useState<number>(1.0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  // Reset per-clip state when navigating between clips.
  useEffect(() => {
    setLoading(false)
    setError(null)
    setDownloadUrl(null)
  }, [clipId])

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
        },
      )
      if (targetId !== clipId) return

      // If backend ran sync (old version) it already returned the URL.
      if (data.status !== 'exporting' && data.download_url) {
        setDownloadUrl(data.download_url)
        return
      }

      // Poll clip status every 3s, max 10 min.
      const deadline = Date.now() + 10 * 60 * 1000
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
      setError('Export timed out after 10 minutes. Try a shorter clip.')
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
    try {
      // Ask backend where the file is. Backend returns either:
      //   - JSON {url: <R2 presigned URL>}  (R2 path, preferred)
      //   - binary stream                    (local fallback)
      // For R2 path, navigate the browser directly to the URL — no fetch,
      // no CORS preflight, no JS heap allocation. R2 bucket should set
      // Content-Disposition on the presigned URL so the browser saves
      // instead of opening in-tab.
      // For local stream path, fall back to arraybuffer + blob.
      const resp = await api.get(downloadUrl, { responseType: 'arraybuffer' })
      const contentType = (resp.headers['content-type'] || '').toLowerCase()

      if (contentType.includes('application/json')) {
        const text = new TextDecoder().decode(resp.data as ArrayBuffer)
        const parsed = JSON.parse(text) as { url?: string }
        if (!parsed.url) throw new Error('No download URL returned')
        const a = document.createElement('a')
        a.href = parsed.url
        a.download = `clip_${clipId}.mp4`
        a.target = '_blank'
        a.rel = 'noopener'
        document.body.appendChild(a)
        a.click()
        a.remove()
        return
      }

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
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-6 sm:py-8"
    >
      <div className="bg-forge-card border border-forge-border rounded-2xl p-6 w-full max-w-4xl mx-4 my-auto shadow-2xl">
        <div className="flex items-center justify-between mb-5 gap-2">
          <div className="flex items-center gap-2">
            {total > 1 && (
              <button
                onClick={goPrev}
                disabled={safeIndex === 0}
                aria-label="Previous clip"
                className="cursor-pointer p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-colors duration-200"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div>
              <h2 id="export-modal-title" className="font-semibold text-lg">Export Clip</h2>
              {total > 1 && (
                <p className="text-xs text-gray-500 mt-0.5">{safeIndex + 1} of {total}</p>
              )}
            </div>
            {total > 1 && (
              <button
                onClick={goNext}
                disabled={safeIndex >= total - 1}
                aria-label="Next clip"
                className="cursor-pointer p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-colors duration-200"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close export dialog"
            className="cursor-pointer p-2 -m-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-colors duration-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 max-h-[75vh]">
          {/* Live preview */}
          <PreviewPanel
            aspectRatio={aspectRatio}
            captionStyle={captionStyle}
            captionPosition={captionPosition}
            includeCaptions={includeCaptions}
            hookText={hookText}
            hookPosition={hookPosition}
            hookFontScale={hookFontScale}
          />

          <div className="flex-1 space-y-5 overflow-y-auto pr-1 md:max-h-[75vh]">
          {/* Aspect ratio */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Aspect ratio</label>
            <div className="flex gap-2" role="radiogroup" aria-label="Aspect ratio">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar}
                  role="radio"
                  aria-checked={aspectRatio === ar}
                  onClick={() => setAspectRatio(ar)}
                  className={`flex-1 py-2 rounded-lg text-sm border cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                    aspectRatio === ar
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'border-forge-border text-gray-300 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          {/* Frame mode */}
          {aspectRatio === '9:16' && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Frame</label>
              <div className="space-y-1.5" role="radiogroup" aria-label="Frame mode">
                {FOCUS_MODES.map((fm) => (
                  <button
                    key={fm.id}
                    role="radio"
                    aria-checked={focusMode === fm.id}
                    onClick={() => setFocusMode(fm.id)}
                    className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-sm border cursor-pointer transition-colors duration-200 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                      focusMode === fm.id
                        ? 'bg-violet-950 border-violet-600 text-violet-200'
                        : 'border-forge-border text-gray-300 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    <span className={`mt-1 w-3 h-3 rounded-full border-2 shrink-0 transition-colors duration-200 ${focusMode === fm.id ? 'bg-violet-500 border-violet-500' : 'border-gray-600'}`} />
                    <span className="flex-1">
                      <span className="block font-medium">{fm.label}</span>
                      <span className="block text-xs text-gray-500 mt-0.5">{fm.desc}</span>
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
              <label className="block text-sm text-gray-400 mb-2">Caption style</label>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Caption style">
                {CAPTION_STYLES.map((cs) => (
                  <button
                    key={cs.id}
                    role="radio"
                    aria-checked={captionStyle === cs.id}
                    aria-label={cs.label}
                    onClick={() => setCaptionStyle(cs.id)}
                    className={`relative rounded-lg border-2 overflow-hidden cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                      captionStyle === cs.id
                        ? 'border-violet-500 ring-2 ring-violet-500/40'
                        : 'border-forge-border hover:border-gray-500'
                    }`}
                  >
                    <div
                      className="aspect-video flex items-center justify-center"
                      style={{ background: cs.bg }}
                    >
                      <span style={cs.css} className="text-sm whitespace-nowrap">
                        {cs.sample}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-200 py-1 px-1 truncate bg-forge-card">
                      {cs.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Caption position */}
          {includeCaptions && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Caption position</label>
              <div className="flex gap-2" role="radiogroup" aria-label="Caption position">
                {(['top', 'middle', 'bottom'] as const).map((pos) => (
                  <button
                    key={pos}
                    role="radio"
                    aria-checked={captionPosition === pos}
                    onClick={() => setCaptionPosition(pos)}
                    className={`flex-1 py-2 rounded-lg text-sm border cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 capitalize ${
                      captionPosition === pos
                        ? 'bg-violet-600 border-violet-500 text-white'
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
            <label htmlFor="hook-text" className="block text-sm text-gray-400 mb-2">
              Viral hook <span className="text-gray-600">(optional)</span>
            </label>
            <input
              id="hook-text"
              type="text"
              value={hookText}
              onChange={(e) => setHookText(e.target.value)}
              placeholder="e.g. POV: you fix prod at 3am"
              maxLength={140}
              className="w-full px-3 py-2 rounded-lg bg-forge-bg border border-forge-border text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500"
            />
            {hookText.trim() && (
              <div className="mt-2 space-y-2">
                <div className="flex gap-2" role="radiogroup" aria-label="Hook position">
                  {(['top', 'center', 'bottom'] as const).map((pos) => (
                    <button
                      key={pos}
                      role="radio"
                      aria-checked={hookPosition === pos}
                      onClick={() => setHookPosition(pos)}
                      className={`flex-1 py-2 rounded-lg text-sm border cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 capitalize ${
                        hookPosition === pos
                          ? 'bg-violet-600 border-violet-500 text-white'
                          : 'border-forge-border text-gray-300 hover:border-gray-500 hover:text-white'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
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
                    className="flex-1 accent-violet-500"
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
            <div className="flex items-start gap-2 p-2.5 bg-violet-950/40 border border-violet-800/50 rounded-lg text-xs text-violet-200">
              <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>Face Focus uses MediaPipe + One-Euro smoothing + scene-cut locking + max-quality encode. First export adds ~30–60s.</span>
            </div>
          )}

          {error && (
            <p role="alert" className="text-red-400 text-sm">{error}</p>
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
                  className="w-full py-2 text-sm text-gray-300 hover:text-white border border-forge-border hover:border-gray-500 rounded-xl cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  Next clip ({safeIndex + 2} of {total}) →
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleExport}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              {loading ? <><Loader size={16} className="animate-spin" aria-hidden="true" /> Exporting...</> : <><Download size={16} aria-hidden="true" /> Export</>}
            </button>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
