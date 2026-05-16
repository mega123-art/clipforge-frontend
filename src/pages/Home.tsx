import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Scissors, ChevronDown, ChevronUp, Clock, ArrowRight, Zap,
  Flame, MessageSquare, XCircle, TrendingUp, Heart, MessageCircle, BookOpen,
  LucideIcon,
} from 'lucide-react'
import type { AxiosError } from 'axios'
import api from '../api'
import useStore from '../store'
import URLInput from '../components/URLInput'
import ThemeToggle from '../components/ThemeToggle'
import UserMenu from '../components/UserMenu'
import CreditsBadge from '../components/CreditsBadge'
import type { AspectRatio, JobCreateResponse } from '../types/api'

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

interface StatDef {
  value: string
  label: string
}

const STATS: StatDef[] = [
  { value: '10M+', label: 'Clips Generated' },
  { value: '98%',  label: 'Accuracy Rate' },
  { value: '40x',  label: 'Faster Than Manual' },
]

interface HomeOptions {
  source_url: string
  max_clips: number
  clip_types: string[]
  min_clip_duration: number
  max_clip_duration: number
  target_aspect_ratio: AspectRatio | string
}

// Numeric-valued option keys for duration sliders.
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

export default function Home() {
  const navigate = useNavigate()
  const { getRecentJobs, addRecentJob, refreshUser } = useStore()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState<HomeOptions>({
    source_url: '',
    max_clips: 5,
    clip_types: ['controversy', 'hook_intro', 'quotable', 'shocking_stat', 'myth_bust'],
    min_clip_duration: 20,
    max_clip_duration: 90,
    target_aspect_ratio: '9:16',
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

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
    if (!options.source_url && !uploadedFile) {
      setError('Paste a URL or upload a file.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const form = new FormData()
      if (options.source_url) form.append('source_url', options.source_url)
      if (uploadedFile) form.append('file', uploadedFile)
      form.append('max_clips', String(options.max_clips))
      form.append('clip_types', options.clip_types.join(','))
      form.append('min_clip_duration', String(options.min_clip_duration))
      form.append('max_clip_duration', String(options.max_clip_duration))
      form.append('target_aspect_ratio', options.target_aspect_ratio)
      const { data } = await api.post<JobCreateResponse>('/api/jobs', form)
      addRecentJob({ job_id: data.job_id, video_title: options.source_url || uploadedFile?.name })
      refreshUser()
      navigate(`/processing/${data.job_id}`)
    } catch (err) {
      const ax = err as AxiosError<{ detail?: string }>
      setError(ax.response?.data?.detail || 'Failed to start job.')
    } finally {
      setLoading(false)
    }
  }

  const recentJobs = getRecentJobs()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 page-enter">

      {/* Top-right controls */}
      <div className="fixed top-5 right-5 z-20 flex items-center gap-2">
        <CreditsBadge />
        <UserMenu />
        <ThemeToggle />
      </div>

      {/* Floating orbs */}
      <div className="fixed top-1/4 -left-40 w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-3xl animate-float pointer-events-none" />
      <div className="fixed bottom-1/4 -right-40 w-[420px] h-[420px] rounded-full bg-indigo-600/6 blur-3xl animate-float-slow pointer-events-none" />
      <div className="fixed top-3/4 left-1/3 w-64 h-64 rounded-full bg-forge-cyan/4 blur-3xl animate-float pointer-events-none" />

      <div className="w-full max-w-2xl relative">

        {/* ── Hero ───────────────────────────────────────────── */}
        <div className="text-center mb-10">

          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass border border-forge-border mb-8 text-xs text-forge-muted cursor-default">
            <span className="pulse-dot" />
            <span className="font-medium">Claude AI · Whisper large-v3 · Real-time</span>
          </div>

          {/* Logo + wordmark */}
          <div className="flex items-center justify-center gap-3.5 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/35 flex items-center justify-center shadow-glow-violet-sm">
              <Scissors size={22} className="text-violet-400" />
            </div>
            <h1 className="text-6xl sm:text-7xl font-black tracking-tight gradient-text leading-none">
              ClipForge
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-forge-subtext text-lg font-light max-w-sm mx-auto leading-relaxed">
            Drop any video. Get <span className="gradient-text-gold font-semibold">viral-ready clips</span> in minutes — AI-powered, caption-burned, ready to post.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-2 mt-9">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={`flex flex-col items-center px-6 py-3.5 rounded-2xl glass-card border border-forge-border ${i === 1 ? 'border-violet-500/30 shadow-glow-violet-sm' : ''}`}
              >
                <span className="text-2xl font-black gradient-text-gold leading-none">{s.value}</span>
                <span className="text-xs text-forge-dim mt-1 whitespace-nowrap">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main form ──────────────────────────────────────── */}
        <form onSubmit={handleSubmit}>

          {/* Input card with gradient ring on focus */}
          <div className="gradient-ring rounded-2xl">
            <div className="glass-card rounded-2xl p-1 input-glow border border-forge-border transition-all duration-300">
              <URLInput
                value={options.source_url}
                onChange={(v) => setOptions((o) => ({ ...o, source_url: v }))}
                onFileSelect={setUploadedFile}
                uploadedFile={uploadedFile}
              />
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
                  <span className="text-sm font-bold text-violet-400 bg-violet-500/12 px-2.5 py-0.5 rounded-full border border-violet-500/25">
                    {options.max_clips}
                  </span>
                </div>
                <input
                  type="range" min={1} max={10} value={options.max_clips}
                  onChange={(e) => setOptions((o) => ({ ...o, max_clips: +e.target.value }))}
                  className="w-full h-1.5 accent-violet-500 cursor-pointer"
                />
              </div>

              {/* Duration sliders */}
              <div className="grid grid-cols-2 gap-5">
                {DURATION_SLIDERS.map(({ key, label, min, max }) => (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-semibold text-forge-text">{label}</label>
                      <span className="text-sm font-bold text-violet-400 bg-violet-500/12 px-2.5 py-0.5 rounded-full border border-violet-500/25">
                        {options[key]}s
                      </span>
                    </div>
                    <input
                      type="range" min={min} max={max} value={options[key]}
                      onChange={(e) => setOptions((o) => ({ ...o, [key]: +e.target.value }))}
                      className="w-full h-1.5 accent-violet-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              {/* Clip types */}
              <div>
                <label className="block text-sm font-semibold text-forge-text mb-3">Clip types</label>
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
                            ? 'bg-violet-600/22 border-violet-500/55 text-violet-300 shadow-glow-violet-sm'
                            : 'border-forge-border text-forge-muted hover:border-forge-border-bright hover:text-forge-text'
                        }`}
                      >
                        <Icon size={10} />
                        {label}
                      </button>
                    )
                  })}
                </div>
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
                          ? 'bg-violet-600/22 border-violet-500/55 text-violet-300'
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
                Starting analysis...
              </>
            ) : (
              <>
                <Zap size={17} className="shrink-0" />
                Generate Viral Clips
                <ArrowRight size={17} className="shrink-0" />
              </>
            )}
          </button>
        </form>

        {/* ── Recent jobs ────────────────────────────────────── */}
        {recentJobs.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4 ml-1">
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
                  <div className="w-7 h-7 rounded-lg bg-violet-500/12 border border-violet-500/22 flex items-center justify-center shrink-0 group-hover:bg-violet-500/22 transition-colors">
                    <Clock size={12} className="text-violet-400" />
                  </div>
                  <span className="text-sm text-forge-subtext group-hover:text-forge-text truncate flex-1 transition-colors">
                    {job.title || job.id}
                  </span>
                  <ArrowRight size={13} className="text-forge-dim group-hover:text-violet-400 shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
