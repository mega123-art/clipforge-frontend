import { useState } from 'react'
import { X, Plus, Wand2, SlidersHorizontal } from 'lucide-react'
import type { MoreClipsOptions } from '../types/api'

interface ClipTypeOption {
  id: string
  label: string
}

const CLIP_TYPES: ClipTypeOption[] = [
  { id: 'controversy', label: 'Controversy' },
  { id: 'hook_intro', label: 'Hook Intro' },
  { id: 'quotable', label: 'Quotable' },
  { id: 'myth_bust', label: 'Myth Bust' },
  { id: 'shocking_stat', label: 'Shocking Stat' },
  { id: 'emotional_peak', label: 'Emotional Peak' },
  { id: 'debate_moment', label: 'Debate Moment' },
  { id: 'story_arc', label: 'Story Arc' },
]

type Mode = 'quick' | 'custom'

interface MoreClipsModalProps {
  onConfirm: (options: MoreClipsOptions) => void
  onClose: () => void
  loading?: boolean
}

export default function MoreClipsModal({ onConfirm, onClose, loading }: MoreClipsModalProps) {
  const [mode, setMode] = useState<Mode>('quick')
  const [customPrompt, setCustomPrompt] = useState('')
  const [options, setOptions] = useState<MoreClipsOptions>({
    max_clips: 5,
    clip_types: ['controversy', 'hook_intro', 'quotable', 'shocking_stat', 'myth_bust'],
    min_clip_duration: 20,
    max_clip_duration: 90,
    target_aspect_ratio: '9:16',
  })

  const toggleClipType = (id: string) => {
    setOptions((o) => ({
      ...o,
      clip_types: o.clip_types.includes(id)
        ? o.clip_types.filter((t) => t !== id)
        : [...o.clip_types, id],
    }))
  }

  const handleConfirm = () => {
    if (mode === 'custom') {
      onConfirm({ ...options, clip_types: [], custom_prompt: customPrompt.trim() })
    } else {
      onConfirm({ ...options, custom_prompt: undefined })
    }
  }

  const canSubmit = !loading && (
    mode === 'custom'
      ? customPrompt.trim().length > 0
      : options.clip_types.length > 0
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-forge-card border border-forge-border rounded-2xl w-full max-w-lg p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-forge-text">Find more clips</h2>
          <button onClick={onClose} className="text-forge-muted hover:text-forge-text transition-colors">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-forge-muted">
          Already-generated clips are excluded — only new non-overlapping moments will be found.
        </p>

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-forge-surface rounded-xl border border-forge-border">
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'quick'
                ? 'bg-forge-card border border-forge-border-bright text-forge-text shadow-sm'
                : 'text-forge-muted hover:text-forge-text'
            }`}
          >
            <SlidersHorizontal size={13} />
            Quick
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'custom'
                ? 'bg-forge-card border border-forge-border-bright text-forge-text shadow-sm'
                : 'text-forge-muted hover:text-forge-text'
            }`}
          >
            <Wand2 size={13} />
            Custom prompt
          </button>
        </div>

        {/* Quick mode: clip type chips */}
        {mode === 'quick' && (
          <div>
            <label className="block text-sm text-forge-muted mb-2">Clip types to find</label>
            <div className="flex flex-wrap gap-2">
              {CLIP_TYPES.map((ct) => (
                <button
                  key={ct.id}
                  type="button"
                  onClick={() => toggleClipType(ct.id)}
                  className={`px-3 py-1 rounded-full text-sm border transition-all ${
                    options.clip_types.includes(ct.id)
                      ? 'bg-forge-accent border-forge-accent text-white'
                      : 'border-forge-border text-forge-muted hover:border-forge-border-bright'
                  }`}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom mode: prompt textarea */}
        {mode === 'custom' && (
          <div>
            <label className="block text-sm text-forge-muted mb-2">
              Describe what you're looking for
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={`Examples:\n• Clips that make John Doe look credible and likeable — positive PR\n• Most engaging, scroll-stopping moments for max virality\n• Heated debate moments and strong pushbacks\n• Quotable insights worth sharing`}
              rows={5}
              className="w-full bg-forge-surface border border-forge-border rounded-xl px-3.5 py-3 text-sm text-forge-text placeholder:text-forge-dim resize-none focus:outline-none focus:border-forge-accent/60 focus:ring-1 focus:ring-forge-accent/20 transition-colors"
            />
          </div>
        )}

        {/* Max clips */}
        <div>
          <label className="block text-sm text-forge-muted mb-2">
            Max new clips: <span className="text-forge-text font-medium">{options.max_clips}</span>
          </label>
          <input
            type="range" min={1} max={10} value={options.max_clips}
            onChange={(e) => setOptions((o) => ({ ...o, max_clips: +e.target.value }))}
            className="w-full accent-[#06b6d4]"
          />
        </div>

        {/* Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-forge-muted mb-2">
              Min duration: <span className="text-forge-text">{options.min_clip_duration}s</span>
            </label>
            <input
              type="range" min={10} max={60} value={options.min_clip_duration}
              onChange={(e) => setOptions((o) => ({ ...o, min_clip_duration: +e.target.value }))}
              className="w-full accent-[#06b6d4]"
            />
          </div>
          <div>
            <label className="block text-sm text-forge-muted mb-2">
              Max duration: <span className="text-forge-text">{options.max_clip_duration}s</span>
            </label>
            <input
              type="range" min={30} max={180} value={options.max_clip_duration}
              onChange={(e) => setOptions((o) => ({ ...o, max_clip_duration: +e.target.value }))}
              className="w-full accent-[#06b6d4]"
            />
          </div>
        </div>

        {/* Aspect ratio */}
        <div>
          <label className="block text-sm text-forge-muted mb-2">Aspect ratio</label>
          <div className="flex gap-2">
            {['9:16', '1:1', '16:9'].map((ar) => (
              <button
                key={ar}
                type="button"
                onClick={() => setOptions((o) => ({ ...o, target_aspect_ratio: ar }))}
                className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                  options.target_aspect_ratio === ar
                    ? 'bg-forge-accent border-forge-accent text-white'
                    : 'border-forge-border text-forge-muted hover:border-forge-border-bright'
                }`}
              >
                {ar}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-forge-border rounded-xl text-sm text-forge-muted hover:text-forge-text hover:border-forge-border-bright transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-forge-accent hover:bg-forge-accent/85 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-colors"
          >
            {mode === 'custom' ? <Wand2 size={16} /> : <Plus size={16} />}
            {loading ? 'Finding...' : 'Find clips'}
          </button>
        </div>
      </div>
    </div>
  )
}
