import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api'
import { Scissors, Sparkles, CheckCircle2, Wand2, Zap } from 'lucide-react'
import ProgressStepper from '../components/ProgressStepper'
import MetaballLoader from '../components/MetaballLoader'
import useStore from '../store'

const STAGES = ['downloading', 'transcribing', 'diarizing', 'analyzing', 'clipping']

const STAGE_LABELS = {
  pending:      'Queued',
  downloading:  'Downloading',
  transcribing: 'Transcribing',
  diarizing:    'Diarizing',
  analyzing:    'AI Analysis',
  clipping:     'Clipping',
  ready:        'Done!',
  failed:       'Failed',
}

const STAGE_QUIPS = {
  pending: [
    'Warming up the forge...',
    'Getting in queue. Standby.',
    'Systems online. Waiting for the signal.',
  ],
  downloading: [
    'Negotiating with the internet...',
    'Pulling your video at full bandwidth...',
    'Bytes incoming. Please stand by.',
    'YouTube is cooperating (for now)...',
    'Fetching the footage from the source...',
  ],
  transcribing: [
    'Whisper large-v3 is listening intently...',
    'Every single word. Captured.',
    'Running at full GPU throttle...',
    'Speech → text. The magic is real.',
    'Transcription in progress. No skipping.',
    'large-v3 going brrr...',
  ],
  diarizing: [
    'Who said what? On it.',
    'Untangling the voices in the room...',
    'Speaker A. Speaker B. Both labeled.',
    'Diarization: fancier than it sounds.',
    'Voice fingerprints being matched...',
  ],
  analyzing: [
    'Claude just read your whole transcript.',
    'Hunting for moments that stop the scroll...',
    'Finding the hooks, the bangers, the peaks...',
    'AI verdict: this clip is gonna go crazy.',
    'Scanning for maximum viral potential...',
    'Claude: "hold on, this part is fire"...',
    'Emotional peaks identified. Flagging.',
  ],
  clipping: [
    'Slicing with surgical precision...',
    'Captions locked and loading...',
    'Each clip handcrafted by algorithms.',
    'Almost done. Burning captions in...',
    'One final pass. This is gonna hit.',
    'Adding the finishing touches...',
  ],
}

const STAGE_EMOJI = {
  downloading:  '📥',
  transcribing: '🎙️',
  diarizing:    '👥',
  analyzing:    '🧠',
  clipping:     '✂️',
  ready:        '✅',
  pending:      '⏳',
}

const MORE_CLIPS_MESSAGES = [
  "Claude is hunting for moments you haven't seen yet...",
  'Scanning transcript for non-overlapping viral clips...',
  'Finding the hidden gems in the footage...',
  'Digging deeper into the transcript...',
  'Looking for new hooks, stats, and emotional peaks...',
  'Almost there — burning captions into new clips...',
]

export default function Processing() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isMoreClips = location.state?.moreClips === true
  const { setCurrentJob, addRecentJob } = useStore()

  const [quipIdx, setQuipIdx] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [quipVisible, setQuipVisible] = useState(true)
  const startRef = useRef(Date.now())
  const prevStatus = useRef(null)

  const { data: job, error } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api.get(`/api/jobs/${jobId}`).then((r) => r.data),
    refetchInterval: (data) => {
      if (!data) return 3000
      return data.status === 'ready' || data.status === 'failed' ? false : 3000
    },
  })

  useEffect(() => {
    if (job) {
      setCurrentJob(job)
      if (job.status === 'ready') {
        addRecentJob(job)
        navigate(`/review/${jobId}`)
      }
    }
  }, [job, jobId, navigate, setCurrentJob, addRecentJob])

  // Reset quip index when stage changes
  useEffect(() => {
    const status = job?.status || 'pending'
    if (status !== prevStatus.current) {
      prevStatus.current = status
      setQuipIdx(0)
    }
  }, [job?.status])

  // Rotate quips with fade
  useEffect(() => {
    const status = job?.status || (isMoreClips ? 'analyzing' : 'pending')
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

  // Elapsed timer
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

  const formatElapsed = (s) => {
    if (s < 60) return `${s}s`
    return `${Math.floor(s / 60)}m ${s % 60}s`
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">Failed to load job status.</p>
          <button onClick={() => navigate('/')} className="mt-4 text-violet-400 hover:underline cursor-pointer">
            Go back
          </button>
        </div>
      </div>
    )
  }

  const status = job?.status || 'pending'
  const progress = job?.stage_progress || 0
  const quips = isMoreClips ? MORE_CLIPS_MESSAGES : (STAGE_QUIPS[status] || [])
  const currentQuip = quips[quipIdx % Math.max(1, quips.length)] || ''
  const isRunning = status !== 'failed' && status !== 'ready'

  if (isMoreClips) {
    return (
      <div className="processing-bg min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden page-enter">
        <div className="bg-orb bg-orb-1" aria-hidden="true" />
        <div className="bg-orb bg-orb-2" aria-hidden="true" />
        <div className="bg-orb bg-orb-3" aria-hidden="true" />
        <div className="scanlines-overlay" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-md text-center">
          <div className="flex items-center justify-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shadow-glow-violet-sm">
              <Scissors className="text-violet-400" size={18} />
            </div>
            <span className="font-bold text-lg gradient-text">ClipForge</span>
          </div>

          <div className="flex items-center justify-center mb-8">
            <MetaballLoader icon={Wand2} />
          </div>

          <h2 className="text-2xl font-black mb-1 gradient-text">Finding new clips</h2>
          {job?.video_title && (
            <p className="text-sm text-forge-muted mb-6 truncate">{job.video_title}</p>
          )}

          <p
            className="text-sm font-mono text-violet-300/80 mb-8 min-h-5 transition-opacity duration-300"
            style={{ opacity: quipVisible ? 1 : 0 }}
          >
            {currentQuip}
          </p>

          {status !== 'failed' && (
            <div className="glass-card rounded-2xl p-4 border border-forge-border mb-4">
              <div className="flex justify-between text-xs text-forge-muted mb-2.5">
                <span className="font-semibold">{STAGE_LABELS[status] || status}</span>
                <span className="font-black text-violet-400 tabular-nums">{progress}%</span>
              </div>
              <div className="h-2.5 bg-forge-surface rounded-full overflow-hidden">
                <div
                  className="h-full rainbow-shimmer-bar rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl text-left mb-4">
              <p className="text-red-400 font-semibold mb-1">Failed</p>
              <p className="text-sm text-red-300/70">{job?.error_message || 'Unknown error'}</p>
              <button onClick={() => navigate(`/review/${jobId}`)} className="mt-3 text-sm text-violet-400 hover:text-violet-300 transition-colors cursor-pointer">
                Back to clips
              </button>
            </div>
          )}

          <button
            onClick={() => navigate(`/review/${jobId}`)}
            className="mt-2 px-4 py-2 text-sm text-forge-dim hover:text-forge-muted transition-colors cursor-pointer"
          >
            Back to review
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="processing-bg min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden page-enter">
      {/* Animated background orbs */}
      <div className="bg-orb bg-orb-1" aria-hidden="true" />
      <div className="bg-orb bg-orb-2" aria-hidden="true" />
      <div className="bg-orb bg-orb-3" aria-hidden="true" />
      <div className="scanlines-overlay" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Header: logo + live timer */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shadow-glow-violet-sm">
              <Scissors size={16} className="text-violet-400" />
            </div>
            <span className="font-bold text-lg gradient-text">ClipForge</span>
          </div>
          {isRunning && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-forge-dim">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              LIVE · {formatElapsed(elapsedSeconds)}
            </div>
          )}
        </div>

        {/* Central animated section */}
        {isRunning && (
          <div className="flex flex-col items-center mb-8">
            <MetaballLoader icon={Sparkles} />

            {/* Stage pill */}
            <div className="mt-6 flex items-center gap-2 px-5 py-2 rounded-full bg-violet-500/10 border border-violet-500/25 backdrop-blur-sm">
              <span className="text-base" role="img" aria-label={STAGE_LABELS[status]}>{STAGE_EMOJI[status] || '⚡'}</span>
              <span className="text-sm font-black text-violet-300 tracking-widest uppercase">{STAGE_LABELS[status]}</span>
            </div>

            {/* Rotating quip */}
            <p
              className="mt-4 text-center text-sm font-mono text-forge-muted max-w-xs leading-relaxed transition-opacity duration-300"
              style={{ opacity: quipVisible ? 1 : 0 }}
            >
              {currentQuip}
            </p>
          </div>
        )}

        {/* Video title */}
        {job?.video_title && (
          <h2 className="text-xl font-black mb-1 truncate text-forge-text">{job.video_title}</h2>
        )}
        <p className="text-forge-dim mb-8 text-[11px] font-mono tracking-wider opacity-50">{jobId}</p>

        {/* Progress stepper */}
        <ProgressStepper currentStage={status} stages={STAGES} stageLabels={STAGE_LABELS} />

        {/* Progress bar */}
        {isRunning && (
          <div className="mt-6 glass-card rounded-2xl p-5 border border-forge-border">
            <div className="flex justify-between text-xs mb-3">
              <span className="font-semibold text-forge-subtext">{STAGE_LABELS[status] || status}</span>
              <span className="font-black text-violet-400 tabular-nums">{progress}%</span>
            </div>
            <div className="h-2.5 bg-forge-surface rounded-full overflow-hidden">
              <div
                className="h-full rainbow-shimmer-bar rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 text-xs font-mono text-forge-dim opacity-70">
              {isRunning ? `Processing · ${formatElapsed(elapsedSeconds)} elapsed` : ''}
            </p>
          </div>
        )}

        {/* Failed */}
        {status === 'failed' && (
          <div className="mt-6 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl">
            <p className="text-red-400 font-bold text-sm mb-1">Job failed</p>
            <p className="text-xs text-red-300/70">{job?.error_message || 'Unknown error'}</p>
            <button onClick={() => navigate('/')} className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors cursor-pointer">
              Try again →
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

        {/* Meta */}
        {job?.detected_language && (
          <div className="mt-5 flex gap-5 text-xs text-forge-muted font-mono">
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

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={requestNotification}
            className="px-4 py-2 text-xs font-semibold border border-forge-border rounded-xl text-forge-muted hover:text-forge-text hover:border-forge-border-bright transition-all cursor-pointer"
          >
            <Zap size={11} className="inline mr-1 mb-0.5" />
            Notify when done
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-xs text-forge-dim hover:text-forge-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
