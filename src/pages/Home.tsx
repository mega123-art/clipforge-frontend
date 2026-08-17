import { useState, useEffect, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronDown, ChevronUp, Clock, ArrowRight, Zap,
  Flame, MessageSquare, XCircle, TrendingUp, Heart, MessageCircle, BookOpen,
  LucideIcon, SlidersHorizontal, Wand2, Crown, Gift, Copy, Check, Ban, Plus, X,
} from 'lucide-react'
import SkipTimestampsModal, { formatStamp, type SkipRange } from '../components/SkipTimestampsModal'
import VibeClipLogo from '../components/VibeClipLogo'
import HeroBg from '../components/HeroBg'
import type { AxiosError } from 'axios'
import { uploadAndCreateJob } from '../lib/r2Upload'
import useStore from '../store'
import URLInput from '../components/URLInput'
import { useSubscriptionModal } from '../hooks/useSubscriptionModal'
import ThemeToggle from '../components/ThemeToggle'
import UserMenu from '../components/UserMenu'
import CreditsBadge from '../components/CreditsBadge'
import MyClipsButton from '../components/MyClipsButton'
import PlanButton from '../components/PlanButton'
import TierBadge from '../components/TierBadge'
import { useReferral, useInvalidateJobs } from '../hooks/queries'
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

interface HomeLocationState {
  preferredInput?: 'file' | 'url'
  downloadServiceDown?: boolean
}

const DURATION_SLIDERS: DurationSliderDef[] = [
  { key: 'min_clip_duration', label: 'Shortest clip', min: 10, max: 60 },
  { key: 'max_clip_duration', label: 'Longest clip', min: 30, max: 180 },
]

const ASPECT_RATIOS: { id: AspectRatio; hint: string }[] = [
  { id: '9:16', hint: 'TikTok · Reels · Shorts' },
  { id: '1:1',  hint: 'Feed posts' },
  { id: '16:9', hint: 'YouTube · X' },
]

// ── Main component ─────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const { getRecentJobs, addRecentJob, refreshUser, user } = useStore()
  const { openSubscription } = useSubscriptionModal()
  const locationState = (location.state as HomeLocationState | null) ?? null
  const [showAdvanced, setShowAdvanced] = useState(true)
  const [clipMode, setClipMode] = useState<ClipMode>('quick')
  const [customPrompt, setCustomPrompt] = useState('')
  const [skipRanges, setSkipRanges] = useState<SkipRange[]>([])
  const [showSkipModal, setShowSkipModal] = useState(false)
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
  const [preferredInput, setPreferredInput] = useState<'file' | 'url'>(locationState?.preferredInput ?? 'url')
  const [showUploadFallbackNotice, setShowUploadFallbackNotice] = useState(Boolean(locationState?.downloadServiceDown))
  const [refCopied, setRefCopied] = useState(false)
  // Shared cache entry with UserMenu — one request, not one per component.
  const { data: referral } = useReferral()
  const invalidateJobs = useInvalidateJobs()

  useEffect(() => {
    if (!locationState) return
    if (locationState.preferredInput) setPreferredInput(locationState.preferredInput)
    if (locationState.downloadServiceDown) setShowUploadFallbackNotice(true)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, locationState, navigate])

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
      const skip = skipRanges
        .map((r) => `${formatStamp(r.startMin, r.startSec)}-${formatStamp(r.endMin, r.endSec)}`)
        .join(', ')
      const jobOptions = {
        max_clips: options.max_clips,
        clip_types: prompt ? [] : options.clip_types,
        min_clip_duration: options.min_clip_duration,
        max_clip_duration: options.max_clip_duration,
        target_aspect_ratio: options.target_aspect_ratio,
        ...(prompt ? { custom_prompt: prompt } : {}),
        ...(skip ? { skip_timestamps: skip } : {}),
      }

      let res: { job_id: string }
      if (youtubeUrl) {
        const { default: api } = await import('../api')
        const form = new FormData()
        form.append('source_url', youtubeUrl)
        Object.entries(jobOptions).forEach(([k, v]) =>
          form.append(k, Array.isArray(v) ? v.join(',') : String(v))
        )
        const r = await api.post('/api/jobs', form, { silent: true })
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
      // New job must appear in My Clips / the active-job banner immediately.
      invalidateJobs()
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
          <MyClipsButton />
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
                  {showUploadFallbackNotice && (
                    <div className="mx-4 mt-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-amber-200">Download service is temporarily down</p>
                          <p className="mt-1 text-xs leading-relaxed text-amber-100/75">
                            Download the video yourself, then upload the file here to continue processing.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowUploadFallbackNotice(false)}
                          className="text-amber-200/70 hover:text-amber-100 transition-colors"
                          aria-label="Dismiss notice"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                  <URLInput
                    onFileSelect={setUploadedFile}
                    uploadedFile={uploadedFile}
                    onYoutubeUrl={setYoutubeUrl}
                    youtubeUrl={youtubeUrl}
                    defaultTab={preferredInput}
                    isSubscribed={!!user?.subscription_tier_name}
                    quality={user?.subscription_tier_name ? '1080p' : '720p'}
                    onUpgradeClick={openSubscription}
                  />
                </div>
              </div>

              {/* Clip direction — core control surface, not an "advanced" afterthought */}
              <div className="glass-card rounded-2xl mt-4 border border-forge-border overflow-hidden">
                <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-forge-text">Direct the AI</p>
                      <p className="mt-0.5 text-xs leading-5 text-forge-muted">
                        You decide what counts as a good moment — angle, length, format. Most tools just guess.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced((s) => !s)}
                    className="flex shrink-0 items-center gap-1 text-xs font-semibold text-forge-muted hover:text-forge-text transition-colors cursor-pointer"
                  >
                    {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {showAdvanced ? 'Collapse' : 'Edit'}
                  </button>
                </div>

                {/* Collapsed: settings stay visible as a summary, never hidden entirely */}
                {!showAdvanced && (
                  <div className="flex flex-wrap gap-1.5 px-5 sm:px-6 pb-4">
                    {[
                      `${options.max_clips} clip${options.max_clips > 1 ? 's' : ''}`,
                      `${options.min_clip_duration}–${options.max_clip_duration}s`,
                      clipMode === 'custom'
                        ? 'Custom prompt'
                        : `${options.clip_types.length} angle${options.clip_types.length === 1 ? '' : 's'}`,
                      String(options.target_aspect_ratio),
                      ...(skipRanges.length ? [`${skipRanges.length} skipped`] : []),
                    ].map((chip) => (
                      <span
                        key={chip}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-forge-surface border border-forge-border text-forge-subtext"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                )}

                {showAdvanced && (
                <div className="px-5 sm:px-6 pb-6 pt-1 space-y-6 border-t border-forge-border animate-fade-in">

                  {/* Max clips */}
                  <div className="pt-5">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-semibold text-forge-text">Clips per video</label>
                      <span className="text-sm font-bold text-forge-accent bg-forge-accent/10 px-2.5 py-0.5 rounded-full border border-forge-accent/20">
                        {options.max_clips}
                      </span>
                    </div>
                    <p className="text-xs text-forge-dim mb-3">Only the strongest moments make the cut.</p>
                    <input
                      type="range" min={1} max={10} value={options.max_clips}
                      onChange={(e) => setOptions((o) => ({ ...o, max_clips: +e.target.value }))}
                      className="w-full h-1.5 cursor-pointer"
                    />
                  </div>

                  {/* Duration sliders */}
                  <div>
                    <label className="block text-sm font-semibold text-forge-text mb-1">Clip length</label>
                    <p className="text-xs text-forge-dim mb-3">Match the pacing each platform rewards.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      {DURATION_SLIDERS.map(({ key, label, min, max }) => (
                        <div key={key}>
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-medium text-forge-subtext">{label}</label>
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
                  </div>

                  {/* Clip mode toggle */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-semibold text-forge-text">What the AI hunts for</label>
                        <p className="text-xs text-forge-dim mt-0.5">
                          {clipMode === 'quick'
                            ? 'Pick the angles that fit your audience.'
                            : 'Describe it in your own words — or paste exact timestamps.'}
                        </p>
                      </div>
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
                        placeholder={`Describe what you're looking for, e.g.:\n• Clips that make John look credible and likeable\n• Most engaging scroll-stopping moments\n• Heated debate moments and strong pushbacks\n\nAlready know what to clip? Paste the timestamps directly, e.g. "12:05-13:40, 28:10-29:00" — those exact ranges are used as-is, no AI guessing.`}
                        rows={4}
                        className="w-full bg-forge-surface border border-forge-border rounded-xl px-3.5 py-3 text-sm text-forge-text placeholder:text-forge-dim resize-none focus:outline-none focus:border-forge-accent/60 focus:ring-1 focus:ring-forge-accent/20 transition-colors"
                      />
                    )}
                  </div>

                  {/* Skip timestamps */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-forge-text">
                        Never clip from <span className="text-forge-muted font-normal">(optional)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSkipModal(true)}
                        className="flex items-center gap-1 text-xs font-medium text-forge-accent hover:text-forge-accent/80 transition-colors cursor-pointer"
                      >
                        <Plus size={12} />
                        {skipRanges.length > 0 ? 'Edit ranges' : 'Add skip range'}
                      </button>
                    </div>

                    {skipRanges.length === 0 ? (
                      <p className="text-xs text-forge-dim">
                        Ranges the AI should never clip from — sponsor reads, intros, dead air.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {skipRanges.map((r) => (
                          <span
                            key={r.id}
                            className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-forge-surface border border-forge-border text-forge-muted"
                          >
                            <Ban size={10} className="text-forge-accent" />
                            {formatStamp(r.startMin, r.startSec)}–{formatStamp(r.endMin, r.endSec)}
                            <button
                              type="button"
                              onClick={() => setSkipRanges((rs) => rs.filter((x) => x.id !== r.id))}
                              className="hover:text-red-400 transition-colors"
                              aria-label="Remove range"
                            >
                              <X size={11} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Aspect ratio */}
                  <div>
                    <label className="block text-sm font-semibold text-forge-text mb-1">Output format</label>
                    <p className="text-xs text-forge-dim mb-3">Reframed and rendered for the platform you post on.</p>
                    <div className="flex gap-2">
                      {ASPECT_RATIOS.map(({ id, hint }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setOptions((o) => ({ ...o, target_aspect_ratio: id }))}
                          className={`flex-1 py-2.5 px-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                            options.target_aspect_ratio === id
                              ? 'bg-forge-accent/15 border-forge-accent/50 text-forge-accent'
                              : 'border-forge-border text-forge-muted hover:border-forge-border-bright hover:text-forge-text'
                          }`}
                        >
                          <span className="block text-sm font-semibold">{id}</span>
                          <span className="block text-[10px] leading-4 opacity-70 truncate">{hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                )}
              </div>

              {error && (
                <div className="mt-3 px-4 py-3 rounded-xl bg-forge-gold/10 border border-forge-gold/25 text-forge-gold text-sm">
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

      {showSkipModal && (
        <SkipTimestampsModal
          initialRanges={skipRanges}
          onConfirm={(ranges) => {
            setSkipRanges(ranges)
            setShowSkipModal(false)
          }}
          onClose={() => setShowSkipModal(false)}
        />
      )}
    </div>
  )
}
