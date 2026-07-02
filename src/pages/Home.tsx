import { useState, useEffect, FormEvent, memo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown, ChevronUp, Clock, ArrowRight, Zap,
  Flame, MessageSquare, XCircle, TrendingUp, Heart, MessageCircle, BookOpen,
  LucideIcon, SlidersHorizontal, Wand2, Crown, Gift, Copy, Check,
} from 'lucide-react'
import VibeClipLogo from '../components/VibeClipLogo'
import type { AxiosError } from 'axios'
import { uploadAndCreateJob } from '../lib/r2Upload'
import useStore from '../store'
import URLInput from '../components/URLInput'
import { useSubscriptionModal } from '../hooks/useSubscriptionModal'
import ThemeToggle from '../components/ThemeToggle'
import UserMenu from '../components/UserMenu'
import CreditsBadge from '../components/CreditsBadge'
import PlanButton from '../components/PlanButton'
import TierBadge from '../components/TierBadge'
import api from '../api'
import type { AspectRatio, ReferralInfo } from '../types/api'

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

// ── Hero background ───────────────────────────────────────────

const HeroBg = memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">

    {/* Slow-rotating conic aurora sweep */}
    <motion.div
      className="absolute inset-0 origin-center"
      style={{
        background: [
          'conic-gradient(from 0deg at 25% 55%,',
          '  transparent 0deg,',
          '  rgba(6,182,212,0.09) 45deg,',
          '  rgba(20,184,166,0.07) 90deg,',
          '  transparent 140deg,',
          '  rgba(34,211,238,0.06) 210deg,',
          '  rgba(6,182,212,0.08) 255deg,',
          '  transparent 310deg,',
          '  rgba(16,185,129,0.05) 340deg,',
          '  transparent 360deg',
          ')',
        ].join(''),
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
    />

    {/* Second counter-rotating sweep — offset colors */}
    <motion.div
      className="absolute inset-0 origin-[70%_40%]"
      style={{
        background: [
          'conic-gradient(from 180deg at 70% 40%,',
          '  transparent 0deg,',
          '  rgba(20,184,166,0.06) 50deg,',
          '  transparent 110deg,',
          '  rgba(6,182,212,0.07) 190deg,',
          '  rgba(34,211,238,0.05) 230deg,',
          '  transparent 290deg,',
          '  rgba(16,185,129,0.04) 340deg,',
          '  transparent 360deg',
          ')',
        ].join(''),
      }}
      animate={{ rotate: -360 }}
      transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
    />

    {/* Blob 1 — top-left cyan */}
    <motion.div
      className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.16) 0%, transparent 68%)', filter: 'blur(55px)' }}
      animate={{ x: [0, 35, -15, 25, 0], y: [0, -25, 35, -15, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* Blob 2 — bottom-right teal */}
    <motion.div
      className="absolute bottom-[-15%] right-[-5%] w-[50%] h-[55%] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.13) 0%, transparent 65%)', filter: 'blur(50px)' }}
      animate={{ x: [0, -30, 20, -10, 0], y: [0, 20, -30, 15, 0] }}
      transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
    />

    {/* Blob 3 — mid emerald accent */}
    <motion.div
      className="absolute top-[35%] left-[45%] w-[35%] h-[35%] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 65%)', filter: 'blur(45px)' }}
      animate={{ x: [0, -20, 30, -10, 20, 0], y: [0, 25, -15, 30, -10, 0], scale: [1, 1.15, 0.9, 1.08, 1] }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
    />

    {/* Blob 4 — small hot accent top-right */}
    <motion.div
      className="absolute top-[5%] right-[15%] w-[28%] h-[28%] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.11) 0%, transparent 65%)', filter: 'blur(35px)' }}
      animate={{ x: [0, 20, -25, 10, 0], y: [0, 30, -10, 25, 0] }}
      transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
    />

    {/* Dot grid */}
    <div
      className="absolute inset-0 opacity-[0.028]"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.85) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }}
    />

    {/* Diagonal line texture — ultra subtle */}
    <div
      className="absolute inset-0 opacity-[0.018]"
      style={{
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 40px)',
      }}
    />
  </div>
))

// ── Main component ─────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate()
  const { getRecentJobs, addRecentJob, refreshUser, user } = useStore()
  const { openSubscription } = useSubscriptionModal()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [clipMode, setClipMode] = useState<ClipMode>('quick')
  const [customPrompt, setCustomPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState<HomeOptions>({
    max_clips: 3,
    clip_types: ['controversy', 'hook_intro', 'quotable', 'shocking_stat', 'myth_bust'],
    min_clip_duration: 20,
    max_clip_duration: 90,
    target_aspect_ratio: '9:16',
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadPct, setUploadPct] = useState<number>(0)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [referral, setReferral] = useState<ReferralInfo | null>(null)
  const [refCopied, setRefCopied] = useState(false)

  useEffect(() => {
    if (!user) return
    api.get<ReferralInfo>('/api/auth/referral')
      .then((res) => setReferral(res.data))
      .catch(() => {})
  }, [user])

  const referralCode = referral?.referral_code || user?.referral_code || ''
  const referralLink = referralCode
    ? `${window.location.origin}/signup?ref=${encodeURIComponent(referralCode)}`
    : ''

  const copyReferralLink = async () => {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setRefCopied(true)
      window.setTimeout(() => setRefCopied(false), 1600)
    } catch {
      setRefCopied(false)
    }
  }

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
    if (!uploadedFile && !youtubeUrl) {
      setError('Paste a YouTube URL or upload a video file.')
      return
    }
    setError(null)
    setLoading(true)
    setUploadPct(0)
    try {
      const prompt = clipMode === 'custom' ? customPrompt.trim() : ''
      const jobOptions = {
        max_clips: options.max_clips,
        clip_types: prompt ? [] : options.clip_types,
        min_clip_duration: options.min_clip_duration,
        max_clip_duration: options.max_clip_duration,
        target_aspect_ratio: options.target_aspect_ratio,
        ...(prompt ? { custom_prompt: prompt } : {}),
      }

      let res: { job_id: string }
      if (youtubeUrl) {
        const { default: api } = await import('../api')
        const form = new FormData()
        form.append('source_url', youtubeUrl)
        Object.entries(jobOptions).forEach(([k, v]) =>
          form.append(k, Array.isArray(v) ? v.join(',') : String(v))
        )
        const r = await api.post('/api/jobs', form)
        res = { job_id: r.data.job_id }
        addRecentJob({ job_id: res.job_id, video_title: youtubeUrl })
      } else {
        res = await uploadAndCreateJob(
          { file: uploadedFile!, onProgress: setUploadPct },
          jobOptions,
        )
        addRecentJob({ job_id: res.job_id, video_title: uploadedFile!.name })
      }

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
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 px-4 sm:px-6 lg:px-10 h-16 bg-forge-bg/85 backdrop-blur-xl border-b border-forge-border/50">
        <div className="flex items-center gap-2.5 shrink-0">
          <VibeClipLogo size={30} className="rounded-xl" />
          <span className="text-lg font-black tracking-tight text-forge-text">VibeClip</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <CreditsBadge />
          <div className="hidden sm:block">
            <PlanButton />
          </div>
          <ThemeToggle />
          <UserMenu />
        </div>
      </nav>

      {/* ── Hero + form ─────────────────────────────────────── */}
      <main className="relative overflow-hidden min-h-[100dvh] pt-24 sm:pt-32 pb-16 px-5 sm:px-8 page-enter">
        <HeroBg />
        <div className="relative z-10 w-full max-w-2xl mx-auto text-center">

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="hidden sm:inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full glass border border-forge-border text-xs text-forge-muted cursor-default"
            >
              <span className="pulse-dot" />
              <span className="font-medium">Claude AI · Whisper large-v3 · Real-time</span>
            </motion.div>

            {user?.subscription_tier_name && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forge-accent/15 border border-forge-accent/35 text-xs text-forge-accent font-bold cursor-default"
              >
                <Crown size={12} className="text-forge-accent" />
                <span>{user.subscription_tier_name} Plan</span>
              </motion.div>
            )}
          </div>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="text-[2.6rem] sm:text-6xl xl:text-7xl font-black tracking-tighter leading-[0.98] mb-4 sm:mb-5"
          >
            Turn any video into{' '}
            <span className="font-display italic font-normal gradient-text tracking-tight">viral clips</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.6 }}
            className="text-forge-subtext text-base sm:text-lg leading-relaxed mb-8 sm:mb-10 max-w-[46ch] mx-auto"
          >
            AI finds the moments worth posting. Captions burned in, ready for TikTok, Reels, and Shorts.
          </motion.p>

            {/* ── Form ─────────────────────────────────────── */}
            <motion.form
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.6 }}
              onSubmit={handleSubmit}
              className="text-left"
            >
              <div className="gradient-ring rounded-2xl">
                <div className="glass-card rounded-2xl p-1 input-glow border border-forge-border transition-all duration-300">
                  <URLInput
                    onFileSelect={setUploadedFile}
                    uploadedFile={uploadedFile}
                    onYoutubeUrl={setYoutubeUrl}
                    youtubeUrl={youtubeUrl}
                    isSubscribed={!!user?.subscription_tier_name}
                    quality={user?.subscription_tier_name ? '1080p' : '720p'}
                    onUpgradeClick={openSubscription}
                  />
                </div>
              </div>

              {/* Advanced toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced((s) => !s)}
                className={`relative flex items-center gap-1.5 text-sm transition-colors mt-4 ml-1 cursor-pointer group
                  ${showAdvanced ? 'text-forge-accent' : 'text-forge-muted hover:text-forge-text'}`}
              >
                {!showAdvanced && (
                  <span className="absolute -inset-1.5 rounded-lg bg-forge-accent/10 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                {showAdvanced && (
                  <span className="absolute -inset-1.5 rounded-lg bg-forge-accent/15 blur-sm animate-pulse" />
                )}
                <span className="relative flex items-center gap-1.5">
                  {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>{showAdvanced ? 'Hide' : 'Show'} advanced options</span>
                  {!showAdvanced && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-forge-accent shadow-[0_0_6px_2px_rgba(6,182,212,0.6)] animate-pulse" />
                  )}
                </span>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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

            {/* ── Referral ─────────────────────────────────── */}
            {user && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="hidden sm:block mt-8 rounded-2xl border border-forge-border bg-forge-card/60 px-4 py-3 text-left"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-forge-accent/30 bg-forge-accent/10">
                      <Gift size={15} className="text-forge-accent" />
                    </div>
                    <p className="min-w-0 text-xs leading-5 text-forge-muted">
                      <span className="font-bold text-forge-text">Refer friends, earn credits.</span>{' '}
                      They get 3, you get 2 per signup.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyReferralLink}
                    disabled={!referralLink}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-forge-accent/35 bg-forge-card px-3.5 py-2 text-xs font-bold text-forge-accent transition-colors hover:bg-forge-card-hover disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
                  >
                    {refCopied ? <Check size={13} /> : <Copy size={13} />}
                    {refCopied ? 'Copied' : 'Copy link'}
                  </button>
                </div>
              </motion.div>
            )}

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
      </main>
    </div>
  )
}
