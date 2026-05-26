import { useState, FormEvent, memo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Scissors, ChevronDown, ChevronUp, Clock, ArrowRight, Zap,
  Flame, MessageSquare, XCircle, TrendingUp, Heart, MessageCircle, BookOpen,
  LucideIcon, SlidersHorizontal, Wand2, Play, Eye, ThumbsUp,
} from 'lucide-react'
import type { AxiosError } from 'axios'
import { uploadAndCreateJob } from '../lib/r2Upload'
import useStore from '../store'
import URLInput from '../components/URLInput'
import ThemeToggle from '../components/ThemeToggle'
import UserMenu from '../components/UserMenu'
import CreditsBadge from '../components/CreditsBadge'
import type { AspectRatio } from '../types/api'

interface ClipTypeDef {
  id: string
  label: string
  Icon: LucideIcon
}

const CLIP_TYPES: ClipTypeDef[] = [
  { id: 'controversy',    label: 'Controversy',    Icon: Flame },
  { id: 'hook_intro',     label: 'Hook Intro',     Icon: Zap },
  { id: 'quotable',       label: 'Quotable',       Icon: MessageSquare },
  { id: 'myth_bust',      label: 'Myth Bust',      Icon: XCircle },
  { id: 'shocking_stat',  label: 'Shocking Stat',  Icon: TrendingUp },
  { id: 'emotional_peak', label: 'Emotional Peak', Icon: Heart },
  { id: 'debate_moment',  label: 'Debate Moment',  Icon: MessageCircle },
  { id: 'story_arc',      label: 'Story Arc',      Icon: BookOpen },
]

interface StatDef { value: string; label: string }

const STATS: StatDef[] = [
  { value: '10M+',  label: 'Clips Generated' },
  { value: '98.3%', label: 'Accuracy Rate' },
  { value: '40×',   label: 'Faster Than Manual' },
]

type ClipMode = 'quick' | 'custom'

interface HomeOptions {
  max_clips: number
  clip_types: string[]
  min_clip_duration: number
  max_clip_duration: number
  target_aspect_ratio: AspectRatio | string
}

type NumericOptionKey = 'min_clip_duration' | 'max_clip_duration'

interface DurationSliderDef {
  key: NumericOptionKey
  label: string
  min: number
  max: number
}

const DURATION_SLIDERS: DurationSliderDef[] = [
  { key: 'min_clip_duration', label: 'Min duration', min: 10, max: 60 },
  { key: 'max_clip_duration', label: 'Max duration', min: 30, max: 180 },
]

// ── Animated right-panel clip preview ─────────────────────────

interface MockClip {
  title: string
  views: string
  likes: string
  dur: string
  platform: string
  gradient: string
  tagColor: string
  tag: string
}

const MOCK_CLIPS: MockClip[] = [
  {
    title: 'The moment they realized they were wrong',
    views: '2.3M',
    likes: '147K',
    dur: '0:47',
    platform: 'TikTok',
    gradient: 'from-cyan-500/20 via-teal-500/10 to-transparent',
    tag: 'Debate Moment',
    tagColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
  },
  {
    title: 'Nobody ever explains this part',
    views: '847K',
    likes: '63.2K',
    dur: '1:12',
    platform: 'Reels',
    gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
    tag: 'Hook Intro',
    tagColor: 'bg-rose-500/15 text-rose-300 border-rose-500/20',
  },
  {
    title: 'The stat that changes everything',
    views: '1.1M',
    likes: '91.8K',
    dur: '0:33',
    platform: 'Shorts',
    gradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
    tag: 'Shocking Stat',
    tagColor: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  },
]

const PLATFORM_COLORS: Record<string, string> = {
  TikTok:  'bg-zinc-800 text-zinc-200',
  Reels:   'bg-zinc-800 text-zinc-200',
  Shorts:  'bg-zinc-800 text-zinc-200',
}

const ClipPreviewCard = memo(({ clip, index }: { clip: MockClip; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 40, scale: 0.94 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay: 0.3 + index * 0.18, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    className="w-[280px] glass-card rounded-2xl overflow-hidden border border-forge-border shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)]"
    style={{
      animation: `float ${4.5 + index * 1.2}s ease-in-out infinite`,
      animationDelay: `${index * 1.4}s`,
    }}
  >
    {/* Thumbnail */}
    <div className={`relative h-36 bg-gradient-to-br ${clip.gradient} bg-forge-surface flex items-center justify-center`}>
      <div className="absolute inset-0 bg-forge-bg/40" />
      <div className="relative w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
        <Play size={16} className="text-white ml-0.5" fill="white" />
      </div>
      <span className="absolute bottom-2 right-2 text-[11px] font-semibold text-white/80 bg-black/50 px-1.5 py-0.5 rounded-md">
        {clip.dur}
      </span>
      <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PLATFORM_COLORS[clip.platform]}`}>
        {clip.platform}
      </span>
    </div>

    {/* Body */}
    <div className="px-4 py-3 space-y-2">
      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${clip.tagColor}`}>
        {clip.tag}
      </span>
      <p className="text-sm font-semibold text-forge-text leading-snug line-clamp-2">
        {clip.title}
      </p>
      <div className="flex items-center gap-3 pt-0.5">
        <span className="flex items-center gap-1 text-[11px] text-forge-muted">
          <Eye size={11} />
          {clip.views}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-forge-muted">
          <ThumbsUp size={11} />
          {clip.likes}
        </span>
      </div>
    </div>
  </motion.div>
))

const AnimatedClipPanel = memo(() => (
  <div className="relative flex flex-col items-center gap-5 py-8 px-6">
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-xs font-semibold text-forge-muted uppercase tracking-widest mb-2"
    >
      Generated clips
    </motion.p>
    {MOCK_CLIPS.map((clip, i) => (
      <ClipPreviewCard key={clip.title} clip={clip} index={i} />
    ))}
    {/* Fade-out gradient at bottom */}
    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-forge-surface/60 to-transparent pointer-events-none" />
  </div>
))

// ── Main component ─────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate()
  const { getRecentJobs, addRecentJob, refreshUser } = useStore()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [clipMode, setClipMode] = useState<ClipMode>('quick')
  const [customPrompt, setCustomPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState<HomeOptions>({
    max_clips: 5,
    clip_types: ['controversy', 'hook_intro', 'quotable', 'shocking_stat', 'myth_bust'],
    min_clip_duration: 20,
    max_clip_duration: 90,
    target_aspect_ratio: '9:16',
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadPct, setUploadPct] = useState<number>(0)

  const toggleClipType = (id: string) => {
    setOptions((o) => ({
      ...o,
      clip_types: o.clip_types.includes(id)
        ? o.clip_types.filter((t) => t !== id)
        : [...o.clip_types, id],
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!uploadedFile) {
      setError('Upload a video or audio file to continue.')
      return
    }
    setError(null)
    setLoading(true)
    setUploadPct(0)
    try {
      const prompt = clipMode === 'custom' ? customPrompt.trim() : ''
      const res = await uploadAndCreateJob(
        { file: uploadedFile, onProgress: setUploadPct },
        {
          max_clips: options.max_clips,
          clip_types: prompt ? [] : options.clip_types,
          min_clip_duration: options.min_clip_duration,
          max_clip_duration: options.max_clip_duration,
          target_aspect_ratio: options.target_aspect_ratio,
          ...(prompt ? { custom_prompt: prompt } : {}),
        },
      )
      addRecentJob({ job_id: res.job_id, video_title: uploadedFile.name })
      refreshUser()
      navigate(`/processing/${res.job_id}`)
    } catch (err) {
      const ax = err as AxiosError<{ detail?: string }>
      setError(ax.response?.data?.detail || (err as Error).message || 'Failed to start job.')
    } finally {
      setLoading(false)
    }
  }

  const recentJobs = getRecentJobs()

  return (
    <div className="min-h-[100dvh] bg-forge-bg">

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-10 h-16 bg-forge-bg/85 backdrop-blur-xl border-b border-forge-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-forge-accent/15 border border-forge-accent/30 flex items-center justify-center">
            <Scissors size={15} className="text-forge-accent" />
          </div>
          <span className="text-lg font-black tracking-tight text-forge-text">VibeClip</span>
        </div>
        <div className="flex items-center gap-2">
          <CreditsBadge />
          <UserMenu />
          <ThemeToggle />
        </div>
      </nav>

      {/* ── Main grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] min-h-[100dvh]">

        {/* Left — hero + form */}
        <section className="flex flex-col justify-center pt-28 pb-16 px-6 sm:px-10 lg:px-14 xl:px-20 page-enter">
          <div className="w-full max-w-xl">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full glass border border-forge-border mb-8 text-xs text-forge-muted cursor-default"
            >
              <span className="pulse-dot" />
              <span className="font-medium">Claude AI · Whisper large-v3 · Real-time</span>
            </motion.div>

            {/* H1 */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl sm:text-6xl xl:text-7xl font-black tracking-tighter leading-[0.95] mb-5"
            >
              Turn any video<br />
              into <span className="gradient-text">viral clips.</span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.6 }}
              className="text-forge-subtext text-lg leading-relaxed mb-8 max-w-[50ch]"
            >
              AI finds the moments worth posting. Captions burned in, ready for TikTok, Reels, and Shorts.
            </motion.p>

            {/* Stats strip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.55 }}
              className="flex w-fit divide-x divide-forge-border border border-forge-border rounded-2xl overflow-hidden mb-10"
            >
              {STATS.map((s, i) => (
                <div key={s.label} className="px-5 py-3.5">
                  <span className={`text-xl font-black leading-none ${i === 2 ? 'gradient-text' : 'text-forge-text'}`}>
                    {s.value}
                  </span>
                  <p className="text-[11px] text-forge-muted mt-0.5 whitespace-nowrap">{s.label}</p>
                </div>
              ))}
            </motion.div>

            {/* ── Form ─────────────────────────────────────── */}
            <motion.form
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.6 }}
              onSubmit={handleSubmit}
            >
              <div className="gradient-ring rounded-2xl">
                <div className="glass-card rounded-2xl p-1 input-glow border border-forge-border transition-all duration-300">
                  <URLInput onFileSelect={setUploadedFile} uploadedFile={uploadedFile} />
                </div>
              </div>

              {/* Advanced toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced((s) => !s)}
                className="flex items-center gap-1.5 text-sm text-forge-muted hover:text-forge-text transition-colors mt-4 ml-1 cursor-pointer"
              >
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span>{showAdvanced ? 'Hide' : 'Show'} advanced options</span>
              </button>

              {showAdvanced && (
                <div className="glass-card rounded-2xl p-6 mt-3 space-y-6 border border-forge-border animate-fade-in">

                  {/* Max clips */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-semibold text-forge-text">Max clips</label>
                      <span className="text-sm font-bold text-forge-accent bg-forge-accent/10 px-2.5 py-0.5 rounded-full border border-forge-accent/20">
                        {options.max_clips}
                      </span>
                    </div>
                    <input
                      type="range" min={1} max={10} value={options.max_clips}
                      onChange={(e) => setOptions((o) => ({ ...o, max_clips: +e.target.value }))}
                      className="w-full h-1.5 cursor-pointer"
                    />
                  </div>

                  {/* Duration sliders */}
                  <div className="grid grid-cols-2 gap-5">
                    {DURATION_SLIDERS.map(({ key, label, min, max }) => (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-sm font-semibold text-forge-text">{label}</label>
                          <span className="text-sm font-bold text-forge-accent bg-forge-accent/10 px-2.5 py-0.5 rounded-full border border-forge-accent/20">
                            {options[key]}s
                          </span>
                        </div>
                        <input
                          type="range" min={min} max={max} value={options[key]}
                          onChange={(e) => setOptions((o) => ({ ...o, [key]: +e.target.value }))}
                          className="w-full h-1.5 cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Clip mode toggle */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-forge-text">Clip selection</label>
                      <div className="flex gap-1 p-0.5 bg-forge-surface rounded-lg border border-forge-border">
                        <button
                          type="button"
                          onClick={() => setClipMode('quick')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                            clipMode === 'quick'
                              ? 'bg-forge-card border border-forge-border-bright text-forge-text shadow-sm'
                              : 'text-forge-muted hover:text-forge-text'
                          }`}
                        >
                          <SlidersHorizontal size={11} />
                          Quick
                        </button>
                        <button
                          type="button"
                          onClick={() => setClipMode('custom')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                            clipMode === 'custom'
                              ? 'bg-forge-card border border-forge-border-bright text-forge-text shadow-sm'
                              : 'text-forge-muted hover:text-forge-text'
                          }`}
                        >
                          <Wand2 size={11} />
                          Custom
                        </button>
                      </div>
                    </div>

                    {clipMode === 'quick' && (
                      <div className="flex flex-wrap gap-2">
                        {CLIP_TYPES.map(({ id, label, Icon }) => {
                          const active = options.clip_types.includes(id)
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => toggleClipType(id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer ${
                                active
                                  ? 'bg-forge-accent/15 border-forge-accent/50 text-forge-accent shadow-glow-violet-sm'
                                  : 'border-forge-border text-forge-muted hover:border-forge-border-bright hover:text-forge-text'
                              }`}
                            >
                              <Icon size={10} />
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {clipMode === 'custom' && (
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder={`Describe what you're looking for, e.g.:\n• Clips that make John look credible and likeable\n• Most engaging scroll-stopping moments\n• Heated debate moments and strong pushbacks`}
                        rows={4}
                        className="w-full bg-forge-surface border border-forge-border rounded-xl px-3.5 py-3 text-sm text-forge-text placeholder:text-forge-dim resize-none focus:outline-none focus:border-forge-accent/60 focus:ring-1 focus:ring-forge-accent/20 transition-colors"
                      />
                    )}
                  </div>

                  {/* Aspect ratio */}
                  <div>
                    <label className="block text-sm font-semibold text-forge-text mb-3">Aspect ratio</label>
                    <div className="flex gap-2">
                      {(['9:16', '1:1', '16:9'] as AspectRatio[]).map((ar) => (
                        <button
                          key={ar}
                          type="button"
                          onClick={() => setOptions((o) => ({ ...o, target_aspect_ratio: ar }))}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 cursor-pointer ${
                            options.target_aspect_ratio === ar
                              ? 'bg-forge-accent/15 border-forge-accent/50 text-forge-accent'
                              : 'border-forge-border text-forge-muted hover:border-forge-border-bright hover:text-forge-text'
                          }`}
                        >
                          {ar}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/22 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-4 py-4 rounded-2xl font-bold text-base text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {uploadedFile && uploadPct > 0 && uploadPct < 100
                      ? `Uploading ${uploadPct}%`
                      : 'Starting analysis...'}
                  </>
                ) : (
                  <>
                    <Zap size={17} className="shrink-0" />
                    Generate Viral Clips
                    <ArrowRight size={17} className="shrink-0" />
                  </>
                )}
              </button>
            </motion.form>

            {/* ── Recent jobs ──────────────────────────────── */}
            {recentJobs.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-10"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-forge-border" />
                  <p className="text-xs font-bold text-forge-dim uppercase tracking-widest px-2">Recent</p>
                  <div className="h-px flex-1 bg-forge-border" />
                </div>
                <div className="space-y-2">
                  {recentJobs.slice(0, 5).map((job) => (
                    <button
                      key={job.id}
                      onClick={() => navigate(`/review/${job.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 glass-card rounded-xl border border-forge-border card-hover-glow text-left group cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-forge-accent/10 border border-forge-accent/20 flex items-center justify-center shrink-0 group-hover:bg-forge-accent/20 transition-colors">
                        <Clock size={12} className="text-forge-accent" />
                      </div>
                      <span className="text-sm text-forge-subtext group-hover:text-forge-text truncate flex-1 transition-colors">
                        {job.title || job.id}
                      </span>
                      <ArrowRight size={13} className="text-forge-dim group-hover:text-forge-accent shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* Right — animated clip preview */}
        <aside className="hidden lg:flex flex-col items-center justify-center relative bg-forge-surface/25 border-l border-forge-border/40 overflow-hidden">
          <div className="fixed top-0 right-0 w-[380px] xl:w-[420px] h-full flex flex-col items-center justify-center overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-forge-accent/5 blur-3xl pointer-events-none" />
            <AnimatedClipPanel />
          </div>
        </aside>

      </div>
    </div>
  )
}
