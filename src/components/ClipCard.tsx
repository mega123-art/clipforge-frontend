import { useState, useEffect, MouseEvent } from 'react'
import ReactPlayer from 'react-player'
import api from '../api'
import {
  Check, Scissors, Download, ChevronDown, ChevronUp,
  Flame, Zap, MessageSquare, XCircle, TrendingUp, Heart, MessageCircle, BookOpen, AlertTriangle,
  LucideIcon,
} from 'lucide-react'
import TrimHandle from './TrimHandle'
import type { ClipOut } from '../types/api'

interface ExpiryInfo {
  credit_type: string
  days_left?: number
  is_expired: boolean
  expiry_date?: string
}

const CLIP_TYPE_ICON: Record<string, LucideIcon> = {
  controversy:    Flame,
  hook_intro:     Zap,
  quotable:       MessageSquare,
  myth_bust:      XCircle,
  shocking_stat:  TrendingUp,
  emotional_peak: Heart,
  debate_moment:  MessageCircle,
  story_arc:      BookOpen,
}

const CLIP_TYPE_COLOR: Record<string, string> = {
  controversy:    'text-red-500    bg-red-500/10    border-red-500/22',
  hook_intro:     'text-orange-500 bg-orange-500/10 border-orange-500/22',
  quotable:       'text-amber-500  bg-amber-500/10  border-amber-500/22',
  myth_bust:      'text-green-500  bg-green-500/10  border-green-500/22',
  shocking_stat:  'text-cyan-500   bg-cyan-500/10   border-cyan-500/22',
  emotional_peak: 'text-pink-500   bg-pink-500/10   border-pink-500/22',
  debate_moment:  'text-forge-accent bg-forge-accent/10 border-forge-accent/20',
  story_arc:      'text-blue-500   bg-blue-500/10   border-blue-500/22',
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

interface ScoreBarProps {
  score: number
}

function ScoreBar({ score }: ScoreBarProps) {
  const pct = Math.round(score * 100)
  const gradient = score >= 0.8
    ? 'from-emerald-500 to-green-400'
    : score >= 0.6
    ? 'from-amber-500 to-yellow-400'
    : 'from-red-500 to-orange-400'
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 bg-forge-border rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-forge-muted w-8 text-right font-semibold tabular-nums">{pct}%</span>
    </div>
  )
}

interface ClipCardProps {
  clip: ClipOut
  isSelected: boolean
  onSelect: () => void
  onExport: () => void
  onUpdate: () => void
}

export default function ClipCard({ clip, isSelected, onSelect, onExport, onUpdate }: ClipCardProps) {
  const [trimMode, setTrimMode] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [trimStart, setTrimStart] = useState<number>(clip.user_start_seconds ?? clip.start_seconds)
  const [trimEnd, setTrimEnd] = useState<number>(clip.user_end_seconds ?? clip.end_seconds)
  const [saving, setSaving] = useState(false)
  const [expiryInfo, setExpiryInfo] = useState<ExpiryInfo | null>(null)

  const typeClass = CLIP_TYPE_COLOR[clip.clip_type] || 'text-violet-500 bg-forge-accent/10 border-forge-accent/20'
  const TypeIcon: LucideIcon = CLIP_TYPE_ICON[clip.clip_type] || Zap

  const API_BASE = import.meta.env.VITE_APP_API_URL || 'http://localhost:8000'

  // Fetch expiry info for free clips
  useEffect(() => {
    let cancelled = false
    api.get<ExpiryInfo>(`/api/clips/${clip.id}/expiry-info`)
      .then(({ data }) => {
        if (!cancelled) setExpiryInfo(data)
      })
      .catch(() => {
        if (!cancelled) setExpiryInfo(null)
      })
    return () => { cancelled = true }
  }, [clip.id, clip.credit_type])

  // Fetch a time-limited, HMAC-signed stream URL from the authenticated
  // /stream-url endpoint. <video> tags can't send Authorization headers,
  // so the token is embedded as a query-param instead.
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!clip.final_clip_path) return
    let cancelled = false
    api.get<{ stream_url: string }>(`/api/clips/${clip.id}/stream-url`)
      .then(({ data }) => {
        if (!cancelled) setVideoUrl(`${API_BASE}${data.stream_url}`)
      })
      .catch(() => {
        // Fallback: unsigned URL (will 401 if backend requires token)
        if (!cancelled) setVideoUrl(null)
      })
    return () => { cancelled = true }
  }, [clip.id, clip.final_clip_path, API_BASE])

  const handleApprove = async () => {
    await api.patch(`/api/clips/${clip.id}`, { user_approved: !clip.user_approved })
    onUpdate()
  }

  const handleSaveTrim = async () => {
    setSaving(true)
    try {
      await api.patch(`/api/clips/${clip.id}`, {
        user_start_seconds: trimStart,
        user_end_seconds: trimEnd,
      })
      onUpdate()
      setTrimMode(false)
    } finally {
      setSaving(false)
    }
  }

  const stop = (e: MouseEvent) => e.stopPropagation()

  return (
    <div
      onClick={onSelect}
      className={`glass-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-250 ${
        isSelected
          ? 'clip-glow-selected'
          : 'border border-forge-border hover:border-forge-accent/30 hover:-translate-y-0.5 hover:shadow-card-hover'
      }`}
    >
      {/* Video player */}
      <div className="aspect-video bg-black relative">
        {videoUrl ? (
          <ReactPlayer
            url={videoUrl}
            width="100%"
            height="100%"
            controls
            playsinline
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-forge-dim">
            <div className="w-10 h-10 rounded-xl bg-forge-border/50 flex items-center justify-center">
              <Scissors size={18} className="text-forge-muted" />
            </div>
            <span className="text-xs">{clip.status === 'rendering' ? 'Rendering...' : 'No preview'}</span>
          </div>
        )}

        {/* Rank badge */}
        <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-white/10">
          #{clip.rank}
        </div>

        {/* Approved badge */}
        {clip.user_approved && (
          <div className="absolute top-2.5 right-2.5 bg-green-500/20 backdrop-blur-sm text-green-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-green-500/35 flex items-center gap-1">
            <Check size={10} />
            Approved
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
        {/* Expiry warning */}
        {expiryInfo && expiryInfo.credit_type === 'free' && expiryInfo.days_left !== undefined && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
            expiryInfo.days_left <= 1
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <AlertTriangle size={14} />
            <span className="text-xs font-semibold">
              {expiryInfo.is_expired
                ? 'Clip has expired'
                : `Expires in ${expiryInfo.days_left} day${expiryInfo.days_left !== 1 ? 's' : ''}`}
            </span>
          </div>
        )}

        {/* Type + timestamp */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          <span className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${typeClass}`}>
            <TypeIcon size={9} className="sm:block hidden" />
            <TypeIcon size={8} className="sm:hidden block" />
            <span className="hidden sm:inline">{clip.clip_type.replace('_', ' ')}</span>
            <span className="sm:hidden">{clip.clip_type.split('_')[0].substring(0, 3)}</span>
          </span>
          <span className="text-[10px] sm:text-xs text-forge-muted font-mono tabular-nums shrink-0">
            {formatTime(clip.start_seconds)} – {formatTime(clip.end_seconds)}
          </span>
        </div>

        <ScoreBar score={clip.score} />

        {/* Reason */}
        <p className="text-sm text-forge-subtext leading-relaxed">{clip.reason}</p>

        {/* Transcript toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowTranscript((s) => !s) }}
          className="flex items-center gap-1.5 text-xs text-forge-dim hover:text-forge-muted transition-colors cursor-pointer"
        >
          {showTranscript ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          Transcript excerpt
        </button>
        {showTranscript && (
          <p className="text-xs text-forge-muted italic leading-relaxed border-l-2 border-forge-border pl-3">
            {clip.transcript_excerpt}
          </p>
        )}

        {/* Trim controls */}
        {trimMode && (
          <TrimHandle
            start={trimStart}
            end={trimEnd}
            duration={clip.end_seconds - clip.start_seconds + 10}
            onStartChange={setTrimStart}
            onEndChange={setTrimEnd}
          />
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
          <button
            onClick={(e) => { stop(e); handleApprove() }}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all cursor-pointer ${
              clip.user_approved
                ? 'bg-green-500/15 border border-green-500/45 text-green-400'
                : 'border border-forge-border text-forge-muted hover:border-green-500/45 hover:text-green-400 hover:bg-green-500/8'
            }`}
            title={clip.user_approved ? 'Click to unapprove' : 'Click to approve'}
          >
            <Check size={9} className="sm:block hidden" />
            <Check size={8} className="sm:hidden block" />
            <span className="hidden sm:inline">{clip.user_approved ? 'Approved' : 'Approve'}</span>
            <span className="sm:hidden">{clip.user_approved ? '✓' : 'OK'}</span>
          </button>

          <button
            onClick={(e) => { stop(e); setTrimMode((t) => !t) }}
            className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold border border-forge-border text-forge-muted hover:border-forge-border-bright hover:text-forge-text transition-all cursor-pointer"
            title="Edit clip boundaries"
          >
            <Scissors size={9} className="sm:block hidden" />
            <Scissors size={8} className="sm:hidden block" />
            <span className="hidden sm:inline">Trim</span>
          </button>

          {trimMode && (
            <button
              onClick={(e) => { stop(e); handleSaveTrim() }}
              disabled={saving}
              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold bg-cyan-500/60 hover:bg-forge-accent text-white disabled:opacity-50 transition-all border border-forge-accent/50 cursor-pointer"
            >
              {saving ? '...' : 'Save'}
            </button>
          )}

          {expiryInfo && expiryInfo.credit_type === 'free' && (
            <a
              href={clip.download_url || '#'}
              download
              onClick={(e) => { stop(e) }}
              className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold border border-forge-border text-forge-muted hover:border-green-500/50 hover:text-green-400 hover:bg-green-500/8 transition-all cursor-pointer"
              title="Download this clip"
            >
              <Download size={9} className="sm:block hidden" />
              <Download size={8} className="sm:hidden block" />
              <span className="hidden sm:inline">Download</span>
            </a>
          )}

          <button
            onClick={(e) => { stop(e); onExport() }}
            className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold border border-forge-border text-forge-muted hover:border-forge-accent/50 hover:text-forge-accent hover:bg-forge-accent/8 transition-all cursor-pointer ml-auto sm:ml-auto"
            title="Export with effects"
          >
            <Download size={9} className="sm:block hidden" />
            <Download size={8} className="sm:hidden block" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>

        {/* Contact admin for expiry */}
        {expiryInfo && expiryInfo.credit_type === 'free' && expiryInfo.days_left !== undefined && expiryInfo.days_left <= 1 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-forge-border/30 border border-forge-border">
            <span className="text-xs text-forge-muted">
              Need to keep this clip? Contact{' '}
              <a href="mailto:admin" className="text-forge-accent hover:underline font-semibold">
                admin
              </a>
              {' '}for credit top-up.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
