import { useEffect, useState, useRef, memo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, Query } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'
import {
  Scissors, CheckCircle2, Wand2, Zap,
  Download, Mic, Users, Brain, AlertCircle, Clock, LucideIcon,
} from 'lucide-react'
import ProgressStepper from '../components/ProgressStepper'
import VibeClipLogo from '../components/VibeClipLogo'
import useStore from '../store'
import type { JobOut, JobStatus, DebugHealth } from '../types/api'

const STAGES: string[] = ['downloading', 'transcribing', 'diarizing', 'analyzing', 'clipping']

const STAGE_LABELS: Record<string, string> = {
  pending:      'Queued',
  downloading:  'Downloading',
  transcribing: 'Transcribing',
  diarizing:    'Diarizing',
  analyzing:    'AI Analysis',
  clipping:     'Clipping',
  ready:        'Done',
  failed:       'Failed',
}

const STAGE_ICONS: Record<string, LucideIcon> = {
  pending:      Clock,
  downloading:  Download,
  transcribing: Mic,
  diarizing:    Users,
  analyzing:    Brain,
  clipping:     Scissors,
  ready:        CheckCircle2,
  failed:       AlertCircle,
}

const STAGE_QUIPS: Record<string, string[]> = {
  pending: [
    'Warming up the pipeline...',
    'Getting in queue. Standby.',
    'Systems online. Waiting for the signal.',
  ],
  downloading: [
    'Negotiating with the internet...',
    'Pulling your video at full bandwidth...',
    'Bytes incoming. Please stand by.',
    'Fetching the footage from the source...',
  ],
  transcribing: [
    'Whisper large-v3 is listening intently...',
    'Every single word. Captured.',
    'Running at full GPU throttle...',
    'Speech to text. The magic is real.',
    'Transcription in progress. No skipping.',
  ],
  diarizing: [
    'Who said what? On it.',
    'Untangling the voices in the room...',
    'Speaker A. Speaker B. Both labeled.',
    'Voice fingerprints being matched...',
  ],
  analyzing: [
    'Claude just read your whole transcript.',
    'Hunting for moments that stop the scroll...',
    'Finding the hooks, the bangers, the peaks...',
    'Scanning for maximum viral potential...',
    'Claude: "hold on, this part is fire"...',
    'Emotional peaks identified. Flagging.',
  ],
  clipping: [
    'Slicing with surgical precision...',
    'Captions locked and loading...',
    'Almost done. Burning captions in...',
    'One final pass. This is going to hit.',
    'Adding the finishing touches...',
  ],
}

const MORE_CLIPS_MESSAGES: string[] = [
  "Claude is hunting for moments you haven't seen yet...",
  'Scanning for non-overlapping viral clips...',
  'Finding the hidden gems in the footage...',
  'Digging deeper into the transcript...',
  'Almost there — burning captions into new clips...',
]

interface LocationState { moreClips?: boolean }

// ── Stage visual — orbital rings loader ───────────────────────

const StageVisual = memo(({ icon: Icon, status, active }: {
  icon: LucideIcon
  status: string
  active: boolean
}) => {
  const isDone = status === 'ready'
  const isFailed = status === 'failed'

  return (
    <div className="relative w-52 h-52 flex items-center justify-center select-none">
      {/* Ambient bloom */}
      <div
        className="absolute inset-0 rounded-full blur-3xl scale-110 pointer-events-none transition-all duration-1000"
        style={{
          background: isDone
            ? 'rgba(52, 211, 153, 0.08)'
            : isFailed
              ? 'rgba(249, 115, 122, 0.08)'
              : 'rgba(6, 182, 212, 0.07)',
        }}
      />

      {/* Outer dashed ring — slow clockwise */}
      {active && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: '1px dashed rgba(6, 182, 212, 0.22)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          {/* Orbiting dot on outer ring */}
          <motion.div
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
            style={{ background: '#06b6d4', boxShadow: '0 0 10px rgba(6,182,212,0.8)' }}
          />
        </motion.div>
      )}

      {/* Middle ring — counter-clockwise */}
      {active && (
        <motion.div
          className="absolute inset-6 rounded-full"
          style={{ border: '1px solid rgba(6, 182, 212, 0.15)' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 11, repeat: Infinity, ease: 'linear' }}
        >
          {/* Second orbiting dot */}
          <motion.div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
            style={{ background: '#14b8a6', boxShadow: '0 0 8px rgba(20,184,166,0.7)' }}
          />
        </motion.div>
      )}

      {/* Static ring when not active */}
      {!active && (
        <div
          className="absolute inset-0 rounded-full"
          style={{ border: '1px dashed rgba(6, 182, 212, 0.12)' }}
        />
      )}

      {/* Inner glow ring */}
      <motion.div
        className="absolute inset-12 rounded-full"
        style={{ border: '1px solid rgba(6, 182, 212, 0.35)' }}
        animate={active ? {
          boxShadow: [
            '0 0 16px rgba(6,182,212,0.10), inset 0 0 16px rgba(6,182,212,0.05)',
            '0 0 32px rgba(6,182,212,0.22), inset 0 0 24px rgba(6,182,212,0.10)',
            '0 0 16px rgba(6,182,212,0.10), inset 0 0 16px rgba(6,182,212,0.05)',
          ],
        } : {}}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Center circle */}
      <div
        className="relative w-[76px] h-[76px] rounded-full flex items-center justify-center"
        style={{
          background: 'rgb(var(--c-card))',
          border: '1px solid rgb(var(--c-border))',
          boxShadow: isDone
            ? '0 0 24px rgba(52,211,153,0.18)'
            : isFailed
              ? '0 0 24px rgba(249,115,122,0.15)'
              : '0 0 24px rgba(6,182,212,0.10)',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ scale: 0, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <Icon
              size={30}
              className={
                isDone ? 'text-emerald-400'
                : isFailed ? 'text-red-400'
                : 'text-forge-accent'
              }
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
})

// ── Main component ─────────────────────────────────────────────

export default function Processing() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const isMoreClips = (location.state as LocationState | null)?.moreClips === true
  const { setCurrentJob, addRecentJob, refreshUser } = useStore()

  const [quipIdx, setQuipIdx] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [quipVisible, setQuipVisible] = useState(true)
  const startRef = useRef<number>(Date.now())
  const prevStatus = useRef<string | null>(null)

  const { data: job, error } = useQuery<JobOut>({
    queryKey: ['job', jobId],
    queryFn: () => api.get<JobOut>(`/api/jobs/${jobId}`).then((r) => r.data),
    refetchInterval: (query: Query<JobOut>) => {
      const data = query.state.data
      const failureCount = (query.state as { failureCount?: number }).failureCount || 0
      if (data?.status === 'ready' || data?.status === 'failed') return false
      if (failureCount > 0) return Math.min(3000 * 2 ** failureCount, 30000)
      return 3000
    },
  })

  const showDebug =
    import.meta.env.VITE_APP_ENV === 'development' &&
    (job?.status || 'pending') === 'pending' &&
    elapsedSeconds > 60

  const { data: debugHealth } = useQuery<DebugHealth>({
    queryKey: ['debug-health'],
    queryFn: () => api.get<DebugHealth>('/api/debug/health').then((r) => r.data),
    enabled: showDebug,
    refetchInterval: showDebug ? 10000 : false,
  })

  const rerunJob = async () => { await api.post(`/api/debug/jobs/${jobId}/rerun`) }

  useEffect(() => {
    if (job) {
      setCurrentJob(job)
      if (job.status === 'ready') {
        addRecentJob(job)
        refreshUser().catch(() => {})
        navigate(`/review/${jobId}`)
      } else if (job.status === 'failed') {
        refreshUser().catch(() => {})
      }
    }
  }, [job, jobId, navigate, setCurrentJob, addRecentJob, refreshUser])

  useEffect(() => {
    const status = job?.status || 'pending'
    if (status !== prevStatus.current) {
      prevStatus.current = status
      setQuipIdx(0)
    }
  }, [job?.status])

  useEffect(() => {
    const status: JobStatus = job?.status || (isMoreClips ? 'analyzing' : 'pending')
    const quips = isMoreClips ? MORE_CLIPS_MESSAGES : (STAGE_QUIPS[status] || [])
    if (quips.length < 2) return
    const iv = setInterval(() => {
      setQuipVisible(false)
      setTimeout(() => {
        setQuipIdx((i) => (i + 1) % quips.length)
        setQuipVisible(true)
      }, 300)
    }, 3000)
    return () => clearInterval(iv)
  }, [job?.status, isMoreClips])

  useEffect(() => {
    const iv = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  const requestNotification = () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  }

  const formatElapsed = (s: number): string => {
    if (s < 60) return `${s}s`
    return `${Math.floor(s / 60)}m ${s % 60}s`
  }

  if (error) {
    const ax = error as { response?: { status?: number; data?: { detail?: string } }; message?: string }
    const httpStatus = ax.response?.status
    const detail = ax.response?.data?.detail
    let msg = 'Failed to load job status.'
    if (httpStatus === 401) msg = 'Session expired. Please sign in again.'
    else if (httpStatus === 403) msg = "You don't have access to this job."
    else if (httpStatus === 404) msg = 'Job not found. It may have been deleted.'
    else if (httpStatus && httpStatus >= 500) msg = `Server error (${httpStatus}). Try again in a moment.`
    else if (detail) msg = detail
    else if (ax.message) msg = ax.message
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-red-400 text-lg">{msg}</p>
          {httpStatus ? <p className="text-forge-dim text-xs mt-1">HTTP {httpStatus}</p> : null}
          <button onClick={() => navigate('/')} className="mt-4 text-forge-accent hover:underline cursor-pointer">
            Go back
          </button>
        </div>
      </div>
    )
  }

  const status: JobStatus = job?.status || 'pending'
  const progress = job?.stage_progress || 0
  const quips = isMoreClips ? MORE_CLIPS_MESSAGES : (STAGE_QUIPS[status] || [])
  const currentQuip = quips[quipIdx % Math.max(1, quips.length)] || ''
  const isRunning = status !== 'failed' && status !== 'ready'
  const StageIcon = isMoreClips ? Wand2 : (STAGE_ICONS[status] || Zap)

  return (
    <div className="processing-bg min-h-[100dvh] flex flex-col relative overflow-hidden page-enter">
      <div className="bg-orb bg-orb-1" aria-hidden="true" />
      <div className="bg-orb bg-orb-2" aria-hidden="true" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-10 h-16 bg-forge-bg/80 backdrop-blur-xl border-b border-forge-border/50">
        <div className="flex items-center gap-2.5">
          <VibeClipLogo size={32} className="rounded-xl" />
          <span className="text-lg font-black tracking-tight text-forge-text">VibeClip</span>
        </div>
        {isRunning && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-forge-dim">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            LIVE · {formatElapsed(elapsedSeconds)}
          </div>
        )}
      </nav>

      {/* ── Main split layout ──────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1px_1fr] min-h-[100dvh] pt-16">

        {/* Left — visual + stage name + quip */}
        <section className="flex flex-col items-center justify-center px-8 py-12 lg:py-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <StageVisual icon={StageIcon} status={status} active={isRunning} />
          </motion.div>

          {/* Stage name */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-8 text-center"
          >
            <AnimatePresence mode="wait">
              <motion.h2
                key={status}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
                className="text-3xl font-black tracking-tight text-forge-text"
              >
                {isMoreClips ? 'Finding clips' : STAGE_LABELS[status]}
              </motion.h2>
            </AnimatePresence>

            {/* Quip */}
            <p
              className="mt-3 text-sm font-mono text-forge-muted max-w-[28ch] leading-relaxed transition-opacity duration-300 mx-auto"
              style={{ opacity: quipVisible ? 1 : 0 }}
            >
              {currentQuip}
            </p>
          </motion.div>
        </section>

        {/* Divider */}
        <div className="hidden lg:block bg-forge-border/40" />

        {/* Right — progress info */}
        <section className="flex flex-col justify-center px-8 lg:px-12 xl:px-16 py-12 lg:py-0">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm mx-auto lg:mx-0"
          >

            {/* Video title */}
            {job?.video_title && (
              <div className="mb-8">
                <p className="text-[11px] font-mono text-forge-dim uppercase tracking-widest mb-1.5">Processing</p>
                <h3 className="text-lg font-black text-forge-text leading-snug line-clamp-2">{job.video_title}</h3>
                <p className="text-[10px] font-mono text-forge-dim/50 mt-1">{jobId}</p>
              </div>
            )}

            {/* Stage stepper */}
            {!isMoreClips && (
              <div className="mb-6">
                <ProgressStepper currentStage={status} stages={STAGES} stageLabels={STAGE_LABELS} />
              </div>
            )}

            {/* Progress bar */}
            {isRunning && (
              <div className="glass-card rounded-2xl p-5 border border-forge-border">
                <div className="flex justify-between items-center text-xs mb-3">
                  <span className="font-semibold text-forge-subtext">
                    {isMoreClips ? 'Progress' : STAGE_LABELS[status]}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-forge-accent tabular-nums">{progress}%</span>
                    <span className="text-forge-dim font-mono">{formatElapsed(elapsedSeconds)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-forge-surface rounded-full overflow-hidden">
                  <div
                    className="h-full cyan-shimmer-bar rounded-full transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Meta info */}
            {job?.detected_language && (
              <div className="mt-4 flex gap-5 text-xs text-forge-muted font-mono">
                <span>lang: <span className="text-forge-text uppercase font-bold">{job.detected_language}</span></span>
                {job.video_duration_seconds && (
                  <span>
                    dur: <span className="text-forge-text font-bold">
                      {Math.floor(job.video_duration_seconds / 60)}m {Math.round(job.video_duration_seconds % 60)}s
                    </span>
                  </span>
                )}
              </div>
            )}

            {/* Failed */}
            {status === 'failed' && (
              <div className="mt-6 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl">
                <p className="text-red-400 font-bold text-sm mb-1">Job failed</p>
                <p className="text-xs text-red-300/70">{job?.error_message || 'Unknown error'}</p>
                <button onClick={() => navigate('/')} className="mt-3 text-xs text-forge-accent hover:underline cursor-pointer">
                  Try again
                </button>
              </div>
            )}

            {/* Ready */}
            {status === 'ready' && (
              <div className="mt-6 p-5 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center gap-3">
                <CheckCircle2 size={20} className="text-green-400 shrink-0" />
                <p className="text-green-400 font-semibold text-sm">Done! Redirecting to clips...</p>
              </div>
            )}

            {/* Debug */}
            {showDebug && (
              <div className="mt-6 p-5 bg-yellow-500/10 border border-yellow-500/25 rounded-2xl">
                <p className="text-yellow-300 font-bold text-sm mb-1">Still queued</p>
                <p className="text-xs text-yellow-100/70 mb-3">
                  Backend has not started this job. Worker or broker may not be running.
                </p>
                {debugHealth && (
                  <div className="text-[11px] font-mono text-yellow-100/60 space-y-1 mb-3">
                    <p>inline: {String(debugHealth.run_jobs_inline)}</p>
                    <p>redis: {String(debugHealth.redis_dns_ok)}</p>
                    <p>worker: {debugHealth.celery_worker_ping ? 'online' : 'offline'}</p>
                  </div>
                )}
                <button onClick={rerunJob} className="px-3 py-2 text-xs font-semibold border border-yellow-500/35 rounded-xl text-yellow-200 hover:text-yellow-100 transition-colors cursor-pointer">
                  Rerun in backend
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex gap-3">
              {isMoreClips ? (
                <button
                  onClick={() => navigate(`/review/${jobId}`)}
                  className="px-4 py-2 text-sm text-forge-dim hover:text-forge-muted transition-colors cursor-pointer"
                >
                  Back to review
                </button>
              ) : (
                <>
                  <button
                    onClick={requestNotification}
                    className="px-4 py-2 text-xs font-semibold border border-forge-border rounded-xl text-forge-muted hover:text-forge-text hover:border-forge-border-bright transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Zap size={11} />
                    Notify when done
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 text-xs text-forge-dim hover:text-forge-muted transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>

          </motion.div>
        </section>

      </div>
    </div>
  )
}
