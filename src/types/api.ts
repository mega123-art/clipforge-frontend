// Backend API type mirrors. Source of truth: clip_smart_ai_backend/schemas.py

export type ClipType =
  | 'controversy'
  | 'hook_intro'
  | 'quotable'
  | 'myth_bust'
  | 'shocking_stat'
  | 'emotional_peak'
  | 'debate_moment'
  | 'story_arc'

export type ClipStatus = 'pending' | 'rendering' | 'ready' | 'failed' | string

export type JobStatus =
  | 'pending'
  | 'downloading'
  | 'transcribing'
  | 'diarizing'
  | 'analyzing'
  | 'clipping'
  | 'ready'
  | 'failed'
  | string

export type SourceType = 'url' | 'upload' | string

export type AspectRatio = '9:16' | '1:1' | '16:9'

export interface ClipOut {
  id: string
  job_id: string
  rank: number
  start_seconds: number
  end_seconds: number
  duration_seconds: number
  clip_type: ClipType | string
  score: number
  reason: string
  transcript_excerpt: string
  hook_line?: string | null
  tags?: string | null
  status: ClipStatus
  raw_clip_path?: string | null
  final_clip_path?: string | null
  user_start_seconds?: number | null
  user_end_seconds?: number | null
  user_approved: boolean
  user_notes?: string | null
  error_message?: string | null
  created_at: string
}

export interface JobOut {
  job_id: string
  status: JobStatus
  stage_progress: number
  source_url?: string | null
  source_filename?: string | null
  source_type: SourceType
  detected_language?: string | null
  detected_topic?: string | null
  video_duration_seconds?: number | null
  video_title?: string | null
  error_message?: string | null
  clips: ClipOut[]
  created_at: string
  completed_at?: string | null
}

export interface JobCreate {
  source_url?: string
  max_clips: number
  clip_types: string[]
  min_clip_duration: number
  max_clip_duration: number
  target_aspect_ratio: AspectRatio | string
}

export interface ClipUpdate {
  user_start_seconds?: number
  user_end_seconds?: number
  user_approved?: boolean
  user_notes?: string
}

export interface ExportRequest {
  aspect_ratio: AspectRatio | string
  caption_style: string
  caption_language?: string
  include_captions: boolean
  output_format: string
  focus_mode: 'none' | 'speaker' | 'center' | string
}

export interface ExportResponse {
  download_url?: string
  [key: string]: unknown
}

// ── Auth ────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  name?: string | null
  avatar_url?: string | null
  credits?: number
  is_admin?: boolean
  auth_provider?: string
  created_at?: string
  last_login_at?: string | null
  job_count?: number
}

export interface AuthOut {
  access_token: string
  user: User
}

// Job creation response (lightweight)
export interface JobCreateResponse {
  job_id: string
  status?: JobStatus
}

// ── Admin ───────────────────────────────────────────────────────────
export interface AdminStats {
  total_users: number
  total_jobs: number
  total_credits_outstanding: number
  dev_mode?: boolean
}

export interface AdminLog {
  id: string
  action: string
  actor_email: string
  target_email?: string | null
  payload?: string | null
  created_at: string
}

export interface CreditTxn {
  id: string
  user_email: string
  amount: number
  balance_after: number
  kind: string
  note?: string | null
  created_at: string
}

export interface GrantCreditsResponse {
  granted: number
  user_email: string
  new_balance: number
}

export interface MoreClipsOptions {
  max_clips: number
  clip_types: string[]
  min_clip_duration: number
  max_clip_duration: number
  target_aspect_ratio: AspectRatio | string
  custom_prompt?: string
}

export interface DebugHealth {
  run_jobs_inline: boolean
  redis_dns_ok: boolean
  celery_worker_ping: boolean
}
