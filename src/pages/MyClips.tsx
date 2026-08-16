import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Film, Loader2, ArrowRight, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import api from '../api'
import UserMenu from '../components/UserMenu'
import CreditsBadge from '../components/CreditsBadge'
import PlanButton from '../components/PlanButton'
import { useJobsList } from '../hooks/queries'
import { qk } from '../lib/queryKeys'
import type { JobListOut } from '../types/api'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDuration(sec?: number | null) {
  if (!sec) return ''
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function fmtRelative(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 7) return `${days}d ago`
  return fmtDate(iso)
}

const SUCCESS_STATUSES = new Set(['ready', 'done', 'completed', 'complete', 'succeeded'])
const FAILURE_STATUSES = new Set(['failed', 'error', 'cancelled', 'canceled'])

// Label is whatever the backend sends — only spacing/casing is normalised here.
function prettyStatus(status: string) {
  return status.replace(/[_-]+/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase())
}

function StatusBadge({ status }: { status: string }) {
  const key = (status || '').toLowerCase().trim()
  if (!key) return null

  const tone = SUCCESS_STATUSES.has(key)
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
    : FAILURE_STATUSES.has(key)
      ? 'border-red-500/30 bg-red-500/10 text-red-400'
      : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
  const inProgress = !SUCCESS_STATUSES.has(key) && !FAILURE_STATUSES.has(key)

  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 w-[124px] px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap ${tone}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full bg-current shrink-0 ${inProgress ? 'animate-pulse' : ''}`} />
      {prettyStatus(status)}
    </span>
  )
}

const PAGE_SIZE = 10

// Compact page list: 1 … 4 5 6 … 12  (null = ellipsis)
function pageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | null)[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) out.push(null)
  for (let p = start; p <= end; p++) out.push(p)
  if (end < total - 1) out.push(null)
  out.push(total)
  return out
}

export default function MyClips() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce typing so each keystroke doesn't become a cache entry + request.
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(searchQuery.trim()), 350)
    return () => window.clearTimeout(t)
  }, [searchQuery])

  // A new search starts from page 1.
  useEffect(() => { setPage(1) }, [debouncedQuery])

  const { data, isPending, isError, isPlaceholderData } = useJobsList({
    page,
    pageSize: PAGE_SIZE,
    q: debouncedQuery,
  })

  const jobs = data?.items ?? []
  const total = data?.total ?? 0
  const pages = data?.pages ?? 1

  // Warm the next page so paging forward is instant.
  const qc = useQueryClient()
  useEffect(() => {
    if (page >= pages) return
    const next = { page: page + 1, pageSize: PAGE_SIZE, q: debouncedQuery }
    qc.prefetchQuery({
      queryKey: qk.jobs.list(next),
      queryFn: () =>
        api
          .get<JobListOut>('/api/jobs', {
            params: {
              page: next.page,
              page_size: next.pageSize,
              ...(next.q ? { q: next.q } : {}),
            },
          })
          .then((r) => r.data),
      staleTime: 30_000,
    })
  }, [qc, page, pages, debouncedQuery])

  const hasSearch = debouncedQuery.length > 0
  const loading = isPending
  const error = isError ? 'Failed to load jobs' : null
  const showList = !error && jobs.length > 0
  const showSearch = !error && (hasSearch || total > 0 || jobs.length > 0)

  return (
    <div className="min-h-screen bg-forge-bg text-forge-text">
      {/* Navbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 border-b border-forge-border bg-forge-bg/80 backdrop-blur">
        <button
          onClick={() => navigate('/app')}
          className="flex items-center gap-1.5 text-sm text-forge-subtext hover:text-forge-text transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          New video
        </button>
        <div className="flex items-center gap-2">
          <CreditsBadge />
          <div className="hidden sm:block">
            <PlanButton />
          </div>
          <UserMenu />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
        <div className="flex items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Clips</h1>
            <p className="mt-1 text-sm text-forge-muted">
              {total > 0
                ? `${total} video${total === 1 ? '' : 's'}${hasSearch ? ' matching your search' : ''} · page ${page} of ${pages}`
                : 'Every video you have run through VibeClip.'}
            </p>
          </div>
        </div>

        {error && (
          <p className="text-center text-red-400 py-20">{error}</p>
        )}

        {showSearch && (
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forge-dim pointer-events-none" />
            <input
              type="text"
              placeholder="Search by video title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-forge-border/10 border border-forge-border focus:border-forge-accent focus:outline-none transition-colors text-sm text-forge-text placeholder:text-forge-dim"
            />
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-forge-accent" />
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
          hasSearch ? (
            <div className="text-center py-16 text-forge-dim text-sm">
              No videos match “{debouncedQuery}”.
            </div>
          ) : (
            <div className="text-center py-20 text-forge-dim">
              <Film size={40} className="mx-auto mb-3 opacity-30" />
              <p>No videos processed yet.</p>
              <button
                onClick={() => navigate('/app')}
                className="mt-4 text-sm text-forge-accent hover:text-forge-accent transition-colors cursor-pointer"
              >
                Upload your first video →
              </button>
            </div>
          )
        )}

        {!loading && showList && (
          <>
            <div className={`space-y-3 transition-opacity ${isPlaceholderData ? 'opacity-50' : 'opacity-100'}`}>
                  {jobs.map(job => {
                    const exportedCount = job.exported_count ?? 0
                    const totalClips = job.clip_count ?? 0
                    const statusKey = (job.status || '').toLowerCase().trim()
                    const isFailed = FAILURE_STATUSES.has(statusKey)
                    const inProgress = !SUCCESS_STATUSES.has(statusKey) && !isFailed
                    // Backend scores are 0–1; older rows may already be 0–100.
                    const rawScore = job.top_score ?? 0
                    const topScore = rawScore > 0 && rawScore <= 1 ? rawScore * 100 : rawScore
                    return (
                      <button
                        key={job.job_id}
                        onClick={() => navigate(`/review/${job.job_id}`)}
                        className="w-full flex items-center gap-4 px-4 py-3.5 glass-card rounded-xl border border-forge-border card-hover-glow text-left group cursor-pointer"
                      >
                        {job.thumbnail_url ? (
                          <div className="relative w-24 h-14 rounded-lg overflow-hidden border border-forge-border shrink-0 bg-forge-surface">
                            <img
                              src={job.thumbnail_url}
                              alt=""
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {job.video_duration_seconds ? (
                              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-semibold text-white tabular-nums">
                                {fmtDuration(job.video_duration_seconds)}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <div className="w-24 h-14 rounded-lg bg-forge-accent/10 border border-forge-accent/20 flex items-center justify-center shrink-0 group-hover:bg-forge-accent/22 transition-colors">
                            <Film size={18} className="text-forge-accent" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-forge-text truncate">
                            {job.video_title || job.source_filename || job.job_id}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span className="flex items-center gap-1 text-xs text-forge-dim">
                              <Clock size={10} />
                              {fmtRelative(job.created_at)}
                            </span>
                            {!job.thumbnail_url && job.video_duration_seconds ? (
                              <span className="text-xs text-forge-dim">{fmtDuration(job.video_duration_seconds)}</span>
                            ) : null}
                            {totalClips > 0 && (
                              <span className="text-xs text-forge-dim">{totalClips} clip{totalClips !== 1 ? 's' : ''}</span>
                            )}
                            {exportedCount > 0 && (
                              <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                                <Download size={10} />
                                {exportedCount} exported
                              </span>
                            )}
                            {topScore > 0 && (
                              <span className="text-xs font-medium text-forge-accent">
                                Top score {Math.round(topScore)}
                              </span>
                            )}
                            {job.detected_topic && (
                              <span className="px-2 py-0.5 rounded-full bg-forge-surface border border-forge-border text-[10px] font-medium text-forge-muted truncate max-w-[160px]">
                                {job.detected_topic}
                              </span>
                            )}
                            {job.detected_language && (
                              <span className="px-2 py-0.5 rounded-full bg-forge-surface border border-forge-border text-[10px] font-medium uppercase text-forge-muted">
                                {job.detected_language}
                              </span>
                            )}
                          </div>

                          {inProgress && (
                            <div className="mt-2 h-1 w-full max-w-[260px] rounded-full bg-forge-border/50 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-amber-400/80 transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(4, job.stage_progress || 0))}%` }}
                              />
                            </div>
                          )}

                          {isFailed && job.error_message && (
                            <p className="mt-1.5 text-xs text-red-400/80 truncate">{job.error_message}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <StatusBadge status={job.status} />
                          <ArrowRight size={14} className="text-forge-dim group-hover:text-forge-accent transition-colors" />
                        </div>
                      </button>
                    )
                  })}
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between gap-3 mt-6">
                <p className="text-xs text-forge-dim">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-forge-border text-xs font-semibold text-forge-subtext hover:text-forge-text hover:border-forge-border-bright disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={13} />
                    Prev
                  </button>

                  {pageNumbers(page, pages).map((p, i) =>
                    p === null ? (
                      <span key={`gap-${i}`} className="px-1 text-xs text-forge-dim">…</span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`min-w-[32px] px-2 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                          p === page
                            ? 'border-forge-accent/50 bg-forge-accent/10 text-forge-accent'
                            : 'border-forge-border text-forge-subtext hover:text-forge-text hover:border-forge-border-bright'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() => setPage(p => Math.min(pages, p + 1))}
                    disabled={page >= pages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-forge-border text-xs font-semibold text-forge-subtext hover:text-forge-text hover:border-forge-border-bright disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Next
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
