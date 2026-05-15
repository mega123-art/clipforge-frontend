import { useState } from 'react'
import ReactPlayer from 'react-player'
import api from '../api'
import {
  Check, Scissors, Download, ChevronDown, ChevronUp,
  Flame, Zap, MessageSquare, XCircle, TrendingUp, Heart, MessageCircle, BookOpen,
} from 'lucide-react'
import TrimHandle from './TrimHandle'

const CLIP_TYPE_ICON = {
  controversy:    Flame,
  hook_intro:     Zap,
  quotable:       MessageSquare,
  myth_bust:      XCircle,
  shocking_stat:  TrendingUp,
  emotional_peak: Heart,
  debate_moment:  MessageCircle,
  story_arc:      BookOpen,
}

const CLIP_TYPE_COLOR = {
  controversy:    'text-red-500    bg-red-500/10    border-red-500/22',
  hook_intro:     'text-orange-500 bg-orange-500/10 border-orange-500/22',
  quotable:       'text-amber-500  bg-amber-500/10  border-amber-500/22',
  myth_bust:      'text-green-500  bg-green-500/10  border-green-500/22',
  shocking_stat:  'text-cyan-500   bg-cyan-500/10   border-cyan-500/22',
  emotional_peak: 'text-pink-500   bg-pink-500/10   border-pink-500/22',
  debate_moment:  'text-purple-500 bg-purple-500/10 border-purple-500/22',
  story_arc:      'text-blue-500   bg-blue-500/10   border-blue-500/22',
}

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function ScoreBar({ score }) {
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

export default function ClipCard({ clip, isSelected, onSelect, onExport, onUpdate }) {
  const [trimMode, setTrimMode] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [trimStart, setTrimStart] = useState(clip.user_start_seconds ?? clip.start_seconds)
  const [trimEnd, setTrimEnd] = useState(clip.user_end_seconds ?? clip.end_seconds)
  const [saving, setSaving] = useState(false)

  const typeClass = CLIP_TYPE_COLOR[clip.clip_type] || 'text-violet-500 bg-violet-500/10 border-violet-500/22'
  const TypeIcon = CLIP_TYPE_ICON[clip.clip_type] || Zap

  const API_BASE = import.meta.env.VITE_APP_API_URL || 'http://localhost:8000'
  const videoUrl = clip.final_clip_path
    ? `${API_BASE}/api/clips/${clip.id}/stream`
    : null

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

  return (
    <div
      onClick={onSelect}
      className={`glass-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-250 ${
        isSelected
          ? 'clip-glow-selected'
          : 'border border-forge-border hover:border-violet-500/35 hover:-translate-y-0.5 hover:shadow-card-hover'
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

      <div className="p-4 space-y-3">
        {/* Type + timestamp */}
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${typeClass}`}>
            <TypeIcon size={10} />
            {clip.clip_type.replace('_', ' ')}
          </span>
          <span className="text-xs text-forge-muted font-mono tabular-nums">
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
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleApprove() }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              clip.user_approved
                ? 'bg-green-500/15 border border-green-500/45 text-green-400'
                : 'border border-forge-border text-forge-muted hover:border-green-500/45 hover:text-green-400 hover:bg-green-500/8'
            }`}
          >
            <Check size={11} />
            {clip.user_approved ? 'Approved' : 'Approve'}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); setTrimMode((t) => !t) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-forge-border text-forge-muted hover:border-forge-border-bright hover:text-forge-text transition-all cursor-pointer"
          >
            <Scissors size={11} />
            Trim
          </button>

          {trimMode && (
            <button
              onClick={(e) => { e.stopPropagation(); handleSaveTrim() }}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600/80 hover:bg-violet-600 text-white disabled:opacity-50 transition-all border border-violet-500/55 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); onExport() }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-forge-border text-forge-muted hover:border-violet-500/55 hover:text-violet-400 hover:bg-violet-500/8 transition-all ml-auto cursor-pointer"
          >
            <Download size={11} />
            Export
          </button>
        </div>
      </div>
    </div>
  )
}
